import { FlagType, flagCategories } from './FlagTypes';
import { parseQuestionsAndAnswers, parseDate } from '@userscriptTools/sotools';
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

.advanced-flagging-natty-icon {
    background-image: url("https://i.stack.imgur.com/aMUMt.jpg?s=128&g=1");
}

.advanced-flagging-gut-icon {
    background-image: url("https://i.stack.imgur.com/A0JRA.png?s=128&g=1");
}

.advanced-flagging-smokey-icon {
    background-image: url("https://i.stack.imgur.com/7cmCt.png?s=128&g=1");
}

#af-comments textarea {
    width: calc(100% - 15px);
    resize: vertical;
}`);
}

const userFkey = StackExchange.options.user.fkey;
function handleFlagAndComment(
    postId: number,
    flag: FlagType,
    flagRequired: boolean,
    copypastorApi: CopyPastorAPI,
    score: number,
    creationDate: Date,
    commentText?: string | null,
): { CommentPromise?: Promise<string>; FlagPromise?: Promise<string>; } {
    const result: {
        CommentPromise?: Promise<string>;
        FlagPromise?: Promise<string>;
    } = {};

    if (commentText) {
        result.CommentPromise = new Promise<string>((resolve, reject) => {
            void $.ajax({
                url: `/posts/${postId}/comments`,
                type: 'POST',
                data: { fkey: userFkey, comment: commentText }
            }).done(data => {
                resolve(data);
            }).fail((jqXHR, textStatus, errorThrown) => {
                reject({ jqXHR, textStatus, errorThrown });
            });
        });
    }

    if (flagRequired && flag.ReportType !== 'NoFlag') {
        result.FlagPromise = new Promise((resolve, reject) => {
            const copypastorId = copypastorApi.getCopyPastorId();
            const targetUrl = copypastorApi.getTargetUrl();
            const flagText = flag.GetCustomFlagText && copypastorId && targetUrl
                ? flag.GetCustomFlagText(targetUrl, copypastorId)
                : null;

            autoFlagging = true;
            const flagName = flag.ReportType === 'PostLowQuality' ?
                (globals.qualifiesForVlq(score, creationDate) ? 'PostLowQuality' : 'AnswerNotAnAnswer') : flag.ReportType;
            void $.ajax({
                url: `//${window.location.hostname}/flags/posts/${postId}/add/${flagName}`,
                type: 'POST',
                data: { fkey: userFkey, otherText: flag.ReportType === 'PostOther' ? flagText : '' }
            }).done(data => {
                setTimeout(() => autoFlagging = false, 500);
                resolve(data);
            }).fail((jqXHR, textStatus, errorThrown) => {
                reject({ jqXHR, textStatus, errorThrown });
            });
        });
    }

    return result;
}

const isStackOverflow = globals.isStackOverflow();
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

function setupNattyApi(postId: number, nattyIcon?: JQuery): Reporter {
    const nattyApi = new NattyAPI(postId);
    const isReported = nattyApi.WasReported();
    if (nattyIcon) isReported ? globals.showInlineElement(nattyIcon) : nattyIcon.addClass('d-none');

    return {
        name: 'Natty',
        ReportNaa: (answerDate: Date, questionDate: Date): Promise<boolean> => nattyApi.ReportNaa(answerDate, questionDate),
        ReportRedFlag: (): Promise<boolean> => nattyApi.ReportRedFlag(),
        ReportLooksFine: (): Promise<boolean> => nattyApi.ReportLooksFine(),
        ReportNeedsEditing: (): Promise<boolean> => nattyApi.ReportNeedsEditing(),
        ReportVandalism: (): Promise<boolean> => Promise.resolve(false),
        ReportDuplicateAnswer: (): Promise<boolean> => Promise.resolve(false),
        ReportPlagiarism: (): Promise<boolean> => Promise.resolve(false)
    };
}

function setupGenericBotApi(postId: number): Reporter {
    const genericBotAPI = new GenericBotAPI(postId);
    return {
        name: 'Generic Bot',
        ReportNaa: (): Promise<boolean> => genericBotAPI.ReportNaa(),
        ReportRedFlag: (): Promise<boolean> => genericBotAPI.ReportRedFlag(),
        ReportLooksFine: (): Promise<boolean> => Promise.resolve(false),
        ReportNeedsEditing: (): Promise<boolean> => Promise.resolve(false),
        ReportVandalism: (): Promise<boolean> => Promise.resolve(true),
        ReportDuplicateAnswer: (): Promise<boolean> => Promise.resolve(false),
        ReportPlagiarism: (): Promise<boolean> => Promise.resolve(false)
    };
}

