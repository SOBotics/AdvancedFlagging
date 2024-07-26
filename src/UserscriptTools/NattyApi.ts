import { ChatApi } from './ChatApi';
import { AllFeedbacks } from '../shared';
import { page } from '../AdvancedFlagging';

import WebsocketUtils from './WebsocketUtils';
import Reporter from './Reporter';
import Page from './Page';

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
    public raisedRedFlag = false;

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
        const postIds = (ids ?? page.getAllPostIds(false, false)).join(',');

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
        return Page.isStackOverflow // only SO is supported
            && (
                this.wasReported() || (
                    this.canBeReported()
                    && feedback === 'tp'
                    && !this.deleted // deleted posts can't be reported
                )
            );
    }

    public override async sendFeedback(feedback: string): Promise<void> {
        if (this.wasReported()) {
            await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`);
        } else if (feedback === 'tp') {
            await this.report();
        }
    }

    public override getIcon(): HTMLDivElement {
        return this.createBotIcon(
            this.wasReported()
                ? `//sentinel.erwaysoftware.com/posts/aid/${this.id}`
                : ''
        );
    }

    public override getProgressMessage(feedback: string): string {
        return this.wasReported() || feedback !== 'tp'
            ? super.getProgressMessage(feedback)
            : 'Reporting post to Natty';
    }

    private async report(): Promise<string> {
        if (!this.canBeReported()) return '';

        // Handle cases where the post may not be reported to Natty on time:
        // - when a mod flags a post as NAA/VLQ it is deleted immediately.
        // - when a reviewer sends the last Recommend deletion/Delete review,
        //   the post is also deleted immediately
        // - if a red flag has been raised by the user
        if (StackExchange.options.user.isModerator
            || Page.isLqpReviewPage
            || this.raisedRedFlag
        ) {
            // init websocket
            const url = await this.chat.getFinalUrl();
            const wsUtils = new WebsocketUtils(url, this.id, this.progress);

            const reportProgress = this.progress?.addSubItem('Sending report...');
            try {
                await this.chat.sendMessage(this.reportMessage);
                reportProgress?.completed();
            } catch (error) {
                wsUtils.closeWebsocket();
                reportProgress?.failed();

                throw error;
            }

            // wait until the report is received
            await wsUtils.waitForReport(event => this.chat.reportReceived(event));
        } else {
            await this.chat.sendMessage(this.reportMessage);
        }

        return nattyReportedMessage;
    }

    private getDaysBetween(questionDate: Date, answerDate: Date): number {
        // get the number of days between the creation of the question and the answer
        return (answerDate.valueOf() - questionDate.valueOf()) / dayMillis;
    }
}
