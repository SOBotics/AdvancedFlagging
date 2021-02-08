declare const GM_xmlhttpRequest: any;

import { ReplaySubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChatApi } from '@userscriptTools/chatapi/ChatApi';
import * as globals from '../../../GlobalVars';

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
    private subject: Subject<CopyPastorFindTargetResponseItem[]>;
    private replaySubject: ReplaySubject<CopyPastorFindTargetResponseItem[]>;

    constructor(private answerId: number, private key: string) {
        this.subject = new Subject<CopyPastorFindTargetResponseItem[]>();
        this.replaySubject = new ReplaySubject<CopyPastorFindTargetResponseItem[]>(1);
        this.subject.subscribe(this.replaySubject);
    }

    public Watch(): Observable<CopyPastorFindTargetResponseItem[]> {
        new Promise<CopyPastorFindTargetResponseItem[]>((resolve, reject) => {
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
        })
        .then(r => this.subject.next(r))
        .catch(err => this.subject.error(err));

        return this.subject;
    }

    public async Promise(): Promise<CopyPastorFindTargetResponseItem[]> {
        return await firstValueFrom(this.replaySubject.pipe(take(1)));
    }

    public async ReportTruePositive() {
        return this.SendFeedback('tp');
    }

    public async ReportFalsePositive() {
        return this.SendFeedback('fp');
    }

    private async SendFeedback(type: 'tp' | 'fp') {
        const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
        const chatApi = new ChatApi();
        const chatId = chatApi.GetChatUserId();
        const results = await this.Promise();

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
