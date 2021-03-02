import { ChatApi } from '@userscriptTools/ChatApi';
import { getAllAnswerIds } from '@userscriptTools/sotools';
import * as globals from '../../GlobalVars';

interface NattyFeedback {
    items: NattyFeedbackItem[];
    message: string;
}

interface NattyFeedbackItem {
    name: string,
    type: string
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
                onload: (response: { status: number, responseText: string }) => {
                    if (response.status !== 200) reject();

                    const result = JSON.parse(response.responseText) as NattyFeedback;
                    const allStoredIds = result.items.map((item: NattyFeedbackItem) => Number(item.name));
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

    public async ReportNaa(answerDate: Date, questionDate: Date): Promise<boolean> {
        if (answerDate < questionDate || !globals.isStackOverflow()) return false;

        if (this.WasReported()) {
            await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
            return true;
        } else {
            const answerAge = this.DaysBetween(answerDate, new Date());
            const daysPostedAfterQuestion = this.DaysBetween(questionDate, answerDate);
            if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30) return false;

            await this.chat.SendMessage(globals.soboticsRoomId, this.reportMessage);
            return true;
        }
    }

    public async ReportRedFlag(): Promise<boolean> {
        if (!globals.isStackOverflow() || !this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
        return true;
    }

    public async ReportLooksFine(): Promise<boolean> {
        if (!globals.isStackOverflow() || !this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} fp`);
        return true;
    }

    public async ReportNeedsEditing(): Promise<boolean> {
        if (!globals.isStackOverflow() || !this.WasReported()) return false;
        await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} ne`);
        return true;
    }

    private DaysBetween(first: Date, second: Date): number {
        return (second.valueOf() - first.valueOf()) / (1000 * 60 * 60 * 24);
    }
}
