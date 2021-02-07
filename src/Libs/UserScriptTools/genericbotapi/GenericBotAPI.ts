import { IsStackOverflow } from '@userscriptTools/sotools/sotools';
import * as globals from '../../../GlobalVars';

declare const $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

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
        if (!postContent) return 0;

        let hash = 0;
        for (let i = 0; i < postContent.length; ++i) {
            hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
            hash = hash & hash;
        }

        return hash;
    }

    private makeTrackRequest() {
        const promise = new Promise<boolean>((resolve, reject) => {
            if (!IsStackOverflow() || !$('#answer-' + this.answerId + ' .js-post-body').length) {
                resolve(false);
            }

            if (!$('.top-bar .my-profile .gravatar-wrapper-24').length) {
                reject('Flag Tracker: Could not find username.');
            }

            const flaggerName = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
            const contentHash = this.computeContentHash($('#answer-' + this.answerId + ' .js-post-body').html().trim());

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `key=${globals.genericBotKey}`
                    + '&postId=' + this.answerId
                    + '&contentHash=' + contentHash
                    + '&flagger=' + encodeURIComponent(flaggerName),
                onload: (response: any) => {
                    if (response.status !== 200) reject('Flag Tracker Error: Status ' + response.status);
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
