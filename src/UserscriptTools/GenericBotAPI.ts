import { isStackOverflow, username, genericBotKey, genericBotSuccess, genericBotFailure, FlagTypeFeedbacks } from '../GlobalVars';

export class GenericBotAPI {
    private answerId: number;
    public name: keyof FlagTypeFeedbacks = 'Generic Bot';

    constructor(answerId: number) {
        this.answerId = answerId;
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

    public SendFeedback(trackPost: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (!trackPost) resolve('');

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
                    resolve(genericBotSuccess);
                },
                onerror: () => reject(genericBotFailure)
            });
        });
    }
}
