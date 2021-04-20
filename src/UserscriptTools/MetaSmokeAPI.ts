import { GreaseMonkeyCache } from './GreaseMonkeyCache';
import * as globals from '../GlobalVars';
import { getAllPostIds } from './sotools';

declare const StackExchange: globals.StackExchange;

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
    private static appKey: string;
    private static accessToken: string;
    private static metasmokeIds: MetasmokeData = {};
    public static isDisabled: boolean = GreaseMonkeyCache.getFromCache<boolean>(globals.MetaSmokeDisabledConfig) || false;
    private postId: number;
    private postType: globals.PostType;
    public name: keyof globals.FlagTypeFeedbacks = 'Smokey';

    constructor(postId: number, postType: globals.PostType) {
        this.postId = postId;
        this.postType = postType;
    }

    public static reset(): void {
        GreaseMonkeyCache.unset(globals.MetaSmokeDisabledConfig);
        GreaseMonkeyCache.unset(globals.MetaSmokeUserKeyConfig);
    }

    public static async setup(appKey: string): Promise<void> {
        MetaSmokeAPI.appKey = appKey;
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
    }

    private static codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined> = async (metaSmokeOAuthUrl?: string) => {
        if (MetaSmokeAPI.isDisabled) return;

        const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
        if (!userDisableMetasmoke) {
            GreaseMonkeyCache.storeInCache(globals.MetaSmokeDisabledConfig, true);
            return;
        }

        window.open(metaSmokeOAuthUrl, '_blank');
        await globals.Delay(100);
        return await globals.showMSTokenPopupAndGet();
    };

    public static async queryMetaSmokeInternal(): Promise<void> {
        const urlString = getAllPostIds(true, true).join(',');

        if (MetaSmokeAPI.isDisabled) return;
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
                const postId = /\d+$/.exec(item.link);
                if (!postId) return;

                MetaSmokeAPI.metasmokeIds[Number(postId[0])] = item.id;
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

    public static getSmokeyId(postId: number): number {
        return MetaSmokeAPI.metasmokeIds[postId] || 0;
    }

    public async reportRedFlag(): Promise<string> {
        const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
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

    public async sendFeedback(feedback: string): Promise<string> {
        const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
        if (!smokeyId && feedback === 'tpu-') return await this.reportRedFlag(); // not reported and feedback is tpu => report it!
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
}
