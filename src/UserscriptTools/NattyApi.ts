import { ChatApi } from './ChatApi';
import { isStackOverflow, nattyAllReportsUrl, dayMillis } from '../GlobalVars';

interface NattyFeedback {
    items: NattyFeedbackItem[];
    message: string;
}

interface NattyFeedbackItem {
    name: string;
    type: string;
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
            if (!isStackOverflow) resolve();
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${nattyAllReportsUrl}`,
                onload: (response: { status: number, responseText: string }) => {
                    if (response.status !== 200) reject();

                    const result = JSON.parse(response.responseText) as NattyFeedback;
                    this.nattyIds = result.items.map(item => Number(item.name));
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }

    public WasReported(): boolean {
        return NattyAPI.nattyIds.includes(this.answerId);
    }

    public async ReportNaa(): Promise<string> {
        if (this.answerDate < this.questionDate) return '';

        if (this.WasReported()) {
            return await this.chat.SendMessage(`${this.feedbackMessage} tp`, this.name);
        } else {
            const answerAge = this.DaysBetween(this.answerDate, new Date());
            const daysPostedAfterQuestion = this.DaysBetween(this.questionDate, this.answerDate);
            if (answerAge > 30 || daysPostedAfterQuestion < 30) return '';

            await this.chat.SendMessage(this.reportMessage, this.name);
            return 'Post reported to Natty';
        }
    }

    public async ReportRedFlag(): Promise<string> {
        return await this.SendFeedback(`${this.feedbackMessage} tp`);
    }

    public async ReportLooksFine(): Promise<string> {
        return await this.SendFeedback(`${this.feedbackMessage} fp`);
    }

    public async ReportNeedsEditing(): Promise<string> {
        return await this.SendFeedback(`${this.feedbackMessage} ne`);
    }

    public ReportVandalism(): Promise<string> {
        return Promise.resolve('');
    }

    public ReportDuplicateAnswer(): Promise<string> {
        return Promise.resolve('');
    }

    public ReportPlagiarism(): Promise<string> {
        return Promise.resolve('');
    }

    private DaysBetween(first: Date, second: Date): number {
        return (second.valueOf() - first.valueOf()) / dayMillis;
    }

    private async SendFeedback(message: string): Promise<string> {
        return this.WasReported() ? await this.chat.SendMessage(message, this.name) : '';
    }
}
