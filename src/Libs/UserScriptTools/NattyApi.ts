import { ChatApi } from '@userscriptTools/ChatApi';
import { isStackOverflow, nattyAllReportsUrl, getAllPostIds, dayMillis } from '../../GlobalVars';

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
                    const allStoredIds = result.items.map(item => Number(item.name));
                    const answerIds = getAllPostIds(false, false) as number[];
                    this.nattyIds = answerIds.filter(id => allStoredIds.includes(id));
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }

    public WasReported(): boolean {
        return NattyAPI.nattyIds.includes(this.answerId);
    }

    public async ReportNaa(): Promise<boolean> {
        if (this.answerDate < this.questionDate) return false;

        if (this.WasReported()) {
            return await this.chat.SendMessage(`${this.feedbackMessage} tp`);
        } else {
            const answerAge = this.DaysBetween(this.answerDate, new Date());
            const daysPostedAfterQuestion = this.DaysBetween(this.questionDate, this.answerDate);
            if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30) return false;

            return isNaN(answerAge + daysPostedAfterQuestion) && await this.chat.SendMessage(this.reportMessage);
        }
    }

    public async ReportRedFlag(): Promise<boolean> {
        return await this.SendFeedback(`${this.feedbackMessage} tp`);
    }

    public async ReportLooksFine(): Promise<boolean> {
        return await this.SendFeedback(`${this.feedbackMessage} fp`);
    }

    public async ReportNeedsEditing(): Promise<boolean> {
        return await this.SendFeedback(`${this.feedbackMessage} ne`);
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
        return (second.valueOf() - first.valueOf()) / dayMillis;
    }

    private async SendFeedback(message: string): Promise<boolean> {
        return this.WasReported() && await this.chat.SendMessage(message);        
    }
}
