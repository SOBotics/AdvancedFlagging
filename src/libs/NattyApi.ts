declare const $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

import { GetAndCache, StoreInCache } from './Caching';
import { ChatApi } from './ChatApi';
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/take';
import { IsStackOverflow } from './FunctionUtils';

const nattyFeedbackUrl = 'http://samserver.bhargavrao.com:8000/napi/api/feedback';

export interface NattyFeedbackItemInfo {
    timestamp: number;
    naaValue: number;
    bodyLength: number;
    reputation: number;
    reasons: { reasonName: string }[];
    link: string;
    name: string;
    type: 'None' | 'True Positive' | 'False Positive' | 'Needs Editing'
}
export interface NattyFeedbackInfo {
    items: [null] | NattyFeedbackItemInfo[];
    message: 'success'
}

const soboticsRoomId = 111347;

export class NattyAPI {
    private chat: ChatApi = new ChatApi();
    private answerId: number;
    private subject: Subject<boolean>;
    private replaySubject: ReplaySubject<boolean>;

    constructor(answerId: number) {
        this.answerId = answerId;
    }

    public Watch(): Observable<boolean> {
        this.subject = new Subject<boolean>();
        this.replaySubject = new ReplaySubject<boolean>(1);
        this.subject.subscribe(this.replaySubject);

        if (IsStackOverflow()) {
            GetAndCache(`NattyApi.Feedback.${this.answerId}`, () => new Promise<boolean>((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${nattyFeedbackUrl}/${this.answerId}`,
                    onload: (response: any) => {
                        const nattyResult = JSON.parse(response.responseText);
                        if (nattyResult.items && nattyResult.items[0]) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    },
                    onerror: (response: any) => {
                        reject(response);
                    },
                });
            }))
                .then(r => this.subject.next(r))
                .catch(err => this.subject.error(err));
        }

        return this.subject;
    }

    public async ReportNaa(answerDate: Date, questionDate: Date) {
        if (!IsStackOverflow()) {
            return false;
        }
        if (await this.WasReported()) {
            await this.chat.SendMessage(soboticsRoomId, `@Natty feedback http://stackoverflow.com/a/${this.answerId} tp`)
            return true;
        } else {
            const answerAge = this.DaysBetween(answerDate, new Date());
            const daysPostedAfterQuestion = this.DaysBetween(questionDate, answerDate);
            if (answerAge > 30 || daysPostedAfterQuestion < 30) {
                return false;
            }

            const promise = this.chat.SendMessage(soboticsRoomId, `@Natty report http://stackoverflow.com/a/${this.answerId}`);
            await promise.then(() => {
                StoreInCache(`NattyApi.Feedback.${this.answerId}`, true);
                this.subject.next(true);
            });
            return true;
        }
    }
    public async ReportRedFlag() {
        if (!IsStackOverflow()) {
            return false;
        }
        if (await this.WasReported()) {
            await this.chat.SendMessage(soboticsRoomId, `@Natty feedback http://stackoverflow.com/a/${this.answerId} tp`)
            return true;
        }
        return false;
    }
    public async ReportLooksFine() {
        if (!IsStackOverflow()) {
            return false;
        }
        if (await this.WasReported()) {
            await this.chat.SendMessage(soboticsRoomId, `@Natty feedback http://stackoverflow.com/a/${this.answerId} fp`)
            return true;
        }
        return false;
    }
    public async ReportNeedsEditing() {
        if (!IsStackOverflow()) {
            return false;
        }
        if (await this.WasReported()) {
            await this.chat.SendMessage(soboticsRoomId, `@Natty feedback http://stackoverflow.com/a/${this.answerId} ne`);
            return true;
        }
        return false;
    }

    private async WasReported() {
        return await this.replaySubject.take(1).toPromise();
    }

    private DaysBetween(first: Date, second: Date) {
        return Math.round((<any>second - <any>first) / (1000 * 60 * 60 * 24));
    }
}
