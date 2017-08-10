declare var $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

import { GetAndCache, StoreInCache } from './FunctionUtils';
import { ChatApi } from './ChatApi';

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

    public WasReported(answerId: number): Promise<boolean> {
        return GetAndCache(`NattyApi.Feedback.${answerId}`, () => new Promise<boolean>((resolve, reject) => {
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
        }));
    }

    public Report(answerId: number) {
        const promise = this.chat.SendMessage(111347, `@Natty report http://stackoverflow.com/a/${answerId}`);
        promise.then(() => {
            StoreInCache(`NattyApi.Feedback.${answerId}`, undefined);
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