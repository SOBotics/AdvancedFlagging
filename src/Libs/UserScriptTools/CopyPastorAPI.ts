import { ChatApi } from '@userscriptTools/ChatApi';
import * as globals from '../../GlobalVars';
import { getAllAnswerIds } from '@userscriptTools/sotools';

export interface CopyPastorFindTargetResponseItem {
    post_id: string;
    target_url: string;
    repost: boolean;
    original_url: string;
}

export type CopyPastorFindTargetResponse = {
    status: 'success';
    posts: CopyPastorFindTargetResponseItem[];
} | {
    status: 'failure';
    message: string;
};

export class CopyPastorAPI {
    private static copyPastorIds: { postId: number, repost: boolean, target_url: string }[] = [];
    private answerId?: number;

    constructor(id?: number) {
        this.answerId = id;
    }

    public static async getAllCopyPastorIds(): Promise<void> {
        if (!globals.isStackOverflow()) return;

        const answerIds = getAllAnswerIds();
        await this.storeReportedPosts(answerIds);
    }

    private static storeReportedPosts(postIds: number[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const answerUrls = postIds.map(postId => `//${window.location.hostname}/a/${postId}`).join(',');
            const url = `${globals.copyPastorServer}/posts/findTarget?url=${answerUrls}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: { responseText: string }) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    if (responseObject.status === 'failure') return;
                    responseObject.posts.forEach(item => {
                        this.copyPastorIds.push({ postId: Number(item.post_id), repost: item.repost, target_url: item.target_url });
                    });
                    resolve();
                },
                onerror: () => {
                    reject();
                },
            });
        });
    }

    public getCopyPastorId(): number {
        const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
        return idsObject ? idsObject.postId : 0;
    }

    public getIsRepost(): boolean {
        const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
        return idsObject ? idsObject.repost : false;
    }

    public getTargetUrl(): string {
        const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
        return idsObject ? idsObject.target_url : '';
    }

    public async ReportTruePositive(): Promise<boolean> {
        return await this.SendFeedback('tp');
    }

    public async ReportFalsePositive(): Promise<boolean> {
        return await this.SendFeedback('fp');
    }

    private async SendFeedback(type: 'tp' | 'fp'): Promise<boolean> {
        const username = globals.username;
        const chatId = new ChatApi().GetChatUserId();
        const copyPastorId = this.getCopyPastorId();
        if (!copyPastorId) return false;

        const payload = {
            post_id: copyPastorId,
            feedback_type: type,
            username,
            link: `https://chat.stackoverflow.com/users/${chatId}`,
            key: globals.copyPastorKey,
        };

        return await new Promise<boolean>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${globals.copyPastorServer}/feedback/create`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: Object.entries(payload).map(item => item.join('=')).join('&'),
                onload: (response: { status: number }) => {
                    response.status === 200 ? resolve(true) : reject(false);
                },
                onerror: () => {
                    reject(false);
                },
            });
        });
    }
}
