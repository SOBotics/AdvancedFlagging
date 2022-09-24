import { Flags } from './FlagTypes';
import { parseQuestionsAndAnswers, PostInfo } from './UserscriptTools/sotools';
import { setupConfiguration } from './Configuration';
import { makeMenu } from './popover';

import { setupReview } from './review';
import {
    addXHRListener,
    attachPopover,
    Cached,
    cachedConfiguration,
    CachedFlag,
    cachedFlagTypes,
    debugMode,
    FlagNames,
    getFormDataFromObject,
    getHumanFromDisplayName,
    isLqpReviewPage,
    isQuestionPage,
    isStackOverflow,
    popupDelay
} from './shared';

import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';

import { Buttons } from '@userscripters/stacks-helpers';

// TODO publish & update stacks-helpers
// TODO how about creating a <nav> Config/Comments instead of 2 modals
// TODO classes to s-...-control in stacks-helpers

export type ValueOfReporters = NattyAPI | MetaSmokeAPI | CopyPastorAPI; // Object.values() is broken :(
type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;

export interface ReporterInformation {
    Smokey?: MetaSmokeAPI;
    Natty?: NattyAPI;
    Guttenberg?: CopyPastorAPI;
    'Generic Bot'?: GenericBotAPI;
}

interface StackExchangeFlagResponse {
    FlagType: number;
    Message: string;
    Outcome: number;
    ResultChangedState: boolean;
    Success: boolean;
}

function setupStyles(): void {
    GM_addStyle(`
.advanced-flagging-popover {
    min-width: 10rem !important;
}

#advanced-flagging-comments-modal textarea {
    resize: vertical;
}

#advanced-flagging-snackbar {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}

.advanced-flagging-link:focus {
    outline: none;
}

.advanced-flagging-link li > a {
    padding-block: 4px;
}

.advanced-flagging-link li > .s-checkbox-control {
    padding-inline: 6px;
    gap: 4px;
}

/* ------------------------------------------- */
/* -- TODO remove when natively implemented -- */
/* ------------------------------------------- */
.s-checkbox-control,
.s-radio-control {
  display: flex;
  gap: var(--su8);
  align-items: center;
}
.s-checkbox-control .s-label,
.s-radio-control .s-label {
  font-weight: normal;
}
.s-checkbox-group,
.s-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--su8);
}
.s-checkbox-group.s-checkbox-group__horizontal,
.s-checkbox-group.s-radio-group__horizontal,
.s-radio-group.s-checkbox-group__horizontal,
.s-radio-group.s-radio-group__horizontal {
  flex-direction: row;
}
.s-checkbox-group legend.s-label,
.s-radio-group legend.s-label {
  margin-bottom: var(--su8);
}
@supports ((-webkit-appearance: none) or (-moz-appearance: none) or (appearance: none)) {
  .s-checkbox,
  .s-radio {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    margin: 0;
    width: 1em;
    height: 1em;
    border: 1px solid var(--bc-darker);
    background-color: var(--white);
    outline: 0;
    font-size: inherit;
    vertical-align: middle;
    cursor: pointer;
  }
  .s-checkbox::-ms-check,
  .s-radio::-ms-check {
    display: none;
  }
}
.s-checkbox[disabled],
.s-radio[disabled] {
  opacity: var(--_o-disabled-static);
  cursor: not-allowed;
}
@supports ((-webkit-appearance: none) or (-moz-appearance: none) or (appearance: none)) {
  .s-checkbox {
    border-radius: var(--br-sm);
    background-position: center center;
    background-repeat: no-repeat;
    background-size: contain;
  }
  .s-checkbox:checked,
  .s-checkbox:indeterminate {
    border-color: var(--theme-secondary-400) !important;
    background-color: var(--theme-secondary-400);
  }
  @media (prefers-color-scheme: dark) {
    body.theme-highcontrast.theme-system .s-checkbox:checked,
    body.theme-highcontrast.theme-system .s-checkbox:indeterminate {
      border-color: var(--blue-700) !important;
      background-color: var(--blue-300);
    }
  }
  body.theme-highcontrast.theme-dark .s-checkbox:checked,
  body.theme-highcontrast.theme-dark .s-checkbox:indeterminate {
    border-color: var(--blue-700) !important;
    background-color: var(--blue-300);
  }
  .s-checkbox:checked:focus,
  .s-checkbox:indeterminate:focus {
    border-color: var(--theme-secondary-400);
  }
  .s-checkbox:checked {
    background-image: url("data:image/svg+xml,%3Csvg width='11' height='11' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 3.41L8.59 2 4 6.59 2.41 5 1 6.41l3 3z' fill='%23fff'/%3E%3C/svg%3E");
  }
  .s-checkbox:indeterminate {
    background-image: url("data:image/svg+xml,%3Csvg width='11' height='11' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4.5 h7 v2 h-7 z' fill='%23fff'/%3E%3C/svg%3E");
  }
  .s-checkbox:focus {
    border-color: var(--theme-secondary-300);
    box-shadow: 0 0 0 var(--su-static4) var(--focus-ring);
  }
}
@supports ((-webkit-appearance: none) or (-moz-appearance: none) or (appearance: none)) {
  .s-radio {
    border-radius: var(--br-circle);
  }
  .s-radio:checked {
    border-color: var(--theme-secondary-400);
    border-width: 0.30769231em;
    background-color: hsl(0, 0%, 100%);
  }
  @media (prefers-color-scheme: dark) {
    body.theme-highcontrast.theme-system .s-radio:checked {
      border-color: var(--blue-300);
      outline: 1px solid var(--black);
    }
  }
  body.theme-highcontrast.theme-dark .s-radio:checked {
    border-color: var(--blue-300);
    outline: 1px solid var(--black);
  }
  .s-radio:focus {
    box-shadow: 0 0 0 var(--su-static4) var(--focus-ring);
  }
}
.s-input:focus,
.s-input.has-focus,
.s-textarea:focus,
.s-select > select:focus {
  border-color: var(--theme-secondary-300);
  box-shadow: 0 0 0 var(--su-static4) var(--focus-ring);
  color: var(--black);
  outline: 0;
}
`);

}

