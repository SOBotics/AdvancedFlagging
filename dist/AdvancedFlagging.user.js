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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1), __webpack_require__(4), __webpack_require__(5), __webpack_require__(7), __webpack_require__(8), __webpack_require__(9), __webpack_require__(10), __webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, FlagTypes_1, sotools_1, NattyApi_1, GenericBotAPI_1, MetaSmokeAPI_1, CopyPastorAPI_1, Configuration_1, GreaseMonkeyCache_1, globals) {
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

#af-comments textarea {
    width: calc(100% - 15px);
    resize: vertical;
}`);
    }
    const userFkey = StackExchange.options.user.fkey;
    async function handleFlagAndComment(postId, flag, flagRequired, copypastorApi, reportedIcon, qualifiesForVlq, commentText) {
        if (commentText) {
            try {
                const postComment = await fetch(`/posts/${postId}/comments`, {
                    method: 'POST',
                    body: globals.getFormDataFromObject({ fkey: userFkey, comment: commentText })
                });
                const commentResult = await postComment.text();
                showComments(postId, commentResult);
            }
            catch (error) {
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
                const responseJson = await flagPost.json();
                if (responseJson.Success) {
                    displaySuccessFlagged(reportedIcon, flag.Human);
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
    }
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
        if (!reportTypeHuman)
            return;
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
        if (/already flagged/.exec(responseJson.Message)) {
            message += 'post already flagged';
        }
        else if (/limit reached/.exec(responseJson.Message)) {
            message += 'post flag limit reached';
        }
        else if (/You may only flag a post every \d+ seconds?/.exec(JSON.stringify(responseJson))) {
            message += 'rate-limited';
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
        const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
        commentUI.addShow(true, false);
        commentUI.showComments(data, null, false, true);
        $(document).trigger('comment', postId);
    }
    function setupNattyApi(postId, questionTime, answerTime, nattyIcon) {
        const nattyApi = new NattyApi_1.NattyAPI(postId, questionTime || new Date(), answerTime || new Date());
        const isReported = nattyApi.WasReported();
        if (nattyIcon && isReported) {
            globals.showInlineElement(nattyIcon);
            nattyIcon.attr('href', `//sentinel.erwaysoftware.com/posts/aid/${postId}`).attr('target', '_blank');
        }
        return nattyApi;
    }
    function setupGenericBotApi(postId) {
        return new GenericBotAPI_1.GenericBotAPI(postId);
    }
    function setupMetasmokeApi(postId, postType, smokeyIcon) {
        const smokeyId = MetaSmokeAPI_1.MetaSmokeAPI.getSmokeyId(postId);
        if (smokeyId) {
            smokeyIcon.attr('href', `https://metasmoke.erwaysoftware.com/post/${smokeyId}`).attr('target', '_blank');
            globals.showInlineElement(smokeyIcon);
        }
        return new MetaSmokeAPI_1.MetaSmokeAPI(postId, postType);
    }
    function setupGuttenbergApi(copyPastorApi, copyPastorIcon) {
        const copypastorId = copyPastorApi.getCopyPastorId();
        if (copypastorId) {
            globals.showInlineElement(copyPastorIcon);
            copyPastorIcon.attr('href', `https://copypastor.sobotics.org/posts/${copypastorId}`).attr('target', '_blank');
        }
        return copyPastorApi;
    }
    function getHumanFromDisplayName(displayName) {
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
    const storeCommentsInCache = () => Object.entries(globals.comments).forEach(array => globals.storeCommentInCache(array));
    const storeFlagsInCache = () => Object.entries(globals.flags).forEach(array => globals.storeFlagsInCache(array));
    function SetupCommentsAndFlags() {
        const commentsCached = Object.keys(globals.comments).every(item => globals.getCommentFromCache(item));
        const flagsCached = Object.keys(globals.flags).every(item => globals.getFlagFromCache(item));
        if (!flagsCached)
            storeFlagsInCache();
        if (!commentsCached)
            storeCommentsInCache();
    }
    function BuildFlaggingDialog(post, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi, shouldRaiseVlq) {
        const enabledFlagIds = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
        const defaultNoComment = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationDefaultNoComment);
        const defaultNoFlag = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationDefaultNoFlag);
        const comments = post.element.find('.comment-body');
        const dropDown = globals.dropDown.clone();
        const checkboxNameComment = `comment_checkbox_${post.postId}`;
        const checkboxNameFlag = `flag_checkbox_${post.postId}`;
        const leaveCommentBox = globals.getOptionBox(checkboxNameComment);
        const flagBox = globals.getOptionBox(checkboxNameFlag);
        flagBox.prop('checked', !defaultNoFlag);
        leaveCommentBox.prop('checked', !defaultNoComment && !comments.length && globals.isStackOverflow);
        const newCategories = FlagTypes_1.flagCategories.filter(item => item.AppliesTo.includes(post.type)
            && item.FlagTypes.some(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id)));
        for (const flagCategory of newCategories) {
            const categoryDiv = globals.getCategoryDiv(flagCategory.IsDangerous);
            for (const flagType of flagCategory.FlagTypes.filter(flag => enabledFlagIds && enabledFlagIds.includes(flag.Id))) {
                const reportLink = globals.reportLink.clone();
                const dropdownItem = globals.dropdownItem.clone();
                // https://github.com/SOBotics/AdvancedFlagging/issues/16
                const copypastorIsRepost = copyPastorApi.getIsRepost();
                const copypastorId = copyPastorApi.getCopyPastorId();
                if (!flagType.Enabled(copypastorIsRepost, copypastorId))
                    continue;
                globals.showElement(reportLink);
                reportLink.text(flagType.DisplayName);
                dropdownItem.append(reportLink);
                categoryDiv.append(dropdownItem);
                dropDown.append(categoryDiv);
                let commentText;
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
                        await handleFlagAndComment(post.postId, flagType, flagBox.is(':checked'), copyPastorApi, reportedIcon, shouldRaiseVlq, commentText);
                    }
                    if (flagType.ReportType === 'NoFlag') {
                        performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                        globals.showElement(performedActionIcon);
                    }
                    handleFlag(flagType, reporters);
                    globals.hideElement(dropDown); // hide the dropdown after clicking one of the options
                });
            }
            if (categoryDiv.html())
                dropDown.append(globals.divider.clone()); // at least one option exists for the category
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
    function handleFlag(flagType, reporters) {
        const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
        const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer' || flagType.ReportType === 'PostLowQuality';
        const customFlag = flagType.ReportType === 'PostOther';
        const noFlag = flagType.ReportType === 'NoFlag';
        reporters.forEach(reporter => {
            let promise = null;
            if (rudeFlag) {
                promise = reporter.ReportRedFlag();
            }
            else if (naaFlag) {
                promise = reporter.ReportNaa();
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
        sotools_1.parseQuestionsAndAnswers(post => {
            if (!post.element.length)
                return;
            const questionTime = post.type === 'Answer' ? post.questionTime : post.creationDate;
            const answerTime = post.type === 'Answer' ? post.creationDate : null;
            const iconLocation = post.page === 'Question'
                ? post.element.find('.js-post-menu').children().first()
                : post.element.find(`a.${post.type === 'Question' ? 'question' : 'answer'}-hyperlink`);
            const advancedFlaggingLink = globals.advancedFlaggingLink.clone();
            if (post.page === 'Question')
                iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));
            const nattyIcon = globals.nattyIcon.clone();
            const copyPastorIcon = globals.guttenbergIcon.clone();
            const smokeyIcon = globals.smokeyIcon.clone();
            const copyPastorApi = new CopyPastorAPI_1.CopyPastorAPI(post.postId);
            const reporters = [];
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
                    handleFlag(flagType, reporters);
                    displaySuccessFlagged(reportedIcon, flagType.Human);
                });
                iconLocation.append(performedActionIcon, reportedIcon, nattyIcon, copyPastorIcon, smokeyIcon);
                const linkDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationLinkDisabled);
                if (linkDisabled)
                    return;
                const shouldRaiseVlq = globals.qualifiesForVlq(post.score, answerTime || new Date());
                const dropDown = BuildFlaggingDialog(post, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi, shouldRaiseVlq);
                advancedFlaggingLink.append(dropDown);
                const openOnHover = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationOpenOnHover);
                if (openOnHover) {
                    advancedFlaggingLink.hover(event => {
                        event.stopPropagation();
                        if (event.target === advancedFlaggingLink.get(0))
                            globals.showElement(dropDown);
                    }).mouseleave(e => {
                        e.stopPropagation();
                        setTimeout(() => globals.hideElement(dropDown), 100); // avoid immediate closing of the popover
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
            else {
                iconLocation.after(smokeyIcon, copyPastorIcon, nattyIcon, reportedIcon, performedActionIcon);
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
        SetupCommentsAndFlags();
        SetupPostPage();
        SetupStyles();
        void Configuration_1.SetupConfiguration();
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
                const questionTime = globals.parseDate($('.post-signature.owner .user-action-time span', content).attr('title'));
                const answerTime = globals.parseDate($('.user-info .user-action-time span', content).attr('title'));
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
            const flagType = {
                Id: 0,
                ReportType: 'AnswerNotAnAnswer',
                DisplayName: 'AnswerNotAnAnswer'
            };
            handleFlag(flagType, [setupNattyApi(postId)]);
        });
    }
    $(() => {
        let started = false;
        function actionWatcher() {
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
        if (document.hasFocus && document.hasFocus())
            actionWatcher();
    });
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 1 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.flagCategories = void 0;
    const getRepLevel = (reputation, max) => reputation > max ? 'High' : 'Low';
    exports.flagCategories = [
        {
            IsDangerous: true,
            AppliesTo: ['Answer', 'Question'],
            FlagTypes: [
                {
                    Id: 1,
                    DisplayName: 'Spam',
                    ReportType: 'PostSpam',
                    Human: 'as spam',
                    Enabled: () => true
                },
                {
                    Id: 2,
                    DisplayName: 'Rude or Abusive',
                    ReportType: 'PostOffensive',
                    Human: 'as R/A',
                    Enabled: () => true
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
                    Enabled: (isRepost, copypastorId) => !isRepost && Boolean(copypastorId),
                    GetCustomFlagText: (target, postId) => globals.getFullFlag('Plagiarism', target, postId)
                },
                {
                    Id: 4,
                    DisplayName: 'Duplicate answer',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (isRepost, copypastorId) => isRepost && Boolean(copypastorId),
                    GetCustomFlagText: (target, postId) => globals.getFullFlag('DuplicateAnswer', target, postId)
                },
                {
                    Id: 5,
                    DisplayName: 'Bad attribution',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (isRepost, copypastorId) => !isRepost && Boolean(copypastorId),
                    GetCustomFlagText: (target, postId) => globals.getFullFlag('BadAttribution', target, postId)
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
                    ReportType: 'PostLowQuality',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment('LinkOnly', userDetails.AuthorName)
                },
                {
                    Id: 7,
                    DisplayName: 'Not an answer',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(`NAA${getRepLevel(userDetails.Reputation, 50)}Rep`, userDetails.AuthorName)
                },
                {
                    Id: 8,
                    DisplayName: 'Thanks',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(`Thanks${getRepLevel(userDetails.Reputation, 50)}Rep`, userDetails.AuthorName)
                },
                {
                    Id: 9,
                    DisplayName: 'Me too',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment('MeToo', userDetails.AuthorName)
                },
                {
                    Id: 10,
                    DisplayName: 'Library',
                    ReportType: 'PostLowQuality',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment('Library', userDetails.AuthorName)
                },
                {
                    Id: 11,
                    DisplayName: 'Comment',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(`Comment${getRepLevel(userDetails.Reputation, 50)}Rep`, userDetails.AuthorName)
                },
                {
                    Id: 12,
                    DisplayName: 'Duplicate',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment('Duplicate', userDetails.AuthorName)
                },
                {
                    Id: 13,
                    DisplayName: 'Non English',
                    ReportType: 'PostLowQuality',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment('NonEnglish', userDetails.AuthorName)
                },
                {
                    Id: 14,
                    DisplayName: 'Should be an edit',
                    ReportType: 'AnswerNotAnAnswer',
                    Human: 'as NAA',
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment('ShouldBeAnEdit', userDetails.AuthorName)
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
                    ReportType: 'NoFlag',
                    Enabled: () => true
                },
                {
                    Id: 16,
                    DisplayName: 'Needs Editing',
                    ReportType: 'NoFlag',
                    Enabled: () => true
                },
                {
                    Id: 17,
                    DisplayName: 'Vandalism',
                    ReportType: 'NoFlag',
                    Enabled: () => true
                }
            ]
        }
    ];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 2 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(0), __webpack_require__(3)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, AdvancedFlagging_1, GreaseMonkeyCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.parseDate = exports.qualifiesForVlq = exports.getFullFlag = exports.getFullComment = exports.getAllPostIds = exports.addXHRListener = exports.showConfirmModal = exports.Delay = exports.showMSTokenPopupAndGet = exports.editCommentsPopup = exports.inlineCheckboxesWrapper = exports.overlayModal = exports.flagsWrapper = exports.commentsWrapper = exports.editContentWrapper = exports.commentsLink = exports.commentsDiv = exports.configurationLink = exports.configurationDiv = exports.advancedFlaggingLink = exports.gridCellDiv = exports.plainDiv = exports.dropdownItem = exports.reportLink = exports.popoverArrow = exports.dropDown = exports.popupWrapper = exports.divider = exports.reportedIcon = exports.performedActionIcon = exports.getConfigHtml = exports.getOptionLabel = exports.getCategoryDiv = exports.getOptionBox = exports.getSectionWrapper = exports.getMessageDiv = exports.smokeyIcon = exports.guttenbergIcon = exports.nattyIcon = exports.getFormDataFromObject = exports.getParamsFromObject = exports.displayError = exports.displaySuccess = exports.showInlineElement = exports.hideElement = exports.showElement = exports.getFlagsUrlRegex = exports.flagsUrlRegex = exports.isDeleteVoteRegex = exports.isReviewItemRegex = exports.popupDelay = exports.displayStacksToast = exports.getAllComments = exports.getAllFlags = exports.storeFlagsInCache = exports.storeCommentInCache = exports.getFlagFromCache = exports.getCommentFromCache = exports.getFlagKey = exports.getCommentKey = exports.comments = exports.flags = exports.CommentsAddAuthorName = exports.MetaSmokeDisabledConfig = exports.MetaSmokeUserKeyConfig = exports.CacheChatApiFkey = exports.ConfigurationLinkDisabled = exports.ConfigurationEnabledFlags = exports.ConfigurationWatchQueues = exports.ConfigurationWatchFlags = exports.ConfigurationDefaultNoComment = exports.ConfigurationDefaultNoFlag = exports.ConfigurationOpenOnHover = exports.isFlagsPage = exports.isQuestionPage = exports.isNatoPage = exports.isStackOverflow = exports.settingUpBody = exports.settingUpTitle = exports.dayMillis = exports.username = exports.nattyAllReportsUrl = exports.placeholderCopypastorLink = exports.placeholderTarget = exports.genericBotKey = exports.copyPastorServer = exports.copyPastorKey = exports.metasmokeApiFilter = exports.metaSmokeKey = exports.soboticsRoomId = void 0;
    // Constants
    exports.soboticsRoomId = 111347;
    exports.metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
    exports.metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
    exports.copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
    exports.copyPastorServer = 'https://copypastor.sobotics.org';
    exports.genericBotKey = 'Cm45BSrt51FR3ju';
    exports.placeholderTarget = /\$TARGET\$/g;
    exports.placeholderCopypastorLink = /\$COPYPASTOR\$/g;
    exports.nattyAllReportsUrl = 'https://logs.sobotics.org/napi/api/stored/all';
    exports.username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
    exports.dayMillis = 1000 * 60 * 60 * 24;
    exports.settingUpTitle = 'Setting up MetaSmoke';
    exports.settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
        + 'To reset configuration, see the footer of Stack Overflow.';
    const nattyImage = 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1';
    const guttenbergImage = 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1';
    const smokeyImage = 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1';
    exports.isStackOverflow = Boolean(/^https:\/\/stackoverflow.com/.exec(window.location.href));
    exports.isNatoPage = Boolean(/\/tools\/new-answers-old-questions/.exec(window.location.href));
    exports.isQuestionPage = Boolean(/\/questions\/\d+.*/.exec(window.location.href));
    exports.isFlagsPage = Boolean(/\/users\/flag-summary\//.exec(window.location.href));
    // Cache keys
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
    exports.CommentsAddAuthorName = 'AdvancedFlagging.Comments.AddAuthorName';
    // Text for mod flags
    exports.flags = {
        Plagiarism: 'Possible plagiarism of another answer $TARGET$, as can be seen here $COPYPASTOR$',
        DuplicateAnswer: 'The answer is a repost of their other answer $TARGET$, but as there are slight differences '
            + '(see $COPYPASTOR$), an auto flag would not be raised.',
        BadAttribution: 'This post is copied from [another answer]($TARGET$), as can be seen here $COPYPASTOR$. The author only added a link'
            + ' to the other answer, which is [not the proper way of attribution](//stackoverflow.blog/2009/06/25/attribution-required).'
    };
    // Auto comments
    exports.comments = {
        DuplicateAnswer: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227). Answer the best one "
            + 'and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer '
            + 'and tailor the post to the question.',
        LinkOnly: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
            + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
            + 'have some idea what it is and why it is there, then quote the most relevant part of the page you are linking to '
            + 'in case the target page is unavailable. [Answers that are little more than a link may be deleted.](/help/deleted-answers)',
        NAALowRep: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
            + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
            + 'If you have a related but different question, [ask a new question](/questions/ask), '
            + 'and include a link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
        NAAHighRep: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be '
            + 'an explicit attempt to *answer* this question; if you have a critique or need a clarification of '
            + 'the question or another answer, you can [post a comment](/help/privileges/comment) '
            + '(like this one) directly below it. Please remove this answer and create either a comment or a new question. '
            + 'See: [Ask questions, get answers, no distractions](/tour).',
        ThanksLowRep: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
            + 'and can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) '
            + 'enough [reputation](/help/whats-reputation), you will gain privileges to '
            + '[upvote answers](/help/privileges/vote-up) you like. This way future visitors of the question '
            + 'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. '
            + 'See [Why is voting important](/help/why-vote).',
        ThanksHighRep: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
            + 'and can be perceived as noise by its future visitors. Instead, [upvote answers](/help/privileges/vote-up) '
            + 'you like. This way future visitors of the question will see a higher vote count on that answer, '
            + 'and the answerer will also be rewarded with reputation points. See [Why is voting important](/help/why-vote).',
        MeToo: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
            + 'If you have a different but related question, then [ask](/questions/ask) it '
            + '(reference this one if it will help provide context). If you are interested in this specific question, '
            + 'you can [upvote](/help/privileges/vote-up) it, leave a [comment](/help/privileges/comment), '
            + 'or start a [bounty](/help/privileges/set-bounties) once you have enough [reputation](/help/whats-reputation).',
        Library: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
            + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
        CommentLowRep: 'This does not provide an answer to the question. Once you have sufficient [reputation](/help/whats-reputation) '
            + 'you will be able to [comment on any post](/help/privileges/comment); instead, '
            + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
        CommentHighRep: 'This does not provide an answer to the question. Please write a comment instead.',
        Duplicate: 'Instead of posting an answer which merely links to another answer, please instead '
            + '[flag the question](/help/privileges/flag-posts) as a duplicate.',
        NonEnglish: 'Please write your answer in English, as Stack Overflow is an [English-only site](//meta.stackoverflow.com/a/297680).',
        ShouldBeAnEdit: 'Please use the edit link on your question to add additional information. '
            + 'The "Post Answer" button should be used only for complete answers to the question.'
    };
    // helper functions for retrieving flags & comments from cache
    const getCommentKey = (name) => 'AdvancedFlagging.Configuration.Comments.' + name;
    exports.getCommentKey = getCommentKey;
    const getFlagKey = (name) => 'AdvancedFlagging.Configuration.Flags.' + name;
    exports.getFlagKey = getFlagKey;
    const getCommentFromCache = (name) => GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.getCommentKey(name));
    exports.getCommentFromCache = getCommentFromCache;
    const getFlagFromCache = (name) => GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.getFlagKey(name));
    exports.getFlagFromCache = getFlagFromCache;
    const storeCommentInCache = (array) => GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(exports.getCommentKey(array[0]), array[1]);
    exports.storeCommentInCache = storeCommentInCache;
    const storeFlagsInCache = (array) => GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(exports.getFlagKey(array[0]), array[1]);
    exports.storeFlagsInCache = storeFlagsInCache;
    const getAllFlags = () => Object.keys(exports.flags).map(item => ({ flagName: item, content: exports.getFlagFromCache(item) }));
    exports.getAllFlags = getAllFlags;
    const getAllComments = () => Object.keys(exports.comments).map(item => ({ commentName: item, content: exports.getCommentFromCache(item) }));
    exports.getAllComments = getAllComments;
    const displayStacksToast = (message, type) => StackExchange.helpers.showToast(message, { type: type });
    exports.displayStacksToast = displayStacksToast;
    // regexes
    exports.popupDelay = 4000;
    exports.isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
    exports.isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
    exports.flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
    const getFlagsUrlRegex = (postId) => new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther|PostLowQuality)`);
    exports.getFlagsUrlRegex = getFlagsUrlRegex;
    // helper functions
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
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    const getParamsFromObject = (object) => Object.entries(object).map(item => item.join('=')).join('&');
    exports.getParamsFromObject = getParamsFromObject;
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    const getFormDataFromObject = (object) => Object.keys(object).reduce((formData, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        formData.append(key, object[key]);
        return formData;
    }, new FormData());
    exports.getFormDataFromObject = getFormDataFromObject;
    const getCopypastorLink = (postId) => `https://copypastor.sobotics.org/posts/${postId}`;
    // jQuery icon elements
    const sampleIcon = $('<a>').attr('class', 's-avatar s-avatar__16 s-user-card--avatar d-none')
        .addClass(/\/users\/flag-summary/.exec(window.location.href) ? 'mx4 my2' : 'm4')
        .append($('<img>').addClass('s-avatar--image'));
    exports.nattyIcon = sampleIcon.clone().attr('title', 'Reported by Natty').find('img').attr('src', nattyImage).parent();
    exports.guttenbergIcon = sampleIcon.clone().attr('title', 'Reported by Guttenberg').find('img').attr('src', guttenbergImage).parent();
    exports.smokeyIcon = sampleIcon.clone().attr('title', 'Reported by Smokey').find('img').attr('src', smokeyImage).parent();
    // dynamically generated jQuery elements based on the parameters passed
    const getMessageDiv = (message, state) => $('<div>').attr('class', 'p12 bg-' + state).text(message);
    exports.getMessageDiv = getMessageDiv;
    const getSectionWrapper = (name) => $('<fieldset>').attr('class', `grid gs8 gsy fd-column af-section-${name.toLowerCase()}`)
        .html(`<h2 class="grid--cell">${name}</h2>`);
    exports.getSectionWrapper = getSectionWrapper;
    const getOptionBox = (name) => $('<input>').attr('type', 'checkbox').attr('name', name).attr('id', name).attr('class', 's-checkbox');
    exports.getOptionBox = getOptionBox;
    const getCategoryDiv = (red) => $('<div>').attr('class', `advanced-flagging-category bar-md${red ? ' bg-red-200' : ''}`);
    exports.getCategoryDiv = getCategoryDiv;
    const getOptionLabel = (text, name) => $('<label>').text(text).attr('for', name).attr('class', 's-label ml4 va-middle fs-body1 fw-normal');
    exports.getOptionLabel = getOptionLabel;
    const getConfigHtml = (optionId, text) => $(`
<div>
  <div class="grid gs4">
    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="grid--cell s-label fw-normal" for="${optionId}">${text}</label>
  </div>
</div>`);
    exports.getConfigHtml = getConfigHtml;
    const performedActionIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.CheckmarkSm().addClass('fc-green-500'));
    exports.performedActionIcon = performedActionIcon;
    const reportedIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.Flag().addClass('fc-red-500'));
    exports.reportedIcon = reportedIcon;
    exports.divider = $('<hr>').attr('class', 'my8');
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
    exports.commentsDiv = exports.configurationDiv.clone().removeClass('advanced-flagging-configuration-div').addClass('af-comments-div');
    exports.commentsLink = exports.configurationLink.clone().attr('id', 'af-comments-button').text('AdvancedFlagging: edit comments and flags');
    exports.editContentWrapper = $('<div>').attr('class', 'grid grid__fl1 md:fd-column gs16');
    const commentsHeader = $('<h2>').attr('class', 'ta-center mb8').text('Comments');
    const flagsHeader = $('<h2>').attr('class', 'ta-center mb8').text('Flags');
    exports.commentsWrapper = $('<div>').attr('class', 'af-comments-content grid--cell').append(commentsHeader);
    exports.flagsWrapper = $('<div>').attr('class', 'af-flags-content grid--cell').append(flagsHeader);
    exports.overlayModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full w60 sm:w100" role="document">
    <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>
    <div class="s-modal--body fs-body2" id="af-modal-description"></div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>
      <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
  </div>
