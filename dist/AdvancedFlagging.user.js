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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1), __webpack_require__(2), __webpack_require__(3), __webpack_require__(221), __webpack_require__(222), __webpack_require__(223), __webpack_require__(224), __webpack_require__(225), __webpack_require__(219), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, FlagTypes_1, sotools_1, NattyApi_1, GenericBotAPI_1, MetaSmokeAPI_1, CopyPastorAPI_1, RequestWatcher_1, Configuration_1, GreaseMonkeyCache_1, globals) {
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
    function handleFlagAndComment(postId, flag, flagRequired, commentText, copyPastorPromise) {
        const result = {};
        if (commentText) {
            result.CommentPromise = new Promise((resolve, reject) => {
                $.ajax({
                    url: `/posts/${postId}/comments`,
                    type: 'POST',
                    data: { fkey: userFkey, comment: commentText }
                }).done((data) => {
                    resolve(data);
                }).fail((jqXHR, textStatus, errorThrown) => {
                    reject({ jqXHR, textStatus, errorThrown });
                });
            });
        }
        if (flagRequired && flag.ReportType !== 'NoFlag') {
            // eslint-disable-next-line no-async-promise-executor
            result.FlagPromise = new Promise(async (resolve, reject) => {
                const flagText = await copyPastorPromise.then(results => {
                    if (flag.GetCustomFlagText && results.length) {
                        return flag.GetCustomFlagText(results[0]);
                    }
                });
                autoFlagging = true;
                $.ajax({
                    url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
                    type: 'POST',
                    data: { fkey: userFkey, otherText: flag.ReportType === 'PostOther' ? flagText : '' }
                }).done((data) => {
                    setTimeout(() => autoFlagging = false, 500);
                    resolve(data);
                }).fail((jqXHR, textStatus, errorThrown) => {
                    reject({ jqXHR, textStatus, errorThrown });
                });
            });
        }
        return result;
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
        nattyIcon
            ? nattyApi.Watch().subscribe(reported => reported ? globals.showInlineElement(nattyIcon) : nattyIcon.addClass('d-none'))
            : nattyApi.Watch();
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
            ReportRedFlag: () => Promise.resolve(false),
            ReportLooksFine: () => genericBotAPI.ReportLooksFine(),
            ReportNeedsEditing: () => genericBotAPI.ReportNeedsEditing(),
            ReportVandalism: () => Promise.resolve(true),
            ReportDuplicateAnswer: () => Promise.resolve(false),
            ReportPlagiarism: () => Promise.resolve(false)
        };
    }
    function setupMetasmokeApi(postId, postType, smokeyIcon) {
        const metaSmoke = new MetaSmokeAPI_1.MetaSmokeAPI();
        metaSmoke.Watch(postId, postType).subscribe(id => {
            if (!id) {
                smokeyIcon.addClass('d-none');
                return;
            }
            smokeyIcon.click(() => {
                window.open(`https://metasmoke.erwaysoftware.com/post/${id}`, '_blank');
            });
            globals.showInlineElement(smokeyIcon);
        });
        return {
            name: 'Smokey',
            ReportNaa: () => metaSmoke.ReportNaa(postId, postType),
            ReportRedFlag: () => metaSmoke.ReportRedFlag(postId, postType),
            ReportLooksFine: () => metaSmoke.ReportLooksFine(postId, postType),
            ReportNeedsEditing: () => metaSmoke.ReportNeedsEditing(postId, postType),
            ReportVandalism: () => metaSmoke.ReportVandalism(postId, postType),
            ReportDuplicateAnswer: () => Promise.resolve(false),
            ReportPlagiarism: () => Promise.resolve(false)
        };
    }
    function setupGuttenbergApi(copyPastorApi) {
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
    function getIsReportOrPlagiarism(copypastorPostId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${globals.copyPastorServer}/posts/${copypastorPostId}`,
                onload: (response) => {
                    const responseParsed = $(response.responseText);
                    resolve(!!responseParsed.text().match('Reposted'));
                },
                onerror: (response) => {
                    reject(response);
                },
            });
        });
    }
    async function BuildFlaggingDialog(element, postId, postType, reputation, authorName, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters, copyPastorPromise) {
        const dropDown = globals.dropDown.clone();
        const checkboxNameComment = `comment_checkbox_${postId}`;
        const checkboxNameFlag = `flag_checkbox_${postId}`;
        const leaveCommentBox = globals.getOptionBox(checkboxNameComment);
        const flagBox = globals.getOptionBox(checkboxNameFlag);
        flagBox.prop('checked', true);
        const isStackOverflow = sotools_1.IsStackOverflow();
        const comments = element.find('.comment-body');
        const defaultNoComment = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationDefaultNoComment);
        if (!defaultNoComment && !comments.length && isStackOverflow)
            leaveCommentBox.prop('checked', true);
        const enabledFlagIds = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
        let hasCommentOptions = false;
        let firstCategory = true;
        FlagTypes_1.flagCategories.forEach(flagCategory => {
            if (flagCategory.AppliesTo.indexOf(postType) === -1)
                return;
            const divider = globals.getDivider();
            if (!firstCategory)
                dropDown.append(divider);
            const categoryDiv = globals.getCategoryDiv(flagCategory.IsDangerous);
            let activeLinks = flagCategory.FlagTypes.length;
            flagCategory.FlagTypes.forEach(flagType => {
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
                        copyPastorPromise.then(async (items) => {
                            // If it somehow changed within the promise, check again
                            if (flagType.Enabled) {
                                const hasItems = !!items.length;
                                if (!hasItems)
                                    return;
                                // https://github.com/SOBotics/AdvancedFlagging/issues/16
                                const isRepost = await getIsReportOrPlagiarism(items[0].post_id);
                                const isEnabled = flagType.Enabled(hasItems, isRepost);
                                if (isEnabled)
                                    enableLink();
                            }
                            else {
                                enableLink();
                            }
                        });
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
                            const result = handleFlagAndComment(postId, flagType, flagBox.is(':checked'), commentText, copyPastorPromise);
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
            });
            firstCategory = false;
        });
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
        const flagBoxLabel = globals.getOptionLabel('Flag', checkboxNameComment);
        const flaggingRow = globals.plainDiv.clone();
        const defaultNoFlag = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationDefaultNoFlag);
        if (defaultNoFlag)
            flagBox.prop('checked', false);
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
            promise.then((didReport) => {
                if (!didReport)
                    return;
                globals.displaySuccess(`Feedback sent to ${reporter.name}`);
            }).catch(() => {
                globals.displayError(`Failed to send feedback to ${reporter.name}.`);
            });
        });
    }
    let autoFlagging = false;
    async function SetupPostPage() {
        // The Svg object is initialised after the body has loaded :(
        while (typeof Svg === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        sotools_1.parseQuestionsAndAnswers(async (post) => {
            if (!post.element.length)
                return;
            let iconLocation;
            let advancedFlaggingLink = null;
            const nattyIcon = globals.getNattyIcon().click(() => {
                window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
            });
            const copyPastorIcon = globals.getGuttenbergIcon();
            const copyPastorApi = new CopyPastorAPI_1.CopyPastorAPI(post.postId, globals.copyPastorKey);
            const copyPastorObservable = copyPastorApi.Watch();
            const smokeyIcon = globals.getSmokeyIcon();
            const reporters = [];
            if (post.type === 'Answer') {
                reporters.push(setupNattyApi(post.postId, nattyIcon));
                reporters.push(setupGenericBotApi(post.postId));
                reporters.push(setupGuttenbergApi(copyPastorApi));
                copyPastorObservable.subscribe(items => {
                    if (!items.length) {
                        copyPastorIcon.addClass('d-none');
                        return;
                    }
                    copyPastorIcon.attr('Title', `Reported by CopyPastor - ${items.length}`);
                    globals.showInlineElement(copyPastorIcon);
                    copyPastorIcon.click(() => items.forEach(item => {
                        window.open('https://copypastor.sobotics.org/posts/' + item.post_id);
                    }));
                });
            }
            reporters.push(setupMetasmokeApi(post.postId, post.type, smokeyIcon));
            const performedActionIcon = globals.getPerformedActionIcon();
            const reportedIcon = globals.getReportedIcon();
            if (post.page === 'Question') {
                // Now we setup the flagging dialog
                iconLocation = iconLocation = post.element.find('.js-post-menu').children().first();
                advancedFlaggingLink = globals.advancedFlaggingLink.clone();
                const questionTime = post.type === 'Answer' ? post.question.postTime : post.postTime;
                const answerTime = post.postTime;
                const deleted = post.element.hasClass('deleted-answer');
                const isEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationWatchFlags);
                RequestWatcher_1.WatchFlags().subscribe(xhr => {
                    if (!isEnabled || autoFlagging || xhr.status !== 200)
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
                    handleFlag(flagType, reporters, answerTime, questionTime);
                    displaySuccessFlagged(reportedIcon, flagType.Human);
                });
                const linkDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationLinkDisabled);
                if (!linkDisabled) {
                    const dropDown = await BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation, post.authorName, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi.Promise());
                    advancedFlaggingLink.append(dropDown);
                    const link = advancedFlaggingLink;
                    const openOnHover = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationOpenOnHover);
                    link[openOnHover ? 'hover' : 'click'](e => {
                        e.stopPropagation();
                        if (e.target !== link.get(0))
                            return;
                        globals.showElement(dropDown);
                    });
                    if (openOnHover) {
                        link.mouseleave(e => {
                            e.stopPropagation();
                            globals.hideElement(dropDown);
                        });
                    }
                    else {
                        $(window).click(() => globals.hideElement(dropDown));
                    }
                    iconLocation.append(globals.gridCellDiv.clone().append(advancedFlaggingLink));
                }
                iconLocation.append(performedActionIcon);
                iconLocation.append(reportedIcon);
                iconLocation.append(nattyIcon);
                iconLocation.append(copyPastorIcon);
                iconLocation.append(smokeyIcon);
            }
            else {
                iconLocation = post.element.find('a.answer-hyperlink');
                iconLocation.after(smokeyIcon);
                iconLocation.after(copyPastorIcon);
                iconLocation.after(nattyIcon);
                iconLocation.after(reportedIcon);
                iconLocation.after(performedActionIcon);
            }
        });
    }
    function Setup() {
        MetaSmokeAPI_1.MetaSmokeAPI.Setup(globals.metaSmokeKey);
        SetupPostPage();
        SetupStyles();
        Configuration_1.SetupConfiguration();
        document.body.appendChild(popupWrapper.get(0));
        const watchedQueuesEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationWatchQueues);
        const postDetails = [];
        if (!watchedQueuesEnabled)
            return;
        RequestWatcher_1.WatchRequests().subscribe((xhr) => {
            if (xhr.status !== 200)
                return;
            const parseReviewDetails = (review) => {
                const reviewJson = JSON.parse(review);
                const postId = reviewJson.postId;
                const content = $(reviewJson.content);
                postDetails[postId] = {
                    questionTime: sotools_1.parseDate($('.post-signature.owner .user-action-time span', content).attr('title')),
                    answerTime: sotools_1.parseDate($('.user-info .user-action-time span', content).attr('title'))
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
        async function actionWatcher() {
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
                    GetCustomFlagText: (copyPastorItem) => `Possible plagiarism of another answer https:${copyPastorItem.target_url}, as can be seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}`
                },
                {
                    Id: 4,
                    DisplayName: 'Duplicate answer',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (hasDuplicatePostLinks, isRepost) => hasDuplicatePostLinks && isRepost,
                    GetComment: () => 'Please don\'t add the [same answer to multiple questions](https://meta.stackexchange.com/questions/104227/is-it-acceptable-to-add-a-duplicate-answer-to-several-questions). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                    GetCustomFlagText: (copyPastorItem) => `The answer is a repost of their other answer https:${copyPastorItem.target_url}, but as there are slight differences as seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}, an auto flag wouldn't be raised.`
                },
                {
                    Id: 5,
                    DisplayName: 'Bad attribution',
                    ReportType: 'PostOther',
                    Human: 'for moderator attention',
                    Enabled: (hasDuplicatePostLinks, isRepost) => hasDuplicatePostLinks && !isRepost,
                    GetCustomFlagText: (copyPastorItem) => `This post is copied from [another answer](https:${copyPastorItem.target_url}), as can be seen [here](https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}). The author only added a link to the other answer, which is [not the proper way of attribution](https://stackoverflow.blog/2009/06/25/attribution-required/).`
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
                    GetComment: (userDetails) => userDetails.Reputation < 50
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
                    GetComment: (userDetails) => userDetails.Reputation < 15
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
                    GetComment: (userDetails) => userDetails.Reputation < 50
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.parseDate = exports.parseQuestionsAndAnswers = exports.isUserPage = exports.isFlagsPage = exports.isQuestionPage = exports.isModPage = exports.isNatoPage = exports.IsStackOverflow = void 0;
    $.event.special.destroyed = {
        remove: (o) => {
            if (o.handler) {
                o.handler();
            }
        }
    };
    function IsStackOverflow() {
        return !!window.location.href.match(/^https:\/\/stackoverflow.com/);
    }
    exports.IsStackOverflow = IsStackOverflow;
    function isNatoPage() {
        return !!window.location.href.match(/\/tools\/new-answers-old-questions/);
    }
    exports.isNatoPage = isNatoPage;
    function isModPage() {
        return !!window.location.href.match(/\/admin/);
    }
    exports.isModPage = isModPage;
    function parseNatoPage(callback) {
        $('.answer-hyperlink').parent().parent().each((_index, element) => {
            const node = $(element);
            const postId = parseInt(node.find('.answer-hyperlink').attr('href').split('#')[1], 10);
            const answerTime = parseActionDate(node.find('.user-action-time'));
            const questionTime = parseActionDate(node.find('td .relativetime'));
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
    function isQuestionPage() {
        return !!window.location.href.match(/\/questions\/\d+.*/);
    }
    exports.isQuestionPage = isQuestionPage;
    function getPostDetails(node) {
        const score = parseInt(node.find('.vote-count-post').text(), 10);
        const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
        const { authorName, authorId } = parseAuthorDetails(node.find('.user-info .user-details').last());
        const postTime = parseActionDate(node.find('.user-info .relativetime').last());
        return { score, authorReputation, authorName, authorId, postTime };
    }
    function parseAnswerDetails(aNode, callback, question) {
        const answerId = parseInt(aNode.attr('data-answerid'), 10);
        const postDetails = getPostDetails(aNode);
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
            const postId = parseInt(qNode.attr('data-questionid'), 10);
            const postDetails = getPostDetails(qNode);
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
    function isFlagsPage() {
        return !!window.location.href.match(/\/users\/flag-summary\//);
    }
    exports.isFlagsPage = isFlagsPage;
    function parseFlagsPage(callback) {
        const nodes = $('.flagged-post');
        for (let i = 0; i < nodes.length; i++) {
            const node = $(nodes[i]);
            const type = node.find('.answer-hyperlink').length ? 'Answer' : 'Question';
            const postId = parseInt(type === 'Answer'
                ? node.find('.answer-hyperlink').attr('href').split('#')[1]
                : node.find('.question-hyperlink').attr('href').split('/')[2], 10);
            const score = parseInt(node.find('.answer-votes').text(), 10);
            const { authorName, authorId } = parseAuthorDetails(node.find('.post-user-info'));
            const postTime = parseActionDate(node.find('.post-user-info .relativetime'));
            const handledTime = parseActionDate(node.find('.mod-flag .relativetime'));
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
        }
    }
    function isUserPage() {
        return !!window.location.href.match(/\/users\/\d+.*/);
    }
    exports.isUserPage = isUserPage;
    function parseGenericPage(callback) {
        const questionNodes = $('.question-hyperlink');
        for (let i = 0; i < questionNodes.length; i++) {
            const questionNode = $(questionNodes[i]);
            let fragment = questionNode.attr('href').split('/')[2];
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
        }
        $('.answer-hyperlink').each((_index, element) => {
            const answerNode = $(element);
            let fragment = answerNode.attr('href').split('#')[1];
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
        if (isNatoPage()) {
            parseNatoPage(callback);
        }
        else if (isQuestionPage()) {
            parseQuestionPage(callback);
        }
        else if (isFlagsPage()) {
            parseFlagsPage(callback);
        }
        else if (isModPage() || isUserPage() || StackExchange.options.user.isModerator) {
            return;
        }
        else {
            parseGenericPage(callback);
        }
    }
    exports.parseQuestionsAndAnswers = parseQuestionsAndAnswers;
    function parseReputation(reputationDiv) {
        let reputationText = reputationDiv.text();
        if (reputationText.indexOf('k') !== -1) {
            reputationText = reputationDiv.attr('title').substr('reputation score '.length);
        }
        reputationText = reputationText.replace(',', '');
        if (reputationText.trim() !== '') {
            return parseInt(reputationText, 10);
        }
        return undefined;
    }
    function parseAuthorDetails(authorDiv) {
        const userLink = authorDiv.find('a');
        const authorName = userLink.text();
        const userLinkRef = userLink.attr('href');
        let authorId;
        // Users can be deleted, and thus have no link to their profile.
        if (userLinkRef) {
            authorId = parseInt(userLinkRef.split('/')[2], 10);
        }
        return { authorName, authorId };
    }
    function parseActionDate(actionDiv) {
        if (!actionDiv.hasClass('relativetime')) {
            actionDiv = actionDiv.find('.relativetime');
        }
        const answerTime = parseDate(actionDiv.attr('title'));
        return answerTime;
    }
    function parseDate(dateStr) {
        // Fix for safari
        return new Date(dateStr.replace(' ', 'T'));
    }
    exports.parseDate = parseDate;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 3 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(119), __webpack_require__(2), __webpack_require__(218), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1, sotools_1, ChatApi_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.NattyAPI = void 0;
    class NattyAPI {
        constructor(answerId) {
            this.chat = new ChatApi_1.ChatApi();
            this.subject = new rxjs_1.Subject();
            this.replaySubject = new rxjs_1.ReplaySubject();
            this.answerId = answerId;
        }
        Watch() {
            this.subject.subscribe(this.replaySubject);
            if (sotools_1.IsStackOverflow()) {
                new Promise((resolve, reject) => {
                    let numTries = 0;
                    const onError = (response) => {
                        numTries++;
                        numTries < 3 ? makeRequest() : reject('Failed to retrieve natty report: ' + response);
                    };
                    const makeRequest = () => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: `${globals.nattyFeedbackUrl}/${this.answerId}`,
                            onload: (response) => {
                                if (response.status === 200) {
                                    const nattyResult = JSON.parse(response.responseText);
                                    resolve(nattyResult.items && nattyResult.items[0]);
                                }
                                else {
                                    onError(response.responseText);
                                }
                            },
                            onerror: (response) => {
                                onError(response);
                            },
                        });
                    };
                    makeRequest();
                })
                    .then(r => this.subject.next(r))
                    .catch(err => this.subject.error(err));
            }
            return this.subject;
        }
        async ReportNaa(answerDate, questionDate) {
            if (answerDate < questionDate) {
                throw new Error('Answer must be posted after the question');
            }
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(globals.soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} tp`);
                return true;
            }
            else {
                const answerAge = this.DaysBetween(answerDate, new Date());
                const daysPostedAfterQuestion = this.DaysBetween(questionDate, answerDate);
                if (isNaN(answerAge)) {
                    throw new Error('Invalid answerDate provided');
                }
                if (isNaN(daysPostedAfterQuestion)) {
                    throw new Error('Invalid questionDate provided');
                }
                if (answerAge > 30 || daysPostedAfterQuestion < 30) {
                    return false;
                }
                const promise = this.chat.SendMessage(globals.soboticsRoomId, `@Natty report https://stackoverflow.com/a/${this.answerId}`);
                await promise.then(() => this.subject.next(true));
                return true;
            }
        }
        async ReportRedFlag() {
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(globals.soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} tp`);
                return true;
            }
            return false;
        }
        async ReportLooksFine() {
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(globals.soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} fp`);
                return true;
            }
            return false;
        }
        async ReportNeedsEditing() {
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(globals.soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} ne`);
                return true;
            }
            return false;
        }
        async WasReported() {
            return await rxjs_1.firstValueFrom(this.replaySubject.pipe(operators_1.take(1)));
        }
        DaysBetween(first, second) {
            return (second - first) / (1000 * 60 * 60 * 24);
        }
    }
    exports.NattyAPI = NattyAPI;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Observable": () => (/* reexport safe */ _internal_Observable__WEBPACK_IMPORTED_MODULE_0__.Observable),
/* harmony export */   "ConnectableObservable": () => (/* reexport safe */ _internal_observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__.ConnectableObservable),
/* harmony export */   "observable": () => (/* reexport safe */ _internal_symbol_observable__WEBPACK_IMPORTED_MODULE_2__.observable),
/* harmony export */   "animationFrames": () => (/* reexport safe */ _internal_observable_dom_animationFrames__WEBPACK_IMPORTED_MODULE_3__.animationFrames),
/* harmony export */   "Subject": () => (/* reexport safe */ _internal_Subject__WEBPACK_IMPORTED_MODULE_4__.Subject),
/* harmony export */   "BehaviorSubject": () => (/* reexport safe */ _internal_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__.BehaviorSubject),
/* harmony export */   "ReplaySubject": () => (/* reexport safe */ _internal_ReplaySubject__WEBPACK_IMPORTED_MODULE_6__.ReplaySubject),
/* harmony export */   "AsyncSubject": () => (/* reexport safe */ _internal_AsyncSubject__WEBPACK_IMPORTED_MODULE_7__.AsyncSubject),
/* harmony export */   "asap": () => (/* reexport safe */ _internal_scheduler_asap__WEBPACK_IMPORTED_MODULE_8__.asap),
/* harmony export */   "asapScheduler": () => (/* reexport safe */ _internal_scheduler_asap__WEBPACK_IMPORTED_MODULE_8__.asapScheduler),
/* harmony export */   "async": () => (/* reexport safe */ _internal_scheduler_async__WEBPACK_IMPORTED_MODULE_9__.async),
/* harmony export */   "asyncScheduler": () => (/* reexport safe */ _internal_scheduler_async__WEBPACK_IMPORTED_MODULE_9__.asyncScheduler),
/* harmony export */   "queue": () => (/* reexport safe */ _internal_scheduler_queue__WEBPACK_IMPORTED_MODULE_10__.queue),
/* harmony export */   "queueScheduler": () => (/* reexport safe */ _internal_scheduler_queue__WEBPACK_IMPORTED_MODULE_10__.queueScheduler),
/* harmony export */   "animationFrame": () => (/* reexport safe */ _internal_scheduler_animationFrame__WEBPACK_IMPORTED_MODULE_11__.animationFrame),
/* harmony export */   "animationFrameScheduler": () => (/* reexport safe */ _internal_scheduler_animationFrame__WEBPACK_IMPORTED_MODULE_11__.animationFrameScheduler),
/* harmony export */   "VirtualTimeScheduler": () => (/* reexport safe */ _internal_scheduler_VirtualTimeScheduler__WEBPACK_IMPORTED_MODULE_12__.VirtualTimeScheduler),
/* harmony export */   "VirtualAction": () => (/* reexport safe */ _internal_scheduler_VirtualTimeScheduler__WEBPACK_IMPORTED_MODULE_12__.VirtualAction),
/* harmony export */   "Scheduler": () => (/* reexport safe */ _internal_Scheduler__WEBPACK_IMPORTED_MODULE_13__.Scheduler),
/* harmony export */   "Subscription": () => (/* reexport safe */ _internal_Subscription__WEBPACK_IMPORTED_MODULE_14__.Subscription),
/* harmony export */   "Subscriber": () => (/* reexport safe */ _internal_Subscriber__WEBPACK_IMPORTED_MODULE_15__.Subscriber),
/* harmony export */   "Notification": () => (/* reexport safe */ _internal_Notification__WEBPACK_IMPORTED_MODULE_16__.Notification),
/* harmony export */   "NotificationKind": () => (/* reexport safe */ _internal_Notification__WEBPACK_IMPORTED_MODULE_16__.NotificationKind),
/* harmony export */   "pipe": () => (/* reexport safe */ _internal_util_pipe__WEBPACK_IMPORTED_MODULE_17__.pipe),
/* harmony export */   "noop": () => (/* reexport safe */ _internal_util_noop__WEBPACK_IMPORTED_MODULE_18__.noop),
/* harmony export */   "identity": () => (/* reexport safe */ _internal_util_identity__WEBPACK_IMPORTED_MODULE_19__.identity),
/* harmony export */   "isObservable": () => (/* reexport safe */ _internal_util_isObservable__WEBPACK_IMPORTED_MODULE_20__.isObservable),
/* harmony export */   "lastValueFrom": () => (/* reexport safe */ _internal_lastValueFrom__WEBPACK_IMPORTED_MODULE_21__.lastValueFrom),
/* harmony export */   "firstValueFrom": () => (/* reexport safe */ _internal_firstValueFrom__WEBPACK_IMPORTED_MODULE_22__.firstValueFrom),
/* harmony export */   "ArgumentOutOfRangeError": () => (/* reexport safe */ _internal_util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_23__.ArgumentOutOfRangeError),
/* harmony export */   "EmptyError": () => (/* reexport safe */ _internal_util_EmptyError__WEBPACK_IMPORTED_MODULE_24__.EmptyError),
/* harmony export */   "NotFoundError": () => (/* reexport safe */ _internal_util_NotFoundError__WEBPACK_IMPORTED_MODULE_25__.NotFoundError),
/* harmony export */   "ObjectUnsubscribedError": () => (/* reexport safe */ _internal_util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_26__.ObjectUnsubscribedError),
/* harmony export */   "SequenceError": () => (/* reexport safe */ _internal_util_SequenceError__WEBPACK_IMPORTED_MODULE_27__.SequenceError),
/* harmony export */   "TimeoutError": () => (/* reexport safe */ _internal_operators_timeout__WEBPACK_IMPORTED_MODULE_28__.TimeoutError),
/* harmony export */   "UnsubscriptionError": () => (/* reexport safe */ _internal_util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_29__.UnsubscriptionError),
/* harmony export */   "bindCallback": () => (/* reexport safe */ _internal_observable_bindCallback__WEBPACK_IMPORTED_MODULE_30__.bindCallback),
/* harmony export */   "bindNodeCallback": () => (/* reexport safe */ _internal_observable_bindNodeCallback__WEBPACK_IMPORTED_MODULE_31__.bindNodeCallback),
/* harmony export */   "combineLatest": () => (/* reexport safe */ _internal_observable_combineLatest__WEBPACK_IMPORTED_MODULE_32__.combineLatest),
/* harmony export */   "concat": () => (/* reexport safe */ _internal_observable_concat__WEBPACK_IMPORTED_MODULE_33__.concat),
/* harmony export */   "connectable": () => (/* reexport safe */ _internal_observable_connectable__WEBPACK_IMPORTED_MODULE_34__.connectable),
/* harmony export */   "defer": () => (/* reexport safe */ _internal_observable_defer__WEBPACK_IMPORTED_MODULE_35__.defer),
/* harmony export */   "empty": () => (/* reexport safe */ _internal_observable_empty__WEBPACK_IMPORTED_MODULE_36__.empty),
/* harmony export */   "forkJoin": () => (/* reexport safe */ _internal_observable_forkJoin__WEBPACK_IMPORTED_MODULE_37__.forkJoin),
/* harmony export */   "from": () => (/* reexport safe */ _internal_observable_from__WEBPACK_IMPORTED_MODULE_38__.from),
/* harmony export */   "fromEvent": () => (/* reexport safe */ _internal_observable_fromEvent__WEBPACK_IMPORTED_MODULE_39__.fromEvent),
/* harmony export */   "fromEventPattern": () => (/* reexport safe */ _internal_observable_fromEventPattern__WEBPACK_IMPORTED_MODULE_40__.fromEventPattern),
/* harmony export */   "generate": () => (/* reexport safe */ _internal_observable_generate__WEBPACK_IMPORTED_MODULE_41__.generate),
/* harmony export */   "iif": () => (/* reexport safe */ _internal_observable_iif__WEBPACK_IMPORTED_MODULE_42__.iif),
/* harmony export */   "interval": () => (/* reexport safe */ _internal_observable_interval__WEBPACK_IMPORTED_MODULE_43__.interval),
/* harmony export */   "merge": () => (/* reexport safe */ _internal_observable_merge__WEBPACK_IMPORTED_MODULE_44__.merge),
/* harmony export */   "never": () => (/* reexport safe */ _internal_observable_never__WEBPACK_IMPORTED_MODULE_45__.never),
/* harmony export */   "of": () => (/* reexport safe */ _internal_observable_of__WEBPACK_IMPORTED_MODULE_46__.of),
/* harmony export */   "onErrorResumeNext": () => (/* reexport safe */ _internal_observable_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_47__.onErrorResumeNext),
/* harmony export */   "pairs": () => (/* reexport safe */ _internal_observable_pairs__WEBPACK_IMPORTED_MODULE_48__.pairs),
/* harmony export */   "partition": () => (/* reexport safe */ _internal_observable_partition__WEBPACK_IMPORTED_MODULE_49__.partition),
/* harmony export */   "race": () => (/* reexport safe */ _internal_observable_race__WEBPACK_IMPORTED_MODULE_50__.race),
/* harmony export */   "range": () => (/* reexport safe */ _internal_observable_range__WEBPACK_IMPORTED_MODULE_51__.range),
/* harmony export */   "throwError": () => (/* reexport safe */ _internal_observable_throwError__WEBPACK_IMPORTED_MODULE_52__.throwError),
/* harmony export */   "timer": () => (/* reexport safe */ _internal_observable_timer__WEBPACK_IMPORTED_MODULE_53__.timer),
/* harmony export */   "using": () => (/* reexport safe */ _internal_observable_using__WEBPACK_IMPORTED_MODULE_54__.using),
/* harmony export */   "zip": () => (/* reexport safe */ _internal_observable_zip__WEBPACK_IMPORTED_MODULE_55__.zip),
/* harmony export */   "scheduled": () => (/* reexport safe */ _internal_scheduled_scheduled__WEBPACK_IMPORTED_MODULE_56__.scheduled),
/* harmony export */   "EMPTY": () => (/* reexport safe */ _internal_observable_empty__WEBPACK_IMPORTED_MODULE_36__.EMPTY),
/* harmony export */   "NEVER": () => (/* reexport safe */ _internal_observable_never__WEBPACK_IMPORTED_MODULE_45__.NEVER),
/* harmony export */   "config": () => (/* reexport safe */ _internal_config__WEBPACK_IMPORTED_MODULE_57__.config)
/* harmony export */ });
/* harmony import */ var _internal_Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _internal_observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);
/* harmony import */ var _internal_symbol_observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18);
/* harmony import */ var _internal_observable_dom_animationFrames__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25);
/* harmony import */ var _internal_Subject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(28);
/* harmony import */ var _internal_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(30);
/* harmony import */ var _internal_ReplaySubject__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(31);
/* harmony import */ var _internal_AsyncSubject__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(33);
/* harmony import */ var _internal_scheduler_asap__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(34);
/* harmony import */ var _internal_scheduler_async__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(44);
/* harmony import */ var _internal_scheduler_queue__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(45);
/* harmony import */ var _internal_scheduler_animationFrame__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(48);
/* harmony import */ var _internal_scheduler_VirtualTimeScheduler__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(51);
/* harmony import */ var _internal_Scheduler__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(37);
/* harmony import */ var _internal_Subscription__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(8);
/* harmony import */ var _internal_Subscriber__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(6);
/* harmony import */ var _internal_Notification__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(52);
/* harmony import */ var _internal_util_pipe__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(19);
/* harmony import */ var _internal_util_noop__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(15);
/* harmony import */ var _internal_util_identity__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(20);
/* harmony import */ var _internal_util_isObservable__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(74);
/* harmony import */ var _internal_lastValueFrom__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(75);
/* harmony import */ var _internal_firstValueFrom__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(77);
/* harmony import */ var _internal_util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(78);
/* harmony import */ var _internal_util_EmptyError__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(76);
/* harmony import */ var _internal_util_NotFoundError__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(79);
/* harmony import */ var _internal_util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(29);
/* harmony import */ var _internal_util_SequenceError__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(80);
/* harmony import */ var _internal_operators_timeout__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(81);
/* harmony import */ var _internal_util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(10);
/* harmony import */ var _internal_observable_bindCallback__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(83);
/* harmony import */ var _internal_observable_bindNodeCallback__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(89);
/* harmony import */ var _internal_observable_combineLatest__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(90);
/* harmony import */ var _internal_observable_concat__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(92);
/* harmony import */ var _internal_observable_connectable__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(97);
/* harmony import */ var _internal_observable_defer__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(98);
/* harmony import */ var _internal_observable_empty__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(73);
/* harmony import */ var _internal_observable_forkJoin__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(99);
/* harmony import */ var _internal_observable_from__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(58);
/* harmony import */ var _internal_observable_fromEvent__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(100);
/* harmony import */ var _internal_observable_fromEventPattern__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(101);
/* harmony import */ var _internal_observable_generate__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(102);
/* harmony import */ var _internal_observable_iif__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(103);
/* harmony import */ var _internal_observable_interval__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(104);
/* harmony import */ var _internal_observable_merge__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(106);
/* harmony import */ var _internal_observable_never__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(108);
/* harmony import */ var _internal_observable_of__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(53);
/* harmony import */ var _internal_observable_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(109);
/* harmony import */ var _internal_observable_pairs__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(111);
/* harmony import */ var _internal_observable_partition__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(112);
/* harmony import */ var _internal_observable_race__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(115);
/* harmony import */ var _internal_observable_range__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__(116);
/* harmony import */ var _internal_observable_throwError__WEBPACK_IMPORTED_MODULE_52__ = __webpack_require__(72);
/* harmony import */ var _internal_observable_timer__WEBPACK_IMPORTED_MODULE_53__ = __webpack_require__(105);
/* harmony import */ var _internal_observable_using__WEBPACK_IMPORTED_MODULE_54__ = __webpack_require__(117);
/* harmony import */ var _internal_observable_zip__WEBPACK_IMPORTED_MODULE_55__ = __webpack_require__(118);
/* harmony import */ var _internal_scheduled_scheduled__WEBPACK_IMPORTED_MODULE_56__ = __webpack_require__(59);
/* harmony import */ var _internal_config__WEBPACK_IMPORTED_MODULE_57__ = __webpack_require__(14);





























































//# sourceMappingURL=index.js.map

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Observable": () => (/* binding */ Observable)
/* harmony export */ });
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(8);
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18);
/* harmony import */ var _util_pipe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(19);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(14);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(9);






var Observable = (function () {
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new _Subscriber__WEBPACK_IMPORTED_MODULE_0__.SafeSubscriber(observerOrNext, error, complete);
        var _a = this, operator = _a.operator, source = _a.source;
        subscriber.add(operator
            ? operator.call(subscriber, source)
            : source || _config__WEBPACK_IMPORTED_MODULE_1__.config.useDeprecatedSynchronousErrorHandling
                ? this._subscribe(subscriber)
                : this._trySubscribe(subscriber));
        return subscriber;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            if (_config__WEBPACK_IMPORTED_MODULE_1__.config.useDeprecatedSynchronousErrorHandling) {
                throw err;
            }
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscription;
            subscription = _this.subscribe(function (value) {
                try {
                    next(value);
                }
                catch (err) {
                    reject(err);
                    subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
                }
            }, reject, resolve);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable.prototype[_symbol_observable__WEBPACK_IMPORTED_MODULE_2__.observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return operations.length ? (0,_util_pipe__WEBPACK_IMPORTED_MODULE_3__.pipeFromArray)(operations)(this) : this;
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());

function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : _config__WEBPACK_IMPORTED_MODULE_1__.config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_4__.isFunction)(value.next) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_4__.isFunction)(value.error) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_4__.isFunction)(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof _Subscriber__WEBPACK_IMPORTED_MODULE_0__.Subscriber) || (isObserver(value) && (0,_Subscription__WEBPACK_IMPORTED_MODULE_5__.isSubscription)(value));
}
//# sourceMappingURL=Observable.js.map

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Subscriber": () => (/* binding */ Subscriber),
/* harmony export */   "SafeSubscriber": () => (/* binding */ SafeSubscriber),
/* harmony export */   "EMPTY_OBSERVER": () => (/* binding */ EMPTY_OBSERVER)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(14);
/* harmony import */ var _util_reportUnhandledError__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(16);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(15);
/* harmony import */ var _NotificationFactories__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(13);
/* harmony import */ var _scheduler_timeoutProvider__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(17);








var Subscriber = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Subscriber, _super);
    function Subscriber(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
            _this.destination = destination;
            if ((0,_Subscription__WEBPACK_IMPORTED_MODULE_1__.isSubscription)(destination)) {
                destination.add(_this);
            }
        }
        else {
            _this.destination = EMPTY_OBSERVER;
        }
        return _this;
    }
    Subscriber.create = function (next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    };
    Subscriber.prototype.next = function (value) {
        if (this.isStopped) {
            handleStoppedNotification((0,_NotificationFactories__WEBPACK_IMPORTED_MODULE_2__.nextNotification)(value), this);
        }
        else {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (this.isStopped) {
            handleStoppedNotification((0,_NotificationFactories__WEBPACK_IMPORTED_MODULE_2__.errorNotification)(err), this);
        }
        else {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (this.isStopped) {
            handleStoppedNotification(_NotificationFactories__WEBPACK_IMPORTED_MODULE_2__.COMPLETE_NOTIFICATION, this);
        }
        else {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
        }
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        this.destination.error(err);
        this.unsubscribe();
    };
    Subscriber.prototype._complete = function () {
        this.destination.complete();
        this.unsubscribe();
    };
    return Subscriber;
}(_Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription));

var SafeSubscriber = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(SafeSubscriber, _super);
    function SafeSubscriber(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        _this.destination = EMPTY_OBSERVER;
        if ((observerOrNext || error || complete) && observerOrNext !== EMPTY_OBSERVER) {
            var next = void 0;
            if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_3__.isFunction)(observerOrNext)) {
                next = observerOrNext;
            }
            else if (observerOrNext) {
                (next = observerOrNext.next, error = observerOrNext.error, complete = observerOrNext.complete);
                var context_1;
                if (_this && _config__WEBPACK_IMPORTED_MODULE_4__.config.useDeprecatedNextContext) {
                    context_1 = Object.create(observerOrNext);
                    context_1.unsubscribe = function () { return _this.unsubscribe(); };
                }
                else {
                    context_1 = observerOrNext;
                }
                next = next === null || next === void 0 ? void 0 : next.bind(context_1);
                error = error === null || error === void 0 ? void 0 : error.bind(context_1);
                complete = complete === null || complete === void 0 ? void 0 : complete.bind(context_1);
            }
            _this.destination = {
                next: next || _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop,
                error: error || defaultErrorHandler,
                complete: complete || _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop,
            };
        }
        return _this;
    }
    return SafeSubscriber;
}(Subscriber));

function defaultErrorHandler(err) {
    if (_config__WEBPACK_IMPORTED_MODULE_4__.config.useDeprecatedSynchronousErrorHandling) {
        throw err;
    }
    (0,_util_reportUnhandledError__WEBPACK_IMPORTED_MODULE_6__.reportUnhandledError)(err);
}
function handleStoppedNotification(notification, subscriber) {
    var onStoppedNotification = _config__WEBPACK_IMPORTED_MODULE_4__.config.onStoppedNotification;
    onStoppedNotification && _scheduler_timeoutProvider__WEBPACK_IMPORTED_MODULE_7__.timeoutProvider.setTimeout(function () { return onStoppedNotification(notification, subscriber); });
}
var EMPTY_OBSERVER = {
    closed: true,
    next: _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop,
    error: defaultErrorHandler,
    complete: _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop,
};
//# sourceMappingURL=Subscriber.js.map

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => (/* binding */ __extends),
/* harmony export */   "__assign": () => (/* binding */ __assign),
/* harmony export */   "__rest": () => (/* binding */ __rest),
/* harmony export */   "__decorate": () => (/* binding */ __decorate),
/* harmony export */   "__param": () => (/* binding */ __param),
/* harmony export */   "__metadata": () => (/* binding */ __metadata),
/* harmony export */   "__awaiter": () => (/* binding */ __awaiter),
/* harmony export */   "__generator": () => (/* binding */ __generator),
/* harmony export */   "__createBinding": () => (/* binding */ __createBinding),
/* harmony export */   "__exportStar": () => (/* binding */ __exportStar),
/* harmony export */   "__values": () => (/* binding */ __values),
/* harmony export */   "__read": () => (/* binding */ __read),
/* harmony export */   "__spread": () => (/* binding */ __spread),
/* harmony export */   "__spreadArrays": () => (/* binding */ __spreadArrays),
/* harmony export */   "__await": () => (/* binding */ __await),
/* harmony export */   "__asyncGenerator": () => (/* binding */ __asyncGenerator),
/* harmony export */   "__asyncDelegator": () => (/* binding */ __asyncDelegator),
/* harmony export */   "__asyncValues": () => (/* binding */ __asyncValues),
/* harmony export */   "__makeTemplateObject": () => (/* binding */ __makeTemplateObject),
/* harmony export */   "__importStar": () => (/* binding */ __importStar),
/* harmony export */   "__importDefault": () => (/* binding */ __importDefault),
/* harmony export */   "__classPrivateFieldGet": () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   "__classPrivateFieldSet": () => (/* binding */ __classPrivateFieldSet)
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Subscription": () => (/* binding */ Subscription),
/* harmony export */   "EMPTY_SUBSCRIPTION": () => (/* binding */ EMPTY_SUBSCRIPTION),
/* harmony export */   "isSubscription": () => (/* binding */ isSubscription)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);
/* harmony import */ var _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(10);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);




var Subscription = (function () {
    function Subscription(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._teardowns = null;
    }
    Subscription.prototype.unsubscribe = function () {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
            this.closed = true;
            var _parentage = this._parentage;
            if (Array.isArray(_parentage)) {
                try {
                    for (var _parentage_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__values)(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                        var parent_1 = _parentage_1_1.value;
                        parent_1.remove(this);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                _parentage === null || _parentage === void 0 ? void 0 : _parentage.remove(this);
            }
            var initialTeardown = this.initialTeardown;
            if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(initialTeardown)) {
                try {
                    initialTeardown();
                }
                catch (e) {
                    errors = e instanceof _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_2__.UnsubscriptionError ? e.errors : [e];
                }
            }
            var _teardowns = this._teardowns;
            if (_teardowns) {
                this._teardowns = null;
                try {
                    for (var _teardowns_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__values)(_teardowns), _teardowns_1_1 = _teardowns_1.next(); !_teardowns_1_1.done; _teardowns_1_1 = _teardowns_1.next()) {
                        var teardown_1 = _teardowns_1_1.value;
                        try {
                            execTeardown(teardown_1);
                        }
                        catch (err) {
                            errors = errors !== null && errors !== void 0 ? errors : [];
                            if (err instanceof _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_2__.UnsubscriptionError) {
                                errors = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(errors, err.errors);
                            }
                            else {
                                errors.push(err);
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_teardowns_1_1 && !_teardowns_1_1.done && (_b = _teardowns_1.return)) _b.call(_teardowns_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (errors) {
                throw new _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_2__.UnsubscriptionError(errors);
            }
        }
    };
    Subscription.prototype.add = function (teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execTeardown(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._teardowns = (_a = this._teardowns) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    };
    Subscription.prototype._hasParent = function (parent) {
        var _parentage = this._parentage;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    };
    Subscription.prototype._addParent = function (parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription.prototype._removeParent = function (parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_3__.arrRemove)(_parentage, parent);
        }
    };
    Subscription.prototype.remove = function (teardown) {
        var _teardowns = this._teardowns;
        _teardowns && (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_3__.arrRemove)(_teardowns, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    };
    Subscription.EMPTY = (function () {
        var empty = new Subscription();
        empty.closed = true;
        return empty;
    })();
    return Subscription;
}());

var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value.remove) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value.add) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value.unsubscribe)));
}
function execTeardown(teardown) {
    if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(teardown)) {
        teardown();
    }
    else {
        teardown.unsubscribe();
    }
}
//# sourceMappingURL=Subscription.js.map

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isFunction": () => (/* binding */ isFunction)
/* harmony export */ });
function isFunction(value) {
    return typeof value === 'function';
}
//# sourceMappingURL=isFunction.js.map

/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "UnsubscriptionError": () => (/* binding */ UnsubscriptionError)
/* harmony export */ });
/* harmony import */ var _createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

var UnsubscriptionError = (0,_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});
//# sourceMappingURL=UnsubscriptionError.js.map

/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createErrorClass": () => (/* binding */ createErrorClass)
/* harmony export */ });
function createErrorClass(createImpl) {
    var _super = function (instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}
//# sourceMappingURL=createErrorClass.js.map

/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "arrRemove": () => (/* binding */ arrRemove)
/* harmony export */ });
function arrRemove(arr, item) {
    if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}
//# sourceMappingURL=arrRemove.js.map

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "COMPLETE_NOTIFICATION": () => (/* binding */ COMPLETE_NOTIFICATION),
/* harmony export */   "errorNotification": () => (/* binding */ errorNotification),
/* harmony export */   "nextNotification": () => (/* binding */ nextNotification),
/* harmony export */   "createNotification": () => (/* binding */ createNotification)
/* harmony export */ });
var COMPLETE_NOTIFICATION = (function () { return createNotification('C', undefined, undefined); })();
function errorNotification(error) {
    return createNotification('E', undefined, error);
}
function nextNotification(value) {
    return createNotification('N', value, undefined);
}
function createNotification(kind, value, error) {
    return {
        kind: kind,
        value: value,
        error: error,
    };
}
//# sourceMappingURL=NotificationFactories.js.map

/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "config": () => (/* binding */ config)
/* harmony export */ });
var config = {
    onUnhandledError: null,
    onStoppedNotification: null,
    Promise: undefined,
    useDeprecatedSynchronousErrorHandling: false,
    useDeprecatedNextContext: false,
};
//# sourceMappingURL=config.js.map

/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "noop": () => (/* binding */ noop)
/* harmony export */ });
function noop() { }
//# sourceMappingURL=noop.js.map

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "reportUnhandledError": () => (/* binding */ reportUnhandledError)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(14);
/* harmony import */ var _scheduler_timeoutProvider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(17);


function reportUnhandledError(err) {
    _scheduler_timeoutProvider__WEBPACK_IMPORTED_MODULE_0__.timeoutProvider.setTimeout(function () {
        var onUnhandledError = _config__WEBPACK_IMPORTED_MODULE_1__.config.onUnhandledError;
        if (onUnhandledError) {
            onUnhandledError(err);
        }
        else {
            throw err;
        }
    });
}
//# sourceMappingURL=reportUnhandledError.js.map

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timeoutProvider": () => (/* binding */ timeoutProvider)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);

var timeoutProvider = {
    setTimeout: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) || setTimeout).apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(args));
    },
    clearTimeout: function (handle) {
        var delegate = timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
    },
    delegate: undefined,
};
//# sourceMappingURL=timeoutProvider.js.map

/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "observable": () => (/* binding */ observable)
/* harmony export */ });
var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();
//# sourceMappingURL=observable.js.map

/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pipe": () => (/* binding */ pipe),
/* harmony export */   "pipeFromArray": () => (/* binding */ pipeFromArray)
/* harmony export */ });
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);

function pipe() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return pipeFromArray(fns);
}
function pipeFromArray(fns) {
    if (fns.length === 0) {
        return _identity__WEBPACK_IMPORTED_MODULE_0__.identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}
//# sourceMappingURL=pipe.js.map

/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "identity": () => (/* binding */ identity)
/* harmony export */ });
function identity(x) {
    return x;
}
//# sourceMappingURL=identity.js.map

/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ConnectableObservable": () => (/* binding */ ConnectableObservable)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _operators_refCount__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(23);
/* harmony import */ var _operators_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);





var ConnectableObservable = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(ConnectableObservable, _super);
    function ConnectableObservable(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._subject = null;
        _this._refCount = 0;
        _this._connection = null;
        return _this;
    }
    ConnectableObservable.prototype._subscribe = function (subscriber) {
        return this.getSubject().subscribe(subscriber);
    };
    ConnectableObservable.prototype.getSubject = function () {
        var subject = this._subject;
        if (!subject || subject.isStopped) {
            this._subject = this.subjectFactory();
        }
        return this._subject;
    };
    ConnectableObservable.prototype._teardown = function () {
        this._refCount = 0;
        var _connection = this._connection;
        this._subject = this._connection = null;
        _connection === null || _connection === void 0 ? void 0 : _connection.unsubscribe();
    };
    ConnectableObservable.prototype.connect = function () {
        var _this = this;
        var connection = this._connection;
        if (!connection) {
            connection = this._connection = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
            var subject_1 = this.getSubject();
            connection.add(this.source.subscribe(new _operators_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subject_1, undefined, function (err) {
                _this._teardown();
                subject_1.error(err);
            }, function () {
                _this._teardown();
                subject_1.complete();
            }, function () { return _this._teardown(); })));
            if (connection.closed) {
                this._connection = null;
                connection = _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription.EMPTY;
            }
        }
        return connection;
    };
    ConnectableObservable.prototype.refCount = function () {
        return (0,_operators_refCount__WEBPACK_IMPORTED_MODULE_3__.refCount)()(this);
    };
    return ConnectableObservable;
}(_Observable__WEBPACK_IMPORTED_MODULE_4__.Observable));

//# sourceMappingURL=ConnectableObservable.js.map

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OperatorSubscriber": () => (/* binding */ OperatorSubscriber)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6);


var OperatorSubscriber = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(OperatorSubscriber, _super);
    function OperatorSubscriber(destination, onNext, onError, onComplete, onUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onUnsubscribe = onUnsubscribe;
        _this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    this.destination.error(err);
                }
            }
            : _super.prototype._next;
        _this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    this.destination.error(err);
                }
                this.unsubscribe();
            }
            : _super.prototype._error;
        _this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    this.destination.error(err);
                }
                this.unsubscribe();
            }
            : _super.prototype._complete;
        return _this;
    }
    OperatorSubscriber.prototype.unsubscribe = function () {
        var _a;
        !this.closed && ((_a = this.onUnsubscribe) === null || _a === void 0 ? void 0 : _a.call(this));
        _super.prototype.unsubscribe.call(this);
    };
    return OperatorSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

//# sourceMappingURL=OperatorSubscriber.js.map

/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "refCount": () => (/* binding */ refCount)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function refCount() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var connection = null;
        source._refCount++;
        var refCounter = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, undefined, undefined, undefined, function () {
            if (!source || source._refCount <= 0 || 0 < --source._refCount) {
                connection = null;
                return;
            }
            var sharedConnection = source._connection;
            var conn = connection;
            connection = null;
            if (sharedConnection && (!conn || sharedConnection === conn)) {
                sharedConnection.unsubscribe();
            }
            subscriber.unsubscribe();
        });
        source.subscribe(refCounter);
        if (!refCounter.closed) {
            connection = source.connect();
        }
    });
}
//# sourceMappingURL=refCount.js.map

/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hasLift": () => (/* binding */ hasLift),
/* harmony export */   "operate": () => (/* binding */ operate)
/* harmony export */ });
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

function hasLift(source) {
    return (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
    return function (source) {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}
//# sourceMappingURL=lift.js.map

/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "animationFrames": () => (/* binding */ animationFrames)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _scheduler_performanceTimestampProvider__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(27);
/* harmony import */ var _scheduler_animationFrameProvider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26);




function animationFrames(timestampProvider) {
    return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
}
function animationFramesFactory(timestampProvider) {
    var schedule = _scheduler_animationFrameProvider__WEBPACK_IMPORTED_MODULE_0__.animationFrameProvider.schedule;
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        var subscription = new _Subscription__WEBPACK_IMPORTED_MODULE_2__.Subscription();
        var provider = timestampProvider || _scheduler_performanceTimestampProvider__WEBPACK_IMPORTED_MODULE_3__.performanceTimestampProvider;
        var start = provider.now();
        var run = function (timestamp) {
            var now = provider.now();
            subscriber.next({
                timestamp: timestampProvider ? now : timestamp,
                elapsed: now - start
            });
            if (!subscriber.closed) {
                subscription.add(schedule(run));
            }
        };
        subscription.add(schedule(run));
        return subscription;
    });
}
var DEFAULT_ANIMATION_FRAMES = animationFramesFactory();
//# sourceMappingURL=animationFrames.js.map

/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "animationFrameProvider": () => (/* binding */ animationFrameProvider)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);


var animationFrameProvider = {
    schedule: function (callback) {
        var request = requestAnimationFrame;
        var cancel = cancelAnimationFrame;
        var delegate = animationFrameProvider.delegate;
        if (delegate) {
            request = delegate.requestAnimationFrame;
            cancel = delegate.cancelAnimationFrame;
        }
        var handle = request(function (timestamp) {
            cancel = undefined;
            callback(timestamp);
        });
        return new _Subscription__WEBPACK_IMPORTED_MODULE_0__.Subscription(function () { return cancel === null || cancel === void 0 ? void 0 : cancel(handle); });
    },
    requestAnimationFrame: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.requestAnimationFrame) || requestAnimationFrame).apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__spread)(args));
    },
    cancelAnimationFrame: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = animationFrameProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.cancelAnimationFrame) || cancelAnimationFrame).apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__spread)(args));
    },
    delegate: undefined,
};
//# sourceMappingURL=animationFrameProvider.js.map

/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "performanceTimestampProvider": () => (/* binding */ performanceTimestampProvider)
/* harmony export */ });
var performanceTimestampProvider = {
    now: function () {
        return (performanceTimestampProvider.delegate || performance).now();
    },
    delegate: undefined,
};
//# sourceMappingURL=performanceTimestampProvider.js.map

/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Subject": () => (/* binding */ Subject),
/* harmony export */   "AnonymousSubject": () => (/* binding */ AnonymousSubject)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(29);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);





var Subject = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.observers = [];
        _this.closed = false;
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype._throwIfClosed = function () {
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_1__.ObjectUnsubscribedError();
        }
    };
    Subject.prototype.next = function (value) {
        var e_1, _a;
        this._throwIfClosed();
        if (!this.isStopped) {
            var copy = this.observers.slice();
            try {
                for (var copy_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__values)(copy), copy_1_1 = copy_1.next(); !copy_1_1.done; copy_1_1 = copy_1.next()) {
                    var observer = copy_1_1.value;
                    observer.next(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (copy_1_1 && !copy_1_1.done && (_a = copy_1.return)) _a.call(copy_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
    };
    Subject.prototype.error = function (err) {
        this._throwIfClosed();
        if (!this.isStopped) {
            this.hasError = this.isStopped = true;
            this.thrownError = err;
            var observers = this.observers;
            while (observers.length) {
                observers.shift().error(err);
            }
        }
    };
    Subject.prototype.complete = function () {
        this._throwIfClosed();
        if (!this.isStopped) {
            this.isStopped = true;
            var observers = this.observers;
            while (observers.length) {
                observers.shift().complete();
            }
        }
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = this.closed = true;
        this.observers = null;
    };
    Subject.prototype._trySubscribe = function (subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
    };
    Subject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    };
    Subject.prototype._innerSubscribe = function (subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        return hasError || isStopped
            ? _Subscription__WEBPACK_IMPORTED_MODULE_2__.EMPTY_SUBSCRIPTION
            : (observers.push(subscriber), new _Subscription__WEBPACK_IMPORTED_MODULE_2__.Subscription(function () { return (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_3__.arrRemove)(_this.observers, subscriber); }));
    };
    Subject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new _Observable__WEBPACK_IMPORTED_MODULE_4__.Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(_Observable__WEBPACK_IMPORTED_MODULE_4__.Observable));

var AnonymousSubject = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    };
    AnonymousSubject.prototype.error = function (err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    };
    AnonymousSubject.prototype.complete = function () {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : _Subscription__WEBPACK_IMPORTED_MODULE_2__.EMPTY_SUBSCRIPTION;
    };
    return AnonymousSubject;
}(Subject));

//# sourceMappingURL=Subject.js.map

/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ObjectUnsubscribedError": () => (/* binding */ ObjectUnsubscribedError)
/* harmony export */ });
/* harmony import */ var _createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

var ObjectUnsubscribedError = (0,_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) {
    return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = 'ObjectUnsubscribedError';
        this.message = 'object unsubscribed';
    };
});
//# sourceMappingURL=ObjectUnsubscribedError.js.map

/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BehaviorSubject": () => (/* binding */ BehaviorSubject)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);


var BehaviorSubject = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: false,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, (this._value = value));
    };
    return BehaviorSubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_1__.Subject));

//# sourceMappingURL=BehaviorSubject.js.map

/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ReplaySubject": () => (/* binding */ ReplaySubject)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(28);
/* harmony import */ var _scheduler_dateTimestampProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32);



var ReplaySubject = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(ReplaySubject, _super);
    function ReplaySubject(bufferSize, windowTime, timestampProvider) {
        if (bufferSize === void 0) { bufferSize = Infinity; }
        if (windowTime === void 0) { windowTime = Infinity; }
        if (timestampProvider === void 0) { timestampProvider = _scheduler_dateTimestampProvider__WEBPACK_IMPORTED_MODULE_1__.dateTimestampProvider; }
        var _this = _super.call(this) || this;
        _this.bufferSize = bufferSize;
        _this.windowTime = windowTime;
        _this.timestampProvider = timestampProvider;
        _this.buffer = [];
        _this.infiniteTimeWindow = true;
        _this.infiniteTimeWindow = windowTime === Infinity;
        _this.bufferSize = Math.max(1, bufferSize);
        _this.windowTime = Math.max(1, windowTime);
        return _this;
    }
    ReplaySubject.prototype.next = function (value) {
        var _a = this, isStopped = _a.isStopped, buffer = _a.buffer, infiniteTimeWindow = _a.infiniteTimeWindow, timestampProvider = _a.timestampProvider, windowTime = _a.windowTime;
        if (!isStopped) {
            buffer.push(value);
            !infiniteTimeWindow && buffer.push(timestampProvider.now() + windowTime);
        }
        this.trimBuffer();
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this.trimBuffer();
        var subscription = this._innerSubscribe(subscriber);
        var _a = this, infiniteTimeWindow = _a.infiniteTimeWindow, buffer = _a.buffer;
        var copy = buffer.slice();
        for (var i = 0; i < copy.length && !subscriber.closed; i += infiniteTimeWindow ? 1 : 2) {
            subscriber.next(copy[i]);
        }
        this._checkFinalizedStatuses(subscriber);
        return subscription;
    };
    ReplaySubject.prototype.trimBuffer = function () {
        var _a = this, bufferSize = _a.bufferSize, timestampProvider = _a.timestampProvider, buffer = _a.buffer, infiniteTimeWindow = _a.infiniteTimeWindow;
        var adjustedBufferSize = (infiniteTimeWindow ? 1 : 2) * bufferSize;
        bufferSize < Infinity && adjustedBufferSize < buffer.length && buffer.splice(0, buffer.length - adjustedBufferSize);
        if (!infiniteTimeWindow) {
            var now = timestampProvider.now();
            var last = 0;
            for (var i = 1; i < buffer.length && buffer[i] <= now; i += 2) {
                last = i;
            }
            last && buffer.splice(0, last + 1);
        }
    };
    return ReplaySubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_2__.Subject));

//# sourceMappingURL=ReplaySubject.js.map

/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dateTimestampProvider": () => (/* binding */ dateTimestampProvider)
/* harmony export */ });
var dateTimestampProvider = {
    now: function () {
        return (dateTimestampProvider.delegate || Date).now();
    },
    delegate: undefined,
};
//# sourceMappingURL=dateTimestampProvider.js.map

/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsyncSubject": () => (/* binding */ AsyncSubject)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);


var AsyncSubject = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AsyncSubject, _super);
    function AsyncSubject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.value = null;
        _this.hasValue = false;
        _this.isComplete = false;
        return _this;
    }
    AsyncSubject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, hasValue = _a.hasValue, value = _a.value, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            hasValue && subscriber.next(value);
            subscriber.complete();
        }
    };
    AsyncSubject.prototype.next = function (value) {
        if (!this.isStopped) {
            this.value = value;
            this.hasValue = true;
        }
    };
    AsyncSubject.prototype.complete = function () {
        var _a = this, hasValue = _a.hasValue, value = _a.value, isComplete = _a.isComplete;
        if (!isComplete) {
            this.isComplete = true;
            hasValue && _super.prototype.next.call(this, value);
            _super.prototype.complete.call(this);
        }
    };
    return AsyncSubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_1__.Subject));

//# sourceMappingURL=AsyncSubject.js.map

/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "asapScheduler": () => (/* binding */ asapScheduler),
/* harmony export */   "asap": () => (/* binding */ asap)
/* harmony export */ });
/* harmony import */ var _AsapAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(38);
/* harmony import */ var _AsapScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(35);


var asapScheduler = new _AsapScheduler__WEBPACK_IMPORTED_MODULE_0__.AsapScheduler(_AsapAction__WEBPACK_IMPORTED_MODULE_1__.AsapAction);
var asap = asapScheduler;
//# sourceMappingURL=asap.js.map

/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsapScheduler": () => (/* binding */ AsapScheduler)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(36);


var AsapScheduler = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AsapScheduler, _super);
    function AsapScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsapScheduler.prototype.flush = function (action) {
        this.active = true;
        this.scheduled = undefined;
        var actions = this.actions;
        var error;
        var index = -1;
        action = action || actions.shift();
        var count = actions.length;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (++index < count && (action = actions.shift()));
        this.active = false;
        if (error) {
            while (++index < count && (action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsapScheduler;
}(_AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__.AsyncScheduler));

//# sourceMappingURL=AsapScheduler.js.map

/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsyncScheduler": () => (/* binding */ AsyncScheduler)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Scheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(37);


var AsyncScheduler = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AsyncScheduler, _super);
    function AsyncScheduler(SchedulerAction, now) {
        if (now === void 0) { now = _Scheduler__WEBPACK_IMPORTED_MODULE_1__.Scheduler.now; }
        var _this = _super.call(this, SchedulerAction, now) || this;
        _this.actions = [];
        _this.active = false;
        _this.scheduled = undefined;
        return _this;
    }
    AsyncScheduler.prototype.flush = function (action) {
        var actions = this.actions;
        if (this.active) {
            actions.push(action);
            return;
        }
        var error;
        this.active = true;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (action = actions.shift());
        this.active = false;
        if (error) {
            while (action = actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsyncScheduler;
}(_Scheduler__WEBPACK_IMPORTED_MODULE_1__.Scheduler));

//# sourceMappingURL=AsyncScheduler.js.map

/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Scheduler": () => (/* binding */ Scheduler)
/* harmony export */ });
/* harmony import */ var _scheduler_dateTimestampProvider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(32);

var Scheduler = (function () {
    function Scheduler(schedulerActionCtor, now) {
        if (now === void 0) { now = Scheduler.now; }
        this.schedulerActionCtor = schedulerActionCtor;
        this.now = now;
    }
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        return new this.schedulerActionCtor(this, work).schedule(state, delay);
    };
    Scheduler.now = _scheduler_dateTimestampProvider__WEBPACK_IMPORTED_MODULE_0__.dateTimestampProvider.now;
    return Scheduler;
}());

//# sourceMappingURL=Scheduler.js.map

/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsapAction": () => (/* binding */ AsapAction)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(41);
/* harmony import */ var _immediateProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(39);



var AsapAction = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AsapAction, _super);
    function AsapAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = _immediateProvider__WEBPACK_IMPORTED_MODULE_1__.immediateProvider.setImmediate(scheduler.flush.bind(scheduler, undefined)));
    };
    AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            _immediateProvider__WEBPACK_IMPORTED_MODULE_1__.immediateProvider.clearImmediate(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    };
    return AsapAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_2__.AsyncAction));

//# sourceMappingURL=AsapAction.js.map

/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "immediateProvider": () => (/* binding */ immediateProvider)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _util_Immediate__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(40);


var setImmediate = _util_Immediate__WEBPACK_IMPORTED_MODULE_0__.Immediate.setImmediate, clearImmediate = _util_Immediate__WEBPACK_IMPORTED_MODULE_0__.Immediate.clearImmediate;
var immediateProvider = {
    setImmediate: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.setImmediate) || setImmediate).apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_1__.__spread)(args));
    },
    clearImmediate: function (handle) {
        var delegate = immediateProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearImmediate) || clearImmediate)(handle);
    },
    delegate: undefined,
};
//# sourceMappingURL=immediateProvider.js.map

/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Immediate": () => (/* binding */ Immediate),
/* harmony export */   "TestTools": () => (/* binding */ TestTools)
/* harmony export */ });
var nextHandle = 1;
var resolved;
var activeHandles = {};
function findAndClearHandle(handle) {
    if (handle in activeHandles) {
        delete activeHandles[handle];
        return true;
    }
    return false;
}
var Immediate = {
    setImmediate: function (cb) {
        var handle = nextHandle++;
        activeHandles[handle] = true;
        if (!resolved) {
            resolved = Promise.resolve();
        }
        resolved.then(function () { return findAndClearHandle(handle) && cb(); });
        return handle;
    },
    clearImmediate: function (handle) {
        findAndClearHandle(handle);
    },
};
var TestTools = {
    pending: function () {
        return Object.keys(activeHandles).length;
    }
};
//# sourceMappingURL=Immediate.js.map

/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsyncAction": () => (/* binding */ AsyncAction)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Action__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(43);
/* harmony import */ var _intervalProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12);




var AsyncAction = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (this.closed) {
            return this;
        }
        this.state = state;
        var id = this.id;
        var scheduler = this.scheduler;
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.pending = true;
        this.delay = delay;
        this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
        return this;
    };
    AsyncAction.prototype.requestAsyncId = function (scheduler, _id, delay) {
        if (delay === void 0) { delay = 0; }
        return _intervalProvider__WEBPACK_IMPORTED_MODULE_1__.intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (_scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay != null && this.delay === delay && this.pending === false) {
            return id;
        }
        _intervalProvider__WEBPACK_IMPORTED_MODULE_1__.intervalProvider.clearInterval(id);
        return undefined;
    };
    AsyncAction.prototype.execute = function (state, delay) {
        if (this.closed) {
            return new Error('executing a cancelled action');
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
            return error;
        }
        else if (this.pending === false && this.id != null) {
            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
    };
    AsyncAction.prototype._execute = function (state, _delay) {
        var errored = false;
        var errorValue;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = (!!e && e) || new Error(e);
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype.unsubscribe = function () {
        if (!this.closed) {
            var _a = this, id = _a.id, scheduler = _a.scheduler;
            var actions = scheduler.actions;
            this.work = this.state = this.scheduler = null;
            this.pending = false;
            (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_2__.arrRemove)(actions, this);
            if (id != null) {
                this.id = this.recycleAsyncId(scheduler, id, null);
            }
            this.delay = null;
            _super.prototype.unsubscribe.call(this);
        }
    };
    return AsyncAction;
}(_Action__WEBPACK_IMPORTED_MODULE_3__.Action));

//# sourceMappingURL=AsyncAction.js.map

/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "intervalProvider": () => (/* binding */ intervalProvider)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);

var intervalProvider = {
    setInterval: function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var delegate = intervalProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) || setInterval).apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(args));
    },
    clearInterval: function (handle) {
        var delegate = intervalProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearInterval) || clearInterval)(handle);
    },
    delegate: undefined,
};
//# sourceMappingURL=intervalProvider.js.map

/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Action": () => (/* binding */ Action)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);


var Action = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(Action, _super);
    function Action(scheduler, work) {
        return _super.call(this) || this;
    }
    Action.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        return this;
    };
    return Action;
}(_Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription));

//# sourceMappingURL=Action.js.map

/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "asyncScheduler": () => (/* binding */ asyncScheduler),
/* harmony export */   "async": () => (/* binding */ async)
/* harmony export */ });
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(41);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(36);


var asyncScheduler = new _AsyncScheduler__WEBPACK_IMPORTED_MODULE_0__.AsyncScheduler(_AsyncAction__WEBPACK_IMPORTED_MODULE_1__.AsyncAction);
var async = asyncScheduler;
//# sourceMappingURL=async.js.map

/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "queueScheduler": () => (/* binding */ queueScheduler),
/* harmony export */   "queue": () => (/* binding */ queue)
/* harmony export */ });
/* harmony import */ var _QueueAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(47);
/* harmony import */ var _QueueScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(46);


var queueScheduler = new _QueueScheduler__WEBPACK_IMPORTED_MODULE_0__.QueueScheduler(_QueueAction__WEBPACK_IMPORTED_MODULE_1__.QueueAction);
var queue = queueScheduler;
//# sourceMappingURL=queue.js.map

/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QueueScheduler": () => (/* binding */ QueueScheduler)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(36);


var QueueScheduler = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(QueueScheduler, _super);
    function QueueScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueueScheduler;
}(_AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__.AsyncScheduler));

//# sourceMappingURL=QueueScheduler.js.map

/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QueueAction": () => (/* binding */ QueueAction)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(41);


var QueueAction = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(QueueAction, _super);
    function QueueAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    QueueAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay > 0) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
    };
    QueueAction.prototype.execute = function (state, delay) {
        return (delay > 0 || this.closed) ?
            _super.prototype.execute.call(this, state, delay) :
            this._execute(state, delay);
    };
    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        return scheduler.flush(this);
    };
    return QueueAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_1__.AsyncAction));

//# sourceMappingURL=QueueAction.js.map

/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "animationFrameScheduler": () => (/* binding */ animationFrameScheduler),
/* harmony export */   "animationFrame": () => (/* binding */ animationFrame)
/* harmony export */ });
/* harmony import */ var _AnimationFrameAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(50);
/* harmony import */ var _AnimationFrameScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(49);


var animationFrameScheduler = new _AnimationFrameScheduler__WEBPACK_IMPORTED_MODULE_0__.AnimationFrameScheduler(_AnimationFrameAction__WEBPACK_IMPORTED_MODULE_1__.AnimationFrameAction);
var animationFrame = animationFrameScheduler;
//# sourceMappingURL=animationFrame.js.map

/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnimationFrameScheduler": () => (/* binding */ AnimationFrameScheduler)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(36);


var AnimationFrameScheduler = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AnimationFrameScheduler, _super);
    function AnimationFrameScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnimationFrameScheduler.prototype.flush = function (action) {
        this.active = true;
        this.scheduled = undefined;
        var actions = this.actions;
        var error;
        var index = -1;
        action = action || actions.shift();
        var count = actions.length;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (++index < count && (action = actions.shift()));
        this.active = false;
        if (error) {
            while (++index < count && (action = actions.shift())) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AnimationFrameScheduler;
}(_AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__.AsyncScheduler));

//# sourceMappingURL=AnimationFrameScheduler.js.map

/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnimationFrameAction": () => (/* binding */ AnimationFrameAction)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(41);
/* harmony import */ var _animationFrameProvider__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(26);



var AnimationFrameAction = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(AnimationFrameAction, _super);
    function AnimationFrameAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = _animationFrameProvider__WEBPACK_IMPORTED_MODULE_1__.animationFrameProvider.requestAnimationFrame(function () { return scheduler.flush(undefined); }));
    };
    AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        if ((delay != null && delay > 0) || (delay == null && this.delay > 0)) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            _animationFrameProvider__WEBPACK_IMPORTED_MODULE_1__.animationFrameProvider.cancelAnimationFrame(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    };
    return AnimationFrameAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_2__.AsyncAction));

//# sourceMappingURL=AnimationFrameAction.js.map

/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VirtualTimeScheduler": () => (/* binding */ VirtualTimeScheduler),
/* harmony export */   "VirtualAction": () => (/* binding */ VirtualAction)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(41);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(36);




var VirtualTimeScheduler = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(VirtualTimeScheduler, _super);
    function VirtualTimeScheduler(schedulerActionCtor, maxFrames) {
        if (schedulerActionCtor === void 0) { schedulerActionCtor = VirtualAction; }
        if (maxFrames === void 0) { maxFrames = Infinity; }
        var _this = _super.call(this, schedulerActionCtor, function () { return _this.frame; }) || this;
        _this.maxFrames = maxFrames;
        _this.frame = 0;
        _this.index = -1;
        return _this;
    }
    VirtualTimeScheduler.prototype.flush = function () {
        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
        var error;
        var action;
        while ((action = actions[0]) && action.delay <= maxFrames) {
            actions.shift();
            this.frame = action.delay;
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        }
        if (error) {
            while (action = actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    VirtualTimeScheduler.frameTimeFactor = 10;
    return VirtualTimeScheduler;
}(_AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__.AsyncScheduler));

var VirtualAction = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__extends)(VirtualAction, _super);
    function VirtualAction(scheduler, work, index) {
        if (index === void 0) { index = scheduler.index += 1; }
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.index = index;
        _this.active = true;
        _this.index = scheduler.index = index;
        return _this;
    }
    VirtualAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (Number.isFinite(delay)) {
            if (!this.id) {
                return _super.prototype.schedule.call(this, state, delay);
            }
            this.active = false;
            var action = new VirtualAction(this.scheduler, this.work);
            this.add(action);
            return action.schedule(state, delay);
        }
        else {
            return _Subscription__WEBPACK_IMPORTED_MODULE_2__.Subscription.EMPTY;
        }
    };
    VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        this.delay = scheduler.frame + delay;
        var actions = scheduler.actions;
        actions.push(this);
        actions.sort(VirtualAction.sortActions);
        return true;
    };
    VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        return undefined;
    };
    VirtualAction.prototype._execute = function (state, delay) {
        if (this.active === true) {
            return _super.prototype._execute.call(this, state, delay);
        }
    };
    VirtualAction.sortActions = function (a, b) {
        if (a.delay === b.delay) {
            if (a.index === b.index) {
                return 0;
            }
            else if (a.index > b.index) {
                return 1;
            }
            else {
                return -1;
            }
        }
        else if (a.delay > b.delay) {
            return 1;
        }
        else {
            return -1;
        }
    };
    return VirtualAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_3__.AsyncAction));

//# sourceMappingURL=VirtualTimeScheduler.js.map

/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NotificationKind": () => (/* binding */ NotificationKind),
/* harmony export */   "Notification": () => (/* binding */ Notification),
/* harmony export */   "observeNotification": () => (/* binding */ observeNotification)
/* harmony export */ });
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(73);
/* harmony import */ var _observable_of__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(53);
/* harmony import */ var _observable_throwError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(72);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);




var NotificationKind;
(function (NotificationKind) {
    NotificationKind["NEXT"] = "N";
    NotificationKind["ERROR"] = "E";
    NotificationKind["COMPLETE"] = "C";
})(NotificationKind || (NotificationKind = {}));
var Notification = (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    Notification.prototype.observe = function (observer) {
        return observeNotification(this, observer);
    };
    Notification.prototype.do = function (nextHandler, errorHandler, completeHandler) {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        return kind === 'N' ? nextHandler === null || nextHandler === void 0 ? void 0 : nextHandler(value) : kind === 'E' ? errorHandler === null || errorHandler === void 0 ? void 0 : errorHandler(error) : completeHandler === null || completeHandler === void 0 ? void 0 : completeHandler();
    };
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        var _a;
        return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)((_a = nextOrObserver) === null || _a === void 0 ? void 0 : _a.next)
            ? this.observe(nextOrObserver)
            : this.do(nextOrObserver, error, complete);
    };
    Notification.prototype.toObservable = function () {
        var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
        var result = kind === 'N'
            ?
                (0,_observable_of__WEBPACK_IMPORTED_MODULE_1__.of)(value)
            :
                kind === 'E'
                    ?
                        (0,_observable_throwError__WEBPACK_IMPORTED_MODULE_2__.throwError)(error)
                    :
                        kind === 'C'
                            ?
                                _observable_empty__WEBPACK_IMPORTED_MODULE_3__.EMPTY
                            :
                                0;
        if (!result) {
            throw new TypeError("Unexpected notification kind " + kind);
        }
        return result;
    };
    Notification.createNext = function (value) {
        return new Notification('N', value);
    };
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    Notification.createComplete = function () {
        return Notification.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    return Notification;
}());

function observeNotification(notification, observer) {
    var _a, _b, _c;
    var _d = notification, kind = _d.kind, value = _d.value, error = _d.error;
    if (typeof kind !== 'string') {
        throw new TypeError('Invalid notification, missing "kind"');
    }
    kind === 'N' ? (_a = observer.next) === null || _a === void 0 ? void 0 : _a.call(observer, value) : kind === 'E' ? (_b = observer.error) === null || _b === void 0 ? void 0 : _b.call(observer, error) : (_c = observer.complete) === null || _c === void 0 ? void 0 : _c.call(observer);
}
//# sourceMappingURL=Notification.js.map

/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "of": () => (/* binding */ of)
/* harmony export */ });
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(57);
/* harmony import */ var _scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(56);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);



function of() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(args);
    return scheduler ? (0,_scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_1__.scheduleArray)(args, scheduler) : (0,_fromArray__WEBPACK_IMPORTED_MODULE_2__.internalFromArray)(args);
}
//# sourceMappingURL=of.js.map

/***/ }),
/* 54 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "popResultSelector": () => (/* binding */ popResultSelector),
/* harmony export */   "popScheduler": () => (/* binding */ popScheduler),
/* harmony export */   "popNumber": () => (/* binding */ popNumber)
/* harmony export */ });
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(55);


function last(arr) {
    return arr[arr.length - 1];
}
function popResultSelector(args) {
    return (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(last(args)) ? args.pop() : undefined;
}
function popScheduler(args) {
    return (0,_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(last(args)) ? args.pop() : undefined;
}
function popNumber(args, defaultValue) {
    return typeof last(args) === 'number' ? args.pop() : defaultValue;
}
//# sourceMappingURL=args.js.map

/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isScheduler": () => (/* binding */ isScheduler)
/* harmony export */ });
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

function isScheduler(value) {
    return value && (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(value.schedule);
}
//# sourceMappingURL=isScheduler.js.map

/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleArray": () => (/* binding */ scheduleArray)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);

function scheduleArray(input, scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var i = 0;
        return scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
            }
            else {
                subscriber.next(input[i++]);
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}
//# sourceMappingURL=scheduleArray.js.map

/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "internalFromArray": () => (/* binding */ internalFromArray)
/* harmony export */ });
/* harmony import */ var _scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);


function internalFromArray(input, scheduler) {
    return scheduler ? (0,_scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_0__.scheduleArray)(input, scheduler) : (0,_from__WEBPACK_IMPORTED_MODULE_1__.fromArrayLike)(input);
}
//# sourceMappingURL=fromArray.js.map

/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "from": () => (/* binding */ from),
/* harmony export */   "innerFrom": () => (/* binding */ innerFrom),
/* harmony export */   "fromArrayLike": () => (/* binding */ fromArrayLike)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(7);
/* harmony import */ var _util_isArrayLike__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(62);
/* harmony import */ var _util_isPromise__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(63);
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(68);
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(18);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _scheduled_scheduled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(59);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(9);
/* harmony import */ var _util_reportUnhandledError__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(16);
/* harmony import */ var _util_isInteropObservable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(60);
/* harmony import */ var _util_isAsyncIterable__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(65);
/* harmony import */ var _util_throwUnobservableError__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(71);
/* harmony import */ var _util_isIterable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(67);













function from(input, scheduler) {
    return scheduler ? (0,_scheduled_scheduled__WEBPACK_IMPORTED_MODULE_0__.scheduled)(input, scheduler) : innerFrom(input);
}
function innerFrom(input) {
    if (input instanceof _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable) {
        return input;
    }
    if (input != null) {
        if ((0,_util_isInteropObservable__WEBPACK_IMPORTED_MODULE_2__.isInteropObservable)(input)) {
            return fromInteropObservable(input);
        }
        if ((0,_util_isArrayLike__WEBPACK_IMPORTED_MODULE_3__.isArrayLike)(input)) {
            return fromArrayLike(input);
        }
        if ((0,_util_isPromise__WEBPACK_IMPORTED_MODULE_4__.isPromise)(input)) {
            return fromPromise(input);
        }
        if ((0,_util_isAsyncIterable__WEBPACK_IMPORTED_MODULE_5__.isAsyncIterable)(input)) {
            return fromAsyncIterable(input);
        }
        if ((0,_util_isIterable__WEBPACK_IMPORTED_MODULE_6__.isIterable)(input)) {
            return fromIterable(input);
        }
    }
    throw (0,_util_throwUnobservableError__WEBPACK_IMPORTED_MODULE_7__.createInvalidObservableTypeError)(input);
}
function fromInteropObservable(obj) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        var obs = obj[_symbol_observable__WEBPACK_IMPORTED_MODULE_8__.observable]();
        if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_9__.isFunction)(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
function fromArrayLike(array) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
function fromPromise(promise) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        promise
            .then(function (value) {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, function (err) { return subscriber.error(err); })
            .then(null, _util_reportUnhandledError__WEBPACK_IMPORTED_MODULE_10__.reportUnhandledError);
    });
}
function fromIterable(iterable) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        var iterator = iterable[_symbol_iterator__WEBPACK_IMPORTED_MODULE_11__.iterator]();
        while (!subscriber.closed) {
            var _a = iterator.next(), done = _a.done, value = _a.value;
            if (done) {
                subscriber.complete();
            }
            else {
                subscriber.next(value);
            }
        }
        return function () { return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_9__.isFunction)(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return(); };
    });
}
function fromAsyncIterable(asyncIterable) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        process(asyncIterable, subscriber).catch(function (err) { return subscriber.error(err); });
    });
}
function process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_1, _a;
    return (0,tslib__WEBPACK_IMPORTED_MODULE_12__.__awaiter)(this, void 0, void 0, function () {
        var value, e_1_1;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_12__.__generator)(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, 6, 11]);
                    asyncIterable_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_12__.__asyncValues)(asyncIterable);
                    _b.label = 1;
                case 1: return [4, asyncIterable_1.next()];
                case 2:
                    if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
                    value = asyncIterable_1_1.value;
                    subscriber.next(value);
                    _b.label = 3;
                case 3: return [3, 1];
                case 4: return [3, 11];
                case 5:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3, 11];
                case 6:
                    _b.trys.push([6, , 9, 10]);
                    if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
                    return [4, _a.call(asyncIterable_1)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3, 10];
                case 9:
                    if (e_1) throw e_1.error;
                    return [7];
                case 10: return [7];
                case 11:
                    subscriber.complete();
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=from.js.map

/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduled": () => (/* binding */ scheduled)
/* harmony export */ });
/* harmony import */ var _scheduleObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(61);
/* harmony import */ var _schedulePromise__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(64);
/* harmony import */ var _scheduleArray__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(56);
/* harmony import */ var _scheduleIterable__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(69);
/* harmony import */ var _util_isInteropObservable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(60);
/* harmony import */ var _util_isPromise__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(63);
/* harmony import */ var _util_isArrayLike__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(62);
/* harmony import */ var _util_isIterable__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(67);
/* harmony import */ var _scheduleAsyncIterable__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(66);
/* harmony import */ var _util_isAsyncIterable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(65);
/* harmony import */ var _util_throwUnobservableError__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(71);











function scheduled(input, scheduler) {
    if (input != null) {
        if ((0,_util_isInteropObservable__WEBPACK_IMPORTED_MODULE_0__.isInteropObservable)(input)) {
            return (0,_scheduleObservable__WEBPACK_IMPORTED_MODULE_1__.scheduleObservable)(input, scheduler);
        }
        if ((0,_util_isArrayLike__WEBPACK_IMPORTED_MODULE_2__.isArrayLike)(input)) {
            return (0,_scheduleArray__WEBPACK_IMPORTED_MODULE_3__.scheduleArray)(input, scheduler);
        }
        if ((0,_util_isPromise__WEBPACK_IMPORTED_MODULE_4__.isPromise)(input)) {
            return (0,_schedulePromise__WEBPACK_IMPORTED_MODULE_5__.schedulePromise)(input, scheduler);
        }
        if ((0,_util_isAsyncIterable__WEBPACK_IMPORTED_MODULE_6__.isAsyncIterable)(input)) {
            return (0,_scheduleAsyncIterable__WEBPACK_IMPORTED_MODULE_7__.scheduleAsyncIterable)(input, scheduler);
        }
        if ((0,_util_isIterable__WEBPACK_IMPORTED_MODULE_8__.isIterable)(input)) {
            return (0,_scheduleIterable__WEBPACK_IMPORTED_MODULE_9__.scheduleIterable)(input, scheduler);
        }
    }
    throw (0,_util_throwUnobservableError__WEBPACK_IMPORTED_MODULE_10__.createInvalidObservableTypeError)(input);
}
//# sourceMappingURL=scheduled.js.map

/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isInteropObservable": () => (/* binding */ isInteropObservable)
/* harmony export */ });
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18);
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);


function isInteropObservable(input) {
    return (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(input[_symbol_observable__WEBPACK_IMPORTED_MODULE_1__.observable]);
}
//# sourceMappingURL=isInteropObservable.js.map

/***/ }),
/* 61 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleObservable": () => (/* binding */ scheduleObservable)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18);



function scheduleObservable(input, scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var sub = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
        sub.add(scheduler.schedule(function () {
            var observable = input[_symbol_observable__WEBPACK_IMPORTED_MODULE_2__.observable]();
            sub.add(observable.subscribe({
                next: function (value) { sub.add(scheduler.schedule(function () { return subscriber.next(value); })); },
                error: function (err) { sub.add(scheduler.schedule(function () { return subscriber.error(err); })); },
                complete: function () { sub.add(scheduler.schedule(function () { return subscriber.complete(); })); },
            }));
        }));
        return sub;
    });
}
//# sourceMappingURL=scheduleObservable.js.map

/***/ }),
/* 62 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isArrayLike": () => (/* binding */ isArrayLike)
/* harmony export */ });
var isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });
//# sourceMappingURL=isArrayLike.js.map

/***/ }),
/* 63 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isPromise": () => (/* binding */ isPromise)
/* harmony export */ });
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

function isPromise(value) {
    return (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(value === null || value === void 0 ? void 0 : value.then);
}
//# sourceMappingURL=isPromise.js.map

/***/ }),
/* 64 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "schedulePromise": () => (/* binding */ schedulePromise)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);

function schedulePromise(input, scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        return scheduler.schedule(function () {
            return input.then(function (value) {
                subscriber.add(scheduler.schedule(function () {
                    subscriber.next(value);
                    subscriber.add(scheduler.schedule(function () { return subscriber.complete(); }));
                }));
            }, function (err) {
                subscriber.add(scheduler.schedule(function () { return subscriber.error(err); }));
            });
        });
    });
}
//# sourceMappingURL=schedulePromise.js.map

/***/ }),
/* 65 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isAsyncIterable": () => (/* binding */ isAsyncIterable)
/* harmony export */ });
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);

function isAsyncIterable(obj) {
    return Symbol.asyncIterator && (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}
//# sourceMappingURL=isAsyncIterable.js.map

/***/ }),
/* 66 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleAsyncIterable": () => (/* binding */ scheduleAsyncIterable)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);


function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var sub = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
        sub.add(scheduler.schedule(function () {
            var iterator = input[Symbol.asyncIterator]();
            sub.add(scheduler.schedule(function () {
                var _this = this;
                iterator.next().then(function (result) {
                    if (result.done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                        _this.schedule();
                    }
                });
            }));
        }));
        return sub;
    });
}
//# sourceMappingURL=scheduleAsyncIterable.js.map

/***/ }),
/* 67 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isIterable": () => (/* binding */ isIterable)
/* harmony export */ });
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(68);
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);


function isIterable(input) {
    return (0,_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(input === null || input === void 0 ? void 0 : input[_symbol_iterator__WEBPACK_IMPORTED_MODULE_1__.iterator]);
}
//# sourceMappingURL=isIterable.js.map

/***/ }),
/* 68 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSymbolIterator": () => (/* binding */ getSymbolIterator),
/* harmony export */   "iterator": () => (/* binding */ iterator),
/* harmony export */   "$$iterator": () => (/* binding */ $$iterator)
/* harmony export */ });
function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
var iterator = getSymbolIterator();
var $$iterator = iterator;
//# sourceMappingURL=iterator.js.map

/***/ }),
/* 69 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleIterable": () => (/* binding */ scheduleIterable)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(68);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(9);
/* harmony import */ var _util_caughtSchedule__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(70);




function scheduleIterable(input, scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var iterator;
        subscriber.add(scheduler.schedule(function () {
            iterator = input[_symbol_iterator__WEBPACK_IMPORTED_MODULE_1__.iterator]();
            (0,_util_caughtSchedule__WEBPACK_IMPORTED_MODULE_2__.caughtSchedule)(subscriber, scheduler, function () {
                var _a = iterator.next(), value = _a.value, done = _a.done;
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                    this.schedule();
                }
            });
        }));
        return function () { return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_3__.isFunction)(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return(); };
    });
}
//# sourceMappingURL=scheduleIterable.js.map

/***/ }),
/* 70 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "caughtSchedule": () => (/* binding */ caughtSchedule)
/* harmony export */ });
function caughtSchedule(subscriber, scheduler, execute, delay) {
    if (delay === void 0) { delay = 0; }
    var subscription = scheduler.schedule(function () {
        try {
            execute.call(this);
        }
        catch (err) {
            subscriber.error(err);
        }
    }, delay);
    subscriber.add(subscription);
    return subscription;
}
//# sourceMappingURL=caughtSchedule.js.map

/***/ }),
/* 71 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "createInvalidObservableTypeError": () => (/* binding */ createInvalidObservableTypeError)
/* harmony export */ });
function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === 'object' ? 'an invalid object' : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, Array, AsyncIterable, or Iterable.");
}
//# sourceMappingURL=throwUnobservableError.js.map

/***/ }),
/* 72 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throwError": () => (/* binding */ throwError)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);


function throwError(errorOrErrorFactory, scheduler) {
    var errorFactory = (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(errorOrErrorFactory) ? errorOrErrorFactory : function () { return errorOrErrorFactory; };
    var init = function (subscriber) { return subscriber.error(errorFactory()); };
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(scheduler ? function (subscriber) { return scheduler.schedule(init, 0, subscriber); } : init);
}
//# sourceMappingURL=throwError.js.map

/***/ }),
/* 73 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EMPTY": () => (/* binding */ EMPTY),
/* harmony export */   "empty": () => (/* binding */ empty)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);

var EMPTY = new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return subscriber.complete(); });
function empty(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : EMPTY;
}
function emptyScheduled(scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
}
//# sourceMappingURL=empty.js.map

/***/ }),
/* 74 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isObservable": () => (/* binding */ isObservable)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _isFunction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);


function isObservable(obj) {
    return !!obj && (obj instanceof _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable || ((0,_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(obj.lift) && (0,_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(obj.subscribe)));
}
//# sourceMappingURL=isObservable.js.map

/***/ }),
/* 75 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "lastValueFrom": () => (/* binding */ lastValueFrom)
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76);

function lastValueFrom(source) {
    return new Promise(function (resolve, reject) {
        var _hasValue = false;
        var _value;
        source.subscribe({
            next: function (value) {
                _value = value;
                _hasValue = true;
            },
            error: reject,
            complete: function () {
                if (_hasValue) {
                    resolve(_value);
                }
                else {
                    reject(new _util_EmptyError__WEBPACK_IMPORTED_MODULE_0__.EmptyError());
                }
            },
        });
    });
}
//# sourceMappingURL=lastValueFrom.js.map

/***/ }),
/* 76 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EmptyError": () => (/* binding */ EmptyError)
/* harmony export */ });
/* harmony import */ var _createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

var EmptyError = (0,_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) { return function EmptyErrorImpl() {
    _super(this);
    this.name = 'EmptyError';
    this.message = 'no elements in sequence';
}; });
//# sourceMappingURL=EmptyError.js.map

/***/ }),
/* 77 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "firstValueFrom": () => (/* binding */ firstValueFrom)
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(76);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);


function firstValueFrom(source) {
    return new Promise(function (resolve, reject) {
        var subscriber = new _Subscriber__WEBPACK_IMPORTED_MODULE_0__.SafeSubscriber({
            next: function (value) {
                resolve(value);
                subscriber.unsubscribe();
            },
            error: reject,
            complete: function () {
                reject(new _util_EmptyError__WEBPACK_IMPORTED_MODULE_1__.EmptyError());
            },
        });
        source.subscribe(subscriber);
    });
}
//# sourceMappingURL=firstValueFrom.js.map

/***/ }),
/* 78 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ArgumentOutOfRangeError": () => (/* binding */ ArgumentOutOfRangeError)
/* harmony export */ });
/* harmony import */ var _createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

var ArgumentOutOfRangeError = (0,_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) {
    return function ArgumentOutOfRangeErrorImpl() {
        _super(this);
        this.name = 'ArgumentOutOfRangeError';
        this.message = 'argument out of range';
    };
});
//# sourceMappingURL=ArgumentOutOfRangeError.js.map

/***/ }),
/* 79 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NotFoundError": () => (/* binding */ NotFoundError)
/* harmony export */ });
/* harmony import */ var _createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

var NotFoundError = (0,_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) {
    return function NotFoundErrorImpl(message) {
        _super(this);
        this.name = 'NotFoundError';
        this.message = message;
    };
});
//# sourceMappingURL=NotFoundError.js.map

/***/ }),
/* 80 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SequenceError": () => (/* binding */ SequenceError)
/* harmony export */ });
/* harmony import */ var _createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);

var SequenceError = (0,_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) {
    return function SequenceErrorImpl(message) {
        _super(this);
        this.name = 'SequenceError';
        this.message = message;
    };
});
//# sourceMappingURL=SequenceError.js.map

/***/ }),
/* 81 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TimeoutError": () => (/* binding */ TimeoutError),
/* harmony export */   "timeout": () => (/* binding */ timeout)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(44);
/* harmony import */ var _util_isDate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(24);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(58);
/* harmony import */ var _util_createErrorClass__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);
/* harmony import */ var _util_caughtSchedule__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(70);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(22);







var TimeoutError = (0,_util_createErrorClass__WEBPACK_IMPORTED_MODULE_0__.createErrorClass)(function (_super) {
    return function TimeoutErrorImpl(info) {
        if (info === void 0) { info = null; }
        _super(this);
        this.message = 'Timeout has occurred';
        this.name = 'TimeoutError';
        this.info = info;
    };
});
function timeout(config, schedulerArg) {
    var _a = ((0,_util_isDate__WEBPACK_IMPORTED_MODULE_1__.isValidDate)(config)
        ? { first: config }
        : typeof config === 'number'
            ? { each: config }
            : config), first = _a.first, each = _a.each, _b = _a.with, _with = _b === void 0 ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === void 0 ? schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : _scheduler_async__WEBPACK_IMPORTED_MODULE_2__.asyncScheduler : _c, _d = _a.meta, meta = _d === void 0 ? null : _d;
    if (first == null && each == null) {
        throw new TypeError('No timeout provided.');
    }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_3__.operate)(function (source, subscriber) {
        var originalSourceSubscription;
        var timerSubscription;
        var lastValue = null;
        var seen = 0;
        var startTimer = function (delay) {
            timerSubscription = (0,_util_caughtSchedule__WEBPACK_IMPORTED_MODULE_4__.caughtSchedule)(subscriber, scheduler, function () {
                originalSourceSubscription.unsubscribe();
                (0,_observable_from__WEBPACK_IMPORTED_MODULE_5__.innerFrom)(_with({
                    meta: meta,
                    lastValue: lastValue,
                    seen: seen,
                })).subscribe(subscriber);
            }, delay);
        };
        originalSourceSubscription = source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_6__.OperatorSubscriber(subscriber, function (value) {
            timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
            seen++;
            subscriber.next((lastValue = value));
            each > 0 && startTimer(each);
        }, undefined, undefined, function () {
            if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
                timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
            }
            lastValue = null;
        }));
        startTimer(first != null ? (typeof first === 'number' ? first : +first - scheduler.now()) : each);
    });
}
function timeoutErrorFactory(info) {
    throw new TimeoutError(info);
}
//# sourceMappingURL=timeout.js.map

/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isValidDate": () => (/* binding */ isValidDate)
/* harmony export */ });
function isValidDate(value) {
    return value instanceof Date && !isNaN(value);
}
//# sourceMappingURL=isDate.js.map

/***/ }),
/* 83 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindCallback": () => (/* binding */ bindCallback)
/* harmony export */ });
/* harmony import */ var _bindCallbackInternals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(84);

function bindCallback(callbackFunc, resultSelector, scheduler) {
    return (0,_bindCallbackInternals__WEBPACK_IMPORTED_MODULE_0__.bindCallbackInternals)(false, callbackFunc, resultSelector, scheduler);
}
//# sourceMappingURL=bindCallback.js.map

/***/ }),
/* 84 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindCallbackInternals": () => (/* binding */ bindCallbackInternals)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(55);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(5);
/* harmony import */ var _operators_subscribeOn__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(87);
/* harmony import */ var _util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(85);
/* harmony import */ var _operators_observeOn__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(88);
/* harmony import */ var _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(33);







function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
        if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_0__.isScheduler)(resultSelector)) {
            scheduler = resultSelector;
        }
        else {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler)
                    .apply(this, args)
                    .pipe((0,_util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_1__.mapOneOrManyArgs)(resultSelector));
            };
        }
    }
    if (scheduler) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return bindCallbackInternals(isNodeStyle, callbackFunc)
                .apply(this, args)
                .pipe((0,_operators_subscribeOn__WEBPACK_IMPORTED_MODULE_2__.subscribeOn)(scheduler), (0,_operators_observeOn__WEBPACK_IMPORTED_MODULE_3__.observeOn)(scheduler));
        };
    }
    var subject = new _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__.AsyncSubject();
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var uninitialized = true;
        return new _Observable__WEBPACK_IMPORTED_MODULE_5__.Observable(function (subscriber) {
            var subs = subject.subscribe(subscriber);
            if (uninitialized) {
                uninitialized = false;
                var isAsync_1 = false;
                var isComplete_1 = false;
                callbackFunc.apply(_this, (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__spread)(args, [
                    function () {
                        var results = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            results[_i] = arguments[_i];
                        }
                        if (isNodeStyle) {
                            var err = results.shift();
                            if (err != null) {
                                subject.error(err);
                                return;
                            }
                        }
                        subject.next(1 < results.length ? results : results[0]);
                        isComplete_1 = true;
                        if (isAsync_1) {
                            subject.complete();
                        }
                    },
                ]));
                if (isComplete_1) {
                    subject.complete();
                }
                isAsync_1 = true;
            }
            return subs;
        });
    };
}
//# sourceMappingURL=bindCallbackInternals.js.map

/***/ }),
/* 85 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mapOneOrManyArgs": () => (/* binding */ mapOneOrManyArgs)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);


var isArray = Array.isArray;
function callOrApply(fn, args) {
    return isArray(args) ? fn.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(args)) : fn(args);
}
function mapOneOrManyArgs(fn) {
    return (0,_operators_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (args) { return callOrApply(fn, args); });
}
//# sourceMappingURL=mapOneOrManyArgs.js.map

/***/ }),
/* 86 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "map": () => (/* binding */ map)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function map(project, thisArg) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}
//# sourceMappingURL=map.js.map

/***/ }),
/* 87 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeOn": () => (/* binding */ subscribeOn)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);

function subscribeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        subscriber.add(scheduler.schedule(function () { return source.subscribe(subscriber); }, delay));
    });
}
//# sourceMappingURL=subscribeOn.js.map

/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "observeOn": () => (/* binding */ observeOn)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) { return subscriber.add(scheduler.schedule(function () { return subscriber.next(value); }, delay)); }, function (err) { return subscriber.add(scheduler.schedule(function () { return subscriber.error(err); }, delay)); }, function () { return subscriber.add(scheduler.schedule(function () { return subscriber.complete(); }, delay)); }));
    });
}
//# sourceMappingURL=observeOn.js.map

/***/ }),
/* 89 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindNodeCallback": () => (/* binding */ bindNodeCallback)
/* harmony export */ });
/* harmony import */ var _bindCallbackInternals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(84);

function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
    return (0,_bindCallbackInternals__WEBPACK_IMPORTED_MODULE_0__.bindCallbackInternals)(true, callbackFunc, resultSelector, scheduler);
}
//# sourceMappingURL=bindNodeCallback.js.map

/***/ }),
/* 90 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "combineLatest": () => (/* binding */ combineLatest),
/* harmony export */   "combineLatestInit": () => (/* binding */ combineLatestInit)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _util_argsArgArrayOrObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(91);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(6);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(20);
/* harmony import */ var _util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(85);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);








function combineLatest() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(args);
    var resultSelector = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popResultSelector)(args);
    var _a = (0,_util_argsArgArrayOrObject__WEBPACK_IMPORTED_MODULE_1__.argsArgArrayOrObject)(args), observables = _a.args, keys = _a.keys;
    if (observables.length === 0) {
        return (0,_from__WEBPACK_IMPORTED_MODULE_2__.from)([], scheduler);
    }
    var result = new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(combineLatestInit(observables, scheduler, keys
        ?
            function (values) {
                var value = {};
                for (var i = 0; i < values.length; i++) {
                    value[keys[i]] = values[i];
                }
                return value;
            }
        :
            _util_identity__WEBPACK_IMPORTED_MODULE_4__.identity));
    if (resultSelector) {
        return result.pipe((0,_util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_5__.mapOneOrManyArgs)(resultSelector));
    }
    return result;
}
var CombineLatestSubscriber = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__extends)(CombineLatestSubscriber, _super);
    function CombineLatestSubscriber(destination, _next, shouldComplete) {
        var _this = _super.call(this, destination) || this;
        _this._next = _next;
        _this.shouldComplete = shouldComplete;
        return _this;
    }
    CombineLatestSubscriber.prototype._complete = function () {
        if (this.shouldComplete()) {
            _super.prototype._complete.call(this);
        }
        else {
            this.unsubscribe();
        }
    };
    return CombineLatestSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_7__.Subscriber));
function combineLatestInit(observables, scheduler, valueTransform) {
    if (valueTransform === void 0) { valueTransform = _util_identity__WEBPACK_IMPORTED_MODULE_4__.identity; }
    return function (subscriber) {
        var primarySubscribe = function () {
            var length = observables.length;
            var values = new Array(length);
            var active = length;
            var hasValues = observables.map(function () { return false; });
            var waitingForFirstValues = true;
            var emit = function () { return subscriber.next(valueTransform(values.slice())); };
            var _loop_1 = function (i) {
                var subscribe = function () {
                    var source = (0,_from__WEBPACK_IMPORTED_MODULE_2__.from)(observables[i], scheduler);
                    source.subscribe(new CombineLatestSubscriber(subscriber, function (value) {
                        values[i] = value;
                        if (waitingForFirstValues) {
                            hasValues[i] = true;
                            waitingForFirstValues = !hasValues.every(_util_identity__WEBPACK_IMPORTED_MODULE_4__.identity);
                        }
                        if (!waitingForFirstValues) {
                            emit();
                        }
                    }, function () { return --active === 0; }));
                };
                maybeSchedule(scheduler, subscribe, subscriber);
            };
            for (var i = 0; i < length; i++) {
                _loop_1(i);
            }
        };
        maybeSchedule(scheduler, primarySubscribe, subscriber);
    };
}
function maybeSchedule(scheduler, execute, subscription) {
    if (scheduler) {
        subscription.add(scheduler.schedule(execute));
    }
    else {
        execute();
    }
}
//# sourceMappingURL=combineLatest.js.map

/***/ }),
/* 91 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "argsArgArrayOrObject": () => (/* binding */ argsArgArrayOrObject)
/* harmony export */ });
var isArray = Array.isArray;
var getPrototypeOf = Object.getPrototypeOf, objectProto = Object.prototype, getKeys = Object.keys;
function argsArgArrayOrObject(args) {
    if (args.length === 1) {
        var first_1 = args[0];
        if (isArray(first_1)) {
            return { args: first_1, keys: null };
        }
        if (isPOJO(first_1)) {
            var keys = getKeys(first_1);
            return {
                args: keys.map(function (key) { return first_1[key]; }),
                keys: keys,
            };
        }
    }
    return { args: args, keys: null };
}
function isPOJO(obj) {
    return obj && typeof obj === 'object' && getPrototypeOf(obj) === objectProto;
}
//# sourceMappingURL=argsArgArrayOrObject.js.map

/***/ }),
/* 92 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concat": () => (/* binding */ concat)
/* harmony export */ });
/* harmony import */ var _operators_concatAll__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(93);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(57);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(54);



function concat() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return (0,_operators_concatAll__WEBPACK_IMPORTED_MODULE_0__.concatAll)()((0,_fromArray__WEBPACK_IMPORTED_MODULE_1__.internalFromArray)(args, (0,_util_args__WEBPACK_IMPORTED_MODULE_2__.popScheduler)(args)));
}
//# sourceMappingURL=concat.js.map

/***/ }),
/* 93 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatAll": () => (/* binding */ concatAll)
/* harmony export */ });
/* harmony import */ var _mergeAll__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(94);

function concatAll() {
    return (0,_mergeAll__WEBPACK_IMPORTED_MODULE_0__.mergeAll)(1);
}
//# sourceMappingURL=concatAll.js.map

/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeAll": () => (/* binding */ mergeAll)
/* harmony export */ });
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(95);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);


function mergeAll(concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_0__.mergeMap)(_util_identity__WEBPACK_IMPORTED_MODULE_1__.identity, concurrent);
}
//# sourceMappingURL=mergeAll.js.map

/***/ }),
/* 95 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeMap": () => (/* binding */ mergeMap),
/* harmony export */   "flatMap": () => (/* binding */ flatMap)
/* harmony export */ });
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(24);
/* harmony import */ var _mergeInternals__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(96);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);





function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(resultSelector)) {
        return mergeMap(function (a, i) { return (0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (b, ii) { return resultSelector(a, b, i, ii); })((0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(project(a, i))); }, concurrent);
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_3__.operate)(function (source, subscriber) { return (0,_mergeInternals__WEBPACK_IMPORTED_MODULE_4__.mergeInternals)(source, subscriber, project, concurrent); });
}
var flatMap = mergeMap;
//# sourceMappingURL=mergeMap.js.map

/***/ }),
/* 96 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeInternals": () => (/* binding */ mergeInternals)
/* harmony export */ });
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(58);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalTeardown) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function () {
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    var outerNext = function (value) { return (active < concurrent ? doInnerSub(value) : buffer.push(value)); };
    var doInnerSub = function (value) {
        expand && subscriber.next(value);
        active++;
        (0,_observable_from__WEBPACK_IMPORTED_MODULE_0__.innerFrom)(project(value, index++)).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (innerValue) {
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                outerNext(innerValue);
            }
            else {
                subscriber.next(innerValue);
            }
        }, undefined, function () {
            active--;
            var _loop_1 = function () {
                var bufferedValue = buffer.shift();
                innerSubScheduler ? subscriber.add(innerSubScheduler.schedule(function () { return doInnerSub(bufferedValue); })) : doInnerSub(bufferedValue);
            };
            while (buffer.length && active < concurrent) {
                _loop_1();
            }
            checkComplete();
        }));
    };
    source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, outerNext, undefined, function () {
        isComplete = true;
        checkComplete();
    }));
    return function () {
        buffer = null;
        additionalTeardown === null || additionalTeardown === void 0 ? void 0 : additionalTeardown();
    };
}
//# sourceMappingURL=mergeInternals.js.map

/***/ }),
/* 97 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "connectable": () => (/* binding */ connectable)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(28);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _defer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(98);



function connectable(source, connector) {
    if (connector === void 0) { connector = new _Subject__WEBPACK_IMPORTED_MODULE_0__.Subject(); }
    var connection = null;
    var result = new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        return connector.subscribe(subscriber);
    });
    result.connect = function () {
        if (!connection) {
            connection = (0,_defer__WEBPACK_IMPORTED_MODULE_2__.defer)(function () { return source; }).subscribe(connector);
        }
        return connection;
    };
    return result;
}
//# sourceMappingURL=connectable.js.map

/***/ }),
/* 98 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defer": () => (/* binding */ defer)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);


function defer(observableFactory) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        (0,_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(observableFactory()).subscribe(subscriber);
    });
}
//# sourceMappingURL=defer.js.map

/***/ }),
/* 99 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "forkJoin": () => (/* binding */ forkJoin)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(86);
/* harmony import */ var _util_argsArgArrayOrObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(91);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(58);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);






function forkJoin() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popResultSelector)(args);
    var _a = (0,_util_argsArgArrayOrObject__WEBPACK_IMPORTED_MODULE_1__.argsArgArrayOrObject)(args), sources = _a.args, keys = _a.keys;
    if (resultSelector) {
        return forkJoinInternal(sources, keys).pipe((0,_operators_map__WEBPACK_IMPORTED_MODULE_2__.map)(function (values) { return resultSelector.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__spread)(values)); }));
    }
    return forkJoinInternal(sources, keys);
}
function forkJoinInternal(sources, keys) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_4__.Observable(function (subscriber) {
        var len = sources.length;
        if (len === 0) {
            subscriber.complete();
            return;
        }
        var values = new Array(len);
        var completed = 0;
        var emitted = 0;
        var _loop_1 = function (sourceIndex) {
            var source = (0,_from__WEBPACK_IMPORTED_MODULE_5__.innerFrom)(sources[sourceIndex]);
            var hasValue = false;
            subscriber.add(source.subscribe({
                next: function (value) {
                    if (!hasValue) {
                        hasValue = true;
                        emitted++;
                    }
                    values[sourceIndex] = value;
                },
                error: function (err) { return subscriber.error(err); },
                complete: function () {
                    completed++;
                    if (completed === len || !hasValue) {
                        if (emitted === len) {
                            subscriber.next(keys ? keys.reduce(function (result, key, i) { return ((result[key] = values[i]), result); }, {}) : values);
                        }
                        subscriber.complete();
                    }
                },
            }));
        };
        for (var sourceIndex = 0; sourceIndex < len; sourceIndex++) {
            _loop_1(sourceIndex);
        }
    });
}
//# sourceMappingURL=forkJoin.js.map

/***/ }),
/* 100 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromEvent": () => (/* binding */ fromEvent)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(5);
/* harmony import */ var _operators_mergeMap__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(95);
/* harmony import */ var _util_isArrayLike__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(62);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(85);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(57);







var nodeEventEmitterMethods = ['addListener', 'removeListener'];
var eventTargetMethods = ['addEventListener', 'removeEventListener'];
var jqueryMethods = ['on', 'off'];
function fromEvent(target, eventName, options, resultSelector) {
    if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(options)) {
        resultSelector = options;
        options = undefined;
    }
    if (resultSelector) {
        return fromEvent(target, eventName, options).pipe((0,_util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_1__.mapOneOrManyArgs)(resultSelector));
    }
    var _a = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__read)(isEventTarget(target)
        ? eventTargetMethods.map(function (methodName) { return function (handler) { return target[methodName](eventName, handler, options); }; })
        :
            isNodeStyleEventEmitter(target)
                ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName))
                : isJQueryStyleEventEmitter(target)
                    ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName))
                    : [], 2), add = _a[0], remove = _a[1];
    if (!add) {
        if ((0,_util_isArrayLike__WEBPACK_IMPORTED_MODULE_3__.isArrayLike)(target)) {
            return (0,_operators_mergeMap__WEBPACK_IMPORTED_MODULE_4__.mergeMap)(function (subTarget) { return fromEvent(subTarget, eventName, options); })((0,_fromArray__WEBPACK_IMPORTED_MODULE_5__.internalFromArray)(target));
        }
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_6__.Observable(function (subscriber) {
        if (!add) {
            throw new TypeError('Invalid event target');
        }
        var handler = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return subscriber.next(1 < args.length ? args : args[0]);
        };
        add(handler);
        return function () { return remove(handler); };
    });
}
function toCommonHandlerRegistry(target, eventName) {
    return function (methodName) { return function (handler) { return target[methodName](eventName, handler); }; };
}
function isNodeStyleEventEmitter(target) {
    return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(target.addListener) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(target.removeListener);
}
function isJQueryStyleEventEmitter(target) {
    return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(target.on) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(target.off);
}
function isEventTarget(target) {
    return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(target.addEventListener) && (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(target.removeEventListener);
}
//# sourceMappingURL=fromEvent.js.map

/***/ }),
/* 101 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromEventPattern": () => (/* binding */ fromEventPattern)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9);
/* harmony import */ var _util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(85);



function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe((0,_util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_0__.mapOneOrManyArgs)(resultSelector));
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(function (subscriber) {
        var handler = function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return subscriber.next(e.length === 1 ? e[0] : e);
        };
        var retValue = addHandler(handler);
        return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_2__.isFunction)(removeHandler) ? function () { return removeHandler(handler, retValue); } : undefined;
    });
}
//# sourceMappingURL=fromEventPattern.js.map

/***/ }),
/* 102 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "generate": () => (/* binding */ generate)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(55);
/* harmony import */ var _defer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(98);
/* harmony import */ var _scheduled_scheduleIterable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(69);





function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
    var _a, _b;
    var resultSelector;
    var initialState;
    if (arguments.length === 1) {
        (_a = initialStateOrOptions, initialState = _a.initialState, condition = _a.condition, iterate = _a.iterate, _b = _a.resultSelector, resultSelector = _b === void 0 ? _util_identity__WEBPACK_IMPORTED_MODULE_0__.identity : _b, scheduler = _a.scheduler);
    }
    else {
        initialState = initialStateOrOptions;
        if (!resultSelectorOrScheduler || (0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(resultSelectorOrScheduler)) {
            resultSelector = _util_identity__WEBPACK_IMPORTED_MODULE_0__.identity;
            scheduler = resultSelectorOrScheduler;
        }
        else {
            resultSelector = resultSelectorOrScheduler;
        }
    }
    function gen() {
        var state;
        return (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__generator)(this, function (_a) {
            switch (_a.label) {
                case 0:
                    state = initialState;
                    _a.label = 1;
                case 1:
                    if (!(!condition || condition(state))) return [3, 4];
                    return [4, resultSelector(state)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    state = iterate(state);
                    return [3, 1];
                case 4: return [2];
            }
        });
    }
    return (0,_defer__WEBPACK_IMPORTED_MODULE_3__.defer)((scheduler
        ?
            function () { return (0,_scheduled_scheduleIterable__WEBPACK_IMPORTED_MODULE_4__.scheduleIterable)(gen(), scheduler); }
        :
            gen));
}
//# sourceMappingURL=generate.js.map

/***/ }),
/* 103 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "iif": () => (/* binding */ iif)
/* harmony export */ });
/* harmony import */ var _defer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98);

function iif(condition, trueResult, falseResult) {
    return (0,_defer__WEBPACK_IMPORTED_MODULE_0__.defer)(function () { return (condition() ? trueResult : falseResult); });
}
//# sourceMappingURL=iif.js.map

/***/ }),
/* 104 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "interval": () => (/* binding */ interval)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _timer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(105);


function interval(period, scheduler) {
    if (period === void 0) { period = 0; }
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.asyncScheduler; }
    if (period < 0) {
        period = 0;
    }
    return (0,_timer__WEBPACK_IMPORTED_MODULE_1__.timer)(period, period, scheduler);
}
//# sourceMappingURL=interval.js.map

/***/ }),
/* 105 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timer": () => (/* binding */ timer)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(55);
/* harmony import */ var _util_isDate__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(82);




function timer(dueTime, intervalOrScheduler, scheduler) {
    if (dueTime === void 0) { dueTime = 0; }
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async; }
    var intervalDuration = -1;
    if (intervalOrScheduler != null) {
        if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(intervalOrScheduler)) {
            scheduler = intervalOrScheduler;
        }
        else {
            intervalDuration = intervalOrScheduler;
        }
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(function (subscriber) {
        var due = (0,_util_isDate__WEBPACK_IMPORTED_MODULE_3__.isValidDate)(dueTime) ? +dueTime - scheduler.now() : dueTime;
        if (due < 0) {
            due = 0;
        }
        var n = 0;
        return scheduler.schedule(function () {
            if (!subscriber.closed) {
                subscriber.next(n++);
                if (0 <= intervalDuration) {
                    this.schedule(undefined, intervalDuration);
                }
                else {
                    subscriber.complete();
                }
            }
        }, due);
    });
}
//# sourceMappingURL=timer.js.map

/***/ }),
/* 106 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "merge": () => (/* binding */ merge)
/* harmony export */ });
/* harmony import */ var _operators_mergeAll__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(94);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(57);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(107);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(58);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(73);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);






function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(args);
    var concurrent = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popNumber)(args, Infinity);
    var sources = (0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__.argsOrArgArray)(args);
    return !sources.length
        ?
            _empty__WEBPACK_IMPORTED_MODULE_2__.EMPTY
        : sources.length === 1
            ?
                (0,_from__WEBPACK_IMPORTED_MODULE_3__.innerFrom)(sources[0])
            :
                (0,_operators_mergeAll__WEBPACK_IMPORTED_MODULE_4__.mergeAll)(concurrent)((0,_fromArray__WEBPACK_IMPORTED_MODULE_5__.internalFromArray)(sources, scheduler));
}
//# sourceMappingURL=merge.js.map

/***/ }),
/* 107 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "argsOrArgArray": () => (/* binding */ argsOrArgArray)
/* harmony export */ });
var isArray = Array.isArray;
function argsOrArgArray(args) {
    return args.length === 1 && isArray(args[0]) ? args[0] : args;
}
//# sourceMappingURL=argsOrArgArray.js.map

/***/ }),
/* 108 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NEVER": () => (/* binding */ NEVER),
/* harmony export */   "never": () => (/* binding */ never)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(15);


var NEVER = new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(_util_noop__WEBPACK_IMPORTED_MODULE_1__.noop);
function never() {
    return NEVER;
}
//# sourceMappingURL=never.js.map

/***/ }),
/* 109 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "onErrorResumeNext": () => (/* binding */ onErrorResumeNext)
/* harmony export */ });
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(73);
/* harmony import */ var _operators_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(110);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(107);



function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    return (0,_operators_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_0__.onErrorResumeNext)((0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__.argsOrArgArray)(sources))(_empty__WEBPACK_IMPORTED_MODULE_2__.EMPTY);
}
//# sourceMappingURL=onErrorResumeNext.js.map

/***/ }),
/* 110 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "onErrorResumeNext": () => (/* binding */ onErrorResumeNext)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(58);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(107);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(22);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(15);






function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    var nextSources = (0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_0__.argsOrArgArray)(sources);
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
        var remaining = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)([source], nextSources);
        var subscribeNext = function () {
            if (!subscriber.closed) {
                if (remaining.length > 0) {
                    var nextSource = void 0;
                    try {
                        nextSource = (0,_observable_from__WEBPACK_IMPORTED_MODULE_3__.innerFrom)(remaining.shift());
                    }
                    catch (err) {
                        subscribeNext();
                        return;
                    }
                    var innerSub = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_4__.OperatorSubscriber(subscriber, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop, _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop);
                    subscriber.add(nextSource.subscribe(innerSub));
                    innerSub.add(subscribeNext);
                }
                else {
                    subscriber.complete();
                }
            }
        };
        subscribeNext();
    });
}
//# sourceMappingURL=onErrorResumeNext.js.map

/***/ }),
/* 111 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pairs": () => (/* binding */ pairs)
/* harmony export */ });
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(58);

function pairs(obj, scheduler) {
    return (0,_from__WEBPACK_IMPORTED_MODULE_0__.from)(Object.entries(obj), scheduler);
}
//# sourceMappingURL=pairs.js.map

/***/ }),
/* 112 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "partition": () => (/* binding */ partition)
/* harmony export */ });
/* harmony import */ var _util_not__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(114);
/* harmony import */ var _operators_filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(113);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);



function partition(source, predicate, thisArg) {
    return [
        (0,_operators_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(predicate, thisArg)((0,_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(source)),
        (0,_operators_filter__WEBPACK_IMPORTED_MODULE_0__.filter)((0,_util_not__WEBPACK_IMPORTED_MODULE_2__.not)(predicate, thisArg))((0,_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(source))
    ];
}
//# sourceMappingURL=partition.js.map

/***/ }),
/* 113 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "filter": () => (/* binding */ filter)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function filter(predicate, thisArg) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) { return predicate.call(thisArg, value, index++) && subscriber.next(value); }));
    });
}
//# sourceMappingURL=filter.js.map

/***/ }),
/* 114 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "not": () => (/* binding */ not)
/* harmony export */ });
function not(pred, thisArg) {
    return function (value, index) { return !pred.call(thisArg, value, index); };
}
//# sourceMappingURL=not.js.map

/***/ }),
/* 115 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "race": () => (/* binding */ race),
/* harmony export */   "raceInit": () => (/* binding */ raceInit)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(107);
/* harmony import */ var _operators_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22);




function race() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    sources = (0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_0__.argsOrArgArray)(sources);
    return sources.length === 1 ? (0,_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(sources[0]) : new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(raceInit(sources));
}
function raceInit(sources) {
    return function (subscriber) {
        var subscriptions = [];
        var _loop_1 = function (i) {
            subscriptions.push((0,_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(sources[i]).subscribe(new _operators_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, function (value) {
                if (subscriptions) {
                    for (var s = 0; s < subscriptions.length; s++) {
                        s !== i && subscriptions[s].unsubscribe();
                    }
                    subscriptions = null;
                }
                subscriber.next(value);
            })));
        };
        for (var i = 0; subscriptions && !subscriber.closed && i < sources.length; i++) {
            _loop_1(i);
        }
    };
}
//# sourceMappingURL=race.js.map

/***/ }),
/* 116 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "range": () => (/* binding */ range)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);


function range(start, count, scheduler) {
    if (count == null) {
        count = start;
        start = 0;
    }
    if (count <= 0) {
        return _empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY;
    }
    var end = count + start;
    return new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable(scheduler
        ?
            function (subscriber) {
                var n = start;
                return scheduler.schedule(function () {
                    if (n < end) {
                        subscriber.next(n++);
                        this.schedule();
                    }
                    else {
                        subscriber.complete();
                    }
                });
            }
        :
            function (subscriber) {
                var n = start;
                while (n < end && !subscriber.closed) {
                    subscriber.next(n++);
                }
                subscriber.complete();
            });
}
//# sourceMappingURL=range.js.map

/***/ }),
/* 117 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "using": () => (/* binding */ using)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(73);



function using(resourceFactory, observableFactory) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var resource = resourceFactory();
        var result = observableFactory(resource);
        var source = result ? (0,_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(result) : _empty__WEBPACK_IMPORTED_MODULE_2__.EMPTY;
        source.subscribe(subscriber);
        return function () {
            if (resource) {
                resource.unsubscribe();
            }
        };
    });
}
//# sourceMappingURL=using.js.map

/***/ }),
/* 118 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "zip": () => (/* binding */ zip)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(58);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(107);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(73);
/* harmony import */ var _operators_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(22);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);







function zip() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popResultSelector)(args);
    var sources = (0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__.argsOrArgArray)(args);
    return sources.length
        ? new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(function (subscriber) {
            var buffers = sources.map(function () { return []; });
            var completed = sources.map(function () { return false; });
            subscriber.add(function () {
                buffers = completed = null;
            });
            var _loop_1 = function (sourceIndex) {
                (0,_from__WEBPACK_IMPORTED_MODULE_3__.innerFrom)(sources[sourceIndex]).subscribe(new _operators_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_4__.OperatorSubscriber(subscriber, function (value) {
                    buffers[sourceIndex].push(value);
                    if (buffers.every(function (buffer) { return buffer.length; })) {
                        var result = buffers.map(function (buffer) { return buffer.shift(); });
                        subscriber.next(resultSelector ? resultSelector.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spread)(result)) : result);
                        if (buffers.some(function (buffer, i) { return !buffer.length && completed[i]; })) {
                            subscriber.complete();
                        }
                    }
                }, undefined, function () {
                    completed[sourceIndex] = true;
                    !buffers[sourceIndex].length && subscriber.complete();
                }));
            };
            for (var sourceIndex = 0; !subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
                _loop_1(sourceIndex);
            }
            return function () {
                buffers = completed = null;
            };
        })
        : _empty__WEBPACK_IMPORTED_MODULE_6__.EMPTY;
}
//# sourceMappingURL=zip.js.map

/***/ }),
/* 119 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "audit": () => (/* reexport safe */ _internal_operators_audit__WEBPACK_IMPORTED_MODULE_0__.audit),
/* harmony export */   "auditTime": () => (/* reexport safe */ _internal_operators_auditTime__WEBPACK_IMPORTED_MODULE_1__.auditTime),
/* harmony export */   "buffer": () => (/* reexport safe */ _internal_operators_buffer__WEBPACK_IMPORTED_MODULE_2__.buffer),
/* harmony export */   "bufferCount": () => (/* reexport safe */ _internal_operators_bufferCount__WEBPACK_IMPORTED_MODULE_3__.bufferCount),
/* harmony export */   "bufferTime": () => (/* reexport safe */ _internal_operators_bufferTime__WEBPACK_IMPORTED_MODULE_4__.bufferTime),
/* harmony export */   "bufferToggle": () => (/* reexport safe */ _internal_operators_bufferToggle__WEBPACK_IMPORTED_MODULE_5__.bufferToggle),
/* harmony export */   "bufferWhen": () => (/* reexport safe */ _internal_operators_bufferWhen__WEBPACK_IMPORTED_MODULE_6__.bufferWhen),
/* harmony export */   "catchError": () => (/* reexport safe */ _internal_operators_catchError__WEBPACK_IMPORTED_MODULE_7__.catchError),
/* harmony export */   "combineAll": () => (/* reexport safe */ _internal_operators_combineAll__WEBPACK_IMPORTED_MODULE_8__.combineAll),
/* harmony export */   "combineLatest": () => (/* reexport safe */ _internal_operators_combineLatestWith__WEBPACK_IMPORTED_MODULE_9__.combineLatest),
/* harmony export */   "combineLatestWith": () => (/* reexport safe */ _internal_operators_combineLatestWith__WEBPACK_IMPORTED_MODULE_9__.combineLatestWith),
/* harmony export */   "concatAll": () => (/* reexport safe */ _internal_operators_concatAll__WEBPACK_IMPORTED_MODULE_10__.concatAll),
/* harmony export */   "concatMap": () => (/* reexport safe */ _internal_operators_concatMap__WEBPACK_IMPORTED_MODULE_11__.concatMap),
/* harmony export */   "concatMapTo": () => (/* reexport safe */ _internal_operators_concatMapTo__WEBPACK_IMPORTED_MODULE_12__.concatMapTo),
/* harmony export */   "concat": () => (/* reexport safe */ _internal_operators_concatWith__WEBPACK_IMPORTED_MODULE_13__.concat),
/* harmony export */   "concatWith": () => (/* reexport safe */ _internal_operators_concatWith__WEBPACK_IMPORTED_MODULE_13__.concatWith),
/* harmony export */   "connect": () => (/* reexport safe */ _internal_operators_connect__WEBPACK_IMPORTED_MODULE_14__.connect),
/* harmony export */   "count": () => (/* reexport safe */ _internal_operators_count__WEBPACK_IMPORTED_MODULE_15__.count),
/* harmony export */   "debounce": () => (/* reexport safe */ _internal_operators_debounce__WEBPACK_IMPORTED_MODULE_16__.debounce),
/* harmony export */   "debounceTime": () => (/* reexport safe */ _internal_operators_debounceTime__WEBPACK_IMPORTED_MODULE_17__.debounceTime),
/* harmony export */   "defaultIfEmpty": () => (/* reexport safe */ _internal_operators_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_18__.defaultIfEmpty),
/* harmony export */   "delay": () => (/* reexport safe */ _internal_operators_delay__WEBPACK_IMPORTED_MODULE_19__.delay),
/* harmony export */   "delayWhen": () => (/* reexport safe */ _internal_operators_delayWhen__WEBPACK_IMPORTED_MODULE_20__.delayWhen),
/* harmony export */   "dematerialize": () => (/* reexport safe */ _internal_operators_dematerialize__WEBPACK_IMPORTED_MODULE_21__.dematerialize),
/* harmony export */   "distinct": () => (/* reexport safe */ _internal_operators_distinct__WEBPACK_IMPORTED_MODULE_22__.distinct),
/* harmony export */   "distinctUntilChanged": () => (/* reexport safe */ _internal_operators_distinctUntilChanged__WEBPACK_IMPORTED_MODULE_23__.distinctUntilChanged),
/* harmony export */   "distinctUntilKeyChanged": () => (/* reexport safe */ _internal_operators_distinctUntilKeyChanged__WEBPACK_IMPORTED_MODULE_24__.distinctUntilKeyChanged),
/* harmony export */   "elementAt": () => (/* reexport safe */ _internal_operators_elementAt__WEBPACK_IMPORTED_MODULE_25__.elementAt),
/* harmony export */   "endWith": () => (/* reexport safe */ _internal_operators_endWith__WEBPACK_IMPORTED_MODULE_26__.endWith),
/* harmony export */   "every": () => (/* reexport safe */ _internal_operators_every__WEBPACK_IMPORTED_MODULE_27__.every),
/* harmony export */   "exhaust": () => (/* reexport safe */ _internal_operators_exhaust__WEBPACK_IMPORTED_MODULE_28__.exhaust),
/* harmony export */   "exhaustMap": () => (/* reexport safe */ _internal_operators_exhaustMap__WEBPACK_IMPORTED_MODULE_29__.exhaustMap),
/* harmony export */   "expand": () => (/* reexport safe */ _internal_operators_expand__WEBPACK_IMPORTED_MODULE_30__.expand),
/* harmony export */   "filter": () => (/* reexport safe */ _internal_operators_filter__WEBPACK_IMPORTED_MODULE_31__.filter),
/* harmony export */   "finalize": () => (/* reexport safe */ _internal_operators_finalize__WEBPACK_IMPORTED_MODULE_32__.finalize),
/* harmony export */   "find": () => (/* reexport safe */ _internal_operators_find__WEBPACK_IMPORTED_MODULE_33__.find),
/* harmony export */   "findIndex": () => (/* reexport safe */ _internal_operators_findIndex__WEBPACK_IMPORTED_MODULE_34__.findIndex),
/* harmony export */   "first": () => (/* reexport safe */ _internal_operators_first__WEBPACK_IMPORTED_MODULE_35__.first),
/* harmony export */   "groupBy": () => (/* reexport safe */ _internal_operators_groupBy__WEBPACK_IMPORTED_MODULE_36__.groupBy),
/* harmony export */   "ignoreElements": () => (/* reexport safe */ _internal_operators_ignoreElements__WEBPACK_IMPORTED_MODULE_37__.ignoreElements),
/* harmony export */   "isEmpty": () => (/* reexport safe */ _internal_operators_isEmpty__WEBPACK_IMPORTED_MODULE_38__.isEmpty),
/* harmony export */   "last": () => (/* reexport safe */ _internal_operators_last__WEBPACK_IMPORTED_MODULE_39__.last),
/* harmony export */   "map": () => (/* reexport safe */ _internal_operators_map__WEBPACK_IMPORTED_MODULE_40__.map),
/* harmony export */   "mapTo": () => (/* reexport safe */ _internal_operators_mapTo__WEBPACK_IMPORTED_MODULE_41__.mapTo),
/* harmony export */   "materialize": () => (/* reexport safe */ _internal_operators_materialize__WEBPACK_IMPORTED_MODULE_42__.materialize),
/* harmony export */   "max": () => (/* reexport safe */ _internal_operators_max__WEBPACK_IMPORTED_MODULE_43__.max),
/* harmony export */   "mergeWith": () => (/* reexport safe */ _internal_operators_mergeWith__WEBPACK_IMPORTED_MODULE_44__.mergeWith),
/* harmony export */   "merge": () => (/* reexport safe */ _internal_operators_mergeWith__WEBPACK_IMPORTED_MODULE_44__.merge),
/* harmony export */   "mergeAll": () => (/* reexport safe */ _internal_operators_mergeAll__WEBPACK_IMPORTED_MODULE_45__.mergeAll),
/* harmony export */   "mergeMap": () => (/* reexport safe */ _internal_operators_mergeMap__WEBPACK_IMPORTED_MODULE_46__.mergeMap),
/* harmony export */   "flatMap": () => (/* reexport safe */ _internal_operators_mergeMap__WEBPACK_IMPORTED_MODULE_46__.flatMap),
/* harmony export */   "mergeMapTo": () => (/* reexport safe */ _internal_operators_mergeMapTo__WEBPACK_IMPORTED_MODULE_47__.mergeMapTo),
/* harmony export */   "mergeScan": () => (/* reexport safe */ _internal_operators_mergeScan__WEBPACK_IMPORTED_MODULE_48__.mergeScan),
/* harmony export */   "min": () => (/* reexport safe */ _internal_operators_min__WEBPACK_IMPORTED_MODULE_49__.min),
/* harmony export */   "multicast": () => (/* reexport safe */ _internal_operators_multicast__WEBPACK_IMPORTED_MODULE_50__.multicast),
/* harmony export */   "observeOn": () => (/* reexport safe */ _internal_operators_observeOn__WEBPACK_IMPORTED_MODULE_51__.observeOn),
/* harmony export */   "onErrorResumeNext": () => (/* reexport safe */ _internal_operators_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_52__.onErrorResumeNext),
/* harmony export */   "pairwise": () => (/* reexport safe */ _internal_operators_pairwise__WEBPACK_IMPORTED_MODULE_53__.pairwise),
/* harmony export */   "partition": () => (/* reexport safe */ _internal_operators_partition__WEBPACK_IMPORTED_MODULE_54__.partition),
/* harmony export */   "pluck": () => (/* reexport safe */ _internal_operators_pluck__WEBPACK_IMPORTED_MODULE_55__.pluck),
/* harmony export */   "publish": () => (/* reexport safe */ _internal_operators_publish__WEBPACK_IMPORTED_MODULE_56__.publish),
/* harmony export */   "publishBehavior": () => (/* reexport safe */ _internal_operators_publishBehavior__WEBPACK_IMPORTED_MODULE_57__.publishBehavior),
/* harmony export */   "publishLast": () => (/* reexport safe */ _internal_operators_publishLast__WEBPACK_IMPORTED_MODULE_58__.publishLast),
/* harmony export */   "publishReplay": () => (/* reexport safe */ _internal_operators_publishReplay__WEBPACK_IMPORTED_MODULE_59__.publishReplay),
/* harmony export */   "race": () => (/* reexport safe */ _internal_operators_raceWith__WEBPACK_IMPORTED_MODULE_60__.race),
/* harmony export */   "raceWith": () => (/* reexport safe */ _internal_operators_raceWith__WEBPACK_IMPORTED_MODULE_60__.raceWith),
/* harmony export */   "reduce": () => (/* reexport safe */ _internal_operators_reduce__WEBPACK_IMPORTED_MODULE_61__.reduce),
/* harmony export */   "repeat": () => (/* reexport safe */ _internal_operators_repeat__WEBPACK_IMPORTED_MODULE_62__.repeat),
/* harmony export */   "repeatWhen": () => (/* reexport safe */ _internal_operators_repeatWhen__WEBPACK_IMPORTED_MODULE_63__.repeatWhen),
/* harmony export */   "retry": () => (/* reexport safe */ _internal_operators_retry__WEBPACK_IMPORTED_MODULE_64__.retry),
/* harmony export */   "retryWhen": () => (/* reexport safe */ _internal_operators_retryWhen__WEBPACK_IMPORTED_MODULE_65__.retryWhen),
/* harmony export */   "refCount": () => (/* reexport safe */ _internal_operators_refCount__WEBPACK_IMPORTED_MODULE_66__.refCount),
/* harmony export */   "sample": () => (/* reexport safe */ _internal_operators_sample__WEBPACK_IMPORTED_MODULE_67__.sample),
/* harmony export */   "sampleTime": () => (/* reexport safe */ _internal_operators_sampleTime__WEBPACK_IMPORTED_MODULE_68__.sampleTime),
/* harmony export */   "scan": () => (/* reexport safe */ _internal_operators_scan__WEBPACK_IMPORTED_MODULE_69__.scan),
/* harmony export */   "sequenceEqual": () => (/* reexport safe */ _internal_operators_sequenceEqual__WEBPACK_IMPORTED_MODULE_70__.sequenceEqual),
/* harmony export */   "share": () => (/* reexport safe */ _internal_operators_share__WEBPACK_IMPORTED_MODULE_71__.share),
/* harmony export */   "shareReplay": () => (/* reexport safe */ _internal_operators_shareReplay__WEBPACK_IMPORTED_MODULE_72__.shareReplay),
/* harmony export */   "single": () => (/* reexport safe */ _internal_operators_single__WEBPACK_IMPORTED_MODULE_73__.single),
/* harmony export */   "skip": () => (/* reexport safe */ _internal_operators_skip__WEBPACK_IMPORTED_MODULE_74__.skip),
/* harmony export */   "skipLast": () => (/* reexport safe */ _internal_operators_skipLast__WEBPACK_IMPORTED_MODULE_75__.skipLast),
/* harmony export */   "skipUntil": () => (/* reexport safe */ _internal_operators_skipUntil__WEBPACK_IMPORTED_MODULE_76__.skipUntil),
/* harmony export */   "skipWhile": () => (/* reexport safe */ _internal_operators_skipWhile__WEBPACK_IMPORTED_MODULE_77__.skipWhile),
/* harmony export */   "startWith": () => (/* reexport safe */ _internal_operators_startWith__WEBPACK_IMPORTED_MODULE_78__.startWith),
/* harmony export */   "subscribeOn": () => (/* reexport safe */ _internal_operators_subscribeOn__WEBPACK_IMPORTED_MODULE_79__.subscribeOn),
/* harmony export */   "switchAll": () => (/* reexport safe */ _internal_operators_switchAll__WEBPACK_IMPORTED_MODULE_80__.switchAll),
/* harmony export */   "switchMap": () => (/* reexport safe */ _internal_operators_switchMap__WEBPACK_IMPORTED_MODULE_81__.switchMap),
/* harmony export */   "switchMapTo": () => (/* reexport safe */ _internal_operators_switchMapTo__WEBPACK_IMPORTED_MODULE_82__.switchMapTo),
/* harmony export */   "switchScan": () => (/* reexport safe */ _internal_operators_switchScan__WEBPACK_IMPORTED_MODULE_83__.switchScan),
/* harmony export */   "take": () => (/* reexport safe */ _internal_operators_take__WEBPACK_IMPORTED_MODULE_84__.take),
/* harmony export */   "takeLast": () => (/* reexport safe */ _internal_operators_takeLast__WEBPACK_IMPORTED_MODULE_85__.takeLast),
/* harmony export */   "takeUntil": () => (/* reexport safe */ _internal_operators_takeUntil__WEBPACK_IMPORTED_MODULE_86__.takeUntil),
/* harmony export */   "takeWhile": () => (/* reexport safe */ _internal_operators_takeWhile__WEBPACK_IMPORTED_MODULE_87__.takeWhile),
/* harmony export */   "tap": () => (/* reexport safe */ _internal_operators_tap__WEBPACK_IMPORTED_MODULE_88__.tap),
/* harmony export */   "throttle": () => (/* reexport safe */ _internal_operators_throttle__WEBPACK_IMPORTED_MODULE_89__.throttle),
/* harmony export */   "throttleTime": () => (/* reexport safe */ _internal_operators_throttleTime__WEBPACK_IMPORTED_MODULE_90__.throttleTime),
/* harmony export */   "throwIfEmpty": () => (/* reexport safe */ _internal_operators_throwIfEmpty__WEBPACK_IMPORTED_MODULE_91__.throwIfEmpty),
/* harmony export */   "timeInterval": () => (/* reexport safe */ _internal_operators_timeInterval__WEBPACK_IMPORTED_MODULE_92__.timeInterval),
/* harmony export */   "timeout": () => (/* reexport safe */ _internal_operators_timeout__WEBPACK_IMPORTED_MODULE_93__.timeout),
/* harmony export */   "timeoutWith": () => (/* reexport safe */ _internal_operators_timeoutWith__WEBPACK_IMPORTED_MODULE_94__.timeoutWith),
/* harmony export */   "timestamp": () => (/* reexport safe */ _internal_operators_timestamp__WEBPACK_IMPORTED_MODULE_95__.timestamp),
/* harmony export */   "toArray": () => (/* reexport safe */ _internal_operators_toArray__WEBPACK_IMPORTED_MODULE_96__.toArray),
/* harmony export */   "window": () => (/* reexport safe */ _internal_operators_window__WEBPACK_IMPORTED_MODULE_97__.window),
/* harmony export */   "windowCount": () => (/* reexport safe */ _internal_operators_windowCount__WEBPACK_IMPORTED_MODULE_98__.windowCount),
/* harmony export */   "windowTime": () => (/* reexport safe */ _internal_operators_windowTime__WEBPACK_IMPORTED_MODULE_99__.windowTime),
/* harmony export */   "windowToggle": () => (/* reexport safe */ _internal_operators_windowToggle__WEBPACK_IMPORTED_MODULE_100__.windowToggle),
/* harmony export */   "windowWhen": () => (/* reexport safe */ _internal_operators_windowWhen__WEBPACK_IMPORTED_MODULE_101__.windowWhen),
/* harmony export */   "withLatestFrom": () => (/* reexport safe */ _internal_operators_withLatestFrom__WEBPACK_IMPORTED_MODULE_102__.withLatestFrom),
/* harmony export */   "zip": () => (/* reexport safe */ _internal_operators_zipWith__WEBPACK_IMPORTED_MODULE_103__.zip),
/* harmony export */   "zipWith": () => (/* reexport safe */ _internal_operators_zipWith__WEBPACK_IMPORTED_MODULE_103__.zipWith),
/* harmony export */   "zipAll": () => (/* reexport safe */ _internal_operators_zipAll__WEBPACK_IMPORTED_MODULE_104__.zipAll)
/* harmony export */ });
/* harmony import */ var _internal_operators_audit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(120);
/* harmony import */ var _internal_operators_auditTime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(121);
/* harmony import */ var _internal_operators_buffer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(122);
/* harmony import */ var _internal_operators_bufferCount__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(123);
/* harmony import */ var _internal_operators_bufferTime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(124);
/* harmony import */ var _internal_operators_bufferToggle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(125);
/* harmony import */ var _internal_operators_bufferWhen__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(126);
/* harmony import */ var _internal_operators_catchError__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(127);
/* harmony import */ var _internal_operators_combineAll__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(128);
/* harmony import */ var _internal_operators_combineLatestWith__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(133);
/* harmony import */ var _internal_operators_concatAll__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(93);
/* harmony import */ var _internal_operators_concatMap__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(134);
/* harmony import */ var _internal_operators_concatMapTo__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(135);
/* harmony import */ var _internal_operators_concatWith__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(136);
/* harmony import */ var _internal_operators_connect__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(137);
/* harmony import */ var _internal_operators_count__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(139);
/* harmony import */ var _internal_operators_debounce__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(140);
/* harmony import */ var _internal_operators_debounceTime__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(141);
/* harmony import */ var _internal_operators_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(142);
/* harmony import */ var _internal_operators_delay__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(143);
/* harmony import */ var _internal_operators_delayWhen__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(144);
/* harmony import */ var _internal_operators_dematerialize__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(148);
/* harmony import */ var _internal_operators_distinct__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(149);
/* harmony import */ var _internal_operators_distinctUntilChanged__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(150);
/* harmony import */ var _internal_operators_distinctUntilKeyChanged__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(151);
/* harmony import */ var _internal_operators_elementAt__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(152);
/* harmony import */ var _internal_operators_endWith__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(154);
/* harmony import */ var _internal_operators_every__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(155);
/* harmony import */ var _internal_operators_exhaust__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(156);
/* harmony import */ var _internal_operators_exhaustMap__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(157);
/* harmony import */ var _internal_operators_expand__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(158);
/* harmony import */ var _internal_operators_filter__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(113);
/* harmony import */ var _internal_operators_finalize__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(159);
/* harmony import */ var _internal_operators_find__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(160);
/* harmony import */ var _internal_operators_findIndex__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(161);
/* harmony import */ var _internal_operators_first__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(162);
/* harmony import */ var _internal_operators_groupBy__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(163);
/* harmony import */ var _internal_operators_ignoreElements__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(146);
/* harmony import */ var _internal_operators_isEmpty__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(164);
/* harmony import */ var _internal_operators_last__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(165);
/* harmony import */ var _internal_operators_map__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(86);
/* harmony import */ var _internal_operators_mapTo__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(147);
/* harmony import */ var _internal_operators_materialize__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(167);
/* harmony import */ var _internal_operators_max__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(168);
/* harmony import */ var _internal_operators_mergeWith__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(169);
/* harmony import */ var _internal_operators_mergeAll__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(94);
/* harmony import */ var _internal_operators_mergeMap__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(95);
/* harmony import */ var _internal_operators_mergeMapTo__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(170);
/* harmony import */ var _internal_operators_mergeScan__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(171);
/* harmony import */ var _internal_operators_min__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(172);
/* harmony import */ var _internal_operators_multicast__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(173);
/* harmony import */ var _internal_operators_observeOn__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__(88);
/* harmony import */ var _internal_operators_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_52__ = __webpack_require__(110);
/* harmony import */ var _internal_operators_pairwise__WEBPACK_IMPORTED_MODULE_53__ = __webpack_require__(174);
/* harmony import */ var _internal_operators_partition__WEBPACK_IMPORTED_MODULE_54__ = __webpack_require__(175);
/* harmony import */ var _internal_operators_pluck__WEBPACK_IMPORTED_MODULE_55__ = __webpack_require__(176);
/* harmony import */ var _internal_operators_publish__WEBPACK_IMPORTED_MODULE_56__ = __webpack_require__(177);
/* harmony import */ var _internal_operators_publishBehavior__WEBPACK_IMPORTED_MODULE_57__ = __webpack_require__(178);
/* harmony import */ var _internal_operators_publishLast__WEBPACK_IMPORTED_MODULE_58__ = __webpack_require__(179);
/* harmony import */ var _internal_operators_publishReplay__WEBPACK_IMPORTED_MODULE_59__ = __webpack_require__(180);
/* harmony import */ var _internal_operators_raceWith__WEBPACK_IMPORTED_MODULE_60__ = __webpack_require__(181);
/* harmony import */ var _internal_operators_reduce__WEBPACK_IMPORTED_MODULE_61__ = __webpack_require__(131);
/* harmony import */ var _internal_operators_repeat__WEBPACK_IMPORTED_MODULE_62__ = __webpack_require__(182);
/* harmony import */ var _internal_operators_repeatWhen__WEBPACK_IMPORTED_MODULE_63__ = __webpack_require__(183);
/* harmony import */ var _internal_operators_retry__WEBPACK_IMPORTED_MODULE_64__ = __webpack_require__(184);
/* harmony import */ var _internal_operators_retryWhen__WEBPACK_IMPORTED_MODULE_65__ = __webpack_require__(185);
/* harmony import */ var _internal_operators_refCount__WEBPACK_IMPORTED_MODULE_66__ = __webpack_require__(23);
/* harmony import */ var _internal_operators_sample__WEBPACK_IMPORTED_MODULE_67__ = __webpack_require__(186);
/* harmony import */ var _internal_operators_sampleTime__WEBPACK_IMPORTED_MODULE_68__ = __webpack_require__(187);
/* harmony import */ var _internal_operators_scan__WEBPACK_IMPORTED_MODULE_69__ = __webpack_require__(188);
/* harmony import */ var _internal_operators_sequenceEqual__WEBPACK_IMPORTED_MODULE_70__ = __webpack_require__(189);
/* harmony import */ var _internal_operators_share__WEBPACK_IMPORTED_MODULE_71__ = __webpack_require__(190);
/* harmony import */ var _internal_operators_shareReplay__WEBPACK_IMPORTED_MODULE_72__ = __webpack_require__(191);
/* harmony import */ var _internal_operators_single__WEBPACK_IMPORTED_MODULE_73__ = __webpack_require__(192);
/* harmony import */ var _internal_operators_skip__WEBPACK_IMPORTED_MODULE_74__ = __webpack_require__(193);
/* harmony import */ var _internal_operators_skipLast__WEBPACK_IMPORTED_MODULE_75__ = __webpack_require__(194);
/* harmony import */ var _internal_operators_skipUntil__WEBPACK_IMPORTED_MODULE_76__ = __webpack_require__(195);
/* harmony import */ var _internal_operators_skipWhile__WEBPACK_IMPORTED_MODULE_77__ = __webpack_require__(196);
/* harmony import */ var _internal_operators_startWith__WEBPACK_IMPORTED_MODULE_78__ = __webpack_require__(197);
/* harmony import */ var _internal_operators_subscribeOn__WEBPACK_IMPORTED_MODULE_79__ = __webpack_require__(87);
/* harmony import */ var _internal_operators_switchAll__WEBPACK_IMPORTED_MODULE_80__ = __webpack_require__(198);
/* harmony import */ var _internal_operators_switchMap__WEBPACK_IMPORTED_MODULE_81__ = __webpack_require__(199);
/* harmony import */ var _internal_operators_switchMapTo__WEBPACK_IMPORTED_MODULE_82__ = __webpack_require__(200);
/* harmony import */ var _internal_operators_switchScan__WEBPACK_IMPORTED_MODULE_83__ = __webpack_require__(201);
/* harmony import */ var _internal_operators_take__WEBPACK_IMPORTED_MODULE_84__ = __webpack_require__(145);
/* harmony import */ var _internal_operators_takeLast__WEBPACK_IMPORTED_MODULE_85__ = __webpack_require__(166);
/* harmony import */ var _internal_operators_takeUntil__WEBPACK_IMPORTED_MODULE_86__ = __webpack_require__(202);
/* harmony import */ var _internal_operators_takeWhile__WEBPACK_IMPORTED_MODULE_87__ = __webpack_require__(203);
/* harmony import */ var _internal_operators_tap__WEBPACK_IMPORTED_MODULE_88__ = __webpack_require__(204);
/* harmony import */ var _internal_operators_throttle__WEBPACK_IMPORTED_MODULE_89__ = __webpack_require__(205);
/* harmony import */ var _internal_operators_throttleTime__WEBPACK_IMPORTED_MODULE_90__ = __webpack_require__(206);
/* harmony import */ var _internal_operators_throwIfEmpty__WEBPACK_IMPORTED_MODULE_91__ = __webpack_require__(153);
/* harmony import */ var _internal_operators_timeInterval__WEBPACK_IMPORTED_MODULE_92__ = __webpack_require__(207);
/* harmony import */ var _internal_operators_timeout__WEBPACK_IMPORTED_MODULE_93__ = __webpack_require__(81);
/* harmony import */ var _internal_operators_timeoutWith__WEBPACK_IMPORTED_MODULE_94__ = __webpack_require__(208);
/* harmony import */ var _internal_operators_timestamp__WEBPACK_IMPORTED_MODULE_95__ = __webpack_require__(209);
/* harmony import */ var _internal_operators_toArray__WEBPACK_IMPORTED_MODULE_96__ = __webpack_require__(130);
/* harmony import */ var _internal_operators_window__WEBPACK_IMPORTED_MODULE_97__ = __webpack_require__(210);
/* harmony import */ var _internal_operators_windowCount__WEBPACK_IMPORTED_MODULE_98__ = __webpack_require__(211);
/* harmony import */ var _internal_operators_windowTime__WEBPACK_IMPORTED_MODULE_99__ = __webpack_require__(212);
/* harmony import */ var _internal_operators_windowToggle__WEBPACK_IMPORTED_MODULE_100__ = __webpack_require__(213);
/* harmony import */ var _internal_operators_windowWhen__WEBPACK_IMPORTED_MODULE_101__ = __webpack_require__(214);
/* harmony import */ var _internal_operators_withLatestFrom__WEBPACK_IMPORTED_MODULE_102__ = __webpack_require__(215);
/* harmony import */ var _internal_operators_zipWith__WEBPACK_IMPORTED_MODULE_103__ = __webpack_require__(216);
/* harmony import */ var _internal_operators_zipAll__WEBPACK_IMPORTED_MODULE_104__ = __webpack_require__(217);









































































































//# sourceMappingURL=index.js.map

/***/ }),
/* 120 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "audit": () => (/* binding */ audit)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function audit(durationSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var isComplete = false;
        var endDuration = function () {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
            isComplete && subscriber.complete();
        };
        var cleanupDuration = function () {
            durationSubscriber = null;
            isComplete && subscriber.complete();
        };
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            lastValue = value;
            if (!durationSubscriber) {
                (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(durationSelector(value)).subscribe((durationSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, endDuration, undefined, cleanupDuration)));
            }
        }, undefined, function () {
            isComplete = true;
            (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=audit.js.map

/***/ }),
/* 121 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "auditTime": () => (/* binding */ auditTime)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _audit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(120);
/* harmony import */ var _observable_timer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(105);



function auditTime(duration, scheduler) {
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async; }
    return (0,_audit__WEBPACK_IMPORTED_MODULE_1__.audit)(function () { return (0,_observable_timer__WEBPACK_IMPORTED_MODULE_2__.timer)(duration, scheduler); });
}
//# sourceMappingURL=auditTime.js.map

/***/ }),
/* 122 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "buffer": () => (/* binding */ buffer)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function buffer(closingNotifier) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var currentBuffer = [];
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) { return currentBuffer.push(value); }));
        closingNotifier.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function () {
            var b = currentBuffer;
            currentBuffer = [];
            subscriber.next(b);
        }));
        return function () {
            currentBuffer = null;
        };
    });
}
//# sourceMappingURL=buffer.js.map

/***/ }),
/* 123 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferCount": () => (/* binding */ bufferCount)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);




function bufferCount(bufferSize, startBufferEvery) {
    if (startBufferEvery === void 0) { startBufferEvery = null; }
    startBufferEvery = startBufferEvery !== null && startBufferEvery !== void 0 ? startBufferEvery : bufferSize;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var buffers = [];
        var count = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            var e_1, _a, e_2, _b;
            var toEmit = null;
            if (count++ % startBufferEvery === 0) {
                buffers.push([]);
            }
            try {
                for (var buffers_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__values)(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
                    var buffer = buffers_1_1.value;
                    buffer.push(value);
                    if (bufferSize <= buffer.length) {
                        toEmit = toEmit !== null && toEmit !== void 0 ? toEmit : [];
                        toEmit.push(buffer);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            if (toEmit) {
                try {
                    for (var toEmit_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__values)(toEmit), toEmit_1_1 = toEmit_1.next(); !toEmit_1_1.done; toEmit_1_1 = toEmit_1.next()) {
                        var buffer = toEmit_1_1.value;
                        (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_3__.arrRemove)(buffers, buffer);
                        subscriber.next(buffer);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (toEmit_1_1 && !toEmit_1_1.done && (_b = toEmit_1.return)) _b.call(toEmit_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }, undefined, function () {
            var e_3, _a;
            try {
                for (var buffers_2 = (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__values)(buffers), buffers_2_1 = buffers_2.next(); !buffers_2_1.done; buffers_2_1 = buffers_2.next()) {
                    var buffer = buffers_2_1.value;
                    subscriber.next(buffer);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (buffers_2_1 && !buffers_2_1.done && (_a = buffers_2.return)) _a.call(buffers_2);
                }
                finally { if (e_3) throw e_3.error; }
            }
            subscriber.complete();
        }, function () {
            buffers = null;
        }));
    });
}
//# sourceMappingURL=bufferCount.js.map

/***/ }),
/* 124 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferTime": () => (/* binding */ bufferTime)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(22);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(44);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);







function bufferTime(bufferTimeSpan) {
    var _a, _b;
    var otherArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
    }
    var scheduler = (_a = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(otherArgs)) !== null && _a !== void 0 ? _a : _scheduler_async__WEBPACK_IMPORTED_MODULE_1__.asyncScheduler;
    var bufferCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
    var maxBufferSize = otherArgs[1] || Infinity;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_2__.operate)(function (source, subscriber) {
        var bufferRecords = [];
        var restartOnEmit = false;
        var emit = function (record) {
            var buffer = record.buffer, subs = record.subs;
            subs.unsubscribe();
            (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_3__.arrRemove)(bufferRecords, record);
            subscriber.next(buffer);
            restartOnEmit && startBuffer();
        };
        var startBuffer = function () {
            if (bufferRecords) {
                var subs = new _Subscription__WEBPACK_IMPORTED_MODULE_4__.Subscription();
                subscriber.add(subs);
                var buffer = [];
                var record_1 = {
                    buffer: buffer,
                    subs: subs,
                };
                bufferRecords.push(record_1);
                subs.add(scheduler.schedule(function () { return emit(record_1); }, bufferTimeSpan));
            }
        };
        bufferCreationInterval !== null && bufferCreationInterval >= 0
            ?
                subscriber.add(scheduler.schedule(function () {
                    startBuffer();
                    !this.closed && subscriber.add(this.schedule(null, bufferCreationInterval));
                }, bufferCreationInterval))
            : (restartOnEmit = true);
        startBuffer();
        var bufferTimeSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_5__.OperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            var recordsCopy = bufferRecords.slice();
            try {
                for (var recordsCopy_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__values)(recordsCopy), recordsCopy_1_1 = recordsCopy_1.next(); !recordsCopy_1_1.done; recordsCopy_1_1 = recordsCopy_1.next()) {
                    var record = recordsCopy_1_1.value;
                    var buffer = record.buffer;
                    buffer.push(value);
                    maxBufferSize <= buffer.length && emit(record);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (recordsCopy_1_1 && !recordsCopy_1_1.done && (_a = recordsCopy_1.return)) _a.call(recordsCopy_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, undefined, function () {
            while (bufferRecords === null || bufferRecords === void 0 ? void 0 : bufferRecords.length) {
                subscriber.next(bufferRecords.shift().buffer);
            }
            bufferTimeSubscriber === null || bufferTimeSubscriber === void 0 ? void 0 : bufferTimeSubscriber.unsubscribe();
            subscriber.complete();
            subscriber.unsubscribe();
        }, function () { return (bufferRecords = null); });
        source.subscribe(bufferTimeSubscriber);
    });
}
//# sourceMappingURL=bufferTime.js.map

/***/ }),
/* 125 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferToggle": () => (/* binding */ bufferToggle)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(15);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(12);







function bufferToggle(openings, closingSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var buffers = [];
        (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(openings).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (openValue) {
            var buffer = [];
            buffers.push(buffer);
            var closingSubscription = new _Subscription__WEBPACK_IMPORTED_MODULE_3__.Subscription();
            var emitBuffer = function () {
                (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_4__.arrRemove)(buffers, buffer);
                subscriber.next(buffer);
                closingSubscription.unsubscribe();
            };
            closingSubscription.add((0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(closingSelector(openValue)).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, emitBuffer, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop)));
        }, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop));
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            try {
                for (var buffers_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__values)(buffers), buffers_1_1 = buffers_1.next(); !buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
                    var buffer = buffers_1_1.value;
                    buffer.push(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return)) _a.call(buffers_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, undefined, function () {
            while (buffers.length > 0) {
                subscriber.next(buffers.shift());
            }
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=bufferToggle.js.map

/***/ }),
/* 126 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferWhen": () => (/* binding */ bufferWhen)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(15);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);




function bufferWhen(closingSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var buffer = null;
        var closingSubscriber = null;
        var openBuffer = function () {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            var b = buffer;
            buffer = [];
            b && subscriber.next(b);
            (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(closingSelector()).subscribe((closingSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, openBuffer, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_3__.noop)));
        };
        openBuffer();
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) { return buffer === null || buffer === void 0 ? void 0 : buffer.push(value); }, undefined, function () {
            buffer && subscriber.next(buffer);
            subscriber.complete();
        }, function () { return (buffer = closingSubscriber = null); }));
    });
}
//# sourceMappingURL=bufferWhen.js.map

/***/ }),
/* 127 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "catchError": () => (/* binding */ catchError)
/* harmony export */ });
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);



function catchError(selector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var innerSub = null;
        var syncUnsub = false;
        var handledResult;
        innerSub = source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, undefined, function (err) {
            handledResult = (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(selector(err, catchError(selector)(source)));
            if (innerSub) {
                innerSub.unsubscribe();
                innerSub = null;
                handledResult.subscribe(subscriber);
            }
            else {
                syncUnsub = true;
            }
        }));
        if (syncUnsub) {
            innerSub.unsubscribe();
            innerSub = null;
            handledResult.subscribe(subscriber);
        }
    });
}
//# sourceMappingURL=catchError.js.map

/***/ }),
/* 128 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "combineAll": () => (/* binding */ combineAll)
/* harmony export */ });
/* harmony import */ var _observable_combineLatest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(90);
/* harmony import */ var _joinAllInternals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(129);


function combineAll(project) {
    return (0,_joinAllInternals__WEBPACK_IMPORTED_MODULE_0__.joinAllInternals)(_observable_combineLatest__WEBPACK_IMPORTED_MODULE_1__.combineLatest, project);
}
//# sourceMappingURL=combineAll.js.map

/***/ }),
/* 129 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "joinAllInternals": () => (/* binding */ joinAllInternals)
/* harmony export */ });
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(20);
/* harmony import */ var _util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(85);
/* harmony import */ var _util_pipe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(95);
/* harmony import */ var _toArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(130);





function joinAllInternals(joinFn, project) {
    return (0,_util_pipe__WEBPACK_IMPORTED_MODULE_0__.pipe)((0,_toArray__WEBPACK_IMPORTED_MODULE_1__.toArray)(), (0,_mergeMap__WEBPACK_IMPORTED_MODULE_2__.mergeMap)(function (sources) { return joinFn(sources); }), project ? (0,_util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_3__.mapOneOrManyArgs)(project) : _util_identity__WEBPACK_IMPORTED_MODULE_4__.identity);
}
//# sourceMappingURL=joinAllInternals.js.map

/***/ }),
/* 130 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "toArray": () => (/* binding */ toArray)
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(131);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);


var arrReducer = function (arr, value) { return (arr.push(value), arr); };
function toArray() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        (0,_reduce__WEBPACK_IMPORTED_MODULE_1__.reduce)(arrReducer, [])(source).subscribe(subscriber);
    });
}
//# sourceMappingURL=toArray.js.map

/***/ }),
/* 131 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "reduce": () => (/* binding */ reduce)
/* harmony export */ });
/* harmony import */ var _scanInternals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(132);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);


function reduce(accumulator, seed) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)((0,_scanInternals__WEBPACK_IMPORTED_MODULE_1__.scanInternals)(accumulator, seed, arguments.length >= 2, false, true));
}
//# sourceMappingURL=reduce.js.map

/***/ }),
/* 132 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scanInternals": () => (/* binding */ scanInternals)
/* harmony export */ });
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22);

function scanInternals(accumulator, seed, hasSeed, emitOnNext, emitBeforeComplete) {
    return function (source, subscriber) {
        var hasState = hasSeed;
        var state = seed;
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_0__.OperatorSubscriber(subscriber, function (value) {
            var i = index++;
            state = hasState
                ?
                    accumulator(state, value, i)
                :
                    ((hasState = true), value);
            emitOnNext && subscriber.next(state);
        }, undefined, emitBeforeComplete &&
            (function () {
                hasState && subscriber.next(state);
                subscriber.complete();
            })));
    };
}
//# sourceMappingURL=scanInternals.js.map

/***/ }),
/* 133 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "combineLatest": () => (/* binding */ combineLatest),
/* harmony export */   "combineLatestWith": () => (/* binding */ combineLatestWith)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _observable_combineLatest__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(90);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(24);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(107);
/* harmony import */ var _util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(85);
/* harmony import */ var _util_pipe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(19);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);







function combineLatest() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var resultSelector = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popResultSelector)(args);
    return resultSelector
        ? (0,_util_pipe__WEBPACK_IMPORTED_MODULE_1__.pipe)(combineLatest.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)(args)), (0,_util_mapOneOrManyArgs__WEBPACK_IMPORTED_MODULE_3__.mapOneOrManyArgs)(resultSelector))
        : (0,_util_lift__WEBPACK_IMPORTED_MODULE_4__.operate)(function (source, subscriber) {
            (0,_observable_combineLatest__WEBPACK_IMPORTED_MODULE_5__.combineLatestInit)((0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)([source], (0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_6__.argsOrArgArray)(args)))(subscriber);
        });
}
function combineLatestWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return combineLatest.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)(otherSources));
}
//# sourceMappingURL=combineLatestWith.js.map

/***/ }),
/* 134 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatMap": () => (/* binding */ concatMap)
/* harmony export */ });
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(95);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);


function concatMap(project, resultSelector) {
    return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(resultSelector) ? (0,_mergeMap__WEBPACK_IMPORTED_MODULE_1__.mergeMap)(project, resultSelector, 1) : (0,_mergeMap__WEBPACK_IMPORTED_MODULE_1__.mergeMap)(project, 1);
}
//# sourceMappingURL=concatMap.js.map

/***/ }),
/* 135 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatMapTo": () => (/* binding */ concatMapTo)
/* harmony export */ });
/* harmony import */ var _concatMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(134);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);


function concatMapTo(innerObservable, resultSelector) {
    return (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(resultSelector) ? (0,_concatMap__WEBPACK_IMPORTED_MODULE_1__.concatMap)(function () { return innerObservable; }, resultSelector) : (0,_concatMap__WEBPACK_IMPORTED_MODULE_1__.concatMap)(function () { return innerObservable; });
}
//# sourceMappingURL=concatMapTo.js.map

/***/ }),
/* 136 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatWith": () => (/* binding */ concatWith),
/* harmony export */   "concat": () => (/* binding */ concat)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _concatAll__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(93);
/* harmony import */ var _observable_fromArray__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(57);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(54);





function concatWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return concat.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)(otherSources));
}
function concat() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = (0,_util_args__WEBPACK_IMPORTED_MODULE_1__.popScheduler)(args);
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_2__.operate)(function (source, subscriber) {
        (0,_concatAll__WEBPACK_IMPORTED_MODULE_3__.concatAll)()((0,_observable_fromArray__WEBPACK_IMPORTED_MODULE_4__.internalFromArray)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)([source], args), scheduler)).subscribe(subscriber);
    });
}
//# sourceMappingURL=concatWith.js.map

/***/ }),
/* 137 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "connect": () => (/* binding */ connect)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(28);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _observable_fromSubscribable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(138);




var DEFAULT_CONFIG = {
    connector: function () { return new _Subject__WEBPACK_IMPORTED_MODULE_0__.Subject(); },
};
function connect(selector, config) {
    if (config === void 0) { config = DEFAULT_CONFIG; }
    var connector = config.connector;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
        var subject = connector();
        (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.from)(selector((0,_observable_fromSubscribable__WEBPACK_IMPORTED_MODULE_3__.fromSubscribable)(subject))).subscribe(subscriber);
        subscriber.add(source.subscribe(subject));
    });
}
//# sourceMappingURL=connect.js.map

/***/ }),
/* 138 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromSubscribable": () => (/* binding */ fromSubscribable)
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);

function fromSubscribable(subscribable) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return subscribable.subscribe(subscriber); });
}
//# sourceMappingURL=fromSubscribable.js.map

/***/ }),
/* 139 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "count": () => (/* binding */ count)
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(131);

function count(predicate) {
    return (0,_reduce__WEBPACK_IMPORTED_MODULE_0__.reduce)(function (total, value, i) { return (!predicate || predicate(value, i) ? total + 1 : total); }, 0);
}
//# sourceMappingURL=count.js.map

/***/ }),
/* 140 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "debounce": () => (/* binding */ debounce)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(58);




function debounce(durationSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        var durationSubscriber = null;
        var emit = function () {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            durationSubscriber = null;
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            durationSubscriber === null || durationSubscriber === void 0 ? void 0 : durationSubscriber.unsubscribe();
            hasValue = true;
            lastValue = value;
            durationSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, emit, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_2__.noop);
            (0,_observable_from__WEBPACK_IMPORTED_MODULE_3__.innerFrom)(durationSelector(value)).subscribe(durationSubscriber);
        }, undefined, function () {
            emit();
            subscriber.complete();
        }, function () {
            lastValue = durationSubscriber = null;
        }));
    });
}
//# sourceMappingURL=debounce.js.map

/***/ }),
/* 141 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "debounceTime": () => (/* binding */ debounceTime)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _debounce__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(140);
/* harmony import */ var _observable_timer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(105);



function debounceTime(dueTime, scheduler) {
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.asyncScheduler; }
    var duration = (0,_observable_timer__WEBPACK_IMPORTED_MODULE_1__.timer)(dueTime, scheduler);
    return (0,_debounce__WEBPACK_IMPORTED_MODULE_2__.debounce)(function () { return duration; });
}
//# sourceMappingURL=debounceTime.js.map

/***/ }),
/* 142 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultIfEmpty": () => (/* binding */ defaultIfEmpty)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function defaultIfEmpty(defaultValue) {
    if (defaultValue === void 0) { defaultValue = null; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, undefined, function () {
            if (!hasValue) {
                subscriber.next(defaultValue);
            }
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=defaultIfEmpty.js.map

/***/ }),
/* 143 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "delay": () => (/* binding */ delay)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _delayWhen__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(144);
/* harmony import */ var _observable_timer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(105);



function delay(due, scheduler) {
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.asyncScheduler; }
    var duration = (0,_observable_timer__WEBPACK_IMPORTED_MODULE_1__.timer)(due, scheduler);
    return (0,_delayWhen__WEBPACK_IMPORTED_MODULE_2__.delayWhen)(function () { return duration; });
}
//# sourceMappingURL=delay.js.map

/***/ }),
/* 144 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "delayWhen": () => (/* binding */ delayWhen)
/* harmony export */ });
/* harmony import */ var _observable_concat__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(92);
/* harmony import */ var _take__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(145);
/* harmony import */ var _ignoreElements__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(146);
/* harmony import */ var _mapTo__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(147);
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(95);





function delayWhen(delayDurationSelector, subscriptionDelay) {
    if (subscriptionDelay) {
        return function (source) {
            return (0,_observable_concat__WEBPACK_IMPORTED_MODULE_0__.concat)(subscriptionDelay.pipe((0,_take__WEBPACK_IMPORTED_MODULE_1__.take)(1), (0,_ignoreElements__WEBPACK_IMPORTED_MODULE_2__.ignoreElements)()), source.pipe(delayWhen(delayDurationSelector)));
        };
    }
    return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_3__.mergeMap)(function (value, index) { return delayDurationSelector(value, index).pipe((0,_take__WEBPACK_IMPORTED_MODULE_1__.take)(1), (0,_mapTo__WEBPACK_IMPORTED_MODULE_4__.mapTo)(value)); });
}
//# sourceMappingURL=delayWhen.js.map

/***/ }),
/* 145 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "take": () => (/* binding */ take)
/* harmony export */ });
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);



function take(count) {
    return count <= 0
        ?
            function () { return _observable_empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY; }
        : (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
            var seen = 0;
            source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
                if (++seen <= count) {
                    subscriber.next(value);
                    if (count <= seen) {
                        subscriber.complete();
                    }
                }
            }));
        });
}
//# sourceMappingURL=take.js.map

/***/ }),
/* 146 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ignoreElements": () => (/* binding */ ignoreElements)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);



function ignoreElements() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, _util_noop__WEBPACK_IMPORTED_MODULE_2__.noop));
    });
}
//# sourceMappingURL=ignoreElements.js.map

/***/ }),
/* 147 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mapTo": () => (/* binding */ mapTo)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function mapTo(value) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function () { return subscriber.next(value); }));
    });
}
//# sourceMappingURL=mapTo.js.map

/***/ }),
/* 148 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dematerialize": () => (/* binding */ dematerialize)
/* harmony export */ });
/* harmony import */ var _Notification__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(52);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function dematerialize() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (notification) { return (0,_Notification__WEBPACK_IMPORTED_MODULE_2__.observeNotification)(notification, subscriber); }));
    });
}
//# sourceMappingURL=dematerialize.js.map

/***/ }),
/* 149 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "distinct": () => (/* binding */ distinct)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);



function distinct(keySelector, flushes) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var distinctKeys = new Set();
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            var key = keySelector ? keySelector(value) : value;
            if (!distinctKeys.has(key)) {
                distinctKeys.add(key);
                subscriber.next(value);
            }
        }));
        flushes === null || flushes === void 0 ? void 0 : flushes.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function () { return distinctKeys.clear(); }, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_2__.noop));
    });
}
//# sourceMappingURL=distinct.js.map

/***/ }),
/* 150 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "distinctUntilChanged": () => (/* binding */ distinctUntilChanged)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function distinctUntilChanged(compare, keySelector) {
    compare = compare !== null && compare !== void 0 ? compare : defaultCompare;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var prev;
        var first = true;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            ((first && ((prev = value), 1)) || !compare(prev, (prev = keySelector ? keySelector(value) : value))) &&
                subscriber.next(value);
            first = false;
        }));
    });
}
function defaultCompare(a, b) {
    return a === b;
}
//# sourceMappingURL=distinctUntilChanged.js.map

/***/ }),
/* 151 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "distinctUntilKeyChanged": () => (/* binding */ distinctUntilKeyChanged)
/* harmony export */ });
/* harmony import */ var _distinctUntilChanged__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(150);

function distinctUntilKeyChanged(key, compare) {
    return (0,_distinctUntilChanged__WEBPACK_IMPORTED_MODULE_0__.distinctUntilChanged)(function (x, y) { return compare ? compare(x[key], y[key]) : x[key] === y[key]; });
}
//# sourceMappingURL=distinctUntilKeyChanged.js.map

/***/ }),
/* 152 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "elementAt": () => (/* binding */ elementAt)
/* harmony export */ });
/* harmony import */ var _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(78);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(113);
/* harmony import */ var _throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(153);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(142);
/* harmony import */ var _take__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(145);





function elementAt(index, defaultValue) {
    if (index < 0) {
        throw new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__.ArgumentOutOfRangeError();
    }
    var hasDefaultValue = arguments.length >= 2;
    return function (source) { return source.pipe((0,_filter__WEBPACK_IMPORTED_MODULE_1__.filter)(function (v, i) { return i === index; }), (0,_take__WEBPACK_IMPORTED_MODULE_2__.take)(1), hasDefaultValue
        ? (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(defaultValue)
        : (0,_throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__.throwIfEmpty)(function () { return new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__.ArgumentOutOfRangeError(); })); };
}
//# sourceMappingURL=elementAt.js.map

/***/ }),
/* 153 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throwIfEmpty": () => (/* binding */ throwIfEmpty)
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(76);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function throwIfEmpty(errorFactory) {
    if (errorFactory === void 0) { errorFactory = defaultErrorFactory; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            subscriber.next(value);
        }, undefined, function () { return (hasValue ? subscriber.complete() : subscriber.error(errorFactory())); }));
    });
}
function defaultErrorFactory() {
    return new _util_EmptyError__WEBPACK_IMPORTED_MODULE_2__.EmptyError();
}
//# sourceMappingURL=throwIfEmpty.js.map

/***/ }),
/* 154 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "endWith": () => (/* binding */ endWith)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _observable_concat__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(92);
/* harmony import */ var _observable_of__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(53);



function endWith() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    return function (source) { return (0,_observable_concat__WEBPACK_IMPORTED_MODULE_0__.concat)(source, _observable_of__WEBPACK_IMPORTED_MODULE_1__.of.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)(values))); };
}
//# sourceMappingURL=endWith.js.map

/***/ }),
/* 155 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "every": () => (/* binding */ every)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function every(predicate, thisArg) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            if (!predicate.call(thisArg, value, index++, source)) {
                subscriber.next(false);
                subscriber.complete();
            }
        }, undefined, function () {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=every.js.map

/***/ }),
/* 156 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "exhaust": () => (/* binding */ exhaust)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function exhaust() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var isComplete = false;
        var innerSub = null;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (inner) {
            if (!innerSub) {
                innerSub = (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(inner).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, undefined, undefined, function () {
                    innerSub = null;
                    isComplete && subscriber.complete();
                }));
            }
        }, undefined, function () {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=exhaust.js.map

/***/ }),
/* 157 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "exhaustMap": () => (/* binding */ exhaustMap)
/* harmony export */ });
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(58);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22);




function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        return function (source) {
            return source.pipe(exhaustMap(function (a, i) { return (0,_observable_from__WEBPACK_IMPORTED_MODULE_0__.innerFrom)(project(a, i)).pipe((0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (b, ii) { return resultSelector(a, b, i, ii); })); }));
        };
    }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_2__.operate)(function (source, subscriber) {
        var index = 0;
        var innerSub = null;
        var isComplete = false;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, function (outerValue) {
            if (!innerSub) {
                innerSub = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, undefined, undefined, function () {
                    innerSub = null;
                    isComplete && subscriber.complete();
                });
                (0,_observable_from__WEBPACK_IMPORTED_MODULE_0__.innerFrom)(project(outerValue, index++)).subscribe(innerSub);
            }
        }, undefined, function () {
            isComplete = true;
            !innerSub && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=exhaustMap.js.map

/***/ }),
/* 158 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "expand": () => (/* binding */ expand)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _mergeInternals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(96);


function expand(project, concurrent, scheduler) {
    if (concurrent === void 0) { concurrent = Infinity; }
    concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        return (0,_mergeInternals__WEBPACK_IMPORTED_MODULE_1__.mergeInternals)(source, subscriber, project, concurrent, undefined, true, scheduler);
    });
}
//# sourceMappingURL=expand.js.map

/***/ }),
/* 159 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "finalize": () => (/* binding */ finalize)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);

function finalize(callback) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(subscriber);
        subscriber.add(callback);
    });
}
//# sourceMappingURL=finalize.js.map

/***/ }),
/* 160 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "find": () => (/* binding */ find),
/* harmony export */   "createFind": () => (/* binding */ createFind)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function find(predicate, thisArg) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(createFind(predicate, thisArg, 'value'));
}
function createFind(predicate, thisArg, emit) {
    var findIndex = emit === 'index';
    return function (source, subscriber) {
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            var i = index++;
            if (predicate.call(thisArg, value, i, source)) {
                subscriber.next(findIndex ? i : value);
                subscriber.complete();
            }
        }, undefined, function () {
            subscriber.next(findIndex ? -1 : undefined);
            subscriber.complete();
        }));
    };
}
//# sourceMappingURL=find.js.map

/***/ }),
/* 161 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "findIndex": () => (/* binding */ findIndex)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _find__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(160);


function findIndex(predicate, thisArg) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)((0,_find__WEBPACK_IMPORTED_MODULE_1__.createFind)(predicate, thisArg, 'index'));
}
//# sourceMappingURL=findIndex.js.map

/***/ }),
/* 162 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "first": () => (/* binding */ first)
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(76);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(113);
/* harmony import */ var _take__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(145);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(142);
/* harmony import */ var _throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(153);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);






function first(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(function (v, i) { return predicate(v, i, source); }) : _util_identity__WEBPACK_IMPORTED_MODULE_1__.identity, (0,_take__WEBPACK_IMPORTED_MODULE_2__.take)(1), hasDefaultValue ? (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(defaultValue) : (0,_throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__.throwIfEmpty)(function () { return new _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__.EmptyError(); }));
    };
}
//# sourceMappingURL=first.js.map

/***/ }),
/* 163 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "groupBy": () => (/* binding */ groupBy)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);





function groupBy(keySelector, elementSelector, durationSelector, subjectSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var groups = new Map();
        var notify = function (cb) {
            groups.forEach(cb);
            cb(subscriber);
        };
        var handleError = function (err) { return notify(function (consumer) { return consumer.error(err); }); };
        var groupBySourceSubscriber = new GroupBySubscriber(subscriber, function (value) {
            try {
                var key_1 = keySelector(value);
                var group_1 = groups.get(key_1);
                if (!group_1) {
                    groups.set(key_1, (group_1 = subjectSelector ? subjectSelector() : new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject()));
                    var grouped = createGroupedObservable(key_1, group_1);
                    subscriber.next(grouped);
                    if (durationSelector) {
                        var durationSubscriber_1 = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(group_1, function () {
                            group_1.complete();
                            durationSubscriber_1 === null || durationSubscriber_1 === void 0 ? void 0 : durationSubscriber_1.unsubscribe();
                        }, undefined, undefined, function () { return groups.delete(key_1); });
                        groupBySourceSubscriber.add(durationSelector(grouped).subscribe(durationSubscriber_1));
                    }
                }
                group_1.next(elementSelector ? elementSelector(value) : value);
            }
            catch (err) {
                handleError(err);
            }
        }, handleError, function () { return notify(function (consumer) { return consumer.complete(); }); }, function () { return groups.clear(); });
        source.subscribe(groupBySourceSubscriber);
        function createGroupedObservable(key, groupSubject) {
            var result = new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(function (groupSubscriber) {
                groupBySourceSubscriber.activeGroups++;
                var innerSub = groupSubject.subscribe(groupSubscriber);
                return function () {
                    innerSub.unsubscribe();
                    --groupBySourceSubscriber.activeGroups === 0 &&
                        groupBySourceSubscriber.teardownAttempted &&
                        groupBySourceSubscriber.unsubscribe();
                };
            });
            result.key = key;
            return result;
        }
    });
}
var GroupBySubscriber = (function (_super) {
    (0,tslib__WEBPACK_IMPORTED_MODULE_4__.__extends)(GroupBySubscriber, _super);
    function GroupBySubscriber() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.activeGroups = 0;
        _this.teardownAttempted = false;
        return _this;
    }
    GroupBySubscriber.prototype.unsubscribe = function () {
        this.teardownAttempted = true;
        this.activeGroups === 0 && _super.prototype.unsubscribe.call(this);
    };
    return GroupBySubscriber;
}(_OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber));
//# sourceMappingURL=groupBy.js.map

/***/ }),
/* 164 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isEmpty": () => (/* binding */ isEmpty)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function isEmpty() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function () {
            subscriber.next(false);
            subscriber.complete();
        }, undefined, function () {
            subscriber.next(true);
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=isEmpty.js.map

/***/ }),
/* 165 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "last": () => (/* binding */ last)
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(76);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(113);
/* harmony import */ var _takeLast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(166);
/* harmony import */ var _throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(153);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(142);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);






function last(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe(predicate ? (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(function (v, i) { return predicate(v, i, source); }) : _util_identity__WEBPACK_IMPORTED_MODULE_1__.identity, (0,_takeLast__WEBPACK_IMPORTED_MODULE_2__.takeLast)(1), hasDefaultValue ? (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(defaultValue) : (0,_throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__.throwIfEmpty)(function () { return new _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__.EmptyError(); }));
    };
}
//# sourceMappingURL=last.js.map

/***/ }),
/* 166 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "takeLast": () => (/* binding */ takeLast)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);




function takeLast(count) {
    return count <= 0
        ? function () { return _observable_empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY; }
        : (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
            var buffer = [];
            source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
                buffer.push(value);
                count < buffer.length && buffer.shift();
            }, undefined, function () {
                var e_1, _a;
                try {
                    for (var buffer_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__values)(buffer), buffer_1_1 = buffer_1.next(); !buffer_1_1.done; buffer_1_1 = buffer_1.next()) {
                        var value = buffer_1_1.value;
                        subscriber.next(value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (buffer_1_1 && !buffer_1_1.done && (_a = buffer_1.return)) _a.call(buffer_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                subscriber.complete();
            }, function () {
                buffer = null;
            }));
        });
}
//# sourceMappingURL=takeLast.js.map

/***/ }),
/* 167 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "materialize": () => (/* binding */ materialize)
/* harmony export */ });
/* harmony import */ var _Notification__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(52);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function materialize() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            subscriber.next(_Notification__WEBPACK_IMPORTED_MODULE_2__.Notification.createNext(value));
        }, function (err) {
            subscriber.next(_Notification__WEBPACK_IMPORTED_MODULE_2__.Notification.createError(err));
            subscriber.complete();
        }, function () {
            subscriber.next(_Notification__WEBPACK_IMPORTED_MODULE_2__.Notification.createComplete());
            subscriber.complete();
        }));
    });
}
//# sourceMappingURL=materialize.js.map

/***/ }),
/* 168 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "max": () => (/* binding */ max)
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(131);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);


function max(comparer) {
    return (0,_reduce__WEBPACK_IMPORTED_MODULE_0__.reduce)((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(comparer) ? function (x, y) { return (comparer(x, y) > 0 ? x : y); } : function (x, y) { return (x > y ? x : y); });
}
//# sourceMappingURL=max.js.map

/***/ }),
/* 169 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "merge": () => (/* binding */ merge),
/* harmony export */   "mergeWith": () => (/* binding */ mergeWith)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(107);
/* harmony import */ var _observable_fromArray__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(57);
/* harmony import */ var _mergeAll__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(94);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);






function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(args);
    var concurrent = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popNumber)(args, Infinity);
    args = (0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__.argsOrArgArray)(args);
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_2__.operate)(function (source, subscriber) {
        (0,_mergeAll__WEBPACK_IMPORTED_MODULE_3__.mergeAll)(concurrent)((0,_observable_fromArray__WEBPACK_IMPORTED_MODULE_4__.internalFromArray)((0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spread)([source], args), scheduler)).subscribe(subscriber);
    });
}
function mergeWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return merge.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_5__.__spread)(otherSources));
}
//# sourceMappingURL=mergeWith.js.map

/***/ }),
/* 170 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeMapTo": () => (/* binding */ mergeMapTo)
/* harmony export */ });
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(95);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);


function mergeMapTo(innerObservable, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(resultSelector)) {
        return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_1__.mergeMap)(function () { return innerObservable; }, resultSelector, concurrent);
    }
    if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_1__.mergeMap)(function () { return innerObservable; }, concurrent);
}
//# sourceMappingURL=mergeMapTo.js.map

/***/ }),
/* 171 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeScan": () => (/* binding */ mergeScan)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _mergeInternals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(96);


function mergeScan(accumulator, seed, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var state = seed;
        return (0,_mergeInternals__WEBPACK_IMPORTED_MODULE_1__.mergeInternals)(source, subscriber, function (value, index) { return accumulator(state, value, index); }, concurrent, function (value) {
            state = value;
        }, false, undefined, function () { return (state = null); });
    });
}
//# sourceMappingURL=mergeScan.js.map

/***/ }),
/* 172 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "min": () => (/* binding */ min)
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(131);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);


function min(comparer) {
    return (0,_reduce__WEBPACK_IMPORTED_MODULE_0__.reduce)((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_1__.isFunction)(comparer) ? function (x, y) { return (comparer(x, y) < 0 ? x : y); } : function (x, y) { return (x < y ? x : y); });
}
//# sourceMappingURL=min.js.map

/***/ }),
/* 173 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "multicast": () => (/* binding */ multicast)
/* harmony export */ });
/* harmony import */ var _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(21);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(24);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _connect__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(137);




function multicast(subjectOrSubjectFactory, selector) {
    var subjectFactory = (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(subjectOrSubjectFactory) ? subjectOrSubjectFactory : function () { return subjectOrSubjectFactory; };
    if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(selector)) {
        return (0,_connect__WEBPACK_IMPORTED_MODULE_1__.connect)(selector, {
            connector: subjectFactory,
        });
    }
    return function (source) {
        var connectable = new _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_2__.ConnectableObservable(source, subjectFactory);
        if ((0,_util_lift__WEBPACK_IMPORTED_MODULE_3__.hasLift)(source)) {
            connectable.lift = source.lift;
        }
        connectable.source = source;
        connectable.subjectFactory = subjectFactory;
        return connectable;
    };
}
//# sourceMappingURL=multicast.js.map

/***/ }),
/* 174 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pairwise": () => (/* binding */ pairwise)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function pairwise() {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var prev;
        var hasPrev = false;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            var p = prev;
            prev = value;
            hasPrev && subscriber.next([p, value]);
            hasPrev = true;
        }));
    });
}
//# sourceMappingURL=pairwise.js.map

/***/ }),
/* 175 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "partition": () => (/* binding */ partition)
/* harmony export */ });
/* harmony import */ var _util_not__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(114);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(113);


function partition(predicate, thisArg) {
    return function (source) { return [
        (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(predicate, thisArg)(source),
        (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)((0,_util_not__WEBPACK_IMPORTED_MODULE_1__.not)(predicate, thisArg))(source)
    ]; };
}
//# sourceMappingURL=partition.js.map

/***/ }),
/* 176 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pluck": () => (/* binding */ pluck)
/* harmony export */ });
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(86);

function pluck() {
    var properties = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        properties[_i] = arguments[_i];
    }
    var length = properties.length;
    if (length === 0) {
        throw new Error('list of properties cannot be empty.');
    }
    return (0,_map__WEBPACK_IMPORTED_MODULE_0__.map)(function (x) {
        var currentProp = x;
        for (var i = 0; i < length; i++) {
            var p = currentProp === null || currentProp === void 0 ? void 0 : currentProp[properties[i]];
            if (typeof p !== 'undefined') {
                currentProp = p;
            }
            else {
                return undefined;
            }
        }
        return currentProp;
    });
}
//# sourceMappingURL=pluck.js.map

/***/ }),
/* 177 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publish": () => (/* binding */ publish)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(28);
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(173);
/* harmony import */ var _connect__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(137);



function publish(selector) {
    return selector ? (0,_connect__WEBPACK_IMPORTED_MODULE_0__.connect)(selector) : (0,_multicast__WEBPACK_IMPORTED_MODULE_1__.multicast)(new _Subject__WEBPACK_IMPORTED_MODULE_2__.Subject());
}
//# sourceMappingURL=publish.js.map

/***/ }),
/* 178 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publishBehavior": () => (/* binding */ publishBehavior)
/* harmony export */ });
/* harmony import */ var _BehaviorSubject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(30);
/* harmony import */ var _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);


function publishBehavior(initialValue) {
    var subject = new _BehaviorSubject__WEBPACK_IMPORTED_MODULE_0__.BehaviorSubject(initialValue);
    return function (source) { return new _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__.ConnectableObservable(source, function () { return subject; }); };
}
//# sourceMappingURL=publishBehavior.js.map

/***/ }),
/* 179 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publishLast": () => (/* binding */ publishLast)
/* harmony export */ });
/* harmony import */ var _AsyncSubject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/* harmony import */ var _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);


function publishLast() {
    var subject = new _AsyncSubject__WEBPACK_IMPORTED_MODULE_0__.AsyncSubject();
    return function (source) { return new _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__.ConnectableObservable(source, function () { return subject; }); };
}
//# sourceMappingURL=publishLast.js.map

/***/ }),
/* 180 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publishReplay": () => (/* binding */ publishReplay)
/* harmony export */ });
/* harmony import */ var _ReplaySubject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(31);
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(173);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);



function publishReplay(bufferSize, windowTime, selectorOrScheduler, timestampProvider) {
    if (selectorOrScheduler && !(0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(selectorOrScheduler)) {
        timestampProvider = selectorOrScheduler;
    }
    var selector = (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(selectorOrScheduler) ? selectorOrScheduler : undefined;
    var subject = new _ReplaySubject__WEBPACK_IMPORTED_MODULE_1__.ReplaySubject(bufferSize, windowTime, timestampProvider);
    return function (source) { return (0,_multicast__WEBPACK_IMPORTED_MODULE_2__.multicast)(subject, selector)(source); };
}
//# sourceMappingURL=publishReplay.js.map

/***/ }),
/* 181 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "race": () => (/* binding */ race),
/* harmony export */   "raceWith": () => (/* binding */ raceWith)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _observable_race__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(115);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(24);
/* harmony import */ var _util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(107);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(20);





function race() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return raceWith.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)((0,_util_argsOrArgArray__WEBPACK_IMPORTED_MODULE_1__.argsOrArgArray)(args)));
}
function raceWith() {
    var otherSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherSources[_i] = arguments[_i];
    }
    return !otherSources.length ? _util_identity__WEBPACK_IMPORTED_MODULE_2__.identity : (0,_util_lift__WEBPACK_IMPORTED_MODULE_3__.operate)(function (source, subscriber) {
        (0,_observable_race__WEBPACK_IMPORTED_MODULE_4__.raceInit)((0,tslib__WEBPACK_IMPORTED_MODULE_0__.__spread)([source], otherSources))(subscriber);
    });
}
//# sourceMappingURL=raceWith.js.map

/***/ }),
/* 182 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "repeat": () => (/* binding */ repeat)
/* harmony export */ });
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);



function repeat(count) {
    if (count === void 0) { count = Infinity; }
    return count <= 0
        ? function () { return _observable_empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY; }
        : (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
            var soFar = 0;
            var innerSub;
            var subscribeForRepeat = function () {
                var syncUnsub = false;
                innerSub = source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, undefined, undefined, function () {
                    if (++soFar < count) {
                        if (innerSub) {
                            innerSub.unsubscribe();
                            innerSub = null;
                            subscribeForRepeat();
                        }
                        else {
                            syncUnsub = true;
                        }
                    }
                    else {
                        subscriber.complete();
                    }
                }));
                if (syncUnsub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    subscribeForRepeat();
                }
            };
            subscribeForRepeat();
        });
}
//# sourceMappingURL=repeat.js.map

/***/ }),
/* 183 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "repeatWhen": () => (/* binding */ repeatWhen)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);



function repeatWhen(notifier) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var innerSub;
        var syncResub = false;
        var completions$;
        var isNotifierComplete = false;
        var isMainComplete = false;
        var checkComplete = function () { return isMainComplete && isNotifierComplete && (subscriber.complete(), true); };
        var getCompletionSubject = function () {
            if (!completions$) {
                completions$ = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
                notifier(completions$).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function () {
                    if (innerSub) {
                        subscribeForRepeatWhen();
                    }
                    else {
                        syncResub = true;
                    }
                }, undefined, function () {
                    isNotifierComplete = true;
                    checkComplete();
                }));
            }
            return completions$;
        };
        var subscribeForRepeatWhen = function () {
            isMainComplete = false;
            innerSub = source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, undefined, undefined, function () {
                isMainComplete = true;
                !checkComplete() && getCompletionSubject().next();
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRepeatWhen();
            }
        };
        subscribeForRepeatWhen();
    });
}
//# sourceMappingURL=repeatWhen.js.map

/***/ }),
/* 184 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "retry": () => (/* binding */ retry)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);



function retry(configOrCount) {
    if (configOrCount === void 0) { configOrCount = Infinity; }
    var config;
    if (configOrCount && typeof configOrCount === 'object') {
        config = configOrCount;
    }
    else {
        config = {
            count: configOrCount,
        };
    }
    var count = config.count, _a = config.resetOnSuccess, resetOnSuccess = _a === void 0 ? false : _a;
    return count <= 0
        ? function () { return _observable_empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY; }
        : (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
            var soFar = 0;
            var innerSub;
            var subscribeForRetry = function () {
                var syncUnsub = false;
                innerSub = source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
                    if (resetOnSuccess) {
                        soFar = 0;
                    }
                    subscriber.next(value);
                }, function (err) {
                    if (soFar++ < count) {
                        if (innerSub) {
                            innerSub.unsubscribe();
                            innerSub = null;
                            subscribeForRetry();
                        }
                        else {
                            syncUnsub = true;
                        }
                    }
                    else {
                        subscriber.error(err);
                    }
                }));
                if (syncUnsub) {
                    innerSub.unsubscribe();
                    innerSub = null;
                    subscribeForRetry();
                }
            };
            subscribeForRetry();
        });
}
//# sourceMappingURL=retry.js.map

/***/ }),
/* 185 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "retryWhen": () => (/* binding */ retryWhen)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(28);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function retryWhen(notifier) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var innerSub;
        var syncResub = false;
        var errors$;
        var subscribeForRetryWhen = function () {
            innerSub = source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, undefined, function (err) {
                if (!errors$) {
                    errors$ = new _Subject__WEBPACK_IMPORTED_MODULE_2__.Subject();
                    notifier(errors$).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function () {
                        return innerSub ? subscribeForRetryWhen() : (syncResub = true);
                    }));
                }
                if (errors$) {
                    errors$.next(err);
                }
            }));
            if (syncResub) {
                innerSub.unsubscribe();
                innerSub = null;
                syncResub = false;
                subscribeForRetryWhen();
            }
        };
        subscribeForRetryWhen();
    });
}
//# sourceMappingURL=retryWhen.js.map

/***/ }),
/* 186 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sample": () => (/* binding */ sample)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function sample(notifier) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        var lastValue = null;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            lastValue = value;
        }));
        var emit = function () {
            if (hasValue) {
                hasValue = false;
                var value = lastValue;
                lastValue = null;
                subscriber.next(value);
            }
        };
        notifier.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, emit, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_2__.noop));
    });
}
//# sourceMappingURL=sample.js.map

/***/ }),
/* 187 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sampleTime": () => (/* binding */ sampleTime)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _sample__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(186);
/* harmony import */ var _observable_interval__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(104);



function sampleTime(period, scheduler) {
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.asyncScheduler; }
    return (0,_sample__WEBPACK_IMPORTED_MODULE_1__.sample)((0,_observable_interval__WEBPACK_IMPORTED_MODULE_2__.interval)(period, scheduler));
}
//# sourceMappingURL=sampleTime.js.map

/***/ }),
/* 188 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scan": () => (/* binding */ scan)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _scanInternals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(132);


function scan(accumulator, seed) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)((0,_scanInternals__WEBPACK_IMPORTED_MODULE_1__.scanInternals)(accumulator, seed, arguments.length >= 2, true));
}
//# sourceMappingURL=scan.js.map

/***/ }),
/* 189 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sequenceEqual": () => (/* binding */ sequenceEqual)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function sequenceEqual(compareTo, comparator) {
    if (comparator === void 0) { comparator = function (a, b) { return a === b; }; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var aState = createState();
        var bState = createState();
        var emit = function (isEqual) {
            subscriber.next(isEqual);
            subscriber.complete();
        };
        var createSubscriber = function (selfState, otherState) {
            var sequenceEqualSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (a) {
                var buffer = otherState.buffer, complete = otherState.complete;
                if (buffer.length === 0) {
                    complete ? emit(false) : selfState.buffer.push(a);
                }
                else {
                    !comparator(a, buffer.shift()) && emit(false);
                }
            }, undefined, function () {
                selfState.complete = true;
                var complete = otherState.complete, buffer = otherState.buffer;
                complete && emit(buffer.length === 0);
                sequenceEqualSubscriber === null || sequenceEqualSubscriber === void 0 ? void 0 : sequenceEqualSubscriber.unsubscribe();
            });
            return sequenceEqualSubscriber;
        };
        source.subscribe(createSubscriber(aState, bState));
        compareTo.subscribe(createSubscriber(bState, aState));
    });
}
function createState() {
    return {
        buffer: [],
        complete: false,
    };
}
//# sourceMappingURL=sequenceEqual.js.map

/***/ }),
/* 190 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "share": () => (/* binding */ share)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(28);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);



function share(options) {
    options = options || {};
    var _a = options.connector, connector = _a === void 0 ? function () { return new _Subject__WEBPACK_IMPORTED_MODULE_0__.Subject(); } : _a, _b = options.resetOnComplete, resetOnComplete = _b === void 0 ? true : _b, _c = options.resetOnError, resetOnError = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
    var connection = null;
    var subject = null;
    var refCount = 0;
    var hasCompleted = false;
    var hasErrored = false;
    var reset = function () {
        connection = subject = null;
        hasCompleted = hasErrored = false;
    };
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
        refCount++;
        if (!subject) {
            subject = connector();
        }
        var castSubscription = subject.subscribe(subscriber);
        if (!connection) {
            connection = (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.from)(source).subscribe({
                next: function (value) { return subject.next(value); },
                error: function (err) {
                    hasErrored = true;
                    var dest = subject;
                    if (resetOnError) {
                        reset();
                    }
                    dest.error(err);
                },
                complete: function () {
                    hasCompleted = true;
                    var dest = subject;
                    if (resetOnComplete) {
                        reset();
                    }
                    dest.complete();
                },
            });
        }
        return function () {
            refCount--;
            castSubscription.unsubscribe();
            if (!refCount && resetOnRefCountZero && !hasErrored && !hasCompleted) {
                var conn = connection;
                reset();
                conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
            }
        };
    });
}
//# sourceMappingURL=share.js.map

/***/ }),
/* 191 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shareReplay": () => (/* binding */ shareReplay)
/* harmony export */ });
/* harmony import */ var _ReplaySubject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(31);
/* harmony import */ var _share__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(190);


function shareReplay(configOrBufferSize, windowTime, scheduler) {
    var _a, _b;
    var bufferSize;
    var refCount = false;
    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
        bufferSize = (_a = configOrBufferSize.bufferSize) !== null && _a !== void 0 ? _a : Infinity;
        windowTime = (_b = configOrBufferSize.windowTime) !== null && _b !== void 0 ? _b : Infinity;
        refCount = !!configOrBufferSize.refCount;
        scheduler = configOrBufferSize.scheduler;
    }
    else {
        bufferSize = configOrBufferSize !== null && configOrBufferSize !== void 0 ? configOrBufferSize : Infinity;
    }
    return (0,_share__WEBPACK_IMPORTED_MODULE_0__.share)({
        connector: function () { return new _ReplaySubject__WEBPACK_IMPORTED_MODULE_1__.ReplaySubject(bufferSize, windowTime, scheduler); },
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: refCount
    });
}
//# sourceMappingURL=shareReplay.js.map

/***/ }),
/* 192 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "single": () => (/* binding */ single)
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(76);
/* harmony import */ var _util_SequenceError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(80);
/* harmony import */ var _util_NotFoundError__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(79);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);





function single(predicate) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        var singleValue;
        var seenValue = false;
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            seenValue = true;
            if (!predicate || predicate(value, index++, source)) {
                hasValue && subscriber.error(new _util_SequenceError__WEBPACK_IMPORTED_MODULE_2__.SequenceError('Too many matching values'));
                hasValue = true;
                singleValue = value;
            }
        }, undefined, function () {
            if (hasValue) {
                subscriber.next(singleValue);
                subscriber.complete();
            }
            else {
                subscriber.error(seenValue ? new _util_NotFoundError__WEBPACK_IMPORTED_MODULE_3__.NotFoundError('No matching values') : new _util_EmptyError__WEBPACK_IMPORTED_MODULE_4__.EmptyError());
            }
        }));
    });
}
//# sourceMappingURL=single.js.map

/***/ }),
/* 193 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skip": () => (/* binding */ skip)
/* harmony export */ });
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(113);

function skip(count) {
    return (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(function (_, index) { return count <= index; });
}
//# sourceMappingURL=skip.js.map

/***/ }),
/* 194 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skipLast": () => (/* binding */ skipLast)
/* harmony export */ });
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);



function skipLast(skipCount) {
    return skipCount <= 0
        ? _util_identity__WEBPACK_IMPORTED_MODULE_0__.identity
        : (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
            var ring = new Array(skipCount);
            var count = 0;
            source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
                var currentCount = count++;
                if (currentCount < skipCount) {
                    ring[currentCount] = value;
                }
                else {
                    var index = currentCount % skipCount;
                    var oldValue = ring[index];
                    ring[index] = value;
                    subscriber.next(oldValue);
                }
            }, undefined, undefined, function () {
                return (ring = null);
            }));
        });
}
//# sourceMappingURL=skipLast.js.map

/***/ }),
/* 195 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skipUntil": () => (/* binding */ skipUntil)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(58);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(15);




function skipUntil(notifier) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var taking = false;
        var skipSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function () {
            skipSubscriber === null || skipSubscriber === void 0 ? void 0 : skipSubscriber.unsubscribe();
            taking = true;
        }, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_2__.noop);
        (0,_observable_from__WEBPACK_IMPORTED_MODULE_3__.innerFrom)(notifier).subscribe(skipSubscriber);
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) { return taking && subscriber.next(value); }));
    });
}
//# sourceMappingURL=skipUntil.js.map

/***/ }),
/* 196 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skipWhile": () => (/* binding */ skipWhile)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function skipWhile(predicate) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var taking = false;
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) { return (taking || (taking = !predicate(value, index++))) && subscriber.next(value); }));
    });
}
//# sourceMappingURL=skipWhile.js.map

/***/ }),
/* 197 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "startWith": () => (/* binding */ startWith)
/* harmony export */ });
/* harmony import */ var _observable_concat__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(92);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);



function startWith() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    var scheduler = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(values);
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
        (scheduler ? (0,_observable_concat__WEBPACK_IMPORTED_MODULE_2__.concat)(values, source, scheduler) : (0,_observable_concat__WEBPACK_IMPORTED_MODULE_2__.concat)(values, source)).subscribe(subscriber);
    });
}
//# sourceMappingURL=startWith.js.map

/***/ }),
/* 198 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchAll": () => (/* binding */ switchAll)
/* harmony export */ });
/* harmony import */ var _switchMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(199);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(20);


function switchAll() {
    return (0,_switchMap__WEBPACK_IMPORTED_MODULE_0__.switchMap)(_util_identity__WEBPACK_IMPORTED_MODULE_1__.identity);
}
//# sourceMappingURL=switchAll.js.map

/***/ }),
/* 199 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchMap": () => (/* binding */ switchMap)
/* harmony export */ });
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);



function switchMap(project, resultSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var innerSubscriber = null;
        var index = 0;
        var isComplete = false;
        var checkComplete = function () { return isComplete && !innerSubscriber && subscriber.complete(); };
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            innerSubscriber === null || innerSubscriber === void 0 ? void 0 : innerSubscriber.unsubscribe();
            var innerIndex = 0;
            var outerIndex = index++;
            (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(project(value, outerIndex)).subscribe((innerSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (innerValue) { return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue); }, undefined, function () {
                innerSubscriber = null;
                checkComplete();
            })));
        }, undefined, function () {
            isComplete = true;
            checkComplete();
        }));
    });
}
//# sourceMappingURL=switchMap.js.map

/***/ }),
/* 200 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchMapTo": () => (/* binding */ switchMapTo)
/* harmony export */ });
/* harmony import */ var _switchMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(199);

function switchMapTo(innerObservable, resultSelector) {
    return resultSelector ? (0,_switchMap__WEBPACK_IMPORTED_MODULE_0__.switchMap)(function () { return innerObservable; }, resultSelector) : (0,_switchMap__WEBPACK_IMPORTED_MODULE_0__.switchMap)(function () { return innerObservable; });
}
//# sourceMappingURL=switchMapTo.js.map

/***/ }),
/* 201 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchScan": () => (/* binding */ switchScan)
/* harmony export */ });
/* harmony import */ var _switchMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(199);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);


function switchScan(accumulator, seed) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var state = seed;
        (0,_switchMap__WEBPACK_IMPORTED_MODULE_1__.switchMap)(function (value, index) { return accumulator(state, value, index); }, function (_, innerValue) { return ((state = innerValue), innerValue); })(source).subscribe(subscriber);
        return function () {
            state = null;
        };
    });
}
//# sourceMappingURL=switchScan.js.map

/***/ }),
/* 202 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "takeUntil": () => (/* binding */ takeUntil)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(15);




function takeUntil(notifier) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(notifier).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function () { return subscriber.complete(); }, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_3__.noop));
        !subscriber.closed && source.subscribe(subscriber);
    });
}
//# sourceMappingURL=takeUntil.js.map

/***/ }),
/* 203 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "takeWhile": () => (/* binding */ takeWhile)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);


function takeWhile(predicate, inclusive) {
    if (inclusive === void 0) { inclusive = false; }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var index = 0;
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_1__.OperatorSubscriber(subscriber, function (value) {
            var result = predicate(value, index++);
            (result || inclusive) && subscriber.next(value);
            !result && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=takeWhile.js.map

/***/ }),
/* 204 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "tap": () => (/* binding */ tap)
/* harmony export */ });
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(9);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(20);




function tap(observerOrNext, error, complete) {
    var tapObserver = (0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(observerOrNext) || error || complete ? { next: observerOrNext, error: error, complete: complete } : observerOrNext;
    return tapObserver
        ? (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
            source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
                var _a;
                (_a = tapObserver.next) === null || _a === void 0 ? void 0 : _a.call(tapObserver, value);
                subscriber.next(value);
            }, function (err) {
                var _a;
                (_a = tapObserver.error) === null || _a === void 0 ? void 0 : _a.call(tapObserver, err);
                subscriber.error(err);
            }, function () {
                var _a;
                (_a = tapObserver.complete) === null || _a === void 0 ? void 0 : _a.call(tapObserver);
                subscriber.complete();
            }));
        })
        :
            _util_identity__WEBPACK_IMPORTED_MODULE_3__.identity;
}
//# sourceMappingURL=tap.js.map

/***/ }),
/* 205 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultThrottleConfig": () => (/* binding */ defaultThrottleConfig),
/* harmony export */   "throttle": () => (/* binding */ throttle)
/* harmony export */ });
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);



var defaultThrottleConfig = {
    leading: true,
    trailing: false,
};
function throttle(durationSelector, _a) {
    var _b = _a === void 0 ? defaultThrottleConfig : _a, leading = _b.leading, trailing = _b.trailing;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var hasValue = false;
        var sendValue = null;
        var throttled = null;
        var isComplete = false;
        var endThrottling = function () {
            throttled === null || throttled === void 0 ? void 0 : throttled.unsubscribe();
            throttled = null;
            if (trailing) {
                send();
                isComplete && subscriber.complete();
            }
        };
        var cleanupThrottling = function () {
            throttled = null;
            isComplete && subscriber.complete();
        };
        var startThrottle = function (value) {
            return (throttled = (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(durationSelector(value)).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, endThrottling, undefined, cleanupThrottling)));
        };
        var send = function () {
            if (hasValue) {
                subscriber.next(sendValue);
                !isComplete && startThrottle(sendValue);
            }
            hasValue = false;
            sendValue = null;
        };
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
            hasValue = true;
            sendValue = value;
            !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
        }, undefined, function () {
            isComplete = true;
            !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
        }));
    });
}
//# sourceMappingURL=throttle.js.map

/***/ }),
/* 206 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throttleTime": () => (/* binding */ throttleTime)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _throttle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(205);
/* harmony import */ var _observable_timer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(105);



function throttleTime(duration, scheduler, config) {
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.asyncScheduler; }
    if (config === void 0) { config = _throttle__WEBPACK_IMPORTED_MODULE_1__.defaultThrottleConfig; }
    var duration$ = (0,_observable_timer__WEBPACK_IMPORTED_MODULE_2__.timer)(duration, scheduler);
    return (0,_throttle__WEBPACK_IMPORTED_MODULE_1__.throttle)(function () { return duration$; }, config);
}
//# sourceMappingURL=throttleTime.js.map

/***/ }),
/* 207 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timeInterval": () => (/* binding */ timeInterval),
/* harmony export */   "TimeInterval": () => (/* binding */ TimeInterval)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _scan__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(188);
/* harmony import */ var _observable_defer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(98);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(86);




function timeInterval(scheduler) {
    if (scheduler === void 0) { scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async; }
    return function (source) { return (0,_observable_defer__WEBPACK_IMPORTED_MODULE_1__.defer)(function () {
        return source.pipe((0,_scan__WEBPACK_IMPORTED_MODULE_2__.scan)(function (_a, value) {
            var current = _a.current;
            return ({ value: value, current: scheduler.now(), last: current });
        }, { current: scheduler.now(), value: undefined, last: undefined }), (0,_map__WEBPACK_IMPORTED_MODULE_3__.map)(function (_a) {
            var current = _a.current, last = _a.last, value = _a.value;
            return new TimeInterval(value, current - last);
        }));
    }); };
}
var TimeInterval = (function () {
    function TimeInterval(value, interval) {
        this.value = value;
        this.interval = interval;
    }
    return TimeInterval;
}());

//# sourceMappingURL=timeInterval.js.map

/***/ }),
/* 208 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timeoutWith": () => (/* binding */ timeoutWith)
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(44);
/* harmony import */ var _util_isDate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82);
/* harmony import */ var _timeout__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(81);



function timeoutWith(due, withObservable, scheduler) {
    var first;
    var each;
    var _with;
    scheduler = scheduler !== null && scheduler !== void 0 ? scheduler : _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    if ((0,_util_isDate__WEBPACK_IMPORTED_MODULE_1__.isValidDate)(due)) {
        first = due;
    }
    else if (typeof due === 'number') {
        each = due;
    }
    if (withObservable) {
        _with = function () { return withObservable; };
    }
    else {
        throw new TypeError('No observable provided to switch to');
    }
    if (first == null && each == null) {
        throw new TypeError('No timeout provided.');
    }
    return (0,_timeout__WEBPACK_IMPORTED_MODULE_2__.timeout)({
        first: first,
        each: each,
        scheduler: scheduler,
        with: _with,
    });
}
//# sourceMappingURL=timeoutWith.js.map

/***/ }),
/* 209 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timestamp": () => (/* binding */ timestamp)
/* harmony export */ });
/* harmony import */ var _scheduler_dateTimestampProvider__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(32);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);


function timestamp(timestampProvider) {
    if (timestampProvider === void 0) { timestampProvider = _scheduler_dateTimestampProvider__WEBPACK_IMPORTED_MODULE_0__.dateTimestampProvider; }
    return (0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (value) { return ({ value: value, timestamp: timestampProvider.now() }); });
}
//# sourceMappingURL=timestamp.js.map

/***/ }),
/* 210 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "window": () => (/* binding */ window)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);



function window(windowBoundaries) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var windowSubject = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
        subscriber.next(windowSubject.asObservable());
        var windowSubscribe = function (sourceOrNotifier, next) {
            return sourceOrNotifier.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, next, function (err) {
                windowSubject.error(err);
                subscriber.error(err);
            }, function () {
                windowSubject.complete();
                subscriber.complete();
            }));
        };
        windowSubscribe(source, function (value) { return windowSubject.next(value); });
        windowSubscribe(windowBoundaries, function () {
            windowSubject.complete();
            subscriber.next((windowSubject = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject()));
        });
        return function () {
            windowSubject.unsubscribe();
            windowSubject = null;
        };
    });
}
//# sourceMappingURL=window.js.map

/***/ }),
/* 211 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowCount": () => (/* binding */ windowCount)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);




function windowCount(windowSize, startWindowEvery) {
    if (startWindowEvery === void 0) { startWindowEvery = 0; }
    var startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var windows = [new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject()];
        var starts = [];
        var count = 0;
        subscriber.next(windows[0].asObservable());
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            try {
                for (var windows_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_3__.__values)(windows), windows_1_1 = windows_1.next(); !windows_1_1.done; windows_1_1 = windows_1.next()) {
                    var window_1 = windows_1_1.value;
                    window_1.next(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (windows_1_1 && !windows_1_1.done && (_a = windows_1.return)) _a.call(windows_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            var c = count - windowSize + 1;
            if (c >= 0 && c % startEvery === 0) {
                windows.shift().complete();
            }
            if (++count % startEvery === 0) {
                var window_2 = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
                windows.push(window_2);
                subscriber.next(window_2.asObservable());
            }
        }, function (err) {
            while (windows.length > 0) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        }, function () {
            while (windows.length > 0) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, function () {
            starts = null;
            windows = null;
        }));
    });
}
//# sourceMappingURL=windowCount.js.map

/***/ }),
/* 212 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowTime": () => (/* binding */ windowTime)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(28);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(44);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(22);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);







function windowTime(windowTimeSpan) {
    var _a, _b;
    var otherArgs = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        otherArgs[_i - 1] = arguments[_i];
    }
    var scheduler = (_a = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popScheduler)(otherArgs)) !== null && _a !== void 0 ? _a : _scheduler_async__WEBPACK_IMPORTED_MODULE_1__.asyncScheduler;
    var windowCreationInterval = (_b = otherArgs[0]) !== null && _b !== void 0 ? _b : null;
    var maxWindowSize = otherArgs[1] || Infinity;
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_2__.operate)(function (source, subscriber) {
        var windowRecords = [];
        var restartOnClose = false;
        var closeWindow = function (record) {
            var window = record.window, subs = record.subs;
            window.complete();
            subs.unsubscribe();
            (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_3__.arrRemove)(windowRecords, record);
            restartOnClose && startWindow();
        };
        var startWindow = function () {
            if (windowRecords) {
                var subs = new _Subscription__WEBPACK_IMPORTED_MODULE_4__.Subscription();
                subscriber.add(subs);
                var window_1 = new _Subject__WEBPACK_IMPORTED_MODULE_5__.Subject();
                var record_1 = {
                    window: window_1,
                    subs: subs,
                    seen: 0,
                };
                windowRecords.push(record_1);
                subscriber.next(window_1.asObservable());
                subs.add(scheduler.schedule(function () { return closeWindow(record_1); }, windowTimeSpan));
            }
        };
        windowCreationInterval !== null && windowCreationInterval >= 0
            ?
                subscriber.add(scheduler.schedule(function () {
                    startWindow();
                    !this.closed && subscriber.add(this.schedule(null, windowCreationInterval));
                }, windowCreationInterval))
            : (restartOnClose = true);
        startWindow();
        var loop = function (cb) { return windowRecords.slice().forEach(cb); };
        var terminate = function (cb) {
            loop(function (_a) {
                var window = _a.window;
                return cb(window);
            });
            cb(subscriber);
            subscriber.unsubscribe();
        };
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_6__.OperatorSubscriber(subscriber, function (value) {
            loop(function (record) {
                record.window.next(value);
                maxWindowSize <= ++record.seen && closeWindow(record);
            });
        }, function (err) { return terminate(function (consumer) { return consumer.error(err); }); }, function () { return terminate(function (consumer) { return consumer.complete(); }); }));
        return function () {
            windowRecords = null;
        };
    });
}
//# sourceMappingURL=windowTime.js.map

/***/ }),
/* 213 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowToggle": () => (/* binding */ windowToggle)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(7);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(28);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(8);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(15);
/* harmony import */ var _util_arrRemove__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(12);








function windowToggle(openings, closingSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var windows = [];
        var handleError = function (err) {
            while (0 < windows.length) {
                windows.shift().error(err);
            }
            subscriber.error(err);
        };
        (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(openings).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (openValue) {
            var window = new _Subject__WEBPACK_IMPORTED_MODULE_3__.Subject();
            windows.push(window);
            var closingSubscription = new _Subscription__WEBPACK_IMPORTED_MODULE_4__.Subscription();
            var closeWindow = function () {
                (0,_util_arrRemove__WEBPACK_IMPORTED_MODULE_5__.arrRemove)(windows, window);
                window.complete();
                closingSubscription.unsubscribe();
            };
            var closingNotifier;
            try {
                closingNotifier = (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.innerFrom)(closingSelector(openValue));
            }
            catch (err) {
                handleError(err);
                return;
            }
            subscriber.next(window.asObservable());
            closingSubscription.add(closingNotifier.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, closeWindow, handleError, _util_noop__WEBPACK_IMPORTED_MODULE_6__.noop)));
        }, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_6__.noop));
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_2__.OperatorSubscriber(subscriber, function (value) {
            var e_1, _a;
            var windowsCopy = windows.slice();
            try {
                for (var windowsCopy_1 = (0,tslib__WEBPACK_IMPORTED_MODULE_7__.__values)(windowsCopy), windowsCopy_1_1 = windowsCopy_1.next(); !windowsCopy_1_1.done; windowsCopy_1_1 = windowsCopy_1.next()) {
                    var window_1 = windowsCopy_1_1.value;
                    window_1.next(value);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (windowsCopy_1_1 && !windowsCopy_1_1.done && (_a = windowsCopy_1.return)) _a.call(windowsCopy_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }, handleError, function () {
            while (0 < windows.length) {
                windows.shift().complete();
            }
            subscriber.complete();
        }, function () {
            while (0 < windows.length) {
                windows.shift().unsubscribe();
            }
        }));
    });
}
//# sourceMappingURL=windowToggle.js.map

/***/ }),
/* 214 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowWhen": () => (/* binding */ windowWhen)
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);




function windowWhen(closingSelector) {
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        var window;
        var closingSubscriber;
        var handleError = function (err) {
            window.error(err);
            subscriber.error(err);
        };
        var openWindow = function () {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window === null || window === void 0 ? void 0 : window.complete();
            window = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
            subscriber.next(window.asObservable());
            var closingNotifier;
            try {
                closingNotifier = (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(closingSelector());
            }
            catch (err) {
                handleError(err);
                return;
            }
            closingNotifier.subscribe((closingSubscriber = new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, openWindow, handleError, openWindow)));
        };
        openWindow();
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, function (value) { return window.next(value); }, handleError, function () {
            window.complete();
            subscriber.complete();
        }, function () {
            closingSubscriber === null || closingSubscriber === void 0 ? void 0 : closingSubscriber.unsubscribe();
            window = null;
        }));
    });
}
//# sourceMappingURL=windowWhen.js.map

/***/ }),
/* 215 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "withLatestFrom": () => (/* binding */ withLatestFrom)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(7);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(58);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(20);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(15);
/* harmony import */ var _util_args__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(54);







function withLatestFrom() {
    var inputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        inputs[_i] = arguments[_i];
    }
    var project = (0,_util_args__WEBPACK_IMPORTED_MODULE_0__.popResultSelector)(inputs);
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_1__.operate)(function (source, subscriber) {
        var len = inputs.length;
        var otherValues = new Array(len);
        var hasValue = inputs.map(function () { return false; });
        var ready = false;
        var _loop_1 = function (i) {
            (0,_observable_from__WEBPACK_IMPORTED_MODULE_2__.innerFrom)(inputs[i]).subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, function (value) {
                otherValues[i] = value;
                if (!ready && !hasValue[i]) {
                    hasValue[i] = true;
                    (ready = hasValue.every(_util_identity__WEBPACK_IMPORTED_MODULE_4__.identity)) && (hasValue = null);
                }
            }, undefined, _util_noop__WEBPACK_IMPORTED_MODULE_5__.noop));
        };
        for (var i = 0; i < len; i++) {
            _loop_1(i);
        }
        source.subscribe(new _OperatorSubscriber__WEBPACK_IMPORTED_MODULE_3__.OperatorSubscriber(subscriber, function (value) {
            if (ready) {
                var values = (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__spread)([value], otherValues);
                subscriber.next(project ? project.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_6__.__spread)(values)) : values);
            }
        }));
    });
}
//# sourceMappingURL=withLatestFrom.js.map

/***/ }),
/* 216 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "zip": () => (/* binding */ zip),
/* harmony export */   "zipWith": () => (/* binding */ zipWith)
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _observable_zip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(118);
/* harmony import */ var _util_lift__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);



function zip() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    return (0,_util_lift__WEBPACK_IMPORTED_MODULE_0__.operate)(function (source, subscriber) {
        _observable_zip__WEBPACK_IMPORTED_MODULE_1__.zip.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)([source], sources)).subscribe(subscriber);
    });
}
function zipWith() {
    var otherInputs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        otherInputs[_i] = arguments[_i];
    }
    return zip.apply(void 0, (0,tslib__WEBPACK_IMPORTED_MODULE_2__.__spread)(otherInputs));
}
//# sourceMappingURL=zipWith.js.map

/***/ }),
/* 217 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "zipAll": () => (/* binding */ zipAll)
/* harmony export */ });
/* harmony import */ var _observable_zip__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(118);
/* harmony import */ var _joinAllInternals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(129);


function zipAll(project) {
    return (0,_joinAllInternals__WEBPACK_IMPORTED_MODULE_0__.joinAllInternals)(_observable_zip__WEBPACK_IMPORTED_MODULE_1__.zip, project);
}
//# sourceMappingURL=zipAll.js.map

/***/ }),
/* 218 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(219), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1, globals) {
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
            const getterPromise = new Promise((resolve, reject) => {
                this.GetChannelPage(roomId).then(channelPage => {
                    const fkeyElement = $(channelPage).filter('#fkey');
                    if (!fkeyElement.length)
                        reject('Could not find fkey');
                    const fkey = fkeyElement.val();
                    resolve(fkey);
                });
            });
            const expiryDate = ChatApi.GetExpiryDate();
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(globals.CacheChatApiFkey, () => getterPromise, expiryDate);
        }
        GetChatUserId() {
            return StackExchange.options.user.userId;
        }
        SendMessage(roomId, message) {
            return new Promise((resolve, reject) => {
                const requestFunc = async () => {
                    const fkeyPromise = this.GetChannelFKey(roomId);
                    const fKey = await fkeyPromise;
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                        onload: (response_1) => {
                            response_1.status === 200 ? resolve() : onFailure(response_1.statusText);
                        },
                        onerror: (response_3) => {
                            onFailure(response_3);
                        },
                    });
                };
                let numTries = 0;
                const onFailure = (errorMessage) => {
                    numTries++;
                    if (numTries < 3) {
                        const fkeyCacheKey = 'StackExchange.ChatApi.FKey';
                        GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(fkeyCacheKey);
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
/* 219 */
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
/* 220 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(0)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, AdvancedFlagging_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.showConfirmModal = exports.Delay = exports.showMSTokenPopupAndGet = exports.inlineCheckboxesWrapper = exports.overlayModal = exports.configurationLink = exports.configurationDiv = exports.advancedFlaggingLink = exports.gridCellDiv = exports.plainDiv = exports.dropdownItem = exports.reportLink = exports.popoverArrow = exports.dropDown = exports.popupWrapper = exports.getConfigHtml = exports.getOptionLabel = exports.getCategoryDiv = exports.getOptionBox = exports.getDivider = exports.getSectionWrapper = exports.getMessageDiv = exports.getSmokeyIcon = exports.getGuttenbergIcon = exports.getNattyIcon = exports.getReportedIcon = exports.getPerformedActionIcon = exports.displayError = exports.displaySuccess = exports.showInlineElement = exports.hideElement = exports.showElement = exports.getFlagsUrlRegex = exports.isDeleteVoteRegex = exports.isReviewItemRegex = exports.popupDelay = exports.displayStacksToast = exports.settingUpBody = exports.settingUpTitle = exports.MetaSmokeDisabledConfig = exports.MetaSmokeUserKeyConfig = exports.CacheChatApiFkey = exports.ConfigurationLinkDisabled = exports.ConfigurationEnabledFlags = exports.ConfigurationWatchQueues = exports.ConfigurationWatchFlags = exports.ConfigurationDefaultNoComment = exports.ConfigurationDefaultNoFlag = exports.ConfigurationOpenOnHover = exports.nattyFeedbackUrl = exports.genericBotKey = exports.copyPastorServer = exports.copyPastorKey = exports.metaSmokeKey = exports.soboticsRoomId = void 0;
    exports.soboticsRoomId = 111347;
    exports.metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
    exports.copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
    exports.copyPastorServer = 'https://copypastor.sobotics.org';
    exports.genericBotKey = 'Cm45BSrt51FR3ju';
    exports.nattyFeedbackUrl = 'https://logs.sobotics.org/napi/api/feedback';
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
    const getPerformedActionIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.CheckmarkSm().addClass('fc-green-500'));
    exports.getPerformedActionIcon = getPerformedActionIcon;
    const getReportedIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.Flag().addClass('fc-red-500'));
    exports.getReportedIcon = getReportedIcon;
    const sampleIconClass = $('<div>').attr('class', 'advanced-flagging-icon bg-cover c-pointer w16 h16 d-none m4');
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
                resolve(token);
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
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 221 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, sotools_1, globals) {
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
        async ReportLooksFine() {
            return false;
        }
        async ReportNeedsEditing() {
            return false;
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
            const promise = new Promise((resolve, reject) => {
                if (!sotools_1.IsStackOverflow() || !$('#answer-' + this.answerId + ' .js-post-body').length) {
                    resolve(false);
                }
                if (!$('.top-bar .my-profile .gravatar-wrapper-24').length) {
                    reject('Flag Tracker: Could not find username.');
                }
                const flaggerName = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
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
            return promise;
        }
    }
    exports.GenericBotAPI = GenericBotAPI;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 222 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(119), __webpack_require__(219), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1, GreaseMonkeyCache_1, globals) {
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
            MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
        }
        static QueryMetaSmoke(postId, postType) {
            if (this.pendingTimeout)
                clearTimeout(this.pendingTimeout);
            this.pendingPosts.push({ postId, postType });
            this.pendingTimeout = window.setTimeout(MetaSmokeAPI.QueryMetaSmokeInternal, 1000);
        }
        static QueryMetaSmokeInternal() {
            const pendingPostLookup = {};
            const urls = [];
            for (const pendingPost of MetaSmokeAPI.pendingPosts) {
                const url = MetaSmokeAPI.GetQueryUrl(pendingPost.postId, pendingPost.postType);
                pendingPostLookup[url] = { postId: pendingPost.postId, postType: pendingPost.postType };
                urls.push(url);
            }
            MetaSmokeAPI.pendingPosts = [];
            const urlStr = urls.join();
            const isDisabled = MetaSmokeAPI.IsDisabled();
            if (isDisabled)
                return;
            $.ajax({
                type: 'GET',
                url: 'https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls',
                data: {
                    urls: urlStr,
                    key: `${MetaSmokeAPI.appKey}`
                }
            }).done((metaSmokeResult) => {
                for (const item of metaSmokeResult.items) {
                    const pendingPost = pendingPostLookup[item.link];
                    if (!pendingPost)
                        continue;
                    const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                    const obs = MetaSmokeAPI.ObservableLookup[key];
                    if (obs)
                        obs.next(item.id);
                    delete pendingPostLookup[item.link];
                }
                for (const url in pendingPostLookup) {
                    if (!Object.prototype.hasOwnProperty.call(pendingPostLookup, url))
                        return;
                    const pendingPost = pendingPostLookup[url];
                    const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                    const obs = MetaSmokeAPI.ObservableLookup[key];
                    if (obs)
                        obs.next(null);
                }
            }).fail(error => {
                for (const url in pendingPostLookup) {
                    if (!Object.prototype.hasOwnProperty.call(pendingPostLookup, url))
                        return;
                    const pendingPost = pendingPostLookup[url];
                    const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                    const obs = MetaSmokeAPI.ObservableLookup[key];
                    if (obs)
                        obs.error(error);
                }
            });
        }
        static GetQueryUrl(postId, postType) {
            return `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}`;
        }
        static async GetSmokeyId(postId, postType) {
            const observableKey = this.GetObservableKey(postId, postType);
            const observable = MetaSmokeAPI.ObservableLookup[observableKey];
            if (observable) {
                return await rxjs_1.firstValueFrom(observable.pipe(operators_1.take(1)));
            }
            return 0;
        }
        static GetObservableKey(postId, postType) {
            return JSON.stringify({ postId, postType });
        }
        static getUserKey() {
            // eslint-disable-next-line no-async-promise-executor
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(globals.MetaSmokeUserKeyConfig, () => new Promise(async (resolve, reject) => {
                let prom = MetaSmokeAPI.actualPromise;
                if (!prom) {
                    prom = MetaSmokeAPI.codeGetter(`https://metasmoke.erwaysoftware.com/oauth/request?key=${MetaSmokeAPI.appKey}`);
                    MetaSmokeAPI.actualPromise = prom;
                }
                const code = await prom;
                if (code) {
                    $.ajax({
                        url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeAPI.appKey + '&code=' + code,
                        method: 'GET'
                    }).done(data => resolve(data.token))
                        .fail(err => reject(err));
                }
            }));
        }
        Watch(postId, postType) {
            const key = MetaSmokeAPI.GetObservableKey(postId, postType);
            if (!MetaSmokeAPI.ObservableLookup[key]) {
                const replaySubject = new rxjs_1.ReplaySubject(1);
                MetaSmokeAPI.ObservableLookup[key] = replaySubject;
            }
            MetaSmokeAPI.QueryMetaSmoke(postId, postType);
            return MetaSmokeAPI.ObservableLookup[key];
        }
        async ReportNaa(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'naa-');
                return true;
            }
            return false;
        }
        async ReportRedFlag(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'tpu-');
                return true;
            }
            else {
                const urlStr = `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'q'}/${postId}`;
                // eslint-disable-next-line no-async-promise-executor
                const promise = new Promise(async (resolve, reject) => {
                    const userKey = await MetaSmokeAPI.getUserKey();
                    if (!userKey)
                        return;
                    $.ajax({
                        type: 'POST',
                        url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                        data: {
                            post_link: urlStr,
                            key: MetaSmokeAPI.appKey,
                            token: userKey
                        }
                    }).done(() => resolve(true))
                        .fail(() => reject());
                });
                const result = await promise;
                await globals.Delay(1000);
                MetaSmokeAPI.QueryMetaSmoke(postId, postType);
                return result;
            }
        }
        async ReportLooksFine(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'fp-');
                return true;
            }
            return false;
        }
        async ReportNeedsEditing(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'fp-');
                return true;
            }
            return false;
        }
        async ReportVandalism(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid) {
                await this.SendFeedback(smokeyid, 'tp-');
                return true;
            }
            return false;
        }
        SendFeedback(metaSmokeId, feedbackType) {
            return new Promise((resolve, reject) => {
                MetaSmokeAPI.getUserKey().then((userKey) => {
                    $.ajax({
                        type: 'POST',
                        url: `https://metasmoke.erwaysoftware.com/api/w/post/${metaSmokeId}/feedback`,
                        data: {
                            type: feedbackType,
                            key: MetaSmokeAPI.appKey,
                            token: userKey
                        }
                    }).done(() => resolve())
                        .fail(() => reject());
                });
            });
        }
    }
    exports.MetaSmokeAPI = MetaSmokeAPI;
    MetaSmokeAPI.ObservableLookup = {};
    MetaSmokeAPI.pendingPosts = [];
    MetaSmokeAPI.pendingTimeout = null;
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
        const returnCode = await new Promise((resolve) => {
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
/* 223 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(119), __webpack_require__(218), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1, ChatApi_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.CopyPastorAPI = void 0;
    class CopyPastorAPI {
        constructor(answerId, key) {
            this.answerId = answerId;
            this.key = key;
            this.subject = new rxjs_1.Subject();
            this.replaySubject = new rxjs_1.ReplaySubject(1);
            this.subject.subscribe(this.replaySubject);
        }
        Watch() {
            new Promise((resolve, reject) => {
                const url = `${globals.copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${this.answerId}`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    onload: (response) => {
                        const responseObject = JSON.parse(response.responseText);
                        responseObject.status === 'success' ? resolve(responseObject.posts) : reject(responseObject.message);
                    },
                    onerror: (response) => {
                        reject(response);
                    },
                });
            })
                .then(r => this.subject.next(r))
                .catch(err => this.subject.error(err));
            return this.subject;
        }
        async Promise() {
            return await rxjs_1.firstValueFrom(this.replaySubject.pipe(operators_1.take(1)));
        }
        async ReportTruePositive() {
            return this.SendFeedback('tp');
        }
        async ReportFalsePositive() {
            return this.SendFeedback('fp');
        }
        async SendFeedback(type) {
            const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
            const chatApi = new ChatApi_1.ChatApi();
            const chatId = chatApi.GetChatUserId();
            const results = await this.Promise();
            const payloads = results.map(result => {
                const postId = result.post_id;
                const payload = {
                    post_id: postId,
                    feedback_type: type,
                    username,
                    link: `https://chat.stackoverflow.com/users/${chatId}`,
                    key: this.key,
                };
                return payload;
            });
            const promises = payloads.map(payload => {
                return new Promise((resolve, reject) => {
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
            });
            const allResults = await Promise.all(promises);
            if (!allResults.length)
                return false;
            return allResults.every(result => result);
        }
    }
    exports.CopyPastorAPI = CopyPastorAPI;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 224 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(119)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.WatchRequests = exports.WatchFlags = void 0;
    function WatchFlags() {
        return WatchRequests().pipe(operators_1.filter(request => !!(/flags\/posts\/\d+\/add\/[a-zA-Z]+/.exec(request.responseURL))));
    }
    exports.WatchFlags = WatchFlags;
    function WatchRequests() {
        const obs = new rxjs_1.Subject();
        addXHRListener((xhr) => {
            obs.next(xhr);
        });
        return obs;
    }
    exports.WatchRequests = WatchRequests;
    // Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
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
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 225 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(222), __webpack_require__(1), __webpack_require__(219), __webpack_require__(220)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, MetaSmokeAPI_1, FlagTypes_1, GreaseMonkeyCache_1, globals) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.SetupConfiguration = void 0;
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
        const configurationEnabledFlags = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags);
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
                        .map(el => Number($(el).attr('id').match(/\d+/))).sort()
                        .sort((a, b) => a - b);
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
        okayButton.click((event) => {
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
        const flagTypeIds = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(globals.ConfigurationEnabledFlags) || [];
        getFlagTypes().forEach(f => {
            const storedValue = flagTypeIds.indexOf(f.Id) > -1;
            checkboxes.push(createCheckbox(f.DisplayName, storedValue, 'flag-type-' + f.Id).children().eq(0).addClass('w25'));
        });
        return checkboxes;
    }
    function GetAdminConfigItems() {
        return [
            $('<a>').text('Clear Metasmoke Configuration').click(async () => {
                await MetaSmokeAPI_1.MetaSmokeAPI.Reset();
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
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	__webpack_require__(0);
/******/ })()
;