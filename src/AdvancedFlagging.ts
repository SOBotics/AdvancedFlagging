import { FlagType, flagCategories } from './FlagTypes';
import { parseQuestionsAndAnswers, QuestionPageInfo } from '@userscriptTools/sotools';
import { NattyAPI } from '@userscriptTools/NattyApi';
import { GenericBotAPI } from '@userscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from '@userscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from '@userscriptTools/CopyPastorAPI';
import { SetupConfiguration } from 'Configuration';
import { GreaseMonkeyCache } from '@userscriptTools/GreaseMonkeyCache';
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
    width: calc(100% - 15px);
    resize: vertical;
}`);
}

const userFkey = StackExchange.options.user.fkey;
async function handleFlagAndComment(
    postId: number,
    flag: FlagType,
    flagRequired: boolean,
    copypastorApi: CopyPastorAPI,
    reportedIcon: JQuery,
    qualifiesForVlq: boolean,
    commentText?: string | null
): Promise<void> {
    if (commentText) {
        try {
            const postComment = await fetch(`/posts/${postId}/comments`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, comment: commentText })
            });
            const commentResult = await postComment.text();
            showComments(postId, commentResult);
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
        const flagName = flag.ReportType === 'PostLowQuality' ?
            (qualifiesForVlq ? 'PostLowQuality' : 'AnswerNotAnAnswer') : flag.ReportType;
        try {
            const flagPost = await fetch(`//${window.location.hostname}/flags/posts/${postId}/add/${flagName}`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, otherText: flag.ReportType === 'PostOther' ? flagText : '' })
            });
            const responseJson = await flagPost.json() as StackExchangeFlagResponse;
            if (responseJson.Success) {
                displaySuccessFlagged(reportedIcon, flag.Human);
            } else { // sometimes, although the status is 200, the post isn't flagged.
                const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                const message = getErrorMessage(responseJson);
                displayErrorFlagged(message, fullMessage);
            }
        } catch (error) {
            displayErrorFlagged('Failed to flag post', error);
        }
    }
}

const popupWrapper = globals.popupWrapper;
let toasterTimeout: number | null = null;
let toasterFadeTimeout: number | null = null;

function hidePopup(): void {
    popupWrapper.removeClass('show').addClass('hide');
    toasterFadeTimeout = window.setTimeout(() => popupWrapper.empty().addClass('hide'), 1000);
}

export function displayToaster(message: string, state: string): void {
    const messageDiv = globals.getMessageDiv(message, state);

    popupWrapper.append(messageDiv);
    popupWrapper.removeClass('hide').addClass('show');

    if (toasterFadeTimeout) clearTimeout(toasterFadeTimeout);
    if (toasterTimeout) clearTimeout(toasterTimeout);
    toasterTimeout = window.setTimeout(hidePopup, globals.popupDelay);
}

