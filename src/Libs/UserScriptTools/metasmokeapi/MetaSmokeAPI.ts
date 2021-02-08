import { Observable, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';
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
        MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
    }

    private static actualPromise: Promise<string | undefined>;
    private static appKey: string;
    private static ObservableLookup: any = {};

    private static pendingPosts: { postId: number, postType: 'Answer' | 'Question' }[] = [];
    private static pendingTimeout: number | null = null;

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

    private static QueryMetaSmoke(postId: number, postType: 'Answer' | 'Question') {
        if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
        this.pendingPosts.push({ postId, postType });
        this.pendingTimeout = window.setTimeout(MetaSmokeAPI.QueryMetaSmokeInternal, 1000);
    }

    private static QueryMetaSmokeInternal() {
        const pendingPostLookup: any = {};
        const urls: string[] = [];
        for (const pendingPost of MetaSmokeAPI.pendingPosts) {
            const url = MetaSmokeAPI.GetQueryUrl(pendingPost.postId, pendingPost.postType);
            pendingPostLookup[url] = { postId: pendingPost.postId, postType: pendingPost.postType };
            urls.push(url);
        }
        MetaSmokeAPI.pendingPosts = [];
        const urlStr = urls.join();

        const isDisabled = MetaSmokeAPI.IsDisabled();
        if (isDisabled) return;
        $.ajax({
            type: 'GET',
            url: 'https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls',
            data: {
                urls: urlStr,
                key: `${MetaSmokeAPI.appKey}`
            }
        }).done((metaSmokeResult: MetaSmokeApiWrapper) => {
            for (const item of metaSmokeResult.items) {
                const pendingPost = pendingPostLookup[item.link];
                if (!pendingPost) continue;

                const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                const obs = MetaSmokeAPI.ObservableLookup[key];
                if (obs) obs.next(item.id);
                delete pendingPostLookup[item.link];
            }
            for (const url in pendingPostLookup) {
                if (!Object.prototype.hasOwnProperty.call(pendingPostLookup, url)) return;

                const pendingPost = pendingPostLookup[url];
                const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                const obs = MetaSmokeAPI.ObservableLookup[key];
                if (obs) obs.next(null);
            }
        }).fail(error => {
            for (const url in pendingPostLookup) {
                if (!Object.prototype.hasOwnProperty.call(pendingPostLookup, url)) return;
                const pendingPost = pendingPostLookup[url];
                const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                const obs = MetaSmokeAPI.ObservableLookup[key];
                if (obs) obs.error(error);
            }
        });
    }

    private static GetQueryUrl(postId: number, postType: 'Answer' | 'Question') {
        return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
    }

    private static async GetSmokeyId(postId: number, postType: 'Answer' | 'Question') {
        const observableKey = this.GetObservableKey(postId, postType);
        const observable = MetaSmokeAPI.ObservableLookup[observableKey];
        if (observable) {
            return observable.pipe(take(1)).toPromise();
        }
        return null;
    }

    private static GetObservableKey(postId: number, postType: 'Answer' | 'Question') {
        return JSON.stringify({ postId, postType });
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
            if (code) {
                $.ajax({
                    url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeAPI.appKey + '&code=' + code,
                    method: 'GET'
                }).done(data => resolve(data.token))
                    .fail(err => reject(err));
            }
        }));
    }

    public Watch(postId: number, postType: 'Answer' | 'Question'): Observable<number | null> {
        const key = MetaSmokeAPI.GetObservableKey(postId, postType);
        if (!MetaSmokeAPI.ObservableLookup[key]) {
            const replaySubject = new ReplaySubject<number | null>(1);
            MetaSmokeAPI.ObservableLookup[key] = replaySubject;
        }
        MetaSmokeAPI.QueryMetaSmoke(postId, postType);
        return MetaSmokeAPI.ObservableLookup[key] as ReplaySubject<number | null>;
    }

    public async ReportNaa(postId: number, postType: 'Answer' | 'Question') {
        const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'naa-');
            return true;
        }
        return false;
    }
    public async ReportRedFlag(postId: number, postType: 'Answer' | 'Question') {
        const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'tpu-');
            return true;
        } else {
            const urlStr = `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'q'}/${postId}`;

            // eslint-disable-next-line no-async-promise-executor
            const promise = new Promise<boolean>(async (resolve, reject) => {
                const userKey = await MetaSmokeAPI.getUserKey();
                if (!userKey) return;

                $.ajax({
                    type: 'POST',
                    url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                    data: {
                        post_link: urlStr,
                        key: MetaSmokeAPI.appKey,
                        token: userKey
                    }
                }).done(() => resolve(true))
                    .fail(() => reject());
            });

            const result = await promise;

            await globals.Delay(1000);
            MetaSmokeAPI.QueryMetaSmoke(postId, postType);
            return result;
        }
    }
    public async ReportLooksFine(postId: number, postType: 'Answer' | 'Question') {
        const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        return false;
    }
    public async ReportNeedsEditing(postId: number, postType: 'Answer' | 'Question') {
        const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        return false;
    }

    public async ReportVandalism(postId: number, postType: 'Answer' | 'Question') {
        const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'tp-');
            return true;
        }
        return false;
    }

    private SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tp-' | 'tpu-' | 'naa-'): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            MetaSmokeAPI.getUserKey().then((userKey: string) => {
                $.ajax({
                    type: 'POST',
                    url: `https://metasmoke.erwaysoftware.com/api/w/post/${metaSmokeId}/feedback`,
                    data: {
                        type: feedbackType,
                        key: MetaSmokeAPI.appKey,
                        token: userKey
                    }
                }).done(() => resolve())
                    .fail(() => reject());
            });
        });
    }
}