function setupMetasmokeApi(postId: number, postType: 'Answer' | 'Question', smokeyIcon: JQuery): Reporter {
    const metaSmoke = new MetaSmokeAPI();
    const isReported = MetaSmokeAPI.getSmokeyId(postId);
    if (!isReported) {
        smokeyIcon.addClass('d-none');
    } else {
        smokeyIcon.click(() => window.open(`https://metasmoke.erwaysoftware.com/post/${isReported}`, '_blank'));
        globals.showInlineElement(smokeyIcon);
    }

    return {
        name: 'Smokey',
        ReportNaa: (): Promise<boolean> => metaSmoke.ReportNaa(postId),
        ReportRedFlag: (): Promise<boolean> => metaSmoke.ReportRedFlag(postId, postType),
        ReportLooksFine: (): Promise<boolean> => metaSmoke.ReportLooksFine(postId),
        ReportNeedsEditing: (): Promise<boolean> => metaSmoke.ReportNeedsEditing(postId),
        ReportVandalism: (): Promise<boolean> => metaSmoke.ReportVandalism(postId),
        ReportDuplicateAnswer: (): Promise<boolean> => Promise.resolve(false),
        ReportPlagiarism: (): Promise<boolean> => Promise.resolve(false)
    };
}

function setupGuttenbergApi(copyPastorApi: CopyPastorAPI, copyPastorIcon: JQuery): Reporter {
    const copypastorId = copyPastorApi.getCopyPastorId();
    if (copypastorId) {
        copyPastorIcon.attr('Title', 'Reported by CopyPastor.');
        globals.showInlineElement(copyPastorIcon);
        copyPastorIcon.click(() => window.open(`https://copypastor.sobotics.org/posts/${copypastorId}`));
    } else {
        copyPastorIcon.addClass('d-none');
    }

    return {
        name: 'Guttenberg',
        ReportNaa: (): Promise<boolean> => copyPastorApi.ReportFalsePositive(),
        ReportRedFlag: (): Promise<boolean> => Promise.resolve(false),
        ReportLooksFine: (): Promise<boolean> => copyPastorApi.ReportFalsePositive(),
        ReportNeedsEditing: (): Promise<boolean> => copyPastorApi.ReportFalsePositive(),
        ReportVandalism: (): Promise<boolean> => copyPastorApi.ReportFalsePositive(),
        ReportDuplicateAnswer: (): Promise<boolean> => copyPastorApi.ReportTruePositive(),
        ReportPlagiarism: (): Promise<boolean> => copyPastorApi.ReportTruePositive()
    };
}

async function waitForCommentPromise(commentPromise: Promise<string>, postId: number): Promise<void> {
    try {
        const commentPromiseValue = await commentPromise;
        showComments(postId, commentPromiseValue);
    } catch (error) {
        globals.displayError('Failed to comment on post');
        console.error(error);
    }
}

