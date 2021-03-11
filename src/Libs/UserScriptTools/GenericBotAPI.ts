import { isStackOverflow, username, genericBotKey } from 'GlobalVars';

export class GenericBotAPI {
    private answerId: number;
    public name = 'Generic Bot';

    constructor(answerId: number) {
        this.answerId = answerId;
    }

    public async ReportNaa(): Promise<boolean> {
        return await this.makeTrackRequest();
    }

    public async ReportRedFlag(): Promise<boolean> {
        return await this.makeTrackRequest();
    }

    public ReportLooksFine(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportNeedsEditing(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportVandalism(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportDuplicateAnswer(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportPlagiarism(): Promise<boolean> {
        return Promise.resolve(false);
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
            if (!isStackOverflow) resolve(false);

            const flaggerName = encodeURIComponent(username || '');
            if (!flaggerName) resolve(false);

            const contentHash = this.computeContentHash($(`#answer-${this.answerId} .js-post-body`).html().trim());

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `key=${genericBotKey}&postId=${this.answerId}&contentHash=${contentHash}&flagger=${flaggerName}`,
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
