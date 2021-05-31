import { Flags, HumanFlags } from './FlagTypes';
import { parseQuestionsAndAnswers, PostInfo } from './UserscriptTools/sotools';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { setupConfiguration } from './Configuration';
import * as globals from './GlobalVars';

declare const StackExchange: globals.StackExchange;

function SetupStyles(): void {
    GM_addStyle(`
.advanced-flagging-dialog { min-width: 10rem !important; }
#af-comments textarea { resize: vertical; }
.af-snackbar {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}`);
}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];

function getFlagToRaise(flagName: Flags, qualifiesForVlq: boolean): Flags {
    // if the flag name is VLQ, then we need to check if the criteria are met. If not, switch to NAA
    return flagName === 'PostLowQuality' ? (qualifiesForVlq ? 'PostLowQuality' : 'AnswerNotAnAnswer') : flagName;
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
            const flagPost = await fetch(`//${window.location.hostname}/flags/posts/${post.postId}/add/${flagName}`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, otherText: flagText || '' })
            });

            // for some reason, the flag responses are inconsistent: some are in JSON, others in text
            // for example, if a user flags posts too quickly, then they get a text response
            // if the post has been flagged successfully, the response is in JSON format
            const responseText = await flagPost.text();
            if (/You may only flag a post every \d+ seconds?/.test(responseText)) { // flagging posts too quickly
                const rateLimitedSeconds = /\d+/.exec(responseText)?.[0] || 0;
                const pluralS = rateLimitedSeconds > 1 ? 's' : '';
                displayErrorFlagged(`${failedToFlagText}rate-limited for ${rateLimitedSeconds} second${pluralS}`, responseText);
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

    const downvoteButton = post.element.find('.js-vote-down-btn');
    // The user probably doesn't want to auto-downvote posts after selecting Looks Fine, Needs editing, etc.
    // Also we don't want to undo a downvote, so we check if the post is downvoted already
    if (!downvoteRequired || flag.ReportType === 'NoFlag' || downvoteButton.hasClass('fc-theme-primary')) return;
    downvoteButton.trigger('click');
}

async function handleFlag(flagType: globals.CachedFlag, reporters: ReporterInformation): Promise<boolean> {
    let hasFailed = false;
    const allPromises = (Object.values(reporters) as Reporter[]).filter(item => flagType.Feedbacks[item.name]).map(reporter => {
        return reporter.sendFeedback(flagType.Feedbacks[reporter.name])
            .then(promiseValue => promiseValue ? globals.displaySuccess(promiseValue) : '')
            .catch(promiseError => {
                globals.displayError((promiseError as Error).message);
                hasFailed = true;
            });
    });
    await Promise.allSettled(allPromises);
    return !hasFailed;
}

