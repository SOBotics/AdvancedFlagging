import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';
import * as globals from '../../../GlobalVars';

interface MetaSmokeApiItem {
    id: number;
    link: string;
}

interface MetaSmokeApiWrapper {
    items: MetaSmokeApiItem[];
}

export class MetaSmokeAPI {
    private static appKey: string;
    private static accessToken: string;
    private static metasmokeIds: { sitePostId: number, metasmokeId: number }[] = [];

    public static Reset(): void {
        GreaseMonkeyCache.Unset(globals.MetaSmokeDisabledConfig);
        GreaseMonkeyCache.Unset(globals.MetaSmokeUserKeyConfig);
    }

    public static IsDisabled(): boolean {
        const cachedDisabled = GreaseMonkeyCache.GetFromCache<boolean>(globals.MetaSmokeDisabledConfig);
        if (!cachedDisabled) return false;

        return cachedDisabled;
    }

    public static async Setup(appKey: string): Promise<void> {
        MetaSmokeAPI.appKey = appKey;
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
    }

    private static codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined> = async (metaSmokeOAuthUrl?: string) => {
        if (MetaSmokeAPI.IsDisabled()) return;

        const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
        if (!userDisableMetasmoke) {
            GreaseMonkeyCache.StoreInCache(globals.MetaSmokeDisabledConfig, true);
            return;
        }

        window.open(metaSmokeOAuthUrl, '_blank');
        await globals.Delay(100);
        const returnCode = await new Promise<string | undefined>(resolve => {
            const getMSToken = async (): Promise<void> => {
                $(window).off('focus', getMSToken);
                const code = await globals.showMSTokenPopupAndGet();

                resolve(code);
            };
            $(window).focus(getMSToken);
        });
        return returnCode;
    };

    public static QueryMetaSmokeInternal(): Promise<void> | undefined {
        const urls = globals.isQuestionPage() ? globals.getPostUrlsFromQuestionPage() : globals.getPostUrlsFromFlagsPage();
        const urlString = urls.join(',');

        const isDisabled = MetaSmokeAPI.IsDisabled();
        if (isDisabled) return;
        return new Promise<void>((resolve, reject) => {
            void $.ajax({
                type: 'GET',
                url: 'https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls',
                data: {
                    urls: urlString,
                    key: `${MetaSmokeAPI.appKey}`
                }
            }).done((metaSmokeResult: MetaSmokeApiWrapper) => {
                metaSmokeResult.items.forEach(item => {
                    const postId = /\d+$/.exec(item.link);
                    if (!postId) return;

                    MetaSmokeAPI.metasmokeIds.push({ sitePostId: Number(postId[0]), metasmokeId: item.id });
                });
                resolve();
            }).fail(error => {
                console.error('Failed to get Metasmoke URLs', error);
                reject();
            });
        });
    }

    public static GetQueryUrl(postId: number, postType: 'Answer' | 'Question'): string {
        return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
    }

    private static async getUserKey(): Promise<string> {
        return await GreaseMonkeyCache.GetAndCache(globals.MetaSmokeUserKeyConfig, () => new Promise<string>((resolve, reject) => {
            MetaSmokeAPI.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`).then(code => {
                if (!code) return;
                void $.ajax({
                    url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeAPI.appKey + '&code=' + code,
                    method: 'GET'
                }).done((data: { token: string }) => resolve(data.token)).fail(err => reject(err));
            }).catch(() => reject());
        }));
    }

    public static getSmokeyId(postId: number): number {
        const metasmokeObject = MetaSmokeAPI.metasmokeIds.find(item => item.sitePostId === postId);
        return metasmokeObject ? metasmokeObject.metasmokeId : 0;
    }

    public async ReportNaa(postId: number): Promise<boolean> {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'naa-');
        return true;
    }

    public async ReportRedFlag(postId: number, postType: 'Answer' | 'Question'): Promise<boolean> {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (smokeyid) {
            await this.SendFeedback(smokeyid, 'tpu-');
            return true;
        }

        const urlStr = MetaSmokeAPI.GetQueryUrl(postId, postType);
        if (!MetaSmokeAPI.accessToken) return false;

        return new Promise<boolean>((resolve, reject) => {
            void $.ajax({
                type: 'POST',
                url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                data: {
                    post_link: urlStr,
                    key: MetaSmokeAPI.appKey,
                    token: MetaSmokeAPI.accessToken
                }
            }).done(() => resolve(true)).fail(() => reject(false));
        });
    }

    public async ReportLooksFine(postId: number): Promise<boolean> {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'fp-');
        return true;
    }

    public async ReportNeedsEditing(postId: number): Promise<boolean> {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'fp-');
        return true;
    }

    public async ReportVandalism(postId: number): Promise<boolean> {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'tp-');
        return true;
    }

    private SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tp-' | 'tpu-' | 'naa-'): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!MetaSmokeAPI.accessToken) reject();
            void $.ajax({
                type: 'POST',
                url: `https://metasmoke.erwaysoftware.com/api/w/post/${metaSmokeId}/feedback`,
                data: {
                    type: feedbackType,
                    key: MetaSmokeAPI.appKey,
                    token: MetaSmokeAPI.accessToken
                }
            }).done(() => resolve()).fail(() => reject());
        });
    }
}
