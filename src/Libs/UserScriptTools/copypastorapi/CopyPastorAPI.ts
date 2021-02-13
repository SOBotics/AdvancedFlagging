import { ChatApi } from '@userscriptTools/chatapi/ChatApi';
import * as globals from '../../../GlobalVars';
import { getAllAnswerIds } from '@userscriptTools/sotools/sotools';

declare const GM_xmlhttpRequest: any;

export interface CopyPastorFindTargetResponseItem {
    post_id: string;
    target_url: string;
}

export type CopyPastorFindTargetResponse = {
    status: 'success';
    posts: CopyPastorFindTargetResponseItem[];
} | {
    status: 'failure';
    message: string;
};

export class CopyPastorAPI {
    private static copyPastorIds: { postId: number, copypastorObject: CopyPastorFindTargetResponseItem, repost: boolean }[] = [];
    private answerId?: number;

    constructor(id?: number) {
        this.answerId = id;
    }

    public static async getAllCopyPastorIds() {
        if (!globals.isStackOverflow()) return;

        const answerIds = getAllAnswerIds();
        for (const answerId of answerIds) {
            const copypastorObject = await this.isPostReported(answerId);
            const isReportOrPlagiarism = copypastorObject && copypastorObject.post_id
                ? await this.getIsReportOrPlagiarism(copypastorObject.post_id)
                : false;
            this.copyPastorIds.push({ postId: answerId, copypastorObject: copypastorObject, repost: isReportOrPlagiarism });
        }
    }

    private static getIsReportOrPlagiarism(answerId: string) {
        return new Promise<boolean>(resolve => {
            if (!answerId) resolve(false);
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${globals.copyPastorServer}/posts/${answerId}`,
                onload: (response: any) => {
                    const responseParsed = $(response.responseText);
                    resolve(!!responseParsed.text().match('Reposted'));
                },
                onerror: () => {
                    resolve(false);
                },
            });
        });
    }

    private static isPostReported(postId: number): Promise<CopyPastorFindTargetResponseItem> {
        return new Promise<CopyPastorFindTargetResponseItem>((resolve, reject) => {
            const url = `${globals.copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${postId}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: any) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    resolve(responseObject.status === 'success' ? (responseObject.posts[0] || {}) : {} as any);
                },
                onerror: () => {
                    reject(false);
                },
            });
        });
    }

    public getCopyPastorObject() {
        const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
        return idsObject ? idsObject.copypastorObject : 0;
    }

    public getCopyPastorId() {
        const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
        return idsObject ? idsObject.postId : 0;
    }

    public getIsRepost() {
        const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
        return idsObject ? idsObject.repost : false;
    }

    public async ReportTruePositive() {
        return await this.SendFeedback('tp');
    }

    public async ReportFalsePositive() {
        return await this.SendFeedback('fp');
    }

    private async SendFeedback(type: 'tp' | 'fp') {
        const username = globals.username;
        const chatId = new ChatApi().GetChatUserId();
        const copyPastorObject = this.getCopyPastorObject();
        if (!copyPastorObject || !copyPastorObject.post_id) return false;

        const payload = {
            post_id: copyPastorObject.post_id,
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
                data:
                    'post_id=' + payload.post_id
                    + '&feedback_type=' + payload.feedback_type
                    + '&username=' + payload.username
                    + '&link=' + payload.link
                    + '&key=' + payload.key,
                onload: (response: any) => {
                    response.status === 200 ? resolve(true) : reject(JSON.parse(response.responseText));
                },
                onerror: (response: any) => {
                    reject(response);
                },
            });
        });
    }
}
