import { ChatApi } from './ChatApi';
import {
    isStackOverflow, nattyAllReportsUrl, dayMillis, FlagTypeFeedbacks, nattyReportedMessage, isPostDeleted, isLqpReviewPage
} from '../GlobalVars';
import { getAllPostIds } from './sotools';

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
            // the response is quite big (1MB+); check if there are ids before making it!
            if (!isStackOverflow || !(isLqpReviewPage || getAllPostIds(false, true).length)) return resolve();
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
        const isDeleted = isPostDeleted(this.answerId); // deleted posts can't be reported
        return this.answerDate > this.questionDate && answerAge < 30 && daysPostedAfterQuestion > 30 && !isDeleted;
    }

    private async reportNaa(feedback: string): Promise<string> {
        if (!this.canBeReported() || feedback !== 'tp') return ''; // no point in reporting if the feedback is tp

        await this.chat.sendMessage(this.reportMessage, this.name);
        return nattyReportedMessage;
    }

    private getDaysBetween(questionDate: Date, answerDate: Date): number {
        // get the number of days between the creation of the question and the answer
        return (answerDate.valueOf() - questionDate.valueOf()) / dayMillis;
    }

    public async sendFeedback(feedback: string): Promise<string> {
        return this.wasReported()
            ? await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`, this.name)
            : await this.reportNaa(feedback);
    }
}
