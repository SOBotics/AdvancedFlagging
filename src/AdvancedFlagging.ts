import { Flags, HumanFlags } from './FlagTypes';
import { parseQuestionsAndAnswers, PostInfo } from './UserscriptTools/sotools';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { setupConfiguration } from './Configuration';
import * as globals from './GlobalVars';

function SetupStyles(): void {
    GM_addStyle(`
${globals.classSelectors.dialog} { min-width: 10rem !important; }
${globals.idSelectors.commentsModal} textarea { resize: vertical; }
${globals.idSelectors.snackbar} {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}`);
}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];
const popupWrapper = document.createElement('div');
document.body.append(popupWrapper);

function getFlagToRaise(flagName: Flags, qualifiesForVlq: boolean): Flags {
    const vlqFlag = globals.FlagNames.VLQ;
    const naaFlag = globals.FlagNames.NAA;

    // if the flag name is VLQ, then we need to check if the criteria are met. If not, switch to NAA
    return flagName === vlqFlag ? (qualifiesForVlq ? vlqFlag : naaFlag) : flagName;
}

async function handleActions(
    post: PostInfo,
    flag: globals.CachedFlag,
    flagRequired: boolean,
    downvoteRequired: boolean,
    reportedIcon: JQuery,
    qualifiesForVlq: boolean,
    flagText: string | null,
    commentText?: string | null,
): Promise<void> {
    const userFkey = StackExchange.options.user.fkey; // needed to add the comment and raise a flag

    if (commentText) {
        try {
            const postComment = await fetch(`/posts/${post.postId}/comments`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, comment: commentText })
            });
            const commentResult = await postComment.text();

            showComments(post.postId, commentResult);
        } catch (error) {
            globals.displayError('Failed to comment on post');
            console.error(error);
        }
    }

    if (flagRequired && flag.ReportType !== 'NoFlag') {
        autoFlagging = true;
        // if the flag name is VLQ, then we need to check if the criteria are met. If not, switch to NAA
        const flagName = getFlagToRaise(flag.ReportType, qualifiesForVlq);
        try {
            const failedToFlagText = 'Failed to flag: ';
            const flagPost = await fetch(`/flags/posts/${post.postId}/add/${flagName}`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, otherText: flagText || '' })
            });

            // for some reason, the flag responses are inconsistent: some are in JSON, others in text
            // for example, if a user flags posts too quickly, then they get a text response
            // if the post has been flagged successfully, the response is in JSON format
            const tooQuicklyRegex = /You may only flag a post every \d+ seconds?/;
            const responseText = await flagPost.text();
            if (tooQuicklyRegex.test(responseText)) { // flagging posts too quickly
                const rateLimitedSeconds = /\d+/.exec(responseText)?.[0] || 0;
                const pluralS = rateLimitedSeconds > 1 ? 's' : '';
                const message = `${failedToFlagText}rate-limited for ${rateLimitedSeconds} second${pluralS}`;

                displayErrorFlagged(message, responseText);
                return;
            }

            const responseJson = JSON.parse(responseText) as StackExchangeFlagResponse;
            if (responseJson.Success) {
                displaySuccessFlagged(reportedIcon, flagName);
            } else { // sometimes, although the status is 200, the post isn't flagged.
                const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                const message = getErrorMessage(responseJson);

                displayErrorFlagged(failedToFlagText + message, fullMessage);
            }
        } catch (error) {
            displayErrorFlagged('Failed to flag post', error as string);
        }
    }

    const downvoteButton = post.element.querySelector<HTMLButtonElement>('.js-vote-down-btn');
    const hasDownvoted = downvoteButton?.classList.contains('fc-theme-primary');
    // only downvote if post hasn't already been downvoted
    if (!downvoteRequired || !flag.Downvote || hasDownvoted) return;

    downvoteButton?.click();
}

