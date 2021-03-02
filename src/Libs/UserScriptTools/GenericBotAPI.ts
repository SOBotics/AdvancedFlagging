import * as globals from '../../GlobalVars';

export class GenericBotAPI {
    private answerId: number;

    constructor(answerId: number) {
        this.answerId = answerId;
    }

    public async ReportNaa(): Promise<boolean> {
        const response = await this.makeTrackRequest();
        return response;
    }

    public async ReportRedFlag(): Promise<boolean> {
        const response = await this.makeTrackRequest();
        return response;
    }

    private computeContentHash(postContent: string): number {
        if (!postContent) return 0;

        let hash = 0;
        for (let i = 0; i < postContent.length; ++i) {
            hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
            hash = hash & hash;
        }

        return hash;
    }

    private makeTrackRequest(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!globals.isStackOverflow()) resolve(false);

            const flaggerName = encodeURIComponent(globals.username || '');
            if (!flaggerName) resolve(false);

            const contentHash = this.computeContentHash($(`#answer-${this.answerId} .js-post-body`).html().trim());

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `key=${globals.genericBotKey}&postId=${this.answerId}&contentHash=${contentHash}&flagger=${flaggerName}`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onload: (response: { status: number }) => {
                    if (response.status !== 200) reject(false);
                    resolve(true);
                },
                onerror: () => {
                    reject(false);
                }
            });
        });
    }
}