function displaySuccessFlagged(reportedIcon: JQuery, reportTypeHuman?: string): void {
    if (!reportTypeHuman) return;
    const flaggedMessage = `Flagged ${reportTypeHuman}`;
    reportedIcon.attr('title', flaggedMessage);
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

function getPromiseFromFlagName(flagName: string, reporter: Reporter): Promise<boolean> {
    switch (flagName) {
    case 'Needs Editing': return reporter.ReportNeedsEditing();
    case 'Vandalism': return reporter.ReportVandalism();
    case 'Looks Fine': return reporter.ReportLooksFine();
    case 'Duplicate answer': return reporter.ReportDuplicateAnswer();
    case 'Plagiarism': return reporter.ReportPlagiarism();
    case 'Bad attribution': return reporter.ReportPlagiarism();
    default:
        throw new Error('Could not find custom flag type: ' + flagName);
    }
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

function getHumanFromDisplayName(displayName: string): string {
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

const storeCommentsInCache = (): void => Object.entries(globals.comments).forEach(array => globals.storeCommentInCache(array));
const storeFlagsInCache = (): void => Object.entries(globals.flags).forEach(array => globals.storeFlagsInCache(array));
function SetupCommentsAndFlags(): void {
    const commentsCached = Object.keys(globals.comments).every(item => globals.getCommentFromCache(item));
    const flagsCached = Object.keys(globals.flags).every(item => globals.getFlagFromCache(item));

    if (!flagsCached) storeFlagsInCache();
    if (!commentsCached) storeCommentsInCache();
}

type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;

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
    shouldRaiseVlq: boolean
): JQuery {
    const enabledFlagIds = GreaseMonkeyCache.GetFromCache<number[]>(globals.ConfigurationEnabledFlags);
    const defaultNoComment = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationDefaultNoComment);
    const defaultNoFlag = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationDefaultNoFlag);
    const comments = post.element.find('.comment-body');

    const dropDown = globals.dropDown.clone();
    const checkboxNameComment = `comment_checkbox_${post.postId}`;
    const checkboxNameFlag = `flag_checkbox_${post.postId}`;
    const leaveCommentBox = globals.getOptionBox(checkboxNameComment);
    const flagBox = globals.getOptionBox(checkboxNameFlag);

    flagBox.prop('checked', !defaultNoFlag);
    leaveCommentBox.prop('checked', !defaultNoComment && !comments.length && globals.isStackOverflow);

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

            let commentText: string | undefined | null;
            if (flagType.GetComment) {
                commentText = flagType.GetComment({ Reputation: post.authorReputation || 0, AuthorName: post.authorName });
                reportLink.attr('title', commentText || '');
            }

            reportLink.click(async () => {
                if (!deleted) {
                    if (!leaveCommentBox.is(':checked') && commentText) {
                        const strippedComment = getStrippedComment(commentText);
                        upvoteSameComments(post.element, strippedComment);
                        commentText = null;
                    }

                    await handleFlagAndComment(
                        post.postId, flagType, flagBox.is(':checked'), copyPastorApi, reportedIcon, shouldRaiseVlq, commentText
                    );
                }

                if (flagType.ReportType === 'NoFlag') {
                    performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                    globals.showElement(performedActionIcon);
                }

                handleFlag(flagType, reporters);
                globals.hideElement(dropDown); // hide the dropdown after clicking one of the options
            });
        }
        if (categoryDiv.html()) dropDown.append(globals.divider.clone()); // at least one option exists for the category
    }

    if (globals.isStackOverflow) {
        const commentBoxLabel = globals.getOptionLabel('Leave comment', checkboxNameComment);
        const commentingRow = globals.plainDiv.clone();
        commentingRow.append(leaveCommentBox, commentBoxLabel);
        dropDown.append(commentingRow);
    }

    const flagBoxLabel = globals.getOptionLabel('Flag', checkboxNameFlag);
    const flaggingRow = globals.plainDiv.clone();
    flaggingRow.append(flagBox, flagBoxLabel);
    dropDown.append(flaggingRow, globals.popoverArrow.clone());

    return dropDown;
}

function handleFlag(flagType: FlagType, reporters: Reporter[]): void {
    const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
    const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer' || flagType.ReportType === 'PostLowQuality';
    const customFlag = flagType.ReportType === 'PostOther';
    const noFlag = flagType.ReportType === 'NoFlag';
    reporters.forEach(reporter => {
        let promise: Promise<boolean> | null = null;
        if (rudeFlag) {
            promise = reporter.ReportRedFlag();
        } else if (naaFlag) {
            promise = reporter.ReportNaa();
        } else if (noFlag || customFlag) {
            promise = getPromiseFromFlagName(flagType.DisplayName, reporter);
        }
        if (!promise) return;

        promise.then(didReport => {
            if (!didReport) return;
            globals.displaySuccess(`Feedback sent to ${reporter.name}`);
        }).catch(() => {
            globals.displayError(`Failed to send feedback to ${reporter.name}.`);
        });
    });
}

