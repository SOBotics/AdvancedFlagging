// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      1.3.7
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
// @exclude      *://*.area51.stackexchange.com/*
// @exclude      *://data.stackexchange.com/*
// @exclude      *://stackoverflow.com/c/*
// @exclude      *://winterbash*.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_listValues
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @run-at       document-body
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1), __webpack_require__(2), __webpack_require__(6), __webpack_require__(8), __webpack_require__(4), __webpack_require__(9), __webpack_require__(10), __webpack_require__(5), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, FlagTypes_1, sotools_1, NattyApi_1, GenericBotAPI_1, MetaSmokeAPI_1, CopyPastorAPI_1, Configuration_1, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.displayToaster = void 0;
    function SetupStyles() {
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
}`);
    }
    const userFkey = StackExchange.options.user.fkey;
    function handleFlagAndComment(postId, flag, flagRequired, copypastorApi, commentText) {
        const result = {};
        if (commentText) {
            result.CommentPromise = new Promise((resolve, reject) => {
                $.ajax({
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
                const copypastorObject = copypastorApi.getCopyPastorObject();
                const flagText = flag.GetCustomFlagText && copypastorObject ? flag.GetCustomFlagText(copypastorObject) : undefined;
                autoFlagging = true;
                $.ajax({
                    url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
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
    let toasterTimeout = null;
    let toasterFadeTimeout = null;
    function hidePopup() {
        popupWrapper.removeClass('show').addClass('hide');
        toasterFadeTimeout = window.setTimeout(() => popupWrapper.empty().addClass('hide'), 1000);
    }
    function displayToaster(message, state) {
        const messageDiv = globals.getMessageDiv(message, state);
        popupWrapper.append(messageDiv);
        popupWrapper.removeClass('hide').addClass('show');
        if (toasterFadeTimeout)
            clearTimeout(toasterFadeTimeout);
        if (toasterTimeout)
            clearTimeout(toasterTimeout);
        toasterTimeout = window.setTimeout(hidePopup, globals.popupDelay);
    }
    exports.displayToaster = displayToaster;
    function displaySuccessFlagged(reportedIcon, reportTypeHuman) {
        const flaggedMessage = `Flagged ${reportTypeHuman}`;
        reportedIcon.attr('title', flaggedMessage);
        globals.showInlineElement(reportedIcon);
        globals.displaySuccess(flaggedMessage);
    }
    function displayErrorFlagged(message, error) {
        globals.displayError(message);
        console.error(error);
    }
    function getStrippedComment(commentText) {
        return commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Match [links](...)
            .replace(/\[([^\]]+)\][^(]*?/g, '$1') // Match [edit]
            .replace(/_([^_]+)_/g, '$1') //  _thanks_ => thanks
            .replace(/\*\*([^*]+)\*\*/g, '$1') // **thanks** => thanks
            .replace(/\*([^*]+)\*/g, '$1') // *thanks* => thanks
            .replace(' - From Review', '');
    }
    function upvoteSameComments(element, strippedCommentText) {
        element.find('.comment-body .comment-copy').each((_index, el) => {
            const element = $(el), text = element.text();
            if (text !== strippedCommentText)
                return;
            element.closest('li').find('a.comment-up.comment-up-off').trigger('click');
        });
    }
    function getErrorMessage(responseJson) {
        let message = 'Failed to flag: ';
        if (responseJson.Message.match('already flagged')) {
            message += 'post already flagged';
        }
        else if (responseJson.Message.match('limit reached')) {
            message += 'post flag limit reached';
        }
        else {
            message += responseJson.Message;
        }
        return message;
    }
    function getPromiseFromFlagName(flagName, reporter) {
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
    function showComments(postId, data) {
        const commentUI = StackExchange.comments.uiForPost($('#comments-' + postId));
        commentUI.addShow(true, false);
        commentUI.showComments(data, null, false, true);
        $(document).trigger('comment', postId);
    }
    function setupNattyApi(postId, nattyIcon) {
        const nattyApi = new NattyApi_1.NattyAPI(postId);
        const isReported = nattyApi.WasReported();
        if (nattyIcon)
            isReported ? globals.showInlineElement(nattyIcon) : nattyIcon.addClass('d-none');
        return {
            name: 'Natty',
            ReportNaa: (answerDate, questionDate) => nattyApi.ReportNaa(answerDate, questionDate),
            ReportRedFlag: () => nattyApi.ReportRedFlag(),
            ReportLooksFine: () => nattyApi.ReportLooksFine(),
            ReportNeedsEditing: () => nattyApi.ReportNeedsEditing(),
            ReportVandalism: () => Promise.resolve(false),
            ReportDuplicateAnswer: () => Promise.resolve(false),
            ReportPlagiarism: () => Promise.resolve(false)
        };
    }
    function setupGenericBotApi(postId) {
        const genericBotAPI = new GenericBotAPI_1.GenericBotAPI(postId);
        return {
            name: 'Generic Bot',
            ReportNaa: () => genericBotAPI.ReportNaa(),
            ReportRedFlag: () => genericBotAPI.ReportRedFlag(),
            ReportLooksFine: () => Promise.resolve(false),
            ReportNeedsEditing: () => Promise.resolve(false),
            ReportVandalism: () => Promise.resolve(true),
            ReportDuplicateAnswer: () => Promise.resolve(false),
            ReportPlagiarism: () => Promise.resolve(false)
        };
    }
    function setupMetasmokeApi(postId, postType, smokeyIcon) {
        const metaSmoke = new MetaSmokeAPI_1.MetaSmokeAPI();
        const isReported = MetaSmokeAPI_1.MetaSmokeAPI.getSmokeyId(postId);
        if (!isReported) {
            smokeyIcon.addClass('d-none');
        }
        else {
            smokeyIcon.click(() => window.open(`https://metasmoke.erwaysoftware.com/post/${isReported}`, '_blank'));
            globals.showInlineElement(smokeyIcon);
        }
        return {
            name: 'Smokey',
            ReportNaa: () => metaSmoke.ReportNaa(postId),
            ReportRedFlag: () => metaSmoke.ReportRedFlag(postId, postType),
            ReportLooksFine: () => metaSmoke.ReportLooksFine(postId),
            ReportNeedsEditing: () => metaSmoke.ReportNeedsEditing(postId),
            ReportVandalism: () => metaSmoke.ReportVandalism(postId),
            ReportDuplicateAnswer: () => Promise.resolve(false),
            ReportPlagiarism: () => Promise.resolve(false)
        };
    }
    function setupGuttenbergApi(copyPastorApi, copyPastorIcon) {
        const copypastorObject = copyPastorApi.getCopyPastorObject();
        if (copypastorObject && copypastorObject.post_id) {
            copyPastorIcon.attr('Title', 'Reported by CopyPastor.');
            globals.showInlineElement(copyPastorIcon);
            copyPastorIcon.click(() => window.open('https://copypastor.sobotics.org/posts/' + copypastorObject.post_id));
        }
        else {
            copyPastorIcon.addClass('d-none');
        }
        return {
            name: 'Guttenberg',
            ReportNaa: () => copyPastorApi.ReportFalsePositive(),
            ReportRedFlag: () => Promise.resolve(false),
            ReportLooksFine: () => copyPastorApi.ReportFalsePositive(),
            ReportNeedsEditing: () => copyPastorApi.ReportFalsePositive(),
            ReportVandalism: () => copyPastorApi.ReportFalsePositive(),
            ReportDuplicateAnswer: () => copyPastorApi.ReportTruePositive(),
            ReportPlagiarism: () => copyPastorApi.ReportTruePositive()
        };
    }
    async function waitForCommentPromise(commentPromise, postId) {
        try {
            const commentPromiseValue = await commentPromise;
            showComments(postId, commentPromiseValue);
        }
        catch (error) {
            globals.displayError('Failed to comment on post');
            console.error(error);
        }
    }
    async function waitForFlagPromise(flagPromise, reportedIcon, reportTypeHuman) {
        try {
            const flagPromiseValue = await flagPromise;
            const responseJson = JSON.parse(JSON.stringify(flagPromiseValue));
            if (responseJson.Success) {
                displaySuccessFlagged(reportedIcon, reportTypeHuman);
            }
            else { // sometimes, although the status is 200, the post isn't flagged.
                const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                const message = getErrorMessage(responseJson);
                displayErrorFlagged(message, fullMessage);
            }
        }
        catch (error) {
            displayErrorFlagged('Failed to flag post', error);
        }
    }
    function getHumanFromDisplayName(displayName) {
        switch (displayName) {
            case 'AnswerNotAnAnswer': return 'as NAA';
            case 'PostOffensive': return 'as R/A';
            case 'PostSpam': return 'as spam';
            case 'NoFlag': return '';
            case 'PostOther': return 'for moderator attention';
            default: return '';
        }
    }
    async function BuildFlaggingDialog(element, postId, postType, reputation, authorName, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi) {
        const enabledFlagIds = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
        const defaultNoComment = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationDefaultNoComment);
        const defaultNoFlag = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationDefaultNoFlag);
        const comments = element.find('.comment-body');
        const dropDown = globals.dropDown.clone();
        const checkboxNameComment = `comment_checkbox_${postId}`;
        const checkboxNameFlag = `flag_checkbox_${postId}`;
        const leaveCommentBox = globals.getOptionBox(checkboxNameComment);
        const flagBox = globals.getOptionBox(checkboxNameFlag);
        flagBox.prop('checked', !defaultNoFlag);
        leaveCommentBox.prop('checked', !defaultNoComment && !comments.length && isStackOverflow);
        let hasCommentOptions = false;
        let firstCategory = true;
        for (const flagCategory of FlagTypes_1.flagCategories) {
            if (flagCategory.AppliesTo.indexOf(postType) === -1)
                continue;
            const divider = globals.getDivider();
            if (!firstCategory)
                dropDown.append(divider);
            const categoryDiv = globals.getCategoryDiv(flagCategory.IsDangerous);
            let activeLinks = flagCategory.FlagTypes.length;
            for (const flagType of flagCategory.FlagTypes) {
                const reportLink = globals.reportLink.clone();
                hasCommentOptions = !!flagType.GetComment;
                const dropdownItem = globals.dropdownItem.clone();
                const disableLink = () => {
                    activeLinks--;
                    globals.hideElement(reportLink);
                    if (!divider || activeLinks > 0)
                        return;
                    globals.hideElement(divider);
                };
                const enableLink = () => {
                    activeLinks++;
                    globals.showElement(reportLink);
                    if (!divider || activeLinks <= 0)
                        return;
                    globals.showElement(divider);
                };
                disableLink();
                if (!enabledFlagIds || enabledFlagIds.indexOf(flagType.Id) > -1) {
                    if (flagType.Enabled) {
                        const copypastorObject = copyPastorApi.getCopyPastorObject();
                        if (copypastorObject && copypastorObject.post_id) {
                            // https://github.com/SOBotics/AdvancedFlagging/issues/16
                            const isRepost = copyPastorApi.getIsRepost();
                            const isEnabled = flagType.Enabled(true, isRepost);
                            if (isEnabled)
                                enableLink();
                        }
                    }
                    else {
                        enableLink();
                    }
                }
                let commentText;
                if (flagType.GetComment) {
                    commentText = flagType.GetComment({ Reputation: reputation, AuthorName: authorName });
                    reportLink.attr('title', commentText);
                }
                reportLink.click(async () => {
                    if (!deleted) {
                        try {
                            if (!leaveCommentBox.is(':checked') && commentText) {
                                const strippedComment = getStrippedComment(commentText);
                                upvoteSameComments(element, strippedComment);
                                commentText = undefined;
                            }
                            const result = handleFlagAndComment(postId, flagType, flagBox.is(':checked'), copyPastorApi, commentText);
                            if (result.CommentPromise)
                                await waitForCommentPromise(result.CommentPromise, postId);
                            if (result.FlagPromise)
                                await waitForFlagPromise(result.FlagPromise, reportedIcon, flagType.Human);
                        }
                        catch (err) {
                            globals.displayError(err);
                        }
                    }
                    const noFlag = flagType.ReportType === 'NoFlag';
                    if (noFlag) {
                        performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                        globals.showElement(performedActionIcon);
                    }
                    handleFlag(flagType, reporters, answerTime, questionTime);
                    globals.hideElement(dropDown);
                });
                reportLink.text(flagType.DisplayName);
                dropdownItem.append(reportLink);
                categoryDiv.append(dropdownItem);
                dropDown.append(categoryDiv);
            }
            firstCategory = false;
        }
        hasCommentOptions = isStackOverflow;
        dropDown.append(globals.getDivider());
        if (hasCommentOptions) {
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
    function handleFlag(flagType, reporters, answerTime, questionTime) {
        const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
        const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
        const customFlag = flagType.ReportType === 'PostOther';
        const noFlag = flagType.ReportType === 'NoFlag';
        reporters.forEach(reporter => {
            let promise = null;
            if (rudeFlag) {
                promise = reporter.ReportRedFlag();
            }
            else if (naaFlag) {
                promise = reporter.ReportNaa(answerTime, questionTime);
            }
            else if (noFlag || customFlag) {
                promise = getPromiseFromFlagName(flagType.DisplayName, reporter);
            }
            if (!promise)
                return;
            promise.then(didReport => {
                if (!didReport)
                    return;
                globals.displaySuccess(`Feedback sent to ${reporter.name}`);
            }).catch(() => {
                globals.displayError(`Failed to send feedback to ${reporter.name}.`);
            });
        });
    }
    let autoFlagging = false;
    function SetupPostPage() {
        sotools_1.parseQuestionsAndAnswers(async (post) => {
            if (!post.element.length)
                return;
            const iconLocation = post.page === 'Question'
                ? post.element.find('.js-post-menu').children().first()
                : post.element.find(`a.${post.element.children().first().hasClass('answer-summary') ? 'question' : 'answer'}-hyperlink`);
            const advancedFlaggingLink = globals.advancedFlaggingLink.clone();
            if (post.page === 'Question')
                iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));
            const nattyIcon = globals.getNattyIcon().click(() => window.open(`//sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank'));
            const copyPastorIcon = globals.getGuttenbergIcon();
            const smokeyIcon = globals.getSmokeyIcon();
            const copyPastorApi = new CopyPastorAPI_1.CopyPastorAPI(post.postId);
            const reporters = [];
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
                const questionTime = post.type === 'Answer' ? post.question.postTime : post.postTime;
                const answerTime = post.postTime;
                const deleted = post.element.hasClass('deleted-answer');
                const isEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationWatchFlags);
                globals.addXHRListener(xhr => {
                    if (!isEnabled || autoFlagging || xhr.status !== 200 || !globals.flagsUrlRegex.exec(xhr.responseURL))
                        return;
                    const matches = globals.getFlagsUrlRegex(post.postId).exec(xhr.responseURL);
                    if (!matches)
                        return;
                    const flagType = {
                        Id: 0,
                        ReportType: matches[1],
                        DisplayName: matches[1],
                        Human: getHumanFromDisplayName(matches[1])
                    };
                    if (!questionTime || !answerTime)
                        return;
                    handleFlag(flagType, reporters, answerTime, questionTime);
                    displaySuccessFlagged(reportedIcon, flagType.Human);
                });
                const linkDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationLinkDisabled);
                if (!linkDisabled && questionTime && answerTime) {
                    const dropDown = await BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation, post.authorName, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi);
                    advancedFlaggingLink.append(dropDown);
                    const openOnHover = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationOpenOnHover);
                    if (openOnHover) {
                        advancedFlaggingLink.hover(event => {
                            event.stopPropagation();
                            if (event.target === advancedFlaggingLink.get(0))
                                globals.showElement(dropDown);
                        });
                        advancedFlaggingLink.mouseleave(e => {
                            e.stopPropagation();
                            setTimeout(() => globals.hideElement(dropDown), 100); // avoid immediate closing of popover
                        });
                    }
                    else {
                        advancedFlaggingLink.click(event => {
                            event.stopPropagation();
                            if (event.target === advancedFlaggingLink.get(0))
                                globals.showElement(dropDown);
                        });
                        $(window).click(() => globals.hideElement(dropDown));
                    }
                }
                iconLocation.append(performedActionIcon);
                iconLocation.append(reportedIcon);
                iconLocation.append(nattyIcon);
                iconLocation.append(copyPastorIcon);
                iconLocation.append(smokeyIcon);
            }
            else {
                iconLocation.after(smokeyIcon);
                iconLocation.after(copyPastorIcon);
                iconLocation.after(nattyIcon);
                iconLocation.after(reportedIcon);
                iconLocation.after(performedActionIcon);
            }
        });
    }
    async function Setup() {
        // Collect all ids
        await Promise.all([
            MetaSmokeAPI_1.MetaSmokeAPI.Setup(globals.metaSmokeKey),
            MetaSmokeAPI_1.MetaSmokeAPI.QueryMetaSmokeInternal(),
            CopyPastorAPI_1.CopyPastorAPI.getAllCopyPastorIds(),
            NattyApi_1.NattyAPI.getAllNattyIds()
        ]);
        SetupPostPage();
        SetupStyles();
        Configuration_1.SetupConfiguration();
        document.body.appendChild(popupWrapper.get(0));
        const watchedQueuesEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationWatchQueues);
        const postDetails = [];
        if (!watchedQueuesEnabled)
            return;
        globals.addXHRListener(xhr => {
            if (xhr.status !== 200)
                return;
            const parseReviewDetails = (review) => {
                const reviewJson = JSON.parse(review);
                const postId = reviewJson.postId;
                const content = $(reviewJson.content);
                const questionTime = sotools_1.parseDate($('.post-signature.owner .user-action-time span', content).attr('title'));
                const answerTime = sotools_1.parseDate($('.user-info .user-action-time span', content).attr('title'));
                if (!questionTime || !answerTime)
                    return;
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
            if (!matches)
                return;
            const postIdStr = matches[1] || matches[2];
            const postId = parseInt(postIdStr, 10);
            const currentPostDetails = postDetails[postId];
            if (!currentPostDetails || !$('.answers-subheader').length)
                return;
            handleFlag({ Id: 0, ReportType: 'AnswerNotAnAnswer', DisplayName: 'AnswerNotAnAnswer' }, [setupNattyApi(postId)], currentPostDetails.answerTime, currentPostDetails.questionTime);
        });
    }
    $(() => {
        let started = false;
        function actionWatcher() {
            if (!started) {
                started = true;
                Setup();
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
        if (document.hasFocus && document.hasFocus())
            actionWatcher();
    });
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 1 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.flagCategories = void 0;
    exports.flagCategories = [
        {
            IsDangerous: true,
            AppliesTo: ['Answer', 'Question'],
            FlagTypes: [
                {
                    Id: 1,
                    DisplayName: 'Spam',
                    ReportType: 'PostSpam',
                    Human: 'as spam'
                },
                {
                    Id: 2,
                    DisplayName: 'Rude or Abusive',
                    ReportType: 'PostOffensive',
                    Human: 'as R/A'
                }
            ]
        },
        {
            IsDangerous: true,
            AppliesTo: ['Answer'],
            FlagTypes: [
                {
                    Id: 3,
                    DisplayName: 'Plagiarism',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (hasDuplicatePostLinks, isRepost) => hasDuplicatePostLinks && !isRepost,
                    GetCustomFlagText: copyPastorItem => `Possible plagiarism of another answer https:${copyPastorItem.target_url}, as can be seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}`
                },
                {
                    Id: 4,
                    DisplayName: 'Duplicate answer',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (hasDuplicatePostLinks, isRepost) => hasDuplicatePostLinks && isRepost,
                    GetComment: () => 'Please don\'t add the [same answer to multiple questions](https://meta.stackexchange.com/questions/104227/is-it-acceptable-to-add-a-duplicate-answer-to-several-questions). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                    GetCustomFlagText: copyPastorItem => `The answer is a repost of their other answer https:${copyPastorItem.target_url}, but as there are slight differences as seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}, an auto flag wouldn't be raised.`
                },
                {
                    Id: 5,
                    DisplayName: 'Bad attribution',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (hasDuplicatePostLinks, isRepost) => hasDuplicatePostLinks && !isRepost,
                    GetCustomFlagText: copyPastorItem => `This post is copied from [another answer](https:${copyPastorItem.target_url}), as can be seen [here](https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}). The author only added a link to the other answer, which is [not the proper way of attribution](https://stackoverflow.blog/2009/06/25/attribution-required/).`
                }
            ]
        },
        {
            IsDangerous: false,
            AppliesTo: ['Answer'],
            FlagTypes: [
                {
                    Id: 6,
                    DisplayName: 'Link Only',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: () => 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
                        '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
                        'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
                        'page you\'re linking to in case the target page is unavailable. ' +
                        '[Answers that are little more than a link may be deleted.](/help/deleted-answers)'
                },
                {
                    Id: 7,
                    DisplayName: 'Not an answer',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: userDetails => userDetails.Reputation < 50
                        ? 'This does not provide an answer to the question. You can [search for similar questions](/search), ' +
                            'or refer to the related and linked questions on the right-hand side of the page to find an answer. ' +
                            'If you have a related but different question, [ask a new question](/questions/ask), ' +
                            'and include a link to this one to help provide context. ' +
                            'See: [Ask questions, get answers, no distractions](/tour)'
                        : 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be ' +
                            'an explicit attempt to *answer* this question; if you have a critique or need a clarification of ' +
                            'the question or another answer, you can [post a comment](/help/privileges/comment) ' +
                            '(like this one) directly below it. Please remove this answer and create either a comment or a new question. ' +
                            'See: [Ask questions, get answers, no distractions](/tour)'
                },
                {
                    Id: 8,
                    DisplayName: 'Thanks',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: userDetails => userDetails.Reputation < 15
                        ? 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                            'and can be perceived as noise by its future visitors. Once you [earn](https://meta.stackoverflow.com/q/146472) ' +
                            'enough [reputation](/help/whats-reputation), you will gain privileges to ' +
                            '[upvote answers](/help/privileges/vote-up) you like. This way future visitors of the question ' +
                            'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                            'See [Why is voting important](/help/why-vote).'
                        :
                            'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                                'and can be perceived as noise by its future visitors. ' +
                                'Instead, [upvote answers](/help/privileges/vote-up) you like. This way future visitors of the question ' +
                                'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                                'See [Why is voting important](/help/why-vote).'
                },
                {
                    Id: 9,
                    DisplayName: 'Me too',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: () => 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
                        'If you have a different but related question, then [ask](/questions/ask) it ' +
                        '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
                        'you can [upvote](/help/privileges/vote-up) it, leave a [comment](/help/privileges/comment), ' +
                        'or start a [bounty](/help/privileges/set-bounties) ' +
                        'once you have enough [reputation](/help/whats-reputation).',
                },
                {
                    Id: 10,
                    DisplayName: 'Library',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: () => 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](https://meta.stackoverflow.com/a/251605) in the answer itself.'
                },
                {
                    Id: 11,
                    DisplayName: 'Comment',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: userDetails => userDetails.Reputation < 50
                        ? 'This does not provide an answer to the question. Once you have sufficient [reputation](/help/whats-reputation) ' +
                            'you will be able to [comment on any post](/help/privileges/comment); instead, ' +
                            '[provide answers that don\'t require clarification from the asker](https://meta.stackexchange.com/questions/214173/why-do-i-need-50-reputation-to-comment-what-can-i-do-instead).'
                        :
                            'This does not provide an answer to the question. Please write a comment instead.'
                },
                {
                    Id: 12,
                    DisplayName: 'Duplicate',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: () => 'Instead of posting an answer which merely links to another answer, please instead [flag the question](/help/privileges/flag-posts) as a duplicate.'
                },
                {
                    Id: 13,
                    DisplayName: 'Non English',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: () => 'Welcome to Stack Overflow. Please write your answer in English, as Stack Overflow is an [English only site](https://meta.stackoverflow.com/a/297680).'
                },
                {
                    Id: 14,
                    DisplayName: 'Should be an edit',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    GetComment: () => 'Please use the edit link on your question to add additional information. The Post Answer button should be used only for complete answers to the question.'
                }
            ]
        },
        {
            IsDangerous: false,
            AppliesTo: ['Answer', 'Question'],
            FlagTypes: [
                {
                    Id: 15,
                    DisplayName: 'Looks Fine',
                    ReportType: 'NoFlag'
                },
                {
                    Id: 16,
                    DisplayName: 'Needs Editing',
                    ReportType: 'NoFlag'
                },
                {
                    Id: 17,
                    DisplayName: 'Vandalism',
                    ReportType: 'NoFlag'
                }
            ]
        }
    ];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 2 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.getAllAnswerIds = exports.parseDate = exports.parseQuestionsAndAnswers = void 0;
    $.event.special.destroyed = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove: (o) => {
            if (o.handler) {
                o.handler();
            }
        }
    };
    function parseNatoPage(callback) {
        $('.answer-hyperlink').parent().parent().each((_index, element) => {
            const node = $(element);
            const answerHref = node.find('.answer-hyperlink').attr('href');
            if (!answerHref)
                return;
            const postId = parseInt(answerHref.split('#')[1], 10);
            const answerTime = parseActionDate(node.find('.user-action-time'));
            const questionTime = parseActionDate(node.find('td .relativetime'));
            if (!answerTime || !questionTime)
                return;
            const authorReputation = parseReputation(node.find('.reputation-score'));
            const { authorName, authorId } = parseAuthorDetails(node.find('.user-details'));
            callback({
                type: 'Answer',
                element: node,
                page: 'NATO',
                postId,
                answerTime,
                questionTime,
                authorReputation,
                authorName,
                authorId,
            });
        });
    }
    function getPostDetails(node) {
        const score = parseInt(node.find('.js-vote-count').text(), 10);
        const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
        const { authorName, authorId } = parseAuthorDetails(node.find('.user-info .user-details').last());
        const postTime = parseActionDate(node.find('.user-info .relativetime').last());
        return { score, authorReputation, authorName, authorId, postTime };
    }
    function parseAnswerDetails(aNode, callback, question) {
        const answerIdString = aNode.attr('data-answerid');
        if (!answerIdString)
            return;
        const answerId = parseInt(answerIdString, 10);
        const postDetails = getPostDetails(aNode);
        if (!postDetails.postTime)
            return;
        aNode.find('.answercell').bind('destroyed', () => {
            setTimeout(() => {
                const updatedAnswerNode = $(`#answer-${answerId}`);
                parseAnswerDetails(updatedAnswerNode, callback, question);
            });
        });
        callback({
            type: 'Answer',
            element: aNode,
            page: 'Question',
            postId: answerId,
            question,
            postTime: postDetails.postTime,
            score: postDetails.score,
            authorReputation: postDetails.authorReputation,
            authorName: postDetails.authorName,
            authorId: postDetails.authorId
        });
    }
    function parseQuestionPage(callback) {
        let question;
        const parseQuestionDetails = (qNode) => {
            const questionIdString = qNode.attr('data-questionid');
            if (!questionIdString)
                return;
            const postId = parseInt(questionIdString, 10);
            const postDetails = getPostDetails(qNode);
            if (!postDetails.postTime)
                return;
            qNode.find('.postcell').bind('destroyed', () => {
                setTimeout(() => {
                    const updatedQuestionNode = $(`[data-questionid="${postId}"]`);
                    parseQuestionDetails(updatedQuestionNode);
                });
            });
            question = {
                type: 'Question',
                element: qNode,
                page: 'Question',
                postId,
                postTime: postDetails.postTime,
                score: postDetails.score,
                authorReputation: postDetails.authorReputation,
                authorName: postDetails.authorName,
                authorId: postDetails.authorId
            };
            callback(question);
        };
        const questionNode = $('.question');
        parseQuestionDetails(questionNode);
        $('.answer').each((_index, element) => parseAnswerDetails($(element), callback, question));
    }
    function parseFlagsPage(callback) {
        $('.flagged-post').each((_index, nodeEl) => {
            const node = $(nodeEl);
            const type = node.find('.answer-hyperlink').length ? 'Answer' : 'Question';
            const elementHref = node.find(`.${type.toLowerCase()}-hyperlink`).attr('href');
            if (!elementHref)
                return;
            const postId = parseInt(type === 'Answer'
                ? elementHref.split('#')[1]
                : elementHref.split('/')[2], 10);
            const score = parseInt(node.find('.answer-votes').text(), 10);
            const { authorName, authorId } = parseAuthorDetails(node.find('.post-user-info'));
            const postTime = parseActionDate(node.find('.post-user-info .relativetime'));
            const handledTime = parseActionDate(node.find('.mod-flag .relativetime'));
            if (!postTime || !handledTime)
                return;
            const fullHandledResult = node.find('.flag-outcome').text().trim().split(' - ');
            const handledResult = fullHandledResult[0].trim();
            const handledComment = fullHandledResult.slice(1).join(' - ').trim();
            callback({
                type: type,
                element: node,
                page: 'Flags',
                postId,
                score,
                postTime,
                handledTime,
                handledResult,
                handledComment,
                authorName,
                authorId
            });
        });
    }
    function parseGenericPage(callback) {
        $('.question-hyperlink').each((_index, node) => {
            const questionNode = $(node);
            const questionHref = questionNode.attr('href');
            if (!questionHref)
                return;
            let fragment = questionHref.split('/')[2];
            if (fragment.indexOf('_') >= 0) {
                fragment = fragment.split('_')[1];
            }
            const postId = parseInt(fragment, 10);
            callback({
                type: 'Question',
                element: questionNode,
                page: 'Unknown',
                postId
            });
        });
        $('.answer-hyperlink').each((_index, element) => {
            const answerNode = $(element);
            const answerNodeHref = answerNode.attr('href');
            if (!answerNodeHref)
                return;
            let fragment = answerNodeHref.split('#')[1];
            if (fragment.indexOf('_') >= 0) {
                fragment = fragment.split('_')[1];
            }
            const postId = parseInt(fragment, 10);
            callback({
                type: 'Answer',
                element: answerNode,
                page: 'Unknown',
                postId
            });
        });
    }
    function parseQuestionsAndAnswers(callback) {
        if (globals.isNatoPage()) {
            parseNatoPage(callback);
        }
        else if (globals.isQuestionPage()) {
            parseQuestionPage(callback);
        }
        else if (globals.isFlagsPage()) {
            parseFlagsPage(callback);
        }
        else if (globals.isModPage() || globals.isUserPage() || StackExchange.options.user.isModerator) {
            return;
        }
        else {
            parseGenericPage(callback);
        }
    }
    exports.parseQuestionsAndAnswers = parseQuestionsAndAnswers;
    function parseReputation(reputationDiv) {
        let reputationText = reputationDiv.text();
        const reputationDivTitle = reputationDiv.attr('title');
        if (!reputationDivTitle)
            return;
        if (reputationText.indexOf('k') !== -1) {
            reputationText = reputationDivTitle.substr('reputation score '.length);
        }
        reputationText = reputationText.replace(',', '');
        return parseInt(reputationText, 10) || undefined;
    }
    function parseAuthorDetails(authorDiv) {
        const userLink = authorDiv.find('a');
        const authorName = userLink.text();
        const userLinkRef = userLink.attr('href');
        let authorId;
        // Users can be deleted, and thus have no link to their profile.
        if (userLinkRef)
            authorId = parseInt(userLinkRef.split('/')[2], 10);
        return { authorName, authorId };
    }
    function parseActionDate(actionDiv) {
        return parseDate((actionDiv.hasClass('relativetime') ? actionDiv : actionDiv.find('.relativeTime')).attr('title'));
    }
    function parseDate(dateStr) {
        // Fix for safari
        return dateStr ? new Date(dateStr.replace(' ', 'T')) : undefined;
    }
    exports.parseDate = parseDate;
    function getAllAnswerIds() {
        return $('[id^="answer-"]').get().map(el => $(el).data('answerid'));
    }
    exports.getAllAnswerIds = getAllAnswerIds;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 3 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(0), __webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, AdvancedFlagging_1, MetaSmokeAPI_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.getPostUrlsFromFlagsPage = exports.getPostUrlsFromQuestionPage = exports.addXHRListener = exports.showConfirmModal = exports.Delay = exports.showMSTokenPopupAndGet = exports.inlineCheckboxesWrapper = exports.overlayModal = exports.configurationLink = exports.configurationDiv = exports.advancedFlaggingLink = exports.gridCellDiv = exports.plainDiv = exports.dropdownItem = exports.reportLink = exports.popoverArrow = exports.dropDown = exports.popupWrapper = exports.getConfigHtml = exports.getOptionLabel = exports.getCategoryDiv = exports.getOptionBox = exports.getDivider = exports.getSectionWrapper = exports.getMessageDiv = exports.getSmokeyIcon = exports.getGuttenbergIcon = exports.getNattyIcon = exports.getReportedIcon = exports.getPerformedActionIcon = exports.isUserPage = exports.isFlagsPage = exports.isQuestionPage = exports.isModPage = exports.isNatoPage = exports.isStackOverflow = exports.displayError = exports.displaySuccess = exports.showInlineElement = exports.hideElement = exports.showElement = exports.getFlagsUrlRegex = exports.flagsUrlRegex = exports.isDeleteVoteRegex = exports.isReviewItemRegex = exports.popupDelay = exports.displayStacksToast = exports.settingUpBody = exports.settingUpTitle = exports.MetaSmokeDisabledConfig = exports.MetaSmokeUserKeyConfig = exports.CacheChatApiFkey = exports.ConfigurationLinkDisabled = exports.ConfigurationEnabledFlags = exports.ConfigurationWatchQueues = exports.ConfigurationWatchFlags = exports.ConfigurationDefaultNoComment = exports.ConfigurationDefaultNoFlag = exports.ConfigurationOpenOnHover = exports.username = exports.nattyAllReportsUrl = exports.genericBotKey = exports.copyPastorServer = exports.copyPastorKey = exports.metaSmokeKey = exports.soboticsRoomId = void 0;
    exports.soboticsRoomId = 111347;
    exports.metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
    exports.copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
    exports.copyPastorServer = 'https://copypastor.sobotics.org';
    exports.genericBotKey = 'Cm45BSrt51FR3ju';
    exports.nattyAllReportsUrl = 'https://logs.sobotics.org/napi/api/stored/all';
    exports.username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
    exports.ConfigurationOpenOnHover = 'AdvancedFlagging.Configuration.OpenOnHover';
    exports.ConfigurationDefaultNoFlag = 'AdvancedFlagging.Configuration.DefaultNoFlag';
    exports.ConfigurationDefaultNoComment = 'AdvancedFlagging.Configuration.DefaultNoComment';
    exports.ConfigurationWatchFlags = 'AdvancedFlagging.Configuration.WatchFlags';
    exports.ConfigurationWatchQueues = 'AdvancedFlagging.Configuration.WatchQueues';
    exports.ConfigurationEnabledFlags = 'AdvancedFlagging.Configuration.EnabledFlags';
    exports.ConfigurationLinkDisabled = 'AdvancedFlagging.Configuration.LinkDisabled';
    exports.CacheChatApiFkey = 'StackExchange.ChatApi.FKey';
    exports.MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
    exports.MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
    // export const ConfigurationDetectAudits = 'AdvancedFlagging.Configuration.DetectAudits';
    // export const MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';
    exports.settingUpTitle = 'Setting up MetaSmoke';
    exports.settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
        + 'To reset configuration, see the footer of Stack Overflow.';
    const displayStacksToast = (message, type) => StackExchange.helpers.showToast(message, { type: type });
    exports.displayStacksToast = displayStacksToast;
    exports.popupDelay = 4000;
    exports.isReviewItemRegex = /(\/review\/next-task)|(\/review\/task-reviewed\/)/;
    exports.isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
    exports.flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
    const getFlagsUrlRegex = (postId) => new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther)`);
    exports.getFlagsUrlRegex = getFlagsUrlRegex;
    const showElement = (element) => element.addClass('d-block').removeClass('d-none');
    exports.showElement = showElement;
    const hideElement = (element) => element.addClass('d-none').removeClass('d-block');
    exports.hideElement = hideElement;
    const showInlineElement = (element) => element.addClass('d-inline-block').removeClass('d-none');
    exports.showInlineElement = showInlineElement;
    const displaySuccess = (message) => AdvancedFlagging_1.displayToaster(message, 'success');
    exports.displaySuccess = displaySuccess;
    const displayError = (message) => AdvancedFlagging_1.displayToaster(message, 'danger');
    exports.displayError = displayError;
    const isStackOverflow = () => !!window.location.href.match(/^https:\/\/stackoverflow.com/);
    exports.isStackOverflow = isStackOverflow;
    const isNatoPage = () => !!window.location.href.match(/\/tools\/new-answers-old-questions/);
    exports.isNatoPage = isNatoPage;
    const isModPage = () => !!window.location.href.match(/\/admin/);
    exports.isModPage = isModPage;
    const isQuestionPage = () => !!window.location.href.match(/\/questions\/\d+.*/);
    exports.isQuestionPage = isQuestionPage;
    const isFlagsPage = () => !!window.location.href.match(/\/users\/flag-summary\//);
    exports.isFlagsPage = isFlagsPage;
    const isUserPage = () => !!window.location.href.match(/\/users\/\d+.*/);
    exports.isUserPage = isUserPage;
    const getPerformedActionIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.CheckmarkSm().addClass('fc-green-500'));
    exports.getPerformedActionIcon = getPerformedActionIcon;
    const getReportedIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.Flag().addClass('fc-red-500'));
    exports.getReportedIcon = getReportedIcon;
    const sampleIconClass = $('<div>').attr('class', 'advanced-flagging-icon bg-cover c-pointer w16 h16 d-none va-middle');
    sampleIconClass.addClass(window.location.href.match(/\/users\/flag-summary/) ? 'mx4' : 'm4');
    const getNattyIcon = () => sampleIconClass.clone().attr('title', 'Reported by Natty').addClass('advanced-flagging-natty-icon');
    exports.getNattyIcon = getNattyIcon;
    const getGuttenbergIcon = () => sampleIconClass.clone().attr('title', 'Reported by Guttenberg').addClass('advanced-flagging-gut-icon');
    exports.getGuttenbergIcon = getGuttenbergIcon;
    const getSmokeyIcon = () => sampleIconClass.clone().attr('title', 'Reported by Smokey').addClass('advanced-flagging-smokey-icon');
    exports.getSmokeyIcon = getSmokeyIcon;
    const getMessageDiv = (message, state) => $('<div>').attr('class', 'p12 bg-' + state).text(message);
    exports.getMessageDiv = getMessageDiv;
    const getSectionWrapper = (name) => $('<fieldset>').attr('class', `grid gs8 gsy fd-column af-section-${name.toLowerCase()}`)
        .html(`<h2 class="grid--cell">${name}</h2>`);
    exports.getSectionWrapper = getSectionWrapper;
    const getDivider = () => $('<hr>').attr('class', 'my8');
    exports.getDivider = getDivider;
    const getOptionBox = (name) => $('<input>').attr('type', 'checkbox').attr('name', name).attr('id', name).attr('class', 's-checkbox');
    exports.getOptionBox = getOptionBox;
    const getCategoryDiv = (red) => $('<div>').attr('class', `advanced-flagging-category bar-md${red ? ' bg-red-200' : ''}`);
    exports.getCategoryDiv = getCategoryDiv;
    const getOptionLabel = (text, name) => $('<label>').text(text).attr('for', name).attr('class', 's-label ml4 va-middle fs-body1 fw-normal');
    exports.getOptionLabel = getOptionLabel;
    const getConfigHtml = (optionId, text) => $(`
