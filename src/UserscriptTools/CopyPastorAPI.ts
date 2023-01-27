import { ChatApi } from './ChatApi';
import {
    isStackOverflow,
    username,
    getSentMessage,
    FlagTypeFeedbacks,
    debugMode
} from '../shared';
import { getAllPostIds } from './sotools';
import { createBotIcon } from '../AdvancedFlagging';

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

interface CopyPastorData {
    [key: number]: { // key is the sitePostId
        copypastorId: number;
        repost: boolean;
        target_url: string;
    };
}

const copypastorServer = 'https://copypastor.sobotics.org';
const copypastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';

export class CopyPastorAPI {
    private static copypastorIds: Partial<CopyPastorData> = {};

    public name: keyof FlagTypeFeedbacks = 'Guttenberg';
    public copypastorId: number;
    public repost: boolean;
    public targetUrl: string;
    public icon?: HTMLDivElement;

    constructor(
        private readonly answerId: number,
    ) {
        const {
            copypastorId = 0,
            repost = false,
            target_url: targetUrl = ''
        } = CopyPastorAPI.copypastorIds[this.answerId] || {};

        this.copypastorId = copypastorId;
        this.repost = repost;
        this.targetUrl = targetUrl;

        this.icon = this.getIcon();
    }

    public static async getAllCopyPastorIds(): Promise<void> {
        if (!isStackOverflow) return;

        const postUrls = getAllPostIds(false, true); // postIds as URLs excluding questions

        if (!postUrls.length) return; // make sure the array isn't empty

        await this.storeReportedPosts(postUrls as string[]);
    }

    public static storeReportedPosts(postUrls: string[]): Promise<void> {
        const url = `${copypastorServer}/posts/findTarget?url=${postUrls.join(',')}`;

        return new Promise<void>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
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
                onerror: () => reject()
            });
        });
    }

    public sendFeedback(feedback: string): Promise<string> {
        const chatId = new ChatApi().getChatUserId();

        if (!this.copypastorId) {
            return Promise.resolve('');
        }

        const successMessage = getSentMessage(true, feedback, this.name);
        const failureMessage = getSentMessage(false, feedback, this.name);

        const payload = {
            post_id: this.copypastorId,
            feedback_type: feedback,
            username,
            link: `//chat.stackoverflow.com/users/${chatId}`,
            key: copypastorKey,
        };
        const data = Object
            .entries(payload)
            .map(item => item.join('='))
            .join('&');

        return new Promise<string>((resolve, reject) => {
            const url = `${copypastorServer}/feedback/create`;

            if (debugMode) {
                console.log('Feedback to Guttenberg via', url, data);

                reject('Didn\'t send feedback: debug mode');
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
                        ? resolve(successMessage)
                        : reject(failureMessage);
                },
                onerror: () => reject(failureMessage)
            });
        });
    }

    private getIcon(): HTMLDivElement | undefined {
        if (!this.copypastorId) return;

        const icon = createBotIcon(
            'Guttenberg',
            `${copypastorServer}/posts/${this.copypastorId}`
        );

        return icon;
    }
}