const popupWrapper = document.createElement('div');
popupWrapper.classList.add(
    'fc-white',
    'fs-body3',
    'ta-center',
    'z-modal',
    'ps-fixed',
    'l50'
);
popupWrapper.id = 'advanced-flagging-snackbar';

document.body.append(popupWrapper);

export function getFlagToRaise(
    flagName: Flags,
    qualifiesForVlq: boolean
): Flags {
    const vlqFlag = FlagNames.VLQ;
    const naaFlag = FlagNames.NAA;

    // If the flag name is VLQ, check if the criteria are met.
    // If not, switch to NAA
    return flagName === vlqFlag
        ? (qualifiesForVlq ? vlqFlag : naaFlag)
        : flagName;
}

async function postComment(
    postId: number,
    fkey: string,
    comment: string,
): Promise<void> {
    const data = { fkey, comment };
    const url = `/posts/${postId}/comments`;

    if (debugMode) {
        console.log('Post comment via', url, data);

        return;
    }

    const request = await fetch(url, {
        method: 'POST',
        body: getFormDataFromObject(data)
    });
    const result = await request.text();

    // also see https://dev.stackoverflow.com/content/Js/full.en.js
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(result, null, false, true);

    $(document).trigger('comment', postId);
}

function getErrorMessage({ Message }: StackExchangeFlagResponse): string {
    if (Message.includes('already flagged')) {
        return 'post already flagged';
    } else if (Message.includes('limit reached')) {
        return 'post flag limit reached';
    } else {
        return Message;
    }
}

