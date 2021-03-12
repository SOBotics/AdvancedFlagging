import { isStackOverflow, username, genericBotKey, getSentMessage, genericBotFailure } from 'GlobalVars';

export class GenericBotAPI {
    private answerId: number;
    public name = 'Generic Bot';

    constructor(answerId: number) {
        this.answerId = answerId;
    }

    public async ReportNaa(): Promise<string> {
        return await this.makeTrackRequest();
    }

    public async ReportRedFlag(): Promise<string> {
        return await this.makeTrackRequest();
    }

    public ReportLooksFine(): Promise<string> {
        return Promise.resolve('');
    }

    public ReportNeedsEditing(): Promise<string> {
        return Promise.resolve('');
    }

    public ReportVandalism(): Promise<string> {
        return Promise.resolve('');
    }

    public ReportDuplicateAnswer(): Promise<string> {
        return Promise.resolve('');
    }

    public ReportPlagiarism(): Promise<string> {
        return Promise.resolve('');
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

    private makeTrackRequest(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const flaggerName = encodeURIComponent(username || '');
            if (!isStackOverflow || !flaggerName) resolve('');

            const contentHash = this.computeContentHash($(`#answer-${this.answerId} .js-post-body`).html().trim());

            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `key=${genericBotKey}&postId=${this.answerId}&contentHash=${contentHash}&flagger=${flaggerName}`,
                onload: (response: { status: number }) => {
                    if (response.status !== 200) {
                        console.error('Failed to send track request.', response);
                        reject(genericBotFailure);
                    }
                    resolve(getSentMessage(true, '', this.name));
                },
                onerror: () => reject(genericBotFailure)
            });
        });
    }
}
