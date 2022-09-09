import { ChatApi } from './ChatApi';
import {
    isStackOverflow,
    FlagTypeFeedbacks,
    isPostDeleted,
    showInlineElement
} from '../shared';
import { getAllPostIds } from './sotools';
import { createBotIcon } from '../AdvancedFlagging';

const dayMillis = 1000 * 60 * 60 * 24;
const nattyFeedbackUrl = 'https://logs.sobotics.org/napi-1.1/api/stored/';
const nattyReportedMessage = 'Post reported to Natty';

interface NattyFeedback {
    items: NattyFeedbackItem[];
    message: string;
}

interface NattyFeedbackItem {
    name: string;
    type: 'Stored post';
}

export class NattyAPI {
    private static nattyIds: number[] = [];
    private readonly chat: ChatApi = new ChatApi();
    private readonly feedbackMessage: string;
    private readonly reportMessage: string;

    public name: keyof FlagTypeFeedbacks = 'Natty';
    public icon?: HTMLDivElement;

    constructor(
        private readonly answerId: number,
        private readonly questionDate: Date,
        private readonly answerDate: Date,
    ) {
        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;

        this.icon = this.getIcon();
    }

    public static getAllNattyIds(): Promise<void> {
        const postIds = getAllPostIds(false, false).join(',');
        if (!isStackOverflow || !postIds) return Promise.resolve();

        return new Promise<void>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${nattyFeedbackUrl}${postIds}`,
                onload: ({ status, responseText }) => {
                    if (status !== 200) reject();

                    const result = JSON.parse(responseText) as NattyFeedback;
                    this.nattyIds = result.items.map(({ name }) => Number(name));

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

        return this.answerDate > this.questionDate
            && answerAge < 30
            && daysPostedAfterQuestion > 30
            && !isDeleted;
    }

    private async reportNaa(feedback: string): Promise<string> {
        // no point in reporting if the feedback is not tp
        if (!this.canBeReported() || feedback !== 'tp') return '';

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

    private getIcon(): HTMLDivElement | undefined {
        if (!this.wasReported()) return;

        const icon = createBotIcon('Natty');

        const iconLink = icon.querySelector('a') as HTMLAnchorElement;

        iconLink.href = `//sentinel.erwaysoftware.com/posts/aid/${this.answerId}`;
        iconLink.target = '_blank';

        showInlineElement(icon);

        return icon;
    }
}
