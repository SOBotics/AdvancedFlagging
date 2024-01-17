import {
    CachedFlag,
    FlagTypeFeedbacks,
    AllFeedbacks,
    StacksToastState,
    attachPopover,
    getHumanFromDisplayName,

    cachedConfiguration,
    cachedCategories,
    cachedFlagTypes,

    isStackOverflow,
    getFullFlag,
    getCachedConfigBotKey,
    Cached,
    Configuration
} from './shared';
import {
    upvoteSameComments,
    ReporterInformation,
    getFlagToRaise,
    handleFlag,
    handleActions,
    createBotIcon
} from './AdvancedFlagging';
import { PostInfo } from './UserscriptTools/sotools';

import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';

import { Menu } from '@userscripters/stacks-helpers';
import { isSpecialFlag } from './Configuration';

const noneSpan = document.createElement('span');
noneSpan.classList.add('o50');
noneSpan.innerText = '(none)';

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

function canSendFeedback(
    botName: keyof FlagTypeFeedbacks,
    feedback: AllFeedbacks,
    reporters: ReporterInformation,
    postDeleted: boolean,
): boolean {
    const {
        Guttenberg: copypastor,
        Natty: natty,
        Smokey: metasmoke
    } = reporters;

    const smokeyId = metasmoke?.getSmokeyId();
    const smokeyDisabled = MetaSmokeAPI.isDisabled;
    const { copypastorId } = copypastor || {};

    const nattyReported = natty?.wasReported() || false;
    const nattyCanReport = natty?.canBeReported() || false;

    switch (botName) {
        case 'Natty':
            return (
                nattyReported // the post has been reported
                && !postDeleted // AND is not deleted
            ) || ( // OR
                nattyCanReport // it can be reported
                && feedback === 'tp' // AND the feedback is tp
            );
        case 'Smokey':
            return Boolean(smokeyId) || ( // the post has been reported OR:
                feedback === 'tpu-' // the feedback is tpu-
                && !postDeleted // AND the post is not deleted
                && !smokeyDisabled // AND SD info is stored in cache
            );
        case 'Guttenberg':
            // there's no way to report a post to Guttenberg,
            // so we just filter the posts that have been reported
            return Boolean(copypastorId);
        case 'Generic Bot':
            // Guttenberg can't track deleted posts
            return feedback === 'track' && !postDeleted && isStackOverflow;
    }
}

