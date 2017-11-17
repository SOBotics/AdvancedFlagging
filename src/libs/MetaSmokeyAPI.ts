import { GetFromCache, StoreInCache, GetAndCache } from './Caching';
import { Delay } from './FunctionUtils';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
const MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';

interface MetaSmokeApiItem {
    id: number;
    title: string;
    body: string;
    link: string;
    post_creation_date?: Date;
    created_at: Date;
    updated_at?: Date;
    site_id: number;
    user_link: string;
    username: string;
    why: string;
    user_reputation: number;
    score?: number;
    upvote_count?: number;
    downvote_count?: number;
    stack_exchange_user_id: string;
    is_tp: boolean;
    is_fp: boolean;
}
interface MetaSmokeApiWrapper {
    items: MetaSmokeApiItem[];
    has_more: boolean;
}

export class MetaSmokeyAPI {
    private static actualPromise: Promise<string | undefined>;
    private static codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined>;
    private static appKey: string;

    private postId: number;
    private postType: 'Question' | 'Answer';
    private subject: Subject<number | null>;

    public static async Reset() {
        await StoreInCache(MetaSmokeDisabledConfig, undefined);
        await StoreInCache(MetaSmokeUserKeyConfig, undefined);
    }

    public static async IsDisabled() {
        const cachedDisabled = await GetFromCache<boolean>(MetaSmokeDisabledConfig);
        if (cachedDisabled === undefined) {
            return false;
        }

        return cachedDisabled;
    }

    private static getUserKey() {
        return GetAndCache(MetaSmokeUserKeyConfig, () => new Promise<string>(async (resolve, reject) => {
            let prom = MetaSmokeyAPI.actualPromise;
            if (prom === undefined) {
                prom = MetaSmokeyAPI.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeyAPI.appKey}`);
                MetaSmokeyAPI.actualPromise = prom;
            }
            const code = await prom;
            $.ajax({
                url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeyAPI.appKey + '&code=' + code,
                method: 'GET'
            }).done(data => resolve(data.token))
                .fail(err => reject(err))
        }));
    }

    public static Setup(appKey: string, codeGetter?: (metaSmokeOAuthUrl: string) => Promise<string | undefined>) {
        if (!codeGetter) {
            codeGetter = async (metaSmokeOAuthUrl: string | undefined) => {
                const isDisabled = await MetaSmokeyAPI.IsDisabled();
                if (isDisabled) {
                    return;
                }

                const cachedUserKey = await GetFromCache<string>(MetaSmokeUserKeyConfig);
                if (cachedUserKey) {
                    return cachedUserKey;
                }

                if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, see footer of Stack Overflow.')) {
                    StoreInCache(MetaSmokeDisabledConfig, true);
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
                    }
                    $(window).focus(handleFDSCCode);
                })
                return returnCode;
            }
        }
        MetaSmokeyAPI.codeGetter = codeGetter;
        MetaSmokeyAPI.appKey = appKey;

        MetaSmokeyAPI.getUserKey(); // Make sure we request it immediately
    }

    constructor(postId: number, postType: 'Answer' | 'Question') {
        this.postId = postId;
        this.postType = postType;
    }

    private QueryMetaSmokey() {
        const urlStr =
            this.postType === 'Answer'
                ? `//${window.location.hostname}/a/${this.postId}`
                : `//${window.location.hostname}/questions/${this.postId}`;

        GetAndCache<number | null>(`${MetaSmokeWasReportedConfig}.${urlStr}`, () => new Promise((resolve, reject) => {
            MetaSmokeyAPI.IsDisabled().then(isDisabled => {
                if (isDisabled) {
                    return;
                }
                $.ajax({
                    type: 'GET',
                    url: 'https://metasmoke.erwaysoftware.com/api/posts/urls',
                    data: {
                        urls: urlStr,
                        key: `${MetaSmokeyAPI.appKey}`
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
            })
        }))
            .then(r => this.subject.next(r))
            .catch(err => this.subject.error(err));
    }

    public Watch(): Observable<number | null> {
        this.subject = new Subject<number | null>();

        this.QueryMetaSmokey();

        return this.subject;
    }


    public async ReportNaa(answerDate: Date, questionDate: Date) {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            this.SendFeedback(smokeyid, "naa-");
        }
    }
    public async ReportRedFlag() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            this.SendFeedback(smokeyid, "tpu-");
        } else {
            const urlStr =
                this.postType === 'Answer'
                    ? `//${window.location.hostname}/a/${this.postId}`
                    : `//${window.location.hostname}/q/${this.postId}`;

            const promise = new Promise<void>((resolve, reject) => {
                MetaSmokeyAPI.getUserKey().then(userKey => {
                    $.ajax({
                        type: 'POST',
                        url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                        data: {
                            post_link: urlStr,
                            key: MetaSmokeyAPI.appKey,
                            token: userKey
                        }
                    }).done(() => resolve())
                        .fail(() => reject());
                });
            });

            await promise.then(() => {
                StoreInCache(`${MetaSmokeWasReportedConfig}.${urlStr}`, undefined);
                this.QueryMetaSmokey();
            });
        }
    }
    public async ReportLooksFine() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            this.SendFeedback(smokeyid, "fp-");
        }
    }
    public async ReportNeedsEditing() {
        const smokeyid = await this.GetSmokeyId();
        if (smokeyid != null) {
            this.SendFeedback(smokeyid, "fp-");
        }
    }

    private async GetSmokeyId() {
        return await this.subject.toPromise();
    }

    private SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tpu-' | 'naa-'): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            MetaSmokeyAPI.getUserKey().then(userKey => {
                $.ajax({
                    type: 'POST',
                    url: 'https://metasmoke.erwaysoftware.com/api/w/post/' + metaSmokeId + '/feedback',
                    data: {
                        type: feedbackType,
                        key: MetaSmokeyAPI.appKey,
                        token: userKey
                    }
                }).done(() => resolve())
                    .fail(() => reject());
            })
        });
    }
}
