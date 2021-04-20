import { ChatApi } from './ChatApi';
import { isStackOverflow, copyPastorServer, username, copyPastorKey, getSentMessage, FlagTypeFeedbacks } from '../GlobalVars';
import { getAllPostIds } from './sotools';

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
    }
}

export class CopyPastorAPI {
    private static copyPastorIds: CopyPastorData = {};

    public name: keyof FlagTypeFeedbacks = 'Guttenberg';
    public copypastorId: number;
    public repost: boolean;
    public targetUrl: string;
    private answerId: number;

    constructor(id: number) {
        this.answerId = id;
        this.copypastorId = CopyPastorAPI.copyPastorIds[this.answerId]?.copypastorId || 0;
        this.repost = CopyPastorAPI.copyPastorIds[this.answerId]?.repost || false;
        this.targetUrl = CopyPastorAPI.copyPastorIds[this.answerId]?.target_url || '';
    }

    public static async getAllCopyPastorIds(): Promise<void> {
        if (!isStackOverflow) return;

        const postUrls = getAllPostIds(false, true);
        await this.storeReportedPosts(postUrls as string[]);
    }

    private static storeReportedPosts(postUrls: string[]): Promise<void> {
        const url = `${copyPastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
        return new Promise<void>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: { responseText: string }) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    if (responseObject.status === 'failure') return;
                    responseObject.posts.forEach(item => {
                        const sitePostId = Number(/\d+/.exec(item.target_url)?.[0]);
                        this.copyPastorIds[sitePostId] = {
                            copypastorId: Number(item.post_id),
                            repost: item.repost,
                            target_url: item.target_url
                        };
                    });
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }

    public SendFeedback(feedback: string): Promise<string> {
        const chatId = new ChatApi().GetChatUserId();
        if (!this.copypastorId) return Promise.resolve('');

        const successMessage = getSentMessage(true, feedback, this.name);
        const failureMessage = getSentMessage(false, feedback, this.name);
        const payload = {
            post_id: this.copypastorId,
            feedback_type: feedback,
            username,
            link: `https://chat.stackoverflow.com/users/${chatId}`,
            key: copyPastorKey,
        };

        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${copyPastorServer}/feedback/create`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: Object.entries(payload).map(item => item.join('=')).join('&'),
                onload: (response: { status: number }) => {
                    response.status === 200 ? resolve(successMessage) : reject(failureMessage);
                },
                onerror: () => reject(failureMessage)
            });
        });
    }
}
