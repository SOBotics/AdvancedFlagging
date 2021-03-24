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
                    displaySuccessFlagged(reportedIcon, flag.ReportType);
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
    function displayToaster(message, state) {
        if (popupWrapper.hasClass('hide'))
            popupWrapper.empty(); // if the toaster is hidden, then remove any appended messages
        const messageDiv = globals.getMessageDiv(message, state);
        popupWrapper.append(messageDiv);
        popupWrapper.removeClass('hide').addClass('show');
        window.setTimeout(() => popupWrapper.removeClass('show').addClass('hide'), globals.popupDelay);
    }
    exports.displayToaster = displayToaster;
    function displaySuccessFlagged(reportedIcon, reportType) {
        if (!reportType)
            return;
        const flaggedMessage = `Flagged ${getHumanFromDisplayName(reportType)}`;
        void globals.attachPopover(reportedIcon[0], flaggedMessage, 'bottom-start');
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
    function increasePopoverWidth(reportLink) {
        const popoverId = reportLink.parent().attr('aria-describedby') || '';
        $(`#${popoverId}`).addClass('sm:wmn-initial md:wmn-initial wmn4');
    }
    function BuildFlaggingDialog(post, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi, shouldRaiseVlq, failedActionIcon) {
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
                        await handleFlagAndComment(post.postId, flagType, flagBox.is(':checked'), copyPastorApi, reportedIcon, shouldRaiseVlq, commentText);
                    }
                    globals.hideElement(dropDown); // hide the dropdown after clicking one of the options
                    const success = await handleFlag(flagType, reporters);
                    if (flagType.ReportType !== 'NoFlag')
                        return;
                    if (success) {
                        void globals.attachPopover(performedActionIcon[0], `Performed action: ${flagType.DisplayName}`, 'bottom-start');
                        globals.showElement(performedActionIcon);
                    }
                    else {
                        void globals.attachPopover(failedActionIcon[0], `Failed to perform action: ${flagType.DisplayName}`, 'bottom-start');
                        globals.showElement(failedActionIcon);
                    }
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
    async function handleFlag(flagType, reporters) {
        for (const reporter of reporters) {
            try {
                const promise = flagType.SendFeedback(reporter);
                // eslint-disable-next-line no-await-in-loop
                const promiseValue = await promise;
                if (!promiseValue)
                    continue;
                globals.displaySuccess(promiseValue);
            }
            catch (error) {
                globals.displayError(error.message);
                return false;
            }
        }
        return true;
    }
    let autoFlagging = false;
    function SetupPostPage() {
        const linkDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationLinkDisabled);
        if (linkDisabled)
            return;
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
            void globals.attachPopover(nattyIcon.find('a')[0], 'Reported by Natty', 'bottom-start');
            void globals.attachPopover(copyPastorIcon.find('a')[0], 'Reported by Guttenberg', 'bottom-start');
            void globals.attachPopover(smokeyIcon.find('a')[0], 'Reported by Smokey', 'bottom-start');
            const copyPastorApi = new CopyPastorAPI_1.CopyPastorAPI(post.postId);
            const reporters = [];
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
                const isEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationWatchFlags);
                globals.addXHRListener(xhr => {
                    if (!isEnabled || autoFlagging || xhr.status !== 200 || !globals.flagsUrlRegex.exec(xhr.responseURL))
                        return;
                    const matches = globals.getFlagsUrlRegex(post.postId).exec(xhr.responseURL);
                    if (!matches)
                        return;
                    const flagTypes = FlagTypes_1.flagCategories.flatMap(category => category.FlagTypes);
                    const flagType = flagTypes.find(item => item.ReportType === matches[1]);
                    if (!flagType)
                        return;
                    displaySuccessFlagged(reportedIcon, flagType.ReportType);
                    void handleFlag(flagType, reporters);
                });
                iconLocation.append(performedActionIcon, reportedIcon, failedActionIcon, nattyIcon, copyPastorIcon, smokeyIcon);
                const shouldRaiseVlq = globals.qualifiesForVlq(post.score, answerTime || new Date());
                const dropDown = BuildFlaggingDialog(post, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi, shouldRaiseVlq, failedActionIcon);
                advancedFlaggingLink.append(dropDown);
                const openOnHover = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationOpenOnHover);
                if (openOnHover) {
                    advancedFlaggingLink.on('mouseover', event => {
                        event.stopPropagation();
                        if (event.target === advancedFlaggingLink.get(0))
                            globals.showElement(dropDown);
                    }).on('mouseleave', e => {
                        e.stopPropagation();
                        setTimeout(() => globals.hideElement(dropDown), 200); // avoid immediate closing of the popover
                    });
                }
                else {
                    advancedFlaggingLink.on('click', event => {
                        event.stopPropagation();
                        if (event.target === advancedFlaggingLink.get(0))
                            globals.showElement(dropDown);
                    });
                    $(window).on('click', () => globals.hideElement(dropDown));
                }
            }
            else {
                iconLocation.after(smokeyIcon, copyPastorIcon, nattyIcon);
            }
        });
    }
    function Setup() {
        // Collect all ids
        void Promise.all([
            MetaSmokeAPI_1.MetaSmokeAPI.Setup(globals.metaSmokeKey),
            MetaSmokeAPI_1.MetaSmokeAPI.QueryMetaSmokeInternal(),
            CopyPastorAPI_1.CopyPastorAPI.getAllCopyPastorIds(),
            NattyApi_1.NattyAPI.getAllNattyIds()
        ]).then(() => SetupPostPage());
        SetupStyles();
        void globals.waitForSvg().then(() => Configuration_1.SetupConfiguration());
        $('body').append(popupWrapper);
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
            const postId = Number(postIdStr);
            const currentPostDetails = postDetails[postId];
            if (!currentPostDetails || !$('.answers-subheader').length)
                return;
            const flagType = FlagTypes_1.flagCategories[2].FlagTypes[1]; // the not an answer flag type
            void handleFlag(flagType, [setupNattyApi(postId)]);
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
        $(window).on('focus', actionWatcher);
        // Or we have mouse movement
        $(window).on('mousemove', actionWatcher);
        // Or the document is already focused,
        // Then we execute the script.
        // This is done to prevent DOSing dashboard apis, if a bunch of links are opened at once.
        if (document.hasFocus?.())
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
    const getRepLevel = (reputation, max = 50) => reputation > max ? 'High' : 'Low';
    exports.flagCategories = [
        {
            IsDangerous: true,
            AppliesTo: ['Answer', 'Question'],
            FlagTypes: [
                {
                    Id: 1,
                    DisplayName: 'Spam',
                    DefaultReportType: 'PostSpam',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => true,
                    SendFeedback: (reporter) => reporter.ReportRedFlag()
                },
                {
                    Id: 2,
                    DisplayName: 'Rude or Abusive',
                    DefaultReportType: 'PostOffensive',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => true,
                    SendFeedback: (reporter) => reporter.ReportRedFlag()
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
                    DefaultReportType: 'PostOther',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: (isRepost, copypastorId) => !isRepost && Boolean(copypastorId),
                    GetCustomFlagText: (target, postId) => globals.getFullFlag(3, target, postId),
                    DefaultFlagText: 'Possible plagiarism of another answer $TARGET$, as can be seen here $COPYPASTOR$',
                    get FlagText() {
                        return globals.getFlagText(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportPlagiarism()
                },
                {
                    Id: 4,
                    DisplayName: 'Duplicate answer',
                    DefaultReportType: 'PostOther',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: (isRepost, copypastorId) => isRepost && Boolean(copypastorId),
                    GetCustomFlagText: (target, postId) => globals.getFullFlag(4, target, postId),
                    GetComment: (userDetails) => globals.getFullComment(4, userDetails),
                    DefaultFlagText: 'The answer is a repost of their other answer $TARGET$, but as there are slight differences '
                        + '(see $COPYPASTOR$), an auto flag would not be raised.',
                    get FlagText() {
                        return globals.getFlagText(this.Id);
                    },
                    DefaultComment: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227)."
                        + ' Answer the best one and flag the rest as duplicates, once you earn enough reputation. '
                        + 'If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportDuplicateAnswer()
                },
                {
                    Id: 5,
                    DisplayName: 'Bad attribution',
                    DefaultReportType: 'PostOther',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: (isRepost, copypastorId) => !isRepost && Boolean(copypastorId),
                    GetCustomFlagText: (target, postId) => globals.getFullFlag(5, target, postId),
                    DefaultFlagText: 'This post is copied from [another answer]($TARGET$), as can be seen here $COPYPASTOR$. The author '
                        + 'only added a link to the other answer, which is [not the proper way of attribution]'
                        + '(//stackoverflow.blog/2009/06/25/attribution-required).',
                    get FlagText() {
                        return globals.getFlagText(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportPlagiarism()
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
                    DefaultReportType: 'PostLowQuality',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(6, userDetails),
                    DefaultComment: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
                        + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
                        + 'have some idea what it is and why it is there, then quote the most relevant part of the page '
                        + 'you are linking to in case the target page is unavailable. '
                        + `[Answers that are little more than a link may be deleted.](${globals.deletedAnswers})`,
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 7,
                    DisplayName: 'Not an answer',
                    DefaultReportType: 'AnswerNotAnAnswer',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(7, userDetails, getRepLevel(userDetails.Reputation)),
                    DefaultComment: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
                        + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
                        + 'If you have a related but different question, [ask a new question](/questions/ask), and include a '
                        + 'link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
                    DefaultCommentHigh: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to '
                        + 'be an explicit attempt to *answer* this question; if you have a critique or need a clarification '
                        + `of the question or another answer, you can [post a comment](${globals.commentHelp}) (like this `
                        + 'one) directly below it. Please remove this answer and create either a comment or a new question. '
                        + 'See: [Ask questions, get answers, no distractions](/tour).',
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 8,
                    DisplayName: 'Thanks',
                    DefaultReportType: 'AnswerNotAnAnswer',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(8, userDetails, getRepLevel(userDetails.Reputation)),
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
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 9,
                    DisplayName: 'Me too',
                    DefaultReportType: 'AnswerNotAnAnswer',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(9, userDetails),
                    DefaultComment: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
                        + 'If you have a different but related question, then [ask](/questions/ask) it (reference this one '
                        + 'if it will help provide context). If you are interested in this specific question, you can '
                        + `[upvote](${globals.voteUpHelp}) it, leave a [comment](${globals.commentHelp}), or start a `
                        + `[bounty](${globals.setBounties}) once you have enough [reputation](${globals.reputationHelp}).`,
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 10,
                    DisplayName: 'Library',
                    DefaultReportType: 'PostLowQuality',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(10, userDetails),
                    DefaultComment: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
                        + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 11,
                    DisplayName: 'Comment',
                    DefaultReportType: 'AnswerNotAnAnswer',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(11, userDetails, getRepLevel(userDetails.Reputation)),
                    DefaultComment: 'This does not provide an answer to the question. Once you have sufficient '
                        + `[reputation](${globals.reputationHelp}) you will be able to [comment on any post](${globals.commentHelp}); instead, `
                        + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
                    DefaultCommentHigh: 'This does not provide an answer to the question. Please write a comment instead.',
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 12,
                    DisplayName: 'Duplicate',
                    DefaultReportType: 'AnswerNotAnAnswer',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(12, userDetails),
                    DefaultComment: 'Instead of posting an answer which merely links to another answer, please instead '
                        + `[flag the question](${globals.flagPosts}) as a duplicate.`,
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 13,
                    DisplayName: 'Non English',
                    DefaultReportType: 'PostLowQuality',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(13, userDetails),
                    DefaultComment: 'Please write your answer in English, as Stack Overflow is an '
                        + '[English-only site](//meta.stackoverflow.com/a/297680).',
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
                },
                {
                    Id: 14,
                    DisplayName: 'Should be an edit',
                    DefaultReportType: 'AnswerNotAnAnswer',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => globals.isStackOverflow,
                    GetComment: (userDetails) => globals.getFullComment(14, userDetails),
                    DefaultComment: 'Please use the edit link on your question to add additional information. '
                        + 'The "Post Answer" button should be used only for complete answers to the question.',
                    get Comments() {
                        return globals.getComments(this.Id);
                    },
                    SendFeedback: (reporter) => reporter.ReportNaa()
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
                    DefaultReportType: 'NoFlag',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => true,
                    SendFeedback: (reporter) => reporter.ReportLooksFine()
                },
                {
                    Id: 16,
                    DisplayName: 'Needs Editing',
                    DefaultReportType: 'NoFlag',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => true,
                    SendFeedback: (reporter) => reporter.ReportNeedsEditing()
                },
                {
                    Id: 17,
                    DisplayName: 'Vandalism',
                    DefaultReportType: 'NoFlag',
                    get ReportType() {
                        return globals.getReportType(this.Id);
                    },
                    Enabled: () => true,
                    SendFeedback: (reporter) => reporter.ReportVandalism()
                }
            ]
        }
    ];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 2 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(3), __webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, AdvancedFlagging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.waitForSvg = exports.savePropertyToCache = exports.saveCommentsToCache = exports.getComments = exports.getFlagText = exports.getReportType = exports.getFlagTypeFromCache = exports.getSentMessage = exports.parseDate = exports.qualifiesForVlq = exports.getFullFlag = exports.getFullComment = exports.getAllPostIds = exports.addXHRListener = exports.showConfirmModal = exports.Delay = exports.showMSTokenPopupAndGet = exports.editCommentsPopup = exports.inlineCheckboxesWrapper = exports.overlayModal = exports.flagsWrapper = exports.commentsWrapper = exports.editContentWrapper = exports.commentsLink = exports.commentsDiv = exports.configurationLink = exports.configurationDiv = exports.advancedFlaggingLink = exports.dropdownItem = exports.reportLink = exports.popoverArrow = exports.dropDown = exports.popupWrapper = exports.divider = exports.reportedIcon = exports.failedActionIcon = exports.performedActionIcon = exports.getTextarea = exports.getConfigHtml = exports.getOptionLabel = exports.getCategoryDiv = exports.getOptionBox = exports.getSectionWrapper = exports.getMessageDiv = exports.smokeyIcon = exports.guttenbergIcon = exports.nattyIcon = exports.getFormDataFromObject = exports.getParamsFromObject = exports.displayError = exports.displaySuccess = exports.showInlineElement = exports.hideElement = exports.showElement = exports.getFlagsUrlRegex = exports.flagsUrlRegex = exports.isDeleteVoteRegex = exports.isReviewItemRegex = exports.attachHtmlPopover = exports.attachPopover = exports.displayStacksToast = exports.FlagTypesKey = exports.MetaSmokeDisabledConfig = exports.MetaSmokeUserKeyConfig = exports.CacheChatApiFkey = exports.ConfigurationAddAuthorName = exports.ConfigurationLinkDisabled = exports.ConfigurationEnabledFlags = exports.ConfigurationWatchQueues = exports.ConfigurationWatchFlags = exports.ConfigurationDefaultNoComment = exports.ConfigurationDefaultNoFlag = exports.ConfigurationOpenOnHover = exports.flagPosts = exports.setBounties = exports.whyVote = exports.voteUpHelp = exports.reputationHelp = exports.commentHelp = exports.deletedAnswers = exports.gridCellDiv = exports.plainDiv = exports.isFlagsPage = exports.isQuestionPage = exports.isNatoPage = exports.isStackOverflow = exports.chatFailureMessage = exports.metasmokeFailureMessage = exports.metasmokeReportedMessage = exports.genericBotFailure = exports.settingUpBody = exports.settingUpTitle = exports.popupDelay = exports.dayMillis = exports.username = exports.nattyAllReportsUrl = exports.placeholderCopypastorLink = exports.placeholderTarget = exports.genericBotKey = exports.copyPastorServer = exports.copyPastorKey = exports.metasmokeApiFilter = exports.metaSmokeKey = exports.soboticsRoomId = void 0;
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
    exports.popupDelay = 4000;
    exports.settingUpTitle = 'Setting up MetaSmoke';
    exports.settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
        + 'To reset configuration, see the footer of Stack Overflow.';
    exports.genericBotFailure = 'Server refused to track the post';
    exports.metasmokeReportedMessage = 'Post reported to Smokey';
    exports.metasmokeFailureMessage = 'Failed to report post to Smokey';
    exports.chatFailureMessage = 'Failed to send message to chat';
    const nattyImage = 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1';
    const guttenbergImage = 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1';
    const smokeyImage = 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1';
    exports.isStackOverflow = Boolean(/^https:\/\/stackoverflow.com/.exec(window.location.href));
    exports.isNatoPage = Boolean(/\/tools\/new-answers-old-questions/.exec(window.location.href));
    exports.isQuestionPage = Boolean(/\/questions\/\d+.*/.exec(window.location.href));
    exports.isFlagsPage = Boolean(/\/users\/flag-summary\//.exec(window.location.href));
    exports.plainDiv = $('<div>');
    exports.gridCellDiv = $('<div>').addClass('grid--cell');
    // Help center links used in FlagTypes for comments/flags
    exports.deletedAnswers = '/help/deleted-answers';
    exports.commentHelp = '/help/privileges/comment';
    exports.reputationHelp = '/help/whats-reputation';
    exports.voteUpHelp = '/help/privileges/vote-up';
    exports.whyVote = '/help/why-vote';
    exports.setBounties = '/help/privileges/set-bounties';
    exports.flagPosts = '/help/privileges/flag-posts';
    // Cache keys
    exports.ConfigurationOpenOnHover = 'AdvancedFlagging.Configuration.OpenOnHover';
    exports.ConfigurationDefaultNoFlag = 'AdvancedFlagging.Configuration.DefaultNoFlag';
    exports.ConfigurationDefaultNoComment = 'AdvancedFlagging.Configuration.DefaultNoComment';
    exports.ConfigurationWatchFlags = 'AdvancedFlagging.Configuration.WatchFlags';
    exports.ConfigurationWatchQueues = 'AdvancedFlagging.Configuration.WatchQueues';
    exports.ConfigurationEnabledFlags = 'AdvancedFlagging.Configuration.EnabledFlags';
    exports.ConfigurationLinkDisabled = 'AdvancedFlagging.Configuration.LinkDisabled';
    exports.ConfigurationAddAuthorName = 'AdvancedFlagging.Comments.AddAuthorName';
    exports.CacheChatApiFkey = 'StackExchange.ChatApi.FKey';
    exports.MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
    exports.MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
    exports.FlagTypesKey = 'FlagTypes';
    const displayStacksToast = (message, type) => StackExchange.helpers.showToast(message, {
        type: type,
        transientTimeout: exports.popupDelay
    });
    exports.displayStacksToast = displayStacksToast;
    const attachPopover = async (element, text, position) => {
        await Stacks.setTooltipText(element, text, {
            placement: position
        });
    };
    exports.attachPopover = attachPopover;
    const attachHtmlPopover = async (element, text, position) => {
        await Stacks.setTooltipHtml(element, text, {
            placement: position
        });
    };
    exports.attachHtmlPopover = attachHtmlPopover;
    // regexes
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
    const sampleIcon = exports.gridCellDiv.clone().addClass(`d-none ${exports.isFlagsPage ? ' ml8' : ''}`)
        .append($('<a>').addClass('s-avatar s-avatar__16 s-user-card--avatar').append($('<img>').addClass('s-avatar--image')));
    exports.nattyIcon = sampleIcon.clone().find('img').attr('src', nattyImage).parent().parent();
    exports.guttenbergIcon = sampleIcon.clone().find('img').attr('src', guttenbergImage).parent().parent();
    exports.smokeyIcon = sampleIcon.clone().find('img').attr('src', smokeyImage).parent().parent();
    // dynamically generated jQuery elements based on the parameters passed
    const getMessageDiv = (message, state) => $('<div>').attr('class', 'p12 bg-' + state).text(message);
    exports.getMessageDiv = getMessageDiv;
    const getSectionWrapper = (name) => $('<fieldset>').html(`<h2 class="grid--cell">${name}</h2>`)
        .addClass(`grid gs8 gsy fd-column af-section-${name.toLowerCase()}`);
    exports.getSectionWrapper = getSectionWrapper;
    const getOptionBox = (name) => $('<input>').attr('type', 'checkbox').attr('name', name).attr('id', name).attr('class', 's-checkbox');
    exports.getOptionBox = getOptionBox;
    const getCategoryDiv = (red) => $('<div>').attr('class', `advanced-flagging-category bar-md${red ? ' bg-red-200' : ''}`);
    exports.getCategoryDiv = getCategoryDiv;
    const getOptionLabel = (text, name) => $('<label>').text(text).attr('for', name)
        .addClass('s-label ml4 va-middle fs-body1 fw-normal');
    exports.getOptionLabel = getOptionLabel;
    const getConfigHtml = (optionId, text) => $(`
<div>
  <div class="grid gs4">
    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="grid--cell s-label fw-normal pt2" for="${optionId}">${text}</label>
  </div>
</div>`);
    exports.getConfigHtml = getConfigHtml;
    const getTextarea = (content, className) => $('<textarea>').html(content || '').attr('rows', 4)
        .addClass('grid--cell s-textarea fs-body2 ' + className);
    exports.getTextarea = getTextarea;
    const iconWrapper = $('<div>').attr('class', 'grid--cell d-none');
    const performedActionIcon = () => iconWrapper.clone().append(Svg.Checkmark().addClass('fc-green-500'));
    exports.performedActionIcon = performedActionIcon;
    const failedActionIcon = () => iconWrapper.clone().append(Svg.Clear().addClass('fc-red-500'));
    exports.failedActionIcon = failedActionIcon;
    const reportedIcon = () => iconWrapper.clone().append(Svg.Flag().addClass('fc-red-500'));
    exports.reportedIcon = reportedIcon;
    exports.divider = $('<hr>').attr('class', 'my8');
    exports.popupWrapper = $('<div>').attr('id', 'snackbar')
        .attr('class', 'hide fc-white p16 fs-body3 ps-fixed ta-center z-popover l50 t32 wmn2');
    exports.dropDown = $('<div>').attr('class', 'advanced-flagging-dialog s-popover s-anchors s-anchors__default p6 mt2 c-default d-none');
    exports.popoverArrow = $('<div>').attr('class', 's-popover--arrow s-popover--arrow__tc');
    exports.reportLink = $('<a>').attr('class', 'd-inline-block my4');
    exports.dropdownItem = $('<div>').attr('class', 'advanced-flagging-dropdown-item px4');
    exports.advancedFlaggingLink = $('<button>').attr('type', 'button').attr('class', 's-btn s-btn__link').text('Advanced Flagging');
    exports.configurationDiv = $('<div>').attr('class', 'advanced-flagging-configuration-div ta-left pt6');
    exports.configurationLink = $('<a>').attr('id', 'af-modal-button').text('AdvancedFlagging configuration');
    exports.commentsDiv = exports.configurationDiv.clone().removeClass('advanced-flagging-configuration-div').addClass('af-comments-div');
    exports.commentsLink = exports.configurationLink.clone().attr('id', 'af-comments-button').text('AdvancedFlagging: edit comments and flags');
    exports.editContentWrapper = $('<div>').attr('class', 'grid grid__fl1 md:fd-column gs16');
    const commentsHeader = $('<h2>').attr('class', 'ta-center mb8 fs-title').text('Comments');
    const flagsHeader = $('<h2>').attr('class', 'ta-center mb8 fs-title').text('Flags');
    exports.commentsWrapper = $('<div>').attr('class', 'af-comments-content grid--cell w60 md:w100 sm:w100').append(commentsHeader);
    exports.flagsWrapper = $('<div>').attr('class', 'af-flags-content grid--cell w40 md:w100 sm:w100').append(flagsHeader);
    exports.overlayModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full w60 sm:w100 md:w75 lg:w75" role="document">
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
        }).filter(String); // remove null/empty values
    }
    exports.getAllPostIds = getAllPostIds;
    // For GetComment() on FlagTypes. Adds the author name before the comment if the option is enabled
    function getFullComment(flagId, { AuthorName }, level) {
        const shouldAddAuthorName = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationAddAuthorName);
        const flagType = getFlagTypeFromCache(flagId);
        const comment = flagType?.Comments[level || 'Low'];
        return (comment && shouldAddAuthorName ? `${AuthorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || '';
    }
    exports.getFullComment = getFullComment;
    // For GetCustomFlagText() on FlagTypes. Replaces the placeholders with actual values
    function getFullFlag(flagId, target, postId) {
        const flagType = getFlagTypeFromCache(flagId);
        const flagContent = flagType?.FlagText;
        if (!flagContent)
            return '';
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
    function getSentMessage(success, feedback, bot) {
        return success ? `Feedback ${feedback} sent to ${bot}` : `Failed to send feedback ${feedback} to ${bot}`;
    }
    exports.getSentMessage = getSentMessage;
    function getFlagTypeFromCache(flagId) {
        return GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.FlagTypesKey)?.find(flagType => flagType.Id === flagId) || null;
    }
    exports.getFlagTypeFromCache = getFlagTypeFromCache;
    function getReportType(flagId) {
        const flagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.FlagTypesKey);
        return flagTypes?.find(flagType => flagType.Id === flagId)?.ReportType || '';
    }
    exports.getReportType = getReportType;
    function getFlagText(flagId) {
        const flagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.FlagTypesKey);
        return flagTypes?.find(flagType => flagType.Id === flagId)?.FlagText || '';
    }
    exports.getFlagText = getFlagText;
    function getComments(flagId) {
        const flagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.FlagTypesKey);
        return flagTypes?.find(flagType => flagType.Id === flagId)?.Comments || '';
    }
    exports.getComments = getComments;
    function saveCommentsToCache(flagId, value) {
        const currentFlagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.FlagTypesKey);
        const flagType = currentFlagTypes?.find(flag => flag.Id === flagId);
        if (!currentFlagTypes || !flagType)
            return;
        flagType.Comments = value;
        GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(exports.FlagTypesKey, currentFlagTypes);
    }
    exports.saveCommentsToCache = saveCommentsToCache;
    function savePropertyToCache(flagId, property, value) {
        const currentFlagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.FlagTypesKey);
        const flagType = currentFlagTypes?.find(flag => flag.Id === flagId);
        if (!currentFlagTypes || !flagType)
            return;
        flagType[property] = value;
        GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(exports.FlagTypesKey, currentFlagTypes);
    }
    exports.savePropertyToCache = savePropertyToCache;
    async function waitForSvg() {
        while (typeof Svg === 'undefined') {
            // eslint-disable-next-line no-await-in-loop
            await Delay(1000);
        }
    }
    exports.waitForSvg = waitForSvg;
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GlobalVars_1) {
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
        aNode.find('.answercell').on('destroyed', () => {
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
            qNode.find('.postcell').on('destroyed', () => {
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
        if (GlobalVars_1.isNatoPage) {
            parseNatoPage(callback);
        }
        else if (GlobalVars_1.isQuestionPage) {
            parseQuestionPage(callback);
        }
        else if (GlobalVars_1.isFlagsPage) {
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
        return authorDiv.find('a').text();
    }
    function parseActionDate(actionDiv) {
        return GlobalVars_1.parseDate((actionDiv.hasClass('relativetime') ? actionDiv : actionDiv.find('.relativeTime')).attr('title'));
    }
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 5 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(6), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ChatApi_1, GlobalVars_1) {
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
                if (!GlobalVars_1.isStackOverflow)
                    resolve();
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${GlobalVars_1.nattyAllReportsUrl}`,
                    onload: (response) => {
                        if (response.status !== 200)
                            reject();
                        const result = JSON.parse(response.responseText);
                        const allStoredIds = result.items.map(item => Number(item.name));
                        const answerIds = GlobalVars_1.getAllPostIds(false, false);
                        this.nattyIds = answerIds.filter(id => allStoredIds.includes(id));
                        resolve();
                    },
                    onerror: () => reject()
                });
            });
        }
        WasReported() {
            return NattyAPI.nattyIds.includes(this.answerId);
        }
        async ReportNaa() {
            if (this.answerDate < this.questionDate)
                return '';
            if (this.WasReported()) {
                return await this.chat.SendMessage(`${this.feedbackMessage} tp`, this.name);
            }
            else {
                const answerAge = this.DaysBetween(this.answerDate, new Date());
                const daysPostedAfterQuestion = this.DaysBetween(this.questionDate, this.answerDate);
                if (isNaN(answerAge) || isNaN(daysPostedAfterQuestion) || answerAge > 30 || daysPostedAfterQuestion < 30)
                    return '';
                return isNaN(answerAge + daysPostedAfterQuestion) ? await this.chat.SendMessage(this.reportMessage, this.name) : '';
            }
        }
        async ReportRedFlag() {
            return await this.SendFeedback(`${this.feedbackMessage} tp`);
        }
        async ReportLooksFine() {
            return await this.SendFeedback(`${this.feedbackMessage} fp`);
        }
        async ReportNeedsEditing() {
            return await this.SendFeedback(`${this.feedbackMessage} ne`);
        }
        ReportVandalism() {
            return Promise.resolve('');
        }
        ReportDuplicateAnswer() {
            return Promise.resolve('');
        }
        ReportPlagiarism() {
            return Promise.resolve('');
        }
        DaysBetween(first, second) {
            return (second.valueOf() - first.valueOf()) / GlobalVars_1.dayMillis;
        }
        async SendFeedback(message) {
            return this.WasReported() ? await this.chat.SendMessage(message, this.name) : '';
        }
    }
    exports.NattyAPI = NattyAPI;
    NattyAPI.nattyIds = [];
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 6 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(3), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, GlobalVars_1) {
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
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(GlobalVars_1.CacheChatApiFkey, async () => {
                try {
                    const channelPage = await this.GetChannelPage(roomId);
                    const fkeyElement = $(channelPage).filter('#fkey');
                    const fkey = fkeyElement.val();
                    return fkey?.toString() || '';
                }
                catch (error) {
                    console.error(error);
                    throw new Error('Failed to get chat fkey');
                }
            }, expiryDate);
        }
        GetChatUserId() {
            return StackExchange.options.user.userId;
        }
        async SendMessage(message, bot, roomId = GlobalVars_1.soboticsRoomId) {
            const makeRequest = async () => await this.SendRequestToChat(message, roomId);
            let numTries = 0;
            const onFailure = async () => {
                numTries++;
                if (numTries < 3) {
                    GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(GlobalVars_1.CacheChatApiFkey);
                    if (!await makeRequest())
                        return onFailure();
                }
                else {
                    throw new Error(GlobalVars_1.chatFailureMessage); // retry limit exceeded
                }
                return GlobalVars_1.getSentMessage(true, message.split(' ').pop() || '', bot);
            };
            if (!await makeRequest())
                return onFailure();
            return GlobalVars_1.getSentMessage(true, message.split(' ').pop() || '', bot);
        }
        async SendRequestToChat(message, roomId) {
            const fkey = await this.GetChannelFKey(roomId);
            return new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                    onload: (chatResponse) => {
                        resolve(chatResponse.status === 200);
                    },
                    onerror: () => resolve(false),
                });
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GlobalVars_1) {
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
            return Promise.resolve('');
        }
        ReportNeedsEditing() {
            return Promise.resolve('');
        }
        ReportVandalism() {
            return Promise.resolve('');
        }
        ReportDuplicateAnswer() {
            return Promise.resolve('');
        }
        ReportPlagiarism() {
            return Promise.resolve('');
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
                const flaggerName = encodeURIComponent(GlobalVars_1.username || '');
                if (!GlobalVars_1.isStackOverflow || !flaggerName)
                    resolve('');
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
                        resolve(GlobalVars_1.getSentMessage(true, '', this.name));
                    },
                    onerror: () => reject(GlobalVars_1.genericBotFailure)
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
        static async Setup(appKey) {
            MetaSmokeAPI.appKey = appKey;
            MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
        }
        static async QueryMetaSmokeInternal() {
            const urls = globals.getAllPostIds(true, true);
            const urlString = urls.join(',');
            if (MetaSmokeAPI.isDisabled)
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
            return MetaSmokeAPI.metasmokeIds.find(item => item.sitePostId === postId)?.metasmokeId || 0;
        }
        async ReportNaa() {
            return await this.SendFeedback('naa-');
        }
        async ReportRedFlag() {
            const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
            if (smokeyId)
                return await this.SendFeedback('tpu-');
            const urlString = MetaSmokeAPI.GetQueryUrl(this.postId, this.postType);
            if (!MetaSmokeAPI.accessToken)
                return '';
            const reportRequest = await fetch('https://metasmoke.erwaysoftware.com/api/w/post/report', {
                method: 'POST',
                body: globals.getFormDataFromObject({ post_link: urlString, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
            });
            const requestResponse = await reportRequest.text();
            if (!reportRequest.ok || requestResponse !== 'OK') { // if the post is successfully reported, the response is a plain OK
                console.error(`Failed to report post to Smokey (postId: ${smokeyId})`, requestResponse);
                throw new Error(globals.metasmokeFailureMessage);
            }
            return globals.metasmokeReportedMessage;
        }
        async ReportLooksFine() {
            return await this.SendFeedback('fp-');
        }
        async ReportNeedsEditing() {
            return await this.SendFeedback('fp-');
        }
        async ReportVandalism() {
            return await this.SendFeedback('tp-');
        }
        ReportDuplicateAnswer() {
            return Promise.resolve('');
        }
        ReportPlagiarism() {
            return Promise.resolve('');
        }
        async SendFeedback(feedbackType) {
            const smokeyId = MetaSmokeAPI.getSmokeyId(this.postId);
            if (!MetaSmokeAPI.accessToken || !smokeyId)
                return '';
            const feedbackRequest = await fetch(`https://metasmoke.erwaysoftware.com/api/w/post/${smokeyId}/feedback`, {
                method: 'POST',
                body: globals.getFormDataFromObject({ type: feedbackType, key: MetaSmokeAPI.appKey, token: MetaSmokeAPI.accessToken })
            });
            const feedbackResponse = await feedbackRequest.json();
            if (!feedbackRequest.ok) {
                console.error(`Failed to send feedback to Smokey (postId: ${smokeyId})`, feedbackResponse);
                throw new Error(globals.getSentMessage(false, feedbackType, this.name));
            }
            return globals.getSentMessage(true, feedbackType, this.name);
        }
    }
    exports.MetaSmokeAPI = MetaSmokeAPI;
    MetaSmokeAPI.metasmokeIds = [];
    MetaSmokeAPI.isDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.MetaSmokeDisabledConfig) || false;
    MetaSmokeAPI.codeGetter = async (metaSmokeOAuthUrl) => {
        if (MetaSmokeAPI.isDisabled)
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(6), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, ChatApi_1, GlobalVars_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.CopyPastorAPI = void 0;
    class CopyPastorAPI {
        constructor(id) {
            this.name = 'Guttenberg';
            this.answerId = id;
        }
        static async getAllCopyPastorIds() {
            if (!GlobalVars_1.isStackOverflow)
                return;
            const postUrls = GlobalVars_1.getAllPostIds(false, true);
            await this.storeReportedPosts(postUrls);
        }
        static storeReportedPosts(postUrls) {
            const url = `${GlobalVars_1.copyPastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
            return new Promise((resolve, reject) => {
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
            return CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId)?.postId || 0;
        }
        getIsRepost() {
            return CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId)?.repost || false;
        }
        getTargetUrl() {
            return CopyPastorAPI.copyPastorIds.find(item => item.postId === this.answerId)?.target_url || '';
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
            return Promise.resolve('');
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
            const chatId = new ChatApi_1.ChatApi().GetChatUserId();
            const copyPastorId = this.getCopyPastorId();
            if (!copyPastorId)
                return Promise.resolve('');
            const successMessage = GlobalVars_1.getSentMessage(true, type, this.name);
            const failureMessage = GlobalVars_1.getSentMessage(false, type, this.name);
            const payload = {
                post_id: copyPastorId,
                feedback_type: type,
                username: GlobalVars_1.username,
                link: `https://chat.stackoverflow.com/users/${chatId}`,
                key: GlobalVars_1.copyPastorKey,
            };
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${GlobalVars_1.copyPastorServer}/feedback/create`,
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
    const enabledFlags = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
    const flagTypes = FlagTypes_1.flagCategories.flatMap(category => category.FlagTypes);
    const flagNames = [...new Set(flagTypes.map(flagType => flagType.DefaultReportType))];
    const optionTypes = flagNames.filter(item => !/Post(?:Other|Offensive|Spam)/.exec(item));
    const cacheFlags = () => GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.FlagTypesKey, flagTypes.map(flagType => {
        return {
            Id: flagType.Id,
            FlagText: flagType.DefaultFlagText || '',
            Comments: {
                Low: flagType.DefaultComment || '',
                High: flagType.DefaultCommentHigh || ''
            },
            ReportType: flagType.DefaultReportType
        };
    }));
    const getOption = (flag, name) => `<option${flag === name ? ' selected' : ''}>${flag}</option>`;
    const getFlagOptions = (name) => optionTypes.map(flag => getOption(flag, name)).join('');
    function SetupConfiguration() {
        SetupDefaults(); // stores default values if they haven't already been
        BuildConfigurationOverlay(); // the configuration modal
        SetupCommentsAndFlagsModal(); // the comments & flags modal
        const bottomBox = $('.site-footer--copyright').children('.-list');
        const configurationDiv = globals.configurationDiv.clone(), commentsDiv = globals.commentsDiv.clone();
        const configurationLink = globals.configurationLink.clone(), commentsLink = globals.commentsLink.clone();
        $(document).on('click', '#af-modal-button', () => StackExchange.helpers.showModal(document.querySelector('#af-config')));
        $(document).on('click', '#af-comments-button', () => StackExchange.helpers.showModal(document.querySelector('#af-comments')));
        commentsDiv.append(commentsLink).insertAfter(bottomBox);
        configurationDiv.append(configurationLink).insertAfter(bottomBox);
    }
    exports.SetupConfiguration = SetupConfiguration;
    function SetupDefaults() {
        // store all flags if they don't exist
        if (!enabledFlags) {
            const flagTypeIds = flagTypes.map(flag => flag.Id);
            GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.ConfigurationEnabledFlags, flagTypeIds);
        }
        const cachedFlagTypes = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.FlagTypesKey);
        // in case we add a new flag type, make sure it will be automatically be saved (compare types)
        if (cachedFlagTypes?.length !== flagTypes.length)
            cacheFlags();
    }
    /* The configuration modal has three sections:
       - General (uses cache): general options. They are properties of the main Configuration object and accept Boolean values
         All options are disabled by default
       - Flags (uses cache): the flag Ids are stored in an array. All are enabled by default
       - Admin doesn't use cache, but it interacts with it (deletes values)
       Sample cache:
       AdvancedFlagging.Configuration: {
           OpenOnHover: true,
           AnotherOption: false,
           DoFooBar: true,
           Flags: [1, 2, 4, 5, 6, 10, 14, 15]
       }
    
       Notes:
       - In General, the checkboxes and the corresponding labels are wrapped in a div that has a data-option-id attribute.
         This is the property of the option that will be used in cache.
       - In Flags, each checkbox has a flag-type-<FLAG_ID> id. This is used to determine the flag id
    */
    function BuildConfigurationOverlay() {
        const overlayModal = globals.overlayModal.clone();
        overlayModal.find('.s-modal--close').append(Svg.ClearSm());
        const sections = [
            {
                SectionName: 'General',
                Items: GetGeneralConfigItems(),
                onSave: () => {
                    // find the option id (it's the data-option-id attribute) and store whether the box is checked or not
                    $('.af-section-general').find('input').each((_index, el) => {
                        GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache($(el).parents().eq(2).data('option-id'), $(el).prop('checked'));
                    });
                }
            },
            {
                SectionName: 'Flags',
                Items: GetFlagSettings(),
                onSave: () => {
                    // collect all flag ids (flag-type-ID) and store them
                    const flagOptions = $('.af-section-flags').find('input').get()
                        .filter(el => $(el).prop('checked'))
                        .map(el => {
                        const postId = $(el).attr('id');
                        return postId ? Number(/\d+/.exec(postId)) : 0;
                    }).sort((a, b) => a - b); // sort the ids before storing them
                    GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(globals.ConfigurationEnabledFlags, flagOptions);
                }
            },
            {
                // nothing to do onSave here because there's nothing to save :)
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
        overlayModal.find('.s-btn__primary').on('click', event => {
            event.preventDefault();
            sections.forEach(section => section.onSave?.());
            globals.displayStacksToast('Configuration saved', 'success');
            setTimeout(() => window.location.reload(), 500);
        });
        $('body').append(overlayModal);
        const flagOptions = $('.af-section-flags').children('div');
        for (let i = 0; i < flagOptions.length; i += 5) {
            flagOptions.slice(i, i + 5).wrapAll(globals.inlineCheckboxesWrapper.clone());
        }
        // dynamically generate the width
        $('label[for="flag-type-16"]').parent().css('width', $('label[for="flag-type-11"]').parent().css('width')).removeClass('w25 lg:w25');
    }
    function GetGeneralConfigItems() {
        return [
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
                text: 'Uncheck \'Leave comment\' by default',
                configValue: globals.ConfigurationDefaultNoComment
            },
            {
                text: 'Uncheck \'Flag\' by default',
                configValue: globals.ConfigurationDefaultNoFlag
            },
            {
                text: 'Add author\'s name before comments',
                configValue: globals.ConfigurationAddAuthorName
            }
        ].map(item => {
            const storedValue = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(item.configValue);
            return createCheckbox(item.text, storedValue).attr('data-option-id', item.configValue);
        });
    }
    function GetFlagSettings() {
        const checkboxes = [];
        if (!enabledFlags)
            return checkboxes;
        flagTypes.forEach(flag => {
            const storedValue = enabledFlags.indexOf(flag.Id) > -1;
            const checkbox = createCheckbox(flag.DisplayName, storedValue, `flag-type-${flag.Id}`).children().eq(0);
            checkboxes.push(checkbox.addClass('w25 lg:w25 md:w100 sm:w100')); // responsiveness
        });
        return checkboxes;
    }
    function GetAdminConfigItems() {
        return [
            $('<a>').text('Clear Metasmoke Configuration').on('click', () => {
                MetaSmokeAPI_1.MetaSmokeAPI.Reset();
                globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
            }),
            $('<a>').text('Clear chat fkey').on('click', () => {
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
    function createFlagTypeDiv(type, displayName, flagId, reportType) {
        const displayStyle = reportType ? 'd-block' : 'd-none';
        const expandableId = `${type}-${displayName}`.toLowerCase().replace(/\s/g, '');
        return $(`
<div class="s-sidebarwidget" data-flag-id=${flagId}>
  <button class="s-sidebarwidget--action s-btn t4 r4 af-expandable-trigger"
          data-controller="s-expandable-control" aria-controls="${expandableId}">Edit</button>
  <button class="s-sidebarwidget--action s-btn s-btn__primary t4 r6 af-submit-content d-none">Save</button>
  <div class="s-sidebarwidget--content d-block p12 fs-body3">${displayName}</div>
  <div class="s-expandable" id="${expandableId}">
    <div class="s-expandable--content px8">
      <div class="advanced-flagging-flag-option py8 mln6 ${displayStyle}">
        <label class="fw-bold ps-relative d-inline-block z-selected l16">Flag as:</label>'
        <div class="s-select d-inline-block r48"><select class="pl64">${getFlagOptions(reportType || '')}</select></div>
      </div>
    </div>
  </div>
</div>`);
    }
    /* In this case, we are caching a FlagType, but removing unnecessary properties.
       Only the Id, FlagText, and Comments (both LowRep and HighRep) are cached if they exist.
       Sample cache (undefined values are empty strings):
           AdvancedFlagging.FlagTypes: [{
               Id: 1,
               FlagText: 'This is some text',
               Comments: {
                   Low: 'This is a LowRep comment',
                   High: ''
               },
               ReportType: 'PostOther'
           }, {
               Id: 2,
               FlagText: '',
               Comments: {
                   Low: 'This is a LowRep comment',
                   High: 'This is a HighRep comment'
               },
               ReportType: 'AnswerNotAnAnswer'
           }]
    
        Notes:
        - The Spam, Rude or Abusive and the - by default - NoFlag FlagTypes won't be displayed.
        - The ReportType can't be changed to/from PostOther.
        - The Human field is retrieved when the flag is raised based on ReportType.
        - Each div has a data-flag-id attribute based on which we can store the information on cache again
    */
    function SetupCommentsAndFlagsModal() {
        const editCommentsPopup = globals.editCommentsPopup.clone();
        editCommentsPopup.find('.s-modal--close').append(Svg.ClearSm());
        const commentsWrapper = globals.commentsWrapper.clone();
        const flagsWrapper = globals.flagsWrapper.clone();
        editCommentsPopup.find('.s-modal--body').append(globals.editContentWrapper.clone().append(commentsWrapper, flagsWrapper));
        flagTypes.filter(item => item.DefaultComment || item.DefaultFlagText).forEach(flagType => {
            const comments = flagType.Comments;
            const flagText = flagType.FlagText;
            if (flagText) {
                const mainWrapper = createFlagTypeDiv('flag', flagType.DisplayName, flagType.Id);
                mainWrapper.find('.s-expandable--content').prepend(globals.getTextarea(flagText, 'af-flag-content'));
                flagsWrapper.append(mainWrapper);
            }
            if (!comments?.Low)
                return;
            const mainWrapper = createFlagTypeDiv('comment', flagType.DisplayName, flagType.Id, flagType.ReportType);
            const expandable = mainWrapper.find('.s-expandable--content');
            const labelDisplay = comments.High ? 'd-block' : 'd-none';
            const getLabel = (type) => $('<label>').addClass(`grid--cell s-label ${labelDisplay}`).html(`${type} comment`);
            if (comments.High)
                expandable.prepend(getLabel('HighRep').addClass('pt4'), globals.getTextarea(comments.High, 'af-highrep'));
            expandable.prepend(getLabel('LowRep'), globals.getTextarea(comments.Low, 'af-lowrep'));
            commentsWrapper.append(mainWrapper);
        });
        $(document).on('click', '.af-expandable-trigger', event => {
            const button = $(event.target), saveButton = button.next();
            button.text(button.text() === 'Edit' ? 'Hide' : 'Edit');
            saveButton.hasClass('d-none') ? globals.showElement(saveButton) : globals.hideElement(saveButton);
        }).on('change', '.advanced-flagging-flag-option select', event => {
            const element = $(event.target);
            const newReportType = element.val();
            const flagId = Number(element.parents('.s-sidebarwidget').attr('data-flag-id'));
            globals.savePropertyToCache(flagId, 'ReportType', newReportType);
            globals.displayStacksToast('Successfully changed the report flag type.', 'success');
        }).on('click', '.af-submit-content', event => {
            const element = $(event.target);
            const expandable = element.next().next();
            const flagId = Number(element.parents('.s-sidebarwidget').attr('data-flag-id'));
            if (!flagId) {
                globals.displayStacksToast('Failed to save options', 'danger');
                return;
            }
            const flagContent = expandable.find('.af-flag-content').val() || '';
            const commentLowRep = expandable.find('.af-lowrep').val() || '';
            const commentHighRep = expandable.find('.af-highrep').val() || '';
            if (flagContent)
                globals.savePropertyToCache(flagId, 'FlagText', flagContent);
            else
                globals.saveCommentsToCache(flagId, { Low: commentLowRep, High: commentHighRep });
            globals.displayStacksToast('Content saved successfully', 'success');
            element.prev().trigger('click'); // hide the textarea
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