import { IsStackOverflow } from '@userscriptTools/sotools/sotools';

declare const $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

const genericBotKey = 'Cm45BSrt51FR3ju';

export class GenericBotAPI {
    private answerId: number;

    constructor(answerId: number) {
        this.answerId = answerId;
    }

    public async ReportNaa() {
        const response = await this.makeTrackRequest();
        return response;
    }
    public async ReportRedFlag() {
        const response = await this.makeTrackRequest();
        return response;
    }
    public async ReportLooksFine() {
        return false;
    }
    public async ReportNeedsEditing() {
        return false;
    }

    private computeContentHash(postContent: string) {
        if (!postContent) {
            return 0;
        }
        let hash = 0;
        for (let i = 0; i < postContent.length; ++i) {
            hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    }

    private makeTrackRequest() {
        const promise = new Promise<boolean>((resolve, reject) => {
            if (!IsStackOverflow()) {
                resolve(false);
            }
            if ($('#answer-' + this.answerId + ' .post-text').length === 0) {
                resolve(false);
            }
            if ($('.top-bar .my-profile .gravatar-wrapper-24').length === 0) {
                reject('Flag Tracker: Could not find username.');
            }

            const flaggerName = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
            const contentHash = this.computeContentHash($('#answer-' + this.answerId + ' .post-text').html().trim());

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `key=${genericBotKey}`
                    + '&postId=' + this.answerId
                    + '&contentHash=' + contentHash
                    + '&flagger=' + encodeURIComponent(flaggerName),
                onload: (response: any) => {
                    if (response.status !== 200) {
                        reject('Flag Tracker Error: Status ' + response.status);
                    }
                    resolve(true);
                },
                onerror: (response: any) => {
                    reject('Flag Tracker Error: ' + response.responseText);
                }
            });
        });

        return promise;
    }
}
