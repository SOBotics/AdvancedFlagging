import { displaySuccessFlagged, displayToaster, getFlagToRaise } from '../AdvancedFlagging';
import { Flags } from '../FlagTypes';
import { getSvg, PostType, FlagNames, getFormDataFromObject, addXHRListener, delay } from '../shared';
import { CopyPastorAPI } from './CopyPastorAPI';
import { GenericBotAPI } from './GenericBotAPI';
import { MetaSmokeAPI } from './MetaSmokeAPI';
import { NattyAPI } from './NattyApi';
import Page from './Page';
import Reporter from './Reporter';
import { Cached, CachedFlag, Store } from './Store';

interface StackExchangeFlagResponse {
    FlagType: number;
    Message: string;
    Outcome: number;
    ResultChangedState: boolean;
    Success: boolean;
}

interface StackExchangeDeleteResponse {
    Success: boolean;
    Message: string;
    Refresh: boolean;
}

export interface Reporters {
    Smokey?: MetaSmokeAPI;
    Natty?: NattyAPI;
    Guttenberg?: CopyPastorAPI;
    'Generic Bot'?: GenericBotAPI;
}

export default class Post {
    public static qDate: Date = new Date();

    public readonly type: PostType;
    public readonly id: number;
    public readonly deleted: boolean;

    public readonly date: Date;

    public readonly raiseVlq: boolean;
    public readonly canDelete: boolean;

    public readonly opReputation: number;
    public readonly opName: string;

    // not really related to the post,
    // but are unique and easy to access this way :)
    public readonly done: HTMLElement;
    public readonly failed: HTMLElement;
    public readonly flagged: HTMLElement;

    public readonly reporters: Reporters = {};

    private autoflagging = false;
    private readonly score: number;

    constructor(
        public readonly element: HTMLElement
    ) {
        this.type = this.getType();
        this.id = this.getId();
        // (yes, even deleted questions have this class...)
        this.deleted = this.element.classList.contains('deleted-answer');

        this.date = this.getCreationDate();
        if (this.type === 'Question') {
            Post.qDate = this.date;
        }

        this.score = Number(this.element.dataset.score) || 0;
        this.raiseVlq = this.qualifiesForVlq();
        this.canDelete = this.deleteButtonExists();

        this.opReputation = this.getOpReputation();
        this.opName = this.getOpName();

        [this.done, this.failed, this.flagged] = Post.getActionIcons();

        this.initReporters();
    }

    public static getActionIcons(): HTMLElement[] {
        return [
            ['Checkmark', 'fc-green-500'],
            ['Clear', 'fc-red-500'],
            ['Flag', 'fc-red-500']
        ]
            .map(([svg, classname]) => Post.getIcon(getSvg(`icon${svg}`), classname));
    }

    public async flag(
        reportType: Flags,
        text: string | null,
    ): Promise<void> {
        // if the flag name is VLQ, then we need to check if the criteria are met.
        // If not, switch to NAA
        const flagName = getFlagToRaise(reportType, this.raiseVlq);
        const targetUrl = this.reporters.Guttenberg?.targetUrl;

        const url = `/flags/posts/${this.id}/add/${flagName}`;
        const data = {
            fkey: StackExchange.options.user.fkey,
            otherText: text ?? '',
            // plagiarism flag: fill "Link(s) to original content"
            // note wrt link: site will always be Stack Overflow,
            //                post will always be an answer.
            customData: flagName === FlagNames.Plagiarism
                ? JSON.stringify({ plagiarizedSource: `https:${targetUrl}` })
                : ''
        };

        if (Store.dryRun) {
            console.log(`Flag post as ${flagName} via`, url, data);
            return;
        }

        const flagRequest = await fetch(url, {
            method: 'POST',
            body: getFormDataFromObject(data)
        });

        this.autoflagging = true;

        // for some reason, the flag responses are inconsistent:
        // some are in JSON, others in text
        // for example, if a user flags posts too quickly, they get a text response
        // if the post has been flagged successfully, the response is in JSON
        const tooFast = /You may only flag a post every \d+ seconds?/;
        const responseText = await flagRequest.text();

        if (tooFast.test(responseText)) { // flagging posts too quickly
            const rlCount = /\d+/.exec(responseText)?.[0] ?? 0;
            const pluralS = Number(rlCount) > 1 ? 's' : '';

            console.error(responseText);
            throw new Error(`rate-limited for ${rlCount} second${pluralS}`);
        }

        const response = JSON.parse(responseText) as StackExchangeFlagResponse;

        if (!response.Success) { // sometimes, although the status is 200, the post isn't flagged.
            const { Message: message } = response;
            const fullMessage = 'Failed to flag the post with outcome '
                              + `${response.Outcome}: ${message}.`;
            console.error(fullMessage);

            if (message.includes('already flagged')) {
                throw new Error('post already flagged');
            } else if (message.includes('limit reached')) {
                throw new Error('post flag limit reached');
            } else {
                throw new Error(message);
            }
        }

        // flag changes the state of the post
        // => reload the page
        if (response.ResultChangedState) {
            // wait 1 second before reloading
            await delay(1000);

            location.reload();
        }

        displaySuccessFlagged(this.flagged, flagName);
    }