async function handleFlag(
    flagType: globals.CachedFlag,
    reporters: ReporterInformation,
    checkboxesInformation?: CheckboxesInformation
): Promise<boolean> {
    let hasFailed = false;

    // simultaneously send feedback to all bots
    // hasFailed will be set to true if something goes wrong
    const allPromises = (Object.values(reporters) as Reporter[])
        .filter(item => flagType.Feedbacks[item.name])
        .map(reporter => {
            const checkbox = checkboxesInformation?.[reporter.name][0].querySelector('input');
            // this may be undefined (the parameter is not passed or the checkbox is somehow not found)
            // hence the ?? instead of ||
            const sendFeedbackToBot = checkbox?.checked ?? true;

            return reporter.sendFeedback(flagType.Feedbacks[reporter.name], sendFeedbackToBot)
                .then(promiseValue => promiseValue ? globals.displaySuccess(promiseValue) : '')
                .catch((promiseError: Error) => {
                    globals.displayError(promiseError.message);
                    hasFailed = true;
                });
        });

    await Promise.allSettled(allPromises);

    return !hasFailed;
}

export function displayToaster(message: string, state: string): void {
    const messageDiv = globals.getMessageDiv(message, state);

    popupWrapper.classList.add('fc-white', 'fs-body3', 'ta-center', 'z-modal', 'ps-fixed', 'l50');
    popupWrapper.id = globals.modalIds.snackbar;
    $(popupWrapper).append(messageDiv.fadeIn());

    window.setTimeout(() => messageDiv.fadeOut('slow', () => messageDiv.remove()), globals.popupDelay);
}

function displaySuccessFlagged(reportedIcon: JQuery, reportType?: Flags): void {
    if (!reportType) return;

    const flaggedMessage = `Flagged ${globals.getHumanFromDisplayName(reportType)}`;
    globals.attachPopover(reportedIcon[0], flaggedMessage);
    reportedIcon.fadeIn();

    globals.displaySuccess(flaggedMessage);
}

function displayErrorFlagged(message: string, error: string): void {
    globals.displayError(message);
    console.error(error);
}

function getStrippedComment(commentText: string): string {
    // the comments under a post are in HTML, but the comments in cache in markdown
    // to determine if two comments are the same, we must strip the HTML
    return commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Match [links](...)
        .replace(/\[([^\]]+)\][^(]*?/g, '$1') // Match [edit]
        .replace(/_([^_]+)_/g, '$1') //  _thanks_ => thanks
        .replace(/\*\*([^*]+)\*\*/g, '$1') // **thanks** => thanks
        .replace(/\*([^*]+)\*/g, '$1') // *thanks* => thanks
        .replace(' - From Review', ''); // in case the comment was left via review, remove that part
}

function upvoteSameComments(postElement: Element, strippedCommentText: string): void {
    postElement
        .querySelectorAll<HTMLSpanElement>('.comment-body .comment-copy')
        .forEach(element => {
            if (element.innerText !== strippedCommentText) return;

            element
                .closest('li') // find the parent
                ?.querySelector<HTMLAnchorElement>('a.comment-up.comment-up-off') // select the voting button
                ?.click(); // click it!
        });
}

function getErrorMessage(responseJson: StackExchangeFlagResponse): string {
    if (responseJson.Message.includes('already flagged')) {
        return 'post already flagged';
    } else if (responseJson.Message.includes('limit reached')) {
        return 'post flag limit reached';
    } else {
        return responseJson.Message;
    }
}

function showComments(postId: number, data: string): void {
    // also see https://dev.stackoverflow.com/content/Js/full.en.js
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(data, null, false, true);

    $(document).trigger('comment', postId);
}

function increasePopoverWidth(reportLink: HTMLAnchorElement): void {
    const popoverId = reportLink.parentElement?.getAttribute('aria-describedby') || '';
    document
        .querySelector(`#${popoverId}`)
        ?.classList
        .add('sm:wmn-initial', 'md:wmn-initial', 'wmn5');
}

