import {
    isStackOverflow,
    username,
    FlagTypeFeedbacks
} from '../shared';

const genericBotKey = 'Cm45BSrt51FR3ju';
const genericBotSuccess = 'Post tracked with Generic Bot';
const genericBotFailure = 'Server refused to track the post';

export class GenericBotAPI {
    private readonly answerId: number;
    public name: keyof FlagTypeFeedbacks = 'Generic Bot';

    constructor(answerId: number) {
        this.answerId = answerId;
    }

    // Ask Floern what this does
    // https://github.com/SOBotics/Userscripts/blob/master/GenericBot/flagtracker.user.js#L32-L40
    private computeContentHash(postContent: string): number {
        if (!postContent) return 0;

        let hash = 0;
        for (let i = 0; i < postContent.length; ++i) {
            hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
            hash = hash & hash;
        }

        return hash;
    }

    public sendFeedback(trackPost: string): Promise<string> {
        const flaggerName = encodeURIComponent(username || '');

        if (!trackPost || !isStackOverflow || !flaggerName) {
            return Promise.resolve('');
        }

        const answer = document.querySelector(`#answer-${this.answerId} .js-post-body`);
        const answerBody = answer?.innerHTML.trim() || '';
        const contentHash = this.computeContentHash(answerBody);

        const payload = {
            key: genericBotKey,
            postId: this.answerId,
            contentHash,
            flagger: flaggerName,
        };
        const data = Object
            .entries(payload)
            .map(item => item.join('='))
            .join('&');

        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data,
                onload: ({ status, response }) => {
                    if (status !== 200) {
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
