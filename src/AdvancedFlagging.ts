import { FlagType, flagCategories, Flags } from './FlagTypes';
import { parseQuestionsAndAnswers, QuestionPageInfo } from '@userscriptTools/sotools';
import { NattyAPI } from '@userscriptTools/NattyApi';
import { GenericBotAPI } from '@userscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from '@userscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from '@userscriptTools/CopyPastorAPI';
import { SetupConfiguration } from 'Configuration';
import * as globals from './GlobalVars';

declare const StackExchange: globals.StackExchange;

function SetupStyles(): void {
    GM_addStyle(`
#snackbar {
    margin-left: -125px;
}

#snackbar.show {
    opacity: 1;
    transition: opacity 1s ease-out;
    -ms-transition: opacity 1s ease-out;
    -moz-transition: opacity 1s ease-out;
    -webkit-transition: opacity 1s ease-out;
}

#snackbar.hide {
    opacity: 0;
    transition: opacity 1s ease-in;
    -ms-transition: opacity 1s ease-in;
    -moz-transition: opacity 1s ease-in;
    -webkit-transition: opacity 1s ease-in;
}

.advanced-flagging-dialog {
    min-width: 10rem !important;
}

#af-comments textarea {
    resize: vertical;
}`);
}

const userFkey = StackExchange.options.user.fkey;
async function handleFlagAndComment(
    post: QuestionPageInfo,
    flag: FlagType,
    flagRequired: boolean,
    downvoteRequired: boolean,
    copypastorApi: CopyPastorAPI,
    reportedIcon: JQuery,
    qualifiesForVlq: boolean,
    commentText?: string | null
): Promise<void> {
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
        const copypastorId = copypastorApi.getCopyPastorId();
        const targetUrl = copypastorApi.getTargetUrl();
        const flagText = flag.GetCustomFlagText && copypastorId && targetUrl
            ? flag.GetCustomFlagText(targetUrl, copypastorId)
            : null;

        autoFlagging = true;
        const flagName: Flags = flag.ReportType === 'PostLowQuality' ?
            (qualifiesForVlq ? 'PostLowQuality' : 'AnswerNotAnAnswer') : flag.ReportType;
        try {
            const flagPost = await fetch(`//${window.location.hostname}/flags/posts/${post.postId}/add/${flagName}`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, otherText: flag.ReportType === 'PostOther' ? flagText : '' })
            });
            const responseJson = await flagPost.json() as StackExchangeFlagResponse;
            if (responseJson.Success) {
                displaySuccessFlagged(reportedIcon, flag.ReportType);
            } else { // sometimes, although the status is 200, the post isn't flagged.
                const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                const message = getErrorMessage(responseJson);
                displayErrorFlagged(message, fullMessage);
            }
        } catch (error) {
            displayErrorFlagged('Failed to flag post', error);
        }
    }

    // The user probably doesn't want to auto-downvote posts after selecting Looks Fine, NE, etc.
    if (downvoteRequired && flag.DefaultReportType !== 'NoFlag') post.element.find('.js-vote-down-btn').trigger('click');
}

const popupWrapper = globals.popupWrapper;

export function displayToaster(message: string, state: string): void {
    if (popupWrapper.hasClass('hide')) popupWrapper.empty(); // if the toaster is hidden, then remove any appended messages
    const messageDiv = globals.getMessageDiv(message, state);

    popupWrapper.append(messageDiv);
    popupWrapper.removeClass('hide').addClass('show');

    window.setTimeout(() => popupWrapper.removeClass('show').addClass('hide'), globals.popupDelay);
}

function displaySuccessFlagged(reportedIcon: JQuery, reportType?: Flags): void {
    if (!reportType) return;
    const flaggedMessage = `Flagged ${getHumanFromDisplayName(reportType)}`;
    void globals.attachPopover(reportedIcon[0], flaggedMessage, 'bottom-start');
    globals.showInlineElement(reportedIcon);
    globals.displaySuccess(flaggedMessage);
}

function displayErrorFlagged(message: string, error: string): void {
    globals.displayError(message);
    console.error(error);
}

