import { ChatApi } from '@userscriptTools/chatapi/ChatApi';
import * as globals from '../../../GlobalVars';

declare const GM_xmlhttpRequest: any;

export interface NattyFeedbackItemInfo {
    timestamp: number;
    naaValue: number;
    bodyLength: number;
    reputation: number;
    reasons: { reasonName: string }[];
    link: string;
    name: string;
    type: 'None' | 'True Positive' | 'False Positive' | 'Needs Editing';
}
export interface NattyFeedbackInfo {
    items: [null] | NattyFeedbackItemInfo[];
    message: 'success';
}

export class NattyAPI {
    private chat: ChatApi = new ChatApi();
    private answerId: number;
    private feedbackMessage: string;
    private reportMessage: string;

    constructor(answerId: number) {
        this.answerId = answerId;
        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
    }

    public WasReported(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!globals.isStackOverflow()) resolve(false);

            let numTries = 0;
            const onError = (response: any) => {
                numTries++;
                numTries < 3 ? makeRequest() : reject('Failed to retrieve Natty report: ' + response);
            };

            const makeRequest = () => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${globals.nattyFeedbackUrl}/${this.answerId}`,
                    onload: (response: XMLHttpRequest) => {
                        if (response.status === 200) {
                            const nattyResult = JSON.parse(response.responseText);
                            resolve(nattyResult.items && nattyResult.items[0]);
                        } else {
                            onError(response.responseText);
                        }
                    },
                    onerror: (response: any) => {
                        onError(response);
                    },
                });
            };

            makeRequest();
        });
    }

    public ReportNaa(answerDate: Date, questionDate: Date) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<any>(async (resolve, reject) => {
            if (answerDate < questionDate || !globals.isStackOverflow()) reject('Answer must be posted after the question');

            if (await this.WasReported()) {
                await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
                resolve(true);
            } else {
                const answerAge = this.DaysBetween(answerDate, new Date());
                const daysPostedAfterQuestion = this.DaysBetween(questionDate, answerDate);
                if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30) resolve(false);

                await this.chat.SendMessage(globals.soboticsRoomId, this.reportMessage);
                resolve(true);
            }
        });
    }

    public async ReportRedFlag() {
        if (!globals.isStackOverflow() || await this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
        return true;
    }

    public async ReportLooksFine() {
        if (!globals.isStackOverflow() || await this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} fp`);
        return true;
    }

    public async ReportNeedsEditing() {
        if (!globals.isStackOverflow() || await this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} ne`);
        return true;
    }

    private DaysBetween(first: Date, second: Date) {
        return ((second as any) - (first as any)) / (1000 * 60 * 60 * 24);
    }
}
