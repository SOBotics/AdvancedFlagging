import { ChatApi } from './ChatApi';
import { username, AllFeedbacks } from '../shared';
import { displayToaster, page } from '../AdvancedFlagging';
import { Store } from './Store';
import Reporter from './Reporter';
import Page from './Page';

interface CopyPastorFindTargetResponseItem {
    post_id: string;
    target_url: string;
    repost: boolean;
    original_url: string;
}

type CopyPastorFindTargetResponse = {
    status: 'success';
    posts: CopyPastorFindTargetResponseItem[];
} | {
    status: 'failure';
    message: string;
};

// key is the sitePostId
type CopyPastorData = Record<number, {
    copypastorId: number;
    repost: boolean;
    target_url: string;
}>;

export class CopyPastorAPI extends Reporter {
    public copypastorId: number;
    public repost: boolean;
    public targetUrl: string;

    private static readonly copypastorIds: Partial<CopyPastorData> = {};
    private static readonly key = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
    private static readonly server = 'https://copypastor.sobotics.org';

    constructor(id: number) {
        super('Guttenberg', id);

        const {
            copypastorId = 0,
            repost = false,
            target_url: targetUrl = ''
        } = CopyPastorAPI.copypastorIds[this.id] ?? {};

        this.copypastorId = copypastorId;
        this.repost = repost;
        this.targetUrl = targetUrl;
    }

    public static async getAllCopyPastorIds(): Promise<void> {
        if (!Page.isStackOverflow) return;

        const postUrls = page.getAllPostIds(false, true); // postIds as URLs excluding questions

        if (!postUrls.length) return; // make sure the array isn't empty

        try {
            await this.storeReportedPosts(postUrls as string[]);
        } catch (error) {
            displayToaster('Could not connect to CopyPastor.', 'danger');
            console.error(error);
        }
    }

    public static storeReportedPosts(postUrls: string[]): Promise<void> {
        const url = `${this.server}/posts/findTarget?url=${postUrls.join(',')}`;

        return new Promise<void>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                timeout: 1500,
                onload: ({ responseText }) => {
                    const response = JSON.parse(responseText) as CopyPastorFindTargetResponse;

                    if (response.status === 'failure') return;

                    response.posts.forEach(item => {
                        const {
                            post_id: postId,
                            target_url: targetUrl,
                            original_url: originalUrl,
                            repost,
                        } = item;

                        const id = /\d+/.exec(originalUrl)?.[0];
                        const sitePostId = Number(id);

                        this.copypastorIds[sitePostId] = {
                            copypastorId: Number(postId),
                            repost,
                            target_url: targetUrl
                        };
                    });
                    resolve();
                },
                onerror: error => reject(error),
                ontimeout: () => reject('Request timed out')
            });
        });
    }

    public override sendFeedback(feedback: string): Promise<void> {
        const chatId = new ChatApi().getChatUserId();

        const payload = {
            post_id: this.copypastorId,
            feedback_type: feedback,
            username,
            link: `//chat.stackoverflow.com/users/${chatId}`,
            key: CopyPastorAPI.key,
        };
        const data = Object
            .entries(payload)
            .map(item => item.join('='))
            .join('&');

        return new Promise<void>((resolve, reject) => {
            const url = `${CopyPastorAPI.server}/feedback/create`;

            if (Store.dryRun) {
                console.log('Feedback to Guttenberg via', url, data);
                resolve();
            }

            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data,
                onload: ({ status }) => {
                    status === 200
                        ? resolve()
                        : reject();
                },
                onerror: () => reject()
            });
        });
    }

    public override canBeReported(): boolean {
        return false;
    }

    public override wasReported(): boolean {
        // post was reported if copypastorId is not falsy
        return Boolean(this.copypastorId);
    }

    public override canSendFeedback(feedback: AllFeedbacks): boolean {
        return this.wasReported() && Boolean(feedback);
    }

    public override getIcon(): HTMLDivElement {
        return this.createBotIcon(
            this.copypastorId
                ? `${CopyPastorAPI.server}/posts/${this.copypastorId}`
                : ''
        );
    }
}