async function flagPost(
    postId: number,
    fkey: string,
    flagName: Flags,
    flagged: HTMLElement,
    flagText: string | null,
): Promise<void> {
    const failedToFlag = 'Failed to flag: ';

    const url = `/flags/posts/${postId}/add/${flagName}`;
    const data = { fkey, otherText: flagText || '' };

    if (debugMode) {
        console.log(`Flag post as ${flagName} via`, url, data);
        return;
    }

    const flagPost = await fetch(url, {
        method: 'POST',
        body: getFormDataFromObject(data)
    });

    // for some reason, the flag responses are inconsistent:
    // some are in JSON, others in text
    // for example, if a user flags posts too quickly, they get a text response
    // if the post has been flagged successfully, the response is in JSON
    const tooFast = /You may only flag a post every \d+ seconds?/;
    const responseText = await flagPost.text();

    if (tooFast.test(responseText)) { // flagging posts too quickly
        const rlCount = /\d+/.exec(responseText)?.[0] || 0;
        const pluralS = rlCount > 1 ? 's' : '';
        const message = `${failedToFlag}rate-limited for ${rlCount} second${pluralS}`;

        displayErrorFlagged(message, responseText);
        return;
    }

    const response = JSON.parse(responseText) as StackExchangeFlagResponse;

    if (response.Success) {
        displaySuccessFlagged(flagged, flagName);
    } else { // sometimes, although the status is 200, the post isn't flagged.
        const fullMessage = 'Failed to flag the post with outcome '
                          + `${response.Outcome}: ${response.Message}.`;
        const message = getErrorMessage(response);

        displayErrorFlagged(failedToFlag + message, fullMessage);
    }
}

export async function handleActions(
    { postId, element, flagged, raiseVlq }: PostInfo,
    { ReportType, Downvote }: CachedFlag,
    flagRequired: boolean,
    downvoteRequired: boolean,
    flagText: string | null,
    commentText?: string | null,
): Promise<void> {
    // needed to add the comment and raise the flag
    const fkey = StackExchange.options.user.fkey;

    if (commentText) {
        try {
            await postComment(postId, fkey, commentText);
        } catch (error) {
            displayToaster('Failed to comment on post', 'danger');
            console.error(error);
        }
    }

    if (flagRequired && ReportType !== 'NoFlag') {
        autoFlagging = true;

        // if the flag name is VLQ, then we need to check if the criteria are met.
        // If not, switch to NAA
        const flagName = getFlagToRaise(ReportType, raiseVlq);

        try {
            await flagPost(postId, fkey, flagName, flagged, flagText);
        } catch (error) {
            displayErrorFlagged('Failed to flag post', error as string);
        }
    }

    // downvoting process
    const button = element.querySelector<HTMLButtonElement>('.js-vote-down-btn');
    const hasDownvoted = button?.classList.contains('fc-theme-primary');
    // only downvote if post hasn't already been downvoted
    if (!downvoteRequired || !Downvote || hasDownvoted) return;

    if (debugMode) {
        console.log('Downvote post by clicking', button);

        return;
    }

    button?.click();
}

export async function handleFlag(
    flagType: CachedFlag,
    reporters: ReporterInformation,
    post?: PostInfo
): Promise<boolean> {
    const { element } = post || {};

    let hasFailed = false;

    // simultaneously send feedback to all bots
    // hasFailed will be set to true if something goes wrong
    const allPromises = (Object.values(reporters) as Reporter[])
        // keep only the bots the user has opted to send feedback to
        .filter(({ name }) => {
            const sanitised = name.replace(/\s/g, '').toLowerCase();
            const input = element?.querySelector<HTMLInputElement>(
                `[id*="-send-feedback-to-${sanitised}-"]
            `);

            // this may be undefined
            // (e.g. if the parameter is not passed or the checkbox is not found)
            // hence the ?? instead of ||
            const sendFeedback = input?.checked ?? true;

            return sendFeedback && flagType.Feedbacks[name];
        })
        // return a promise that sends the feedback
        // use .map() so that they run in paraller
        .map(reporter => {
            return reporter.sendFeedback(flagType.Feedbacks[reporter.name])
                .then(message => {
                    // promise resolves to a success message
                    if (message) {
                        displayToaster(message, 'success');
                    }
                })
                // otherwise throws an error caught here
                .catch((promiseError: Error) => {
                    displayToaster(promiseError.message, 'danger');

                    hasFailed = true;
                });
        });

    await Promise.allSettled(allPromises);

    return !hasFailed;
}