    public downvote(): void {
        const button = this.element.querySelector<HTMLButtonElement>('.js-vote-down-btn');
        const hasDownvoted = button?.classList.contains('fc-theme-primary');

        // only downvote if post hasn't already been downvoted
        if (hasDownvoted) return;

        if (Store.dryRun) {
            console.log('Downvote post by clicking', button);
            return;
        }

        button?.click();
    }

    public async deleteVote(): Promise<void> {
        const fkey = StackExchange.options.user.fkey;
        const url = `/posts/${this.id}/vote/10`;

        if (Store.dryRun) {
            console.log('Delete vote via', url, 'with', fkey);

            return;
        }

        const request = await fetch(url, {
            method: 'POST',
            body: getFormDataFromObject({ fkey })
        });
        const response = await request.text();

        let json: StackExchangeDeleteResponse;
        try {
            json = JSON.parse(response) as StackExchangeDeleteResponse;
        } catch (error) {
            console.error(error, response);

            throw new Error('could not parse JSON');
        }

        if (json.Success) {
            displayToaster('Voted to delete post.', 'success');
        } else {
            console.error(json);

            throw new Error(json.Message.toLowerCase());
        }

        if (json.Refresh) {
            await delay(1500);

            location.reload();
        }
    }

    public async comment(text: string): Promise<void> {
        const data = {
            fkey: StackExchange.options.user.fkey,
            comment: text
        };
        const url = `/posts/${this.id}/comments`;

        if (Store.dryRun) {
            console.log('Post comment via', url, data);

            return;
        }

        const request = await fetch(url, {
            method: 'POST',
            body: getFormDataFromObject(data)
        });
        const result = await request.text();

        // also see https://dev.stackoverflow.com/content/Js/full.en.js
        const commentUI = StackExchange.comments.uiForPost($(`#comments-${this.id}`));
        commentUI.addShow(true, false);
        commentUI.showComments(result, null, false, true);

        $(document).trigger('comment', this.id);
    }

    public upvoteSameComments(comment: string): void {
        const alternative = Store.config.addAuthorName
            ? comment.split(', ').slice(1).join(', ') // remove author's name
            : `${this.opName}, ${comment}`; // add author's name

        // convert comment texts to lowercase before comparing them
        // compare both possible versions of the cached comment
        // - the one without the author's name prepended
        // - the one with author's name prepended
        const stripped = Post.getStrippedComment(comment).toLowerCase();
        const strippedAlt = Post.getStrippedComment(alternative).toLowerCase();

        this.element
            .querySelectorAll<HTMLElement>('.comment-body .comment-copy')
            .forEach(element => {
                const text = element.innerText.toLowerCase();
                if (text !== stripped && text !== strippedAlt) return;

                const parent = element.closest('li');

                parent
                    ?.querySelector<HTMLAnchorElement>(
                        'a.js-comment-up.comment-up-off' // voting button
                    )
                    ?.click(); // click it!
            });
    }

    public watchForFlags(): void {
        // Watch for manual flags if the user has chosen to do so
        const watchFlags = Store.config[Cached.Configuration.watchFlags];

        addXHRListener(xhr => {
            const { status, responseURL } = xhr;

            const flagNames = Object.values(FlagNames).join('|');
            const regex = new RegExp(
                `/flags/posts/${this.id}/add/(${flagNames})`
            );

            if (!watchFlags // don't watch for flags
                || this.autoflagging // post flagged via popover
                || status !== 200 // request failed
                || !regex.test(responseURL) // not a flag
            ) return;

            const matches = regex.exec(responseURL);
            const flag = matches?.[1] as Flags;

            const flagType = Store.flagTypes
                .find(item => item.sendWhenFlagRaised && item.reportType === flag);
            if (!flagType) return;

            if (Store.dryRun) {
                console.log('Post', this.id, 'manually flagged as', flag, flagType);
            }

            displaySuccessFlagged(this.flagged, flagType.reportType);

            void this.sendFeedbacks(flagType);
        });
    }

    public async sendFeedbacks({ feedbacks }: CachedFlag): Promise<boolean> {
        let hasFailed = false;

        // simultaneously send feedback to all bots
        // hasFailed will be set to true if something goes wrong
        const allPromises = (Object.values(this.reporters) as Reporter[])
        // keep only the bots the user has opted to send feedback to
            .filter(({ name }) => {
                const sanitised = name.replace(/\s/g, '').toLowerCase();
                const input = this.element.querySelector<HTMLInputElement>(
                    `[id*="-send-feedback-to-${sanitised}-"]
            `);

                // this may be undefined
                // (e.g. if the parameter is not passed or the checkbox is not found)
                // hence the ?? instead of ||
                const sendFeedback = input?.checked ?? true;

                return sendFeedback && feedbacks[name];
            })
            // return a promise that sends the feedback
            // use .map() so that they run in paraller
            .map(reporter => {
                return reporter.sendFeedback(feedbacks[reporter.name])
                    .then(message => {
                        // promise resolves to a success message
                        if (message) {
                            displayToaster(message, 'success');
                        }
                    })
                    // otherwise throws an error caught here
                    .catch((error: unknown) => {
                        console.error(error);

                        if (error instanceof Error) {
                            displayToaster(error.message, 'danger');
                        }

                        hasFailed = true;
                    });
            });

        await Promise.allSettled(allPromises);

        return !hasFailed;
    }

