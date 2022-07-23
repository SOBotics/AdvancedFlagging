// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      1.3.8
// @author       Robert Rudman
// @contributor  double-beep
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @exclude      *://chat.stackexchange.com/*
// @exclude      *://chat.meta.stackexchange.com/*
// @exclude      *://chat.stackoverflow.com/*
// @exclude      *://area51.stackexchange.com/*
// @exclude      *://data.stackexchange.com/*
// @exclude      *://stackoverflow.com/c/*
// @exclude      *://winterbash*.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @resource     Checkmark https://cdn.sstatic.net/Img/stacks-icons/Checkmark.svg
// @resource     Clear https://cdn.sstatic.net/Img/stacks-icons/Clear.svg
// @resource     EyeOff https://cdn.sstatic.net/Img/stacks-icons/EyeOff.svg
// @resource     Flag https://cdn.sstatic.net/Img/stacks-icons/Flag.svg
// @resource     Pencil https://cdn.sstatic.net/Img/stacks-icons/Pencil.svg
// @resource     Trash https://cdn.sstatic.net/Img/stacks-icons/Trash.svg
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @downloadURL  https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
// @updateURL    https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
// ==/UserScript==
/* globals StackExchange, Stacks, $ */

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.displayToaster = void 0;
const sotools_1 = __webpack_require__(1);
const NattyApi_1 = __webpack_require__(4);
const GenericBotAPI_1 = __webpack_require__(6);
const MetaSmokeAPI_1 = __webpack_require__(7);
const CopyPastorAPI_1 = __webpack_require__(8);
const Configuration_1 = __webpack_require__(9);
const globals = __webpack_require__(2);
function SetupStyles() {
    GM_addStyle(`
.advanced-flagging-dialog { min-width: 10rem !important; }
#af-comments textarea { resize: vertical; }
.af-snackbar {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}`);
}
const reviewPostsInformation = [];
function getFlagToRaise(flagName, qualifiesForVlq) {
    return flagName === 'PostLowQuality' ? (qualifiesForVlq ? 'PostLowQuality' : 'AnswerNotAnAnswer') : flagName;
}
async function handleActions(post, flag, flagRequired, downvoteRequired, reportedIcon, qualifiesForVlq, flagText, commentText) {
    var _a;
    const userFkey = StackExchange.options.user.fkey;
    if (commentText) {
        try {
            const postComment = await fetch(`/posts/${post.postId}/comments`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, comment: commentText })
            });
            const commentResult = await postComment.text();
            showComments(post.postId, commentResult);
        }
        catch (error) {
            globals.displayError('Failed to comment on post');
            console.error(error);
        }
    }
    if (flagRequired && flag.ReportType !== 'NoFlag') {
        autoFlagging = true;
        const flagName = getFlagToRaise(flag.ReportType, qualifiesForVlq);
        try {
            const failedToFlagText = 'Failed to flag: ';
            const flagPost = await fetch(`//${window.location.hostname}/flags/posts/${post.postId}/add/${flagName}`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ fkey: userFkey, otherText: flagText || '' })
            });
            const responseText = await flagPost.text();
            if (/You may only flag a post every \d+ seconds?/.test(responseText)) {
                const rateLimitedSeconds = ((_a = /\d+/.exec(responseText)) === null || _a === void 0 ? void 0 : _a[0]) || 0;
                const pluralS = rateLimitedSeconds > 1 ? 's' : '';
                displayErrorFlagged(`${failedToFlagText}rate-limited for ${rateLimitedSeconds} second${pluralS}`, responseText);
                return;
            }
            const responseJson = JSON.parse(responseText);
            if (responseJson.Success) {
                displaySuccessFlagged(reportedIcon, flagName);
            }
            else {
                const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                const message = getErrorMessage(responseJson);
                displayErrorFlagged(failedToFlagText + message, fullMessage);
            }
        }
        catch (error) {
            displayErrorFlagged('Failed to flag post', error);
        }
    }
    const downvoteButton = post.element.find('.js-vote-down-btn');
    if (!downvoteRequired || flag.ReportType === 'NoFlag' || downvoteButton.hasClass('fc-theme-primary'))
        return;
    downvoteButton.trigger('click');
}
async function handleFlag(flagType, reporters) {
    let hasFailed = false;
    const allPromises = Object.values(reporters).filter(item => flagType.Feedbacks[item.name]).map(reporter => {
        return reporter.sendFeedback(flagType.Feedbacks[reporter.name])
            .then(promiseValue => promiseValue ? globals.displaySuccess(promiseValue) : '')
            .catch(promiseError => {
            globals.displayError(promiseError.message);
            hasFailed = true;
        });
    });
    await Promise.allSettled(allPromises);
    return !hasFailed;
}
function displayToaster(message, state) {
    const messageDiv = globals.getMessageDiv(message, state);
    globals.popupWrapper.append(messageDiv.fadeIn());
    window.setTimeout(() => messageDiv.fadeOut('slow', () => messageDiv.remove()), globals.popupDelay);
}
exports.displayToaster = displayToaster;
function displaySuccessFlagged(reportedIcon, reportType) {
    if (!reportType)
        return;
    const flaggedMessage = `Flagged ${globals.getHumanFromDisplayName(reportType)}`;
    globals.attachPopover(reportedIcon[0], flaggedMessage);
    reportedIcon.fadeIn();
    globals.displaySuccess(flaggedMessage);
}
function displayErrorFlagged(message, error) {
    globals.displayError(message);
    console.error(error);
}
function getStrippedComment(commentText) {
    return commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/\[([^\]]+)\][^(]*?/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(' - From Review', '');
}
function upvoteSameComments(postElement, strippedCommentText) {
    postElement.find('.comment-body .comment-copy').each((_index, el) => {
        const element = $(el), text = element.text();
        if (text !== strippedCommentText)
            return;
        element.closest('li').find('a.comment-up.comment-up-off').trigger('click');
    });
}
function getErrorMessage(responseJson) {
    if (responseJson.Message.includes('already flagged')) {
        return 'post already flagged';
    }
    else if (responseJson.Message.includes('limit reached')) {
        return 'post flag limit reached';
    }
    else {
        return responseJson.Message;
    }
}
function showComments(postId, data) {
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(data, null, false, true);
    $(document).trigger('comment', postId);
}
function setupNattyApi(postId, questionTime, answerTime, nattyIcon) {
    const nattyApi = new NattyApi_1.NattyAPI(postId, questionTime || new Date(), answerTime || new Date());
    const isReported = nattyApi.wasReported();
    if (nattyIcon && isReported) {
        globals.showInlineElement(nattyIcon);
        nattyIcon.find('a').attr('href', `//sentinel.erwaysoftware.com/posts/aid/${postId}`).attr('target', '_blank');
    }
    return nattyApi;
}
function setupMetasmokeApi(postId, postType, smokeyIcon) {
    const metasmokeApi = new MetaSmokeAPI_1.MetaSmokeAPI(postId, postType);
    const smokeyId = metasmokeApi.getSmokeyId();
    if (smokeyId) {
        smokeyIcon.find('a').attr('href', `https://metasmoke.erwaysoftware.com/post/${smokeyId}`).attr('target', '_blank');
        globals.showInlineElement(smokeyIcon);
    }
    return metasmokeApi;
}
function setupGuttenbergApi(postId, copypastorIcon) {
    const copypastorApi = new CopyPastorAPI_1.CopyPastorAPI(postId), copypastorId = copypastorApi.copypastorId;
    if (copypastorId) {
        globals.showInlineElement(copypastorIcon);
        copypastorIcon.find('a').attr('href', `https://copypastor.sobotics.org/posts/${copypastorId}`).attr('target', '_blank');
    }
    return copypastorApi;
}
function increasePopoverWidth(reportLink) {
    const popoverId = reportLink.parent().attr('aria-describedby') || '';
    $(`#${popoverId}`).addClass('sm:wmn-initial md:wmn-initial wmn5');
}
function getAllBotIcons() {
    const nattyIcon = globals.nattyIcon.clone();
    const copypastorIcon = globals.guttenbergIcon.clone();
    const smokeyIcon = globals.smokeyIcon.clone();
    globals.attachPopover(nattyIcon.find('a')[0], 'Reported by Natty');
    globals.attachPopover(copypastorIcon.find('a')[0], 'Reported by Guttenberg');
    globals.attachPopover(smokeyIcon.find('a')[0], 'Reported by Smokey');
    return [nattyIcon, copypastorIcon, smokeyIcon];
}
function addBotIconsToReview(post, botIcons) {
    if (post.postType !== 'Answer')
        return;
    const botIconsToAppend = botIcons || getAllBotIcons(), [nattyIcon, copypastorIcon, smokeyIcon] = botIconsToAppend;
    const iconLocation = post.element.find('.js-post-menu').children().first();
    iconLocation.append(...botIconsToAppend);
    if (botIcons)
        return;
    const reporters = {
        Natty: setupNattyApi(post.postId, post.questionTime, post.answerTime, nattyIcon),
        Smokey: setupMetasmokeApi(post.postId, post.postType, smokeyIcon),
        Guttenberg: setupGuttenbergApi(post.postId, copypastorIcon)
    };
    reviewPostsInformation.push({ postId: post.postId, post, reporters });
}
function getFeedbackSpans(flagType, nattyReported, nattyCanReport, smokeyReported, guttenbergReported, postDeleted) {
    return Object.entries(flagType.Feedbacks)
        .filter(([botName, feedback]) => {
        return feedback &&
            (botName === 'Natty' && (nattyReported || (nattyCanReport && !/fp|ne/.test(feedback))))
            || (botName === 'Smokey' && (smokeyReported || (!/naa|fp|tp-/.test(feedback) && !postDeleted)))
            || (botName === 'Guttenberg' && guttenbergReported
                || (botName === 'Generic Bot' && feedback === 'track'));
    }).map(([botName, feedback]) => {
        if (feedback === 'track')
            return '<span><b>track </b>with Generic Bot</span>';
        const isGreen = feedback.includes('tp'), isRed = feedback.includes('fp'), isYellow = /naa|ne/.test(feedback);
        let className = '';
        if (isGreen)
            className = 'success';
        else if (isRed)
            className = 'danger';
        else if (isYellow)
            className = 'warning';
        const shouldReport = (botName === 'Smokey' && !smokeyReported) || (botName === 'Natty' && !nattyReported);
        return `<span class="fc-${className}"><b>${shouldReport ? 'report' : feedback}</b></span> to ${botName}`;
    }).filter(String).join(', ') || globals.noneString;
}
function getOptionsRow(postElement, postId) {
    const postComments = postElement.find('.comment-body');
    const defaultNoComment = globals.cachedConfiguration[globals.ConfigurationDefaultNoComment];
    const defaultNoFlag = globals.cachedConfiguration[globals.ConfigurationDefaultNoFlag];
    const defaultNoDownvote = globals.cachedConfiguration[globals.ConfigurationDefaultNoDownvote];
    const checkComment = !defaultNoComment && !postComments.length;
    const commentRow = globals.getPopoverOption(`af-comment-checkbox-${postId}`, checkComment, 'Leave comment');
    const flagRow = globals.getPopoverOption(`af-flag-checkbox-${postId}`, !defaultNoFlag, 'Flag');
    const downvoteRow = globals.getPopoverOption(`af-downvote-checkbox-${postId}`, !defaultNoDownvote, 'Downvote');
    return [commentRow, flagRow, downvoteRow];
}
function BuildFlaggingDialog(post, reportedIcon, performedActionIcon, reporters, shouldRaiseVlq, failedActionIcon) {
    const [commentRow, flagRow, downvoteRow] = getOptionsRow(post.element, post.postId);
    const dropdown = globals.dropdown.clone(), actionsMenu = globals.actionsMenu.clone();
    dropdown.append(actionsMenu);
    const copypastorApi = reporters.Guttenberg, nattyApi = reporters.Natty, metasmokeApi = reporters.Smokey;
    const smokeyId = metasmokeApi === null || metasmokeApi === void 0 ? void 0 : metasmokeApi.getSmokeyId();
    const copypastorId = copypastorApi === null || copypastorApi === void 0 ? void 0 : copypastorApi.copypastorId, isRepost = copypastorApi === null || copypastorApi === void 0 ? void 0 : copypastorApi.repost, targetUrl = copypastorApi === null || copypastorApi === void 0 ? void 0 : copypastorApi.targetUrl;
    const newCategories = globals.cachedCategories.filter(item => item.AppliesTo.includes(post.postType))
        .map(item => ({ ...item, FlagTypes: [] }));
    globals.cachedFlagTypes.filter(flagType => {
        const isGuttenbergItem = flagType.ReportType === 'PostOther';
        const showGutReport = Boolean(copypastorId) && (flagType.DisplayName === 'Duplicate Answer' ? isRepost : !isRepost);
        const showOnMainSite = ['Red flags', 'General'].includes(flagType.BelongsTo) ? true : globals.isStackOverflow;
        return flagType.Enabled && (isGuttenbergItem ? showGutReport : showOnMainSite);
    }).forEach(flagType => { var _a; return (_a = newCategories.find(category => flagType.BelongsTo === category.Name)) === null || _a === void 0 ? void 0 : _a.FlagTypes.push(flagType); });
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
            let reportTypeHuman = globals.getHumanFromDisplayName(flagName);
            const flagText = copypastorId && targetUrl ? globals.getFullFlag(flagType.Id, targetUrl, copypastorId) : null;
            const feedbacksString = getFeedbackSpans(flagType, (nattyApi === null || nattyApi === void 0 ? void 0 : nattyApi.wasReported()) || false, (nattyApi === null || nattyApi === void 0 ? void 0 : nattyApi.canBeReported()) || false, Boolean(smokeyId), Boolean(copypastorId), post.deleted);
            let tooltipCommentText = commentText;
            let tooltipFlagText = flagText;
            const postDeletedString = '<span class="fc-danger">- post is deleted</span>';
            if (flagType.ReportType !== flagName)
                reportTypeHuman += ' (VLQ criteria weren\'t met)';
            else if (flagType.ReportType !== 'NoFlag' && post.deleted)
                reportTypeHuman = `${globals.noneString} ${postDeletedString}`;
            else if (commentText && post.deleted)
                tooltipCommentText = `${globals.noneString} ${postDeletedString}`;
            else if (flagText && post.deleted)
                tooltipFlagText = `${globals.noneString} ${postDeletedString}`;
            const reportLinkInfo = `<div><b>Flag: </b>${reportTypeHuman || globals.noneString}</div>`
                + `<div><b>Comment: </b>${tooltipCommentText || globals.noneString}</div>`
                + (tooltipFlagText ? `<div><b>Flag text: </b>${tooltipFlagText}</div>` : '')
                + `<div><b>Feedbacks: </b> ${feedbacksString}</div>`;
            globals.attachHtmlPopover(reportLink.parent()[0], reportLinkInfo, 'right-start');
            setTimeout(() => increasePopoverWidth(reportLink));
            reportLink.on('click', async () => {
                dropdown.fadeOut('fast');
                if (!post.deleted) {
                    if (!commentRow.find('.s-checkbox').is(':checked') && commentText) {
                        upvoteSameComments(post.element, getStrippedComment(commentText));
                        commentText = null;
                    }
                    const flagPost = flagRow.find('.s-checkbox').is(':checked');
                    const downvotePost = downvoteRow.find('.s-checkbox').is(':checked');
                    await handleActions(post, flagType, flagPost, downvotePost, reportedIcon, shouldRaiseVlq, flagText, commentText);
                }
                const success = await handleFlag(flagType, reporters);
                if (flagType.ReportType !== 'NoFlag')
                    return;
                if (success) {
                    globals.attachPopover(performedActionIcon[0], `Performed action ${flagType.DisplayName}`);
                    performedActionIcon.fadeIn();
                }
                else {
                    globals.attachPopover(failedActionIcon[0], `Failed to perform action ${flagType.DisplayName}`);
                    failedActionIcon.fadeIn();
                }
            });
        });
        actionsMenu.append(globals.categoryDivider.clone());
    });
    actionsMenu.append(globals.popoverArrow.clone());
    if (globals.isStackOverflow)
        actionsMenu.append(commentRow);
    actionsMenu.append(flagRow, downvoteRow);
    return dropdown;
}
let autoFlagging = false;
function SetupPostPage() {
    const linkDisabled = globals.cachedConfiguration[globals.ConfigurationLinkDisabled];
    if (linkDisabled || globals.isLqpReviewPage)
        return;
    (0, sotools_1.parseQuestionsAndAnswers)(post => {
        if (!post.element.length)
            return;
        const [nattyIcon, copypastorIcon, smokeyIcon] = getAllBotIcons();
        const reporters = { Smokey: setupMetasmokeApi(post.postId, post.postType, smokeyIcon) };
        if (post.postType === 'Answer' && globals.isStackOverflow) {
            reporters.Natty = setupNattyApi(post.postId, post.questionTime, post.answerTime, nattyIcon);
            reporters['Generic Bot'] = new GenericBotAPI_1.GenericBotAPI(post.postId);
            reporters.Guttenberg = setupGuttenbergApi(post.postId, copypastorIcon);
        }
        if (post.page !== 'Question')
            return post.iconLocation.after(smokeyIcon, copypastorIcon, nattyIcon);
        if (post.score === null)
            return;
        const advancedFlaggingLink = globals.advancedFlaggingLink.clone();
        post.iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));
        const performedActionIcon = globals.performedActionIcon();
        const failedActionIcon = globals.failedActionIcon();
        const reportedIcon = globals.reportedIcon();
        const shouldRaiseVlq = globals.qualifiesForVlq(post.score, post.answerTime || new Date());
        const dropDown = BuildFlaggingDialog(post, reportedIcon, performedActionIcon, reporters, shouldRaiseVlq, failedActionIcon);
        advancedFlaggingLink.append(dropDown);
        post.iconLocation.append(performedActionIcon, reportedIcon, failedActionIcon, nattyIcon, copypastorIcon, smokeyIcon);
        const openOnHover = globals.cachedConfiguration[globals.ConfigurationOpenOnHover];
        if (openOnHover) {
            advancedFlaggingLink.on('mouseover', event => {
                event.stopPropagation();
                if (event.target === advancedFlaggingLink.get(0))
                    dropDown.fadeIn('fast');
            }).on('mouseleave', e => {
                e.stopPropagation();
                setTimeout(() => dropDown.fadeOut('fast'), 200);
            });
        }
        else {
            advancedFlaggingLink.on('click', event => {
                event.stopPropagation();
                if (event.target === advancedFlaggingLink.get(0))
                    dropDown.fadeIn('fast');
            });
            $(window).on('click', () => dropDown.fadeOut('fast'));
        }
        const shouldWatchFlags = globals.cachedConfiguration[globals.ConfigurationWatchFlags];
        globals.addXHRListener(xhr => {
            if (!shouldWatchFlags || autoFlagging || xhr.status !== 200 || !globals.flagsUrlRegex.test(xhr.responseURL))
                return;
            const matches = globals.getFlagsUrlRegex(post.postId).exec(xhr.responseURL);
            const flagType = globals.cachedFlagTypes.find(item => item.ReportType === (matches === null || matches === void 0 ? void 0 : matches[1]));
            if (!flagType)
                return;
            displaySuccessFlagged(reportedIcon, flagType.ReportType);
            void handleFlag(flagType, reporters);
        });
    });
}
function Setup() {
    void Promise.all([
        MetaSmokeAPI_1.MetaSmokeAPI.setup(),
        MetaSmokeAPI_1.MetaSmokeAPI.queryMetaSmokeInternal(),
        CopyPastorAPI_1.CopyPastorAPI.getAllCopyPastorIds(),
        NattyApi_1.NattyAPI.getAllNattyIds()
    ]).then(() => {
        SetupPostPage();
        SetupStyles();
        (0, Configuration_1.setupConfiguration)();
    });
    $('body').append(globals.popupWrapper);
    const watchedQueuesEnabled = globals.cachedConfiguration[globals.ConfigurationWatchQueues];
    if (!watchedQueuesEnabled)
        return;
    globals.addXHRListener(xhr => {
        var _a;
        if (xhr.status !== 200 || !globals.isReviewItemRegex.test(xhr.responseURL) || !$('#answer').length)
            return;
        const reviewResponse = JSON.parse(xhr.responseText);
        if (reviewResponse.isAudit || reviewResponse.postTypeId !== 2)
            return;
        const cachedPost = (_a = reviewPostsInformation.find(item => item.postId === reviewResponse.postId)) === null || _a === void 0 ? void 0 : _a.post;
        cachedPost ? addBotIconsToReview(cachedPost) : (0, sotools_1.parseQuestionsAndAnswers)(addBotIconsToReview);
    });
    $(document).on('click', '.js-review-submit', () => {
        if (!$('#review-action-LooksGood').is(':checked'))
            return;
        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === postId);
        const flagType = globals.cachedFlagTypes.find(item => item.DisplayName === 'Looks Fine');
        if (!reviewCachedInfo || !flagType)
            return;
        void handleFlag(flagType, reviewCachedInfo.reporters);
    });
    globals.addXHRListener(xhr => {
        if (xhr.status !== 200 || !globals.isDeleteVoteRegex.test(xhr.responseURL) || !$('#answer').length)
            return;
        const postId = globals.getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation.find(item => item.postId === postId);
        if (!reviewCachedInfo || reviewCachedInfo.post.postType !== 'Answer')
            return;
        const reportersArray = {
            Natty: setupNattyApi(postId, reviewCachedInfo.post.questionTime, reviewCachedInfo.post.answerTime)
        };
        const flagType = globals.cachedFlagTypes.find(item => item.DisplayName === 'Not an answer');
        if (!flagType)
            return;
        void handleFlag(flagType, reportersArray);
    });
}
Setup();


