import { FlagType, flagCategories, Flags } from './FlagTypes';
import { parseQuestionsAndAnswers, QuestionPageInfo, PostInfo } from './UserscriptTools/sotools';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { GenericBotAPI } from './UserscriptTools/GenericBotAPI';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { SetupConfiguration } from './Configuration';
import * as globals from './GlobalVars';

declare const StackExchange: globals.StackExchange;

function SetupStyles(): void {
    GM_addStyle(`
.advanced-flagging-dialog { min-width: 10rem !important; }
#af-comments textarea { resize: vertical; }
.af-snackbar { transform: translate(-50%, 0); }`);
}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];

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
    const userFkey = StackExchange.options.user.fkey;
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
            const failedToFlagText = 'Failed to flag: ';
            const flagPost = await fetch(`//${window.location.hostname}/flags/posts/${post.postId}/add/${flagName}`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, otherText: flag.ReportType === 'PostOther' ? flagText : '' })
            });

            // for some reason, the flag responses are inconsistent: some are in JSON, others in text
            // for example, if a user flags posts too quickly, then they get a text response
            // if the post has been flagged successfully, the response is in JSON format
            const responseText = await flagPost.text();
            if (/You may only flag a post every \d+ seconds?/.test(responseText)) {
                const rateLimitedSeconds = /\d+/.exec(responseText)?.[0] || 0;
                const pluralS = rateLimitedSeconds > 1 ? 's' : '';
                displayErrorFlagged(`${failedToFlagText}rate-limited for ${rateLimitedSeconds} second${pluralS}`, responseText);
                return;
            }

            const responseJson = JSON.parse(responseText) as StackExchangeFlagResponse;
            if (responseJson.Success) {
                displaySuccessFlagged(reportedIcon, flag.ReportType);
            } else { // sometimes, although the status is 200, the post isn't flagged.
                const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                const message = getErrorMessage(responseJson);
                displayErrorFlagged(failedToFlagText + message, fullMessage);
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
    const messageDiv = globals.getMessageDiv(message, state);
    popupWrapper.append(messageDiv).removeClass('o0');

    window.setTimeout(() => {
        popupWrapper.addClass('o0');
        void globals.Delay(globals.transitionDelay).then(() => popupWrapper.empty());
    }, globals.popupDelay);
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
    if (/already flagged/.exec(responseJson.Message)) {
        return 'post already flagged';
    } else if (/limit reached/.exec(responseJson.Message)) {
        return 'post flag limit reached';
    } else {
        return responseJson.Message;
    }
}

function showComments(postId: number, data: string): void {
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(data, null, false, true);
    $(document).trigger('comment', postId);
}

function setupNattyApi(postId: number, questionTime: Date | null, answerTime: Date | null, nattyIcon?: JQuery): NattyAPI {
    const nattyApi = new NattyAPI(postId, questionTime || new Date(), answerTime || new Date());
    const isReported = nattyApi.WasReported();
    if (nattyIcon && isReported) {
        globals.showInlineElement(nattyIcon);
        nattyIcon.find('a').attr('href', `//sentinel.erwaysoftware.com/posts/aid/${postId}`).attr('target', '_blank');
    }

    return nattyApi;
}

function setupGenericBotApi(postId: number): GenericBotAPI {
    return new GenericBotAPI(postId);
}

function setupMetasmokeApi(postId: number, postType: 'Answer' | 'Question', smokeyIcon: JQuery): MetaSmokeAPI {
    const smokeyId = MetaSmokeAPI.getSmokeyId(postId);
    if (smokeyId) {
        smokeyIcon.find('a').attr('href', `https://metasmoke.erwaysoftware.com/post/${smokeyId}`).attr('target', '_blank');
        globals.showInlineElement(smokeyIcon);
    }

    return new MetaSmokeAPI(postId, postType);
}

