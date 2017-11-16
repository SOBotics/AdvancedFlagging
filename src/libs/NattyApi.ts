declare const  $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

import { GetAndCache, StoreInCache } from './Caching';
import { ChatApi } from './ChatApi';
import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'

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

export class NattyAPI {
    private chat: ChatApi = new ChatApi();

    private _subject: Subject<boolean>;
    public Watch(answerId: number): Observable<boolean> {
        this._subject = new Subject<boolean>();
        GetAndCache(`NattyApi.Feedback.${answerId}`, () => new Promise<boolean>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${nattyFeedbackUrl}/${answerId}`,
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
        .then(r => this._subject.next(r))
        .catch(err => this._subject.error(err));

        return this._subject;
    }

    public Report(answerId: number) {
        const promise = this.chat.SendMessage(111347, `@Natty report http://stackoverflow.com/a/${answerId}`);
        promise.then(() => {
            StoreInCache(`NattyApi.Feedback.${answerId}`, true);
            this._subject.next(true);
        });
        return promise;
    }
    public ReportTruePositive(answerId: number) {
        return this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${answerId} tp`);
    }
    public ReportNeedsEditing(answerId: number) {
        return this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${answerId} ne`);
    }
    public ReportFalsePositive(answerId: number) {
        return this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${answerId} fp`);
    }
}
