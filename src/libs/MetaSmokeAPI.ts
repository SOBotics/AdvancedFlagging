import { Delay } from './FunctionUtils';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/take';
import { CrossDomainCache } from './CrossDomainCache';
import { SimpleCache } from './SimpleCache';

const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
const MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';

interface MetaSmokeApiItem {
    id: number;
}
interface MetaSmokeApiWrapper {
    items: MetaSmokeApiItem[];
}

export class MetaSmokeAPI {
    public static async Reset() {
        await CrossDomainCache.StoreInCache(MetaSmokeDisabledConfig, undefined);
        await CrossDomainCache.StoreInCache(MetaSmokeUserKeyConfig, undefined);
    }

    public static async IsDisabled() {
        const cachedDisabled = await CrossDomainCache.GetFromCache<boolean>(MetaSmokeDisabledConfig);
        if (cachedDisabled === undefined) {
            return false;
        }

        return cachedDisabled;
    }

    public static async Setup(appKey: string, codeGetter?: (metaSmokeOAuthUrl: string) => Promise<string | undefined>) {
        if (!codeGetter) {
            codeGetter = async (metaSmokeOAuthUrl: string | undefined) => {
                const isDisabled = await MetaSmokeAPI.IsDisabled();
                if (isDisabled) {
                    return;
                }

                const cachedUserKey = await CrossDomainCache.GetFromCache<string>(MetaSmokeUserKeyConfig);
                if (cachedUserKey) {
                    return cachedUserKey;
                }

                if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, see footer of Stack Overflow.')) {
                    CrossDomainCache.StoreInCache(MetaSmokeDisabledConfig, true);
                    return;
                }

                window.open(metaSmokeOAuthUrl, '_blank');
                await Delay(100);
                const returnCode = await new Promise<string | undefined>((resolve) => {
                    const handleFDSCCode = () => {
                        $(window).off('focus', handleFDSCCode);
                        const code = window.prompt('Once you\'ve authenticated FDSC with metasmoke, you\'ll be given a code; enter it here.');
                        if (!code) {
                            resolve();
                        } else {
                            return resolve(code);
                        }
                    };
                    $(window).focus(handleFDSCCode);
                });
                return returnCode;
            };
        }
        MetaSmokeAPI.codeGetter = codeGetter;
        MetaSmokeAPI.appKey = appKey;

        MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
    }

    private static actualPromise: Promise<string | undefined>;
    private static codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined>;
    private static appKey: string;

    private static getUserKey() {
        return CrossDomainCache.GetAndCache(MetaSmokeUserKeyConfig, () => new Promise<string>(async (resolve, reject) => {
            let prom = MetaSmokeAPI.actualPromise;
            if (prom === undefined) {
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

    private postId: number;
    private postType: 'Question' | 'Answer';
    private subject: Subject<number | null>;
    private replaySubject: ReplaySubject<number | null>;

    constructor(postId: number, postType: 'Answer' | 'Question') {
        this.postId = postId;
        this.postType = postType;
    }

    public Watch(): Observable<number | null> {
        this.subject = new Subject<number | null>();
        this.replaySubject = new ReplaySubject<number | null>(1);
        this.subject.subscribe(this.replaySubject);

        this.QueryMetaSmokey();

        return this.subject;
    }

    public async ReportNaa() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'naa-');
            return true;
        }
        return false;
    }
    public async ReportRedFlag() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'tpu-');
            return true;
        } else {
            const urlStr =
                this.postType === 'Answer'
                    ? `//${window.location.hostname}/a/${this.postId}`
                    : `//${window.location.hostname}/q/${this.postId}`;

            const promise = new Promise<boolean>((resolve, reject) => {
                MetaSmokeAPI.getUserKey().then((userKey: string) => {
                    if (userKey) {
                        $.ajax({
                            type: 'POST',
                            url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                            data: {
                                post_link: urlStr,
                                key: MetaSmokeAPI.appKey,
                                token: userKey
                            }
                        }).done(() => resolve())
                            .fail(() => reject());

                        return true;
                    }
                    return false;
                });
            });

            const result = await promise.then((r) => {
                const queryUrlStr =
                    this.postType === 'Answer'
                        ? `//${window.location.hostname}/a/${this.postId}`
                        : `//${window.location.hostname}/questions/${this.postId}`;

                SimpleCache.StoreInCache(`${MetaSmokeWasReportedConfig}.${queryUrlStr}`, undefined);
                this.QueryMetaSmokey();
                return r;
            });
            return result;
        }
    }
    public async ReportLooksFine() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        return false;
    }
    public async ReportNeedsEditing() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        return false;
    }

    private QueryMetaSmokey() {
        const urlStr =
            this.postType === 'Answer'
                ? `//${window.location.hostname}/a/${this.postId}`
                : `//${window.location.hostname}/questions/${this.postId}`;

        const resultPromise = SimpleCache.GetAndCache<number | null>(`${MetaSmokeWasReportedConfig}.${urlStr}`, () => new Promise((resolve, reject) => {
            MetaSmokeAPI.IsDisabled().then(isDisabled => {
                if (isDisabled) {
                    return;
                }
                $.ajax({
                    type: 'GET',
                    url: 'https://metasmoke.erwaysoftware.com/api/posts/urls',
                    data: {
                        urls: urlStr,
                        key: `${MetaSmokeAPI.appKey}`
                    }
                }).done((metaSmokeResult: MetaSmokeApiWrapper) => {
                    if (metaSmokeResult.items.length > 0) {
                        resolve(metaSmokeResult.items[0].id);
                    } else {
                        resolve(null);
                    }
                }).fail(error => {
                    reject(error);
                });
            });
        }));

        resultPromise
            .then(r => this.subject.next(r))
            .catch(err => this.subject.error(err));
    }

    private async GetSmokeyId() {
        return this.replaySubject.take(1).toPromise();
    }

    private SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tpu-' | 'naa-'): Promise<void> {
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