export function displayToaster(
    text: string,
    state: 'success' | 'danger'
): void {
    const element = document.createElement('div');
    element.classList.add('p12', `bg-${state}`);
    element.innerText = text;
    element.style.display = 'none';

    popupWrapper.append(element);

    $(element).fadeIn();

    window.setTimeout(() => {
        $(element).fadeOut('slow', () => element.remove());
    }, popupDelay);
}

function displaySuccessFlagged(icon: HTMLElement, reportType?: Flags): void {
    if (!reportType) return;

    const flaggedMessage = `Flagged ${getHumanFromDisplayName(reportType)}`;
    attachPopover(icon, flaggedMessage);
    $(icon).fadeIn();

    displayToaster(flaggedMessage, 'success');
}

function displayErrorFlagged(message: string, error: string): void {
    displayToaster(message, 'danger');

    console.error(error);
}

function getStrippedComment(commentText: string): string {
    // the comments under a post are in HTML, but the comments in cache in markdown
    // to determine if two comments are the same, we must strip the HTML
    return commentText
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Match [links](...)
        .replace(/\[([^\]]+)\][^(]*?/g, '$1') // Match [edit]
        .replace(/_([^_]+)_/g, '$1') //  _thanks_ => thanks
        .replace(/\*\*([^*]+)\*\*/g, '$1') // **thanks** => thanks
        .replace(/\*([^*]+)\*/g, '$1') // *thanks* => thanks
        .replace(' - From Review', ''); // remove the "from review" part
}

export function upvoteSameComments(
    postNode: Element,
    comment: string
): void {
    const strippedComment = getStrippedComment(comment);

    postNode
        .querySelectorAll<HTMLElement>('.comment-body .comment-copy')
        .forEach(element => {
            if (element.innerText !== strippedComment) return;

            const parent = element.closest('li');

            parent
                ?.querySelector<HTMLAnchorElement>(
                    'a.comment-up.comment-up-off' // voting button
                )
                ?.click(); // click it!
        });
}

const botImages = {
    Natty: 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1',
    Smokey: 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1',
    'Generic Bot': 'https://i.stack.imgur.com/6DsXG.png?s=32&g=1',
    Guttenberg: 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1'
};

export function createBotIcon(
    botName: keyof (typeof botImages),
    href?: string
): HTMLDivElement {
    const iconWrapper = document.createElement('div');
    iconWrapper.classList.add('flex--item', 'd-inline-block');

    if (!isQuestionPage && !isLqpReviewPage) {
        iconWrapper.classList.add('ml8'); // flag pages
    }

    const iconLink = document.createElement('a');
    iconLink.classList.add('s-avatar', 's-avatar__16', 's-user-card--avatar');

    if (href) {
        iconLink.href = href;
        iconLink.target = '_blank';
    }

    attachPopover(iconLink, `Reported by ${botName}`);
    iconWrapper.append(iconLink);

    const iconImage = document.createElement('img');
    iconImage.classList.add('s-avatar--image');
    iconImage.src = botImages[botName];
    iconLink.append(iconImage);

    return iconWrapper;
}

function buildFlaggingDialog(
    post: PostInfo,
    reporters: ReporterInformation,
): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.classList.add(
        's-popover',
        's-anchors',
        's-anchors__default',
        'mt2',
        'c-default',
        'px0',
        'py4',
        'advanced-flagging-popover'
    );

    const actionsMenu = makeMenu(reporters, post);
    dropdown.append(actionsMenu);

    return dropdown;
}

function setPopoverOpening(
    advancedFlaggingLink: HTMLElement,
    dropdown: HTMLElement
): void {
    // Determine if the dropdown should be opened on hover
    // or on click based on what the user has chosen
    const openOnHover = cachedConfiguration[Cached.Configuration.openOnHover];

    if (openOnHover) {
        advancedFlaggingLink.addEventListener('mouseover', event => {
            event.stopPropagation();

            if (advancedFlaggingLink.isSameNode(event.target as Node)) {
                $(dropdown).fadeIn('fast');
            }
        });

        advancedFlaggingLink.addEventListener('mouseleave', event => {
            event.stopPropagation();

            // avoid immediate closing of the popover
            setTimeout(() => $(dropdown).fadeOut('fast'), 200);
        });
    } else {
        advancedFlaggingLink.addEventListener('click', event => {
            event.stopPropagation();

            if (advancedFlaggingLink.isSameNode(event.target as Node)) {
                $(dropdown).fadeIn('fast');
            }
        });

        window.addEventListener('click', () => $(dropdown).fadeOut('fast'));
    }
}

