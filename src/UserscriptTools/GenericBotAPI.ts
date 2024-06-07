import { username, AllFeedbacks } from '../shared';
import Page from './Page';
import Reporter from './Reporter';
import { Store } from './Store';

export class GenericBotAPI extends Reporter {
    private readonly key = 'Cm45BSrt51FR3ju';

    constructor(
        id: number,
        private readonly deleted: boolean
    ) {
        super('Generic Bot', id);
    }

    public override sendFeedback(trackPost: string): Promise<void> {
        const flaggerName = encodeURIComponent(username || '');

        if (!trackPost) return Promise.resolve();

        const answer = document.querySelector(`#answer-${this.id} .js-post-body`);
        const answerBody = answer?.innerHTML.trim() ?? '';
        const contentHash = this.computeContentHash(answerBody);

        const url = 'https://so.floern.com/api/trackpost.php';
        const payload = {
            key: this.key,
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

            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
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
                        reject();
                    }

                    resolve();
                },
                onerror: () => reject()
            });
        });
    }

    public override showOnPopover(): boolean {
        // Generic Bot only works on SO
        return Page.isStackOverflow;
    }

    public override canSendFeedback(feedback: AllFeedbacks): boolean {
        return feedback === 'track'
            && !this.deleted // can't track deleted posts
            && Page.isStackOverflow // only SO posts can be tracked
            && Boolean(username); // in case username isn't found for some reason
    }

    public override getProgressMessage(feedback: string): string {
        return feedback
            ? 'Tracking post with Generic Bot'
            : '';
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
}