function getStrippedComment(commentText: string): string {
    return commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Match [links](...)
        .replace(/\[([^\]]+)\][^(]*?/g, '$1') // Match [edit]
        .replace(/_([^_]+)_/g, '$1') //  _thanks_ => thanks
        .replace(/\*\*([^*]+)\*\*/g, '$1') // **thanks** => thanks
        .replace(/\*([^*]+)\*/g, '$1') // *thanks* => thanks
        .replace(' - From Review', '');
}

function upvoteSameComments(element: JQuery, strippedCommentText: string): void {
    element.find('.comment-body .comment-copy').each((_index, el) => {
        const element = $(el), text = element.text();
        if (text !== strippedCommentText) return;

        element.closest('li').find('a.comment-up.comment-up-off').trigger('click');
    });
}

function getErrorMessage(responseJson: StackExchangeFlagResponse): string {
    let message = 'Failed to flag: ';
    if (/already flagged/.exec(responseJson.Message)) {
        message += 'post already flagged';
    } else if (/limit reached/.exec(responseJson.Message)) {
        message += 'post flag limit reached';
    } else if (/You may only flag a post every \d+ seconds?/.exec(JSON.stringify(responseJson))) {
        message += 'rate-limited';
    } else {
        message += responseJson.Message;
    }
    return message;
}

function showComments(postId: number, data: string): void {
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(data, null, false, true);
    $(document).trigger('comment', postId);
}

function setupNattyApi(postId: number, questionTime?: Date | null, answerTime?: Date | null, nattyIcon?: JQuery): NattyAPI {
    const nattyApi = new NattyAPI(postId, questionTime || new Date(), answerTime || new Date());
    const isReported = nattyApi.WasReported();
    if (nattyIcon && isReported) {
        globals.showInlineElement(nattyIcon);
        nattyIcon.attr('href', `//sentinel.erwaysoftware.com/posts/aid/${postId}`).attr('target', '_blank');
    }

    return nattyApi;
}

function setupGenericBotApi(postId: number): GenericBotAPI {
    return new GenericBotAPI(postId);
}

function setupMetasmokeApi(postId: number, postType: 'Answer' | 'Question', smokeyIcon: JQuery): MetaSmokeAPI {
    const smokeyId = MetaSmokeAPI.getSmokeyId(postId);
    if (smokeyId) {
        smokeyIcon.attr('href', `https://metasmoke.erwaysoftware.com/post/${smokeyId}`).attr('target', '_blank');
        globals.showInlineElement(smokeyIcon);
    }

    return new MetaSmokeAPI(postId, postType);
}

function setupGuttenbergApi(copyPastorApi: CopyPastorAPI, copyPastorIcon: JQuery): CopyPastorAPI {
    const copypastorId = copyPastorApi.getCopyPastorId();
    if (copypastorId) {
        globals.showInlineElement(copyPastorIcon);
        copyPastorIcon.attr('href', `https://copypastor.sobotics.org/posts/${copypastorId}`).attr('target', '_blank');
    }

    return copyPastorApi;
}

function getHumanFromDisplayName(displayName: Flags): string {
    switch (displayName) {
        case 'AnswerNotAnAnswer': return 'as NAA';
        case 'PostOffensive': return 'as R/A';
        case 'PostSpam': return 'as spam';
        case 'NoFlag': return '';
        case 'PostOther': return 'for moderator attention';
        case 'PostLowQuality': return 'as VLQ';
        default: return '';
    }
}

function increasePopoverWidth(reportLink: JQuery): void {
    const popoverId = reportLink.parent().attr('aria-describedby') || '';
    $(`#${popoverId}`).addClass('sm:wmn-initial md:wmn-initial wmn4');
}

export type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;

interface StackExchangeFlagResponse {
    FlagType: number;
    Message: string;
    Outcome: number;
    ResultChangedState: boolean;
    Success: boolean;
}

interface ReviewResponse {
    postId: number;
    content: string;
}

