declare const $: JQueryStatic;
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
    private _answerId: number;
    private _subject: Subject<boolean>;

    constructor(answerId: number) {
        this._answerId = answerId;
    }

    public Watch(): Observable<boolean> {
        this._subject = new Subject<boolean>();
        GetAndCache(`NattyApi.Feedback.${this._answerId}`, () => new Promise<boolean>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${nattyFeedbackUrl}/${this._answerId}`,
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

    public async ReportNaa(answerDate: Date, questionDate: Date) {
        if (await this.WasReported()) {
            const promise = this.chat.SendMessage(111347, `@Natty report http://stackoverflow.com/a/${this._answerId}`);
            await promise.then(() => {
                StoreInCache(`NattyApi.Feedback.${this._answerId}`, true);
                this._subject.next(true);
            });
        } else {
            await this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${this._answerId} tp`)
        }
    }
    public async ReportRedFlag() {
        if (await this.WasReported) {
            await this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${this._answerId} tp`)
        }
    }
    public async ReportLooksFine() {
        if (await this.WasReported) {
            await this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${this._answerId} fp`)
        }
    }
    public async ReportNeedsEditing() {
        if (await this.WasReported) {
            return this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${this._answerId} ne`);
        }
    }

    private async WasReported() {
        return await this._subject.toPromise();
    }
}
