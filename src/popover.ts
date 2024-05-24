import {
    FlagTypeFeedbacks,
    AllFeedbacks,
    StacksToastState,
    attachPopover,
    getHumanFromDisplayName,

    getFullFlag,
    getCachedConfigBotKey,
    FlagNames
} from './shared';
import {
    getFlagToRaise,
    displayToaster,
    displaySuccessFlagged
} from './AdvancedFlagging';
import Post from './UserscriptTools/Post';

import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';

import { Menu } from '@userscripters/stacks-helpers';
import { isSpecialFlag } from './Configuration';
import { Store, Cached, Configuration, CachedFlag } from './UserscriptTools/Store';
import Reporter from './UserscriptTools/Reporter';
import Page from './UserscriptTools/Page';

const noneSpan = document.createElement('span');
noneSpan.classList.add('o50');
noneSpan.innerText = '(none)';

export class Popover {
    private readonly post: Post;
    public readonly popover: HTMLUListElement;

    constructor(post: Post) {
        this.post = post;

        this.popover = this.makeMenu();
    }

    private makeMenu(): HTMLUListElement {
        const menu = Menu.makeMenu(
            {
                itemsType: 'a',
                navItems: [
                    ...this.getReportLinks(),
                    ...this.getOptionsRow(),
                    { separatorType: 'divider' },
                    ...this.getSendFeedbackToRow()
                ],
            }
        );

        const arrow = document.createElement('div');
        arrow.classList.add('s-popover--arrow', 's-popover--arrow__tc');

        menu.prepend(arrow);

        setTimeout(() => increaseTooltipWidth(menu));

        return menu;
    }

    // Section #1: Report links
    private getReportLinks(): Menu.StacksMenuOptions['navItems'] {
        const {
            Guttenberg: copypastor,
        } = this.post.reporters;

        const { copypastorId, repost, targetUrl } = copypastor || {};

        // add the flag types to the category they correspond to
        const categories = Store.categories
            // exclude categories that do not apply to the current post type
            .filter(item => item.appliesTo?.includes(this.post.type))
            // create a new FlagType property to store cached flags
            .map(item => ({ ...item, FlagTypes: [] as CachedFlag[] }));

        // loop through all flag types and push them,
        // based on their BelongsTo, to .FlagTypes
        Store.flagTypes
            // exclude disabled and non-SO flag types
            .filter(({ reportType, id, belongsTo, enabled }) => {
                // only Guttenberg reports (can) have ReportType === 'PlagiarizedContent/PostOther'
                const isGuttenbergItem = isSpecialFlag(reportType, false);

                const showGutReport = Boolean(copypastorId) // a CopyPastor id must exist
                    // https://github.com/SOBotics/AdvancedFlagging/issues/16
                    // id === 4 => Duplicate Answer
                    && (id === 4 ? repost : !repost);

                // show the red flags and general items on every site,
                // restrict the others to Stack Overflow
                const showOnSo = ['Red flags', 'General'].includes(belongsTo) || Page.isStackOverflow;

                return enabled && (isGuttenbergItem ? showGutReport : showOnSo);
            })
            .forEach(flagType => {
                const { belongsTo } = flagType;

                const category = categories.find(({ name: Name }) => belongsTo === Name);

                category?.FlagTypes.push(flagType);
            });


        return categories
            // exclude empty categories (no .FlagTypes)
            .filter(category => category.FlagTypes.length)
            .flatMap(category => {
                const { isDangerous } = category;

                const mapped = category.FlagTypes.flatMap(flagType => {
                    const { displayName } = flagType;

                    const flagText = copypastorId && targetUrl
                        ? getFullFlag(flagType, targetUrl, copypastorId)
                        : '';

                    const tooltipHtml = this.getTooltipHtml(flagType, flagText);
                    const classes = isDangerous ? [ 'fc-red-500' ] : '';

                    return {
                        text: displayName,
                        // unfortunately, danger: IsDangerous won't work
                        // since SE uses s-anchors__muted
                        blockLink: { selected: false },
                        // use this trick instead
                        ...(classes ? { classes } : {}),
                        click: {
                            handler: (): void => {
                                void this.handleReportLinkClick(flagType, flagText);
                            }
                        },
                        popover: {
                            html: tooltipHtml,
                            position: 'right-start' as const
                        }
                    };
                });

                return [...mapped, { separatorType: 'divider' }];
            });
    }

    // Section #2: Leave comment, Flag, Downvote
    private getOptionsRow(): Menu.StacksMenuOptions['navItems'] {
        const comments = this.post.element.querySelector('.comment-body');

        const config = [
            ['Leave comment', Cached.Configuration.defaultNoComment],
            ['Flag', Cached.Configuration.defaultNoFlag],
            ['Downvote', Cached.Configuration.defaultNoDownvote]
        ] as [string, keyof Configuration][];

        // ['label test', globals.cacheKey]
        return config
            // don't leave comments on non-SO sites
            .filter(([ text ]) => text === 'Leave comment' ? Page.isStackOverflow : true)
            .map(([text, cacheKey]) => {
                const uncheck = Store.config[cacheKey]
                // extra requirement for the leave comment option:
                // there shouldn't be any comments below the post
                    || (text === 'Leave comment' && comments);

                const idified = text.toLowerCase().replace(' ', '-');
                const id = `advanced-flagging-${idified}-checkbox-${this.post.id}`;

                return {
                    checkbox: {
                        id,
                        labelConfig: {
                            text,
                            classes: ['pt1', 'fs-body1']
                        },
                        // !uncheck => whether the checkbox should be checked :)
                        selected: !uncheck
                    }
                };
            });
    }