function setFlagWatch(
    { postId, flagged }: PostInfo,
    reporters: ReporterInformation
): void {
    // Watch for manual flags if the user has chosen to do so
    const watchFlags = cachedConfiguration[Cached.Configuration.watchFlags];

    addXHRListener(xhr => {
        const { status, responseURL } = xhr;

        const flagNames = Object.values(FlagNames).join('|');
        const regex = new RegExp(
            `/flags/posts/${postId}/add/(${flagNames})`
        );

        if (!watchFlags // don't watch for flags
            || autoFlagging // post flagged via popover
            || status !== 200 // request failed
            || !regex.test(responseURL) // not a flag
        ) return;

        const matches = regex.exec(responseURL);
        const flag = (matches?.[1] as Flags);

        const flagType = cachedFlagTypes
            .find(item => item.SendWhenFlagRaised && item.ReportType === flag);
        if (!flagType) return;

        if (debugMode) {
            console.log('Post', postId, 'manually flagged as', flag, flagType);
        }

        displaySuccessFlagged(flagged, flagType.ReportType);

        void handleFlag(flagType, reporters);
    });
}

let autoFlagging = false;
function setupPostPage(): void {
    // check if the link + popover should be set up
    const linkDisabled = cachedConfiguration[Cached.Configuration.linkDisabled];
    if (linkDisabled || isLqpReviewPage) return; // do not add the buttons on review

    parseQuestionsAndAnswers(post => {
        const {
            postId,
            postType,
            questionTime,
            answerTime,
            page,
            iconLocation,
            score,
            deleted,
            done, failed, flagged
        } = post;

        // complicated process of setting up reporters:
        // --------------------------------------------

        // every site & post type
        const reporters: ReporterInformation = {
            Smokey: new MetaSmokeAPI(postId, postType, deleted)
        };

        // NAAs and plagiarised answers
        if (postType === 'Answer' && isStackOverflow) {
            reporters.Natty = new NattyAPI(postId, questionTime, answerTime, deleted);
            reporters.Guttenberg = new CopyPastorAPI(postId);
        }

        const icons = (Object.values(reporters) as ValueOfReporters[])
            .map(reporter => reporter.icon)
            .filter(Boolean) as HTMLElement[];

        // if we aren't in a question page, then we just insert the icons
        // should be done before Generic bot is set up
        // because it doesn't have an .icon
        if (page !== 'Question') {
            iconLocation.after(...icons);
        }

        // Guttenberg can only track Stack Overflow posts
        if (isStackOverflow) {
            reporters['Generic Bot'] = new GenericBotAPI(postId);
        }

        if (score === null) return; // can't use !score, because score might be 0

        setFlagWatch(post, reporters);

        if (page !== 'Question') return;

        // Now append the advanced flagging dialog
        const advancedFlaggingLink = Buttons.makeStacksButton(
            `advanced-flagging-link-${postId}`,
            'Advanced Flagging',
            {
                type: ['link'],
                classes: ['advanced-flagging-link']
            }
        );

        const flexItem = document.createElement('div');
        flexItem.classList.add('flex--item');

        flexItem.append(advancedFlaggingLink);
        iconLocation.append(flexItem);

        const dropDown = buildFlaggingDialog(post, reporters);
        advancedFlaggingLink.append(dropDown);

        iconLocation.append(done, failed, flagged, ...icons);

        setPopoverOpening(advancedFlaggingLink, dropDown);
    });
}

function Setup(): void {
    // Collect all ids
    void Promise.all([
        MetaSmokeAPI.setup(),
        MetaSmokeAPI.queryMetaSmokeInternal(),
        CopyPastorAPI.getAllCopyPastorIds(),
        NattyAPI.getAllNattyIds()
    ]).then(() => {
        setupPostPage();
        setupStyles();
        setupConfiguration();
        setupReview();
    });
}

Setup();
