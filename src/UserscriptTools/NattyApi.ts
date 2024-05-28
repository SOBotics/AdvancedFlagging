import { ChatApi } from './ChatApi';
import { AllFeedbacks } from '../shared';
import { page } from '../AdvancedFlagging';
import Reporter from './Reporter';
import Page from './Page';
import { WebsocketUtils } from './WebsocketUtils';

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

export class NattyAPI extends Reporter {
    private static nattyIds: number[] = [];

    private readonly chat: ChatApi = new ChatApi();
    private readonly feedbackMessage: string;
    private readonly reportMessage: string;

    constructor(
        id: number,
        private readonly questionDate: Date,
        private readonly answerDate: Date,
        private readonly deleted: boolean
    ) {
        super('Natty', id);

        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.id}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.id}`;
    }

    public static getAllNattyIds(ids?: number[]): Promise<void> {
        const postIds = (ids || page.getAllPostIds(false, false)).join(',');

        if (!Page.isStackOverflow || !postIds) return Promise.resolve();

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

    public override wasReported(): boolean {
        return NattyAPI.nattyIds.includes(this.id);
    }

    public override canBeReported(): boolean {
        const answerAge = this.getDaysBetween(this.answerDate, new Date());
        const daysPostedAfterQuestion = this.getDaysBetween(this.questionDate, this.answerDate);

        return this.answerDate > this.questionDate
            && answerAge < 30
            && daysPostedAfterQuestion > 30
            && !this.deleted;
    }

    public override canSendFeedback(feedback: AllFeedbacks): boolean {
        // a post can't be reported if it's been deleted!
        return this.wasReported() || (this.canBeReported() && feedback === 'tp');
    }

    public override async sendFeedback(feedback: string): Promise<string> {
        this.wasReported()
            ? await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`)
            : await this.report(feedback);

        return this.getSentMessage(true, feedback);
    }

    private async report(feedback: string): Promise<string> {
        // no point in reporting if the feedback is not tp
        if (!this.canBeReported() || feedback !== 'tp') return '';

        // When mods flag a post as NAA/VLQ, then that
        // post is deleted immediately. As a result, it
        // isn't reported on time to Natty.
        if (StackExchange.options.user.isModerator) {
            // init websocket
            const url = await this.chat.getFinalUrl();
            const wsUtils = new WebsocketUtils(url, this.id);

            await this.chat.sendMessage(this.reportMessage);

            // wait until the report is received
            await wsUtils.waitForReport(event => this.chat.reportReceived(event));
        } else {
            await this.chat.sendMessage(this.reportMessage);
        }

        return nattyReportedMessage;
    }

    public override getIcon(): HTMLDivElement {
        return this.createBotIcon(
            this.wasReported()
                ? `//sentinel.erwaysoftware.com/posts/aid/${this.id}`
                : ''
        );
    }

    private getDaysBetween(questionDate: Date, answerDate: Date): number {
        // get the number of days between the creation of the question and the answer
        return (answerDate.valueOf() - questionDate.valueOf()) / dayMillis;
    }
}
