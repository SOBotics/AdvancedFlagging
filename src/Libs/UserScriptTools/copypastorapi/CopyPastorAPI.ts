import { ChatApi } from '@userscriptTools/chatapi/ChatApi';
import * as globals from '../../../GlobalVars';

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
    private answerId: number;
    private key: string;

    constructor(id: number, serverKey: string) {
        this.answerId = id;
        this.key = serverKey;
    }

    public postReportedPromise(): Promise<CopyPastorFindTargetResponseItem[]> {
        return new Promise<CopyPastorFindTargetResponseItem[]>((resolve, reject) => {
            const url = `${globals.copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${this.answerId}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: any) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    responseObject.status === 'success' ? resolve(responseObject.posts) : reject(responseObject.message);
                },
                onerror: (response: any) => {
                    reject(response);
                },
            });
        });
    }

    public async ReportTruePositive() {
        return await this.SendFeedback('tp');
    }

    public async ReportFalsePositive() {
        return await this.SendFeedback('fp');
    }

    private async SendFeedback(type: 'tp' | 'fp') {
        const username = globals.username;
        const chatApi = new ChatApi();
        const chatId = chatApi.GetChatUserId();
        const results = await this.postReportedPromise();

        const payloads = results.map(result => {
            const postId = result.post_id;
            const payload = {
                post_id: postId,
                feedback_type: type,
                username,
                link: `https://chat.stackoverflow.com/users/${chatId}`,
                key: this.key,
            };
            return payload;
        });

        const promises = payloads.map(payload => {
            return new Promise<boolean>((resolve, reject) => {
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
        });

        const allResults = await Promise.all(promises);
        if (!allResults.length) return false;
        return allResults.every(result => result);
    }
}
