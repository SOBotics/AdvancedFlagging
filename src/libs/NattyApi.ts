declare var $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

import { GetAndCache } from './FunctionUtils';
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
        const getterPromise = new Promise<boolean>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${nattyFeedbackUrl}/${answerId}`,
                onload: (response: any) => {
                    const nattyResult = JSON.parse(response.responseText);
                    resolve(nattyResult.items && nattyResult.items[0]);
                },
                onerror: (response: any) => {
                    reject(response);
                },
            });
        });
        return GetAndCache(`NattyApi.Feedback.${answerId}`, () => getterPromise);
    }

    public Report(answerId: number) {
        this.chat.SendMessage(111347, `@Natty report http://stackoverflow.com/a/${answerId}`);
    }
    public ReportTruePositive(answerId: number) {
        this.chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${answerId} tp`);
    }
}