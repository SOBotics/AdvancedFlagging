import { username, AllFeedbacks } from '../shared';
import Page from './Page';
import Reporter from './Reporter';
import { Store } from './Store';

const genericBotKey = 'Cm45BSrt51FR3ju';
const genericBotSuccess = 'Post tracked with Generic Bot';
const genericBotFailure = 'Server refused to track the post';

export class GenericBotAPI extends Reporter {
    private readonly deleted: boolean;

    constructor(id: number, deleted: boolean) {
        super('Generic Bot', id);

        this.deleted = deleted;
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

    public override sendFeedback(trackPost: string): Promise<string> {
        const flaggerName = encodeURIComponent(username || '');

        if (!trackPost || !Page.isStackOverflow || !flaggerName) {
            return Promise.resolve('');
        }

        const answer = document.querySelector(`#answer-${this.id} .js-post-body`);
        const answerBody = answer?.innerHTML.trim() || '';
        const contentHash = this.computeContentHash(answerBody);

        const url = 'https://so.floern.com/api/trackpost.php';
        const payload = {
            key: genericBotKey,
            postId: this.id,
            contentHash,
            flagger: flaggerName,
        };
        const data = Object
            .entries(payload)
            .map(item => item.join('='))
            .join('&');

        if (Store.dryRun) {
            console.log('Track post via', url, payload);

            return Promise.resolve('');
        }

        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
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

    public override showOnPopover(): boolean {
        // Generic Bot only works on SO
        return Page.isStackOverflow;
    }

    public override canSendFeedback(feedback: AllFeedbacks): boolean {
        return feedback === 'track' && !this.deleted && Page.isStackOverflow;
    }
}
