import { ChatApi } from '@userscriptTools/ChatApi';
import { isStackOverflow, getAllPostIds, copyPastorServer, username, copyPastorKey, getSentMessage } from 'GlobalVars';

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
    public name = 'Guttenberg';

    constructor(id: number) {
        this.answerId = id;
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
                        this.copyPastorIds.push({ postId: Number(item.post_id), repost: item.repost, target_url: item.target_url });
                    });
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }

    public getCopyPastorId(): number {
        return CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId)?.postId || 0;
    }

    public getIsRepost(): boolean {
        return CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId)?.repost || false;
    }

    public getTargetUrl(): string {
        return CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId)?.target_url || '';
    }

    private async ReportTruePositive(): Promise<string> {
        return await this.SendFeedback('tp');
    }

    private async ReportFalsePositive(): Promise<string> {
        return await this.SendFeedback('fp');
    }

    public async ReportNaa(): Promise<string> {
        return await this.ReportFalsePositive();
    }

    public ReportRedFlag(): Promise<string> {
        return Promise.resolve('');
    }

    public async ReportLooksFine(): Promise<string> {
        return await this.ReportFalsePositive();
    }

    public async ReportNeedsEditing(): Promise<string> {
        return await this.ReportFalsePositive();
    }

    public async ReportVandalism(): Promise<string> {
        return await this.ReportFalsePositive();
    }

    public async ReportDuplicateAnswer(): Promise<string> {
        return await this.ReportTruePositive();
    }

    public async ReportPlagiarism(): Promise<string> {
        return await this.ReportTruePositive();
    }

    private SendFeedback(type: 'tp' | 'fp'): Promise<string> {
        const chatId = new ChatApi().GetChatUserId();
        const copyPastorId = this.getCopyPastorId();
        if (!copyPastorId) return Promise.resolve('');

        const successMessage = getSentMessage(true, type, this.name);
        const failureMessage = getSentMessage(false, type, this.name);
        const payload = {
            post_id: copyPastorId,
            feedback_type: type,
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