function BuildFlaggingDialog(
    post: QuestionPageInfo,
    deleted: boolean,
    reportedIcon: JQuery,
    performedActionIcon: JQuery,
    reporters: Reporter[],
    copyPastorApi: CopyPastorAPI,
    shouldRaiseVlq: boolean,
    failedActionIcon: JQuery
): JQuery {
    const enabledFlagIds = globals.cachedConfigurationInfo?.[globals.ConfigurationEnabledFlags];
    const defaultNoComment = globals.cachedConfigurationInfo?.[globals.ConfigurationDefaultNoDownvote];
    const defaultNoFlag = globals.cachedConfigurationInfo?.[globals.ConfigurationDefaultNoFlag];
    const defaultNoDownvote = globals.cachedConfigurationInfo?.[globals.ConfigurationDefaultNoDownvote];
    const comments = post.element.find('.comment-body');
    const dropDown = globals.dropDown.clone();

    const checkboxNameComment = `comment_checkbox_${post.postId}`;
    const checkboxNameFlag = `flag_checkbox_${post.postId}`;
    const checkboxNameDownvote = `downvote_checkbox_${post.postId}`;
    const leaveCommentBox = globals.getOptionBox(checkboxNameComment);
    const flagBox = globals.getOptionBox(checkboxNameFlag);
    const downvoteBox = globals.getOptionBox(checkboxNameDownvote);

    leaveCommentBox.prop('checked', !defaultNoComment && !comments.length && globals.isStackOverflow);
    flagBox.prop('checked', !defaultNoFlag);
    downvoteBox.prop('checked', !defaultNoDownvote);

    const newCategories = flagCategories.filter(item => item.AppliesTo.includes(post.type)
                                                     && item.FlagTypes.some(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id)));
    for (const flagCategory of newCategories) {
        const categoryDiv = globals.getCategoryDiv(flagCategory.IsDangerous);
        for (const flagType of flagCategory.FlagTypes.filter(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id))) {
            const reportLink = globals.reportLink.clone();
            const dropdownItem = globals.dropdownItem.clone();

            // https://github.com/SOBotics/AdvancedFlagging/issues/16
            const copypastorIsRepost = copyPastorApi.getIsRepost();
            const copypastorId = copyPastorApi.getCopyPastorId();
            if (!flagType.Enabled(copypastorIsRepost, copypastorId)) continue;

            globals.showElement(reportLink);
            reportLink.text(flagType.DisplayName);
            dropdownItem.append(reportLink);
            categoryDiv.append(dropdownItem);

            dropDown.append(categoryDiv);

            let commentText = flagType.GetComment?.({ Reputation: post.authorReputation, AuthorName: post.authorName }) || null;
            const reportTypeHuman = getHumanFromDisplayName(flagType.ReportType);
            const reportLinkInfo = `This option will${reportTypeHuman ? ' ' : ' not'} flag the post <b>${reportTypeHuman}</b></br>`
                                 + (commentText ? `and add the following comment: ${commentText}` : '');
            void globals.attachHtmlPopover(reportLink.parent()[0], reportLinkInfo, 'right-start')
                .then(() => increasePopoverWidth(reportLink));

            reportLink.on('click', async () => {
                if (!deleted) {
                    if (!leaveCommentBox.is(':checked') && commentText) {
                        const strippedComment = getStrippedComment(commentText);
                        upvoteSameComments(post.element, strippedComment);
                        commentText = null;
                    }

                    await handleFlagAndComment(
                        post, flagType, flagBox.is(':checked'), downvoteBox.is(':checked'),
                        copyPastorApi, reportedIcon, shouldRaiseVlq, commentText
                    );
                }

                globals.hideElement(dropDown); // hide the dropdown after clicking one of the options
                const success = await handleFlag(flagType, reporters);
                if (flagType.ReportType !== 'NoFlag') return;

                if (success) {
                    void globals.attachPopover(performedActionIcon[0], `Performed action: ${flagType.DisplayName}`, 'bottom-start');
                    globals.showElement(performedActionIcon);
                } else {
                    void globals.attachPopover(failedActionIcon[0], `Failed to perform action: ${flagType.DisplayName}`, 'bottom-start');
                    globals.showElement(failedActionIcon);
                }
            });
        }
        if (categoryDiv.html()) dropDown.append(globals.divider.clone()); // at least one option exists for the category
    }

    if (globals.isStackOverflow) {
        const commentBoxLabel = globals.getOptionLabel('Leave comment', checkboxNameComment);
        const commentRow = globals.plainDiv.clone();
        commentRow.append(leaveCommentBox, commentBoxLabel);
        dropDown.append(commentRow);
    }

    const flagBoxLabel = globals.getOptionLabel('Flag', checkboxNameFlag);
    const flagRow = globals.plainDiv.clone();
    flagRow.append(flagBox, flagBoxLabel);

    const downvoteBoxLabel = globals.getOptionLabel('Downvote', checkboxNameDownvote);
    const downvoteRow = globals.plainDiv.clone();
    downvoteRow.append(downvoteBox, downvoteBoxLabel);

    dropDown.append(flagRow, downvoteRow, globals.popoverArrow.clone());

    return dropDown;
}

