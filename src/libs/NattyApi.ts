declare var $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

import { GetAndCache } from './FunctionUtils';

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

export function GetNattyFeedback(answerId: number): Promise<NattyFeedbackInfo> {
    const getterPromise = new Promise<NattyFeedbackInfo>((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `${nattyFeedbackUrl}/${answerId}`,
            onload: (response: any) => {
                resolve(JSON.parse(response.responseText));
            },
            onerror: (response: any) => {
                reject(response);
            },
        });
    });
    return GetAndCache(`NattyApi.Feedback.${answerId}`, () => getterPromise);
}
