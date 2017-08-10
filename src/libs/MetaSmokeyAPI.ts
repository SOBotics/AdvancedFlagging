import { GetFromCache, StoreInCache, GetAndCache } from './FunctionUtils';
const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
const MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';

export class MetaSmokeyAPI {
    private codeGetter: (metaSmokeOAuthUrl: string) => Promise<string>;
    private appKey: string;

    private getUserKey() {
        const promise = this.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${this.appKey}`);
        promise.then(code => {
            StoreInCache(MetaSmokeUserKeyConfig, code);
        });
        return promise;
    }

    private appendResetToWindow() {
        if (!localStorage) { return; }

        let scriptNode = document.createElement('script');
        scriptNode.type = 'text/javascript';
        scriptNode.textContent = `
    window.resetMetaSmokeConfiguration = function() {
        localStorage.setItem('${MetaSmokeDisabledConfig}', undefined); 
        localStorage.setItem('${MetaSmokeUserKeyConfig}', undefined);
    }
    `;

        var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        target.appendChild(scriptNode);
    }

    public constructor(appKey: string, codeGetter?: (metaSmokeOAuthUrl: string) => Promise<string>) {
        if (!codeGetter) {
            codeGetter = (metaSmokeOAuthUrl: string) => {
                return new Promise((resolve, reject) => {
                    if (this.IsDisabled()) {
                        reject();
                    }

                    const cachedUserKey = GetFromCache<string>(MetaSmokeUserKeyConfig);
                    if (cachedUserKey) {
                        resolve(cachedUserKey);
                        return;
                    }

                    const metaSmokeUserKey = GetFromCache<string>(MetaSmokeUserKeyConfig);
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
                })
            }
        }
        this.codeGetter = codeGetter;
        this.appKey = appKey;
        this.appendResetToWindow();
    }

    public IsDisabled() {
        const disabledConfig = GetFromCache<boolean>(MetaSmokeDisabledConfig);
        if (disabledConfig === undefined) {
            return false;
        }
        return disabledConfig;
    }
    public WasReported(answerId: number): Promise<boolean> {
        if (this.IsDisabled()) {
            return Promise.resolve(false);
        }

        return GetAndCache(`${MetaSmokeWasReportedConfig}.${answerId}`, () => new Promise((resolve, reject) => {
            $.ajax({
                url: `https://metasmoke.erwaysoftware.com/api/posts/urls?urls=//${window.location.hostname}/a/${answerId}&key=${this.appKey}`,
                type: 'GET'
            }).done(result => {
                if (result.items.length > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }).fail(error => {
                reject(error);
            });
        }));
    }

    public Report(answerId: number) {
        console.log(`Would report '${answerId}' to ms`);
    }
    public ReportTruePositive(answerId: number) {
        console.log(`Would send tp feedback for '${answerId}' to ms`);
    }
    public ReportNAA(answerId: number) {
        console.log(`Would send naa feedback for '${answerId}' to ms`);
    }
}