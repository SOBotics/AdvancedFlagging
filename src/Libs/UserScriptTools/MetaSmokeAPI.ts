import { GreaseMonkeyCache } from '@userscriptTools/GreaseMonkeyCache';
import * as globals from 'GlobalVars';

declare const StackExchange: globals.StackExchange;

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
    public static isDisabled: boolean = GreaseMonkeyCache.GetFromCache<boolean>(globals.MetaSmokeDisabledConfig) || false;
    private postId: number;
    private postType: 'Question' | 'Answer';
    public name = 'Smokey';

    constructor(postId: number, postType: 'Question' | 'Answer') {
        this.postId = postId;
        this.postType = postType;
    }

    public static Reset(): void {
        GreaseMonkeyCache.Unset(globals.MetaSmokeDisabledConfig);
        GreaseMonkeyCache.Unset(globals.MetaSmokeUserKeyConfig);
    }

    public static async Setup(appKey: string): Promise<void> {
        MetaSmokeAPI.appKey = appKey;
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
    }

    private static codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined> = async (metaSmokeOAuthUrl?: string) => {
        if (MetaSmokeAPI.isDisabled) return;

        const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
        if (!userDisableMetasmoke) {
            GreaseMonkeyCache.StoreInCache(globals.MetaSmokeDisabledConfig, true);
            return;
        }

        window.open(metaSmokeOAuthUrl, '_blank');
        await globals.Delay(100);
        return await globals.showMSTokenPopupAndGet();
    };

    public static async QueryMetaSmokeInternal(): Promise<void> {
        const urls = globals.getAllPostIds(true, true);
        const urlString = urls.join(',');

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

                MetaSmokeAPI.metasmokeIds.push({ sitePostId: Number(postId[0]), metasmokeId: item.id });
            });
        } catch (error) {
            globals.displayError('Failed to get Metasmoke URLs.');
            console.error(error);
        }
    }

    public static GetQueryUrl(postId: number, postType: 'Answer' | 'Question'): string {
        return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
    }

    private static async getUserKey(): Promise<string> {
        while (typeof StackExchange.helpers.showConfirmModal === 'undefined') {
            // eslint-disable-next-line no-await-in-loop
            await globals.Delay(100);
        }

        return await GreaseMonkeyCache.GetAndCache(globals.MetaSmokeUserKeyConfig, async (): Promise<string> => {
            const keyUrl = `https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`;
            const code = await MetaSmokeAPI.codeGetter(keyUrl);
            if (!code) return '';

            const tokenCall = await fetch(`https://metasmoke.erwaysoftware.com/oauth/token?key=${MetaSmokeAPI.appKey}&code=${code}`);
            const data = await tokenCall.json() as { token: string };
            return data.token;
        });
    }

    public static getSmokeyId(postId: number): number {
        return MetaSmokeAPI.metasmokeIds.find(item => item.sitePostId === postId)?.metasmokeId || 0;
    }

    public async ReportNaa(): Promise<boolean> {
        const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
        return smokeyId !== 0 && await this.SendFeedback(smokeyId, 'naa-');
    }

    public async ReportRedFlag(): Promise<boolean> {
        const smokeyid = MetaSmokeAPI.getSmokeyId(this.postId);
        if (smokeyid) {
            return await this.SendFeedback(smokeyid, 'tpu-');
        }

        const urlString = MetaSmokeAPI.GetQueryUrl(this.postId, this.postType);
        if (!MetaSmokeAPI.accessToken) return false;

        try {
            const reportRequest = await fetch('https://metasmoke.erwaysoftware.com/api/w/post/report', {
                method: 'POST',
                body: globals.getFormDataFromObject({ post_link: urlString, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken})
            });
            return reportRequest.status === 200 || reportRequest.status === 201;
        } catch (error) {
            return false;
        }
    }

    public async ReportLooksFine(): Promise<boolean> {
        const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
        return smokeyId !== 0 && await this.SendFeedback(smokeyId, 'fp-');
    }

    public async ReportNeedsEditing(): Promise<boolean> {
        const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
        return smokeyId !== 0 && await this.SendFeedback(smokeyId, 'fp-');
    }

    public async ReportVandalism(): Promise<boolean> {
        const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
        return smokeyId !== 0 && await this.SendFeedback(smokeyId, 'tp-');
    }

    public ReportDuplicateAnswer(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportPlagiarism(): Promise<boolean> {
        return Promise.resolve(false);
    }

    private async SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tp-' | 'tpu-' | 'naa-'): Promise<boolean> {
        if (!MetaSmokeAPI.accessToken) return false;
        const feedbackRequest = await fetch(`https://metasmoke.erwaysoftware.com/api/w/post/${metaSmokeId}/feedback`, {
            method: 'POST',
            body: globals.getFormDataFromObject({type: feedbackType, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
        });
        return feedbackRequest.status === 201 || feedbackRequest.status === 200;
    }
}