function getAllBotIcons(): HTMLDivElement[] {
    return ['Natty', 'Guttenberg', 'Smokey']
        .map(bot => globals.createBotIcon(bot as globals.BotNames));
}

function addBotIconsToReview(post: PostInfo): void {
    if (post.postType !== 'Answer') return;

    const botIconsToAppend = getAllBotIcons();
    const [nattyIcon, copypastorIcon, smokeyIcon] = botIconsToAppend;
    const iconLocation = post.element.querySelector('.js-post-menu')?.firstElementChild;

    iconLocation?.append(...botIconsToAppend);

    const reporters: ReporterInformation = {
        Natty: new NattyAPI(post.postId, post.questionTime, post.answerTime, nattyIcon),
        Smokey: new MetaSmokeAPI(post.postId, post.postType, smokeyIcon),
        Guttenberg: new CopyPastorAPI(post.postId, copypastorIcon)
    };

    Object
        .values(reporters)
        .forEach((reporter: ValueOfReporters) => reporter.setupIcon()); // setup all icons

    reviewPostsInformation.push({ postId: post.postId, post, reporters });
}

function getFeedbackSpans(
    flagType: globals.CachedFlag,
    nattyReported: boolean,
    nattyCanReport: boolean,
    smokeyReported: boolean,
    guttenbergReported: boolean,
    postDeleted: boolean
): HTMLSpanElement[] {
    const spans = (Object.entries(flagType.Feedbacks) as [keyof globals.FlagTypeFeedbacks, globals.AllFeedbacks][])
        .filter(([botName, feedback]) => {
            return feedback && // make sure there's actually a feedback

                // either the post has been reported to Natty OR it can be reported AND the feedback is tp
                (botName === 'Natty' && (nattyReported || (nattyCanReport && !/fp|ne/.test(feedback))))

                // either the post has been reported to Smokey OR the feedback is tpu- (thus the post is reportable)
                // the post can't be reported if it's been deleted
                || (botName === 'Smokey' && (smokeyReported || (!/naa|fp|tp-/.test(feedback) && !postDeleted)))

                // there's no way to report a post to Guttenberg, so we just filter the posts that have been reported
                || (botName === 'Guttenberg' && guttenbergReported
                || (botName === 'Generic Bot' && feedback === 'track')); // only get bot names where there is feedback
        })
        .map(([botName, feedback]) => {
            const feedbackSpan = document.createElement('span');
            const strongElement = document.createElement('b');
            feedbackSpan.append(strongElement);

            if (feedback === 'track') {
                strongElement.innerText = 'track ';
                feedbackSpan.append('with Generic Bot');
                return feedbackSpan; // different string for Generic Bot
            }

            // determine the colour to add to the feedback using Stacks classes
            // https://stackoverflow.design/product/base/colors/#danger-and-error
            const [isGreen, isRed, isYellow] = [/tp/, /fp/, /naa|ne/].map(regex => regex.test(feedback));

            let className: globals.StacksToastState | '' = '';
            if (isGreen) className = 'success';
            else if (isRed) className = 'danger';
            else if (isYellow) className = 'warning';

            // make it clear that the post will be reported in the popover
            // again, this shouldn't happen if the post is deleted
            const shouldReport = (botName === 'Smokey' && !smokeyReported) || (botName === 'Natty' && !nattyReported);
            feedbackSpan.classList.add(`fc-${className}`);
            strongElement.innerHTML = shouldReport ? 'report' : feedback;
            feedbackSpan.after(` to ${botName}`);

            return feedbackSpan;
        }).filter(String);

    return spans.length ? spans : [globals.noneSpan];
}

function getPopoverOption(checkboxId: string, labelText: string, checked: boolean): JQuery {
    const checkbox = globals.createCheckbox(checkboxId, labelText, checked, {
        label: 'pt1 fs-body1'
    });

    return globals.dropdownItem
        .clone()
        .addClass('pl8')
        .append(checkbox);
}

