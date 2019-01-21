declare const GM_xmlhttpRequest: any;

import { ReplaySubject, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChatApi } from '@userscriptTools/chatapi/ChatApi';
import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';

const copyPastorServer = 'https://copypastor.sobotics.org';

const soboticsRoomId = 111347;

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
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        GreaseMonkeyCache.GetAndCache(`CopyPastor.FindTarget.${this.answerId}`, () => new Promise<CopyPastorFindTargetResponseItem[]>((resolve, reject) => {
            const url = `${copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${this.answerId}`;
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response: any) => {
                    const responseObject = JSON.parse(response.responseText) as CopyPastorFindTargetResponse;
                    if (responseObject.status === 'success') {
                        resolve(responseObject.posts);
                    } else {
                        reject(responseObject.message);
                    }
                },
                onerror: (response: any) => {
                    reject(response);
                },
            });
        }), expiryDate)
            .then(r => this.subject.next(r))
            .catch(err => this.subject.error(err));

        return this.subject;
    }

    public Promise(): Promise<CopyPastorFindTargetResponseItem[]> {
        return this.replaySubject.pipe(take(1)).toPromise();
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
        const chatId = await chatApi.GetChatUserId(soboticsRoomId);
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
                const payloadString = JSON.stringify(payload);
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${copyPastorServer}/feedback/create`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data:
                        'post_id=' + payload.post_id
                        + '&feedback_type=' + payload.feedback_type
                        + '&username=' + payload.username
                        + '&link=' + payload.link
                        + '&key=' + payload.key,
                    onload: (response: any) => {
                        if (response.status !== 200) {
                            reject(JSON.parse(response.responseText));
                        } else {
                            resolve(true);
                        }
                    },
                    onerror: (response: any) => {
                        reject(response);
                    },
                });
            });
        });
        const allResults = await Promise.all(promises);
        if (allResults.length <= 0) {
            return false;
        }
        for (let i = 0; i < allResults.length; i++) {
            if (!allResults[i]) {
                return false;
            }
        }
        return true;
    }
}
