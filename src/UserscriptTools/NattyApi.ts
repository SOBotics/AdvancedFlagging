import { ChatApi } from './ChatApi';
import { AllFeedbacks } from '../shared';
import { page } from '../AdvancedFlagging';
import Reporter from './Reporter';
import Page from './Page';
import { WebsocketUtils } from './WebsocketUtils';
import { Spinner } from '@userscripters/stacks-helpers';
import Post from './Post';

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
        // a post can't be reported if it's been deleted!
        return this.wasReported() || (this.canBeReported() && feedback === 'tp');
    }

    public override async sendFeedback(feedback: string): Promise<string> {
        if (this.wasReported()) {
            await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`);

            return this.getSentMessage(true, feedback);
        } else if (feedback === 'tp') {
            return this.report();
        }

        return '';
    }

    private async report(): Promise<string> {
        if (!this.canBeReported()) return '';

        const submit = document.querySelector('form .js-modal-submit');

        const popover = document.createElement('div');
        popover.classList.add('s-popover');
        popover.id = 'advanced-flagging-progress-popover';

        const arrow = document.createElement('div');
        arrow.classList.add('s-popover--arrow');

        if (Page.isLqpReviewPage && submit) {
            // attach a popover to the "Delete" button indicating
            // that post is being reported to Natty
            Stacks.attachPopover(submit, popover, {
                placement: 'bottom-start',
                autoShow: true
            });
        }

        // Handle cases where the post may not be reported to Natty on time:
        // - when a mod flags a post as NAA/VLQ it is deleted immediately.
        // - when a reviewer sends the last Recommend deletion/Delete review,
        //   the post is also deleted immediately
        if (StackExchange.options.user.isModerator || Page.isLqpReviewPage) {
            this.addItem('Connecting to chat websocket...');
            // init websocket
            const url = await this.chat.getFinalUrl();
            const wsUtils = new WebsocketUtils(url, this.id);

            this.addItem('Reporting post to Natty...');
            await this.chat.sendMessage(this.reportMessage);

            // wait until the report is received
            this.addItem('Waiting for Natty to receive the report...');
            await wsUtils.waitForReport(event => this.chat.reportReceived(event));
        } else {
            await this.chat.sendMessage(this.reportMessage);
        }

        this.addItem('Completing review task...');
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

    private addItem(text: string): void {
        if (!Page.isLqpReviewPage) return;

        const wrapper = document.createElement('div');
        wrapper.classList.add('d-flex', 'gs8');

        const action = document.createElement('div');
        action.classList.add('flex--item');
        action.textContent = text;

        StackExchange.helpers.removeSpinner();

        const spinner = Spinner.makeSpinner({
            size: 'sm',
            classes: [ 'flex--item' ]
        });

        wrapper.append(spinner, action);

        const done = document.createElement('div');
        done.classList.add('flex--item', 'fc-green-500', 'fw-bold');
        done.textContent = 'done!';

        const popover = document.querySelector('#advanced-flagging-progress-popover');

        // previous process has been finished
        const tick = Post.getActionIcons()[0];
        tick.style.display = 'block';

        popover?.lastElementChild?.prepend(tick);
        popover?.lastElementChild?.append(done);
        // info about current process
        popover?.append(wrapper);
    }
}