export function displayToaster(message: string, state: string): void {
    const messageDiv = globals.getMessageDiv(message, state);
    globals.popupWrapper.append(messageDiv.fadeIn());
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

function upvoteSameComments(postElement: JQuery, strippedCommentText: string): void {
    postElement.find('.comment-body .comment-copy').each((_index, el) => {
        const element = $(el), text = element.text();
        if (text !== strippedCommentText) return;

        element.closest('li').find('a.comment-up.comment-up-off').trigger('click');
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
    // the following piece of code also exists in SE's JS files and shows new comments
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(data, null, false, true);
    $(document).trigger('comment', postId);
}

function setupNattyApi(postId: number, questionTime: Date | null, answerTime: Date | null, nattyIcon?: JQuery): NattyAPI {
    const nattyApi = new NattyAPI(postId, questionTime || new Date(), answerTime || new Date());
    const isReported = nattyApi.wasReported();
    if (nattyIcon && isReported) {
        globals.showInlineElement(nattyIcon);
        nattyIcon.find('a').attr('href', `//sentinel.erwaysoftware.com/posts/aid/${postId}`).attr('target', '_blank');
    }

    return nattyApi;
}

function setupMetasmokeApi(postId: number, postType: globals.PostType, smokeyIcon: JQuery): MetaSmokeAPI {
    const metasmokeApi = new MetaSmokeAPI(postId, postType);
    const smokeyId = metasmokeApi.getSmokeyId();
    if (smokeyId) {
        smokeyIcon.find('a').attr('href', `https://metasmoke.erwaysoftware.com/post/${smokeyId}`).attr('target', '_blank');
        globals.showInlineElement(smokeyIcon);
    }

    return metasmokeApi;
}

function setupGuttenbergApi(postId: number, copypastorIcon: JQuery): CopyPastorAPI {
    const copypastorApi = new CopyPastorAPI(postId), copypastorId = copypastorApi.copypastorId;
    if (copypastorId) {
        globals.showInlineElement(copypastorIcon);
        copypastorIcon.find('a').attr('href', `https://copypastor.sobotics.org/posts/${copypastorId}`).attr('target', '_blank');
    }

    return copypastorApi;
}

function increasePopoverWidth(reportLink: JQuery): void {
    const popoverId = reportLink.parent().attr('aria-describedby') || '';
    $(`#${popoverId}`).addClass('sm:wmn-initial md:wmn-initial wmn5');
}

function getAllBotIcons(): JQuery[] {
    const nattyIcon = globals.nattyIcon.clone();
    const copypastorIcon = globals.guttenbergIcon.clone();
    const smokeyIcon = globals.smokeyIcon.clone();
    globals.attachPopover(nattyIcon.find('a')[0], 'Reported by Natty');
    globals.attachPopover(copypastorIcon.find('a')[0], 'Reported by Guttenberg');
    globals.attachPopover(smokeyIcon.find('a')[0], 'Reported by Smokey');
    return [nattyIcon, copypastorIcon, smokeyIcon];
}

function addBotIconsToReview(post: PostInfo, botIcons?: JQuery[]): void {
    if (post.postType !== 'Answer') return;

    const botIconsToAppend = botIcons || getAllBotIcons(), [nattyIcon, copypastorIcon, smokeyIcon] = botIconsToAppend;
    const iconLocation = post.element.find('.js-post-menu').children().first();
    iconLocation.append(...botIconsToAppend);
    if (botIcons) return;

    const reporters: ReporterInformation = {
        Natty: setupNattyApi(post.postId, post.questionTime, post.answerTime, nattyIcon),
        Smokey: setupMetasmokeApi(post.postId, post.postType, smokeyIcon),
        Guttenberg: setupGuttenbergApi(post.postId, copypastorIcon)
    };

    reviewPostsInformation.push({ postId: post.postId, post, reporters });
}

function getFeedbackSpans(
    flagType: globals.CachedFlag,
    nattyReported: boolean,
    nattyCanReport: boolean,
    smokeyReported: boolean,
    guttenbergReported: boolean,
    postDeleted: boolean
): string {
    return (Object.entries(flagType.Feedbacks) as [keyof globals.FlagTypeFeedbacks, globals.AllFeedbacks][])
        .filter(([botName, feedback]) => {
            return feedback && // make sure there's actually a feedback
            // if the post hasn't been reported and can't be reported, don't include the feedback in the list
                // either the post has been reported to Natty or it can be reported as the feedback is tp
                (botName === 'Natty' && (nattyReported || (nattyCanReport && !/fp|ne/.test(feedback))))
                // either the post has been reported to Smokey or the feedback is tpu- (the post is reportable)
                // the post shouldn't be reported if it's been deleted
                || (botName === 'Smokey' && (smokeyReported || (!/naa|fp|tp-/.test(feedback) && !postDeleted)))
                // there's no way to report a post to Guttenberg, so we just filter the posts that have been reported
                || (botName === 'Guttenberg' && guttenbergReported
                || (botName === 'Generic Bot' && feedback === 'track')); // only get bot names where there is feedback
        }).map(([botName, feedback]) => {
            if (feedback === 'track') return '<span><b>track </b>with Generic Bot</span>'; // different string for Generic Bot

            // determine the colour to add to the feedback using Stacks classes
            // https://stackoverflow.design/product/base/colors/#danger-and-error
            const isGreen = feedback.includes('tp'), isRed = feedback.includes('fp'), isYellow = /naa|ne/.test(feedback);
            let className: globals.StacksToastState | '' = '';
            if (isGreen) className = 'success';
            else if (isRed) className = 'danger';
            else if (isYellow) className = 'warning';

            // make it clear that the post will be reported
            // but it shouldn't be reported if the post is deleted!
            const shouldReport = (botName === 'Smokey' && !smokeyReported) || (botName === 'Natty' && !nattyReported);
            return `<span class="fc-${className}"><b>${shouldReport ? 'report' : feedback}</b></span> to ${botName}`;
        }).filter(String).join(', ') || globals.noneString;
}

function getOptionsRow(postElement: JQuery, postId: number): JQuery[] {
    const postComments = postElement.find('.comment-body');
    // check which of the checkboxes the user has chosen to uncheck by default
    const defaultNoComment = globals.cachedConfiguration[globals.ConfigurationDefaultNoComment];
    const defaultNoFlag = globals.cachedConfiguration[globals.ConfigurationDefaultNoFlag];
    const defaultNoDownvote = globals.cachedConfiguration[globals.ConfigurationDefaultNoDownvote];
    // check 'Leave comment' if there aren't more comments and user has selected to do so
    const checkComment = !defaultNoComment && !postComments.length;

    const commentRow = globals.getPopoverOption(`af-comment-checkbox-${postId}`, checkComment, 'Leave comment');
    const flagRow = globals.getPopoverOption(`af-flag-checkbox-${postId}`, !defaultNoFlag, 'Flag');
    const downvoteRow = globals.getPopoverOption(`af-downvote-checkbox-${postId}`, !defaultNoDownvote, 'Downvote');
    return [commentRow, flagRow, downvoteRow];
}

type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;

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
    const dropdown = globals.dropdown.clone(), actionsMenu = globals.actionsMenu.clone();
    dropdown.append(actionsMenu);

    const copypastorApi = reporters.Guttenberg, nattyApi = reporters.Natty, metasmokeApi = reporters.Smokey;
    const smokeyId = metasmokeApi?.getSmokeyId();
    const copypastorId = copypastorApi?.copypastorId, isRepost = copypastorApi?.repost, targetUrl = copypastorApi?.targetUrl;

    // add the flag types to the category they correspond to
    const newCategories = globals.cachedCategories.filter(item => item.AppliesTo?.includes(post.postType))
        .map(item => ({ ...item, FlagTypes: [] as globals.CachedFlag[] }));
    globals.cachedFlagTypes.filter(flagType => {
        const isGuttenbergItem = flagType.ReportType === 'PostOther'; // only Guttenberg reports (can) have the PostOther ReportType
        // a CopyPastor id must exist and the requirements from https://github.com/SOBotics/AdvancedFlagging/issues/16 must be met
        const showGutReport = Boolean(copypastorId) && (flagType.DisplayName === 'Duplicate Answer' ? isRepost : !isRepost);
        // show the red flags and general items on every site, restrict the others to StackOverflow
        const showOnMainSite = ['Red flags', 'General'].includes(flagType.BelongsTo) ? true : globals.isStackOverflow;
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
            let reportTypeHuman: HumanFlags | string = globals.getHumanFromDisplayName(flagName);
            const flagText = copypastorId && targetUrl ? globals.getFullFlag(flagType.Id, targetUrl, copypastorId) : null;
            const feedbacksString = getFeedbackSpans(
                flagType, nattyApi?.wasReported() || false, nattyApi?.canBeReported() || false,
                Boolean(smokeyId), Boolean(copypastorId), post.deleted
            );

            let tooltipCommentText = commentText;
            let tooltipFlagText = flagText;
            const postDeletedString = '<span class="fc-danger">- post is deleted</span>';
            // if the flag changed from VLQ to NAA, let the user know why
            if (flagType.ReportType !== flagName) reportTypeHuman += ' (VLQ criteria weren\'t met)';
            // there was a flag to be raised, but the post is deleted
            else if (flagType.ReportType !== 'NoFlag' && post.deleted) reportTypeHuman = `${globals.noneString} ${postDeletedString}`;
            else if (commentText && post.deleted) tooltipCommentText = `${globals.noneString} ${postDeletedString}`;
            else if (flagText && post.deleted) tooltipFlagText = `${globals.noneString} ${postDeletedString}`;
            // the HTML that will be on the tooltip contains information regarding the flag that will be raised,
            // the comment that will be added, the flag text if the flag is PostOther and the feedbacks that will be sent to bots
            const reportLinkInfo = `<div><b>Flag: </b>${reportTypeHuman || globals.noneString}</div>`
                                 + `<div><b>Comment: </b>${tooltipCommentText || globals.noneString}</div>`
                                 + (tooltipFlagText ? `<div><b>Flag text: </b>${tooltipFlagText}</div>` : '')
                                 + `<div><b>Feedbacks: </b> ${feedbacksString}</div>`;
            // because the tooltips are originally too narrow, we need to increase min-width
            globals.attachHtmlPopover(reportLink.parent()[0], reportLinkInfo, 'right-start');
            setTimeout(() => increasePopoverWidth(reportLink)); // without setTimeout, the tooltip width isn't increased

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
                    const downvotePost = downvoteRow.find('.s-checkbox').is(':checked');
                    await handleActions(post, flagType, flagPost, downvotePost, reportedIcon, shouldRaiseVlq, flagText, commentText);
                }

                // feedback should however be sent
                // if it's sent successfully, the success variable is true, otherwise false
                const success = await handleFlag(flagType, reporters);
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

    return dropdown;
}

let autoFlagging = false;
function SetupPostPage(): void {
    const linkDisabled = globals.cachedConfiguration[globals.ConfigurationLinkDisabled];
    if (linkDisabled || globals.isLqpReviewPage) return; // do not add the buttons on review
    parseQuestionsAndAnswers(post => {
        if (!post.element.length) return;

        const [nattyIcon, copypastorIcon, smokeyIcon] = getAllBotIcons();
        const reporters: ReporterInformation = { Smokey: setupMetasmokeApi(post.postId, post.postType, smokeyIcon) };
        if (post.postType === 'Answer' && globals.isStackOverflow) {
            reporters.Natty = setupNattyApi(post.postId, post.questionTime, post.answerTime, nattyIcon);
            reporters['Generic Bot'] = new GenericBotAPI(post.postId);
            reporters.Guttenberg = setupGuttenbergApi(post.postId, copypastorIcon);
        }

        // if we aren't in a question page, then we just insert the icons
        if (post.page !== 'Question') return post.iconLocation.after(smokeyIcon, copypastorIcon, nattyIcon);
        if (post.score === null) return; // can't use !post.score, because score might be 0

        const advancedFlaggingLink = globals.advancedFlaggingLink.clone();
        post.iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));

        const performedActionIcon = globals.performedActionIcon();
        const failedActionIcon = globals.failedActionIcon();
        const reportedIcon = globals.reportedIcon();

        // Now append the advanced flagging dialog
        const shouldRaiseVlq = globals.qualifiesForVlq(post.score, post.answerTime || new Date());
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
    $('body').append(globals.popupWrapper);

    const watchedQueuesEnabled = globals.cachedConfiguration[globals.ConfigurationWatchQueues];
    if (!watchedQueuesEnabled) return;

    globals.addXHRListener(xhr => {
        if (xhr.status !== 200 || !globals.isReviewItemRegex.test(xhr.responseURL) || !$('#answer').length) return;

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
            Natty: setupNattyApi(postId, reviewCachedInfo.post.questionTime, reviewCachedInfo.post.answerTime)
        };
        const flagType = globals.cachedFlagTypes.find(item => item.DisplayName === 'Not an answer'); // the NAA cached flag type
        if (!flagType) return; // something went wrong

        void handleFlag(flagType, reportersArray);
    });
}

Setup();