async function handleFlag(flagType: FlagType, reporters: Reporter[]): Promise<boolean> {
    for (const reporter of reporters) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const promiseValue = await flagType.SendFeedback(reporter);
            if (!promiseValue) continue;
            globals.displaySuccess(promiseValue);
        } catch (error) {
            globals.displayError((error as Error).message);
            return false;
        }
    }
    return true;
}

let autoFlagging = false;
function SetupPostPage(): void {
    const linkDisabled = globals.cachedConfigurationInfo?.[globals.ConfigurationLinkDisabled];
    if (linkDisabled) return;
    parseQuestionsAndAnswers(post => {
        if (!post.element.length) return;

        const questionTime: Date | null = post.type === 'Answer' ? post.questionTime : post.creationDate;
        const answerTime: Date | null = post.type === 'Answer' ? post.creationDate : null;
        const iconLocation: JQuery = post.page === 'Question'
            ? post.element.find('.js-post-menu').children().first()
            : post.element.find(`a.${post.type === 'Question' ? 'question' : 'answer'}-hyperlink`);
        const advancedFlaggingLink: JQuery = globals.advancedFlaggingLink.clone();
        if (post.page === 'Question') iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));

        const nattyIcon = globals.nattyIcon.clone();
        const copyPastorIcon = globals.guttenbergIcon.clone();
        const smokeyIcon = globals.smokeyIcon.clone();
        void globals.attachPopover(nattyIcon.find('a')[0], 'Reported by Natty', 'bottom-start');
        void globals.attachPopover(copyPastorIcon.find('a')[0], 'Reported by Guttenberg', 'bottom-start');
        void globals.attachPopover(smokeyIcon.find('a')[0], 'Reported by Smokey', 'bottom-start');
        const copyPastorApi = new CopyPastorAPI(post.postId);

        const reporters: Reporter[] = [];
        if (post.type === 'Answer' && globals.isStackOverflow) {
            reporters.push(setupNattyApi(post.postId, questionTime, answerTime, nattyIcon));
            reporters.push(setupGenericBotApi(post.postId));
            reporters.push(setupGuttenbergApi(copyPastorApi, copyPastorIcon));
        }
        reporters.push(setupMetasmokeApi(post.postId, post.type, smokeyIcon));

        const performedActionIcon = globals.performedActionIcon();
        const failedActionIcon = globals.failedActionIcon();
        const reportedIcon = globals.reportedIcon();

        if (post.page === 'Question') {
            // Now we setup the flagging dialog
            const deleted = post.element.hasClass('deleted-answer');

            const shouldWatchFlags = globals.cachedConfigurationInfo?.[globals.ConfigurationWatchFlags];
            globals.addXHRListener(xhr => {
                if (!shouldWatchFlags || autoFlagging || xhr.status !== 200 || !globals.flagsUrlRegex.exec(xhr.responseURL)) return;

                const matches = globals.getFlagsUrlRegex(post.postId).exec(xhr.responseURL);
                if (!matches) return;

                const flagTypes = flagCategories.flatMap(category => category.FlagTypes);
                const flagType = flagTypes.find(item => item.ReportType === (matches[1] as Flags));
                if (!flagType) return;

                displaySuccessFlagged(reportedIcon, flagType.ReportType);
                void handleFlag(flagType, reporters);
            });

            iconLocation.append(performedActionIcon, reportedIcon, failedActionIcon, nattyIcon, copyPastorIcon, smokeyIcon);

            const shouldRaiseVlq = globals.qualifiesForVlq(post.score, answerTime || new Date());
            const dropDown = BuildFlaggingDialog(
                post, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi, shouldRaiseVlq, failedActionIcon
            );

            advancedFlaggingLink.append(dropDown);

            const openOnHover = globals.cachedConfigurationInfo?.[globals.ConfigurationOpenOnHover];
            if (openOnHover) {
                advancedFlaggingLink.on('mouseover', event => {
                    event.stopPropagation();
                    if (event.target === advancedFlaggingLink.get(0)) globals.showElement(dropDown);
                }).on('mouseleave', e => {
                    e.stopPropagation();
                    setTimeout(() => globals.hideElement(dropDown), 200); // avoid immediate closing of the popover
                });
            } else {
                advancedFlaggingLink.on('click', event => {
                    event.stopPropagation();
                    if (event.target === advancedFlaggingLink.get(0)) globals.showElement(dropDown);
                });
                $(window).on('click', () => globals.hideElement(dropDown));
            }
        } else {
            iconLocation.after(smokeyIcon, copyPastorIcon, nattyIcon);
        }
    });
}