function setupGuttenbergApi(copyPastorApi: CopyPastorAPI, copyPastorIcon: JQuery): CopyPastorAPI {
    const copypastorId = copyPastorApi.getCopyPastorId();
    if (copypastorId) {
        globals.showInlineElement(copyPastorIcon);
        copyPastorIcon.find('a').attr('href', `https://copypastor.sobotics.org/posts/${copypastorId}`).attr('target', '_blank');
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

function getAllBotIcons(): JQuery[] {
    const nattyIcon = globals.nattyIcon.clone();
    const copyPastorIcon = globals.guttenbergIcon.clone();
    const smokeyIcon = globals.smokeyIcon.clone();
    void globals.attachPopover(nattyIcon.find('a')[0], 'Reported by Natty', 'bottom-start');
    void globals.attachPopover(copyPastorIcon.find('a')[0], 'Reported by Guttenberg', 'bottom-start');
    void globals.attachPopover(smokeyIcon.find('a')[0], 'Reported by Smokey', 'bottom-start');
    return [nattyIcon, copyPastorIcon, smokeyIcon];
}

function addBotIconsToReview(post: PostInfo, botIcons?: JQuery[]): void {
    if (post.type !== 'Answer') return;

    const botIconsToAppend = botIcons || getAllBotIcons(), [nattyIcon, copyPastorIcon, smokeyIcon] = botIconsToAppend;
    const iconLocation = post.element.find('.js-post-menu').children().first();
    iconLocation.append(...botIconsToAppend);
    if (botIcons) return;

    const reporters: Reporter[] = [], copyPastorApi = new CopyPastorAPI(post.postId);
    reporters.push(setupNattyApi(post.postId, post.questionTime, post.creationDate, nattyIcon));
    setupMetasmokeApi(post.postId, post.type, smokeyIcon);
    setupGuttenbergApi(copyPastorApi, copyPastorIcon); // no need to send feedback to Guttenberg; just show the icon

    reviewPostsInformation.push({ postId: post.postId, post, reporters });
}

export type Reporter = CopyPastorAPI | MetaSmokeAPI | NattyAPI | GenericBotAPI;

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
    reporters: Reporter[];
}

interface ReviewQueueResponse {
    postId: number;
    postTypeId: number;
    isAudit: boolean;
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
    const comments = post.element.find('.comment-body');
    const dropdown = globals.dropdown.clone();
    const actionsMenu = globals.actionsMenu.clone();
    dropdown.append(actionsMenu);

    const defaultNoComment = globals.cachedConfigurationInfo?.[globals.ConfigurationDefaultNoComment];
    const defaultNoFlag = globals.cachedConfigurationInfo?.[globals.ConfigurationDefaultNoFlag];
    const defaultNoDownvote = globals.cachedConfigurationInfo?.[globals.ConfigurationDefaultNoDownvote];

    const checkComment = !defaultNoComment && !comments.length;
    const commentRow = globals.getPopoverOption(`af-comment-checkbox-${post.postId}`, checkComment, 'Leave comment');
    const flagRow = globals.getPopoverOption(`af-flag-checkbox-${post.postId}`, !defaultNoFlag, 'Flag');
    const downvoteRow = globals.getPopoverOption(`af-downvote-checkbox-${post.postId}`, !defaultNoDownvote, 'Downvote');

    const newCategories = flagCategories.filter(item => item.AppliesTo.includes(post.type)
                                                     && item.FlagTypes.some(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id)));
    newCategories.forEach(flagCategory => {
        const flagTypes = flagCategory.FlagTypes.filter(flagType => {
            // https://github.com/SOBotics/AdvancedFlagging/issues/16
            const copypastorIsRepost = copyPastorApi.getIsRepost();
            const copypastorId = copyPastorApi.getCopyPastorId();
            return flagType.Enabled(copypastorIsRepost, copypastorId);
        });
        if (!flagTypes.length) return;

        flagTypes.forEach(flagType => {
            const reportLink = globals.reportLink.clone().addClass(flagCategory.IsDangerous ? 'fc-red-500' : '');
            const dropdownItem = globals.dropdownItem.clone();

            globals.showElement(reportLink.text(flagType.DisplayName));
            dropdownItem.append(reportLink);
            actionsMenu.append(dropdownItem);

            let commentText = flagType.GetComment?.({ Reputation: post.authorReputation, AuthorName: post.authorName }) || null;
            const reportTypeHuman = getHumanFromDisplayName(flagType.ReportType);
            const reportLinkInfo = `This option will${reportTypeHuman ? ' ' : ' not'} flag the post <b>${reportTypeHuman}</b></br>`
                + (commentText ? `and add the following comment: ${commentText}` : '');
            void globals.attachHtmlPopover(reportLink.parent()[0], reportLinkInfo, 'right-start')
                .then(() => increasePopoverWidth(reportLink));

            reportLink.on('click', async () => {
                if (!deleted) {
                    if (!commentRow.find('.s-checkbox').is(':checked') && commentText) {
                        const strippedComment = getStrippedComment(commentText);
                        upvoteSameComments(post.element, strippedComment);
                        commentText = null;
                    }

                    await handleFlagAndComment(
                        post, flagType, flagRow.find('.s-checkbox').is(':checked'), downvoteRow.find('.s-checkbox').is(':checked'),
                        copyPastorApi, reportedIcon, shouldRaiseVlq, commentText
                    );
                }

                globals.hideElement(dropdown); // hide the dropdown after clicking one of the options
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
        });
        actionsMenu.append(globals.categoryDivider.clone());
    });

    actionsMenu.append(globals.popoverArrow.clone());
    if (globals.isStackOverflow) actionsMenu.append(commentRow);
    actionsMenu.append(flagRow, downvoteRow);

    return dropdown;
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
    if (linkDisabled || globals.isLqpReviewPage) return; // do not add the buttons on review
    parseQuestionsAndAnswers(post => {
        if (!post.element.length) return;

        const questionTime = post.type === 'Answer' ? post.questionTime : post.creationDate;
        const answerTime = post.type === 'Answer' ? post.creationDate : null;
        const iconLocation = post.page === 'Question'
            ? post.element.find('.js-post-menu').children().first()
            : post.element.find(`a.${post.type === 'Question' ? 'question' : 'answer'}-hyperlink`);
        const advancedFlaggingLink: JQuery = globals.advancedFlaggingLink.clone();
        if (post.page === 'Question') iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));

        const [nattyIcon, copyPastorIcon, smokeyIcon] = getAllBotIcons();
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
        NattyAPI.getAllNattyIds()
    ]).then(() => {
        SetupPostPage();
        SetupStyles();
        SetupConfiguration();
    });
    $('body').append(popupWrapper);

    const watchedQueuesEnabled = globals.cachedConfigurationInfo?.[globals.ConfigurationWatchQueues];
    if (!watchedQueuesEnabled) return;

    globals.addXHRListener(xhr => {
        if (xhr.status !== 200 || !globals.isReviewItemRegex.test(xhr.responseURL) || !$('#answer').length) return;

        const reviewResponse = JSON.parse(xhr.responseText) as ReviewQueueResponse;
        if (reviewResponse.isAudit || reviewResponse.postTypeId !== 2) return; // shouldn't be an audit and should be an answer

        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === reviewResponse.postId);
        const cachedPost = reviewCachedInfo?.post;
        cachedPost ? addBotIconsToReview(cachedPost) : parseQuestionsAndAnswers(addBotIconsToReview);
    });

    $(document).on('click', '.js-review-submit', () => {
        if (!$('#review-action-LooksGood').is(':checked')) return; // must have selected 'Looks OK' and clicked submit

        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === postId);
        if (!reviewCachedInfo) return; // something went wrong

        const flagType = flagCategories[3].FlagTypes[0]; // the Looks Fine flag type
        void handleFlag(flagType, reviewCachedInfo.reporters);
    });

    globals.addXHRListener(xhr => {
        if (xhr.status !== 200 || !globals.isDeleteVoteRegex.test(xhr.responseURL) || !$('#answer').length) return;

        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === postId);
        if (!reviewCachedInfo || reviewCachedInfo.post.type !== 'Answer') return; // something went wrong

        const flagType = flagCategories[2].FlagTypes[1]; // the not an answer flag type
        const reportersArray = [setupNattyApi(postId, reviewCachedInfo.post.questionTime, reviewCachedInfo.post.creationDate)];
        void handleFlag(flagType, reportersArray);
    });
}

Setup();