    public addIcons(): void {
        const iconLocation = this.element.querySelector(
            'a.question-hyperlink, a.answer-hyperlink, .s-link, .js-post-menu > div.d-flex'
        );
        const icons = (Object.values(this.reporters) as Reporter[])
            .filter(reporter => reporter.wasReported())
            .map(reporter => reporter.getIcon());

        iconLocation?.append(...icons);
    }

    private static getIcon(svg: SVGElement, classname: string): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.classList.add('flex--item');
        wrapper.style.display = 'none';

        svg.classList.add(classname);
        wrapper.append(svg);

        return wrapper;
    }

    private static getStrippedComment(text: string): string {
        // the comments under a post are in HTML, but the comments in cache in markdown
        // to determine if two comments are the same, we must strip the HTML
        return text
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Match [links](...)
            .replace(/\[([^\]]+)\][^(]*?/g, '$1') // Match [edit]
            .replace(/_([^_]+)_/g, '$1') //  _thanks_ => thanks
            .replace(/\*\*([^*]+)\*\*/g, '$1') // **thanks** => thanks
            .replace(/\*([^*]+)\*/g, '$1') // *thanks* => thanks
            .replace(' - From Review', ''); // remove the "from review" part
    }

    private getType(): PostType {
        return this.element.classList.contains('question')
            || this.element.id.startsWith('question')
            || this.element.querySelector('.question-hyperlink')
            ? 'Question'
            : 'Answer';
    }

    private getId(): number {
        const href = this.element.querySelector<HTMLAnchorElement>(
            '.answer-hyperlink, .question-hyperlink, .s-link'
        )?.href;

        const postId = (
            // questions page: get value of data-questionid/data-answerid
            this.element.dataset.questionid ?? this.element.dataset.answerid
        ) ?? (
            this.type === 'Answer'// flags/NATO/search page: parse the post URL
                ? new URL(href ?? '').pathname.split('/').pop()
                : href?.split('/')[4]
        );

        return Number(postId);
    }

    private getOpReputation(): number {
        // this won't work for community wiki posts,
        // and there's nothing that can be done about it:
        const repDiv = [...this.element.querySelectorAll<HTMLElement>(
            '.user-info .reputation-score'
        )].pop();
        if (!repDiv) return 0;

        let reputationText = repDiv.innerText.replace(/,/g, '');
        if (!reputationText) return 0;

        if (reputationText.includes('k')) {
            reputationText = reputationText
                .replace(/\.\d/g, '') // 4.5k => 4k
                .replace(/k/, ''); // 4k => 4

            return Number(reputationText) * 1000; // 4 => 4000
        } else {
            return Number(reputationText);
        }
    }

    private getOpName(): string {
        // in Flags page, authorName will be empty, but we aren't interested in it there anyways...
        const lastNameEl = [...this.element.querySelectorAll('.user-info .user-details a')].pop();

        return lastNameEl?.textContent?.trim() ?? '';
    }

    private getCreationDate(): Date {
        const dateElements = this.element.querySelectorAll<HTMLElement>('.user-info .relativetime');
        const authorDateElement = Array.from(dateElements).pop();

        return new Date(authorDateElement?.title ?? '');
    }

    private qualifiesForVlq(): boolean {
        const dayMillis = 1000 * 60 * 60 * 24;

        // a post can't be flagged as VLQ if it has a positive score
        // or is more than 1 day old
        return (new Date().valueOf() - this.date.valueOf()) < dayMillis
            && this.score <= 0;
    }

    private deleteButtonExists(): boolean {
        const selector = '.js-delete-post[title^="Vote to delete"]';
        const deleteButton = this.element.querySelector(selector);

        return Boolean(deleteButton);
    }

    private initReporters(): void {
        // for every site & post type
        this.reporters.Smokey = new MetaSmokeAPI(this.id, this.type, this.deleted);

        // NAAs and plagiarised answers
        if (this.type === 'Answer' && Page.isStackOverflow) {
            this.reporters.Natty = new NattyAPI(this.id, Post.qDate, this.date, this.deleted);
            this.reporters.Guttenberg = new CopyPastorAPI(this.id);
        }

        // Generic Bot can only track Stack Overflow posts
        if (Page.isStackOverflow) {
            this.reporters['Generic Bot'] = new GenericBotAPI(this.id, this.deleted);
        }
    }
}