let autoFlagging = false;
function SetupPostPage(): void {
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
        const copyPastorApi = new CopyPastorAPI(post.postId);

        const reporters: Reporter[] = [];
        if (post.type === 'Answer' && globals.isStackOverflow) {
            reporters.push(setupNattyApi(post.postId, questionTime, answerTime, nattyIcon));
            reporters.push(setupGenericBotApi(post.postId));
            reporters.push(setupGuttenbergApi(copyPastorApi, copyPastorIcon));
        }
        reporters.push(setupMetasmokeApi(post.postId, post.type, smokeyIcon));

        const performedActionIcon = globals.performedActionIcon();
        const reportedIcon = globals.reportedIcon();

        if (post.page === 'Question') {
            // Now we setup the flagging dialog
            const deleted = post.element.hasClass('deleted-answer');

            const isEnabled = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationWatchFlags);
            globals.addXHRListener(xhr => {
                if (!isEnabled || autoFlagging || xhr.status !== 200 || !globals.flagsUrlRegex.exec(xhr.responseURL)) return;

                const matches = globals.getFlagsUrlRegex(post.postId).exec(xhr.responseURL);
                if (!matches) return;

                const flagType = {
                    Id: 0,
                    ReportType: matches[1],
                    DisplayName: matches[1],
                    Human: getHumanFromDisplayName(matches[1])
                } as FlagType;

                handleFlag(flagType, reporters);
                displaySuccessFlagged(reportedIcon, flagType.Human);
            });

            iconLocation.append(performedActionIcon, reportedIcon, nattyIcon, copyPastorIcon, smokeyIcon);

            const linkDisabled = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationLinkDisabled);
            if (linkDisabled) return;
            const shouldRaiseVlq = globals.qualifiesForVlq(post.score, answerTime || new Date());
            const dropDown = BuildFlaggingDialog(
                post, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi, shouldRaiseVlq
            );

            advancedFlaggingLink.append(dropDown);

            const openOnHover = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationOpenOnHover);
            if (openOnHover) {
                advancedFlaggingLink.hover(event => {
                    event.stopPropagation();
                    if (event.target === advancedFlaggingLink.get(0)) globals.showElement(dropDown);
                }).mouseleave(e => {
                    e.stopPropagation();
                    setTimeout(() => globals.hideElement(dropDown), 100); // avoid immediate closing of the popover
                });
            } else {
                advancedFlaggingLink.click(event => {
                    event.stopPropagation();
                    if (event.target === advancedFlaggingLink.get(0)) globals.showElement(dropDown);
                });
                $(window).click(() => globals.hideElement(dropDown));
            }
        } else {
            iconLocation.after(smokeyIcon, copyPastorIcon, nattyIcon, reportedIcon, performedActionIcon);
        }
    });
}

async function Setup(): Promise<void> {
    // Collect all ids
    await Promise.all([
        MetaSmokeAPI.Setup(globals.metaSmokeKey),
        MetaSmokeAPI.QueryMetaSmokeInternal(),
        CopyPastorAPI.getAllCopyPastorIds(),
        NattyAPI.getAllNattyIds()
    ]);
    SetupCommentsAndFlags();
    SetupPostPage();
    SetupStyles();
    void SetupConfiguration();
    document.body.appendChild(popupWrapper.get(0));

    const watchedQueuesEnabled = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationWatchQueues);
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
        const postId = parseInt(postIdStr, 10);
        const currentPostDetails = postDetails[postId];
        if (!currentPostDetails || !$('.answers-subheader').length) return;

        const flagType = {
            Id: 0,
            ReportType: 'AnswerNotAnAnswer',
            DisplayName: 'AnswerNotAnAnswer'
        } as FlagType;
        handleFlag(flagType, [setupNattyApi(postId)]);
    });
}

$(() => {
    let started = false;
    function actionWatcher(): void {
        if (!started) {
            started = true;
            void Setup();
        }
        $(window).off('focus', actionWatcher);
        $(window).off('mousemove', actionWatcher);
    }

    // If the window gains focus
    $(window).focus(actionWatcher);
    // Or we have mouse movement
    $(window).mousemove(actionWatcher);

    // Or the document is already focused,
    // Then we execute the script.
    // This is done to prevent DOSing dashboard apis, if a bunch of links are opened at once.
    if (document.hasFocus && document.hasFocus()) actionWatcher();
});
