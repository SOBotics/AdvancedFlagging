import { ProgressItemActions } from './Progress';
import { attachPopover, FlagTypeFeedbacks, AllFeedbacks } from '../shared';
import Page from './Page';

export default class Reporter {
    public readonly name: keyof FlagTypeFeedbacks;
    public readonly id: number;

    public progress: ProgressItemActions | null = null;

    constructor(name: keyof FlagTypeFeedbacks, id: number) {
        this.name = name;
        this.id = id;
    }

    public wasReported(): boolean {
        return false;
    }

    public canBeReported(): boolean {
        return false;
    }

    public async sendFeedback(feedback: string): Promise<void> {
        if (!feedback) return;

        return new Promise(resolve => resolve());
    }

    public showOnPopover(): boolean {
        return this.wasReported() || this.canBeReported();
    }

    public canSendFeedback(feedback: AllFeedbacks): boolean {
        return Boolean(feedback);
    }

    public getIcon(): HTMLDivElement {
        return this.createBotIcon('');
    }

    public getProgressMessage(feedback: string): string {
        return `Sending ${feedback} feedback to ${this.name}`;
    }

    protected createBotIcon(href?: string): HTMLDivElement {
        const botImages = {
            Natty: 'https://i.sstatic.net/aMUMt.jpg?s=32&g=1',
            Smokey: 'https://i.sstatic.net/7cmCt.png?s=32&g=1',
            'Generic Bot': 'https://i.sstatic.net/6DsXG.png?s=32&g=1',
            Guttenberg: 'https://i.sstatic.net/kEQs2BQb.png?s=32&g=1'
        };

        const iconWrapper = document.createElement('div');
        iconWrapper.classList.add('flex--item', 'd-inline-block', 'advanced-flagging-icon');

        if (!Page.isQuestionPage && !Page.isLqpReviewPage) {
            iconWrapper.classList.add('ml8'); // flag pages
        }

        const iconLink = document.createElement('a');
        iconLink.classList.add('s-avatar', 's-avatar__16', 's-user-card--avatar');

        if (href) {
            iconLink.href = href;
            iconLink.target = '_blank';

            attachPopover(iconLink, `Reported by ${this.name}`);
        }

        iconWrapper.append(iconLink);

        const iconImage = document.createElement('img');
        iconImage.classList.add('s-avatar--image');
        iconImage.src = botImages[this.name];
        iconLink.append(iconImage);

        return iconWrapper;
    }
}
