import { GetFromCache, StoreInCache, GetAndCache } from './FunctionUtils';
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
    private codeGetter: (metaSmokeOAuthUrl: string) => Promise<string>;
    private appKey: string;

    private getUserKey() {
        return GetAndCache(MetaSmokeUserKeyConfig, () => new Promise<string>((resolve, reject) => {
            this.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${this.appKey}`)
                .then(code => {
                    $.ajax({
                        url: "https://metasmoke.erwaysoftware.com/oauth/token?key=" + this.appKey + "&code=" + code,
                        method: "GET"
                    }).done(data => resolve(data.token))
                        .fail(err => reject(err))
                });
        }));
    }

    private appendResetToWindow() {
        StoreInCache(MetaSmokeDisabledConfig, undefined);
        if (!localStorage) { return; }

        let scriptNode = document.createElement('script');
        scriptNode.type = 'text/javascript';
        scriptNode.textContent = `
    window.resetMetaSmokeConfiguration = function() {
        xdLocalStorage.removeItem('${MetaSmokeDisabledConfig}'); 
        xdLocalStorage.removeItem('${MetaSmokeUserKeyConfig}', undefined);
    }
    `;

        var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        target.appendChild(scriptNode);
    }

    public constructor(appKey: string, codeGetter?: (metaSmokeOAuthUrl: string) => Promise<string>) {
        if (!codeGetter) {
            codeGetter = (metaSmokeOAuthUrl: string) => {
                return new Promise((resolve, reject) => {
                    const isDisabledPromise = this.IsDisabled();
                    isDisabledPromise.then(isDisabled => {
                        if (isDisabled) {
                            reject();
                            return;
                        }

                        const cachedUserKeyPromise = GetFromCache<string>(MetaSmokeUserKeyConfig);
                        cachedUserKeyPromise.then(cachedUserKey => {
                            if (cachedUserKey) {
                                resolve(cachedUserKey);
                                return;
                            }

                            const metaSmokeUserKeyPromise = GetFromCache<string>(MetaSmokeUserKeyConfig);
                            metaSmokeUserKeyPromise.then(metaSmokeUserKey => {
                                if (!metaSmokeUserKey) {
                                    if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, call window.resetMetaSmokeConfiguration().')) {
                                        StoreInCache('MetaSmoke.Disabled', true);
                                        reject();
                                        return;
                                    }
                                }

                                window.open(metaSmokeOAuthUrl, '_blank');
                                setTimeout(() => {
                                    const handleFDSCCode = () => {
                                        $(window).off('focus', handleFDSCCode);
                                        const code = window.prompt('Once you\'ve authenticated FDSC with metasmoke, you\'ll be given a code; enter it here.');
                                        if (!code) {
                                            reject();
                                            return;
                                        }
                                        resolve(code);
                                    }
                                    $(window).focus(handleFDSCCode);
                                }, 100);
                            });
                        });
                    });
                })
            }
        }
        this.codeGetter = codeGetter;
        this.appKey = appKey;
        this.appendResetToWindow();

        this.getUserKey(); // Make sure we request it immediately
    }

    public IsDisabled(): Promise<boolean> {
        const disabledConfigPromise = GetFromCache<boolean>(MetaSmokeDisabledConfig);
        return new Promise(resolve => {
            disabledConfigPromise.then(disabledConfig => {
                if (disabledConfig === undefined) {
                    resolve(false);
                    return;
                }
                resolve(disabledConfig);
            })
        });
    }
    public GetFeedback(answerId: number): Promise<MetaSmokeApiItem[]> {
        const isDisabledPromise = this.IsDisabled();
        return new Promise((resolve, reject) => {
            isDisabledPromise.then(disabled => {
                if (disabled) {
                    resolve([]);
                    return;
                }

                GetAndCache(`${MetaSmokeWasReportedConfig}.${answerId}`, () => new Promise(() => {
                    $.ajax({
                        type: 'GET',
                        url: 'https://metasmoke.erwaysoftware.com/api/posts/urls',
                        data: {
                            urls: `//${window.location.hostname}/a/${answerId}`,
                            key: `${this.appKey}`
                        }
                    }).done((result: MetaSmokeApiWrapper) => {
                        debugger;
                        resolve(result.items);
                    }).fail(error => {
                        reject(error);
                    });
                }));
            });
        });
    }

    public Report(answerId: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.getUserKey().then(userKey => {
                $.ajax({
                    type: "POST",
                    url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                    data: {
                        post_link: `//${window.location.hostname}/a/${answerId}`,
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
                    type: "POST",
                    url: "https://metasmoke.erwaysoftware.com/api/w/post/" + metaSmokeId + "/feedback",
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