async function waitForFlagPromise(flagPromise: Promise<string>, reportedIcon: JQuery, reportTypeHuman?: string): Promise<void> {
    try {
        const flagPromiseValue = await flagPromise;
        const responseJson = JSON.parse(JSON.stringify(flagPromiseValue)) as StackExchangeFlagResponse;
        if (responseJson.Success) {
            displaySuccessFlagged(reportedIcon, reportTypeHuman);
        } else { // sometimes, although the status is 200, the post isn't flagged.
            const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
            const message = getErrorMessage(responseJson);
            displayErrorFlagged(message, fullMessage);
        }
    } catch (error) {
        displayErrorFlagged('Failed to flag post', error);
    }
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

interface Reporter {
    name: string;
    ReportNaa(answerDate: Date, questionDate: Date): Promise<boolean>;
    ReportRedFlag(): Promise<boolean>;
    ReportLooksFine(): Promise<boolean>;
    ReportNeedsEditing(): Promise<boolean>;
    ReportVandalism(): Promise<boolean>;
    ReportDuplicateAnswer(): Promise<boolean>;
    ReportPlagiarism(): Promise<boolean>;
}

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

function BuildFlaggingDialog(element: JQuery,
    postId: number,
    postType: 'Question' | 'Answer',
    reputation: number,
    authorName: string,
    answerTime: Date,
    questionTime: Date,
    deleted: boolean,
    score: number,
    reportedIcon: JQuery,
    performedActionIcon: JQuery,
    reporters: Reporter[],
    copyPastorApi: CopyPastorAPI
): JQuery {
    const enabledFlagIds = GreaseMonkeyCache.GetFromCache<number[]>(globals.ConfigurationEnabledFlags);
    const defaultNoComment = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationDefaultNoComment);
    const defaultNoFlag = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationDefaultNoFlag);
    const comments = element.find('.comment-body');

    const dropDown = globals.dropDown.clone();
    const checkboxNameComment = `comment_checkbox_${postId}`;
    const checkboxNameFlag = `flag_checkbox_${postId}`;
    const leaveCommentBox = globals.getOptionBox(checkboxNameComment);
    const flagBox = globals.getOptionBox(checkboxNameFlag);

    flagBox.prop('checked', !defaultNoFlag);
    leaveCommentBox.prop('checked', !defaultNoComment && !comments.length && isStackOverflow);

    const newCategories = flagCategories.filter(item => item.AppliesTo.includes(postType)
                                                     && item.FlagTypes.some(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id)));
    for (const flagCategory of newCategories) {
        const categoryDiv = globals.getCategoryDiv(flagCategory.IsDangerous);
        for (const flagType of flagCategory.FlagTypes.filter(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id))) {
            const reportLink = globals.reportLink.clone();
            const dropdownItem = globals.dropdownItem.clone();

            // https://github.com/SOBotics/AdvancedFlagging/issues/16
            const copypastorIsRepost = copyPastorApi.getIsRepost();
            const copypastorId = copyPastorApi.getCopyPastorId();
            if (flagType.Enabled(copypastorIsRepost, copypastorId)) globals.showElement(reportLink);
            else continue;

            reportLink.text(flagType.DisplayName);
            dropdownItem.append(reportLink);
            categoryDiv.append(dropdownItem);

            dropDown.append(categoryDiv);

            let commentText: string | undefined | null;
            if (flagType.GetComment) {
                commentText = flagType.GetComment({ Reputation: reputation, AuthorName: authorName });
                reportLink.attr('title', commentText || '');
            }

            reportLink.click(async () => {
                if (!deleted) {
                    if (!leaveCommentBox.is(':checked') && commentText) {
                        const strippedComment = getStrippedComment(commentText);
                        upvoteSameComments(element, strippedComment);
                        commentText = null;
                    }

                    try {
                        const result = handleFlagAndComment(postId, flagType, flagBox.is(':checked'), copyPastorApi, score, answerTime, commentText);
                        if (result.CommentPromise) await waitForCommentPromise(result.CommentPromise, postId);
                        if (result.FlagPromise) await waitForFlagPromise(result.FlagPromise, reportedIcon, flagType.Human);
                    } catch (err) {
                        globals.displayError(err);
                    }
                }

                if (flagType.ReportType === 'NoFlag') {
                    performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                    globals.showElement(performedActionIcon);
                }

                handleFlag(flagType, reporters, answerTime, questionTime);
                globals.hideElement(dropDown); // hide the dropdown after clicking one of the options
            });
        }
        if (categoryDiv.html()) dropDown.append(globals.getDivider()); // at least one option exists for the category
    }

    if (isStackOverflow) {
        const commentBoxLabel = globals.getOptionLabel('Leave comment', checkboxNameComment);

        const commentingRow = globals.plainDiv.clone();
        commentingRow.append(leaveCommentBox);
        commentingRow.append(commentBoxLabel);

        dropDown.append(commentingRow);
        commentingRow.children();
    }

    const flagBoxLabel = globals.getOptionLabel('Flag', checkboxNameFlag);
    const flaggingRow = globals.plainDiv.clone();

    flaggingRow.append(flagBox);
    flaggingRow.append(flagBoxLabel);

    dropDown.append(flaggingRow);
    dropDown.append(globals.popoverArrow.clone());

    return dropDown;
}

