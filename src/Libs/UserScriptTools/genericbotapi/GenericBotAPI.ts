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
        return new Promise<boolean>((resolve, reject) => {
            if (!globals.isStackOverflow()) resolve(false);

            const flaggerName = globals.username;
            if (!flaggerName) return false;

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
    }
}