    // Section #3: Send feedback to X
    private getSendFeedbackToRow(): Menu.StacksMenuOptions['navItems'] {
        // oof!
        type ReportersEntries = [
            ['Smokey', MetaSmokeAPI],
            ['Natty', NattyAPI],
            ['Guttenberg', CopyPastorAPI],
            ['Generic Bot', GenericBotAPI]
        ];

        return (Object.entries(this.post.reporters) as ReportersEntries)
            // exclude bots that we can't send feedback to
            .filter(([, instance]) => instance.showOnPopover())
            .map(([, instance]) => {
                const cacheKey = getCachedConfigBotKey(instance.name);
                const sanitised = instance.name.replace(/\s/g, '').toLowerCase();

                // need the postId in the id to make it unique
                const botNameId = `advanced-flagging-send-feedback-to-${sanitised}-${this.post.id}`;
                const defaultNoCheck = Store.config[cacheKey];

                const imageClone = instance.icon?.cloneNode(true) as HTMLElement;

                return {
                    checkbox: {
                        id: botNameId,
                        labelConfig: {
                            text: `Feedback to ${imageClone.outerHTML}`,
                            classes: [ 'fs-body1' ]
                        },
                        selected: !defaultNoCheck,
                    },
                    checkboxOptions: {
                        classes: [ 'px6' ]
                    },
                    popover: {
                        html: `Send feedback to ${instance.name}`,
                        position: 'right-start'
                    }
                };
            });
    }

    private getTooltipHtml(
        flagType: CachedFlag,
        flagText: string | null
    ): string {
        /*
        Example innerText:
            Flag: as VLQ
            Comment: Please write your answer in English, as Stack Overflow
                     is an [English-only site](//meta.stackoverflow.com/a/297680).
            Feedbacks: tp to Natty, track with Generic Bot
            Downvotes the post

        with some HTML magic added
        */

        const { reportType, downvote } = flagType;

        // Feedbacks: X with Y, foo with bar
        const feedbackText = this.getFeedbackSpans(flagType)
            .map(span => span.outerHTML)
            .join(', '); // separate the feedbacks
        const feedbacks = document.createElement('span');
        feedbacks.innerHTML = feedbackText;

        // Flag text: ...
        const tooltipFlagText = this.post.deleted ? '' : flagText;

        // Comment text: ...
        const commentText = this.getCommentText(flagType);
        const tooltipCommentText = (this.post.deleted ? '' : commentText) || '';

        // if the flag changed from VLQ to NAA, let the user know why
        const flagName = getFlagToRaise(reportType, this.post.raiseVlq);

        let reportTypeHuman = reportType === 'NoFlag' || !this.post.deleted
            ? getHumanFromDisplayName(flagName)
            : '';

        if (reportType !== flagName) {
            reportTypeHuman += ' (VLQ criteria weren\'t met)';
        }

        // ---------------------------------------------------

        const popoverParent = document.createElement('div');

        Object.entries({
            'Flag': reportTypeHuman,
            'Comment': tooltipCommentText,
            'Flag text': tooltipFlagText,
            'Feedbacks': feedbacks
        })
            .filter(([, value]) => value)
            .map(([boldText, value]) => createPopoverToOption(boldText, value))
            .filter(Boolean)
            .forEach(element => popoverParent.append(element as HTMLElement));

        // Downvotes/Does not downvote the post
        const downvoteWrapper = document.createElement('li');
        const downvoteOrNot = downvote
            ? '<b>Downvotes</b>'
            : 'Does <b>not</b> downvote';
        downvoteWrapper.innerHTML = `${downvoteOrNot} the post`;

        popoverParent.append(downvoteWrapper);

        return popoverParent.innerHTML;
    }

