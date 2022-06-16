import { GreaseMonkeyCache } from './GreaseMonkeyCache';
import * as globals from '../GlobalVars';
import { getAllPostIds } from './sotools';

interface MetaSmokeApiItem {
    id: number;
    link: string;
}

interface MetaSmokeApiWrapper {
    items: MetaSmokeApiItem[];
}

interface MetasmokeData {
    [key: number]: number; // key is the sitePostId, the value is the metasmokeId. That's all we need!
}

export class MetaSmokeAPI {
    public static accessToken: string;
    private static readonly appKey = globals.metasmokeKey;
    private static metasmokeIds: MetasmokeData = {};
    public static isDisabled: boolean = GreaseMonkeyCache.getFromCache<boolean>(globals.MetaSmokeDisabledConfig) || false;
    public name: keyof globals.FlagTypeFeedbacks = 'Smokey';

    constructor(
        private readonly postId: number,
        private readonly postType: globals.PostType,
        private readonly smokeyIcon?: HTMLDivElement
    ) { }

    public static reset(): void {
        GreaseMonkeyCache.unset(globals.MetaSmokeDisabledConfig);
        GreaseMonkeyCache.unset(globals.MetaSmokeUserKeyConfig);
    }

    public static async setup(): Promise<void> {
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
    }

    private static getMetasmokeTokenPopup(): JQuery {
        const {
            metasmokeTokenInput,
            metasmokeTokenModal,
        } = globals.modalIds;

        const flexItemDiv = document.createElement('<div>');
        flexItemDiv.classList.add('flex--item');

        const authenticationLabel = globals.createLabel(
            'Metasmoke access token',
            metasmokeTokenInput,
            [ 'd-block' ],
            'Once you\'ve authenticated Advanced Flagging with metasmoke, you\'ll be given a code; enter it below:',
            [ 'mt2' ]
        );
        flexItemDiv.append(authenticationLabel);

        const metasmokePopupBody = document.createElement('div');
        metasmokePopupBody.classList.add('d-flex', 'gs4', 'gsy', 'fd-column');

        const inputContainer = document.createElement('div');
        inputContainer.classList.add('d-flex', 'ps-relative');

        const codeInput = document.createElement('input');
        codeInput.id = metasmokeTokenInput;
        codeInput.classList.add('s-input');
        codeInput.type = 'text';
        codeInput.placeholder = 'Enter the code here';

        inputContainer.append(codeInput);
        metasmokePopupBody.append(inputContainer);
        metasmokePopupBody.prepend(flexItemDiv);

        const metasmokeTokenPopup = globals.createModal(
            metasmokeTokenModal,
            'Authenticate MS with AF',
            'Submit',
            metasmokePopupBody
        );

        return metasmokeTokenPopup;
    }

    private static showMSTokenPopupAndGet(): Promise<string | undefined> {
        return new Promise<string>(resolve => {
            const metasmokeTokenPopup = this.getMetasmokeTokenPopup();
            StackExchange.helpers.showModal(metasmokeTokenPopup);

            metasmokeTokenPopup.find('.s-btn__primary').on('click', () => {
                const token = metasmokeTokenPopup.find(globals.idSelectors.metasmokeTokenInput).val();
                metasmokeTokenPopup.remove(); // dismiss modal
                if (!token) return;
                resolve(token.toString());
            });
        });
    }

    private static readonly codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined> = async (metaSmokeOAuthUrl?: string) => {
        if (MetaSmokeAPI.isDisabled) return;

        const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
        if (!userDisableMetasmoke) {
            GreaseMonkeyCache.storeInCache(globals.MetaSmokeDisabledConfig, true);
            return;
        }

        window.open(metaSmokeOAuthUrl, '_blank');
        await globals.Delay(100);
        return await this.showMSTokenPopupAndGet();
    };

