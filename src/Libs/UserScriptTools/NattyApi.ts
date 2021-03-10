import { ChatApi } from '@userscriptTools/ChatApi';
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
    private questionDate: Date;
    private answerDate: Date;
    public name = 'Natty';

    constructor(answerId: number, questionDate: Date, answerDate: Date) {
        this.answerId = answerId;
        this.questionDate = questionDate;
        this.answerDate = answerDate;
        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
    }

    public static getAllNattyIds(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!globals.isStackOverflow) resolve();
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${globals.nattyAllReportsUrl}`,
                onload: (response: { status: number, responseText: string }) => {
                    if (response.status !== 200) reject();

                    const result = JSON.parse(response.responseText) as NattyFeedback;
                    const allStoredIds = result.items.map((item: NattyFeedbackItem) => Number(item.name));
                    const answerIds = globals.getAllPostIds(false, false) as number[];
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

    public async ReportNaa(): Promise<boolean> {
        if (this.answerDate < this.questionDate) return false;

        if (this.WasReported()) {
            await this.chat.SendMessage(`${this.feedbackMessage} tp`);
            return true;
        } else {
            const answerAge = this.DaysBetween(this.answerDate, new Date());
            const daysPostedAfterQuestion = this.DaysBetween(this.questionDate, this.answerDate);
            if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30) return false;

            await this.chat.SendMessage(this.reportMessage);
            return true;
        }
    }

    public async ReportRedFlag(): Promise<boolean> {
        if (!this.WasReported()) return false;
        await this.chat.SendMessage(`${this.feedbackMessage} tp`);
        return true;
    }

    public async ReportLooksFine(): Promise<boolean> {
        if (!this.WasReported()) return false;
        await this.chat.SendMessage(`${this.feedbackMessage} fp`);
        return true;
    }

    public async ReportNeedsEditing(): Promise<boolean> {
        if (!this.WasReported()) return false;
        await this.chat.SendMessage(`${this.feedbackMessage} ne`);
        return true;
    }


    public ReportVandalism(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportDuplicateAnswer(): Promise<boolean> {
        return Promise.resolve(false);
    }

    public ReportPlagiarism(): Promise<boolean> {
        return Promise.resolve(false);
    }

    private DaysBetween(first: Date, second: Date): number {
        return (second.valueOf() - first.valueOf()) / globals.dayMillis;
    }
}
