import { Store } from './Store';
import {
    Cached,
    FlagTypeFeedbacks,
    PostType,
    showConfirmModal,
    delay,
    displayError,
    getFormDataFromObject,
    isPostDeleted,
    getSentMessage,
    showInlineElement,
    debugMode,
} from '../shared';
import { getAllPostIds } from './sotools';
import { Modals, Input, Buttons } from '@userscripters/stacks-helpers';
import { createBotIcon } from '../AdvancedFlagging';

const metasmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
const metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
const metasmokeReportedMessage = 'Post reported to Smokey';
const metasmokeFailureMessage = 'Failed to report post to Smokey';

interface MetaSmokeApiItem {
    id: number;
    link: string;
}

interface MetaSmokeApiWrapper {
    items: MetaSmokeApiItem[];
}

interface MetasmokeData {
    // key is the sitePostId, the value is the metasmokeId. That's all we need!
    [key: number]: number;
}

export class MetaSmokeAPI {
    public static accessToken: string;
    public static isDisabled: boolean = Store.get<boolean>(Cached.Metasmoke.disabled) || false;

    private static readonly appKey = metasmokeKey;
    private static metasmokeIds: MetasmokeData = {};

    public name: keyof FlagTypeFeedbacks = 'Smokey';
    public icon?: HTMLDivElement | undefined;

    constructor(
        private readonly postId: number,
        private readonly postType: PostType,
    ) {
        this.icon = this.getIcon();
    }

    public static reset(): void {
        Store.unset(Cached.Metasmoke.disabled);
        Store.unset(Cached.Metasmoke.userKey);
    }

    public static async setup(): Promise<void> {
        // Make sure we request it immediately
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey();
    }

    private static getMetasmokeTokenPopup(): HTMLElement {
        const codeInput = Input.makeStacksInput(
            'advanced-flagging-metasmoke-token-input',
            { placeholder: 'Enter the code here', },
            {
                text: 'Metasmoke access token',
                description: 'Once you\'ve authenticated Advanced Flagging with '
                           + 'metasmoke, you\'ll be given a code; enter it below:'
            }
        );

        const authModal = Modals.makeStacksModal(
            'advanced-flagging-metasmoke-token-modal',
            {
                title: {
                    text: 'Authenticate MS with AF'
                },
                body: {
                    bodyHtml: codeInput
                },
                footer: {
                    buttons: [
                        {
                            element: Buttons.makeStacksButton(
                                'advanced-flagging-submit-code',
                                'Submit',
                                { primary: true }
                            )
                        },
                        {
                            element: Buttons.makeStacksButton(
                                'advanced-flagging-dismiss-code-modal',
                                'Cancel',
                            ),
                            hideOnClick: true
                        }
                    ]
                }
            }
        );

        return authModal;
    }

    private static showMSTokenPopupAndGet(): Promise<string | undefined> {
        return new Promise<string>(resolve => {
            const popup = this.getMetasmokeTokenPopup();
            StackExchange.helpers.showModal(popup);

            popup
                .querySelector('.s-btn__primary')
                ?.addEventListener('click', () => {
                    const input = popup.querySelector('input');
                    const token = input?.value;

                    // dismiss modal
                    popup.remove();

                    if (!token) return;

                    resolve(token.toString());
                });
        });
    }

    private static async codeGetter(metaSmokeOAuthUrl: string): Promise<string | undefined> {
        if (MetaSmokeAPI.isDisabled) return;

        const authenticate = await showConfirmModal(
            'Setting up metasmoke',
            'If you do not wish to connect, press cancel and this popup won\'t show up again. '
            + 'To reset configuration, see the footer of Stack Overflow.',
        );

        // user doesn't wish to connect
        if (!authenticate) {
            Store.set('MetaSmoke.Disabled', true);
            return;
        }

        window.open(metaSmokeOAuthUrl, '_blank');
        await delay(100);

        return await this.showMSTokenPopupAndGet();
    }