function Setup(): void {
    // Collect all ids
    void Promise.all([
        MetaSmokeAPI.Setup(globals.metaSmokeKey),
        MetaSmokeAPI.QueryMetaSmokeInternal(),
        CopyPastorAPI.getAllCopyPastorIds(),
        NattyAPI.getAllNattyIds(),
        globals.waitForSvg()
    ]).then(() => {
        SetupPostPage();
        SetupStyles();
        SetupConfiguration();
    });
    $('body').append(popupWrapper);

    const watchedQueuesEnabled = globals.cachedConfigurationInfo?.[globals.ConfigurationWatchQueues];
    const postDetails: { questionTime: Date, answerTime: Date }[] = [];
    if (!watchedQueuesEnabled) return;

    globals.addXHRListener(xhr => {
        if (xhr.status !== 200) return;

        const parseReviewDetails = (review: string): void => {
            const reviewJson = JSON.parse(review) as ReviewResponse;
            const postId = reviewJson.postId;
            const content = $(reviewJson.content);

            const questionTime = globals.parseDate($('.post-signature.owner .user-action-time span', content).attr('title'));
            const answerTime = globals.parseDate($('.user-info .user-action-time span', content).attr('title'));
            if (!questionTime || !answerTime) return;
            postDetails[postId] = {
                questionTime: questionTime,
                answerTime: answerTime
            };
        };

        // We can't just parse the page after a recommend/delete request, as the page will have sometimes already updated
        // This means we're actually grabbing the information for the following review

        // So, we watch the next-task requests and remember which post we were looking at for when a delete/recommend-delete vote comes through.
        // next-task is invoked when visiting the review queue
        // task-reviewed is invoked when making a response
        const isReviewItem = globals.isReviewItemRegex.exec(xhr.responseURL);
        if (isReviewItem) {
            const review = xhr.responseText;
            parseReviewDetails(review);
            return;
        }

        const matches = globals.isDeleteVoteRegex.exec(xhr.responseURL);
        if (!matches) return;

        const postIdStr = matches[1] || matches[2];
        const postId = Number(postIdStr);
        const currentPostDetails = postDetails[postId];
        if (!currentPostDetails || !$('.answers-subheader').length) return;

        const flagType = flagCategories[2].FlagTypes[1]; // the not an answer flag type
        void handleFlag(flagType, [setupNattyApi(postId)]);
    });
}

$(() => {
    let started = false;
    function actionWatcher(): void {
        if (!started) {
            started = true;
            Setup();
        }
        $(window).off('focus', actionWatcher);
        $(window).off('mousemove', actionWatcher);
    }

    // If the window gains focus
    $(window).on('focus', actionWatcher);
    // Or we have mouse movement
    $(window).on('mousemove', actionWatcher);

    // Or the document is already focused,
    // Then we execute the script.
    // This is done to prevent DOSing dashboard apis, if a bunch of links are opened at once.
    if (document.hasFocus?.()) actionWatcher();
});