</aside>`);
    const grid = $('<div>').attr('class', 'grid lg:grid md:fd-column sm:fd-column');
    exports.inlineCheckboxesWrapper = exports.gridCellDiv.clone().addClass('grid--cell lg:grid--cell md:m0 sm:m0').append(grid.clone());
    const metasmokeTokenPopup = $(`
<aside class="s-modal" id="af-ms-token" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full sm:w100 md:w100" role="document">
    <h1 class="s-modal--header fw-bold " id="af-modal-title">Authenticate MS with AF</h1>
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
    exports.editCommentsPopup = $(`
<aside class="s-modal" id="af-comments" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full lg:w75 md:w75 sm:w100 w75" role="document">
    <h1 class="s-modal--header fw-body c-movey" id="af-comments-title">AdvancedFlagging: edit comments and flags</h1>
    <div class="s-modal--body fs-body2" id="af-comments-description"></div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" type="button" data-action="s-modal#hide">I'm done!</button>
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
        // eslint-disable-next-line @typescript-eslint/unbound-method
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
    function getAllPostIds(includeQuestion, urlForm) {
        return $(exports.isQuestionPage ? '.question, .answer' : '.flagged-post').get().map(item => {
            const el = $(item);
            const postType = (exports.isQuestionPage ? el.attr('data-questionid') : el.find('.question-hyperlink').length) ? 'Question' : 'Answer';
            if (!includeQuestion && postType === 'Question')
                return 0;
            const elementHref = el.find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
            let postId;
            if (elementHref) { // We're on flags page. We have to fetch the post id from the post URL
                postId = Number(postType === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
            }
            else { // instead, on the question page, the element has a data-questionid or data-answerid attribute with the post id
                postId = Number(el.attr('data-questionid') || el.attr('data-answerid'));
            }
            return urlForm ? `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}` : postId;
        }).filter(postId => postId); // remove null/empty values
    }
    exports.getAllPostIds = getAllPostIds;
    // For GetComment() on FlagTypes. Adds the author name before the comment if the option is enabled
    function getFullComment(name, authorName) {
        const shouldAddAuthorName = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.CommentsAddAuthorName);
        const comment = exports.getCommentFromCache(name);
        return comment && shouldAddAuthorName ? `${authorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment;
    }
    exports.getFullComment = getFullComment;
    // For GetCustomFlagText() on FlagTypes. Replaces the placeholders with actual values
    function getFullFlag(name, target, postId) {
        const flagContent = exports.getFlagFromCache(name);
        if (!flagContent)
            return;
        return flagContent.replace(exports.placeholderTarget, target).replace(exports.placeholderCopypastorLink, getCopypastorLink(postId));
    }
    exports.getFullFlag = getFullFlag;
    function qualifiesForVlq(postScore, creationDate) {
        return postScore <= 0 && (new Date().valueOf() - creationDate.valueOf()) < exports.dayMillis;
    }
    exports.qualifiesForVlq = qualifiesForVlq;
    function parseDate(dateStr) {
        // Fix for safari
        return dateStr ? new Date(dateStr.replace(' ', 'T')) : null;
    }
    exports.parseDate = parseDate;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 3 */
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
            const jsonItem = GM_getValue(cacheKey, null);
            if (!jsonItem)
                return null;
            const dataItem = JSON.parse(jsonItem);
            if (dataItem.Expires && new Date(dataItem.Expires) < new Date())
                return null;
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
/* 4 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.parseQuestionsAndAnswers = void 0;
    $.event.special.destroyed = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        remove: (o) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (o.handler)
                o.handler();
        }
    };
    function parseNatoPage(callback) {
        $('.answer-hyperlink').parent().parent().each((_index, element) => {
            const node = $(element);
            const answerHref = node.find('.answer-hyperlink').attr('href');
            if (!answerHref)
                return;
            const postId = Number(answerHref.split('#')[1]);
            const creationDate = parseActionDate(node.find('.user-action-time'));
            const questionTime = parseActionDate(node.find('td .relativetime'));
            if (!creationDate || !questionTime)
                return;
            const authorReputation = parseReputation(node.find('.reputation-score'));
            const authorName = parseAuthorDetails(node.find('.user-details'));
            callback({
                type: 'Answer',
                element: node,
                page: 'NATO',
                postId,
                creationDate,
                questionTime,
                authorReputation,
                authorName
            });
        });
    }
    function getPostDetails(node) {
        const score = Number(node.find('.js-vote-count').text());
        const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
        const authorName = parseAuthorDetails(node.find('.user-info .user-details').last());
        const creationDate = parseActionDate(node.find('.user-info .relativetime').last());
        return { score, authorReputation, authorName, creationDate };
    }
    function parseAnswerDetails(aNode, callback, questionTime) {
        const answerIdString = aNode.attr('data-answerid');
        if (!answerIdString)
            return;
        const answerId = Number(answerIdString);
        const postDetails = getPostDetails(aNode);
        if (!postDetails.creationDate)
            return;
        aNode.find('.answercell').bind('destroyed', () => {
            setTimeout(() => {
                const updatedAnswerNode = $(`#answer-${answerId}`);
                parseAnswerDetails(updatedAnswerNode, callback, questionTime);
            });
        });
        callback({
            type: 'Answer',
            element: aNode,
            page: 'Question',
            postId: answerId,
            questionTime,
            creationDate: postDetails.creationDate,
            score: postDetails.score,
            authorReputation: postDetails.authorReputation,
            authorName: postDetails.authorName
        });
    }
    function parseQuestionPage(callback) {
        let question;
        const parseQuestionDetails = (qNode) => {
            const questionIdString = qNode.attr('data-questionid');
            if (!questionIdString)
                return;
            const postId = Number(questionIdString);
            const postDetails = getPostDetails(qNode);
            if (!postDetails.creationDate)
                return;
            qNode.find('.postcell').bind('destroyed', () => {
                setTimeout(() => {
                    const updatedQuestionNode = $(`[data-questionid="${postId}"]`);
                    parseQuestionDetails(updatedQuestionNode);
                });
            });
            callback(question = {
                type: 'Question',
                element: qNode,
                page: 'Question',
                postId,
                creationDate: postDetails.creationDate,
                score: postDetails.score,
                authorReputation: postDetails.authorReputation,
                authorName: postDetails.authorName
            });
        };
        const questionNode = $('.question');
        parseQuestionDetails(questionNode);
        $('.answer').each((_index, element) => parseAnswerDetails($(element), callback, question.creationDate));
    }
    function parseFlagsPage(callback) {
        $('.flagged-post').each((_index, nodeEl) => {
            const node = $(nodeEl);
            const type = node.find('.answer-hyperlink').length ? 'Answer' : 'Question';
            const elementHref = node.find(`.${type.toLowerCase()}-hyperlink`).attr('href');
            if (!elementHref)
                return;
            const postId = Number(type === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
            const authorName = parseAuthorDetails(node.find('.post-user-info'));
            const creationDate = parseActionDate(node.find('.post-user-info .relativetime'));
            if (!creationDate)
                return;
            callback({
                type: type,
                element: node,
                page: 'Flags',
                postId,
                creationDate,
                authorName,
                questionTime: null
            });
        });
    }
    function parseQuestionsAndAnswers(callback) {
        if (globals.isNatoPage) {
            parseNatoPage(callback);
        }
        else if (globals.isQuestionPage) {
            parseQuestionPage(callback);
        }
        else if (globals.isFlagsPage) {
            parseFlagsPage(callback);
        }
    }
    exports.parseQuestionsAndAnswers = parseQuestionsAndAnswers;
    function parseReputation(reputationDiv) {
        let reputationText = reputationDiv.text();
        const reputationDivTitle = reputationDiv.attr('title');
        if (!reputationDivTitle)
            return 0;
        if (reputationText.indexOf('k') !== -1) {
            reputationText = reputationDivTitle.substr('reputation score '.length);
        }
        reputationText = reputationText.replace(',', '');
        return Number(reputationText);
    }
    function parseAuthorDetails(authorDiv) {
        const userLink = authorDiv.find('a');
        const authorName = userLink.text();
        return authorName;
    }
    function parseActionDate(actionDiv) {
        return globals.parseDate((actionDiv.hasClass('relativetime') ? actionDiv : actionDiv.find('.relativeTime')).attr('title'));
    }
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 5 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(6), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ChatApi_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.NattyAPI = void 0;
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
            return new Promise((resolve, reject) => {
                if (!globals.isStackOverflow)
                    resolve();
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${globals.nattyAllReportsUrl}`,
                    onload: (response) => {
                        if (response.status !== 200)
                            reject();
                        const result = JSON.parse(response.responseText);
                        const allStoredIds = result.items.map((item) => Number(item.name));
                        const answerIds = globals.getAllPostIds(false, false);
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
        async ReportNaa() {
            if (this.answerDate < this.questionDate)
                return false;
            if (this.WasReported()) {
                await this.chat.SendMessage(`${this.feedbackMessage} tp`);
                return true;
            }
            else {
                const answerAge = this.DaysBetween(this.answerDate, new Date());
                const daysPostedAfterQuestion = this.DaysBetween(this.questionDate, this.answerDate);
                if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30)
                    return false;
                await this.chat.SendMessage(this.reportMessage);
                return true;
            }
        }
        async ReportRedFlag() {
            if (!this.WasReported())
                return false;
            await this.chat.SendMessage(`${this.feedbackMessage} tp`);
            return true;
        }
        async ReportLooksFine() {
            if (!this.WasReported())
                return false;
            await this.chat.SendMessage(`${this.feedbackMessage} fp`);
            return true;
        }
        async ReportNeedsEditing() {
            if (!this.WasReported())
                return false;
            await this.chat.SendMessage(`${this.feedbackMessage} ne`);
            return true;
        }
        ReportVandalism() {
            return Promise.resolve(false);
        }
        ReportDuplicateAnswer() {
            return Promise.resolve(false);
        }
        ReportPlagiarism() {
            return Promise.resolve(false);
        }
        DaysBetween(first, second) {
            return (second.valueOf() - first.valueOf()) / globals.dayMillis;
        }
    }
    exports.NattyAPI = NattyAPI;
    NattyAPI.nattyIds = [];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 6 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, globals) {
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
        GetChannelFKey(roomId) {
            const expiryDate = ChatApi.GetExpiryDate();
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(globals.CacheChatApiFkey, () => new Promise((resolve, reject) => {
                this.GetChannelPage(roomId).then(channelPage => {
                    const fkeyElement = $(channelPage).filter('#fkey');
                    const fkey = fkeyElement.val();
                    if (!fkey)
                        return;
                    resolve(fkey.toString());
                }).catch(() => reject());
            }), expiryDate);
        }
        GetChatUserId() {
            return StackExchange.options.user.userId;
        }
        SendMessage(message, roomId = globals.soboticsRoomId) {
            return new Promise((resolve, reject) => {
                const requestFunc = async () => {
                    const fkey = await this.GetChannelFKey(roomId);
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                        onload: (chatResponse) => {
                            chatResponse.status === 200 ? resolve() : onFailure();
                        },
                        onerror: () => {
                            onFailure();
                        },
                    });
                };
                let numTries = 0;
                const onFailure = () => {
                    numTries++;
                    if (numTries < 3) {
                        GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(globals.CacheChatApiFkey);
                        void requestFunc();
                    }
                    else {
                        reject();
                    }
                };
                void requestFunc();
            });
        }
        GetChannelPage(roomId) {
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
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 7 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.GenericBotAPI = void 0;
    class GenericBotAPI {
        constructor(answerId) {
            this.name = 'Generic Bot';
            this.answerId = answerId;
        }
        async ReportNaa() {
            return await this.makeTrackRequest();
        }
        async ReportRedFlag() {
            return await this.makeTrackRequest();
        }
        ReportLooksFine() {
            return Promise.resolve(false);
        }
        ReportNeedsEditing() {
            return Promise.resolve(false);
        }
        ReportVandalism() {
            return Promise.resolve(false);
        }
        ReportDuplicateAnswer() {
            return Promise.resolve(false);
        }
        ReportPlagiarism() {
            return Promise.resolve(false);
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
                if (!globals.isStackOverflow)
                    resolve(false);
                const flaggerName = encodeURIComponent(globals.username || '');
                if (!flaggerName)
                    resolve(false);
                const contentHash = this.computeContentHash($(`#answer-${this.answerId} .js-post-body`).html().trim());
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://so.floern.com/api/trackpost.php',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: `key=${globals.genericBotKey}&postId=${this.answerId}&contentHash=${contentHash}&flagger=${flaggerName}`,
                    onload: (response) => {
                        if (response.status !== 200)
                            reject(false);
                        resolve(true);
                    },
                    onerror: () => {
                        reject(false);
                    }
                });
            });
        }
    }
    exports.GenericBotAPI = GenericBotAPI;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 8 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.MetaSmokeAPI = void 0;
    class MetaSmokeAPI {
        constructor(postId, postType) {
            this.name = 'Smokey';
            this.postId = postId;
            this.postType = postType;
        }
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
        static async QueryMetaSmokeInternal() {
            const urls = globals.getAllPostIds(true, true);
            const urlString = urls.join(',');
            const isDisabled = MetaSmokeAPI.IsDisabled();
            if (isDisabled)
                return;
            const parameters = globals.getParamsFromObject({
                urls: urlString,
                key: `${MetaSmokeAPI.appKey}`,
                per_page: 1000,
                filter: globals.metasmokeApiFilter // only include id and link fields
            });
            try {
                const metasmokeApiCall = await fetch(`https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls?${parameters}`);
                const metasmokeResult = await metasmokeApiCall.json();
                metasmokeResult.items.forEach(item => {
                    const postId = /\d+$/.exec(item.link);
                    if (!postId)
                        return;
                    MetaSmokeAPI.metasmokeIds.push({ sitePostId: Number(postId[0]), metasmokeId: item.id });
                });
            }
            catch (error) {
                globals.displayError('Failed to get Metasmoke URLs.');
                console.error(error);
            }
        }
        static GetQueryUrl(postId, postType) {
            return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
        }
        static async getUserKey() {
            while (typeof StackExchange.helpers.showConfirmModal === 'undefined') {
                // eslint-disable-next-line no-await-in-loop
                await globals.Delay(100);
            }
            return await GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(globals.MetaSmokeUserKeyConfig, async () => {
                const keyUrl = `https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`;
                const code = await MetaSmokeAPI.codeGetter(keyUrl);
                if (!code)
                    return '';
                const tokenCall = await fetch(`https://metasmoke.erwaysoftware.com/oauth/token?key=${MetaSmokeAPI.appKey}&code=${code}`);
                const data = await tokenCall.json();
                return data.token;
            });
        }
        static getSmokeyId(postId) {
            const metasmokeObject = MetaSmokeAPI.metasmokeIds.find(item => item.sitePostId === postId);
            return metasmokeObject ? metasmokeObject.metasmokeId : 0;
        }
        async ReportNaa() {
            const smokeyid = MetaSmokeAPI.getSmokeyId(this.postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'naa-');
            return true;
        }
        async ReportRedFlag() {
            const smokeyid = MetaSmokeAPI.getSmokeyId(this.postId);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'tpu-');
                return true;
            }
            const urlString = MetaSmokeAPI.GetQueryUrl(this.postId, this.postType);
            if (!MetaSmokeAPI.accessToken)
                return false;
            try {
                await fetch('https://metasmoke.erwaysoftware.com/api/w/post/report', {
                    method: 'POST',
                    body: globals.getFormDataFromObject({ post_link: urlString, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
                });
                return true;
            }
            catch (error) {
                return false;
            }
        }
        async ReportLooksFine() {
            const smokeyid = MetaSmokeAPI.getSmokeyId(this.postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        async ReportNeedsEditing() {
            const smokeyid = MetaSmokeAPI.getSmokeyId(this.postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'fp-');
            return true;
        }
        async ReportVandalism() {
            const smokeyid = MetaSmokeAPI.getSmokeyId(this.postId);
            if (!smokeyid)
                return false;
            await this.SendFeedback(smokeyid, 'tp-');
            return true;
        }
        ReportDuplicateAnswer() {
            return Promise.resolve(false);
        }
        ReportPlagiarism() {
            return Promise.resolve(false);
        }
        async SendFeedback(metaSmokeId, feedbackType) {
            if (!MetaSmokeAPI.accessToken)
                return;
            await fetch(`https://metasmoke.erwaysoftware.com/api/w/post/${metaSmokeId}/feedback`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ type: feedbackType, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
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
        return await globals.showMSTokenPopupAndGet();
    };
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 9 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(6), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ChatApi_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.CopyPastorAPI = void 0;
    class CopyPastorAPI {
        constructor(id) {
            this.name = 'Guttenberg';
            this.answerId = id;
        }
        static async getAllCopyPastorIds() {
            if (!globals.isStackOverflow)
                return;
            const postUrls = globals.getAllPostIds(false, true);
            await this.storeReportedPosts(postUrls);
        }
        static storeReportedPosts(postUrls) {
            return new Promise((resolve, reject) => {
                const url = `${globals.copyPastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    onload: (response) => {
                        const responseObject = JSON.parse(response.responseText);
                        if (responseObject.status === 'failure')
                            return;
                        responseObject.posts.forEach(item => {
                            this.copyPastorIds.push({ postId: Number(item.post_id), repost: item.repost, target_url: item.target_url });
                        });
                        resolve();
                    },
                    onerror: () => reject()
                });
            });
        }
        getCopyPastorId() {
            const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
            return idsObject ? idsObject.postId : 0;
        }
        getIsRepost() {
            const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
            return idsObject ? idsObject.repost : false;
        }
        getTargetUrl() {
            const idsObject = CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId);
            return idsObject ? idsObject.target_url : '';
        }
        async ReportTruePositive() {
            return await this.SendFeedback('tp');
        }
        async ReportFalsePositive() {
            return await this.SendFeedback('fp');
        }
        async ReportNaa() {
            return await this.ReportFalsePositive();
        }
        ReportRedFlag() {
            return Promise.resolve(false);
        }
        async ReportLooksFine() {
            return await this.ReportFalsePositive();
        }
        async ReportNeedsEditing() {
            return await this.ReportFalsePositive();
        }
        async ReportVandalism() {
            return await this.ReportFalsePositive();
        }
        async ReportDuplicateAnswer() {
            return await this.ReportTruePositive();
        }
        async ReportPlagiarism() {
            return await this.ReportTruePositive();
        }
        SendFeedback(type) {
            const username = globals.username;
            const chatId = new ChatApi_1.ChatApi().GetChatUserId();
            const copyPastorId = this.getCopyPastorId();
            if (!copyPastorId)
                return Promise.resolve(false);
            const payload = {
                post_id: copyPastorId,
                feedback_type: type,
                username,
                link: `https://chat.stackoverflow.com/users/${chatId}`,
                key: globals.copyPastorKey,
            };
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${globals.copyPastorServer}/feedback/create`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: Object.entries(payload).map(item => item.join('=')).join('&'),
                    onload: (response) => {
                        response.status === 200 ? resolve(true) : reject(false);
                    },
                    onerror: () => {
                        reject(false);
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(8), __webpack_require__(1), __webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MetaSmokeAPI_1, FlagTypes_1, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.SetupConfiguration = void 0;
    const configurationEnabledFlags = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
    async function SetupConfiguration() {
        while (typeof Svg === 'undefined') {
            // eslint-disable-next-line no-await-in-loop
            await globals.Delay(1000);
        }
        const bottomBox = $('.site-footer--copyright').children('.-list');
        const configurationDiv = globals.configurationDiv.clone();
        const commentsDiv = globals.commentsDiv.clone();
        SetupDefaults();
        BuildConfigurationOverlay();
        SetupCommentsAndFlagsModal();
        const configurationLink = globals.configurationLink.clone();
        const commentsLink = globals.commentsLink.clone();
        $(document).on('click', '#af-modal-button', () => Stacks.showModal(document.querySelector('#af-config')));
        $(document).on('click', '#af-comments-button', () => Stacks.showModal(document.querySelector('#af-comments')));
        configurationDiv.append(configurationLink);
        commentsDiv.append(commentsLink);
        configurationDiv.insertAfter(bottomBox);
        commentsDiv.insertAfter(bottomBox);
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
        const overlayModal = globals.overlayModal.clone();
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
                        return postId ? Number(/\d+/.exec(postId)) : 0;
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
            setTimeout(() => window.location.reload(), 500);
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
            const checkbox = createCheckbox(f.DisplayName, storedValue, `flag-type-${f.Id}`).children().eq(0);
            checkboxes.push(checkbox.addClass('w25 lg:w25 md:w100 sm:w100'));
        });
        return checkboxes;
    }
    function GetAdminConfigItems() {
        return [
            $('<a>').text('Clear Metasmoke Configuration').click(() => {
                MetaSmokeAPI_1.MetaSmokeAPI.Reset();
                globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
            }),
            $('<a>').text('Clear chat fkey').click(() => {
                GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(globals.CacheChatApiFkey);
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
    function createEditTextarea(type, displayName, cacheKey, content) {
        return $(`
<div class="s-sidebarwidget">
  <button class="s-sidebarwidget--action s-btn t4 r4 af-expandable-trigger"
          data-controller="s-expandable-control" aria-controls="${type}-${displayName}">Edit</button>
  <button class="s-sidebarwidget--action s-btn s-btn__primary t4 r6 af-submit-content d-none">Save</button>
  <div class="s-sidebarwidget--content d-block p12 fs-body2">${displayName}</div>
  <div class="s-expandable" id="${type}-${displayName}">
    <div class="s-expandable--content">
      <textarea class="grid--cell s-textarea ml8 mb8 fs-body2" rows="4" data-cache-key=${cacheKey}>${content || ''}</textarea>
    </div>
  </div>
</div>`);
    }
    function SetupCommentsAndFlagsModal() {
        const editCommentsPopup = globals.editCommentsPopup.clone();
        editCommentsPopup.find('.s-modal--close').append(Svg.ClearSm());
        const commentsWrapper = globals.commentsWrapper.clone();
        const flagsWrapper = globals.flagsWrapper.clone();
        const shouldAddAuthorName = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.CommentsAddAuthorName);
        editCommentsPopup.find('.s-modal--body')
            .append(globals.editContentWrapper.clone().append(commentsWrapper).append(flagsWrapper))
            .append(createCheckbox('Add OP\'s name before comments', Boolean(shouldAddAuthorName)).attr('class', 'af-author-name mt8'));
        const allFlags = globals.getAllFlags();
        const allComments = globals.getAllComments();
        allFlags.forEach(flag => {
            const textarea = createEditTextarea('flag', flag.flagName, globals.getFlagKey(flag.flagName), flag.content);
            flagsWrapper.append(textarea);
        });
        allComments.forEach(comment => {
            const textarea = createEditTextarea('comment', comment.commentName, globals.getCommentKey(comment.commentName), comment.content);
            commentsWrapper.append(textarea);
        });
        $(document).on('change', '.af-author-name', event => {
            GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.CommentsAddAuthorName, $(event.target).is(':checked'));
            globals.displayStacksToast('Preference updated', 'success');
        }).on('click', '.af-expandable-trigger', event => {
            const button = $(event.target);
            button.text(button.text() === 'Edit' ? 'Hide' : 'Edit');
            const element = button.next();
            element.hasClass('d-none') ? globals.showElement(element) : globals.hideElement(element);
        }).on('click', '.af-submit-content', event => {
            const element = $(event.target);
            const contentTextarea = element.next().next().find('textarea');
            const newContent = contentTextarea.val();
            const cacheKey = contentTextarea.attr('data-cache-key');
            if (!cacheKey)
                return;
            const displayName = element.next().text();
            GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(cacheKey, newContent);
            globals.displayStacksToast(displayName + ': content saved successfully', 'success');
            element.prev().click(); // hide the textarea
        });
        $('body').append(editCommentsPopup);
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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;