    private getFeedbackSpans(flagType: CachedFlag): HTMLSpanElement[] {
        type FeedbackEntries = [keyof FlagTypeFeedbacks, AllFeedbacks][];

        const spans = (Object.entries(flagType.feedbacks) as FeedbackEntries)
            // make sure there's actually a feedback
            .filter(([, feedback]) => feedback)
            .filter(([botName, feedback]) => {
                return (Object.values(this.post.reporters) as Reporter[])
                    .find(({ name }) => name === botName)
                    ?.canSendFeedback(feedback);
            })
            .map(([botName, feedback]) => {
                const feedbackSpan = document.createElement('span');

                const strong = document.createElement('b');
                feedbackSpan.append(strong);

                if (feedback === 'track') {
                    strong.innerText = 'track';
                    feedbackSpan.append(' with Generic Bot');

                    return feedbackSpan; // different string for Generic Bot
                }

                // determine the colour to add to the feedback using Stacks classes
                // https://stackoverflow.design/product/base/colors/#danger-and-error
                const [
                    isGreen,
                    isRed,
                    isYellow
                ] = [/tp/, /fp/, /naa|ne/].map(regex => regex.test(feedback));

                let className: StacksToastState | '' = '';
                if (isGreen) className = 'success';
                else if (isRed) className = 'danger';
                else if (isYellow) className = 'warning';

                // make it clear that the post will be reported in the popover
                // again, this shouldn't happen if the post is deleted
                const shouldReport = !(Object.values(this.post.reporters) as Reporter[])
                    .find(({ name }) => name === botName)
                    ?.wasReported();

                strong.classList.add(`fc-${className}`);
                strong.innerHTML = shouldReport ? 'report' : feedback;

                feedbackSpan.append(` to ${botName}`);

                return feedbackSpan;
            }).filter(String);

        // in case the post will not be reported or
        // no feedback will be sent, return the (none) span
        return spans.length
            ? spans
            : [noneSpan];
    }

    private getCommentText({ comments }: CachedFlag): string | null {
        // Adds the author name before the comment if the option is enabled
        // and determines if the comment should be low/high rep
        const { addAuthorName: AddAuthorName } = Store.config;

        const commentType = (this.post.opReputation || 0) > 50 ? 'high' : 'low';
        const comment = comments?.[commentType] || comments?.low;

        return (
            comment && AddAuthorName
                ? `${this.post.opName}, ${comment[0].toLowerCase()}${comment.slice(1)}`
                : comment
        ) || null;
    }

    private async handleReportLinkClick(
        flagType: CachedFlag,
        flagText: string | null,
    ): Promise<void> {
        const { reportType, displayName } = flagType;

        const dropdown = this.post.element.querySelector('.advanced-flagging-popover');
        if (!dropdown) return;

        // hide the dropdown immediately after clicking one of the options
        $(dropdown).fadeOut('fast');

        // only if the post hasn't been deleted should we
        // upvote a comment/send feedback/downvote/flag it
        if (!this.post.deleted) {
            let comment = this.getCommentText(flagType);

            const leaveComment = dropdown.querySelector<HTMLInputElement>(
                '[id*="-leave-comment-checkbox-"]'
            )?.checked;
            // not allowed to leave comment => check if there are any same comments
            if (!leaveComment && comment) {
                this.post.upvoteSameComments(comment);

                comment = null;
            }

            const [flag, downvote] = ['flag', 'downvote']
                .map(type => {
                    return dropdown.querySelector<HTMLInputElement>(
                        `[id*="-${type}-checkbox-"]`
                    )?.checked ?? false;
                });

            // comment
            if (comment) {
                try {
                    await this.post.comment(comment);
                } catch (error) {
                    displayToaster('Failed to comment on post', 'danger');
                    console.error(error);
                }
            }

            // flag
            if (flag && reportType !== FlagNames.NoFlag) {
                try {
                    await this.post.flag(reportType, flagText);

                    displaySuccessFlagged(this.post.flagged, getFlagToRaise(reportType, this.post.raiseVlq));
                } catch (error) {
                    displayToaster('Failed to flag: ' + (error as string), 'danger');
                }
            }

            // downvote
            if (downvote && flagType.downvote) this.post.downvote();
        }

        // feedback should however be sent
        // if it's sent successfully, the success variable is true, otherwise false
        const success = await this.post.sendFeedbacks(flagType);

        // don't show performed/failed action icons if post has been flagged
        if (reportType !== 'NoFlag') return;

        if (success) {
            attachPopover(this.post.done, `Performed action ${displayName}`);

            $(this.post.done).fadeIn();
        } else {
            attachPopover(this.post.failed, `Failed to perform action ${displayName}`);

            $(this.post.failed).fadeIn();
        }
    }
}

function increaseTooltipWidth(menu: HTMLUListElement): void {
    [...menu.querySelectorAll('li')]
        .filter(li => li.firstElementChild?.classList.contains('s-block-link'))
        .map(reportLink => reportLink.nextElementSibling)
        .forEach(tooltip => {
            const textLength = tooltip?.textContent?.length;
            if (!textLength) return;

            tooltip.classList.add(
                textLength > 100
                    ? 'wmn5'
                    : 'wmn2'
            );
        });
}

export function createPopoverToOption(
    boldText: string,
    value: string | HTMLElement | HTMLElement[] | null
): HTMLElement | undefined {
    if (!value) return;

    const wrapper = document.createElement('li');
    const bold = document.createElement('strong');
    bold.innerHTML = `${boldText}: `;

    wrapper.append(bold);

    if (Array.isArray(value)) {
        wrapper.append(...value);
    } else {
        wrapper.append(value || noneSpan);
    }

    return wrapper;
}