    public static async queryMetaSmokeInternal(): Promise<void> {
        if (MetaSmokeAPI.isDisabled) return;

        const urlString = getAllPostIds(true, true).join(','); // postIds as URLs, including questions
        if (!urlString) return; // don't make the request if there aren't URLs

        const parameters = globals.getParamsFromObject({
            urls: urlString,
            key: `${MetaSmokeAPI.appKey}`,
            per_page: 1000,
            filter: globals.metasmokeApiFilter // only include id and link fields
        });

        try {
            const metasmokeApiCall = await fetch(`https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls?${parameters}`);
            const metasmokeResult = await metasmokeApiCall.json() as MetaSmokeApiWrapper;
            metasmokeResult.items.forEach(item => {
                const postId = Number(/\d+$/.exec(item.link)?.[0]);
                if (!postId) return;

                MetaSmokeAPI.metasmokeIds[postId] = item.id;
            });
        } catch (error) {
            globals.displayError('Failed to get Metasmoke URLs.');
            console.error(error);
        }
    }

    public static getQueryUrl(postId: number, postType: globals.PostType): string {
        return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
    }

    private static async getUserKey(): Promise<string> {
        while (typeof StackExchange.helpers.showConfirmModal === 'undefined') {
            // eslint-disable-next-line no-await-in-loop
            await globals.Delay(100);
        }

        return await GreaseMonkeyCache.getAndCache<string>(globals.MetaSmokeUserKeyConfig, async (): Promise<string> => {
            const keyUrl = `https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`;
            const code = await MetaSmokeAPI.codeGetter(keyUrl);
            if (!code) return '';

            const tokenCall = await fetch(`https://metasmoke.erwaysoftware.com/oauth/token?key=${MetaSmokeAPI.appKey}&code=${code}`);
            const data = await tokenCall.json() as { token: string };
            return data.token;
        });
    }

    public getSmokeyId(): number {
        return MetaSmokeAPI.metasmokeIds[this.postId] || 0;
    }

    public async reportRedFlag(): Promise<string> {
        const smokeyId = this.getSmokeyId();
        const urlString = MetaSmokeAPI.getQueryUrl(this.postId, this.postType);

        const reportRequest = await fetch('https://metasmoke.erwaysoftware.com/api/w/post/report', {
            method: 'POST',
            body: globals.getFormDataFromObject({ post_link: urlString, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
        });
        const requestResponse = await reportRequest.text();
        if (!reportRequest.ok || requestResponse !== 'OK') { // if the post is successfully reported, the response is a plain OK
            console.error(`Failed to report post to Smokey (postId: ${smokeyId})`, requestResponse);
            throw new Error(globals.metasmokeFailureMessage);
        }
        return globals.metasmokeReportedMessage;
    }

    public async sendFeedback(feedback: string, sendFeedback: boolean): Promise<string> {
        if (!sendFeedback) return '';
        const smokeyId = this.getSmokeyId();
        const isPostDeleted = globals.isPostDeleted(this.postId);
        // not reported, feedback is tpu AND the post isn't deleted => report it!
        if (!smokeyId && feedback === 'tpu-' && !isPostDeleted) return await this.reportRedFlag();
        else if (!MetaSmokeAPI.accessToken || !smokeyId) return '';

        const feedbackRequest = await fetch(`https://metasmoke.erwaysoftware.com/api/w/post/${smokeyId}/feedback`, {
            method: 'POST',
            body: globals.getFormDataFromObject({ type: feedback, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
        });
        const feedbackResponse = await feedbackRequest.json() as unknown;
        if (!feedbackRequest.ok) {
            console.error(`Failed to send feedback to Smokey (postId: ${smokeyId})`, feedbackResponse);
            throw new Error(globals.getSentMessage(false, feedback, this.name));
        }
        return globals.getSentMessage(true, feedback, this.name);
    }

    public setupIcon(): void {
        const smokeyId = this.getSmokeyId();
        if (!smokeyId || !this.smokeyIcon) return;

        const iconLink = this.smokeyIcon.querySelector('a');
        if (!iconLink) return;

        iconLink.href = `https://metasmoke.erwaysoftware.com/post/${smokeyId}`;
        iconLink.target = '_blank';

        globals.showInlineElement(this.smokeyIcon);
    }
}
