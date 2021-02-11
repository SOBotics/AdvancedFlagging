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
    private static actualPromise: Promise<string | undefined>;
    private static appKey: string;
    private static accessToken: string;
    private static metasmokeIds: { sitePostId: number, metasmokeId: number }[] = [];

    public static Reset() {
        GreaseMonkeyCache.Unset(globals.MetaSmokeDisabledConfig);
        GreaseMonkeyCache.Unset(globals.MetaSmokeUserKeyConfig);
    }

    public static IsDisabled() {
        const cachedDisabled = GreaseMonkeyCache.GetFromCache<boolean>(globals.MetaSmokeDisabledConfig);
        if (!cachedDisabled) return false;

        return cachedDisabled;
    }

    public static async Setup(appKey: string) {
        MetaSmokeAPI.appKey = appKey;
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
        await MetaSmokeAPI.QueryMetaSmokeInternal();
    }

    private static codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined> = async (metaSmokeOAuthUrl: string | undefined) => {
        if (MetaSmokeAPI.IsDisabled()) return;

        const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
        if (!userDisableMetasmoke) {
            GreaseMonkeyCache.StoreInCache(globals.MetaSmokeDisabledConfig, true);
            return;
        }

        window.open(metaSmokeOAuthUrl, '_blank');
        await globals.Delay(100);
        const returnCode = await new Promise<string | undefined>((resolve) => {
            const getMSToken = async () => {
                $(window).off('focus', getMSToken);
                const code = await globals.showMSTokenPopupAndGet();

                resolve(code || undefined);
            };
            $(window).focus(getMSToken);
        });
        return returnCode;
    };

    private static QueryMetaSmokeInternal() {
        const urls = globals.isQuestionPage() ? globals.getPostUrlsFromQuestionPage() : globals.getPostUrlsFromFlagsPage();
        const urlString = $.map(urls, obj => obj).join(',');

        const isDisabled = MetaSmokeAPI.IsDisabled();
        if (isDisabled) return;
        return new Promise<void>((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: 'https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls',
                data: {
                    urls: urlString,
                    key: `${MetaSmokeAPI.appKey}`
                }
            }).done((metaSmokeResult: MetaSmokeApiWrapper) => {
                metaSmokeResult.items.forEach(item => {
                    const postId = item.link.match(/\d+$/);
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

    public static GetQueryUrl(postId: number, postType: 'Answer' | 'Question') {
        return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
    }

    private static getUserKey() {
        // eslint-disable-next-line no-async-promise-executor
        return GreaseMonkeyCache.GetAndCache(globals.MetaSmokeUserKeyConfig, () => new Promise<string>(async (resolve, reject) => {
            let prom = MetaSmokeAPI.actualPromise;
            if (!prom) {
                prom = MetaSmokeAPI.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`);
                MetaSmokeAPI.actualPromise = prom;
            }
            const code = await prom;
            if (!code) return;

            $.ajax({
                url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeAPI.appKey + '&code=' + code,
                method: 'GET'
            }).done(data => resolve(data.token)).fail(err => reject(err));
        }));
    }

    public static getSmokeyId(postId: number): number {
        const metasmokeObject = MetaSmokeAPI.metasmokeIds.find(item => item.sitePostId === postId);
        return metasmokeObject ? metasmokeObject.metasmokeId : 0;
    }

    public async ReportNaa(postId: number) {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'naa-');
        return true;
    }

    public async ReportRedFlag(postId: number, postType: 'Answer' | 'Question') {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (smokeyid) {
            await this.SendFeedback(smokeyid, 'tpu-');
            return true;
        }

        const urlStr = MetaSmokeAPI.GetQueryUrl(postId, postType);
        if (!MetaSmokeAPI.accessToken) return false;

        return new Promise<boolean>((resolve, reject) => {
            $.ajax({
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

    public async ReportLooksFine(postId: number) {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'fp-');
        return true;
    }

    public async ReportNeedsEditing(postId: number) {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'fp-');
        return true;
    }

    public async ReportVandalism(postId: number) {
        const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
        if (!smokeyid) return false;

        await this.SendFeedback(smokeyid, 'tp-');
        return true;
    }

    private SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tp-' | 'tpu-' | 'naa-'): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!MetaSmokeAPI.accessToken) reject();
            $.ajax({
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
