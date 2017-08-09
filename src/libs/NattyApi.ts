declare var $: JQueryStatic;

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
    type: "None" | "True Positive" | "False Positive" | "Needs Editing"
}
export interface NattyFeedbackInfo {
    items: [null] | NattyFeedbackItemInfo[];
    message: "success"
}

export function GetNattyFeedback(answerId: number): Promise<NattyFeedbackInfo> {
    const getterPromise = new Promise<NattyFeedbackInfo>((resolve, reject) => {
        $.ajax({
            url: `${nattyFeedbackUrl}/${answerId}`,
            type: 'GET',
            dataType: 'json'
        }).done((data: any, textStatus: string, jqXHR: JQueryXHR) => {
            resolve(data);
        }).fail((jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
            reject({ jqXHR, textStatus, errorThrown });
        })
    });
    return GetAndCache(`NattyApi.Feedback.${answerId}`, getterPromise);
}