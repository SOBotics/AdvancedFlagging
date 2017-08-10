import { GetFromCache, StoreInCache, GetAndCache } from './Caching';
import { Delay } from './FunctionUtils';
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
    private codeGetter: (metaSmokeOAuthUrl: string) => Promise<string | undefined>;
    private appKey: string;

    private getUserKey() {
        return GetAndCache(MetaSmokeUserKeyConfig, () => new Promise<string>((resolve, reject) => {
            this.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${this.appKey}`)
                .then(code => {
                    $.ajax({
                        url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + this.appKey + '&code=' + code,
                        method: 'GET'
                    }).done(data => resolve(data.token))
                        .fail(err => reject(err))
                });
        }));
    }

    private appendResetToWindow() {
        StoreInCache(MetaSmokeDisabledConfig, undefined);
        if (!localStorage) { return; }

        const scriptNode = document.createElement('script');
        scriptNode.type = 'text/javascript';
        scriptNode.textContent = `
    window.resetMetaSmokeConfiguration = function() {
        xdLocalStorage.removeItem('${MetaSmokeDisabledConfig}');
        xdLocalStorage.removeItem('${MetaSmokeUserKeyConfig}', undefined);
    }
    `;

        const target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        target.appendChild(scriptNode);
    }

    public constructor(appKey: string, codeGetter?: (metaSmokeOAuthUrl: string) => Promise<string | undefined>) {
        if (!codeGetter) {
            codeGetter = async (metaSmokeOAuthUrl: string | undefined) => {
                const isDisabled = await this.IsDisabled();
                if (isDisabled) {
                    return;
                }

                const cachedUserKey = await GetFromCache<string>(MetaSmokeUserKeyConfig);
                if (cachedUserKey) {
                    return cachedUserKey;
                }

                if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, call window.resetMetaSmokeConfiguration().')) {
                    StoreInCache('MetaSmoke.Disabled', true);
                    return;
                }

                window.open(metaSmokeOAuthUrl, '_blank');
                await Delay(100);
                const handleFDSCCode = () => {
                    $(window).off('focus', handleFDSCCode);
                    const code = window.prompt('Once you\'ve authenticated FDSC with metasmoke, you\'ll be given a code; enter it here.');
                    if (!code) {
                        return;
                    }
                    return code;
                }
                $(window).focus(handleFDSCCode);
            }
        }
        this.codeGetter = codeGetter;
        this.appKey = appKey;
        this.appendResetToWindow();

        this.getUserKey(); // Make sure we request it immediately
    }

    public async IsDisabled() {
        const cachedDisabled = await GetFromCache<boolean>(MetaSmokeDisabledConfig);
        if (cachedDisabled === undefined) {
            return false;
        }

        return cachedDisabled;
    }
    public async GetFeedback(postId: number, postType: 'Answer' | 'Question'): Promise<MetaSmokeApiItem[]> {
        const urlStr =
            postType === 'Answer'
                ? `//${window.location.hostname}/a/${postId}`
                : `//${window.location.hostname}/questions/${postId}`;

        const isDisabled = await this.IsDisabled();
        if (isDisabled) {
            return [];
        }

        const result = await GetAndCache<MetaSmokeApiItem[]>(`${MetaSmokeWasReportedConfig}.${urlStr}`, () => new Promise((resolve, reject) => {
            $.ajax({
                type: 'GET',
                url: 'https://metasmoke.erwaysoftware.com/api/posts/urls',
                data: {
                    urls: urlStr,
                    key: `${this.appKey}`
                }
            }).done((metaSmokeResult: MetaSmokeApiWrapper) => {
                resolve(metaSmokeResult.items);
            }).fail(error => {
                reject(error);
            });
        }));
        return result;
    }

    public Report(postId: number, postType: 'Answer' | 'Question'): Promise<void> {
        const urlStr =
            postType === 'Answer'
                ? `//${window.location.hostname}/a/${postId}`
                : `//${window.location.hostname}/q/${postId}`;

        return new Promise<void>((resolve, reject) => {
            this.getUserKey().then(userKey => {
                $.ajax({
                    type: 'POST',
                    url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                    data: {
                        post_link: urlStr,
                        key: this.appKey,
                        token: userKey
                    }
                }).done(() => resolve())
                    .fail(() => reject());
            });
        });
    }
    public ReportTruePositive(metaSmokeId: number): Promise<void> {
        return this.SendFeedback(metaSmokeId, 'tpu-');
    }
    public ReportFalsePositive(metaSmokeId: number): Promise<void> {
        return this.SendFeedback(metaSmokeId, 'fp-');
    }
    public ReportNAA(metaSmokeId: number): Promise<void> {
        return this.SendFeedback(metaSmokeId, 'naa-');
    }

    private SendFeedback(metaSmokeId: number, feedbackType: 'fp-' | 'tpu-' | 'naa-'): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getUserKey().then(userKey => {
                $.ajax({
                    type: 'POST',
                    url: 'https://metasmoke.erwaysoftware.com/api/w/post/' + metaSmokeId + '/feedback',
                    data: {
                        type: feedbackType,
                        key: this.appKey,
                        token: userKey
                    }
                }).done(() => resolve())
                    .fail(() => reject());
            })
        });
    }
}