<div>
  <div class="grid gs8">
    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="grid--cell s-label fw-normal" for="${optionId}">${text}</label>
  </div>
</div>`);
    exports.getConfigHtml = getConfigHtml;
    exports.popupWrapper = $('<div>').attr('id', 'snackbar')
        .attr('class', 'hide fc-white p16 fs-body3 ps-fixed ta-center z-popover l50 t32 wmn2');
    exports.dropDown = $('<div>').attr('class', 'advanced-flagging-dialog s-popover s-anchors s-anchors__default p6 mt2 c-default d-none');
    exports.popoverArrow = $('<div>').attr('class', 's-popover--arrow s-popover--arrow__tc');
    exports.reportLink = $('<a>').attr('class', 'd-inline-block my4');
    exports.dropdownItem = $('<div>').attr('class', 'advanced-flagging-dropdown-item px4');
    exports.plainDiv = $('<div>');
    exports.gridCellDiv = $('<div>').attr('class', 'grid--cell');
    exports.advancedFlaggingLink = $('<button>').attr('type', 'button').attr('class', 's-btn s-btn__link').text('Advanced Flagging');
    exports.configurationDiv = $('<div>').attr('class', 'advanced-flagging-configuration-div ta-left pt6');
    exports.configurationLink = $('<a>').attr('id', 'af-modal-button').text('AdvancedFlagging configuration');
    exports.overlayModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full w60" role="document">
    <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>
    <div class="s-modal--body fs-body2" id="af-modal-description"></div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>
      <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
  </div>
</aside>`);
    const grid = $('<div>').attr('class', 'grid');
    exports.inlineCheckboxesWrapper = exports.gridCellDiv.clone().append(grid.clone());
    const metasmokeTokenPopup = $(`
<aside class="s-modal" id="af-ms-token" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog" role="document">
    <h1 class="s-modal--header fw-bold c-movey" id="af-modal-title">Authenticate MS with AF</h1>
    <div class="s-modal--body fs-body2" id="af-modal-description">
      <div class="grid gs4 gsy fd-column">
        <div class="grid--cell">
          <label class="d-block s-label" for="example-item1">Metasmoke access token
            <p class="s-description mt2">Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:</p>
          </label>
        </div>
      <div class="grid ps-relative"><input class="s-input" type="text" id="advanced-flagging-ms-token" placeholder="Enter the code here"></div>
      </div>
    </div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" id="advanced-flagging-save-ms-token" type="button">Submit</button>
      <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
  </div>
</aside>`);
    function showMSTokenPopupAndGet() {
        return new Promise(resolve => {
            StackExchange.helpers.showModal(metasmokeTokenPopup);
            $('#advanced-flagging-save-ms-token').on('click', () => {
                const token = $('#advanced-flagging-ms-token').val();
                $('#af-ms-token').remove(); // dismiss modal
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
    // Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
    let initialized = false;
    const callbacks = [];
    function addXHRListener(callback) {
        callbacks.push(callback);
        if (initialized)
            return;
        const open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (...args) {
            this.addEventListener('load', () => {
                callbacks.forEach(cb => cb(this));
            }, false);
            open.apply(this, args);
        };
        initialized = true;
    }
    exports.addXHRListener = addXHRListener;
    function getPostUrlsFromQuestionPage() {
        return $('.question, .answer').get().map(el => {
            const postType = $(el).attr('data-questionid') ? 'Question' : 'Answer';
            const urlToReturn = MetaSmokeAPI_1.MetaSmokeAPI.GetQueryUrl(Number($(el).attr('data-questionid') || $(el).attr('data-answerid')), postType);
            return urlToReturn;
        });
    }
    exports.getPostUrlsFromQuestionPage = getPostUrlsFromQuestionPage;
    function getPostUrlsFromFlagsPage() {
        return $('.flagged-post').get().map(el => {
            const postType = $(el).find('.answer-hyperlink').length ? 'Answer' : 'Question';
            const elementHref = $(el).find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
            if (!elementHref)
                return;
            const urlToReturn = MetaSmokeAPI_1.MetaSmokeAPI.GetQueryUrl(Number(postType === 'Answer'
                ? elementHref.split('#')[1]
                : elementHref.split('/')[2]), postType);
            return urlToReturn;
        });
    }
    exports.getPostUrlsFromFlagsPage = getPostUrlsFromFlagsPage;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 4 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(5), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.MetaSmokeAPI = void 0;
    class MetaSmokeAPI {
        static Reset() {
            GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(globals.MetaSmokeDisabledConfig);
            GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(globals.MetaSmokeUserKeyConfig);
        }
        static IsDisabled() {
            const cachedDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.MetaSmokeDisabledConfig);
            if (!cachedDisabled)
                return false;
            return cachedDisabled;
        }
        static async Setup(appKey) {
            MetaSmokeAPI.appKey = appKey;
            MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
        }
        static QueryMetaSmokeInternal() {
            const urls = globals.isQuestionPage() ? globals.getPostUrlsFromQuestionPage() : globals.getPostUrlsFromFlagsPage();
            const urlString = urls.join(',');
            const isDisabled = MetaSmokeAPI.IsDisabled();
            if (isDisabled)
                return;
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: 'GET',
                    url: 'https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls',
                    data: {
                        urls: urlString,
                        key: `${MetaSmokeAPI.appKey}`
                    }
                }).done((metaSmokeResult) => {
                    metaSmokeResult.items.forEach(item => {
                        const postId = item.link.match(/\d+$/);
                        if (!postId)
                            return;
                        MetaSmokeAPI.metasmokeIds.push({ sitePostId: Number(postId[0]), metasmokeId: item.id });
                    });
                    resolve();
                }).fail(error => {
                    console.error('Failed to get Metasmoke URLs', error);
                    reject();
                });
            });
        }
        static GetQueryUrl(postId, postType) {
            return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
        }
        static async getUserKey() {
            return await GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(globals.MetaSmokeUserKeyConfig, () => new Promise((resolve, reject) => {
                MetaSmokeAPI.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`).then(code => {
                    if (!code)
                        return;
                    $.ajax({
                        url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeAPI.appKey + '&code=' + code,
                        method: 'GET'
                    }).done(data => resolve(data.token)).fail(err => reject(err));
                });
            }));
        }
        static getSmokeyId(postId) {
            const metasmokeObject = MetaSmokeAPI.metasmokeIds.find(item => item.sitePostId === postId);
            return metasmokeObject ? metasmokeObject.metasmokeId : 0;
        }
        async ReportNaa(postId) {
            const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'naa-');
            return true;
        }
        async ReportRedFlag(postId, postType) {
            const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'tpu-');
                return true;
            }
            const urlStr = MetaSmokeAPI.GetQueryUrl(postId, postType);
            if (!MetaSmokeAPI.accessToken)
                return false;
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: 'POST',
                    url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                    data: {
                        post_link: urlStr,
                        key: MetaSmokeAPI.appKey,
                        token: MetaSmokeAPI.accessToken
                    }
                }).done(() => resolve(true)).fail(() => reject(false));
            });
        }
        async ReportLooksFine(postId) {
            const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        async ReportNeedsEditing(postId) {
            const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        async ReportVandalism(postId) {
            const smokeyid = MetaSmokeAPI.getSmokeyId(postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'tp-');
            return true;
        }
        SendFeedback(metaSmokeId, feedbackType) {
            return new Promise((resolve, reject) => {
                if (!MetaSmokeAPI.accessToken)
                    reject();
                $.ajax({
                    type: 'POST',
                    url: `https://metasmoke.erwaysoftware.com/api/w/post/${metaSmokeId}/feedback`,
                    data: {
                        type: feedbackType,
                        key: MetaSmokeAPI.appKey,
                        token: MetaSmokeAPI.accessToken
                    }
                }).done(() => resolve()).fail(() => reject());
            });
        }
    }
    exports.MetaSmokeAPI = MetaSmokeAPI;
    MetaSmokeAPI.metasmokeIds = [];
    MetaSmokeAPI.codeGetter = async (metaSmokeOAuthUrl) => {
        if (MetaSmokeAPI.IsDisabled())
            return;
        const userDisableMetasmoke = await globals.showConfirmModal(globals.settingUpTitle, globals.settingUpBody);
        if (!userDisableMetasmoke) {
            GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.MetaSmokeDisabledConfig, true);
            return;
        }
        window.open(metaSmokeOAuthUrl, '_blank');
        await globals.Delay(100);
        const returnCode = await new Promise(resolve => {
            const getMSToken = async () => {
                $(window).off('focus', getMSToken);
                const code = await globals.showMSTokenPopupAndGet();
                resolve(code || undefined);
            };
            $(window).focus(getMSToken);
        });
        return returnCode;
    };
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 5 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.GreaseMonkeyCache = void 0;
    class GreaseMonkeyCache {
        static async GetAndCache(cacheKey, getterPromise, expiresAt) {
            const cachedItem = GreaseMonkeyCache.GetFromCache(cacheKey);
            if (cachedItem)
                return cachedItem;
            const result = await getterPromise();
            GreaseMonkeyCache.StoreInCache(cacheKey, result, expiresAt);
            return result;
        }
        static GetFromCache(cacheKey) {
            const jsonItem = GM_getValue(cacheKey, undefined);
            if (!jsonItem)
                return undefined;
            const dataItem = JSON.parse(jsonItem);
            if (dataItem.Expires && new Date(dataItem.Expires) < new Date())
                return undefined;
            return dataItem.Data;
        }
        static StoreInCache(cacheKey, item, expiresAt) {
            const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
            GM_setValue(cacheKey, jsonStr);
        }
        static Unset(cacheKey) {
            GM_deleteValue(cacheKey);
        }
    }
    exports.GreaseMonkeyCache = GreaseMonkeyCache;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 6 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(7), __webpack_require__(2), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ChatApi_1, sotools_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.NattyAPI = void 0;
    class NattyAPI {
        constructor(answerId) {
            this.chat = new ChatApi_1.ChatApi();
            this.answerId = answerId;
            this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
            this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
        }
        static getAllNattyIds() {
            return new Promise((resolve, reject) => {
                if (!globals.isStackOverflow())
                    resolve();
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${globals.nattyAllReportsUrl}`,
                    onload: (response) => {
                        if (response.status !== 200)
                            reject();
                        const result = JSON.parse(response.responseText);
                        const allStoredIds = result.items.map((item) => Number(item.name));
                        const answerIds = sotools_1.getAllAnswerIds();
                        this.nattyIds = answerIds.filter(id => allStoredIds.includes(id));
                        resolve();
                    },
                    onerror: () => {
                        reject();
                    },
                });
            });
        }
        WasReported() {
            return NattyAPI.nattyIds.includes(this.answerId);
        }
        async ReportNaa(answerDate, questionDate) {
            if (answerDate < questionDate || !globals.isStackOverflow())
                return false;
            if (this.WasReported()) {
                await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
                return true;
            }
            else {
                const answerAge = this.DaysBetween(answerDate, new Date());
                const daysPostedAfterQuestion = this.DaysBetween(questionDate, answerDate);
                if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30)
                    return false;
                await this.chat.SendMessage(globals.soboticsRoomId, this.reportMessage);
                return true;
            }
        }
        async ReportRedFlag() {
            if (!globals.isStackOverflow() || !this.WasReported())
                return false;
            await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} tp`);
            return true;
        }
        async ReportLooksFine() {
            if (!globals.isStackOverflow() || !this.WasReported())
                return false;
            await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} fp`);
            return true;
        }
        async ReportNeedsEditing() {
            if (!globals.isStackOverflow() || !this.WasReported())
                return false;
            await this.chat.SendMessage(globals.soboticsRoomId, `${this.feedbackMessage} ne`);
            return true;
        }
        DaysBetween(first, second) {
            return (second.valueOf() - first.valueOf()) / (1000 * 60 * 60 * 24);
        }
    }
    exports.NattyAPI = NattyAPI;
    NattyAPI.nattyIds = [];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 7 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(5), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.ChatApi = void 0;
    class ChatApi {
        constructor(chatUrl = 'https://chat.stackoverflow.com') {
            this.chatRoomUrl = chatUrl;
        }
        static GetExpiryDate() {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);
            return expiryDate;
        }
        async GetChannelFKey(roomId) {
            const expiryDate = ChatApi.GetExpiryDate();
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(globals.CacheChatApiFkey, () => new Promise(resolve => {
                this.GetChannelPage(roomId).then(channelPage => {
                    const fkeyElement = $(channelPage).filter('#fkey');
                    const fkey = fkeyElement.val();
                    if (!fkey)
                        return;
                    resolve(fkey.toString());
                });
            }), expiryDate);
        }
        GetChatUserId() {
            return StackExchange.options.user.userId;
        }
        SendMessage(roomId, message) {
            return new Promise((resolve, reject) => {
                const requestFunc = async () => {
                    const fkey = await this.GetChannelFKey(roomId);
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                        onload: (chat_response) => {
                            chat_response.status === 200 ? resolve() : onFailure(chat_response.statusText);
                        },
                        onerror: (error_response) => {
                            onFailure(error_response.responseText);
                        },
                    });
                };
                let numTries = 0;
                const onFailure = (errorMessage) => {
                    numTries++;
                    if (numTries < 3) {
                        GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(globals.CacheChatApiFkey);
                        requestFunc();
                    }
                    else {
                        reject(errorMessage);
                    }
                };
                requestFunc();
            });
        }
        GetChannelPage(roomId) {
            const getterPromise = new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${this.chatRoomUrl}/rooms/${roomId}`,
                    onload: (response) => {
                        response.status === 200 ? resolve(response.responseText) : reject(response.statusText);
                    },
                    onerror: (data) => reject(data)
                });
            });
            return getterPromise;
        }
    }
    exports.ChatApi = ChatApi;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 8 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.GenericBotAPI = void 0;
    class GenericBotAPI {
        constructor(answerId) {
            this.answerId = answerId;
        }
        async ReportNaa() {
            const response = await this.makeTrackRequest();
            return response;
        }
        async ReportRedFlag() {
            const response = await this.makeTrackRequest();
            return response;
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
        makeTrackRequest() {
            return new Promise((resolve, reject) => {
                if (!globals.isStackOverflow())
                    resolve(false);
                const flaggerName = globals.username;
                if (!flaggerName)
                    return false;
                const contentHash = this.computeContentHash($('#answer-' + this.answerId + ' .js-post-body').html().trim());
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://so.floern.com/api/trackpost.php',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: `key=${globals.genericBotKey}`
                        + '&postId=' + this.answerId
                        + '&contentHash=' + contentHash
                        + '&flagger=' + encodeURIComponent(flaggerName),
                    onload: (response) => {
                        if (response.status !== 200)
                            reject('Flag Tracker Error: Status ' + response.status);
                        resolve(true);
                    },
                    onerror: (response) => {
                        reject('Flag Tracker Error: ' + response.responseText);
                    }
                });
            });
        }
    }
    exports.GenericBotAPI = GenericBotAPI;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 9 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(7), __webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ChatApi_1, globals, sotools_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.CopyPastorAPI = void 0;
    class CopyPastorAPI {
        constructor(id) {
            this.answerId = id;
        }
        static async getAllCopyPastorIds() {
            if (!globals.isStackOverflow())
                return;
            const answerIds = sotools_1.getAllAnswerIds();
            for (const answerId of answerIds) {
                const copypastorObject = await this.isPostReported(answerId);
                const isReportOrPlagiarism = copypastorObject && copypastorObject.post_id
                    ? await this.getIsReportOrPlagiarism(copypastorObject.post_id)
                    : false;
                this.copyPastorIds.push({ postId: answerId, copypastorObject: copypastorObject, repost: isReportOrPlagiarism });
            }
        }
        static getIsReportOrPlagiarism(answerId) {
            return new Promise(resolve => {
                if (!answerId)
                    resolve(false);
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${globals.copyPastorServer}/posts/${answerId}`,
                    onload: (response) => {
                        const responseParsed = $(response.responseText);
                        resolve(!!responseParsed.text().match('Reposted'));
                    },
                    onerror: () => {
                        resolve(false);
                    },
                });
            });
        }
        static isPostReported(postId) {
            return new Promise((resolve, reject) => {
                const url = `${globals.copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${postId}`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    onload: (response) => {
                        const responseObject = JSON.parse(response.responseText);
                        resolve(responseObject.status === 'success' ? responseObject.posts[0] : {});
                    },
                    onerror: () => {
                        reject(false);
                    },
                });
            });
        }
        getCopyPastorObject() {
            const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
            return idsObject ? idsObject.copypastorObject : 0;
        }
        getCopyPastorId() {
            const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
            return idsObject ? idsObject.postId : 0;
        }
        getIsRepost() {
            const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
            return idsObject ? idsObject.repost : false;
        }
        async ReportTruePositive() {
            return await this.SendFeedback('tp');
        }
        async ReportFalsePositive() {
            return await this.SendFeedback('fp');
        }
        async SendFeedback(type) {
            const username = globals.username;
            const chatId = new ChatApi_1.ChatApi().GetChatUserId();
            const copyPastorObject = this.getCopyPastorObject();
            if (!copyPastorObject || !copyPastorObject.post_id)
                return false;
            const payload = {
                post_id: copyPastorObject.post_id,
                feedback_type: type,
                username,
                link: `https://chat.stackoverflow.com/users/${chatId}`,
                key: globals.copyPastorKey,
            };
            return await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${globals.copyPastorServer}/feedback/create`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: 'post_id=' + payload.post_id
                        + '&feedback_type=' + payload.feedback_type
                        + '&username=' + payload.username
                        + '&link=' + payload.link
                        + '&key=' + payload.key,
                    onload: (response) => {
                        response.status === 200 ? resolve(true) : reject(JSON.parse(response.responseText));
                    },
                    onerror: (response) => {
                        reject(response);
                    },
                });
            });
        }
    }
    exports.CopyPastorAPI = CopyPastorAPI;
    CopyPastorAPI.copyPastorIds = [];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 10 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(1), __webpack_require__(5), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MetaSmokeAPI_1, FlagTypes_1, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.SetupConfiguration = void 0;
    const configurationEnabledFlags = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
    async function SetupConfiguration() {
        while (typeof Svg === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const bottomBox = $('.site-footer--copyright').children('.-list');
        const configurationDiv = globals.configurationDiv.clone();
        SetupDefaults();
        BuildConfigurationOverlay();
        const configurationLink = globals.configurationLink.clone();
        $(document).on('click', '#af-modal-button', () => Stacks.showModal(document.querySelector('#af-config')));
        configurationDiv.append(configurationLink);
        configurationDiv.insertAfter(bottomBox);
    }
    exports.SetupConfiguration = SetupConfiguration;
    function getFlagTypes() {
        const flagTypes = [];
        FlagTypes_1.flagCategories.forEach(flagCategory => {
            flagCategory.FlagTypes.forEach(flagType => {
                flagTypes.push({
                    Id: flagType.Id,
                    DisplayName: flagType.DisplayName
                });
            });
        });
        return flagTypes;
    }
    function SetupDefaults() {
        if (!configurationEnabledFlags) {
            const flagTypeIds = getFlagTypes().map(f => f.Id);
            GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.ConfigurationEnabledFlags, flagTypeIds);
        }
    }
    function BuildConfigurationOverlay() {
        const overlayModal = globals.overlayModal;
        overlayModal.find('.s-modal--close').append(Svg.ClearSm());
        const sections = [
            {
                SectionName: 'General',
                Items: GetGeneralConfigItems(),
                onSave: () => {
                    $('.af-section-general').find('input').each((_index, el) => {
                        GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache($(el).parents().eq(2).data('option-id'), $(el).prop('checked'));
                    });
                }
            },
            {
                SectionName: 'Flags',
                Items: GetFlagSettings(),
                onSave: () => {
                    const flagOptions = $('.af-section-flags').find('input').get()
                        .filter(el => $(el).prop('checked'))
                        .map(el => {
                        const postId = $(el).attr('id');
                        return postId ? Number(postId.match(/\d+/)) : 0;
                    }).sort((a, b) => a - b);
                    GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.ConfigurationEnabledFlags, flagOptions);
                }
            },
            {
                SectionName: 'Admin',
                Items: GetAdminConfigItems()
            }
        ];
        let firstSection = true;
        sections.forEach(section => {
            if (!firstSection)
                overlayModal.find('#af-modal-description').append('<hr>');
            firstSection = false;
            const sectionWrapper = globals.getSectionWrapper(section.SectionName);
            overlayModal.find('#af-modal-description').append(sectionWrapper);
            section.Items.forEach((element) => sectionWrapper.append(element));
        });
        const okayButton = overlayModal.find('.s-btn__primary');
        okayButton.click(event => {
            event.preventDefault();
            sections.forEach(section => {
                if (section.onSave)
                    section.onSave();
            });
            globals.displayStacksToast('Configuration saved', 'success');
            setTimeout(window.location.reload.bind(window.location), 500);
        });
        $('body').append(overlayModal);
        $('label[for="flag-type-16"]').parent().removeClass('w25').css('width', '20.8%'); // because without it, the CSS breaks
        const flagOptions = $('.af-section-flags').children('div');
        for (let i = 0; i < flagOptions.length; i += 5) {
            flagOptions.slice(i, i + 5).wrapAll(globals.inlineCheckboxesWrapper.clone());
        }
    }
    function GetGeneralConfigItems() {
        const checkboxArray = [];
        const options = [
            {
                text: 'Open dropdown on hover',
                configValue: globals.ConfigurationOpenOnHover
            },
            {
                text: 'Watch for manual flags',
                configValue: globals.ConfigurationWatchFlags
            },
            {
                text: 'Watch for queue responses',
                configValue: globals.ConfigurationWatchQueues
            },
            {
                text: 'Disable AdvancedFlagging link',
                configValue: globals.ConfigurationLinkDisabled
            },
            {
                text: 'Uncheck \'Comment\' by default',
                configValue: globals.ConfigurationDefaultNoComment
            },
            {
                text: 'Uncheck \'flag\' by default',
                configValue: globals.ConfigurationDefaultNoFlag
            },
        ];
        options.forEach(el => {
            const storedValue = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(el.configValue);
            checkboxArray.push(createCheckbox(el.text, storedValue).attr('data-option-id', el.configValue));
        });
        return checkboxArray;
    }
    function GetFlagSettings() {
        const checkboxes = [];
        if (!configurationEnabledFlags)
            return checkboxes;
        getFlagTypes().forEach(f => {
            const storedValue = configurationEnabledFlags.indexOf(f.Id) > -1;
            checkboxes.push(createCheckbox(f.DisplayName, storedValue, 'flag-type-' + f.Id).children().eq(0).addClass('w25'));
        });
        return checkboxes;
    }
    function GetAdminConfigItems() {
        return [
            $('<a>').text('Clear Metasmoke Configuration').click(async () => {
                MetaSmokeAPI_1.MetaSmokeAPI.Reset();
                globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
            }),
            $('<a>').text('Clear chat fkey').click(() => {
                const fkeyCacheKey = 'StackExchange.ChatApi.FKey';
                GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(fkeyCacheKey);
                globals.displayStacksToast('Successfully cleared chat fkey.', 'success');
            })
        ].map(item => item.wrap(globals.gridCellDiv.clone()).parent());
    }
    function createCheckbox(text, storedValue, optionId = text.toLowerCase().replace(/\s/g, '_')) {
        const configHTML = globals.getConfigHtml(optionId, text);
        const input = configHTML.find('input');
        if (storedValue)
            input.prop('checked', true);
        return configHTML;
    }
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
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
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__(0);
/******/ })()
;