function getOptionsRow(postElement: Element, postId: number): JQuery[] {
    const postComments = postElement.querySelector('.comment-body');

    // check which of the checkboxes the user has chosen to uncheck by default
    const defaultNoComment = globals.cachedConfiguration[globals.ConfigurationDefaultNoComment];
    const defaultNoFlag = globals.cachedConfiguration[globals.ConfigurationDefaultNoFlag];
    const defaultNoDownvote = globals.cachedConfiguration[globals.ConfigurationDefaultNoDownvote];

    // check 'Leave comment' if there aren't more comments and user has selected to do so
    const checkComment = !defaultNoComment && !postComments;

    const commentCheckboxId = globals.getDynamicAttributes.optionCheckbox('comment', postId);
    const flagCheckboxId = globals.getDynamicAttributes.optionCheckbox('flag', postId);
    const downvoteCheckboxId = globals.getDynamicAttributes.optionCheckbox('downvote', postId);

    const commentRow = getPopoverOption(commentCheckboxId, 'Leave comment', checkComment);
    const flagRow = getPopoverOption(flagCheckboxId, 'Flag', !defaultNoFlag);
    const downvoteRow = getPopoverOption(downvoteCheckboxId, 'Downvote', !defaultNoDownvote);

    return [commentRow, flagRow, downvoteRow];
}

function getBotFeedbackCheckboxesRow(reporters: ReporterInformation, postId: number): CheckboxesInformation {
    const checkboxes: CheckboxesInformation = {} as CheckboxesInformation;

    (Object.keys(reporters) as globals.BotNames[]).forEach(botName => {
        const configCacheKey = globals.getCachedConfigBotKey(botName) as keyof globals.CachedConfiguration;
        const sanitisedBotName = botName.replace(/\s/g, '').toLowerCase();

        // need the postId in the id to make it unique
        const botNameId = globals.getDynamicAttributes.popoverSendFeedbackTo(sanitisedBotName, postId);
        const defaultNoCheck = globals.cachedConfiguration[configCacheKey];
        const botImage = globals.createBotIcon(botName);
        globals.showInlineElement(botImage);

        checkboxes[botName] = getPopoverOption(botNameId, `Feedback to ${botImage.outerHTML}`, !defaultNoCheck);
        globals.attachPopover(checkboxes[botName][0], `Send feedback to ${botName}`, 'right-start');
    });

    return checkboxes;
}

type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;
type CheckboxesInformation = { [key in globals.BotNames]: JQuery }
type ValueOfReporters = NattyAPI | MetaSmokeAPI | CopyPastorAPI; // Object.values() is broken :(

interface ReporterInformation {
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
    postTypeId: number; // run StackOverflow.Models.PostTypeId to see what typeId each post has
    isAudit: boolean; // we need to determine if a review post is an audit to avoid sending feedback to bots
}

