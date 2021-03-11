import { ChatApi } from '@userscriptTools/ChatApi';
import { isStackOverflow, getAllPostIds, copyPastorServer, username, copyPastorKey } from 'GlobalVars';

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
        return new Promise<void>((resolve, reject) => {
            const url = `${copyPastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
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

    private async ReportTruePositive(): Promise<boolean> {
        return await this.SendFeedback('tp');
    }

    private async ReportFalsePositive(): Promise<boolean> {
        return await this.SendFeedback('fp');
    }

    public async ReportNaa(): Promise<boolean> {
        return await this.ReportFalsePositive();
    }

    public ReportRedFlag(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public async ReportLooksFine(): Promise<boolean> {
        return await this.ReportFalsePositive();
    }

    public async ReportNeedsEditing(): Promise<boolean> {
        return await this.ReportFalsePositive();
    }

    public async ReportVandalism(): Promise<boolean> {
        return await this.ReportFalsePositive();
    }

    public async ReportDuplicateAnswer(): Promise<boolean> {
        return await this.ReportTruePositive();
    }

    public async ReportPlagiarism(): Promise<boolean> {
        return await this.ReportTruePositive();
    }

    private SendFeedback(type: 'tp' | 'fp'): Promise<boolean> {
        const chatId = new ChatApi().GetChatUserId();
        const copyPastorId = this.getCopyPastorId();
        if (!copyPastorId) return Promise.resolve(false);

        const payload = {
            post_id: copyPastorId,
            feedback_type: type,
            username,
            link: `https://chat.stackoverflow.com/users/${chatId}`,
            key: copyPastorKey,
        };

        return new Promise<boolean>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${copyPastorServer}/feedback/create`,
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
