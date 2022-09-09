import { Flags } from './FlagTypes';
import { parseQuestionsAndAnswers, PostInfo } from './UserscriptTools/sotools';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { setupConfiguration } from './Configuration';
import * as globals from './shared';
import { Buttons, } from '@userscripters/stacks-helpers';
import { makeMenu } from './popover';

// TODO publish & update stacks-helpers
// TODO managing all those CapitalCased properties is annoying
//      Convert to camelCase?? compatibility with older versions??
// TODO how about creating a <nav> Config/Comments instead of 2 modals
// TODO Menu should also handle checkboxes + radios

type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;
export type CheckboxesInformation = { [key in globals.BotNames]: HTMLElement }
type ValueOfReporters = NattyAPI | MetaSmokeAPI | CopyPastorAPI; // Object.values() is broken :(

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

interface ReviewQueuePostInfo {
    postId: number;
    post: PostInfo;
    reporters: ReporterInformation;
}

interface ReviewQueueResponse {
    postId: number;
    postTypeId: number; // see: StackOverflow.Models.PostTypeId
    isAudit: boolean; // detect audits & avoid sending feedback to bots
}

function SetupStyles(): void {
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
}`);

}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];

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
    const vlqFlag = globals.FlagNames.VLQ;
    const naaFlag = globals.FlagNames.NAA;

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
    const data = globals.getFormDataFromObject({ fkey, comment });

    const request = await fetch(`/posts/${postId}/comments`, {
        method: 'POST',
        body: data
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

    const flagPost = await fetch(`/flags/posts/${postId}/add/${flagName}`, {
        method: 'POST',
        body: globals.getFormDataFromObject({ fkey, otherText: flagText || '' })
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
    { ReportType, Downvote }: globals.CachedFlag,
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
            globals.displayError('Failed to comment on post');
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

    button?.click();
}

export async function handleFlag(
    flagType: globals.CachedFlag,
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
                        globals.displaySuccess(message);
                    }
                })
                // otherwise throws an error caught here
                .catch((promiseError: Error) => {
                    globals.displayError(promiseError.message);

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
        $(element).fadeOut('slow', () => $(element).remove());
    }, globals.popupDelay);
}

function displaySuccessFlagged(icon: HTMLElement, reportType?: Flags): void {
    if (!reportType) return;

    const flaggedMessage = `Flagged ${globals.getHumanFromDisplayName(reportType)}`;
    globals.attachPopover(icon, flaggedMessage);
    $(icon).fadeIn();

    globals.displaySuccess(flaggedMessage);
}

function displayErrorFlagged(message: string, error: string): void {
    globals.displayError(message);

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

export function createBotIcon(
    botName: keyof (typeof globals.botImages)
): HTMLDivElement {
    const iconWrapper = document.createElement('div');
    iconWrapper.classList.add('flex--item', 'd-none');
    if (!globals.isQuestionPage && !globals.isLqpReviewPage) {
        iconWrapper.classList.add('ml8'); // flag pages
    }

    const iconLink = document.createElement('a');
    iconLink.classList.add('s-avatar', 's-avatar__16', 's-user-card--avatar');
    globals.attachPopover(iconLink, `Reported by ${botName}`);
    iconWrapper.append(iconLink);

    const iconImage = document.createElement('img');
    iconImage.classList.add('s-avatar--image');
    iconImage.src = globals.botImages[botName];
    iconLink.append(iconImage);

    return iconWrapper;
}

function getAllBotIcons(): HTMLDivElement[] {
    return [
        'Natty',
        'Guttenberg',
        'Smokey'
    ]
        .map(bot => createBotIcon(bot as globals.BotNames));
}

function addBotIconsToReview(post: PostInfo): void {
    const {
        postType,
        element,
        postId,
        questionTime,
        answerTime
    } = post;

    if (postType !== 'Answer') return;

    // TODO create bot icons in the same file/class, not here!
    const botIconsToAppend = getAllBotIcons();
    const iconLocation = element
        .querySelector('.js-post-menu')
        ?.firstElementChild;

    iconLocation?.append(...botIconsToAppend);

    const reporters: ReporterInformation = {
        Natty: new NattyAPI(postId, questionTime, answerTime),
        Smokey: new MetaSmokeAPI(postId, postType),
        Guttenberg: new CopyPastorAPI(postId)
    };

    reviewPostsInformation.push({ postId, post, reporters });
}

function buildFlaggingDialog(
    post: PostInfo,
    reporters: ReporterInformation,
): HTMLElement {
    //const { element, postId } = post;

    //const [commentRow, flagRow, downvoteRow] = getOptionsRow(element, postId);
    //const checkboxes = getSendFeedbackToRow(reporters, postId);

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

    /*const {
        Guttenberg: copypastor,
        Natty: natty
    } = reporters;

    const { copypastorId } = copypastor || {};*/

    //if (globals.isStackOverflow) actionsMenu.append(commentRow); // the user shouldn't be able to leave comments on non-SO sites
    //actionsMenu.append(flagRow, downvoteRow);

    //if (elementsToAppend.length) {
    //    actionsMenu.append(globals.categoryDivider.clone(), ...elementsToAppend as JQuery[]);
    //}

    return dropdown;
}

function setPopoverOpening(
    advancedFlaggingLink: HTMLElement,
    dropdown: HTMLElement
): void {
    // Determine if the dropdown should be opened on hover
    // or on click based on what the user has chosen
    const openOnHover = globals.cachedConfiguration[globals.ConfigurationOpenOnHover];

    if (openOnHover) {
        advancedFlaggingLink.addEventListener('mouseover', event => {
            event.stopPropagation();

            if (advancedFlaggingLink.isSameNode(event.target as Node)) {
                $(dropdown).fadeIn('fast');
            }
        });

        advancedFlaggingLink.addEventListener('mouseout', event => {
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
    const watchFlags = globals.cachedConfiguration[globals.ConfigurationWatchFlags];

    globals.addXHRListener(xhr => {
        const { status, responseURL } = xhr;

        if (!watchFlags // don't watch for flags
            || autoFlagging // post flagged via popover
            || status !== 200 // request failed
            || !globals.flagsUrlRegex.test(responseURL) // not a flag
        ) return;

        const matches = globals.getFlagsUrlRegex(postId).exec(responseURL);
        const flag = (matches?.[1] as Flags);

        const flagType = globals.cachedFlagTypes
            .find(item => item.SendWhenFlagRaised && item.ReportType === flag);
        if (!flagType) return;

        displaySuccessFlagged(flagged, flagType.ReportType);

        void handleFlag(flagType, reporters);
    });
}

let autoFlagging = false;
function SetupPostPage(): void {
    // check if the link + popover should be set up
    const linkDisabled = globals.cachedConfiguration[globals.ConfigurationLinkDisabled];
    if (linkDisabled || globals.isLqpReviewPage) return; // do not add the buttons on review

    parseQuestionsAndAnswers(post => {
        const {
            postId,
            postType,
            questionTime,
            answerTime,
            page,
            iconLocation,
            score,
        } = post;

        // complicated process of setting up reporters:
        // --------------------------------------------

        // every site & post type
        const reporters: ReporterInformation = {
            Smokey: new MetaSmokeAPI(postId, postType)
        };

        // NAAs and plagiarised answers
        if (postType === 'Answer' && globals.isStackOverflow) {
            reporters.Natty = new NattyAPI(postId, questionTime, answerTime);
            reporters.Guttenberg = new CopyPastorAPI(postId);
        }

        // if we aren't in a question page, then we just insert the icons
        // should be done before Generic bot is set up
        // because it doesn't have an .icon
        if (page !== 'Question') {
            const icons = (Object.values(reporters) as ValueOfReporters[])
                .map(reporter => reporter.icon)
                .filter(Boolean) as HTMLElement[];

            iconLocation.append(...icons);
        }

        // Guttenberg can only track Stack Overflow posts
        if (globals.isStackOverflow) {
            reporters['Generic Bot'] = new GenericBotAPI(postId);
        }

        if (score === null) return; // can't use !score, because score might be 0

        const advancedFlaggingLink = Buttons.makeStacksButton(
            'advanced-flagging-link',
            'Advanced Flagging',
            { type: [ 'link' ] }
        );

        const flexItem = document.createElement('div');
        flexItem.classList.add('flex--item');

        flexItem.append(advancedFlaggingLink);
        iconLocation.append(flexItem);

        // Now append the advanced flagging dialog
        const dropDown = buildFlaggingDialog(post, reporters);
        advancedFlaggingLink.append(dropDown);

        setPopoverOpening(advancedFlaggingLink, dropDown);
        setFlagWatch(post, reporters);
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
        SetupPostPage();
        SetupStyles();
        setupConfiguration();
    });

    const watchReview = globals.cachedConfiguration[globals.ConfigurationWatchQueues];
    if (!watchReview) return;

    globals.addXHRListener(xhr => {
        if (
            xhr.status !== 200 // request failed
         || !globals.isReviewItemRegex.test(xhr.responseURL) // not a review request
         || !document.querySelector('#answer') // not an answer
        ) return;

        const reviewResponse = JSON.parse(xhr.responseText) as ReviewQueueResponse;
        if (
            reviewResponse.isAudit // an audit
            || reviewResponse.postTypeId !== 2 // not an answer
        ) return;

        const cachedPost = reviewPostsInformation
            .find(item => item.postId === reviewResponse.postId)?.post;

        cachedPost
            ? addBotIconsToReview(cachedPost) // post already stored, don't fetch again
            : parseQuestionsAndAnswers(addBotIconsToReview);
    });

    $(document).on('click', '.js-review-submit', () => {
        const looksGood = document.querySelector<HTMLInputElement>(
            '#review-action-LooksGood'
        );

        // must have selected 'Looks OK' and clicked submit
        if (!looksGood?.checked) return;

        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation
            .find(item => item.postId === postId);

        const flagType = globals.cachedFlagTypes
            // send 'Looks Fine' feedback:
            // get the respective flagType, call handleFlag()
            .find(item => item.DisplayName === 'Looks Fine');

        if (!reviewCachedInfo || !flagType) return; // something went wrong

        void handleFlag(flagType, reviewCachedInfo.reporters);
    });

    globals.addXHRListener(xhr => {
        if (
            xhr.status !== 200 // request failed
            || !globals.isDeleteVoteRegex.test(xhr.responseURL) // didn't vote to delete
            || !document.querySelector('#answer') // not an answer
        ) return;

        const postId = globals.getPostIdFromReview();
        const cached = reviewPostsInformation
            .find(item => item.postId === postId);

        if (!cached) return;

        const { postType, questionTime, answerTime } = cached.post;

        if (postType !== 'Answer') return;

        const reportersArray: ReporterInformation = {
            Natty: new NattyAPI(postId, questionTime, answerTime)
        };

        const flagType = globals.cachedFlagTypes
            .find(item => item.DisplayName === 'Not an answer'); // the NAA cached flag type
        if (!flagType) return; // something went wrong

        void handleFlag(flagType, reportersArray);
    });
}

Setup();