function getFeedbackSpans(
    flagType: CachedFlag,
    reporters: ReporterInformation,
    postDeleted: boolean
): HTMLSpanElement[] {
    const {
        Natty: natty,
        Smokey: metasmoke
    } = reporters;

    const smokeyId = metasmoke?.getSmokeyId();
    const nattyReported = natty?.wasReported() || false;

    type FeedbackEntries = [keyof FlagTypeFeedbacks, AllFeedbacks][];

    const spans = (Object.entries(flagType.feedbacks) as FeedbackEntries)
        // make sure there's actually a feedback
        .filter(([, feedback]) => feedback)
        .filter(([botName, feedback]) => {
            return canSendFeedback(
                botName,
                feedback,
                reporters,
                postDeleted
            );
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
            const shouldReport = (botName === 'Smokey' && !smokeyId)
                || (botName === 'Natty' && !nattyReported);

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

async function handleReportLinkClick(
    post: PostInfo,
    reporters: ReporterInformation,
    flagType: CachedFlag,
    flagText: string | null,
): Promise<void> {
    const { deleted, element } = post;

    const dropdown = element.querySelector('.advanced-flagging-popover');

    if (!dropdown) return;

    // hide the dropdown immediately after clicking one of the options
    $(dropdown).fadeOut('fast');

    // only if the post hasn't been deleted should we
    // upvote a comment/send feedback/downvote/flag it
    if (!deleted) {
        let comment = getCommentText(post, flagType);

        const leaveComment = dropdown.querySelector<HTMLInputElement>(
            '[id*="-leave-comment-checkbox-"]'
        )?.checked;
        // not allowed to leave comment => check if there are any same comments
        if (!leaveComment && comment) {
            upvoteSameComments(element, comment);

            comment = null;
        }

        const [flag, downvote] = [
            'flag',
            'downvote'
        ]
            .map(type => {
                return dropdown.querySelector<HTMLInputElement>(
                    `[id*="-${type}-checkbox-"]`
                )?.checked ?? false;
            });

        await handleActions(
            post,
            flagType,
            flag,
            downvote,
            flagText,
            comment,
            reporters.Guttenberg?.targetUrl
        );
    }

    // feedback should however be sent
    // if it's sent successfully, the success variable is true, otherwise false
    const success = await handleFlag(flagType, reporters, post);

    const { done, failed } = post;
    const { reportType, displayName } = flagType;

    // don't show performed/failed action icons if post has been flagged
    if (reportType !== 'NoFlag') return;

    if (success) {
        attachPopover(done, `Performed action ${displayName}`);

        $(done).fadeIn();
    } else {
        attachPopover(failed, `Failed to perform action ${displayName}`);

        $(failed).fadeIn();
    }
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

function getTooltipHtml(
    reporters: ReporterInformation,
    flagType: CachedFlag,
    post: PostInfo,
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

    const { deleted, raiseVlq } = post;
    const { reportType, downvote } = flagType;

    // Feedbacks: X with Y, foo with bar
    const feedbackText = getFeedbackSpans(
        flagType,
        reporters,
        deleted
    )
        .map(span => span.outerHTML)
        .join(', '); // separate the feedbacks
    const feedbacks = document.createElement('span');
    feedbacks.innerHTML = feedbackText;

    // Flag text: ...
    const tooltipFlagText = deleted ? '' : flagText;

    // Comment text: ...
    const commentText = getCommentText(post, flagType);
    const tooltipCommentText = (deleted ? '' : commentText) || '';

    // if the flag changed from VLQ to NAA, let the user know why
    const flagName = getFlagToRaise(reportType, raiseVlq);

    let reportTypeHuman = reportType === 'NoFlag' || !deleted
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

function getCommentText(
    { opReputation, opName }: PostInfo,
    { comments }: CachedFlag
): string | null {
    // Adds the author name before the comment if the option is enabled
    // and determines if the comment should be low/high rep
    const { addAuthorName: AddAuthorName } = cachedConfiguration;

    const commentType = (opReputation || 0) > 50 ? 'high' : 'low';
    const comment = comments?.[commentType] || comments?.low;

    if (comment){
        var sitename = StackExchange.options.site.name || "";
        sitename = sitename.replace(/ ?Stack Exchange/, "");
        var siteurl = window.location.hostname;

        comment = comment.replace(/%SITENAME%/, sitename);
        comment = comment.replace(/%SITEURL%/, siteurl);
        comment = comment.replace(/%OP%/, opName);
    }

    return (
        comment && AddAuthorName
            ? `${opName}, ${comment[0].toLowerCase()}${comment.slice(1)}`
            : comment
    ) || null;
}

// Section #1: Report links
function getReportLinks(
    reporters: ReporterInformation,
    post: PostInfo
): Menu.StacksMenuOptions['navItems'] {
    const { postType } = post;

    const {
        Guttenberg: copypastor,
    } = reporters;

    const { copypastorId, repost, targetUrl } = copypastor || {};

    // add the flag types to the category they correspond to
    const categories = cachedCategories
        // exclude categories that do not apply to the current post type
        .filter(item => item.appliesTo?.includes(postType))
        // create a new FlagType property to store cached flags
        .map(item => ({ ...item, FlagTypes: [] as CachedFlag[] }));

    // loop through all flag types and push them,
    // based on their BelongsTo, to .FlagTypes
    cachedFlagTypes
        // exclude disabled and non-SO flag types
        .filter(({ reportType, id, belongsTo, enabled }) => {
            // only Guttenberg reports (can) have ReportType === 'PlagiarizedContent/PostOther'
            const isGuttenbergItem = isSpecialFlag(reportType, false);

            const showGutReport = Boolean(copypastorId) // a CopyPastor id must exist
                // https://github.com/SOBotics/AdvancedFlagging/issues/16
                // id === 4 => Duplicate Answer
                && (id === 4 ? repost : !repost);

            // show the red flags, general, and answer-related items on every site,
            // restrict the others to Stack Overflow
            const showOnSo = ['Red flags', 'General', 'Answer-related'].includes(belongsTo) || isStackOverflow;

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

                const tooltipHtml = getTooltipHtml(
                    reporters,
                    flagType,
                    post,
                    flagText
                );

                const classes = isDangerous
                    ? [ 'fc-red-500' ]
                    : '';

                return {
                    text: displayName,
                    // unfortunately, danger: IsDangerous won't work
                    // since SE uses s-anchors__muted
                    blockLink: { selected: false },
                    // use this trick instead
                    ...(classes ? { classes } : {}),
                    click: {
                        handler: function (): void {
                            void handleReportLinkClick(
                                post,
                                reporters,
                                flagType,
                                flagText
                            );
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
function getOptionsRow(
    { element, postId }: PostInfo
): Menu.StacksMenuOptions['navItems'] {
    const comments = element.querySelector('.comment-body');

    const config = [
        ['Leave comment', Cached.Configuration.defaultNoComment],
        ['Flag', Cached.Configuration.defaultNoFlag],
        ['Downvote', Cached.Configuration.defaultNoDownvote]
    ] as [string, keyof Configuration][];

    // ['label test', globals.cacheKey]
    return config
        // don't leave comments on non-SO sites
//      .filter(([ text ]) => text === 'Leave comment' ? isStackOverflow : true)
        .map(([text, cacheKey]) => {
            const uncheck = cachedConfiguration[cacheKey]
                // extra requirement for the leave comment option:
                // there shouldn't be any comments below the post
                || (text === 'Leave comment' && comments);

            const idified = text.toLowerCase().replace(' ', '-');
            const id = `advanced-flagging-${idified}-checkbox-${postId}`;

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
function getSendFeedbackToRow(
    reporters: ReporterInformation,
    { postId }: PostInfo
): Menu.StacksMenuOptions['navItems'] {
    // oof!
    type ReportersEntries = [
        ['Smokey', MetaSmokeAPI],
        ['Natty', NattyAPI],
        ['Guttenberg', CopyPastorAPI],
        ['Generic Bot', GenericBotAPI]
    ];

    return (Object.entries(reporters) as ReportersEntries)
        // exclude bots that we can't send feedback to
        .filter(([bot, instance]) => {
            switch (bot) {
                case 'Natty':
                    return instance.wasReported() || instance.canBeReported();
                case 'Guttenberg':
                    return instance.copypastorId;
                case 'Generic Bot':
                    // generic works on SO
                    return isStackOverflow;
                case 'Smokey':
                    // valid everywhere, if not disabled
                    return !MetaSmokeAPI.isDisabled;
            }
        })
        .map(([botName]) => {
            const cacheKey = getCachedConfigBotKey(botName);
            const sanitised = botName.replace(/\s/g, '').toLowerCase();

            const botImage = createBotIcon(botName);

            // need the postId in the id to make it unique
            const botNameId = `advanced-flagging-send-feedback-to-${sanitised}-${postId}`;
            const defaultNoCheck = cachedConfiguration[cacheKey];

            const imageClone = botImage.cloneNode(true) as HTMLElement;

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
                    html: `Send feedback to ${botName}`,
                    position: 'right-start'
                }
            };
        });
}

export function makeMenu(
    reporters: ReporterInformation,
    post: PostInfo
): HTMLUListElement {
    const actionBoxes = getOptionsRow(post);

    const menu = Menu.makeMenu(
        {
            itemsType: 'a',
            navItems: [
                ...getReportLinks(reporters, post),
                ...actionBoxes,
                { separatorType: 'divider' },
                ...getSendFeedbackToRow(reporters, post)
            ],
        }
    );

    const arrow = document.createElement('div');
    arrow.classList.add('s-popover--arrow', 's-popover--arrow__tc');

    menu.prepend(arrow);

    setTimeout(() => increaseTooltipWidth(menu));

    return menu;
}