function BuildFlaggingDialog(
    post: PostInfo,
    reportedIcon: JQuery,
    performedActionIcon: JQuery,
    reporters: ReporterInformation,
    shouldRaiseVlq: boolean,
    failedActionIcon: JQuery,
): JQuery {
    const [commentRow, flagRow, downvoteRow] = getOptionsRow(post.element, post.postId);
    const checkboxesInformation = getBotFeedbackCheckboxesRow(reporters, post.postId);
    const dropdown = globals.dropdown.clone(), actionsMenu = globals.actionsMenu.clone();
    dropdown.append(actionsMenu);

    const copypastorApi = reporters.Guttenberg, nattyApi = reporters.Natty, metasmokeApi = reporters.Smokey;
    const smokeyId = metasmokeApi?.getSmokeyId();
    const { copypastorId, repost, targetUrl } = copypastorApi || {};

    // add the flag types to the category they correspond to
    const newCategories = globals.cachedCategories
        .filter(item => item.AppliesTo?.includes(post.postType))
        .map(item => ({ ...item, FlagTypes: [] as globals.CachedFlag[] }));

    globals.cachedFlagTypes.filter(flagType => {
        // only Guttenberg reports (can) have the PostOther ReportType
        const isGuttenbergItem = flagType.ReportType === globals.FlagNames.ModFlag;

        // a CopyPastor id must exist and the requirements from https://github.com/SOBotics/AdvancedFlagging/issues/16 must be met
        const showGutReport = Boolean(copypastorId) && (flagType.DisplayName === 'Duplicate Answer' ? repost : !repost);

        // show the red flags and general items on every site, restrict the others to Stack Overflow
        const showOnMainSite = ['Red flags', 'General'].includes(flagType.BelongsTo) || globals.isStackOverflow;

        return flagType.Enabled && (isGuttenbergItem ? showGutReport : showOnMainSite);
    }).forEach(flagType => newCategories.find(category => flagType.BelongsTo === category.Name)?.FlagTypes.push(flagType));

    newCategories.filter(category => category.FlagTypes.length).forEach(category => {
        category.FlagTypes.forEach(flagType => {
            const reportLink = globals.reportLink.clone().addClass(category.IsDangerous ? 'fc-red-500' : '');
            const dropdownItem = globals.dropdownItem.clone();

            globals.showElement(reportLink.text(flagType.DisplayName));
            dropdownItem.append(reportLink);
            actionsMenu.append(dropdownItem);

            let commentText = globals.getFullComment(flagType.Id, {
                authorReputation: post.opReputation || 0,
                authorName: post.opName
            });

            const flagName = getFlagToRaise(flagType.ReportType, shouldRaiseVlq);
            const flagText = copypastorId && targetUrl ? globals.getFullFlag(flagType.Id, targetUrl, copypastorId) : '';
            const feedbacksString = getFeedbackSpans(
                flagType,
                nattyApi?.wasReported() || false,
                nattyApi?.canBeReported() || false,
                Boolean(smokeyId),
                Boolean(copypastorId),
                post.deleted
            ).map(element => element.innerText).join('');

            let reportTypeHuman = flagType.ReportType === 'NoFlag' || !post.deleted
                ? globals.getHumanFromDisplayName(flagName)
                : '';
            const tooltipCommentText = (post.deleted ? '' : commentText) || '';
            const tooltipFlagText = post.deleted ? '' : flagText;

            // if the flag changed from VLQ to NAA, let the user know why
            if (flagType.ReportType !== flagName) reportTypeHuman += ' (VLQ criteria weren\'t met)';

            // the HTML that will be on the tooltip contains information regarding the flag that will be raised,
            // the comment that will be added, the flag text if the flag is PostOther and the feedbacks that will be sent to bots

            const popoverParent = document.createElement('div');
            
            Object.entries({
                'Flag': reportTypeHuman,
                'Comment': tooltipCommentText,
                'Flag text': tooltipFlagText,
                'Feedbacks': feedbacksString
            })
                .filter(([, value]) => value)
                .map(([boldText, value]) => globals.createPopoverToOption(boldText, value, post.deleted))
                .forEach(element => popoverParent.append(element));

            const downvoteWrapper = document.createElement('div');
            const downvoteOrNot = flagType.Downvote ? '<b>Downvotes</b>' : 'Does <b>not</b> downvote'
            downvoteWrapper.innerHTML = `${downvoteOrNot} the post`;

            popoverParent.append(downvoteWrapper);

            // because the tooltips are originally too narrow, we need to increase min-width
            globals.attachHtmlPopover(reportLink.parent()[0], popoverParent.innerHTML, 'right-start');
            setTimeout(() => increasePopoverWidth(reportLink));

            reportLink.on('click', async () => {
                // hide the dropdown immediately after clicking one of the options
                dropdown.fadeOut('fast');

                // only if the post hasn't been deleted should we upvote a comment/send feedback/downvote/flag it
                if (!post.deleted) {
                    if (!commentRow.find('.s-checkbox').is(':checked') && commentText) {
                        upvoteSameComments(post.element, getStrippedComment(commentText));
                        commentText = null;
                    }

                    const flagPost = flagRow.find('.s-checkbox').is(':checked');
                    const downvoteBoxChecked = downvoteRow.find('.s-checkbox').is(':checked');
                    await handleActions(
                        post,
                        flagType,
                        flagPost,
                        downvoteBoxChecked,
                        reportedIcon,
                        shouldRaiseVlq,
                        flagText,
                        commentText
                    );
                }

                // feedback should however be sent
                // if it's sent successfully, the success variable is true, otherwise false
                const success = await handleFlag(flagType, reporters, checkboxesInformation);
                if (flagType.ReportType !== 'NoFlag') return; // don't show performed/failed action icons if post has been flagged

                if (success) {
                    globals.attachPopover(performedActionIcon[0], `Performed action ${flagType.DisplayName}`);
                    performedActionIcon.fadeIn();
                } else {
                    globals.attachPopover(failedActionIcon[0], `Failed to perform action ${flagType.DisplayName}`);
                    failedActionIcon.fadeIn();
                }
            });
        });

        actionsMenu.append(globals.categoryDivider.clone()); // add the divider
    });

    actionsMenu.append(globals.popoverArrow.clone());

    if (globals.isStackOverflow) actionsMenu.append(commentRow); // the user shouldn't be able to leave comments on non-SO sites
    actionsMenu.append(flagRow, downvoteRow);

    const elementsToAppend = Object
        .entries(checkboxesInformation)
        .filter(([botName]) => {
            // a post that has been reported or can be reported
            botName === 'Natty' && (nattyApi?.wasReported() || nattyApi?.canBeReported())
         || botName === 'Guttenberg' && copypastorId
         || botName === 'Generic Bot' && globals.isStackOverflow // generic only works on SO
        })
        .map(([, element]) => element);

    if (elementsToAppend.length) actionsMenu.append(globals.categoryDivider.clone(), ...elementsToAppend as JQuery[]);

    return dropdown;
}

