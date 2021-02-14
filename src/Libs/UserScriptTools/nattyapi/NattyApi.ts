import { ChatApi } from '@userscriptTools/chatapi/ChatApi';
import { getAllAnswerIds } from '@userscriptTools/sotools/sotools';
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
    private static nattyIds: number[] = [];
    private chat: ChatApi = new ChatApi();
    private answerId: number;
    private feedbackMessage: string;
    private reportMessage: string;

    constructor(answerId: number) {
        this.answerId = answerId;
        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
    }

    public static getAllNattyIds(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!globals.isStackOverflow()) resolve();
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${globals.nattyAllReportsUrl}`,
                onload: (response: any) => {
                    if (response.status !== 200) reject();

                    const result = JSON.parse(response.responseText);
                    const allStoredIds = result.items.map((item: any) => Number(item.name));
                    const answerIds = getAllAnswerIds();
                    this.nattyIds = answerIds.filter(id => allStoredIds.includes(id));
                    resolve();
                },
                onerror: () => {
                    reject();
                },
            });
        });
    }

    public WasReported(): boolean {
        return NattyAPI.nattyIds.includes(this.answerId);
    }

    public ReportNaa(answerDate: Date, questionDate: Date) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<boolean>(async (resolve, reject) => {
            if (answerDate < questionDate || !globals.isStackOverflow()) reject(false);

            if (this.WasReported()) {
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
        if (!globals.isStackOverflow() || !this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
        return true;
    }

    public async ReportLooksFine() {
        if (!globals.isStackOverflow() || !this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} fp`);
        return true;
    }

    public async ReportNeedsEditing() {
        if (!globals.isStackOverflow() || !this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} ne`);
        return true;
    }

    private DaysBetween(first: Date, second: Date) {
        return ((second as any) - (first as any)) / (1000 * 60 * 60 * 24);
    }
}