    public static async queryMetaSmokeInternal(): Promise<void> {
        if (MetaSmokeAPI.isDisabled) return;

        // postIds as URLs, including questions
        const urlString = getAllPostIds(true, true).join(',');

        // don't make the request if there aren't URLs
        if (!urlString) return;

        const parameters = Object.entries({
            urls: urlString,
            key: MetaSmokeAPI.appKey,
            per_page: 1000,
            filter: metasmokeApiFilter // only include id and link fields
        })
            .map(item => item.join('='))
            .join('&');

        try {
            const url = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls?${parameters}`;
            const call = await fetch(url);
            const result = await call.json() as MetaSmokeApiWrapper;

            result.items.forEach(({ link, id }) => {
                const postId = Number(/\d+$/.exec(link)?.[0]);
                if (!postId) return;

                MetaSmokeAPI.metasmokeIds[postId] = id;
            });
        } catch (error) {
            displayError('Failed to get Metasmoke URLs.');
            console.error(error);
        }
    }

    public static getQueryUrl(postId: number, postType: PostType): string {
        const path = postType === 'Answer' ? 'a' : 'questions';

        return `//${window.location.hostname}/${path}/${postId}`;
    }

    private static async getUserKey(): Promise<string> {
        while (typeof StackExchange.helpers.showConfirmModal === 'undefined') {
            // eslint-disable-next-line no-await-in-loop
            await delay(100);
        }

        const { appKey } = MetaSmokeAPI;
        const url = `https://metasmoke.erwaysoftware.com/oauth/request?key=${appKey}`;

        return await Store.getAndCache<string>(
            Cached.Metasmoke.userKey,
            async (): Promise<string> => {
                const code = await MetaSmokeAPI.codeGetter(url);
                if (!code) return '';

                const tokenUrl = `//metasmoke.erwaysoftware.com/oauth/token?key=${appKey}&code=${code}`;
                const tokenCall = await fetch(tokenUrl);

                const { token } = await tokenCall.json() as { token: string };

                return token;
            });
    }

    public getSmokeyId(): number {
        return MetaSmokeAPI.metasmokeIds[this.postId] || 0;
    }

    public async reportRedFlag(): Promise<string> {
        const smokeyId = this.getSmokeyId();
        const urlString = MetaSmokeAPI.getQueryUrl(this.postId, this.postType);

        const { appKey, accessToken } = MetaSmokeAPI;

        const url = 'https://metasmoke.erwaysoftware.com/api/w/post/report';
        const body = getFormDataFromObject({
            post_link: urlString,
            key: appKey,
            token: accessToken
        });

        if (debugMode) {
            console.log('Report post via', url, body);

            throw new Error('Didn\'t report post: in debug mode');
        }

        const reportRequest = await fetch(
            url,
            {
                method: 'POST',
                body
            }
        );

        const requestResponse = await reportRequest.text();

        // if the post is successfully reported, the response is a plain OK
        if (!reportRequest.ok || requestResponse !== 'OK') {
            console.error(`Failed to report post ${smokeyId} to Smokey`, requestResponse);

            throw new Error(metasmokeFailureMessage);
        }

        return metasmokeReportedMessage;
    }

    public async sendFeedback(feedback: string): Promise<string> {
        const { appKey, accessToken } = MetaSmokeAPI;

        const smokeyId = this.getSmokeyId();
        const deleted = isPostDeleted(this.postId);

        // not reported, feedback is tpu AND the post isn't deleted => report it!
        if (!smokeyId && feedback === 'tpu-' && !deleted) {
            return await this.reportRedFlag();
        } else if (!accessToken || !smokeyId) {
            // user hasn't authenticated or the post hasn't been reported => don't send feedback
            return '';
        }

        // otherwise, send feedback
        const body = getFormDataFromObject({
            type: feedback,
            key: appKey,
            token: accessToken
        });
        const url = `//metasmoke.erwaysoftware.com/api/w/post/${smokeyId}/feedback`;

        if (debugMode) {
            console.log('Feedback to Smokey via', url, body);

            throw new Error('Didn\'t send feedback: debug mode');
        }

        const feedbackRequest = await fetch(
            url,
            { method: 'POST', body }
        );
        const feedbackResponse = await feedbackRequest.json() as unknown;

        if (!feedbackRequest.ok) {
            console.error(`Failed to send feedback for ${smokeyId} to Smokey`, feedbackResponse);

            throw new Error(getSentMessage(false, feedback, this.name));
        }

        return getSentMessage(true, feedback, this.name);
    }

    private getIcon(): HTMLDivElement | undefined {
        const smokeyId = this.getSmokeyId();
        if (!smokeyId) return;

        const icon = createBotIcon('Smokey');

        const iconLink = icon.querySelector('a') as HTMLAnchorElement;

        iconLink.href = `//metasmoke.erwaysoftware.com/post/${smokeyId}`;
        iconLink.target = '_blank';

        showInlineElement(icon);

        return icon;
    }
}
