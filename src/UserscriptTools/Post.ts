import { getFlagToRaise } from '../AdvancedFlagging';
import { Flags } from '../FlagTypes';
import {
    getSvg,
    PostType,
    FlagNames,
    getFormDataFromObject,
    addXHRListener,
    addProgress,
    FlagTypeFeedbacks,
    BotNames,
    appendLabelAndBoxes,
} from '../shared';

import { CopyPastorAPI } from './CopyPastorAPI';
import { GenericBotAPI } from './GenericBotAPI';
import { MetaSmokeAPI } from './MetaSmokeAPI';
import { NattyAPI } from './NattyApi';

import { Cached, CachedFlag, Store } from './Store';
import { Progress } from './Progress';
import Page from './Page';
import Reporter from './Reporter';

import { type Checkbox } from '@userscripters/stacks-helpers';

type ReporterBoxes = Record<BotNames, Parameters<typeof Checkbox.makeStacksCheckboxes>[0][0]>;

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
    public deleted: boolean;

    public readonly date: Date;

    public readonly opReputation: number;
    public readonly opName: string;

    // not really related to the post,
    // but are unique and easy to access this way :)
    public readonly done: HTMLElement;
    public readonly failed: HTMLElement;
    public readonly flagged: HTMLElement;

    public progress: Progress = new Progress();
    public readonly reporters: Reporters = {};

    private autoflagging = false;
    private score: number;

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

        this.score = this.getScore();

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
        const flagName = getFlagToRaise(reportType, this.qualifiesForVlq());
        const targetUrl = this.reporters.Guttenberg?.targetUrl;

        const url = `/flags/posts/${this.id}/add/${flagName}`;
        const data = {
            fkey: StackExchange.options.user.fkey,
            otherText: text || '',
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
            // the post should now be considered deleted
            this.deleted = true;
            // wait 1 second before reloading
            setTimeout(() => location.reload(), 1000);
        }
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

        // update score
        this.score = this.getScore();
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

        if (!json.Success) {
            console.error(json);

            throw new Error(json.Message.toLowerCase());
        }

        if (json.Refresh) {
            setTimeout(() => location.reload(), 1500);
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

        // don't watch for flags if the user doesn't want to
        // exclude listener from running in deleted posts
        if (!watchFlags || this.deleted) return;

        addXHRListener(xhr => {
            const { status, responseURL } = xhr;

            const regex = new RegExp(
                `/flags/posts/${this.id}/popup`
            );

            if (this.autoflagging // post flagged via popover
                || status !== 200 // request failed
                || !regex.test(responseURL)
            ) return;

            const flagPopup = document.querySelector('#popup-flag-post');
            const submit = flagPopup?.querySelector('.js-popup-submit');

            if (!submit || !flagPopup || submit.textContent?.trim().startsWith('Retract')) return;

            // add "Send feedback to: ..." buttons
            appendLabelAndBoxes(submit, this);

            submit.addEventListener('click', async event => {
                // get the type of flag selected
                const checked = flagPopup.querySelector<HTMLInputElement>('input.s-radio:checked');
                if (!checked) return;

                const flag = checked.value as Flags;

                const flagType = Store.flagTypes
                    .find(item => item.sendWhenFlagRaised && item.reportType === flag);
                if (!flagType) return;

                if (Store.dryRun) {
                    console.log('Post', this.id, 'manually flagged as', flag, flagType);
                }

                const natty = this.reporters.Natty;
                if (natty) {
                    natty.raisedRedFlag = ['PostSpam', 'PostOffensive'].includes(flag);
                }

                await addProgress(event, flagType, this);
                $(this.flagged).fadeIn();
            }, { once: true });
        });
    }

    public filterReporters(feedbacks: FlagTypeFeedbacks): Reporter[] {
        return (Object.values(this.reporters) as Reporter[])
        // keep only the bots the user has opted to send feedback to
            .filter(reporter => {
                const { name, sanitisedName } = reporter;

                const selector = `#advanced-flagging-send-feedback-to-${sanitisedName.toLowerCase()}-${this.id}`;
                // priority to any flag/review checkboxes
                const input = document.querySelector<HTMLInputElement>(`${selector}-flag-review`)
                    ?? document.querySelector<HTMLInputElement>(selector);

                // this may be undefined
                // (e.g. if the parameter is not passed or the checkbox is not found)
                // hence the ?? instead of ||
                const sendFeedback = input?.checked ?? true;
                const feedback = feedbacks[name];

                return sendFeedback && feedback && reporter.canSendFeedback(feedback);
            });
    }

    public async sendFeedbacks({ feedbacks }: CachedFlag): Promise<boolean> {
        let hasFailed = false;

        // simultaneously send feedback to all bots
        // hasFailed will be set to true if something goes wrong
        const allPromises = this.filterReporters(feedbacks)
            // return a promise that sends the feedback
            // use .map() so that they run in paraller
            .map(reporter => {
                const feedback = feedbacks[reporter.name];

                const text = reporter.getProgressMessage(feedback);
                const sendingFeedback = this.progress.addItem(`${text}...`);

                // useful in case a Reporter needs to append subitems
                reporter.progress = sendingFeedback;

                return reporter.sendFeedback(feedback)
                    .then(() => sendingFeedback.completed())
                    .catch((error: unknown) => {
                        console.error(error);

                        if (error instanceof Error) {
                            sendingFeedback.failed(error.message);
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

    public canDelete(popover = false): boolean {
        const selector = '.js-delete-post[title^="Vote to delete"]';
        const deleteButton = this.element.querySelector(selector);

        const userRep = StackExchange.options.user.rep;

        return !this.deleted && (
            // mods can delete no matter what
            StackExchange.options.user.isModerator || (
                // if the delete button is visible, then the user can vote to delete
                Boolean(deleteButton)
                // >20k rep users can vote to delete answers with score < 0
                || (userRep >= 20_000 && (popover ? this.score <= 0 : this.score < 0))
            )
        );
    }

    public qualifiesForVlq(): boolean {
        const dayMillis = 1000 * 60 * 60 * 24;

        // a post can't be flagged as VLQ if it has a positive score
        // or is more than 1 day old
        return (new Date().valueOf() - this.date.valueOf()) < dayMillis && this.score <= 0;
    }

    // returns [bot name, checkbox config]
    public getFeedbackBoxes(isFlagOrReview = false): ReporterBoxes {
        type ReportersEntries = [
            ['Smokey', MetaSmokeAPI],
            ['Natty', NattyAPI],
            ['Guttenberg', CopyPastorAPI],
            ['Generic Bot', GenericBotAPI]
        ];

        const newEntries = (Object.entries(this.reporters) as ReportersEntries)
            .filter(([name, instance]) => {
                // exclude bots that we can't send feedback to
                return instance.showOnPopover()
                    // note: in review, posts can't be reported to Smokey,
                    //       so exclude the icon from the array that's returned
                    && (!Page.isLqpReviewPage || (name !== 'Smokey' || instance.wasReported()));
            })
            .map(([, instance]) => {
                const botName = instance.sanitisedName.toLowerCase();

                // need the postId in the id to make it unique
                const botNameId = `advanced-flagging-send-feedback-to-${botName}-${this.id}`;
                const defaultNoCheck = Store.config[instance.cacheKey];

                const iconHtml = instance.getIcon().outerHTML;
                const checkbox = {
                    // on post page, the id is not unique!
                    id: `${botNameId}${isFlagOrReview ? '-flag-review' : ''}`,
                    labelConfig: {
                        text: `${isFlagOrReview ? '' : 'Feedback to'} ${iconHtml}`,
                        classes: [ isFlagOrReview ? 'mb4' : 'fs-body1' ],
                    },
                    selected: !defaultNoCheck,
                };

                return [instance.name, checkbox];
            });

        return Object.fromEntries(newEntries) as ReporterBoxes;
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
                ? new URL(href || '').pathname.split('/').pop()
                : href?.split('/')[4]
        );

        return Number(postId);
    }

    private getScore(): number {
        const voteElement = this.element.querySelector('.js-vote-count');

        return Number(voteElement?.textContent?.trim()) || 0;
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
