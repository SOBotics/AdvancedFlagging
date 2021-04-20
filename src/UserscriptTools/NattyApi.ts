import { ChatApi } from './ChatApi';
import { isStackOverflow, nattyAllReportsUrl, dayMillis, FlagTypeFeedbacks, nattyReportedMessage } from '../GlobalVars';

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
    public name: keyof FlagTypeFeedbacks = 'Natty';

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

    public wasReported(): boolean {
        return NattyAPI.nattyIds.includes(this.answerId);
    }

    public canBeReported(): boolean {
        const answerAge = this.getDaysBetween(this.answerDate, new Date());
        const daysPostedAfterQuestion = this.getDaysBetween(this.questionDate, this.answerDate);
        return this.answerDate > this.questionDate && answerAge < 30 && daysPostedAfterQuestion > 30;
    }

    private async reportNaa(feedback: string): Promise<string> {
        if (!this.canBeReported() || feedback !== 'tp') return '';

        await this.chat.sendMessage(this.reportMessage, this.name);
        return nattyReportedMessage;
    }

    private getDaysBetween(first: Date, second: Date): number {
        return (second.valueOf() - first.valueOf()) / dayMillis;
    }

    public async sendFeedback(feedback: string): Promise<string> {
        return this.wasReported()
            ? await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`, this.name)
            : await this.reportNaa(feedback);
    }
}