function handleFlag(flagType: FlagType, reporters: Reporter[], answerTime: Date, questionTime: Date): void {
    const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
    const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer' || flagType.ReportType === 'PostLowQuality';
    const customFlag = flagType.ReportType === 'PostOther';
    const noFlag = flagType.ReportType === 'NoFlag';
    reporters.forEach(reporter => {
        let promise: Promise<boolean> | null = null;
        if (rudeFlag) {
            promise = reporter.ReportRedFlag();
        } else if (naaFlag) {
            promise = reporter.ReportNaa(answerTime, questionTime);
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

        const iconLocation: JQuery = post.page === 'Question'
            ? post.element.find('.js-post-menu').children().first()
            : post.element.find(`a.${post.element.children().first().hasClass('answer-summary') ? 'question' : 'answer'}-hyperlink`);
        const advancedFlaggingLink: JQuery = globals.advancedFlaggingLink.clone();
        if (post.page === 'Question') iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));

        const nattyIcon = globals.getNattyIcon().click(() => window.open(`//sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank'));
        const copyPastorIcon = globals.getGuttenbergIcon();
        const smokeyIcon = globals.getSmokeyIcon();
        const copyPastorApi = new CopyPastorAPI(post.postId);

        const reporters: Reporter[] = [];
        if (post.type === 'Answer') {
            reporters.push(setupNattyApi(post.postId, nattyIcon));
            reporters.push(setupGenericBotApi(post.postId));
            reporters.push(setupGuttenbergApi(copyPastorApi, copyPastorIcon));
        }
        reporters.push(setupMetasmokeApi(post.postId, post.type, smokeyIcon));

        const performedActionIcon = globals.getPerformedActionIcon();
        const reportedIcon = globals.getReportedIcon();

        if (post.page === 'Question') {
            // Now we setup the flagging dialog
            const questionTime: Date = post.type === 'Answer' ? post.question.postTime : post.postTime;
            const answerTime: Date = post.postTime;
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

                if (!questionTime || !answerTime) return;
                handleFlag(flagType, reporters, answerTime, questionTime);
                displaySuccessFlagged(reportedIcon, flagType.Human);
            });

            const linkDisabled = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationLinkDisabled);
            if (!linkDisabled && questionTime && answerTime) {
                const dropDown = BuildFlaggingDialog(
                    post.element, post.postId, post.type, post.authorReputation as number, post.authorName, answerTime,
                    questionTime, deleted, post.score, reportedIcon, performedActionIcon, reporters, copyPastorApi
                );

                advancedFlaggingLink.append(dropDown);

                const openOnHover = GreaseMonkeyCache.GetFromCache<boolean>(globals.ConfigurationOpenOnHover);

                if (openOnHover) {
                    advancedFlaggingLink.hover(event => {
                        event.stopPropagation();
                        if (event.target === advancedFlaggingLink.get(0)) globals.showElement(dropDown);
                    });
                    advancedFlaggingLink.mouseleave(e => {
                        e.stopPropagation();
                        setTimeout(() => globals.hideElement(dropDown), 100); // avoid immediate closing of popover
                    });
                } else {
                    advancedFlaggingLink.click(event => {
                        event.stopPropagation();
                        if (event.target === advancedFlaggingLink.get(0)) globals.showElement(dropDown);
                    });
                    $(window).click(() => globals.hideElement(dropDown));
                }
            }

            iconLocation.append(performedActionIcon);
            iconLocation.append(reportedIcon);
            iconLocation.append(nattyIcon);
            iconLocation.append(copyPastorIcon);
            iconLocation.append(smokeyIcon);
        } else {
            iconLocation.after(smokeyIcon);
            iconLocation.after(copyPastorIcon);
            iconLocation.after(nattyIcon);
            iconLocation.after(reportedIcon);
            iconLocation.after(performedActionIcon);
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

            const questionTime = parseDate($('.post-signature.owner .user-action-time span', content).attr('title'));
            const answerTime = parseDate($('.user-info .user-action-time span', content).attr('title'));
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
        handleFlag(flagType, [setupNattyApi(postId)], currentPostDetails.answerTime, currentPostDetails.questionTime);
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