let autoFlagging = false;
function SetupPostPage(): void {
    const linkDisabled = globals.cachedConfiguration[globals.ConfigurationLinkDisabled];
    if (linkDisabled || globals.isLqpReviewPage) return; // do not add the buttons on review

    parseQuestionsAndAnswers(post => {
        if (!post.element) return;

        const [nattyIcon, copypastorIcon, smokeyIcon] = getAllBotIcons();
        const reporters: ReporterInformation = {
            Smokey: new MetaSmokeAPI(post.postId, post.postType, smokeyIcon)
        };

        if (post.postType === 'Answer' && globals.isStackOverflow) {
            reporters.Natty = new NattyAPI(post.postId, post.questionTime, post.answerTime, nattyIcon);
            reporters.Guttenberg = new CopyPastorAPI(post.postId, copypastorIcon);
        }
        // run before adding Generic Bot to the list
        Object.values(reporters).forEach((reporter: ValueOfReporters) => reporter.setupIcon()); // setup all icons

        if (globals.isStackOverflow) reporters['Generic Bot'] = new GenericBotAPI(post.postId);

        // if we aren't in a question page, then we just insert the icons
        if (post.page !== 'Question') return post.iconLocation.after(smokeyIcon, copypastorIcon, nattyIcon);
        if (post.score === null) return; // can't use !post.score, because score might be 0

        const advancedFlaggingLink = globals.createButton('Advanced Flagging', [ 'link' ]);
        post.iconLocation.append(globals.flexItemDiv.clone().append(advancedFlaggingLink));

        const performedActionIcon = globals.performedActionIcon();
        const failedActionIcon = globals.failedActionIcon();
        const reportedIcon = globals.reportedIcon();

        // Now append the advanced flagging dialog
        const shouldRaiseVlq = globals.qualifiesForVlq(post.score, post.answerTime);
        const dropDown = BuildFlaggingDialog(post, reportedIcon, performedActionIcon, reporters, shouldRaiseVlq, failedActionIcon);
        advancedFlaggingLink.append(dropDown);
        post.iconLocation.append(performedActionIcon, reportedIcon, failedActionIcon, nattyIcon, copypastorIcon, smokeyIcon);

        // Determine if the dropdown should be opened on hover or on click based on what the user has chosen
        const openOnHover = globals.cachedConfiguration[globals.ConfigurationOpenOnHover];
        if (openOnHover) {
            advancedFlaggingLink.on('mouseover', event => {
                event.stopPropagation();
                if (event.target === advancedFlaggingLink.get(0)) dropDown.fadeIn('fast');
            }).on('mouseleave', e => {
                e.stopPropagation();
                setTimeout(() => dropDown.fadeOut('fast'), 200); // avoid immediate closing of the popover
            });
        } else {
            advancedFlaggingLink.on('click', event => {
                event.stopPropagation();
                if (event.target === advancedFlaggingLink.get(0)) dropDown.fadeIn('fast');
            });

            $(window).on('click', () => dropDown.fadeOut('fast'));
        }

        // Watch for manual flags if the user has chosen to do so
        const shouldWatchFlags = globals.cachedConfiguration[globals.ConfigurationWatchFlags];
        globals.addXHRListener(xhr => {
            if (!shouldWatchFlags || autoFlagging || xhr.status !== 200 || !globals.flagsUrlRegex.test(xhr.responseURL)) return;

            const matches = globals.getFlagsUrlRegex(post.postId).exec(xhr.responseURL);
            const flagType = globals.cachedFlagTypes
                .find(item => item.SendWhenFlagRaised && item.ReportType === (matches?.[1] as Flags));
            if (!flagType) return;

            displaySuccessFlagged(reportedIcon, flagType.ReportType);
            void handleFlag(flagType, reporters);
        });
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

    const watchedQueuesEnabled = globals.cachedConfiguration[globals.ConfigurationWatchQueues];
    if (!watchedQueuesEnabled) return;

    globals.addXHRListener(xhr => {
        if (
            xhr.status !== 200
         || !globals.isReviewItemRegex.test(xhr.responseURL)
         || !document.querySelector('#answer')
        ) return;

        const reviewResponse = JSON.parse(xhr.responseText) as ReviewQueueResponse;
        if (reviewResponse.isAudit || reviewResponse.postTypeId !== 2) return; // shouldn't be an audit and should be an answer

        const cachedPost = reviewPostsInformation.find(item => item.postId === reviewResponse.postId)?.post;
        cachedPost ? addBotIconsToReview(cachedPost) : parseQuestionsAndAnswers(addBotIconsToReview);
    });

    $(document).on('click', '.js-review-submit', () => {
        if (!$('#review-action-LooksGood').is(':checked')) return; // must have selected 'Looks OK' and clicked submit

        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === postId);
        const flagType = globals.cachedFlagTypes.find(item => item.DisplayName === 'Looks Fine'); // the Looks Fine cached flag type
        if (!reviewCachedInfo || !flagType) return; // something went wrong

        void handleFlag(flagType, reviewCachedInfo.reporters);
    });

    globals.addXHRListener(xhr => {
        if (xhr.status !== 200 || !globals.isDeleteVoteRegex.test(xhr.responseURL) || !$('#answer').length) return;

        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === postId);
        if (!reviewCachedInfo || reviewCachedInfo.post.postType !== 'Answer') return; // something went wrong

        const reportersArray: ReporterInformation = {
            Natty: new NattyAPI(postId, reviewCachedInfo.post.questionTime, reviewCachedInfo.post.answerTime)
        };
        reportersArray.Natty?.setupIcon();

        const flagType = globals.cachedFlagTypes.find(item => item.DisplayName === 'Not an answer'); // the NAA cached flag type
        if (!flagType) return; // something went wrong

        void handleFlag(flagType, reportersArray);
    });
}

Setup();