/***/ }),
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAllPostIds = exports.parseQuestionsAndAnswers = void 0;
const GlobalVars_1 = __webpack_require__(2);
$.event.special.destroyed = {
    remove: (o) => {
        var _a;
        (_a = o.handler) === null || _a === void 0 ? void 0 : _a.call(o);
    }
};
function getExistingElement() {
    if (!GlobalVars_1.isQuestionPage && !GlobalVars_1.isNatoPage && !GlobalVars_1.isFlagsPage)
        return;
    const natoElements = $('.answer-hyperlink').parents('tr'), flagElements = $('.flagged-post');
    const questionPageElements = $('.question, .answer');
    const elementToUse = [natoElements, flagElements, questionPageElements].find(item => item.length);
    return elementToUse;
}
function getPage() {
    if (GlobalVars_1.isFlagsPage)
        return 'Flags';
    else if (GlobalVars_1.isNatoPage)
        return 'NATO';
    else if (GlobalVars_1.isQuestionPage)
        return 'Question';
    else
        return '';
}
function getPostIdFromElement(postNode, postType) {
    const elementHref = postNode.find('.answer-hyperlink, .question-hyperlink').attr('href');
    const postIdString = (postNode.attr('data-questionid') || postNode.attr('data-answerid'))
        || (postType === 'Answer' ? elementHref === null || elementHref === void 0 ? void 0 : elementHref.split('#')[1] : elementHref === null || elementHref === void 0 ? void 0 : elementHref.split('/')[2]);
    return Number(postIdString);
}
function parseAuthorReputation(reputationDiv) {
    let reputationText = reputationDiv.text().replace(/,/g, '');
    if (!reputationText)
        return 0;
    if (reputationText.includes('k')) {
        reputationText = reputationText.replace(/\./g, '').replace(/k/, '');
        return Number(reputationText) * 1000;
    }
    else
        return Number(reputationText);
}
function getPostCreationDate(postNode, postType) {
    const dateString = (postType === 'Question' ? $('.question') : postNode).find('.user-info .relativetime').last();
    return new Date(dateString.attr('title') || '');
}
function parseQuestionsAndAnswers(callback) {
    var _a;
    (_a = getExistingElement()) === null || _a === void 0 ? void 0 : _a.each((_index, node) => {
        const element = $(node);
        const postType = element.hasClass('question') || element.find('.question-hyperlink').length ? 'Question' : 'Answer';
        const page = getPage();
        if (!page)
            return;
        const iconLocation = page === 'Question'
            ? element.find('.js-post-menu').children().first()
            : element.find('a.question-hyperlink, a.answer-hyperlink');
        const postId = getPostIdFromElement(element, postType);
        const questionTime = getPostCreationDate(element, 'Question');
        const answerTime = getPostCreationDate(element, 'Answer');
        const score = Number(element.attr('data-score')) || 0;
        const opReputation = parseAuthorReputation(element.find('.user-info .reputation-score').last());
        const opName = element.find('.user-info .user-details a').eq(-1).text().trim();
        const deleted = element.hasClass('deleted-answer');
        callback({ postType, element, iconLocation, page, postId, questionTime, answerTime, score, opReputation, opName, deleted });
    });
}
exports.parseQuestionsAndAnswers = parseQuestionsAndAnswers;
function getAllPostIds(includeQuestion, urlForm) {
    const elementToUse = getExistingElement();
    if (!elementToUse)
        return [];
    return elementToUse.get().map(item => {
        const element = $(item);
        const isQuestionType = GlobalVars_1.isQuestionPage ? element.attr('data-questionid') : element.find('.question-hyperlink').length;
        const postType = isQuestionType ? 'Question' : 'Answer';
        if (!includeQuestion && postType === 'Question')
            return '';
        const elementHref = element.find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
        let postId;
        if (elementHref) {
            postId = Number(postType === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
        }
        else {
            postId = Number(element.attr('data-questionid') || element.attr('data-answerid'));
        }
        return urlForm ? `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}` : postId;
    }).filter(String);
}
exports.getAllPostIds = getAllPostIds;


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.attachPopover = exports.displayStacksToast = exports.getStacksSvg = exports.FlagCategoriesKey = exports.FlagTypesKey = exports.MetaSmokeDisabledConfig = exports.MetaSmokeUserKeyConfig = exports.CacheChatApiFkey = exports.ConfigurationAddAuthorName = exports.ConfigurationLinkDisabled = exports.ConfigurationWatchQueues = exports.ConfigurationWatchFlags = exports.ConfigurationDefaultNoDownvote = exports.ConfigurationDefaultNoComment = exports.ConfigurationDefaultNoFlag = exports.ConfigurationOpenOnHover = exports.ConfigurationCacheKey = exports.flagPosts = exports.setBounties = exports.whyVote = exports.voteUpHelp = exports.reputationHelp = exports.commentHelp = exports.deletedAnswers = exports.noneString = exports.gridCellDiv = exports.isLqpReviewPage = exports.isFlagsPage = exports.isNatoPage = exports.isQuestionPage = exports.isStackOverflow = exports.chatFailureMessage = exports.nattyReportedMessage = exports.metasmokeFailureMessage = exports.metasmokeReportedMessage = exports.genericBotFailure = exports.genericBotSuccess = exports.settingUpBody = exports.settingUpTitle = exports.popupDelay = exports.dayMillis = exports.username = exports.nattyFeedbackUrl = exports.genericBotKey = exports.copypastorServer = exports.copypastorKey = exports.metasmokeApiFilter = exports.metasmokeKey = exports.soboticsRoomId = exports.possibleFeedbacks = void 0;
exports.getFullFlag = exports.getFullComment = exports.cachedCategories = exports.updateFlagTypes = exports.cachedFlagTypes = exports.updateConfiguration = exports.cachedConfiguration = exports.addXHRListener = exports.showConfirmModal = exports.Delay = exports.showMSTokenPopupAndGet = exports.editCommentsPopup = exports.configurationModal = exports.commentsLink = exports.commentsDiv = exports.configurationLink = exports.configurationDiv = exports.getPopoverOption = exports.categoryDivider = exports.reportLink = exports.dropdownItem = exports.actionsMenu = exports.dropdown = exports.popoverArrow = exports.advancedFlaggingLink = exports.popupWrapper = exports.reportedIcon = exports.failedActionIcon = exports.performedActionIcon = exports.getTextarea = exports.getSectionWrapper = exports.getMessageDiv = exports.smokeyIcon = exports.guttenbergIcon = exports.nattyIcon = exports.getSentMessage = exports.qualifiesForVlq = exports.getPostIdFromReview = exports.getFormDataFromObject = exports.getParamsFromObject = exports.isPostDeleted = exports.displayError = exports.displaySuccess = exports.showInlineElement = exports.showElement = exports.getFlagsUrlRegex = exports.flagsUrlRegex = exports.isDeleteVoteRegex = exports.isReviewItemRegex = exports.attachHtmlPopover = void 0;
exports.getHumanFromDisplayName = exports.getFlagTypeFromFlagId = void 0;
const GreaseMonkeyCache_1 = __webpack_require__(3);
const AdvancedFlagging_1 = __webpack_require__(0);
exports.possibleFeedbacks = {
    Smokey: ['tpu-', 'tp-', 'fp-', 'naa-', ''],
    Natty: ['tp', 'fp', 'ne', ''],
    Guttenberg: ['tp', 'fp', ''],
    'Generic Bot': ['track', '']
};
exports.soboticsRoomId = 111347;
exports.metasmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
exports.metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
exports.copypastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
exports.copypastorServer = 'https://copypastor.sobotics.org';
exports.genericBotKey = 'Cm45BSrt51FR3ju';
const placeholderTarget = /\$TARGET\$/g;
const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
exports.nattyFeedbackUrl = 'https://logs.sobotics.org/napi-1.1/api/stored/';
exports.username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
exports.dayMillis = 1000 * 60 * 60 * 24;
exports.popupDelay = 4 * 1000;
exports.settingUpTitle = 'Setting up MetaSmoke';
exports.settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
    + 'To reset configuration, see the footer of Stack Overflow.';
exports.genericBotSuccess = 'Post tracked with Generic Bot';
exports.genericBotFailure = 'Server refused to track the post';
exports.metasmokeReportedMessage = 'Post reported to Smokey';
exports.metasmokeFailureMessage = 'Failed to report post to Smokey';
exports.nattyReportedMessage = 'Post reported to Natty';
exports.chatFailureMessage = 'Failed to send message to chat';
const nattyImage = 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1';
const guttenbergImage = 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1';
const smokeyImage = 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1';
exports.isStackOverflow = /^https:\/\/stackoverflow.com/.test(window.location.href);
exports.isQuestionPage = /\/questions\/\d+.*/.test(window.location.href);
exports.isNatoPage = window.location.href.includes('/tools/new-answers-old-questions');
exports.isFlagsPage = /\/users\/flag-summary\/\d+/.test(window.location.href);
exports.isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(window.location.href);
exports.gridCellDiv = $('<div>').addClass('flex--item');
exports.noneString = '<span class="o50">(none)</span>';
exports.deletedAnswers = '/help/deleted-answers';
exports.commentHelp = '/help/privileges/comment';
exports.reputationHelp = '/help/whats-reputation';
exports.voteUpHelp = '/help/privileges/vote-up';
exports.whyVote = '/help/why-vote';
exports.setBounties = '/help/privileges/set-bounties';
exports.flagPosts = '/help/privileges/flag-posts';
exports.ConfigurationCacheKey = 'Configuration';
exports.ConfigurationOpenOnHover = 'OpenOnHover';
exports.ConfigurationDefaultNoFlag = 'DefaultNoFlag';
exports.ConfigurationDefaultNoComment = 'DefaultNoComment';
exports.ConfigurationDefaultNoDownvote = 'DefaultNoDownvote';
exports.ConfigurationWatchFlags = 'WatchFlags';
exports.ConfigurationWatchQueues = 'WatchQueues';
exports.ConfigurationLinkDisabled = 'LinkDisabled';
exports.ConfigurationAddAuthorName = 'AddAuthorName';
exports.CacheChatApiFkey = 'fkey';
exports.MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
exports.MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
exports.FlagTypesKey = 'FlagTypes';
exports.FlagCategoriesKey = 'FlagCategories';
const getStacksSvg = (svgName) => $(GM_getResourceText(svgName));
exports.getStacksSvg = getStacksSvg;
const displayStacksToast = (message, type) => StackExchange.helpers.showToast(message, {
    type: type,
    transientTimeout: exports.popupDelay
});
exports.displayStacksToast = displayStacksToast;
const attachPopover = (element, text, position = 'bottom-start') => {
    Stacks.setTooltipText(element, text, { placement: position });
};
exports.attachPopover = attachPopover;
const attachHtmlPopover = (element, text, position = 'bottom-start') => {
    Stacks.setTooltipHtml(element, text, { placement: position });
};
exports.attachHtmlPopover = attachHtmlPopover;
exports.isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
exports.isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
exports.flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
function getFlagsUrlRegex(postId) {
    return new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther|PostLowQuality)`);
}
exports.getFlagsUrlRegex = getFlagsUrlRegex;
const showElement = (element) => element.addClass('d-block').removeClass('d-none');
exports.showElement = showElement;
const showInlineElement = (element) => element.addClass('d-inline-block').removeClass('d-none');
exports.showInlineElement = showInlineElement;
const displaySuccess = (message) => (0, AdvancedFlagging_1.displayToaster)(message, 'success');
exports.displaySuccess = displaySuccess;
const displayError = (message) => (0, AdvancedFlagging_1.displayToaster)(message, 'danger');
exports.displayError = displayError;
const isPostDeleted = (postId) => $(`#question-${postId}, #answer-${postId}`).hasClass('deleted-answer');
exports.isPostDeleted = isPostDeleted;
function getParamsFromObject(object) {
    return Object.entries(object).map(item => item.join('=')).join('&');
}
exports.getParamsFromObject = getParamsFromObject;
function getFormDataFromObject(object) {
    return Object.keys(object).reduce((formData, key) => {
        formData.append(key, object[key]);
        return formData;
    }, new FormData());
}
exports.getFormDataFromObject = getFormDataFromObject;
const getCopypastorLink = (postId) => `https://copypastor.sobotics.org/posts/${postId}`;
const getPostIdFromReview = () => { var _a; return Number((_a = $('[id^="answer-"]').attr('id')) === null || _a === void 0 ? void 0 : _a.split('-')[1]); };
exports.getPostIdFromReview = getPostIdFromReview;
function qualifiesForVlq(postScore, creationDate) {
    return postScore <= 0 && (new Date().valueOf() - creationDate.valueOf()) < exports.dayMillis;
}
exports.qualifiesForVlq = qualifiesForVlq;
function getSentMessage(success, feedback, bot) {
    return success ? `Feedback ${feedback} sent to ${bot}` : `Failed to send feedback ${feedback} to ${bot}`;
}
exports.getSentMessage = getSentMessage;
const sampleIcon = exports.gridCellDiv.clone().addClass(`d-none ${exports.isQuestionPage || exports.isLqpReviewPage ? '' : ' ml8'}`)
    .append($('<a>').addClass('s-avatar s-avatar__16 s-user-card--avatar').append($('<img>').addClass('s-avatar--image')));
exports.nattyIcon = sampleIcon.clone().find('img').attr('src', nattyImage).parent().parent();
exports.guttenbergIcon = sampleIcon.clone().find('img').attr('src', guttenbergImage).parent().parent();
exports.smokeyIcon = sampleIcon.clone().find('img').attr('src', smokeyImage).parent().parent();
const getMessageDiv = (text, state) => $('<div>').addClass(`p12 bg-${state}`).text(text).hide();
exports.getMessageDiv = getMessageDiv;
const getSectionWrapper = (name) => $('<fieldset>').html(`<h2 class="flex--item">${name}</h2>`)
    .addClass(`grid gs8 gsy fd-column af-section-${name.toLowerCase()}`);
exports.getSectionWrapper = getSectionWrapper;
const getTextarea = (textareaContent, labelText, contentType) => $(`
<div class="grid gs4 gsy fd-column" style="display: ${textareaContent ? 'flex' : 'none'};">
    <label class="flex--item s-label">${labelText}</label>
    <textarea rows=4 class="flex--item s-textarea fs-body2 af-${contentType}-content">${textareaContent}</textarea>
</div>`);
exports.getTextarea = getTextarea;
const iconWrapper = $('<div>').addClass('flex--item').css('display', 'none');
const performedActionIcon = () => iconWrapper.clone().append((0, exports.getStacksSvg)('Checkmark').addClass('fc-green-500'));
exports.performedActionIcon = performedActionIcon;
const failedActionIcon = () => iconWrapper.clone().append((0, exports.getStacksSvg)('Clear').addClass('fc-red-500'));
exports.failedActionIcon = failedActionIcon;
const reportedIcon = () => iconWrapper.clone().append((0, exports.getStacksSvg)('Flag').addClass('fc-red-500'));
exports.reportedIcon = reportedIcon;
exports.popupWrapper = $('<div>').addClass('af-snackbar fc-white fs-body3 ta-center z-modal ps-fixed l50');
exports.advancedFlaggingLink = $('<button>').attr('type', 'button').addClass('s-btn s-btn__link').text('Advanced Flagging');
exports.popoverArrow = $('<div>').addClass('s-popover--arrow s-popover--arrow__tc');
exports.dropdown = $('<div>').addClass('advanced-flagging-dialog s-popover s-anchors s-anchors__default mt2 c-default');
exports.actionsMenu = $('<ul>').addClass('s-menu mxn12 myn8').attr('role', 'menu');
exports.dropdownItem = $('<li>').attr('role', 'menuitem');
exports.reportLink = $('<a>').addClass('s-block-link py4');
exports.categoryDivider = $('<li>').addClass('s-menu--divider').attr('role', 'separator');
const getOptionCheckbox = (elId) => $(`<input type="checkbox" name="${elId}" id="${elId}" class="s-checkbox">`);
const getOptionLabel = (elId, text) => $(`<label for="${elId}" class="ml6 va-middle c-pointer">${text}</label>`);
const getPopoverOption = (itemId, checked, text) => exports.dropdownItem.clone().addClass('pl6')
    .append(getOptionCheckbox(itemId).prop('checked', checked), getOptionLabel(itemId, text));
exports.getPopoverOption = getPopoverOption;
exports.configurationDiv = $('<div>').addClass('advanced-flagging-configuration-div ta-left pt6');
exports.configurationLink = $('<a>').attr('id', 'af-modal-button').text('AdvancedFlagging configuration');
exports.commentsDiv = exports.configurationDiv.clone().removeClass('advanced-flagging-configuration-div').addClass('af-comments-div');
exports.commentsLink = exports.configurationLink.clone().attr('id', 'af-comments-button').text('AdvancedFlagging: edit comments and flags');
exports.configurationModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
    <div class="s-modal--dialog s-modal__full w60 sm:w100 md:w75 lg:w75" role="document">
        <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>
        <div class="s-modal--body fs-body2" id="af-modal-description"></div>
        <div class="grid gs8 gsx s-modal--footer">
            <button class="flex--item s-btn s-btn__primary" type="button">Save changes</button>
            <button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>
            <button class="flex--item s-btn s-btn__danger af-configuration-reset" type="button">Reset</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
    </div>
</aside>`);
const metasmokeTokenPopup = $(`
<aside class="s-modal" id="af-ms-token" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
    <div class="s-modal--dialog s-modal__full sm:w100 md:w100" role="document">
        <h1 class="s-modal--header fw-bold " id="af-modal-title">Authenticate MS with AF</h1>
        <div class="s-modal--body fs-body2" id="af-modal-description">
            <div class="grid gs4 gsy fd-column">
                <div class="flex--item">
                    <label class="s-label" for="example-item1">
                        Metasmoke access token
                        <p class="s-description mt2">
                            Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:
                        </p>
                    </label>
                </div>
                <div class="grid ps-relative">
                    <input class="s-input" type="text" id="advanced-flagging-ms-token" placeholder="Enter the code here">
                </div>
            </div>
        </div>
        <div class="grid gs8 gsx s-modal--footer">
            <button class="flex--item s-btn s-btn__primary" id="advanced-flagging-save-ms-token" type="button">Submit</button>
            <button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
    </div>
</aside>`);
exports.editCommentsPopup = $(`
<aside class="s-modal" id="af-comments" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
    <div class="s-modal--dialog s-modal__full md:w100 sm:w100 w80" role="document">
        <h1 class="s-modal--header fw-body" id="af-comments-title">AdvancedFlagging: edit comments and flags</h1>
        <div class="s-modal--body fs-body2" id="af-comments-description">
            <div class="grid fd-column gs16"></div>
        </div>
        <div class="grid gs8 gsx s-modal--footer">
            <button class="flex--item s-btn s-btn__primary" type="button" data-action="s-modal#hide">I'm done!</button>
            <button class="flex--item s-btn" type="button" data-action="s-modal#hide">Cancel</button>
            <button class="flex--item s-btn s-btn__danger af-comments-reset" type="button">Reset</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
    </div>
</aside>`);
function showMSTokenPopupAndGet() {
    return new Promise(resolve => {
        StackExchange.helpers.showModal(metasmokeTokenPopup);
        $('#advanced-flagging-save-ms-token').on('click', () => {
            const token = $('#advanced-flagging-ms-token').val();
            $('#af-ms-token').remove();
            if (!token)
                return;
            resolve(token.toString());
        });
    });
}
exports.showMSTokenPopupAndGet = showMSTokenPopupAndGet;
async function Delay(milliseconds) {
    return await new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.Delay = Delay;
async function showConfirmModal(title, bodyHtml) {
    return await StackExchange.helpers.showConfirmModal({
        title: title,
        bodyHtml: bodyHtml,
        buttonLabel: 'Authenticate!'
    });
}
exports.showConfirmModal = showConfirmModal;
let initialized = false;
const callbacks = [];
function addXHRListener(callback) {
    callbacks.push(callback);
    if (initialized)
        return;
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);
        open.apply(this, arguments);
    };
    initialized = true;
}
exports.addXHRListener = addXHRListener;
exports.cachedConfiguration = GreaseMonkeyCache_1.GreaseMonkeyCache.getFromCache(exports.ConfigurationCacheKey) || {};
const updateConfiguration = () => GreaseMonkeyCache_1.GreaseMonkeyCache.storeInCache(exports.ConfigurationCacheKey, exports.cachedConfiguration);
exports.updateConfiguration = updateConfiguration;
exports.cachedFlagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.getFromCache(exports.FlagTypesKey) || [];
const updateFlagTypes = () => GreaseMonkeyCache_1.GreaseMonkeyCache.storeInCache(exports.FlagTypesKey, exports.cachedFlagTypes);
exports.updateFlagTypes = updateFlagTypes;
exports.cachedCategories = GreaseMonkeyCache_1.GreaseMonkeyCache.getFromCache(exports.FlagCategoriesKey) || [];
function getFullComment(flagId, { authorReputation, authorName }) {
    const shouldAddAuthorName = exports.cachedConfiguration.AddAuthorName;
    const flagType = getFlagTypeFromFlagId(flagId);
    const comment = (flagType === null || flagType === void 0 ? void 0 : flagType.Comments[authorReputation > 50 ? 'High' : 'Low']) || (flagType === null || flagType === void 0 ? void 0 : flagType.Comments.Low);
    return (comment && shouldAddAuthorName ? `${authorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || null;
}
exports.getFullComment = getFullComment;
function getFullFlag(flagId, target, postId) {
    const flagType = getFlagTypeFromFlagId(flagId);
    const flagContent = flagType === null || flagType === void 0 ? void 0 : flagType.FlagText;
    if (!flagContent)
        return '';
    return flagContent.replace(placeholderTarget, target).replace(placeholderCopypastorLink, getCopypastorLink(postId));
}
exports.getFullFlag = getFullFlag;
function getFlagTypeFromFlagId(flagId) {
    return exports.cachedFlagTypes.find(flagType => flagType.Id === flagId) || null;
}
exports.getFlagTypeFromFlagId = getFlagTypeFromFlagId;
function getHumanFromDisplayName(displayName) {
    switch (displayName) {
        case 'AnswerNotAnAnswer': return 'as NAA';
        case 'PostOffensive': return 'as R/A';
        case 'PostSpam': return 'as spam';
        case 'PostOther': return 'for moderator attention';
        case 'PostLowQuality': return 'as VLQ';
        case 'NoFlag':
        default: return '';
    }
}
exports.getHumanFromDisplayName = getHumanFromDisplayName;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GreaseMonkeyCache = void 0;
class GreaseMonkeyCache {
    static async getAndCache(cacheKey, getterPromise, expiresAt) {
        const cachedItem = GreaseMonkeyCache.getFromCache(cacheKey);
        if (cachedItem)
            return cachedItem;
        const result = await getterPromise();
        GreaseMonkeyCache.storeInCache(cacheKey, result, expiresAt);
        return result;
    }
    static getFromCache(cacheKey) {
        const cachedItem = GM_getValue(cacheKey);
        const isItemExpired = typeof cachedItem === 'object' && 'Data' in cachedItem && new Date(cachedItem.Expires) < new Date();
        if (!cachedItem || isItemExpired)
            return null;
        return typeof cachedItem === 'object' && 'Data' in cachedItem ? cachedItem.Data : cachedItem;
    }
    static storeInCache(cacheKey, item, expiresAt) {
        const jsonObject = expiresAt ? { Expires: expiresAt, Data: item } : item;
        GM_setValue(cacheKey, jsonObject);
    }
    static unset(cacheKey) {
        GM_deleteValue(cacheKey);
    }
}
exports.GreaseMonkeyCache = GreaseMonkeyCache;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NattyAPI = void 0;
const ChatApi_1 = __webpack_require__(5);
const GlobalVars_1 = __webpack_require__(2);
const sotools_1 = __webpack_require__(1);
class NattyAPI {
    constructor(answerId, questionDate, answerDate) {
        this.chat = new ChatApi_1.ChatApi();
        this.name = 'Natty';
        this.answerId = answerId;
        this.questionDate = questionDate;
        this.answerDate = answerDate;
        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
    }
    static getAllNattyIds() {
        const postIds = (0, sotools_1.getAllPostIds)(false, false).join(',');
        if (!GlobalVars_1.isStackOverflow || !postIds)
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${GlobalVars_1.nattyFeedbackUrl}${postIds}`,
                onload: (response) => {
                    if (response.status !== 200)
                        reject();
                    const result = JSON.parse(response.responseText);
                    this.nattyIds = result.items.map(item => Number(item.name));
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }
    wasReported() {
        return NattyAPI.nattyIds.includes(this.answerId);
    }
    canBeReported() {
        const answerAge = this.getDaysBetween(this.answerDate, new Date());
        const daysPostedAfterQuestion = this.getDaysBetween(this.questionDate, this.answerDate);
        const isDeleted = (0, GlobalVars_1.isPostDeleted)(this.answerId);
        return this.answerDate > this.questionDate && answerAge < 30 && daysPostedAfterQuestion > 30 && !isDeleted;
    }
    async reportNaa(feedback) {
        if (!this.canBeReported() || feedback !== 'tp')
            return '';
        await this.chat.sendMessage(this.reportMessage, this.name);
        return GlobalVars_1.nattyReportedMessage;
    }
    getDaysBetween(questionDate, answerDate) {
        return (answerDate.valueOf() - questionDate.valueOf()) / GlobalVars_1.dayMillis;
    }
    async sendFeedback(feedback) {
        return this.wasReported()
            ? await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`, this.name)
            : await this.reportNaa(feedback);
    }
}
exports.NattyAPI = NattyAPI;
NattyAPI.nattyIds = [];


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChatApi = void 0;
const GreaseMonkeyCache_1 = __webpack_require__(3);
const GlobalVars_1 = __webpack_require__(2);
class ChatApi {
    constructor(chatUrl = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = chatUrl;
    }
    static getExpiryDate() {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return expiryDate;
    }
    getChannelFKey(roomId) {
        const expiryDate = ChatApi.getExpiryDate();
        return GreaseMonkeyCache_1.GreaseMonkeyCache.getAndCache(GlobalVars_1.CacheChatApiFkey, async () => {
            try {
                const channelPage = await this.getChannelPage(roomId);
                const fkeyElement = $(channelPage).filter('#fkey');
                const fkey = fkeyElement.val();
                return (fkey === null || fkey === void 0 ? void 0 : fkey.toString()) || '';
            }
            catch (error) {
                console.error(error);
                throw new Error('Failed to get chat fkey');
            }
        }, expiryDate);
    }
    getChatUserId() {
        return StackExchange.options.user.userId;
    }
    async sendMessage(message, bot, roomId = GlobalVars_1.soboticsRoomId) {
        const makeRequest = async () => await this.sendRequestToChat(message, roomId);
        let numTries = 0;
        const onFailure = async () => {
            numTries++;
            if (numTries < 3) {
                GreaseMonkeyCache_1.GreaseMonkeyCache.unset(GlobalVars_1.CacheChatApiFkey);
                if (!await makeRequest())
                    return onFailure();
            }
            else {
                throw new Error(GlobalVars_1.chatFailureMessage);
            }
            return (0, GlobalVars_1.getSentMessage)(true, message.split(' ').pop() || '', bot);
        };
        if (!await makeRequest())
            return onFailure();
        return (0, GlobalVars_1.getSentMessage)(true, message.split(' ').pop() || '', bot);
    }
    async sendRequestToChat(message, roomId) {
        const fkey = await this.getChannelFKey(roomId);
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                onload: (chatResponse) => resolve(chatResponse.status === 200),
                onerror: () => resolve(false),
            });
        });
    }
    getChannelPage(roomId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.chatRoomUrl}/rooms/${roomId}`,
                onload: (response) => {
                    response.status === 200 ? resolve(response.responseText) : reject();
                },
                onerror: () => reject()
            });
        });
    }
}
exports.ChatApi = ChatApi;


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GenericBotAPI = void 0;
const GlobalVars_1 = __webpack_require__(2);
class GenericBotAPI {
    constructor(answerId) {
        this.name = 'Generic Bot';
        this.answerId = answerId;
    }
    computeContentHash(postContent) {
        if (!postContent)
            return 0;
        let hash = 0;
        for (let i = 0; i < postContent.length; ++i) {
            hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
            hash = hash & hash;
        }
        return hash;
    }
    sendFeedback(trackPost) {
        return new Promise((resolve, reject) => {
            const flaggerName = encodeURIComponent(GlobalVars_1.username || '');
            if (!trackPost || !GlobalVars_1.isStackOverflow || !flaggerName)
                return resolve('');
            const contentHash = this.computeContentHash($(`#answer-${this.answerId} .js-post-body`).html().trim());
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://so.floern.com/api/trackpost.php',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: `key=${GlobalVars_1.genericBotKey}&postId=${this.answerId}&contentHash=${contentHash}&flagger=${flaggerName}`,
                onload: (response) => {
                    if (response.status !== 200) {
                        console.error('Failed to send track request.', response);
                        reject(GlobalVars_1.genericBotFailure);
                    }
                    resolve(GlobalVars_1.genericBotSuccess);
                },
                onerror: () => reject(GlobalVars_1.genericBotFailure)
            });
        });
    }
}
exports.GenericBotAPI = GenericBotAPI;


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetaSmokeAPI = void 0;
const GreaseMonkeyCache_1 = __webpack_require__(3);
const globals = __webpack_require__(2);
const sotools_1 = __webpack_require__(1);
class MetaSmokeAPI {
    constructor(postId, postType) {
        this.name = 'Smokey';
        this.postId = postId;
        this.postType = postType;
    }
    static reset() {
        GreaseMonkeyCache_1.GreaseMonkeyCache.unset(globals.MetaSmokeDisabledConfig);
        GreaseMonkeyCache_1.GreaseMonkeyCache.unset(globals.MetaSmokeUserKeyConfig);
    }
    static async setup() {
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey();
    }
    static async queryMetaSmokeInternal() {
        if (MetaSmokeAPI.isDisabled)
            return;
        const urlString = (0, sotools_1.getAllPostIds)(true, true).join(',');
        if (!urlString)
            return;
        const parameters = globals.getParamsFromObject({
            urls: urlString,
            key: `${MetaSmokeAPI.appKey}`,
            per_page: 1000,
            filter: globals.metasmokeApiFilter
        });
        try {
            const metasmokeApiCall = await fetch(`https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls?${parameters}`);
            const metasmokeResult = await metasmokeApiCall.json();
            metasmokeResult.items.forEach(item => {
                var _b;
                const postId = Number((_b = /\d+$/.exec(item.link)) === null || _b === void 0 ? void 0 : _b[0]);
                if (!postId)
                    return;
                MetaSmokeAPI.metasmokeIds[postId] = item.id;
            });
        }
        catch (error) {
            globals.displayError('Failed to get Metasmoke URLs.');
            console.error(error);
        }
    }
    static getQueryUrl(postId, postType) {
        return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
    }
    static async getUserKey() {
        while (typeof StackExchange.helpers.showConfirmModal === 'undefined') {
            await globals.Delay(100);
        }
        return await GreaseMonkeyCache_1.GreaseMonkeyCache.getAndCache(globals.MetaSmokeUserKeyConfig, async () => {
            const keyUrl = `https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`;
            const code = await MetaSmokeAPI.codeGetter(keyUrl);
            if (!code)
                return '';
            const tokenCall = await fetch(`https://metasmoke.erwaysoftware.com/oauth/token?key=${MetaSmokeAPI.appKey}&code=${code}`);
            const data = await tokenCall.json();
            return data.token;
        });
    }
    getSmokeyId() {
        return MetaSmokeAPI.metasmokeIds[this.postId] || 0;
    }
    async reportRedFlag() {
        const smokeyId = this.getSmokeyId();
        const urlString = MetaSmokeAPI.getQueryUrl(this.postId, this.postType);
        const reportRequest = await fetch('https://metasmoke.erwaysoftware.com/api/w/post/report', {
            method: 'POST',
            body: globals.getFormDataFromObject({ post_link: urlString, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
        });
        const requestResponse = await reportRequest.text();
        if (!reportRequest.ok || requestResponse !== 'OK') {
            console.error(`Failed to report post to Smokey (postId: ${smokeyId})`, requestResponse);
            throw new Error(globals.metasmokeFailureMessage);
        }
        return globals.metasmokeReportedMessage;
    }
    async sendFeedback(feedback) {
        const smokeyId = this.getSmokeyId();
        const isPostDeleted = globals.isPostDeleted(this.postId);
        if (!smokeyId && feedback === 'tpu-' && !isPostDeleted)
            return await this.reportRedFlag();
        else if (!MetaSmokeAPI.accessToken || !smokeyId)
            return '';
        const feedbackRequest = await fetch(`https://metasmoke.erwaysoftware.com/api/w/post/${smokeyId}/feedback`, {
            method: 'POST',
            body: globals.getFormDataFromObject({ type: feedback, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
        });
        const feedbackResponse = await feedbackRequest.json();
        if (!feedbackRequest.ok) {
            console.error(`Failed to send feedback to Smokey (postId: ${smokeyId})`, feedbackResponse);
            throw new Error(globals.getSentMessage(false, feedback, this.name));
        }
        return globals.getSentMessage(true, feedback, this.name);
    }
}
exports.MetaSmokeAPI = MetaSmokeAPI;
_a = MetaSmokeAPI;
MetaSmokeAPI.appKey = globals.metasmokeKey;
MetaSmokeAPI.metasmokeIds = {};
MetaSmokeAPI.isDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.getFromCache(globals.MetaSmokeDisabledConfig) || false;
MetaSmokeAPI.codeGetter = async (metaSmokeOAuthUrl) => {
    if (MetaSmokeAPI.isDisabled)
        return;
    const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
    if (!userDisableMetasmoke) {
        GreaseMonkeyCache_1.GreaseMonkeyCache.storeInCache(globals.MetaSmokeDisabledConfig, true);
        return;
    }
    window.open(metaSmokeOAuthUrl, '_blank');
    await globals.Delay(100);
    return await globals.showMSTokenPopupAndGet();
};


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CopyPastorAPI = void 0;
const ChatApi_1 = __webpack_require__(5);
const GlobalVars_1 = __webpack_require__(2);
const sotools_1 = __webpack_require__(1);
class CopyPastorAPI {
    constructor(id) {
        var _a, _b, _c;
        this.name = 'Guttenberg';
        this.answerId = id;
        this.copypastorId = ((_a = CopyPastorAPI.copypastorIds[this.answerId]) === null || _a === void 0 ? void 0 : _a.copypastorId) || 0;
        this.repost = ((_b = CopyPastorAPI.copypastorIds[this.answerId]) === null || _b === void 0 ? void 0 : _b.repost) || false;
        this.targetUrl = ((_c = CopyPastorAPI.copypastorIds[this.answerId]) === null || _c === void 0 ? void 0 : _c.target_url) || '';
    }
    static async getAllCopyPastorIds() {
        if (!GlobalVars_1.isStackOverflow)
            return;
        const postUrls = (0, sotools_1.getAllPostIds)(false, true);
        if (!postUrls.length)
            return;
        await this.storeReportedPosts(postUrls);
    }
    static storeReportedPosts(postUrls) {
        const url = `${GlobalVars_1.copypastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: (response) => {
                    const responseObject = JSON.parse(response.responseText);
                    if (responseObject.status === 'failure')
                        return;
                    responseObject.posts.forEach(item => {
                        var _a;
                        const sitePostId = Number((_a = /\d+/.exec(item.target_url)) === null || _a === void 0 ? void 0 : _a[0]);
                        this.copypastorIds[sitePostId] = {
                            copypastorId: Number(item.post_id),
                            repost: item.repost,
                            target_url: item.target_url
                        };
                    });
                    resolve();
                },
                onerror: () => reject()
            });
        });
    }
    sendFeedback(feedback) {
        const chatId = new ChatApi_1.ChatApi().getChatUserId();
        if (!this.copypastorId)
            return Promise.resolve('');
        const successMessage = (0, GlobalVars_1.getSentMessage)(true, feedback, this.name);
        const failureMessage = (0, GlobalVars_1.getSentMessage)(false, feedback, this.name);
        const payload = {
            post_id: this.copypastorId,
            feedback_type: feedback,
            username: GlobalVars_1.username,
            link: `https://chat.stackoverflow.com/users/${chatId}`,
            key: GlobalVars_1.copypastorKey,
        };
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${GlobalVars_1.copypastorServer}/feedback/create`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: Object.entries(payload).map(item => item.join('=')).join('&'),
                onload: (response) => {
                    response.status === 200 ? resolve(successMessage) : reject(failureMessage);
                },
                onerror: () => reject(failureMessage)
            });
        });
    }
}
exports.CopyPastorAPI = CopyPastorAPI;
CopyPastorAPI.copypastorIds = {};


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupConfiguration = void 0;
const MetaSmokeAPI_1 = __webpack_require__(7);
const FlagTypes_1 = __webpack_require__(10);
const GreaseMonkeyCache_1 = __webpack_require__(3);
const globals = __webpack_require__(2);
const flagTypes = FlagTypes_1.flagCategories.flatMap(category => category.FlagTypes);
const flagNames = [...new Set(flagTypes.map(flagType => flagType.DefaultReportType))];
const getOption = (flagName, currentName) => `<option${flagName === currentName ? ' selected' : ''} value=${flagName}>
      ${globals.getHumanFromDisplayName(flagName) || '(none)'}
    </option>`;
const getFlagOptions = (currentName) => flagNames.map(flagName => getOption(flagName, currentName)).join('');
function cacheFlags() {
    const flagTypesToCache = FlagTypes_1.flagCategories.flatMap(category => {
        return category.FlagTypes.map(flagType => {
            return {
                Id: flagType.Id,
                DisplayName: flagType.DisplayName,
                FlagText: flagType.DefaultFlagText || '',
                Comments: {
                    Low: flagType.DefaultComment || '',
                    High: flagType.DefaultCommentHigh || ''
                },
                ReportType: flagType.DefaultReportType,
                Feedbacks: flagType.DefaultFeedbacks,
                BelongsTo: category.Name,
                IsDefault: true,
                Enabled: true
            };
        });
    });
    GreaseMonkeyCache_1.GreaseMonkeyCache.storeInCache(globals.FlagTypesKey, flagTypesToCache);
    globals.cachedFlagTypes.push(...flagTypesToCache);
}
function cacheCategories() {
    const categoriesInfoToCache = FlagTypes_1.flagCategories.map(category => ({
        IsDangerous: category.IsDangerous,
        Name: category.Name,
        AppliesTo: category.AppliesTo
    }));
    GreaseMonkeyCache_1.GreaseMonkeyCache.storeInCache(globals.FlagCategoriesKey, categoriesInfoToCache);
    globals.cachedCategories.push(...categoriesInfoToCache);
}
function setupConfiguration() {
    setupDefaults();
    buildConfigurationOverlay();
    setupCommentsAndFlagsModal();
    const bottomBox = $('.site-footer--copyright').children('.-list');
    const configurationDiv = globals.configurationDiv.clone(), commentsDiv = globals.commentsDiv.clone();
    const configurationLink = globals.configurationLink.clone(), commentsLink = globals.commentsLink.clone();
    $(document).on('click', '#af-modal-button', () => Stacks.showModal(document.querySelector('#af-config')));
    $(document).on('click', '#af-comments-button', () => Stacks.showModal(document.querySelector('#af-comments')));
    commentsDiv.append(commentsLink).insertAfter(bottomBox);
    configurationDiv.append(configurationLink).insertAfter(bottomBox);
    if (!Object.prototype.hasOwnProperty.call(globals.cachedConfiguration, globals.ConfigurationAddAuthorName)) {
        globals.displayStacksToast('Please set up AdvancedFlagging before continuing.', 'info');
        StackExchange.helpers.showModal(document.querySelector('#af-config'));
    }
}
exports.setupConfiguration = setupConfiguration;
function setupDefaults() {
    if (!globals.cachedFlagTypes.length || !globals.cachedFlagTypes[0].Feedbacks)
        cacheFlags();
    if (!globals.cachedCategories.length)
        cacheCategories();
}
function buildConfigurationOverlay() {
    const overlayModal = globals.configurationModal.clone();
    overlayModal.find('.s-modal--close').append(globals.getStacksSvg('Clear'));
    $('body').append(overlayModal);
    overlayModal.find('#af-modal-description').append(getGeneralConfigItems(), $('<hr>').addClass('my16'), getAdminConfigItems());
    overlayModal.find('.s-btn__primary').on('click', event => {
        event.preventDefault();
        $('.af-section-general').find('input').each((_index, el) => {
            const optionId = $(el).parents().eq(2).attr('data-option-id');
            globals.cachedConfiguration[optionId] = Boolean($(el).prop('checked'));
        });
        globals.updateConfiguration();
        globals.displayStacksToast('Configuration saved', 'success');
        setTimeout(() => window.location.reload(), 500);
    });
    overlayModal.find('.af-configuration-reset').on('click', () => {
        GreaseMonkeyCache_1.GreaseMonkeyCache.unset(globals.ConfigurationCacheKey);
        globals.displayStacksToast('Configuration settings have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    });
    const resetConfigurationText = 'Reset configuration values to defaults. You will be asked to set them again.';
    globals.attachPopover($('.af-configuration-reset')[0], resetConfigurationText, 'right');
}
function getGeneralConfigItems() {
    const sectionWrapper = globals.getSectionWrapper('General');
    [
        {
            text: 'Open dropdown on hover',
            configValue: globals.ConfigurationOpenOnHover,
            tooltipText: 'Open the dropdown on hover and not on click'
        }, {
            text: 'Watch for manual flags',
            configValue: globals.ConfigurationWatchFlags,
            tooltipText: 'Send feedback when you raise a flag manually'
        }, {
            text: 'Watch for queue responses',
            configValue: globals.ConfigurationWatchQueues,
            tooltipText: 'Send feedback after choosing Looks OK or Recommend Deletion in the Low Quality Posts queue'
        }, {
            text: 'Disable AdvancedFlagging link',
            configValue: globals.ConfigurationLinkDisabled
        }, {
            text: 'Uncheck \'Leave comment\' by default',
            configValue: globals.ConfigurationDefaultNoComment
        }, {
            text: 'Uncheck \'Flag\' by default',
            configValue: globals.ConfigurationDefaultNoFlag
        }, {
            text: 'Uncheck \'Downvote\' by default',
            configValue: globals.ConfigurationDefaultNoDownvote
        }, {
            text: 'Add author\'s name before comments',
            configValue: globals.ConfigurationAddAuthorName,
            tooltipText: 'Add the author\'s name before every comment to make them friendlier'
        }
    ].map(item => {
        const storedValue = globals.cachedConfiguration[item.configValue];
        const configCheckbox = createCheckbox(item.text, Boolean(storedValue)).attr('data-option-id', item.configValue);
        if (item.tooltipText)
            globals.attachPopover(configCheckbox.find('label')[0], item.tooltipText, 'right');
        return configCheckbox;
    }).forEach(element => sectionWrapper.append(element));
    return sectionWrapper;
}
function getAdminConfigItems() {
    const sectionWrapper = globals.getSectionWrapper('Admin');
    const [clearMetasmokeInfo, clearFkey] = [
        $('<a>').text('Clear metasmoke configuration').on('click', () => {
            MetaSmokeAPI_1.MetaSmokeAPI.reset();
            globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
        }),
        $('<a>').text('Clear chat fkey').on('click', () => {
            GreaseMonkeyCache_1.GreaseMonkeyCache.unset(globals.CacheChatApiFkey);
            globals.displayStacksToast('Successfully cleared chat fkey.', 'success');
        })
    ].map(item => item.wrap(globals.gridCellDiv.clone()).parent());
    [clearMetasmokeInfo, clearFkey].forEach(element => sectionWrapper.append(element));
    const chatFkey = GreaseMonkeyCache_1.GreaseMonkeyCache.getFromCache(globals.CacheChatApiFkey);
    const msAccessTokenText = MetaSmokeAPI_1.MetaSmokeAPI.accessToken
        ? `token: ${MetaSmokeAPI_1.MetaSmokeAPI.accessToken.substring(0, 32)}...`
        : 'access token is not stored in cache';
    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = 'This will clear the chat fkey. It will be regenerated the next time feedback is sent to Natty '
        + `(${chatFkey ? `fkey: ${chatFkey}` : 'fkey is not stored in cache'})`;
    globals.attachPopover(clearMetasmokeInfo.find('a')[0], metasmokeTooltip, 'right');
    globals.attachPopover(clearFkey.find('a')[0], fkeyClearTooltip, 'right');
    return sectionWrapper;
}
function createCheckbox(text, checkCheckbox) {
    const optionId = text.toLowerCase().replace(/\s/g, '_');
    const configHtml = $(`
<div>
  <div class="grid gs4">
    <div class="flex--item"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="flex--item s-label fw-normal pt2" for="${optionId}">${text}</label>
  </div>
</div>`);
    if (checkCheckbox)
        configHtml.find('input').prop('checked', true);
    return configHtml;
}
function getFeedbackRadio(botName, feedback, isChecked, flagId) {
    const radioId = `af-${botName.replace(/\s/g, '-')}-${flagId}-feedback-${feedback || 'none'}`;
    const radioName = `af-${flagId}-feedback-to-${botName.replace(/\s/g, '-')}`;
    return `
<div class="flex--item">
    <div class="grid gs8 gsx">
        <div class="flex--item">
            <input class="s-radio" data-feedback="${feedback}" type="radio"${isChecked ? ' checked' : ''}
                   name="${radioName}" id="${radioId}"/>
        </div>
        <label class="flex--item s-label fw-normal" for="${radioId}">${feedback || globals.noneString.replace('o50', '')}</label>
    </div>
</div>`;
}
function getRadiosForBot(botName, currentFeedback, flagId) {
    const feedbacks = globals.possibleFeedbacks[botName];
    const botFeedbacks = feedbacks
        .map(feedback => getFeedbackRadio(botName, feedback, feedback === currentFeedback, flagId))
        .join('\n');
    return `<div class="grid gs16"><div class="flex--item fs-body2">Feedback to ${botName}:</div>${botFeedbacks}</div>`;
}
function createFlagTypeDiv(flagType) {
    const expandableId = `advanced-flagging-${flagType.Id}-${flagType.DisplayName}`.toLowerCase().replace(/\s/g, '');
    const isDisabled = flagType.ReportType === 'PostOther';
    const feedbackRadios = Object.keys(globals.possibleFeedbacks).map(item => {
        const botName = item;
        return getRadiosForBot(botName, flagType.Feedbacks[botName], flagType.Id);
    }).join('\n');
    const isFlagEnabled = flagType.Enabled;
    const categoryDiv = $(`
<div class="s-card${isFlagEnabled ? '' : ' s-card__muted'} bs-sm py4" data-flag-id=${flagType.Id}>
    <div class="grid ai-center sm:fd-column sm:ai-start">
        <h3 class="mb0 mr-auto fs-body3">${flagType.DisplayName}</h3>
        <div class="grid gs8">
            <button class="flex--item s-btn s-btn__primary af-submit-content" type="button" style="display: none">Save</button>
            <button class="flex--item s-btn s-btn__icon af-expandable-trigger"
                    data-controller="s-expandable-control" aria-controls="${expandableId}" type="button">Edit</button>
            <button class="flex--item s-btn s-btn__danger s-btn__icon af-remove-expandable">Remove</button>
            <div class="flex--item s-toggle-switch pt6">
                <input class="advanced-flagging-flag-enabled" type="checkbox"${isFlagEnabled ? ' checked' : ''}>
                <div class="s-toggle-switch--indicator"></div>
            </div>
        </div>
    </div>
    <div class="s-expandable" id="${expandableId}">
        <div class="s-expandable--content">
            <div class="advanced-flagging-flag-option grid ai-center gsx gs6">
                <label class="fw-bold ps-relative z-selected l12 fs-body1 flex--item">Flag:</label>
                <div class="s-select r32 flex--item">
                    <select class="pl48" ${isDisabled ? 'disabled' : ''}>${getFlagOptions(flagType.ReportType)}</select>
                </div>
                <div class="grid gsx gs4 ai-center flex--item">
                    <div class="flex--item pb2 d-inline-block">
                        <input class="s-checkbox" type="checkbox">
                    </div>
                    <label class="flex--item s-label fw-normal">Send feedback from this flag type when this flag is raised</label>
                </div>
            </div>
            <div class="advanced-flagging-feedbacks-radios py8 ml2">${feedbackRadios}</div>
        </div>
    </div>
</div>`);
    categoryDiv.find('.af-remove-expandable').prepend(globals.getStacksSvg('Trash'), ' ');
    categoryDiv.find('.af-expandable-trigger').prepend(globals.getStacksSvg('Pencil'), ' ');
    return categoryDiv;
}
function createCategoryDiv(displayName) {
    const categoryHeader = $('<h2>').addClass('ta-center mb8 fs-title').html(displayName);
    return $('<div>').addClass(`af-${displayName.toLowerCase().replace(/\s/g, '')}-content flex--item`).append(categoryHeader);
}
function getCharSpan(textareaContent, contentType) {
    const minCharacters = contentType === 'flag' ? 10 : 15, maxCharacters = contentType === 'flag' ? 500 : 600;
    const charCount = textareaContent.length, pluralS = Math.abs(maxCharacters - charCount) !== 1 ? 's' : '';
    let spanText;
    if (charCount === 0)
        spanText = `Enter at least ${minCharacters} characters`;
    else if (charCount < minCharacters)
        spanText = `${minCharacters - charCount} more to go...`;
    else if (charCount > maxCharacters)
        spanText = `Too long by ${charCount - maxCharacters} character${pluralS}`;
    else
        spanText = `${maxCharacters - charCount} character${pluralS} left`;
    const charactersLeft = maxCharacters - charCount;
    let classname;
    if (charCount > maxCharacters)
        classname = 'fc-red-400';
    else if (charactersLeft >= maxCharacters * 3 / 5)
        classname = 'cool';
    else if (charactersLeft >= maxCharacters * 2 / 5)
        classname = 'warm';
    else if (charactersLeft >= maxCharacters / 5)
        classname = 'hot';
    else
        classname = 'supernova';
    const isInvalid = classname === 'fc-red-400' || spanText.includes('more') || spanText.includes('at least');
    const invalidClass = isInvalid ? ' af-invalid-content' : '';
    return `<span class="af-text-counter ml-auto ${classname}${invalidClass}">${spanText}</span>`;
}
function getCommentFlagsDivs(flagId, comments, flagText) {
    const contentWrapper = $('<div>').addClass('advanced-flagging-flag-comments-text grid gsy gs8 fd-column');
    const toggleSwitchId = `advanced-flagging-comments-${flagId}-toggle`;
    const enableSwitch = Boolean(comments.Low);
    const tickCheckbox = Boolean(comments.High);
    const checkboxId = `advanced-flagging-highrep-${flagId}-checkbox`;
    const commentOptions = $(`
<div class="grid gsx gs12 ai-center">
    <label class="flex--item s-label mx0" for="${toggleSwitchId}">Leave comment</label>
    <div class="flex--item s-toggle-switch">
        <input id="${toggleSwitchId}"${enableSwitch ? ' checked' : ''} class="af-toggle-comment" type="checkbox">
        <div class="s-toggle-switch--indicator"></div>
    </div>
    <div class="grid gsx gs4 ai-center${enableSwitch ? '' : ' is-disabled'}">
        (<div class="flex--item pb2">
            <input class="s-checkbox af-toggle-highrep" type="checkbox"${tickCheckbox ? ' checked' : ''}
            ${enableSwitch ? '' : ' disabled'} id="${checkboxId}">
        </div>
    <label class="flex--item s-label fw-normal" for="${checkboxId}">Include comment for high rep users</label>
    </div>
    <span class="ps-relative r8">)</span>
</div>`);
    contentWrapper.append(commentOptions);
    const lowRepLabel = comments.High ? 'LowRep comment' : 'Comment text';
    const flagEl = globals.getTextarea(flagText, 'Flag text', 'flag').append(getCharSpan(flagText, 'flag'));
    const lowRepEl = globals.getTextarea(comments.Low, lowRepLabel, 'lowrep').append(getCharSpan(comments.Low, 'comment'));
    const highRepEl = globals.getTextarea(comments.High, 'HighRep comment', 'highrep').append(getCharSpan(comments.High, 'comment'));
    contentWrapper.append(flagEl, lowRepEl, highRepEl);
    flagEl.add(lowRepEl).add(highRepEl).on('keyup', event => {
        const textarea = $(event.target), textareaContent = textarea.val();
        const contentType = textarea.hasClass('af-flag-content') ? 'flag' : 'comment';
        textarea.next().replaceWith(getCharSpan(textareaContent, contentType));
    });
    return contentWrapper;
}
function setupCommentsAndFlagsModal() {
    const editCommentsPopup = globals.editCommentsPopup.clone();
    editCommentsPopup.find('.s-modal--close').append(globals.getStacksSvg('Clear'));
    const categoryElements = {};
    globals.cachedCategories.forEach(category => categoryElements[category.Name] = createCategoryDiv(category.Name));
    globals.cachedFlagTypes.forEach(flagType => {
        const belongsToCategory = flagType.BelongsTo, comments = flagType.Comments, flagText = flagType.FlagText;
        const flagTypeDiv = createFlagTypeDiv(flagType);
        const expandable = flagTypeDiv.find('.s-expandable--content');
        const flagCategoryWrapper = categoryElements[belongsToCategory];
        expandable.prepend(getCommentFlagsDivs(flagType.Id, comments, flagText));
        flagCategoryWrapper.append(flagTypeDiv);
    });
    Object.values(categoryElements)
        .filter(categoryWrapper => categoryWrapper.children().length > 1)
        .forEach(element => editCommentsPopup.find('.s-modal--body').children().append(element));
    $(document).on('s-expandable-control:hide s-expandable-control:show', event => {
        const editButton = $(event.target), saveButton = editButton.prev(), flagTypeWrapper = editButton.parents('.s-card');
        if (!editButton.length || !saveButton.length || !flagTypeWrapper.length)
            return;
        const pencilSvgHtml = globals.getStacksSvg('Pencil')[0].outerHTML;
        const eyeOffSvgHtml = globals.getStacksSvg('EyeOff')[0].outerHTML;
        const isExpanded = flagTypeWrapper.find('.s-expandable').hasClass('is-expanded');
        editButton.html(isExpanded ? `${eyeOffSvgHtml} Hide` : `${pencilSvgHtml} Edit`);
        isExpanded ? saveButton.fadeIn('fast') : saveButton.fadeOut('fast');
    }).on('click', '.af-submit-content', event => {
        const element = $(event.target), flagTypeWrapper = element.parents('.s-card');
        const expandable = flagTypeWrapper.find('.s-expandable');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id'));
        if (!flagId)
            return globals.displayStacksToast('Failed to save options', 'danger');
        const invalidElement = flagTypeWrapper.find('.af-invalid-content').filter(':visible');
        if (invalidElement.length) {
            invalidElement.fadeOut(100).fadeIn(100);
            globals.displayStacksToast('One or more of the textareas are invalid', 'danger');
            return;
        }
        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType)
            return globals.displayStacksToast('Failed to save options', 'danger');
        const flagElement = expandable.find('.af-flag-content');
        const commentLow = expandable.find('.af-lowrep-content');
        const commentHigh = expandable.find('.af-highrep-content');
        const [flagContent, commentLowRep, commentHighRep] = [flagElement.val(), commentLow.val(), commentHigh.val()];
        const getSelector = (flagId, botName) => `[name^="af-${flagId}-feedback-to-${botName}"]:checked`;
        const botFeedbacks = {
            Smokey: $(getSelector(flagId, 'Smokey')).attr('data-feedback'),
            Natty: $(getSelector(flagId, 'Natty')).attr('data-feedback'),
            Guttenberg: $(getSelector(flagId, 'Guttenberg')).attr('data-feedback'),
            'Generic Bot': $(getSelector(flagId, 'Generic-Bot')).attr('data-feedback'),
        };
        if (flagContent)
            currentFlagType.FlagText = flagElement.is(':visible') ? flagContent : '';
        if (commentLowRep)
            currentFlagType.Comments = {
                Low: commentLow.is(':visible') ? commentLowRep : '',
                High: commentHigh.is(':visible') ? commentHighRep : ''
            };
        currentFlagType.Feedbacks = botFeedbacks;
        globals.updateFlagTypes();
        element.next().trigger('click');
        globals.displayStacksToast('Content saved successfully', 'success');
    }).on('click', '.af-remove-expandable', event => {
        const removeButton = $(event.target), flagTypeWrapper = removeButton.parents('.s-card');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id'));
        const flagTypeIndex = globals.cachedFlagTypes.findIndex(item => item.Id === flagId);
        globals.cachedFlagTypes.splice(flagTypeIndex, 1);
        globals.updateFlagTypes();
        flagTypeWrapper.fadeOut('fast', () => {
            flagTypeWrapper.remove();
            const categoryWrapper = flagTypeWrapper.parent();
            if (categoryWrapper.children().length === 1)
                flagTypeWrapper.fadeOut('fast', () => categoryWrapper.remove());
        });
        globals.displayStacksToast('Successfully removed flag type', 'success');
    }).on('click', '.af-comments-reset', () => {
        GreaseMonkeyCache_1.GreaseMonkeyCache.unset(globals.FlagTypesKey);
        cacheFlags();
        globals.displayStacksToast('Comments and flags have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    }).on('change', '.advanced-flagging-flag-option select', event => {
        const selectElement = $(event.target), flagTypeWrapper = selectElement.parents('.s-card');
        const newReportType = selectElement.val();
        const flagId = Number(flagTypeWrapper.attr('data-flag-id'));
        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType)
            return globals.displayStacksToast('Failed to change the report flag type', 'danger');
        if (newReportType === 'PostOther')
            return globals.displayStacksToast('Flag PostOther cannot be used with this option', 'danger');
        currentFlagType.ReportType = newReportType;
        globals.updateFlagTypes();
        globals.displayStacksToast('Successfully changed the flag type for this option', 'success');
    }).on('change', '.advanced-flagging-flag-enabled', event => {
        const toggleSwitch = $(event.target), flagTypeWrapper = toggleSwitch.parents('.s-card');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id')), currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType)
            return globals.displayStacksToast('Failed to toggle flag type', 'danger');
        const isEnabled = toggleSwitch.is(':checked');
        currentFlagType.Enabled = isEnabled;
        globals.updateFlagTypes();
        isEnabled ? flagTypeWrapper.removeClass('s-card__muted') : flagTypeWrapper.addClass('s-card__muted');
        globals.displayStacksToast(`Successfully ${isEnabled ? 'enabled' : 'disabled'} flag type`, 'success');
    }).on('change', '.af-toggle-comment, .af-toggle-highrep', event => {
        const inputElement = $(event.target), flagTypeWrapper = inputElement.parents('.s-card');
        const lowRepComment = flagTypeWrapper.find('.af-lowrep-content').parent();
        const highRepComment = flagTypeWrapper.find('.af-highrep-content').parent();
        const toggleComment = flagTypeWrapper.find('.af-toggle-comment'), toggleHighRep = flagTypeWrapper.find('.af-toggle-highrep');
        if (toggleComment.is(':checked')) {
            toggleHighRep.parent().parent().removeClass('is-disabled');
            toggleHighRep.prop('disabled', false);
            lowRepComment.fadeIn();
        }
        else {
            toggleHighRep.parent().parent().addClass('is-disabled');
            toggleHighRep.prop('disabled', true);
            lowRepComment.fadeOut(400, () => lowRepComment.hide());
            highRepComment.fadeOut(400, () => highRepComment.hide());
            return;
        }
        if (toggleHighRep.is(':checked')) {
            highRepComment.fadeIn();
            lowRepComment.find('label').text('LowRep comment');
        }
        else {
            highRepComment.fadeOut(400, () => highRepComment.hide());
            lowRepComment.find('label').text('Comment text');
        }
    });
    $('body').append(editCommentsPopup);
}


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.flagCategories = void 0;
const globals = __webpack_require__(2);
exports.flagCategories = [
    {
        IsDangerous: true,
        Name: 'Red flags',
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 1,
                DisplayName: 'Spam',
                DefaultReportType: 'PostSpam',
                DefaultFeedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 2,
                DisplayName: 'Rude or Abusive',
                DefaultReportType: 'PostOffensive',
                DefaultFeedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            }
        ]
    },
    {
        IsDangerous: true,
        Name: 'Guttenberg mod flags',
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 3,
                DisplayName: 'Plagiarism',
                DefaultReportType: 'PostOther',
                DefaultFlagText: 'Possible plagiarism of another answer $TARGET$, as can be seen here $COPYPASTOR$',
                DefaultFeedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' }
            },
            {
                Id: 4,
                DisplayName: 'Duplicate answer',
                DefaultReportType: 'PostOther',
                DefaultFlagText: 'The answer is a repost of their other answer $TARGET$, but as there are slight differences '
                    + '(see $COPYPASTOR$), an auto flag would not be raised.',
                DefaultComment: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227)."
                    + ' Answer the best one and flag the rest as duplicates, once you earn enough reputation. '
                    + 'If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                DefaultFeedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' }
            },
            {
                Id: 5,
                DisplayName: 'Bad attribution',
                DefaultReportType: 'PostOther',
                DefaultFlagText: 'This post is copied from [another answer]($TARGET$), as can be seen here $COPYPASTOR$. The author '
                    + 'only added a link to the other answer, which is [not the proper way of attribution]'
                    + '(//stackoverflow.blog/2009/06/25/attribution-required).',
                DefaultFeedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' }
            }
        ]
    },
    {
        IsDangerous: false,
        Name: 'Answer-related',
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 6,
                DisplayName: 'Link Only',
                DefaultReportType: 'PostLowQuality',
                DefaultComment: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
                    + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
                    + 'have some idea what it is and why it is there, then quote the most relevant part of the page '
                    + 'you are linking to in case the target page is unavailable. '
                    + `[Answers that are little more than a link may be deleted.](${globals.deletedAnswers})`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 7,
                DisplayName: 'Not an answer',
                DefaultReportType: 'AnswerNotAnAnswer',
                DefaultComment: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
                    + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
                    + 'If you have a related but different question, [ask a new question](/questions/ask), and include a '
                    + 'link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
                DefaultCommentHigh: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to '
                    + 'be an explicit attempt to *answer* this question; if you have a critique or need a clarification '
                    + `of the question or another answer, you can [post a comment](${globals.commentHelp}) (like this `
                    + 'one) directly below it. Please remove this answer and create either a comment or a new question. '
                    + 'See: [Ask questions, get answers, no distractions](/tour).',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 8,
                DisplayName: 'Thanks',
                DefaultReportType: 'AnswerNotAnAnswer',
                DefaultComment: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, and '
                    + 'can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) '
                    + `enough [reputation](${globals.reputationHelp}), you will gain privileges to `
                    + `[upvote answers](${globals.voteUpHelp}) you like. This way future visitors of the question `
                    + 'will see a higher vote count on that answer, and the answerer will also be rewarded with '
                    + `reputation points. See [Why is voting important](${globals.whyVote}).`,
                DefaultCommentHigh: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
                    + 'and can be perceived as noise by its future visitors. Instead, '
                    + `[upvote answers](${globals.voteUpHelp}) you like. This way future visitors of the question `
                    + 'will see a higher vote count on that answer, and the answerer will also be rewarded '
                    + `with reputation points. See [Why is voting important](${globals.whyVote}).`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 9,
                DisplayName: 'Me too',
                DefaultReportType: 'AnswerNotAnAnswer',
                DefaultComment: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
                    + 'If you have a different but related question, then [ask](/questions/ask) it (reference this one '
                    + 'if it will help provide context). If you are interested in this specific question, you can '
                    + `[upvote](${globals.voteUpHelp}) it, leave a [comment](${globals.commentHelp}), or start a `
                    + `[bounty](${globals.setBounties}) once you have enough [reputation](${globals.reputationHelp}).`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 10,
                DisplayName: 'Library',
                DefaultReportType: 'PostLowQuality',
                DefaultComment: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
                    + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 11,
                DisplayName: 'Comment',
                DefaultReportType: 'AnswerNotAnAnswer',
                DefaultComment: 'This does not provide an answer to the question. Once you have sufficient '
                    + `[reputation](${globals.reputationHelp}) you will be able to [comment on any post](${globals.commentHelp}); instead, `
                    + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
                DefaultCommentHigh: 'This does not provide an answer to the question. Please write a comment instead.',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 12,
                DisplayName: 'Duplicate',
                DefaultReportType: 'AnswerNotAnAnswer',
                DefaultComment: 'Instead of posting an answer which merely links to another answer, please instead '
                    + `[flag the question](${globals.flagPosts}) as a duplicate.`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 13,
                DisplayName: 'Non English',
                DefaultReportType: 'PostLowQuality',
                DefaultComment: 'Please write your answer in English, as Stack Overflow is an '
                    + '[English-only site](//meta.stackoverflow.com/a/297680).',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            },
            {
                Id: 14,
                DisplayName: 'Should be an edit',
                DefaultReportType: 'AnswerNotAnAnswer',
                DefaultComment: 'Please use the edit link on your question to add additional information. '
                    + 'The "Post Answer" button should be used only for complete answers to the question.',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' }
            }
        ]
    },
    {
        IsDangerous: false,
        Name: 'General',
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 15,
                DisplayName: 'Looks Fine',
                DefaultReportType: 'NoFlag',
                DefaultFeedbacks: { Smokey: 'fp-', Natty: 'fp', Guttenberg: 'fp', 'Generic Bot': '' }
            },
            {
                Id: 16,
                DisplayName: 'Needs Editing',
                DefaultReportType: 'NoFlag',
                DefaultFeedbacks: { Smokey: 'fp-', Natty: 'ne', Guttenberg: 'fp', 'Generic Bot': '' }
            },
            {
                Id: 17,
                DisplayName: 'Vandalism',
                DefaultReportType: 'NoFlag',
                DefaultFeedbacks: { Smokey: 'tp-', Natty: '', Guttenberg: 'fp', 'Generic Bot': '' }
            }
        ]
    }
];


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;