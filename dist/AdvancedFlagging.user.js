// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      1.3.5
// @author       Robert Rudman
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
// @require      https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_listValues
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1), __webpack_require__(2), __webpack_require__(3), __webpack_require__(207), __webpack_require__(208), __webpack_require__(209), __webpack_require__(210), __webpack_require__(211), __webpack_require__(206)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, FlagTypes_1, sotools_1, NattyApi_1, GenericBotAPI_1, MetaSmokeAPI_1, CopyPastorAPI_1, RequestWatcher_1, Configuration_1, GreaseMonkeyCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.displaySuccess = exports.ConfigurationLinkDisabled = exports.ConfigurationEnabledFlags = exports.ConfigurationDetectAudits = exports.ConfigurationWatchQueues = exports.ConfigurationWatchFlags = exports.ConfigurationDefaultNoComment = exports.ConfigurationDefaultNoFlag = exports.ConfigurationOpenOnHover = exports.metaSmokeKey = void 0;
    exports.metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
    const copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
    exports.ConfigurationOpenOnHover = 'AdvancedFlagging.Configuration.OpenOnHover';
    exports.ConfigurationDefaultNoFlag = 'AdvancedFlagging.Configuration.DefaultNoFlag';
    exports.ConfigurationDefaultNoComment = 'AdvancedFlagging.Configuration.DefaultNoComment';
    exports.ConfigurationWatchFlags = 'AdvancedFlagging.Configuration.WatchFlags';
    exports.ConfigurationWatchQueues = 'AdvancedFlagging.Configuration.WatchQueues';
    exports.ConfigurationDetectAudits = 'AdvancedFlagging.Configuration.DetectAudits';
    exports.ConfigurationEnabledFlags = 'AdvancedFlagging.Configuration.EnabledFlags';
    exports.ConfigurationLinkDisabled = 'AdvancedFlagging.Configuration.LinkDisabled';
    function SetupStyles() {
        const scriptNode = document.createElement('style');
        scriptNode.type = 'text/css';
        scriptNode.id = 'advanced-flagging-styles';
        scriptNode.textContent = `
#snackbar {
    min-width: 250px;
    margin-left: -125px;
    color: #fff;
    text-align: center;
    border-radius: 2px;
    padding: 16px;
    position: fixed;
    z-index: 2000;
    left: 50%;
    top: 30px;
    font-size: 17px;
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
    margin: 0;
    z-index: 3;
    position: absolute;
    white-space: nowrap;
    background: #FFF;
    padding: 5px;
    border: 1px solid #9fa6ad;
    box-shadow: 0 2px 4px rgba(36,39,41,0.3);
    cursor: default
}

.advanced-flagging-hr {
    margin-bottom: 10px;
    margin-top: 10px;
}

.advanced-flagging-label-options {
    margin-right: 5px;
    margin-left: 4px;
}

.advanced-flagging-icon {
    width: 15px;
    height: 15px;
    margin-left: 5px;
    margin-top: 5px;
    vertical-align: text-bottom;
    cursor: pointer;
    background-size: 100%;
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

.advanced-flagging-dropdown-item {
    padding: 1px 5px;
}

.advanced-flagging-danger-item {
    background-color: rgba(241, 148, 148, 0.6);
}

.advanced-flagging-report-link {
    display: inline-block;
    margin-top: 5px;
    width: auto;
}

.advanced-flagging-performed-action {
    background-position: -20px -320px;
    visibility: visible;
    width: 15px;
    height: 15px;
    cursor: default;
}

.advanced-flagging-flag-icon {
    color: #C91D2E;
    cursor: default;
}
`;
        const target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        target.appendChild(scriptNode);
    }
    function handleFlagAndComment(postId, flag, flagRequired, commentText, copyPastorPromise) {
        const result = {};
        if (commentText) {
            result.CommentPromise = new Promise((resolve, reject) => {
                $.ajax({
                    url: `/posts/${postId}/comments`,
                    type: 'POST',
                    data: { fkey: StackExchange.options.user.fkey, comment: commentText }
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
                    if (flag.GetCustomFlagText && results.length > 0) {
                        return flag.GetCustomFlagText(results[0]);
                    }
                });
                autoFlagging = true;
                $.ajax({
                    url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
                    type: 'POST',
                    data: { fkey: StackExchange.options.user.fkey, otherText: flag.ReportType === 'PostOther' ? flagText : '' }
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
    const popupWrapper = $('<div>').addClass('hide').hide().attr('id', 'snackbar');
    const popupDelay = 2000;
    let toasterTimeout = null;
    let toasterFadeTimeout = null;
    function displayToaster(message, colour, textColour, duration) {
        const div = $('<div>')
            .css({
            'background-color': colour,
            'padding': '10px'
        })
            .text(message);
        if (textColour) {
            div.css('color', textColour);
        }
        popupWrapper.append(div);
        popupWrapper.removeClass('hide').addClass('show').show();
        function hidePopup() {
            popupWrapper.removeClass('show').addClass('hide');
            toasterFadeTimeout = window.setTimeout(() => {
                popupWrapper.empty().hide();
            }, 1000);
        }
        if (toasterFadeTimeout) {
            clearTimeout(toasterFadeTimeout);
        }
        if (toasterTimeout) {
            clearTimeout(toasterTimeout);
        }
        toasterTimeout = window.setTimeout(hidePopup, duration === undefined ? popupDelay : duration);
    }
    function displaySuccess(message) {
        displayToaster(message, '#00690c');
    }
    exports.displaySuccess = displaySuccess;
    function displayError(message) {
        displayToaster(message, '#ba1701');
    }
    function displaySuccessFlagged(reportedIcon, reportType) {
        reportedIcon.attr('title', `Flagged as ${reportType}`);
        reportedIcon.addClass('d-inline-block').removeClass('d-none');
        displaySuccess(`Flagged as ${reportType}`);
    }
    function displayErrorFlagged(message, error) {
        displayError(message);
        console.error(error);
    }
    async function BuildFlaggingDialog(element, postId, postType, reputation, authorName, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters, copyPastorPromise) {
        const getDivider = () => $('<hr>').attr('class', 'advanced-flagging-hr');
        const dropDown = $('<dl>').attr('class', 'advanced-flagging-dialog s-anchors s-anchors__default d-none');
        const checkboxNameComment = `comment_checkbox_${postId}`;
        const checkboxNameFlag = `flag_checkbox_${postId}`;
        const leaveCommentBox = $('<input>').attr('type', 'checkbox').attr('name', checkboxNameComment).attr('id', checkboxNameComment)
            .attr('class', 's-checkbox').wrap('<div class="grid--cell"></div>').parent();
        const flagBox = leaveCommentBox.clone().find('input').attr('name', checkboxNameFlag).attr('id', checkboxNameFlag).parent();
        flagBox.find('input').prop('checked', true);
        const isStackOverflow = sotools_1.IsStackOverflow();
        const comments = element.find('.comment-body');
        const defaultNoComment = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationDefaultNoComment);
        if (!defaultNoComment && comments.length === 0 && isStackOverflow) {
            leaveCommentBox.find('input').prop('checked', true);
        }
        const enabledFlagIds = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationEnabledFlags);
        let hasCommentOptions = false;
        let firstCategory = true;
        FlagTypes_1.flagCategories.forEach(flagCategory => {
            if (flagCategory.AppliesTo.indexOf(postType) === -1) {
                return;
            }
            const divider = getDivider();
            if (!firstCategory) {
                dropDown.append(divider);
            }
            let activeLinks = flagCategory.FlagTypes.length;
            flagCategory.FlagTypes.forEach(flagType => {
                if (flagType.GetComment) {
                    hasCommentOptions = true;
                }
                const dropdownItem = $('<dd>').attr('class', 'advanced-flagging-dropdown-item');
                if (flagCategory.IsDangerous) {
                    dropdownItem.addClass('advanced-flagging-danger-item');
                }
                const reportLink = $('<a>').attr('class', 'advanced-flagging-report-link');
                const disableLink = () => {
                    activeLinks--;
                    reportLink.addClass('d-none').removeClass('d-block');
                    if (divider && activeLinks <= 0) {
                        divider.addClass('d-none').removeClass('d-block');
                    }
                };
                const enableLink = () => {
                    activeLinks++;
                    reportLink.addClass('d-block').removeClass('d-none');
                    if (divider && activeLinks > 0) {
                        divider.addClass('d-block').removeClass('d-none');
                    }
                };
                disableLink();
                if (!enabledFlagIds || enabledFlagIds.indexOf(flagType.Id) > -1) {
                    if (flagType.Enabled) {
                        copyPastorPromise.then(items => {
                            // If it somehow changed within the promise, check again
                            if (flagType.Enabled) {
                                const hasItems = items.length > 0;
                                const isEnabled = flagType.Enabled(hasItems);
                                if (isEnabled) {
                                    enableLink();
                                }
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
                reportLink.click(() => {
                    if (!deleted) {
                        try {
                            if (!leaveCommentBox.find('input').is(':checked')) {
                                if (commentText) {
                                    // Match [some text](http://somehyperlink.com)
                                    let strippedComment = commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
                                    // Match [edit]
                                    strippedComment = strippedComment.replace(/\[([^\]]+)\][^(]*?/g, '$1');
                                    // Strip out italics. _thanks_ => thanks
                                    strippedComment = strippedComment.replace(/_([^_]+)_/g, '$1');
                                    // Strip out bolds. **thanks** => thanks
                                    strippedComment = strippedComment.replace(/\*\*([^*]+)\*\*/g, '$1');
                                    // Strip out italics. *thanks* => thanks
                                    strippedComment = strippedComment.replace(/\*([^*]+)\*/g, '$1');
                                    element.find('.comment-body .comment-copy').each((index, ele) => {
                                        const jEle = $(ele);
                                        let text = jEle.text();
                                        const fromReviewText = ' - From Review';
                                        if (text.endsWith(fromReviewText)) {
                                            text = text.substring(0, text.length - fromReviewText.length);
                                        }
                                        if (text === strippedComment) {
                                            jEle.closest('li').find('a.comment-up.comment-up-off').trigger('click');
                                        }
                                    });
                                }
                                commentText = undefined;
                            }
                            const result = handleFlagAndComment(postId, flagType, flagBox.find('input').is(':checked'), commentText, copyPastorPromise);
                            if (result.CommentPromise) {
                                result.CommentPromise.then((data) => {
                                    const commentUI = StackExchange.comments.uiForPost($('#comments-' + postId));
                                    commentUI.addShow(true, false);
                                    commentUI.showComments(data, null, false, true);
                                    $(document).trigger('comment', postId);
                                }).catch(err => {
                                    displayError('Failed to comment on post');
                                    console.error(err);
                                });
                            }
                            if (result.FlagPromise) {
                                result.FlagPromise.then(data => {
                                    const expiryDate = new Date();
                                    expiryDate.setDate(expiryDate.getDate() + 30);
                                    const responseJson = JSON.parse(JSON.stringify(data));
                                    if (responseJson.Success) {
                                        displaySuccessFlagged(reportedIcon, flagType.ReportType);
                                    }
                                    else { // sometimes, although the status is 200, the post isn't flagged.
                                        const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
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
                                        displayErrorFlagged(message, fullMessage);
                                    }
                                }).catch(err => {
                                    displayErrorFlagged('Failed to flag post', err);
                                });
                            }
                        }
                        catch (err) {
                            displayError(err);
                        }
                    }
                    const noFlag = flagType.ReportType === 'NoFlag';
                    if (noFlag) {
                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + 30);
                        performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                        performedActionIcon.addClass('d-block').removeClass('d-none');
                    }
                    handleFlag(flagType, reporters, answerTime, questionTime);
                    dropDown.removeClass('d-block').addClass('d-none');
                });
                reportLink.text(flagType.DisplayName);
                dropdownItem.append(reportLink);
                dropDown.append(dropdownItem);
            });
            firstCategory = false;
        });
        if (!isStackOverflow) {
            hasCommentOptions = false;
        }
        dropDown.append(getDivider());
        if (hasCommentOptions) {
            const commentBoxLabel = $('<label>').text('Leave comment')
                .attr('for', checkboxNameComment)
                .attr('class', 'advanced-flagging-label-options grid--cell s-label fw-normal');
            const commentingRow = $('<dd />');
            commentingRow.append(leaveCommentBox);
            commentingRow.append(commentBoxLabel);
            dropDown.append(commentingRow);
            commentingRow.children().wrapAll('<div class="grid gs8"></div>');
        }
        const flagBoxLabel = $('<label>').text('Flag')
            .attr('for', checkboxNameFlag)
            .attr('class', 'advanced-flagging-label-options grid--cell s-label fw-normal');
        const flaggingRow = $('<dd />');
        const defaultNoFlag = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationDefaultNoFlag);
        if (defaultNoFlag) {
            flagBox.find('input').prop('checked', false);
        }
        flaggingRow.append(flagBox);
        flaggingRow.append(flagBoxLabel);
        dropDown.append(flaggingRow);
        flaggingRow.children().wrapAll('<div class="grid gs8"></div>');
        return dropDown;
    }
    function handleFlag(flagType, reporters, answerTime, questionTime) {
        const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
        const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
        const customFlag = flagType.ReportType === 'PostOther';
        const noFlag = flagType.ReportType === 'NoFlag';
        for (let i = 0; i < reporters.length; i++) {
            const reporter = reporters[i];
            let promise = null;
            if (rudeFlag) {
                promise = reporter.ReportRedFlag();
            }
            else if (naaFlag) {
                promise = reporter.ReportNaa(answerTime, questionTime);
            }
            else if (noFlag) {
                switch (flagType.DisplayName) {
                    case 'Needs Editing':
                        promise = reporter.ReportNeedsEditing();
                        break;
                    case 'Vandalism':
                        promise = reporter.ReportVandalism();
                        break;
                    default:
                        promise = reporter.ReportLooksFine();
                        break;
                }
            }
            else if (customFlag) {
                switch (flagType.DisplayName) {
                    case 'Duplicate answer':
                        promise = reporter.ReportDuplicateAnswer();
                        break;
                    case 'Plagiarism':
                        promise = reporter.ReportPlagiarism();
                        break;
                    case 'Bad attribution':
                        promise = reporter.ReportPlagiarism();
                        break;
                    default:
                        throw new Error('Could not find custom flag type: ' + flagType.DisplayName);
                }
            }
            if (promise) {
                promise.then((didReport) => {
                    if (didReport) {
                        displaySuccess(`Feedback sent to ${reporter.name}`);
                    }
                }).catch(() => {
                    displayError(`Failed to send feedback to ${reporter.name}.`);
                });
            }
        }
    }
    let autoFlagging = false;
    async function SetupPostPage() {
        sotools_1.parseQuestionsAndAnswers(async (post) => {
            if (!post.element.length) {
                return;
            }
            let iconLocation;
            let advancedFlaggingLink = null;
            const nattyIcon = getNattyIcon().click(() => {
                window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
            });
            const showFunc = (element) => element.addClass('d-inline-block').removeClass('d-none');
            const copyPastorIcon = getGuttenbergIcon();
            const copyPastorApi = new CopyPastorAPI_1.CopyPastorAPI(post.postId, copyPastorKey);
            const copyPastorObservable = copyPastorApi.Watch();
            const smokeyIcon = getSmokeyIcon();
            const reporters = [];
            if (post.type === 'Answer') {
                const nattyApi = new NattyApi_1.NattyAPI(post.postId);
                nattyApi.Watch()
                    .subscribe(reported => {
                    if (reported) {
                        showFunc(nattyIcon);
                    }
                    else {
                        nattyIcon.addClass('d-none');
                    }
                });
                reporters.push({
                    name: 'Natty',
                    ReportNaa: (answerDate, questionDate) => nattyApi.ReportNaa(answerDate, questionDate),
                    ReportRedFlag: () => nattyApi.ReportRedFlag(),
                    ReportLooksFine: () => nattyApi.ReportLooksFine(),
                    ReportNeedsEditing: () => nattyApi.ReportNeedsEditing(),
                    ReportVandalism: () => Promise.resolve(false),
                    ReportDuplicateAnswer: () => Promise.resolve(false),
                    ReportPlagiarism: () => Promise.resolve(false)
                });
                copyPastorObservable.subscribe(items => {
                    if (items.length) {
                        copyPastorIcon.attr('Title', `Reported by CopyPastor - ${items.length}`);
                        showFunc(copyPastorIcon);
                        copyPastorIcon.click(() => items.forEach(item => {
                            window.open('https://copypastor.sobotics.org/posts/' + item.post_id);
                        }));
                    }
                    else {
                        copyPastorIcon.addClass('d-none');
                    }
                });
                reporters.push({
                    name: 'Guttenberg',
                    ReportNaa: () => copyPastorApi.ReportFalsePositive(),
                    ReportRedFlag: () => Promise.resolve(false),
                    ReportLooksFine: () => copyPastorApi.ReportFalsePositive(),
                    ReportNeedsEditing: () => copyPastorApi.ReportFalsePositive(),
                    ReportVandalism: () => copyPastorApi.ReportFalsePositive(),
                    ReportDuplicateAnswer: () => copyPastorApi.ReportTruePositive(),
                    ReportPlagiarism: () => copyPastorApi.ReportTruePositive()
                });
                const genericBotAPI = new GenericBotAPI_1.GenericBotAPI(post.postId);
                reporters.push({
                    name: 'Generic Bot',
                    ReportNaa: () => genericBotAPI.ReportNaa(),
                    ReportRedFlag: () => Promise.resolve(false),
                    ReportLooksFine: () => genericBotAPI.ReportLooksFine(),
                    ReportNeedsEditing: () => genericBotAPI.ReportNeedsEditing(),
                    ReportVandalism: () => Promise.resolve(true),
                    ReportDuplicateAnswer: () => Promise.resolve(false),
                    ReportPlagiarism: () => Promise.resolve(false)
                });
            }
            const metaSmoke = new MetaSmokeAPI_1.MetaSmokeAPI();
            metaSmoke.Watch(post.postId, post.type)
                .subscribe(id => {
                if (id !== null) {
                    smokeyIcon.click(() => {
                        window.open(`https://metasmoke.erwaysoftware.com/post/${id}`, '_blank');
                    });
                    showFunc(smokeyIcon);
                }
                else {
                    smokeyIcon.addClass('d-none');
                }
            });
            reporters.push({
                name: 'Smokey',
                ReportNaa: () => metaSmoke.ReportNaa(post.postId, post.type),
                ReportRedFlag: () => metaSmoke.ReportRedFlag(post.postId, post.type),
                ReportLooksFine: () => metaSmoke.ReportLooksFine(post.postId, post.type),
                ReportNeedsEditing: () => metaSmoke.ReportNeedsEditing(post.postId, post.type),
                ReportVandalism: () => metaSmoke.ReportVandalism(post.postId, post.type),
                ReportDuplicateAnswer: () => Promise.resolve(false),
                ReportPlagiarism: () => Promise.resolve(false)
            });
            const performedActionIcon = getPerformedActionIcon();
            const reportedIcon = getReportedIcon();
            if (post.page === 'Question') {
                // Now we setup the flagging dialog
                iconLocation = iconLocation = post.element.find('.js-post-menu').children().first();
                advancedFlaggingLink = $('<button>').attr('type', 'button')
                    .attr('class', 's-btn s-btn__link advanced-flagging-link').text('Advanced Flagging');
                let questionTime;
                let answerTime;
                if (post.type === 'Answer') {
                    questionTime = post.question.postTime;
                    answerTime = post.postTime;
                }
                else {
                    questionTime = post.postTime;
                    answerTime = post.postTime;
                }
                const deleted = post.element.hasClass('deleted-answer');
                const isEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationWatchFlags);
                RequestWatcher_1.WatchFlags().subscribe(xhr => {
                    if (isEnabled && !autoFlagging) {
                        const matches = new RegExp(`/flags/posts/${post.postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther)`).exec(xhr.responseURL);
                        if (matches !== null && xhr.status === 200) {
                            const flagType = {
                                Id: 0,
                                ReportType: matches[1],
                                DisplayName: matches[1]
                            };
                            handleFlag(flagType, reporters, answerTime, questionTime);
                            const expiryDate = new Date();
                            expiryDate.setDate(expiryDate.getDate() + 30);
                            displaySuccessFlagged(reportedIcon, flagType.ReportType);
                        }
                    }
                });
                const linkDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationLinkDisabled);
                if (!linkDisabled) {
                    const dropDown = await BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation, post.authorName, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters, copyPastorApi.Promise());
                    advancedFlaggingLink.append(dropDown);
                    const link = advancedFlaggingLink;
                    const openOnHover = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationOpenOnHover);
                    if (openOnHover) {
                        link.hover(e => {
                            e.stopPropagation();
                            if (e.target === link.get(0)) {
                                dropDown.removeClass('d-none').addClass('d-block');
                            }
                        });
                        link.mouseleave(e => {
                            e.stopPropagation();
                            dropDown.removeClass('d-block').addClass('d-none');
                        });
                    }
                    else {
                        link.click(e => {
                            e.stopPropagation();
                            if (e.target === link.get(0)) {
                                dropDown.removeClass('d-none').addClass('d-block');
                            }
                        });
                        $(window).click(() => {
                            dropDown.removeClass('d-block').addClass('d-none');
                        });
                    }
                    iconLocation.append($('<div>').attr('class', 'grid--cell').append(advancedFlaggingLink));
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
    function getPerformedActionIcon() {
        return $('<div>').attr('class', 'comment-flag advanced-flagging-performed-action d-none')
            .append('<svg aria-hidden="true" class="svg-icon iconCheckmarkSm fc-green-500" width="14" height="14" viewBox="0 0 14 14"><path d="M13 3.41L11.59 2 5 8.59 2.41 6 1 7.41l4 4 8-8z"/></svg>');
    }
    function getReportedIcon() {
        return $('<div>')
            .attr('class', 'comment-flag advanced-flagging-flag-icon d-none')
            .append('<svg aria-hidden="true" class="svg-icon iconFlag" width="18" height="18" viewBox="0 0 18 18"><path d="M3 2v14h2v-6h3.6l.4 1h6V3H9.5L9 2z"></path></svg>');
    }
    function getNattyIcon() {
        return $('<div>').attr('title', 'Reported by Natty').attr('class', 'advanced-flagging-icon advanced-flagging-natty-icon d-none');
    }
    function getGuttenbergIcon() {
        return $('<div>').attr('title', 'Reported by Guttenberg').attr('class', 'advanced-flagging-icon advanced-flagging-gut-icon d-none');
    }
    function getSmokeyIcon() {
        return $('<div>').attr('title', 'Reported by Smokey').attr('class', 'advanced-flagging-icon advanced-flagging-smokey-icon d-none');
    }
    const metaSmokeManualKey = 'MetaSmoke.ManualKey';
    async function Setup() {
        const manualKey = localStorage.getItem(metaSmokeManualKey);
        if (manualKey) {
            localStorage.removeItem(metaSmokeManualKey);
            MetaSmokeAPI_1.MetaSmokeAPI.Setup(exports.metaSmokeKey, async () => manualKey);
        }
        else {
            MetaSmokeAPI_1.MetaSmokeAPI.Setup(exports.metaSmokeKey);
        }
        SetupPostPage();
        SetupStyles();
        Configuration_1.SetupConfiguration();
        document.body.appendChild(popupWrapper.get(0));
        const watchedQueuesEnabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.ConfigurationWatchQueues);
        const postDetails = [];
        if (watchedQueuesEnabled) {
            RequestWatcher_1.WatchRequests().subscribe((xhr) => {
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
                const isReviewItem = /(\/review\/next-task)|(\/review\/task-reviewed\/)/.exec(xhr.responseURL);
                if (isReviewItem !== null && xhr.status === 200) {
                    const review = xhr.responseText;
                    parseReviewDetails(review);
                    return;
                }
                const matches = /(\d+)\/vote\/10|(\d+)\/recommend-delete/.exec(xhr.responseURL);
                if (matches !== null && xhr.status === 200) {
                    const postIdStr = matches[1] || matches[2];
                    const postId = parseInt(postIdStr, 10);
                    const currentPostDetails = postDetails[postId];
                    if (currentPostDetails && $('.answers-subheader').length > 0) {
                        const nattyApi = new NattyApi_1.NattyAPI(postId);
                        nattyApi.Watch();
                        handleFlag({ Id: 0, ReportType: 'AnswerNotAnAnswer', DisplayName: 'AnswerNotAnAnswer' }, [
                            {
                                name: 'Natty',
                                ReportNaa: (answerDate, questionDate) => nattyApi.ReportNaa(answerDate, questionDate),
                                ReportRedFlag: () => nattyApi.ReportRedFlag(),
                                ReportLooksFine: () => nattyApi.ReportLooksFine(),
                                ReportNeedsEditing: () => nattyApi.ReportNeedsEditing(),
                                ReportVandalism: () => Promise.resolve(false),
                                ReportDuplicateAnswer: () => Promise.resolve(false),
                                ReportPlagiarism: () => Promise.resolve(false)
                            }
                        ], currentPostDetails.answerTime, currentPostDetails.questionTime);
                    }
                }
            });
        }
    }
    $(() => {
        let started = false;
        async function actionWatcher() {
            if (!started) {
                started = true;
                await Setup();
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
        if (document.hasFocus && document.hasFocus()) {
            actionWatcher();
        }
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
                    ReportType: 'PostSpam'
                },
                {
                    Id: 2,
                    DisplayName: 'Rude or Abusive',
                    ReportType: 'PostOffensive'
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
                    Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                    GetCustomFlagText: (copyPastorItem) => `Possible plagiarism of another answer https:${copyPastorItem.target_url}, as can be seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}`
                },
                {
                    Id: 4,
                    DisplayName: 'Duplicate answer',
                    ReportType: 'PostOther',
                    Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                    GetComment: () => 'Please don\'t add the [same answer to multiple questions](https://meta.stackexchange.com/questions/104227/is-it-acceptable-to-add-a-duplicate-answer-to-several-questions). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                    GetCustomFlagText: (copyPastorItem) => `The answer is a repost of their other answer https:${copyPastorItem.target_url}, but as there are slight differences as seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}, an auto flag wouldn't be raised.`
                },
                {
                    Id: 18,
                    DisplayName: 'Bad attribution',
                    ReportType: 'PostOther',
                    Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                    GetCustomFlagText: (copyPastorItem) => `This post is copied from [another answer](https:${copyPastorItem.target_url}), as can be seen [here](https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}). The author only added a link to the other answer, which is [not the proper way of attribution](https://stackoverflow.blog/2009/06/25/attribution-required/).`
                }
            ]
        },
        {
            IsDangerous: false,
            AppliesTo: ['Answer'],
            FlagTypes: [
                {
                    Id: 5,
                    DisplayName: 'Link Only',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: () => 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
                        '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
                        'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
                        'page you\'re linking to in case the target page is unavailable. ' +
                        '[Answers that are little more than a link may be deleted.](/help/deleted-answers)'
                },
                {
                    Id: 6,
                    DisplayName: 'Not an answer',
                    ReportType: 'AnswerNotAnAnswer',
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
                    Id: 7,
                    DisplayName: 'Thanks',
                    ReportType: 'AnswerNotAnAnswer',
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
                    Id: 8,
                    DisplayName: 'Me too',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: () => 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
                        `If you have a different but related question, then [ask](/questions/ask) it ` +
                        '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
                        'you can [upvote](/help/privileges/vote-up) it, leave a [comment](/help/privileges/comment), ' +
                        'or start a [bounty](/help/privileges/set-bounties) ' +
                        'once you have enough [reputation](/help/whats-reputation).',
                },
                {
                    Id: 9,
                    DisplayName: 'Library',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: () => 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](https://meta.stackoverflow.com/a/251605) in the answer itself.'
                },
                {
                    Id: 10,
                    DisplayName: 'Comment',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: (userDetails) => userDetails.Reputation < 50
                        ? 'This does not provide an answer to the question. Once you have sufficient [reputation](/help/whats-reputation) ' +
                            'you will be able to [comment on any post](/help/privileges/comment); instead, ' +
                            '[provide answers that don\'t require clarification from the asker](https://meta.stackexchange.com/questions/214173/why-do-i-need-50-reputation-to-comment-what-can-i-do-instead).'
                        :
                            'This does not provide an answer to the question. Please write a comment instead.'
                },
                {
                    Id: 14,
                    DisplayName: 'Duplicate',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: () => 'Instead of posting an answer which merely links to another answer, please instead [flag the question](/help/privileges/flag-posts) as a duplicate.'
                },
                {
                    Id: 17,
                    DisplayName: 'Non English',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: () => 'Welcome to Stack Overflow. Please write your answer in English, as Stack Overflow is an [English only site](https://meta.stackoverflow.com/a/297680).'
                },
                {
                    Id: 18,
                    DisplayName: 'Should be an edit',
                    ReportType: 'AnswerNotAnAnswer',
                    GetComment: () => 'Please use the edit link on your question to add additional information. The Post Answer button should be used only for complete answers to the question.'
                }
            ]
        },
        {
            IsDangerous: false,
            AppliesTo: ['Answer', 'Question'],
            FlagTypes: [
                {
                    Id: 11,
                    DisplayName: 'Looks Fine',
                    ReportType: 'NoFlag'
                },
                {
                    Id: 12,
                    DisplayName: 'Needs Editing',
                    ReportType: 'NoFlag'
                },
                {
                    Id: 13,
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
        const nodes = $('.answer-hyperlink').parent().parent();
        for (let i = 0; i < nodes.length; i++) {
            const node = $(nodes[i]);
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
        }
    }
    function isQuestionPage() {
        return !!window.location.href.match(/\/questions\/\d+.*/);
    }
    exports.isQuestionPage = isQuestionPage;
    function parseQuestionPage(callback) {
        function getPostDetails(node) {
            const score = parseInt(node.find('.vote-count-post').text(), 10);
            const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
            const { authorName, authorId } = parseAuthorDetails(node.find('.user-info .user-details').last());
            const postTime = parseActionDate(node.find('.user-info .relativetime').last());
            return { score, authorReputation, authorName, authorId, postTime };
        }
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
        const answerNodes = $('.answer');
        for (let i = 0; i < answerNodes.length; i++) {
            const parseAnswerDetails = (aNode) => {
                const answerId = parseInt(aNode.attr('data-answerid'), 10);
                const postDetails = getPostDetails(aNode);
                aNode.find('.answercell').bind('destroyed', () => {
                    setTimeout(() => {
                        const updatedAnswerNode = $(`#answer-${answerId}`);
                        parseAnswerDetails(updatedAnswerNode);
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
            };
            const answerNode = $(answerNodes[i]);
            parseAnswerDetails(answerNode);
        }
    }
    function isFlagsPage() {
        return !!window.location.href.match(/\/users\/flag-summary\//);
    }
    exports.isFlagsPage = isFlagsPage;
    function parseFlagsPage(callback) {
        const nodes = $('.flagged-post');
        for (let i = 0; i < nodes.length; i++) {
            const node = $(nodes[i]);
            const type = node.find('.answer-hyperlink').length
                ? 'Answer'
                : 'Question';
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
        const answerNodes = $('.answer-hyperlink');
        for (let i = 0; i < answerNodes.length; i++) {
            const answerNode = $(answerNodes[i]);
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
        }
    }
    function parseQuestionsAndAnswers(callback) {
        if (isNatoPage()) {
            parseNatoPage(callback);
            return;
        }
        if (isQuestionPage()) {
            parseQuestionPage(callback);
            return;
        }
        if (isFlagsPage()) {
            parseFlagsPage(callback);
            return;
        }
        if (isModPage() || isUserPage() || StackExchange.options.user.isModerator) {
            return;
        }
        parseGenericPage(callback);
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

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(107), __webpack_require__(2), __webpack_require__(205)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1, sotools_1, ChatApi_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.NattyAPI = void 0;
    const nattyFeedbackUrl = 'http://logs.sobotics.org/napi/api/feedback';
    const soboticsRoomId = 111347;
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
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 1);
                new Promise((resolve, reject) => {
                    let numTries = 0;
                    const onError = (response) => {
                        numTries++;
                        if (numTries < 3) {
                            makeRequest();
                        }
                        else {
                            reject('Failed to retrieve natty report: ' + response);
                        }
                    };
                    const makeRequest = () => {
                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: `${nattyFeedbackUrl}/${this.answerId}`,
                            onload: (response) => {
                                if (response.status === 200) {
                                    const nattyResult = JSON.parse(response.responseText);
                                    if (nattyResult.items && nattyResult.items[0]) {
                                        resolve(true);
                                    }
                                    else {
                                        resolve(false);
                                    }
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
                await this.chat.SendMessage(soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} tp`);
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
                const promise = this.chat.SendMessage(soboticsRoomId, `@Natty report https://stackoverflow.com/a/${this.answerId}`);
                await promise.then(() => {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    this.subject.next(true);
                });
                return true;
            }
        }
        async ReportRedFlag() {
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} tp`);
                return true;
            }
            return false;
        }
        async ReportLooksFine() {
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} fp`);
                return true;
            }
            return false;
        }
        async ReportNeedsEditing() {
            if (!sotools_1.IsStackOverflow()) {
                return false;
            }
            if (await this.WasReported()) {
                await this.chat.SendMessage(soboticsRoomId, `@Natty feedback https://stackoverflow.com/a/${this.answerId} ne`);
                return true;
            }
            return false;
        }
        async WasReported() {
            return this.replaySubject.pipe(operators_1.take(1)).toPromise();
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
/* harmony export */   "Observable": () => /* reexport safe */ _internal_Observable__WEBPACK_IMPORTED_MODULE_0__.Observable,
/* harmony export */   "ConnectableObservable": () => /* reexport safe */ _internal_observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__.ConnectableObservable,
/* harmony export */   "GroupedObservable": () => /* reexport safe */ _internal_operators_groupBy__WEBPACK_IMPORTED_MODULE_2__.GroupedObservable,
/* harmony export */   "observable": () => /* reexport safe */ _internal_symbol_observable__WEBPACK_IMPORTED_MODULE_3__.observable,
/* harmony export */   "Subject": () => /* reexport safe */ _internal_Subject__WEBPACK_IMPORTED_MODULE_4__.Subject,
/* harmony export */   "BehaviorSubject": () => /* reexport safe */ _internal_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__.BehaviorSubject,
/* harmony export */   "ReplaySubject": () => /* reexport safe */ _internal_ReplaySubject__WEBPACK_IMPORTED_MODULE_6__.ReplaySubject,
/* harmony export */   "AsyncSubject": () => /* reexport safe */ _internal_AsyncSubject__WEBPACK_IMPORTED_MODULE_7__.AsyncSubject,
/* harmony export */   "asap": () => /* reexport safe */ _internal_scheduler_asap__WEBPACK_IMPORTED_MODULE_8__.asap,
/* harmony export */   "asapScheduler": () => /* reexport safe */ _internal_scheduler_asap__WEBPACK_IMPORTED_MODULE_8__.asapScheduler,
/* harmony export */   "async": () => /* reexport safe */ _internal_scheduler_async__WEBPACK_IMPORTED_MODULE_9__.async,
/* harmony export */   "asyncScheduler": () => /* reexport safe */ _internal_scheduler_async__WEBPACK_IMPORTED_MODULE_9__.asyncScheduler,
/* harmony export */   "queue": () => /* reexport safe */ _internal_scheduler_queue__WEBPACK_IMPORTED_MODULE_10__.queue,
/* harmony export */   "queueScheduler": () => /* reexport safe */ _internal_scheduler_queue__WEBPACK_IMPORTED_MODULE_10__.queueScheduler,
/* harmony export */   "animationFrame": () => /* reexport safe */ _internal_scheduler_animationFrame__WEBPACK_IMPORTED_MODULE_11__.animationFrame,
/* harmony export */   "animationFrameScheduler": () => /* reexport safe */ _internal_scheduler_animationFrame__WEBPACK_IMPORTED_MODULE_11__.animationFrameScheduler,
/* harmony export */   "VirtualTimeScheduler": () => /* reexport safe */ _internal_scheduler_VirtualTimeScheduler__WEBPACK_IMPORTED_MODULE_12__.VirtualTimeScheduler,
/* harmony export */   "VirtualAction": () => /* reexport safe */ _internal_scheduler_VirtualTimeScheduler__WEBPACK_IMPORTED_MODULE_12__.VirtualAction,
/* harmony export */   "Scheduler": () => /* reexport safe */ _internal_Scheduler__WEBPACK_IMPORTED_MODULE_13__.Scheduler,
/* harmony export */   "Subscription": () => /* reexport safe */ _internal_Subscription__WEBPACK_IMPORTED_MODULE_14__.Subscription,
/* harmony export */   "Subscriber": () => /* reexport safe */ _internal_Subscriber__WEBPACK_IMPORTED_MODULE_15__.Subscriber,
/* harmony export */   "Notification": () => /* reexport safe */ _internal_Notification__WEBPACK_IMPORTED_MODULE_16__.Notification,
/* harmony export */   "NotificationKind": () => /* reexport safe */ _internal_Notification__WEBPACK_IMPORTED_MODULE_16__.NotificationKind,
/* harmony export */   "pipe": () => /* reexport safe */ _internal_util_pipe__WEBPACK_IMPORTED_MODULE_17__.pipe,
/* harmony export */   "noop": () => /* reexport safe */ _internal_util_noop__WEBPACK_IMPORTED_MODULE_18__.noop,
/* harmony export */   "identity": () => /* reexport safe */ _internal_util_identity__WEBPACK_IMPORTED_MODULE_19__.identity,
/* harmony export */   "isObservable": () => /* reexport safe */ _internal_util_isObservable__WEBPACK_IMPORTED_MODULE_20__.isObservable,
/* harmony export */   "ArgumentOutOfRangeError": () => /* reexport safe */ _internal_util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_21__.ArgumentOutOfRangeError,
/* harmony export */   "EmptyError": () => /* reexport safe */ _internal_util_EmptyError__WEBPACK_IMPORTED_MODULE_22__.EmptyError,
/* harmony export */   "ObjectUnsubscribedError": () => /* reexport safe */ _internal_util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_23__.ObjectUnsubscribedError,
/* harmony export */   "UnsubscriptionError": () => /* reexport safe */ _internal_util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_24__.UnsubscriptionError,
/* harmony export */   "TimeoutError": () => /* reexport safe */ _internal_util_TimeoutError__WEBPACK_IMPORTED_MODULE_25__.TimeoutError,
/* harmony export */   "bindCallback": () => /* reexport safe */ _internal_observable_bindCallback__WEBPACK_IMPORTED_MODULE_26__.bindCallback,
/* harmony export */   "bindNodeCallback": () => /* reexport safe */ _internal_observable_bindNodeCallback__WEBPACK_IMPORTED_MODULE_27__.bindNodeCallback,
/* harmony export */   "combineLatest": () => /* reexport safe */ _internal_observable_combineLatest__WEBPACK_IMPORTED_MODULE_28__.combineLatest,
/* harmony export */   "concat": () => /* reexport safe */ _internal_observable_concat__WEBPACK_IMPORTED_MODULE_29__.concat,
/* harmony export */   "defer": () => /* reexport safe */ _internal_observable_defer__WEBPACK_IMPORTED_MODULE_30__.defer,
/* harmony export */   "empty": () => /* reexport safe */ _internal_observable_empty__WEBPACK_IMPORTED_MODULE_31__.empty,
/* harmony export */   "forkJoin": () => /* reexport safe */ _internal_observable_forkJoin__WEBPACK_IMPORTED_MODULE_32__.forkJoin,
/* harmony export */   "from": () => /* reexport safe */ _internal_observable_from__WEBPACK_IMPORTED_MODULE_33__.from,
/* harmony export */   "fromEvent": () => /* reexport safe */ _internal_observable_fromEvent__WEBPACK_IMPORTED_MODULE_34__.fromEvent,
/* harmony export */   "fromEventPattern": () => /* reexport safe */ _internal_observable_fromEventPattern__WEBPACK_IMPORTED_MODULE_35__.fromEventPattern,
/* harmony export */   "generate": () => /* reexport safe */ _internal_observable_generate__WEBPACK_IMPORTED_MODULE_36__.generate,
/* harmony export */   "iif": () => /* reexport safe */ _internal_observable_iif__WEBPACK_IMPORTED_MODULE_37__.iif,
/* harmony export */   "interval": () => /* reexport safe */ _internal_observable_interval__WEBPACK_IMPORTED_MODULE_38__.interval,
/* harmony export */   "merge": () => /* reexport safe */ _internal_observable_merge__WEBPACK_IMPORTED_MODULE_39__.merge,
/* harmony export */   "never": () => /* reexport safe */ _internal_observable_never__WEBPACK_IMPORTED_MODULE_40__.never,
/* harmony export */   "of": () => /* reexport safe */ _internal_observable_of__WEBPACK_IMPORTED_MODULE_41__.of,
/* harmony export */   "onErrorResumeNext": () => /* reexport safe */ _internal_observable_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_42__.onErrorResumeNext,
/* harmony export */   "pairs": () => /* reexport safe */ _internal_observable_pairs__WEBPACK_IMPORTED_MODULE_43__.pairs,
/* harmony export */   "partition": () => /* reexport safe */ _internal_observable_partition__WEBPACK_IMPORTED_MODULE_44__.partition,
/* harmony export */   "race": () => /* reexport safe */ _internal_observable_race__WEBPACK_IMPORTED_MODULE_45__.race,
/* harmony export */   "range": () => /* reexport safe */ _internal_observable_range__WEBPACK_IMPORTED_MODULE_46__.range,
/* harmony export */   "throwError": () => /* reexport safe */ _internal_observable_throwError__WEBPACK_IMPORTED_MODULE_47__.throwError,
/* harmony export */   "timer": () => /* reexport safe */ _internal_observable_timer__WEBPACK_IMPORTED_MODULE_48__.timer,
/* harmony export */   "using": () => /* reexport safe */ _internal_observable_using__WEBPACK_IMPORTED_MODULE_49__.using,
/* harmony export */   "zip": () => /* reexport safe */ _internal_observable_zip__WEBPACK_IMPORTED_MODULE_50__.zip,
/* harmony export */   "scheduled": () => /* reexport safe */ _internal_scheduled_scheduled__WEBPACK_IMPORTED_MODULE_51__.scheduled,
/* harmony export */   "EMPTY": () => /* reexport safe */ _internal_observable_empty__WEBPACK_IMPORTED_MODULE_31__.EMPTY,
/* harmony export */   "NEVER": () => /* reexport safe */ _internal_observable_never__WEBPACK_IMPORTED_MODULE_40__.NEVER,
/* harmony export */   "config": () => /* reexport safe */ _internal_config__WEBPACK_IMPORTED_MODULE_52__.config
/* harmony export */ });
/* harmony import */ var _internal_Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _internal_observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(22);
/* harmony import */ var _internal_operators_groupBy__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(27);
/* harmony import */ var _internal_symbol_observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(19);
/* harmony import */ var _internal_Subject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(24);
/* harmony import */ var _internal_BehaviorSubject__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(28);
/* harmony import */ var _internal_ReplaySubject__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(29);
/* harmony import */ var _internal_AsyncSubject__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(46);
/* harmony import */ var _internal_scheduler_asap__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(47);
/* harmony import */ var _internal_scheduler_async__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(51);
/* harmony import */ var _internal_scheduler_queue__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(39);
/* harmony import */ var _internal_scheduler_animationFrame__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(52);
/* harmony import */ var _internal_scheduler_VirtualTimeScheduler__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(55);
/* harmony import */ var _internal_Scheduler__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(42);
/* harmony import */ var _internal_Subscription__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(13);
/* harmony import */ var _internal_Subscriber__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(7);
/* harmony import */ var _internal_Notification__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(31);
/* harmony import */ var _internal_util_pipe__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(20);
/* harmony import */ var _internal_util_noop__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(56);
/* harmony import */ var _internal_util_identity__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(21);
/* harmony import */ var _internal_util_isObservable__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(57);
/* harmony import */ var _internal_util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(58);
/* harmony import */ var _internal_util_EmptyError__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(59);
/* harmony import */ var _internal_util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(25);
/* harmony import */ var _internal_util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(15);
/* harmony import */ var _internal_util_TimeoutError__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(60);
/* harmony import */ var _internal_observable_bindCallback__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(61);
/* harmony import */ var _internal_observable_bindNodeCallback__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(63);
/* harmony import */ var _internal_observable_combineLatest__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(64);
/* harmony import */ var _internal_observable_concat__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(75);
/* harmony import */ var _internal_observable_defer__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(87);
/* harmony import */ var _internal_observable_empty__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(38);
/* harmony import */ var _internal_observable_forkJoin__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(88);
/* harmony import */ var _internal_observable_from__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(79);
/* harmony import */ var _internal_observable_fromEvent__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(89);
/* harmony import */ var _internal_observable_fromEventPattern__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(90);
/* harmony import */ var _internal_observable_generate__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(91);
/* harmony import */ var _internal_observable_iif__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(92);
/* harmony import */ var _internal_observable_interval__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(93);
/* harmony import */ var _internal_observable_merge__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(95);
/* harmony import */ var _internal_observable_never__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(96);
/* harmony import */ var _internal_observable_of__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(32);
/* harmony import */ var _internal_observable_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(97);
/* harmony import */ var _internal_observable_pairs__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(98);
/* harmony import */ var _internal_observable_partition__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(99);
/* harmony import */ var _internal_observable_race__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(102);
/* harmony import */ var _internal_observable_range__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(103);
/* harmony import */ var _internal_observable_throwError__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(37);
/* harmony import */ var _internal_observable_timer__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(104);
/* harmony import */ var _internal_observable_using__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(105);
/* harmony import */ var _internal_observable_zip__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(106);
/* harmony import */ var _internal_scheduled_scheduled__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__(80);
/* harmony import */ var _internal_config__WEBPACK_IMPORTED_MODULE_52__ = __webpack_require__(10);
/** PURE_IMPORTS_START  PURE_IMPORTS_END */























































//# sourceMappingURL=index.js.map


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Observable": () => /* binding */ Observable
/* harmony export */ });
/* harmony import */ var _util_canReportError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(18);
/* harmony import */ var _util_toSubscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6);
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(19);
/* harmony import */ var _util_pipe__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(20);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(10);
/** PURE_IMPORTS_START _util_canReportError,_util_toSubscriber,_symbol_observable,_util_pipe,_config PURE_IMPORTS_END */





var Observable = /*@__PURE__*/ (function () {
    function Observable(subscribe) {
        this._isScalar = false;
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
        var operator = this.operator;
        var sink = (0,_util_toSubscriber__WEBPACK_IMPORTED_MODULE_0__.toSubscriber)(observerOrNext, error, complete);
        if (operator) {
            sink.add(operator.call(sink, this.source));
        }
        else {
            sink.add(this.source || (_config__WEBPACK_IMPORTED_MODULE_1__.config.useDeprecatedSynchronousErrorHandling && !sink.syncErrorThrowable) ?
                this._subscribe(sink) :
                this._trySubscribe(sink));
        }
        if (_config__WEBPACK_IMPORTED_MODULE_1__.config.useDeprecatedSynchronousErrorHandling) {
            if (sink.syncErrorThrowable) {
                sink.syncErrorThrowable = false;
                if (sink.syncErrorThrown) {
                    throw sink.syncErrorValue;
                }
            }
        }
        return sink;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            if (_config__WEBPACK_IMPORTED_MODULE_1__.config.useDeprecatedSynchronousErrorHandling) {
                sink.syncErrorThrown = true;
                sink.syncErrorValue = err;
            }
            if ((0,_util_canReportError__WEBPACK_IMPORTED_MODULE_2__.canReportError)(sink)) {
                sink.error(err);
            }
            else {
                console.warn(err);
            }
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
                    if (subscription) {
                        subscription.unsubscribe();
                    }
                }
            }, reject, resolve);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var source = this.source;
        return source && source.subscribe(subscriber);
    };
    Observable.prototype[_symbol_observable__WEBPACK_IMPORTED_MODULE_3__.observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        if (operations.length === 0) {
            return this;
        }
        return (0,_util_pipe__WEBPACK_IMPORTED_MODULE_4__.pipeFromArray)(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());

function getPromiseCtor(promiseCtor) {
    if (!promiseCtor) {
        promiseCtor = _config__WEBPACK_IMPORTED_MODULE_1__.config.Promise || Promise;
    }
    if (!promiseCtor) {
        throw new Error('no Promise impl found');
    }
    return promiseCtor;
}
//# sourceMappingURL=Observable.js.map


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "toSubscriber": () => /* binding */ toSubscriber
/* harmony export */ });
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/* harmony import */ var _symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(12);
/* harmony import */ var _Observer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9);
/** PURE_IMPORTS_START _Subscriber,_symbol_rxSubscriber,_Observer PURE_IMPORTS_END */



function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver) {
        if (nextOrObserver instanceof _Subscriber__WEBPACK_IMPORTED_MODULE_0__.Subscriber) {
            return nextOrObserver;
        }
        if (nextOrObserver[_symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_1__.rxSubscriber]) {
            return nextOrObserver[_symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_1__.rxSubscriber]();
        }
    }
    if (!nextOrObserver && !error && !complete) {
        return new _Subscriber__WEBPACK_IMPORTED_MODULE_0__.Subscriber(_Observer__WEBPACK_IMPORTED_MODULE_2__.empty);
    }
    return new _Subscriber__WEBPACK_IMPORTED_MODULE_0__.Subscriber(nextOrObserver, error, complete);
}
//# sourceMappingURL=toSubscriber.js.map


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Subscriber": () => /* binding */ Subscriber,
/* harmony export */   "SafeSubscriber": () => /* binding */ SafeSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(14);
/* harmony import */ var _Observer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(13);
/* harmony import */ var _internal_symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(10);
/* harmony import */ var _util_hostReportError__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(11);
/** PURE_IMPORTS_START tslib,_util_isFunction,_Observer,_Subscription,_internal_symbol_rxSubscriber,_config,_util_hostReportError PURE_IMPORTS_END */







var Subscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(Subscriber, _super);
    function Subscriber(destinationOrNext, error, complete) {
        var _this = _super.call(this) || this;
        _this.syncErrorValue = null;
        _this.syncErrorThrown = false;
        _this.syncErrorThrowable = false;
        _this.isStopped = false;
        switch (arguments.length) {
            case 0:
                _this.destination = _Observer__WEBPACK_IMPORTED_MODULE_1__.empty;
                break;
            case 1:
                if (!destinationOrNext) {
                    _this.destination = _Observer__WEBPACK_IMPORTED_MODULE_1__.empty;
                    break;
                }
                if (typeof destinationOrNext === 'object') {
                    if (destinationOrNext instanceof Subscriber) {
                        _this.syncErrorThrowable = destinationOrNext.syncErrorThrowable;
                        _this.destination = destinationOrNext;
                        destinationOrNext.add(_this);
                    }
                    else {
                        _this.syncErrorThrowable = true;
                        _this.destination = new SafeSubscriber(_this, destinationOrNext);
                    }
                    break;
                }
            default:
                _this.syncErrorThrowable = true;
                _this.destination = new SafeSubscriber(_this, destinationOrNext, error, complete);
                break;
        }
        return _this;
    }
    Subscriber.prototype[_internal_symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_2__.rxSubscriber] = function () { return this; };
    Subscriber.create = function (next, error, complete) {
        var subscriber = new Subscriber(next, error, complete);
        subscriber.syncErrorThrowable = false;
        return subscriber;
    };
    Subscriber.prototype.next = function (value) {
        if (!this.isStopped) {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (!this.isStopped) {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
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
    Subscriber.prototype._unsubscribeAndRecycle = function () {
        var _parentOrParents = this._parentOrParents;
        this._parentOrParents = null;
        this.unsubscribe();
        this.closed = false;
        this.isStopped = false;
        this._parentOrParents = _parentOrParents;
        return this;
    };
    return Subscriber;
}(_Subscription__WEBPACK_IMPORTED_MODULE_3__.Subscription));

var SafeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SafeSubscriber, _super);
    function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        _this._parentSubscriber = _parentSubscriber;
        var next;
        var context = _this;
        if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_4__.isFunction)(observerOrNext)) {
            next = observerOrNext;
        }
        else if (observerOrNext) {
            next = observerOrNext.next;
            error = observerOrNext.error;
            complete = observerOrNext.complete;
            if (observerOrNext !== _Observer__WEBPACK_IMPORTED_MODULE_1__.empty) {
                context = Object.create(observerOrNext);
                if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_4__.isFunction)(context.unsubscribe)) {
                    _this.add(context.unsubscribe.bind(context));
                }
                context.unsubscribe = _this.unsubscribe.bind(_this);
            }
        }
        _this._context = context;
        _this._next = next;
        _this._error = error;
        _this._complete = complete;
        return _this;
    }
    SafeSubscriber.prototype.next = function (value) {
        if (!this.isStopped && this._next) {
            var _parentSubscriber = this._parentSubscriber;
            if (!_config__WEBPACK_IMPORTED_MODULE_5__.config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                this.__tryOrUnsub(this._next, value);
            }
            else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            var useDeprecatedSynchronousErrorHandling = _config__WEBPACK_IMPORTED_MODULE_5__.config.useDeprecatedSynchronousErrorHandling;
            if (this._error) {
                if (!useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(this._error, err);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, this._error, err);
                    this.unsubscribe();
                }
            }
            else if (!_parentSubscriber.syncErrorThrowable) {
                this.unsubscribe();
                if (useDeprecatedSynchronousErrorHandling) {
                    throw err;
                }
                (0,_util_hostReportError__WEBPACK_IMPORTED_MODULE_6__.hostReportError)(err);
            }
            else {
                if (useDeprecatedSynchronousErrorHandling) {
                    _parentSubscriber.syncErrorValue = err;
                    _parentSubscriber.syncErrorThrown = true;
                }
                else {
                    (0,_util_hostReportError__WEBPACK_IMPORTED_MODULE_6__.hostReportError)(err);
                }
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.complete = function () {
        var _this = this;
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            if (this._complete) {
                var wrappedComplete = function () { return _this._complete.call(_this._context); };
                if (!_config__WEBPACK_IMPORTED_MODULE_5__.config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(wrappedComplete);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, wrappedComplete);
                    this.unsubscribe();
                }
            }
            else {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            this.unsubscribe();
            if (_config__WEBPACK_IMPORTED_MODULE_5__.config.useDeprecatedSynchronousErrorHandling) {
                throw err;
            }
            else {
                (0,_util_hostReportError__WEBPACK_IMPORTED_MODULE_6__.hostReportError)(err);
            }
        }
    };
    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
        if (!_config__WEBPACK_IMPORTED_MODULE_5__.config.useDeprecatedSynchronousErrorHandling) {
            throw new Error('bad call');
        }
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            if (_config__WEBPACK_IMPORTED_MODULE_5__.config.useDeprecatedSynchronousErrorHandling) {
                parent.syncErrorValue = err;
                parent.syncErrorThrown = true;
                return true;
            }
            else {
                (0,_util_hostReportError__WEBPACK_IMPORTED_MODULE_6__.hostReportError)(err);
                return true;
            }
        }
        return false;
    };
    SafeSubscriber.prototype._unsubscribe = function () {
        var _parentSubscriber = this._parentSubscriber;
        this._context = null;
        this._parentSubscriber = null;
        _parentSubscriber.unsubscribe();
    };
    return SafeSubscriber;
}(Subscriber));

//# sourceMappingURL=Subscriber.js.map


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => /* binding */ __extends,
/* harmony export */   "__assign": () => /* binding */ __assign,
/* harmony export */   "__rest": () => /* binding */ __rest,
/* harmony export */   "__decorate": () => /* binding */ __decorate,
/* harmony export */   "__param": () => /* binding */ __param,
/* harmony export */   "__metadata": () => /* binding */ __metadata,
/* harmony export */   "__awaiter": () => /* binding */ __awaiter,
/* harmony export */   "__generator": () => /* binding */ __generator,
/* harmony export */   "__createBinding": () => /* binding */ __createBinding,
/* harmony export */   "__exportStar": () => /* binding */ __exportStar,
/* harmony export */   "__values": () => /* binding */ __values,
/* harmony export */   "__read": () => /* binding */ __read,
/* harmony export */   "__spread": () => /* binding */ __spread,
/* harmony export */   "__spreadArrays": () => /* binding */ __spreadArrays,
/* harmony export */   "__await": () => /* binding */ __await,
/* harmony export */   "__asyncGenerator": () => /* binding */ __asyncGenerator,
/* harmony export */   "__asyncDelegator": () => /* binding */ __asyncDelegator,
/* harmony export */   "__asyncValues": () => /* binding */ __asyncValues,
/* harmony export */   "__makeTemplateObject": () => /* binding */ __makeTemplateObject,
/* harmony export */   "__importStar": () => /* binding */ __importStar,
/* harmony export */   "__importDefault": () => /* binding */ __importDefault,
/* harmony export */   "__classPrivateFieldGet": () => /* binding */ __classPrivateFieldGet,
/* harmony export */   "__classPrivateFieldSet": () => /* binding */ __classPrivateFieldSet
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
/* 9 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "empty": () => /* binding */ empty
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(10);
/* harmony import */ var _util_hostReportError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(11);
/** PURE_IMPORTS_START _config,_util_hostReportError PURE_IMPORTS_END */


var empty = {
    closed: true,
    next: function (value) { },
    error: function (err) {
        if (_config__WEBPACK_IMPORTED_MODULE_0__.config.useDeprecatedSynchronousErrorHandling) {
            throw err;
        }
        else {
            (0,_util_hostReportError__WEBPACK_IMPORTED_MODULE_1__.hostReportError)(err);
        }
    },
    complete: function () { }
};
//# sourceMappingURL=Observer.js.map


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "config": () => /* binding */ config
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var _enable_super_gross_mode_that_will_cause_bad_things = false;
var config = {
    Promise: undefined,
    set useDeprecatedSynchronousErrorHandling(value) {
        if (value) {
            var error = /*@__PURE__*/ new Error();
            /*@__PURE__*/ console.warn('DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: \n' + error.stack);
        }
        else if (_enable_super_gross_mode_that_will_cause_bad_things) {
            /*@__PURE__*/ console.log('RxJS: Back to a better error behavior. Thank you. <3');
        }
        _enable_super_gross_mode_that_will_cause_bad_things = value;
    },
    get useDeprecatedSynchronousErrorHandling() {
        return _enable_super_gross_mode_that_will_cause_bad_things;
    },
};
//# sourceMappingURL=config.js.map


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "hostReportError": () => /* binding */ hostReportError
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function hostReportError(err) {
    setTimeout(function () { throw err; }, 0);
}
//# sourceMappingURL=hostReportError.js.map


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "rxSubscriber": () => /* binding */ rxSubscriber,
/* harmony export */   "$$rxSubscriber": () => /* binding */ $$rxSubscriber
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var rxSubscriber = /*@__PURE__*/ (function () {
    return typeof Symbol === 'function'
        ? /*@__PURE__*/ Symbol('rxSubscriber')
        : '@@rxSubscriber_' + /*@__PURE__*/ Math.random();
})();
var $$rxSubscriber = rxSubscriber;
//# sourceMappingURL=rxSubscriber.js.map


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Subscription": () => /* binding */ Subscription
/* harmony export */ });
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
/* harmony import */ var _util_isObject__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(17);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(15);
/** PURE_IMPORTS_START _util_isArray,_util_isObject,_util_isFunction,_util_UnsubscriptionError PURE_IMPORTS_END */




var Subscription = /*@__PURE__*/ (function () {
    function Subscription(unsubscribe) {
        this.closed = false;
        this._parentOrParents = null;
        this._subscriptions = null;
        if (unsubscribe) {
            this._ctorUnsubscribe = true;
            this._unsubscribe = unsubscribe;
        }
    }
    Subscription.prototype.unsubscribe = function () {
        var errors;
        if (this.closed) {
            return;
        }
        var _a = this, _parentOrParents = _a._parentOrParents, _ctorUnsubscribe = _a._ctorUnsubscribe, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
        this.closed = true;
        this._parentOrParents = null;
        this._subscriptions = null;
        if (_parentOrParents instanceof Subscription) {
            _parentOrParents.remove(this);
        }
        else if (_parentOrParents !== null) {
            for (var index = 0; index < _parentOrParents.length; ++index) {
                var parent_1 = _parentOrParents[index];
                parent_1.remove(this);
            }
        }
        if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(_unsubscribe)) {
            if (_ctorUnsubscribe) {
                this._unsubscribe = undefined;
            }
            try {
                _unsubscribe.call(this);
            }
            catch (e) {
                errors = e instanceof _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_1__.UnsubscriptionError ? flattenUnsubscriptionErrors(e.errors) : [e];
            }
        }
        if ((0,_util_isArray__WEBPACK_IMPORTED_MODULE_2__.isArray)(_subscriptions)) {
            var index = -1;
            var len = _subscriptions.length;
            while (++index < len) {
                var sub = _subscriptions[index];
                if ((0,_util_isObject__WEBPACK_IMPORTED_MODULE_3__.isObject)(sub)) {
                    try {
                        sub.unsubscribe();
                    }
                    catch (e) {
                        errors = errors || [];
                        if (e instanceof _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_1__.UnsubscriptionError) {
                            errors = errors.concat(flattenUnsubscriptionErrors(e.errors));
                        }
                        else {
                            errors.push(e);
                        }
                    }
                }
            }
        }
        if (errors) {
            throw new _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_1__.UnsubscriptionError(errors);
        }
    };
    Subscription.prototype.add = function (teardown) {
        var subscription = teardown;
        if (!teardown) {
            return Subscription.EMPTY;
        }
        switch (typeof teardown) {
            case 'function':
                subscription = new Subscription(teardown);
            case 'object':
                if (subscription === this || subscription.closed || typeof subscription.unsubscribe !== 'function') {
                    return subscription;
                }
                else if (this.closed) {
                    subscription.unsubscribe();
                    return subscription;
                }
                else if (!(subscription instanceof Subscription)) {
                    var tmp = subscription;
                    subscription = new Subscription();
                    subscription._subscriptions = [tmp];
                }
                break;
            default: {
                throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
            }
        }
        var _parentOrParents = subscription._parentOrParents;
        if (_parentOrParents === null) {
            subscription._parentOrParents = this;
        }
        else if (_parentOrParents instanceof Subscription) {
            if (_parentOrParents === this) {
                return subscription;
            }
            subscription._parentOrParents = [_parentOrParents, this];
        }
        else if (_parentOrParents.indexOf(this) === -1) {
            _parentOrParents.push(this);
        }
        else {
            return subscription;
        }
        var subscriptions = this._subscriptions;
        if (subscriptions === null) {
            this._subscriptions = [subscription];
        }
        else {
            subscriptions.push(subscription);
        }
        return subscription;
    };
    Subscription.prototype.remove = function (subscription) {
        var subscriptions = this._subscriptions;
        if (subscriptions) {
            var subscriptionIndex = subscriptions.indexOf(subscription);
            if (subscriptionIndex !== -1) {
                subscriptions.splice(subscriptionIndex, 1);
            }
        }
    };
    Subscription.EMPTY = (function (empty) {
        empty.closed = true;
        return empty;
    }(new Subscription()));
    return Subscription;
}());

function flattenUnsubscriptionErrors(errors) {
    return errors.reduce(function (errs, err) { return errs.concat((err instanceof _util_UnsubscriptionError__WEBPACK_IMPORTED_MODULE_1__.UnsubscriptionError) ? err.errors : err); }, []);
}
//# sourceMappingURL=Subscription.js.map


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isFunction": () => /* binding */ isFunction
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function isFunction(x) {
    return typeof x === 'function';
}
//# sourceMappingURL=isFunction.js.map


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "UnsubscriptionError": () => /* binding */ UnsubscriptionError
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var UnsubscriptionErrorImpl = /*@__PURE__*/ (function () {
    function UnsubscriptionErrorImpl(errors) {
        Error.call(this);
        this.message = errors ?
            errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ') : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
        return this;
    }
    UnsubscriptionErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
    return UnsubscriptionErrorImpl;
})();
var UnsubscriptionError = UnsubscriptionErrorImpl;
//# sourceMappingURL=UnsubscriptionError.js.map


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isArray": () => /* binding */ isArray
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var isArray = /*@__PURE__*/ (function () { return Array.isArray || (function (x) { return x && typeof x.length === 'number'; }); })();
//# sourceMappingURL=isArray.js.map


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isObject": () => /* binding */ isObject
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function isObject(x) {
    return x !== null && typeof x === 'object';
}
//# sourceMappingURL=isObject.js.map


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "canReportError": () => /* binding */ canReportError
/* harmony export */ });
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7);
/** PURE_IMPORTS_START _Subscriber PURE_IMPORTS_END */

function canReportError(observer) {
    while (observer) {
        var _a = observer, closed_1 = _a.closed, destination = _a.destination, isStopped = _a.isStopped;
        if (closed_1 || isStopped) {
            return false;
        }
        else if (destination && destination instanceof _Subscriber__WEBPACK_IMPORTED_MODULE_0__.Subscriber) {
            observer = destination;
        }
        else {
            observer = null;
        }
    }
    return true;
}
//# sourceMappingURL=canReportError.js.map


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "observable": () => /* binding */ observable
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var observable = /*@__PURE__*/ (function () { return typeof Symbol === 'function' && Symbol.observable || '@@observable'; })();
//# sourceMappingURL=observable.js.map


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pipe": () => /* binding */ pipe,
/* harmony export */   "pipeFromArray": () => /* binding */ pipeFromArray
/* harmony export */ });
/* harmony import */ var _identity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(21);
/** PURE_IMPORTS_START _identity PURE_IMPORTS_END */

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
/* 21 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "identity": () => /* binding */ identity
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function identity(x) {
    return x;
}
//# sourceMappingURL=identity.js.map


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ConnectableObservable": () => /* binding */ ConnectableObservable,
/* harmony export */   "connectableObservableDescriptor": () => /* binding */ connectableObservableDescriptor
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(24);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/* harmony import */ var _operators_refCount__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(23);
/** PURE_IMPORTS_START tslib,_Subject,_Observable,_Subscriber,_Subscription,_operators_refCount PURE_IMPORTS_END */






var ConnectableObservable = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ConnectableObservable, _super);
    function ConnectableObservable(source, subjectFactory) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subjectFactory = subjectFactory;
        _this._refCount = 0;
        _this._isComplete = false;
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
    ConnectableObservable.prototype.connect = function () {
        var connection = this._connection;
        if (!connection) {
            this._isComplete = false;
            connection = this._connection = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
            connection.add(this.source
                .subscribe(new ConnectableSubscriber(this.getSubject(), this)));
            if (connection.closed) {
                this._connection = null;
                connection = _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription.EMPTY;
            }
        }
        return connection;
    };
    ConnectableObservable.prototype.refCount = function () {
        return (0,_operators_refCount__WEBPACK_IMPORTED_MODULE_2__.refCount)()(this);
    };
    return ConnectableObservable;
}(_Observable__WEBPACK_IMPORTED_MODULE_3__.Observable));

var connectableObservableDescriptor = /*@__PURE__*/ (function () {
    var connectableProto = ConnectableObservable.prototype;
    return {
        operator: { value: null },
        _refCount: { value: 0, writable: true },
        _subject: { value: null, writable: true },
        _connection: { value: null, writable: true },
        _subscribe: { value: connectableProto._subscribe },
        _isComplete: { value: connectableProto._isComplete, writable: true },
        getSubject: { value: connectableProto.getSubject },
        connect: { value: connectableProto.connect },
        refCount: { value: connectableProto.refCount }
    };
})();
var ConnectableSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ConnectableSubscriber, _super);
    function ConnectableSubscriber(destination, connectable) {
        var _this = _super.call(this, destination) || this;
        _this.connectable = connectable;
        return _this;
    }
    ConnectableSubscriber.prototype._error = function (err) {
        this._unsubscribe();
        _super.prototype._error.call(this, err);
    };
    ConnectableSubscriber.prototype._complete = function () {
        this.connectable._isComplete = true;
        this._unsubscribe();
        _super.prototype._complete.call(this);
    };
    ConnectableSubscriber.prototype._unsubscribe = function () {
        var connectable = this.connectable;
        if (connectable) {
            this.connectable = null;
            var connection = connectable._connection;
            connectable._refCount = 0;
            connectable._subject = null;
            connectable._connection = null;
            if (connection) {
                connection.unsubscribe();
            }
        }
    };
    return ConnectableSubscriber;
}(_Subject__WEBPACK_IMPORTED_MODULE_4__.SubjectSubscriber));
var RefCountOperator = /*@__PURE__*/ (function () {
    function RefCountOperator(connectable) {
        this.connectable = connectable;
    }
    RefCountOperator.prototype.call = function (subscriber, source) {
        var connectable = this.connectable;
        connectable._refCount++;
        var refCounter = new RefCountSubscriber(subscriber, connectable);
        var subscription = source.subscribe(refCounter);
        if (!refCounter.closed) {
            refCounter.connection = connectable.connect();
        }
        return subscription;
    };
    return RefCountOperator;
}());
var RefCountSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(RefCountSubscriber, _super);
    function RefCountSubscriber(destination, connectable) {
        var _this = _super.call(this, destination) || this;
        _this.connectable = connectable;
        return _this;
    }
    RefCountSubscriber.prototype._unsubscribe = function () {
        var connectable = this.connectable;
        if (!connectable) {
            this.connection = null;
            return;
        }
        this.connectable = null;
        var refCount = connectable._refCount;
        if (refCount <= 0) {
            this.connection = null;
            return;
        }
        connectable._refCount = refCount - 1;
        if (refCount > 1) {
            this.connection = null;
            return;
        }
        var connection = this.connection;
        var sharedConnection = connectable._connection;
        this.connection = null;
        if (sharedConnection && (!connection || sharedConnection === connection)) {
            sharedConnection.unsubscribe();
        }
    };
    return RefCountSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_5__.Subscriber));
//# sourceMappingURL=ConnectableObservable.js.map


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "refCount": () => /* binding */ refCount
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function refCount() {
    return function refCountOperatorFunction(source) {
        return source.lift(new RefCountOperator(source));
    };
}
var RefCountOperator = /*@__PURE__*/ (function () {
    function RefCountOperator(connectable) {
        this.connectable = connectable;
    }
    RefCountOperator.prototype.call = function (subscriber, source) {
        var connectable = this.connectable;
        connectable._refCount++;
        var refCounter = new RefCountSubscriber(subscriber, connectable);
        var subscription = source.subscribe(refCounter);
        if (!refCounter.closed) {
            refCounter.connection = connectable.connect();
        }
        return subscription;
    };
    return RefCountOperator;
}());
var RefCountSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(RefCountSubscriber, _super);
    function RefCountSubscriber(destination, connectable) {
        var _this = _super.call(this, destination) || this;
        _this.connectable = connectable;
        return _this;
    }
    RefCountSubscriber.prototype._unsubscribe = function () {
        var connectable = this.connectable;
        if (!connectable) {
            this.connection = null;
            return;
        }
        this.connectable = null;
        var refCount = connectable._refCount;
        if (refCount <= 0) {
            this.connection = null;
            return;
        }
        connectable._refCount = refCount - 1;
        if (refCount > 1) {
            this.connection = null;
            return;
        }
        var connection = this.connection;
        var sharedConnection = connectable._connection;
        this.connection = null;
        if (sharedConnection && (!connection || sharedConnection === connection)) {
            sharedConnection.unsubscribe();
        }
    };
    return RefCountSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=refCount.js.map


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SubjectSubscriber": () => /* binding */ SubjectSubscriber,
/* harmony export */   "Subject": () => /* binding */ Subject,
/* harmony export */   "AnonymousSubject": () => /* binding */ AnonymousSubject
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(5);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(13);
/* harmony import */ var _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25);
/* harmony import */ var _SubjectSubscription__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(26);
/* harmony import */ var _internal_symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12);
/** PURE_IMPORTS_START tslib,_Observable,_Subscriber,_Subscription,_util_ObjectUnsubscribedError,_SubjectSubscription,_internal_symbol_rxSubscriber PURE_IMPORTS_END */







var SubjectSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SubjectSubscriber, _super);
    function SubjectSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        return _this;
    }
    return SubjectSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

var Subject = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.observers = [];
        _this.closed = false;
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype[_internal_symbol_rxSubscriber__WEBPACK_IMPORTED_MODULE_2__.rxSubscriber] = function () {
        return new SubjectSubscriber(this);
    };
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype.next = function (value) {
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_3__.ObjectUnsubscribedError();
        }
        if (!this.isStopped) {
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            for (var i = 0; i < len; i++) {
                copy[i].next(value);
            }
        }
    };
    Subject.prototype.error = function (err) {
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_3__.ObjectUnsubscribedError();
        }
        this.hasError = true;
        this.thrownError = err;
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].error(err);
        }
        this.observers.length = 0;
    };
    Subject.prototype.complete = function () {
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_3__.ObjectUnsubscribedError();
        }
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].complete();
        }
        this.observers.length = 0;
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = true;
        this.closed = true;
        this.observers = null;
    };
    Subject.prototype._trySubscribe = function (subscriber) {
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_3__.ObjectUnsubscribedError();
        }
        else {
            return _super.prototype._trySubscribe.call(this, subscriber);
        }
    };
    Subject.prototype._subscribe = function (subscriber) {
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_3__.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscriber.error(this.thrownError);
            return _Subscription__WEBPACK_IMPORTED_MODULE_4__.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscriber.complete();
            return _Subscription__WEBPACK_IMPORTED_MODULE_4__.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            return new _SubjectSubscription__WEBPACK_IMPORTED_MODULE_5__.SubjectSubscription(this, subscriber);
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new _Observable__WEBPACK_IMPORTED_MODULE_6__.Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(_Observable__WEBPACK_IMPORTED_MODULE_6__.Observable));

var AnonymousSubject = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var destination = this.destination;
        if (destination && destination.next) {
            destination.next(value);
        }
    };
    AnonymousSubject.prototype.error = function (err) {
        var destination = this.destination;
        if (destination && destination.error) {
            this.destination.error(err);
        }
    };
    AnonymousSubject.prototype.complete = function () {
        var destination = this.destination;
        if (destination && destination.complete) {
            this.destination.complete();
        }
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var source = this.source;
        if (source) {
            return this.source.subscribe(subscriber);
        }
        else {
            return _Subscription__WEBPACK_IMPORTED_MODULE_4__.Subscription.EMPTY;
        }
    };
    return AnonymousSubject;
}(Subject));

//# sourceMappingURL=Subject.js.map


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ObjectUnsubscribedError": () => /* binding */ ObjectUnsubscribedError
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var ObjectUnsubscribedErrorImpl = /*@__PURE__*/ (function () {
    function ObjectUnsubscribedErrorImpl() {
        Error.call(this);
        this.message = 'object unsubscribed';
        this.name = 'ObjectUnsubscribedError';
        return this;
    }
    ObjectUnsubscribedErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
    return ObjectUnsubscribedErrorImpl;
})();
var ObjectUnsubscribedError = ObjectUnsubscribedErrorImpl;
//# sourceMappingURL=ObjectUnsubscribedError.js.map


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SubjectSubscription": () => /* binding */ SubjectSubscription
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */


var SubjectSubscription = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SubjectSubscription, _super);
    function SubjectSubscription(subject, subscriber) {
        var _this = _super.call(this) || this;
        _this.subject = subject;
        _this.subscriber = subscriber;
        _this.closed = false;
        return _this;
    }
    SubjectSubscription.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        var subject = this.subject;
        var observers = subject.observers;
        this.subject = null;
        if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
            return;
        }
        var subscriberIndex = observers.indexOf(this.subscriber);
        if (subscriberIndex !== -1) {
            observers.splice(subscriberIndex, 1);
        }
    };
    return SubjectSubscription;
}(_Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription));

//# sourceMappingURL=SubjectSubscription.js.map


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "groupBy": () => /* binding */ groupBy,
/* harmony export */   "GroupedObservable": () => /* binding */ GroupedObservable
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(13);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/** PURE_IMPORTS_START tslib,_Subscriber,_Subscription,_Observable,_Subject PURE_IMPORTS_END */





function groupBy(keySelector, elementSelector, durationSelector, subjectSelector) {
    return function (source) {
        return source.lift(new GroupByOperator(keySelector, elementSelector, durationSelector, subjectSelector));
    };
}
var GroupByOperator = /*@__PURE__*/ (function () {
    function GroupByOperator(keySelector, elementSelector, durationSelector, subjectSelector) {
        this.keySelector = keySelector;
        this.elementSelector = elementSelector;
        this.durationSelector = durationSelector;
        this.subjectSelector = subjectSelector;
    }
    GroupByOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new GroupBySubscriber(subscriber, this.keySelector, this.elementSelector, this.durationSelector, this.subjectSelector));
    };
    return GroupByOperator;
}());
var GroupBySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(GroupBySubscriber, _super);
    function GroupBySubscriber(destination, keySelector, elementSelector, durationSelector, subjectSelector) {
        var _this = _super.call(this, destination) || this;
        _this.keySelector = keySelector;
        _this.elementSelector = elementSelector;
        _this.durationSelector = durationSelector;
        _this.subjectSelector = subjectSelector;
        _this.groups = null;
        _this.attemptedToUnsubscribe = false;
        _this.count = 0;
        return _this;
    }
    GroupBySubscriber.prototype._next = function (value) {
        var key;
        try {
            key = this.keySelector(value);
        }
        catch (err) {
            this.error(err);
            return;
        }
        this._group(value, key);
    };
    GroupBySubscriber.prototype._group = function (value, key) {
        var groups = this.groups;
        if (!groups) {
            groups = this.groups = new Map();
        }
        var group = groups.get(key);
        var element;
        if (this.elementSelector) {
            try {
                element = this.elementSelector(value);
            }
            catch (err) {
                this.error(err);
            }
        }
        else {
            element = value;
        }
        if (!group) {
            group = (this.subjectSelector ? this.subjectSelector() : new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject());
            groups.set(key, group);
            var groupedObservable = new GroupedObservable(key, group, this);
            this.destination.next(groupedObservable);
            if (this.durationSelector) {
                var duration = void 0;
                try {
                    duration = this.durationSelector(new GroupedObservable(key, group));
                }
                catch (err) {
                    this.error(err);
                    return;
                }
                this.add(duration.subscribe(new GroupDurationSubscriber(key, group, this)));
            }
        }
        if (!group.closed) {
            group.next(element);
        }
    };
    GroupBySubscriber.prototype._error = function (err) {
        var groups = this.groups;
        if (groups) {
            groups.forEach(function (group, key) {
                group.error(err);
            });
            groups.clear();
        }
        this.destination.error(err);
    };
    GroupBySubscriber.prototype._complete = function () {
        var groups = this.groups;
        if (groups) {
            groups.forEach(function (group, key) {
                group.complete();
            });
            groups.clear();
        }
        this.destination.complete();
    };
    GroupBySubscriber.prototype.removeGroup = function (key) {
        this.groups.delete(key);
    };
    GroupBySubscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.attemptedToUnsubscribe = true;
            if (this.count === 0) {
                _super.prototype.unsubscribe.call(this);
            }
        }
    };
    return GroupBySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
var GroupDurationSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(GroupDurationSubscriber, _super);
    function GroupDurationSubscriber(key, group, parent) {
        var _this = _super.call(this, group) || this;
        _this.key = key;
        _this.group = group;
        _this.parent = parent;
        return _this;
    }
    GroupDurationSubscriber.prototype._next = function (value) {
        this.complete();
    };
    GroupDurationSubscriber.prototype._unsubscribe = function () {
        var _a = this, parent = _a.parent, key = _a.key;
        this.key = this.parent = null;
        if (parent) {
            parent.removeGroup(key);
        }
    };
    return GroupDurationSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
var GroupedObservable = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(GroupedObservable, _super);
    function GroupedObservable(key, groupSubject, refCountSubscription) {
        var _this = _super.call(this) || this;
        _this.key = key;
        _this.groupSubject = groupSubject;
        _this.refCountSubscription = refCountSubscription;
        return _this;
    }
    GroupedObservable.prototype._subscribe = function (subscriber) {
        var subscription = new _Subscription__WEBPACK_IMPORTED_MODULE_3__.Subscription();
        var _a = this, refCountSubscription = _a.refCountSubscription, groupSubject = _a.groupSubject;
        if (refCountSubscription && !refCountSubscription.closed) {
            subscription.add(new InnerRefCountSubscription(refCountSubscription));
        }
        subscription.add(groupSubject.subscribe(subscriber));
        return subscription;
    };
    return GroupedObservable;
}(_Observable__WEBPACK_IMPORTED_MODULE_4__.Observable));

var InnerRefCountSubscription = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(InnerRefCountSubscription, _super);
    function InnerRefCountSubscription(parent) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        parent.count++;
        return _this;
    }
    InnerRefCountSubscription.prototype.unsubscribe = function () {
        var parent = this.parent;
        if (!parent.closed && !this.closed) {
            _super.prototype.unsubscribe.call(this);
            parent.count -= 1;
            if (parent.count === 0 && parent.attemptedToUnsubscribe) {
                parent.unsubscribe();
            }
        }
    };
    return InnerRefCountSubscription;
}(_Subscription__WEBPACK_IMPORTED_MODULE_3__.Subscription));
//# sourceMappingURL=groupBy.js.map


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BehaviorSubject": () => /* binding */ BehaviorSubject
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(25);
/** PURE_IMPORTS_START tslib,_Subject,_util_ObjectUnsubscribedError PURE_IMPORTS_END */



var BehaviorSubject = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: true,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        if (subscription && !subscription.closed) {
            subscriber.next(this._value);
        }
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        if (this.hasError) {
            throw this.thrownError;
        }
        else if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_1__.ObjectUnsubscribedError();
        }
        else {
            return this._value;
        }
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, this._value = value);
    };
    return BehaviorSubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_2__.Subject));

//# sourceMappingURL=BehaviorSubject.js.map


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ReplaySubject": () => /* binding */ ReplaySubject
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(24);
/* harmony import */ var _scheduler_queue__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(39);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(13);
/* harmony import */ var _operators_observeOn__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(30);
/* harmony import */ var _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(25);
/* harmony import */ var _SubjectSubscription__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(26);
/** PURE_IMPORTS_START tslib,_Subject,_scheduler_queue,_Subscription,_operators_observeOn,_util_ObjectUnsubscribedError,_SubjectSubscription PURE_IMPORTS_END */







var ReplaySubject = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ReplaySubject, _super);
    function ReplaySubject(bufferSize, windowTime, scheduler) {
        if (bufferSize === void 0) {
            bufferSize = Number.POSITIVE_INFINITY;
        }
        if (windowTime === void 0) {
            windowTime = Number.POSITIVE_INFINITY;
        }
        var _this = _super.call(this) || this;
        _this.scheduler = scheduler;
        _this._events = [];
        _this._infiniteTimeWindow = false;
        _this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
        _this._windowTime = windowTime < 1 ? 1 : windowTime;
        if (windowTime === Number.POSITIVE_INFINITY) {
            _this._infiniteTimeWindow = true;
            _this.next = _this.nextInfiniteTimeWindow;
        }
        else {
            _this.next = _this.nextTimeWindow;
        }
        return _this;
    }
    ReplaySubject.prototype.nextInfiniteTimeWindow = function (value) {
        if (!this.isStopped) {
            var _events = this._events;
            _events.push(value);
            if (_events.length > this._bufferSize) {
                _events.shift();
            }
        }
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype.nextTimeWindow = function (value) {
        if (!this.isStopped) {
            this._events.push(new ReplayEvent(this._getNow(), value));
            this._trimBufferThenGetEvents();
        }
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        var _infiniteTimeWindow = this._infiniteTimeWindow;
        var _events = _infiniteTimeWindow ? this._events : this._trimBufferThenGetEvents();
        var scheduler = this.scheduler;
        var len = _events.length;
        var subscription;
        if (this.closed) {
            throw new _util_ObjectUnsubscribedError__WEBPACK_IMPORTED_MODULE_1__.ObjectUnsubscribedError();
        }
        else if (this.isStopped || this.hasError) {
            subscription = _Subscription__WEBPACK_IMPORTED_MODULE_2__.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            subscription = new _SubjectSubscription__WEBPACK_IMPORTED_MODULE_3__.SubjectSubscription(this, subscriber);
        }
        if (scheduler) {
            subscriber.add(subscriber = new _operators_observeOn__WEBPACK_IMPORTED_MODULE_4__.ObserveOnSubscriber(subscriber, scheduler));
        }
        if (_infiniteTimeWindow) {
            for (var i = 0; i < len && !subscriber.closed; i++) {
                subscriber.next(_events[i]);
            }
        }
        else {
            for (var i = 0; i < len && !subscriber.closed; i++) {
                subscriber.next(_events[i].value);
            }
        }
        if (this.hasError) {
            subscriber.error(this.thrownError);
        }
        else if (this.isStopped) {
            subscriber.complete();
        }
        return subscription;
    };
    ReplaySubject.prototype._getNow = function () {
        return (this.scheduler || _scheduler_queue__WEBPACK_IMPORTED_MODULE_5__.queue).now();
    };
    ReplaySubject.prototype._trimBufferThenGetEvents = function () {
        var now = this._getNow();
        var _bufferSize = this._bufferSize;
        var _windowTime = this._windowTime;
        var _events = this._events;
        var eventsCount = _events.length;
        var spliceCount = 0;
        while (spliceCount < eventsCount) {
            if ((now - _events[spliceCount].time) < _windowTime) {
                break;
            }
            spliceCount++;
        }
        if (eventsCount > _bufferSize) {
            spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
        }
        if (spliceCount > 0) {
            _events.splice(0, spliceCount);
        }
        return _events;
    };
    return ReplaySubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_6__.Subject));

var ReplayEvent = /*@__PURE__*/ (function () {
    function ReplayEvent(time, value) {
        this.time = time;
        this.value = value;
    }
    return ReplayEvent;
}());
//# sourceMappingURL=ReplaySubject.js.map


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "observeOn": () => /* binding */ observeOn,
/* harmony export */   "ObserveOnOperator": () => /* binding */ ObserveOnOperator,
/* harmony export */   "ObserveOnSubscriber": () => /* binding */ ObserveOnSubscriber,
/* harmony export */   "ObserveOnMessage": () => /* binding */ ObserveOnMessage
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _Notification__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(31);
/** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */



function observeOn(scheduler, delay) {
    if (delay === void 0) {
        delay = 0;
    }
    return function observeOnOperatorFunction(source) {
        return source.lift(new ObserveOnOperator(scheduler, delay));
    };
}
var ObserveOnOperator = /*@__PURE__*/ (function () {
    function ObserveOnOperator(scheduler, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        this.scheduler = scheduler;
        this.delay = delay;
    }
    ObserveOnOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, this.delay));
    };
    return ObserveOnOperator;
}());

var ObserveOnSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ObserveOnSubscriber, _super);
    function ObserveOnSubscriber(destination, scheduler, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        var _this = _super.call(this, destination) || this;
        _this.scheduler = scheduler;
        _this.delay = delay;
        return _this;
    }
    ObserveOnSubscriber.dispatch = function (arg) {
        var notification = arg.notification, destination = arg.destination;
        notification.observe(destination);
        this.unsubscribe();
    };
    ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
        var destination = this.destination;
        destination.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
    };
    ObserveOnSubscriber.prototype._next = function (value) {
        this.scheduleMessage(_Notification__WEBPACK_IMPORTED_MODULE_1__.Notification.createNext(value));
    };
    ObserveOnSubscriber.prototype._error = function (err) {
        this.scheduleMessage(_Notification__WEBPACK_IMPORTED_MODULE_1__.Notification.createError(err));
        this.unsubscribe();
    };
    ObserveOnSubscriber.prototype._complete = function () {
        this.scheduleMessage(_Notification__WEBPACK_IMPORTED_MODULE_1__.Notification.createComplete());
        this.unsubscribe();
    };
    return ObserveOnSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));

var ObserveOnMessage = /*@__PURE__*/ (function () {
    function ObserveOnMessage(notification, destination) {
        this.notification = notification;
        this.destination = destination;
    }
    return ObserveOnMessage;
}());

//# sourceMappingURL=observeOn.js.map


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NotificationKind": () => /* binding */ NotificationKind,
/* harmony export */   "Notification": () => /* binding */ Notification
/* harmony export */ });
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(38);
/* harmony import */ var _observable_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(32);
/* harmony import */ var _observable_throwError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(37);
/** PURE_IMPORTS_START _observable_empty,_observable_of,_observable_throwError PURE_IMPORTS_END */



var NotificationKind;
/*@__PURE__*/ (function (NotificationKind) {
    NotificationKind["NEXT"] = "N";
    NotificationKind["ERROR"] = "E";
    NotificationKind["COMPLETE"] = "C";
})(NotificationKind || (NotificationKind = {}));
var Notification = /*@__PURE__*/ (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    Notification.prototype.observe = function (observer) {
        switch (this.kind) {
            case 'N':
                return observer.next && observer.next(this.value);
            case 'E':
                return observer.error && observer.error(this.error);
            case 'C':
                return observer.complete && observer.complete();
        }
    };
    Notification.prototype.do = function (next, error, complete) {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return next && next(this.value);
            case 'E':
                return error && error(this.error);
            case 'C':
                return complete && complete();
        }
    };
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        if (nextOrObserver && typeof nextOrObserver.next === 'function') {
            return this.observe(nextOrObserver);
        }
        else {
            return this.do(nextOrObserver, error, complete);
        }
    };
    Notification.prototype.toObservable = function () {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return (0,_observable_of__WEBPACK_IMPORTED_MODULE_0__.of)(this.value);
            case 'E':
                return (0,_observable_throwError__WEBPACK_IMPORTED_MODULE_1__.throwError)(this.error);
            case 'C':
                return (0,_observable_empty__WEBPACK_IMPORTED_MODULE_2__.empty)();
        }
        throw new Error('unexpected notification kind value');
    };
    Notification.createNext = function (value) {
        if (typeof value !== 'undefined') {
            return new Notification('N', value);
        }
        return Notification.undefinedValueNotification;
    };
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    Notification.createComplete = function () {
        return Notification.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    Notification.undefinedValueNotification = new Notification('N', undefined);
    return Notification;
}());

//# sourceMappingURL=Notification.js.map


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "of": () => /* binding */ of
/* harmony export */ });
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(35);
/* harmony import */ var _scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(34);
/** PURE_IMPORTS_START _util_isScheduler,_fromArray,_scheduled_scheduleArray PURE_IMPORTS_END */



function of() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = args[args.length - 1];
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_0__.isScheduler)(scheduler)) {
        args.pop();
        return (0,_scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_1__.scheduleArray)(args, scheduler);
    }
    else {
        return (0,_fromArray__WEBPACK_IMPORTED_MODULE_2__.fromArray)(args);
    }
}
//# sourceMappingURL=of.js.map


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isScheduler": () => /* binding */ isScheduler
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function isScheduler(value) {
    return value && typeof value.schedule === 'function';
}
//# sourceMappingURL=isScheduler.js.map


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleArray": () => /* binding */ scheduleArray
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */


function scheduleArray(input, scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var sub = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
        var i = 0;
        sub.add(scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
                return;
            }
            subscriber.next(input[i++]);
            if (!subscriber.closed) {
                sub.add(this.schedule());
            }
        }));
        return sub;
    });
}
//# sourceMappingURL=scheduleArray.js.map


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromArray": () => /* binding */ fromArray
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _util_subscribeToArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(36);
/* harmony import */ var _scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(34);
/** PURE_IMPORTS_START _Observable,_util_subscribeToArray,_scheduled_scheduleArray PURE_IMPORTS_END */



function fromArray(input, scheduler) {
    if (!scheduler) {
        return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable((0,_util_subscribeToArray__WEBPACK_IMPORTED_MODULE_1__.subscribeToArray)(input));
    }
    else {
        return (0,_scheduled_scheduleArray__WEBPACK_IMPORTED_MODULE_2__.scheduleArray)(input, scheduler);
    }
}
//# sourceMappingURL=fromArray.js.map


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeToArray": () => /* binding */ subscribeToArray
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var subscribeToArray = function (array) {
    return function (subscriber) {
        for (var i = 0, len = array.length; i < len && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    };
};
//# sourceMappingURL=subscribeToArray.js.map


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throwError": () => /* binding */ throwError
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */

function throwError(error, scheduler) {
    if (!scheduler) {
        return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return subscriber.error(error); });
    }
    else {
        return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return scheduler.schedule(dispatch, 0, { error: error, subscriber: subscriber }); });
    }
}
function dispatch(_a) {
    var error = _a.error, subscriber = _a.subscriber;
    subscriber.error(error);
}
//# sourceMappingURL=throwError.js.map


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EMPTY": () => /* binding */ EMPTY,
/* harmony export */   "empty": () => /* binding */ empty
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */

var EMPTY = /*@__PURE__*/ new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return subscriber.complete(); });
function empty(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : EMPTY;
}
function emptyScheduled(scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
}
//# sourceMappingURL=empty.js.map


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "queueScheduler": () => /* binding */ queueScheduler,
/* harmony export */   "queue": () => /* binding */ queue
/* harmony export */ });
/* harmony import */ var _QueueAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(43);
/* harmony import */ var _QueueScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(40);
/** PURE_IMPORTS_START _QueueAction,_QueueScheduler PURE_IMPORTS_END */


var queueScheduler = /*@__PURE__*/ new _QueueScheduler__WEBPACK_IMPORTED_MODULE_0__.QueueScheduler(_QueueAction__WEBPACK_IMPORTED_MODULE_1__.QueueAction);
var queue = queueScheduler;
//# sourceMappingURL=queue.js.map


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QueueScheduler": () => /* binding */ QueueScheduler
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(41);
/** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */


var QueueScheduler = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(QueueScheduler, _super);
    function QueueScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueueScheduler;
}(_AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__.AsyncScheduler));

//# sourceMappingURL=QueueScheduler.js.map


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsyncScheduler": () => /* binding */ AsyncScheduler
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Scheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42);
/** PURE_IMPORTS_START tslib,_Scheduler PURE_IMPORTS_END */


var AsyncScheduler = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AsyncScheduler, _super);
    function AsyncScheduler(SchedulerAction, now) {
        if (now === void 0) {
            now = _Scheduler__WEBPACK_IMPORTED_MODULE_1__.Scheduler.now;
        }
        var _this = _super.call(this, SchedulerAction, function () {
            if (AsyncScheduler.delegate && AsyncScheduler.delegate !== _this) {
                return AsyncScheduler.delegate.now();
            }
            else {
                return now();
            }
        }) || this;
        _this.actions = [];
        _this.active = false;
        _this.scheduled = undefined;
        return _this;
    }
    AsyncScheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) {
            delay = 0;
        }
        if (AsyncScheduler.delegate && AsyncScheduler.delegate !== this) {
            return AsyncScheduler.delegate.schedule(work, delay, state);
        }
        else {
            return _super.prototype.schedule.call(this, work, delay, state);
        }
    };
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
/* 42 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Scheduler": () => /* binding */ Scheduler
/* harmony export */ });
var Scheduler = /*@__PURE__*/ (function () {
    function Scheduler(SchedulerAction, now) {
        if (now === void 0) {
            now = Scheduler.now;
        }
        this.SchedulerAction = SchedulerAction;
        this.now = now;
    }
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) {
            delay = 0;
        }
        return new this.SchedulerAction(this, work).schedule(state, delay);
    };
    Scheduler.now = function () { return Date.now(); };
    return Scheduler;
}());

//# sourceMappingURL=Scheduler.js.map


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "QueueAction": () => /* binding */ QueueAction
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(44);
/** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */


var QueueAction = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(QueueAction, _super);
    function QueueAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    QueueAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) {
            delay = 0;
        }
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
        if (delay === void 0) {
            delay = 0;
        }
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        return scheduler.flush(this);
    };
    return QueueAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_1__.AsyncAction));

//# sourceMappingURL=QueueAction.js.map


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsyncAction": () => /* binding */ AsyncAction
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Action__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(45);
/** PURE_IMPORTS_START tslib,_Action PURE_IMPORTS_END */


var AsyncAction = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.pending = false;
        return _this;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) {
            delay = 0;
        }
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
    AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        return setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        if (delay !== null && this.delay === delay && this.pending === false) {
            return id;
        }
        clearInterval(id);
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
    AsyncAction.prototype._execute = function (state, delay) {
        var errored = false;
        var errorValue = undefined;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = !!e && e || new Error(e);
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype._unsubscribe = function () {
        var id = this.id;
        var scheduler = this.scheduler;
        var actions = scheduler.actions;
        var index = actions.indexOf(this);
        this.work = null;
        this.state = null;
        this.pending = false;
        this.scheduler = null;
        if (index !== -1) {
            actions.splice(index, 1);
        }
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, null);
        }
        this.delay = null;
    };
    return AsyncAction;
}(_Action__WEBPACK_IMPORTED_MODULE_1__.Action));

//# sourceMappingURL=AsyncAction.js.map


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Action": () => /* binding */ Action
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */


var Action = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(Action, _super);
    function Action(scheduler, work) {
        return _super.call(this) || this;
    }
    Action.prototype.schedule = function (state, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        return this;
    };
    return Action;
}(_Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription));

//# sourceMappingURL=Action.js.map


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsyncSubject": () => /* binding */ AsyncSubject
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START tslib,_Subject,_Subscription PURE_IMPORTS_END */



var AsyncSubject = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AsyncSubject, _super);
    function AsyncSubject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.value = null;
        _this.hasNext = false;
        _this.hasCompleted = false;
        return _this;
    }
    AsyncSubject.prototype._subscribe = function (subscriber) {
        if (this.hasError) {
            subscriber.error(this.thrownError);
            return _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription.EMPTY;
        }
        else if (this.hasCompleted && this.hasNext) {
            subscriber.next(this.value);
            subscriber.complete();
            return _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription.EMPTY;
        }
        return _super.prototype._subscribe.call(this, subscriber);
    };
    AsyncSubject.prototype.next = function (value) {
        if (!this.hasCompleted) {
            this.value = value;
            this.hasNext = true;
        }
    };
    AsyncSubject.prototype.error = function (error) {
        if (!this.hasCompleted) {
            _super.prototype.error.call(this, error);
        }
    };
    AsyncSubject.prototype.complete = function () {
        this.hasCompleted = true;
        if (this.hasNext) {
            _super.prototype.next.call(this, this.value);
        }
        _super.prototype.complete.call(this);
    };
    return AsyncSubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_2__.Subject));

//# sourceMappingURL=AsyncSubject.js.map


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "asapScheduler": () => /* binding */ asapScheduler,
/* harmony export */   "asap": () => /* binding */ asap
/* harmony export */ });
/* harmony import */ var _AsapAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(49);
/* harmony import */ var _AsapScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(48);
/** PURE_IMPORTS_START _AsapAction,_AsapScheduler PURE_IMPORTS_END */


var asapScheduler = /*@__PURE__*/ new _AsapScheduler__WEBPACK_IMPORTED_MODULE_0__.AsapScheduler(_AsapAction__WEBPACK_IMPORTED_MODULE_1__.AsapAction);
var asap = asapScheduler;
//# sourceMappingURL=asap.js.map


/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsapScheduler": () => /* binding */ AsapScheduler
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(41);
/** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */


var AsapScheduler = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AsapScheduler, _super);
    function AsapScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AsapScheduler.prototype.flush = function (action) {
        this.active = true;
        this.scheduled = undefined;
        var actions = this.actions;
        var error;
        var index = -1;
        var count = actions.length;
        action = action || actions.shift();
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
/* 49 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AsapAction": () => /* binding */ AsapAction
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _util_Immediate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(50);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(44);
/** PURE_IMPORTS_START tslib,_util_Immediate,_AsyncAction PURE_IMPORTS_END */



var AsapAction = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AsapAction, _super);
    function AsapAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = _util_Immediate__WEBPACK_IMPORTED_MODULE_1__.Immediate.setImmediate(scheduler.flush.bind(scheduler, null)));
    };
    AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            _util_Immediate__WEBPACK_IMPORTED_MODULE_1__.Immediate.clearImmediate(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    };
    return AsapAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_2__.AsyncAction));

//# sourceMappingURL=AsapAction.js.map


/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Immediate": () => /* binding */ Immediate,
/* harmony export */   "TestTools": () => /* binding */ TestTools
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var nextHandle = 1;
var RESOLVED = /*@__PURE__*/ (function () { return /*@__PURE__*/ Promise.resolve(); })();
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
        RESOLVED.then(function () { return findAndClearHandle(handle) && cb(); });
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
/* 51 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "asyncScheduler": () => /* binding */ asyncScheduler,
/* harmony export */   "async": () => /* binding */ async
/* harmony export */ });
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(44);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(41);
/** PURE_IMPORTS_START _AsyncAction,_AsyncScheduler PURE_IMPORTS_END */


var asyncScheduler = /*@__PURE__*/ new _AsyncScheduler__WEBPACK_IMPORTED_MODULE_0__.AsyncScheduler(_AsyncAction__WEBPACK_IMPORTED_MODULE_1__.AsyncAction);
var async = asyncScheduler;
//# sourceMappingURL=async.js.map


/***/ }),
/* 52 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "animationFrameScheduler": () => /* binding */ animationFrameScheduler,
/* harmony export */   "animationFrame": () => /* binding */ animationFrame
/* harmony export */ });
/* harmony import */ var _AnimationFrameAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(54);
/* harmony import */ var _AnimationFrameScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(53);
/** PURE_IMPORTS_START _AnimationFrameAction,_AnimationFrameScheduler PURE_IMPORTS_END */


var animationFrameScheduler = /*@__PURE__*/ new _AnimationFrameScheduler__WEBPACK_IMPORTED_MODULE_0__.AnimationFrameScheduler(_AnimationFrameAction__WEBPACK_IMPORTED_MODULE_1__.AnimationFrameAction);
var animationFrame = animationFrameScheduler;
//# sourceMappingURL=animationFrame.js.map


/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnimationFrameScheduler": () => /* binding */ AnimationFrameScheduler
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(41);
/** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */


var AnimationFrameScheduler = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AnimationFrameScheduler, _super);
    function AnimationFrameScheduler() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    AnimationFrameScheduler.prototype.flush = function (action) {
        this.active = true;
        this.scheduled = undefined;
        var actions = this.actions;
        var error;
        var index = -1;
        var count = actions.length;
        action = action || actions.shift();
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
/* 54 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AnimationFrameAction": () => /* binding */ AnimationFrameAction
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(44);
/** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */


var AnimationFrameAction = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AnimationFrameAction, _super);
    function AnimationFrameAction(scheduler, work) {
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        return _this;
    }
    AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        if (delay !== null && delay > 0) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        scheduler.actions.push(this);
        return scheduler.scheduled || (scheduler.scheduled = requestAnimationFrame(function () { return scheduler.flush(null); }));
    };
    AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
        }
        if (scheduler.actions.length === 0) {
            cancelAnimationFrame(id);
            scheduler.scheduled = undefined;
        }
        return undefined;
    };
    return AnimationFrameAction;
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_1__.AsyncAction));

//# sourceMappingURL=AnimationFrameAction.js.map


/***/ }),
/* 55 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "VirtualTimeScheduler": () => /* binding */ VirtualTimeScheduler,
/* harmony export */   "VirtualAction": () => /* binding */ VirtualAction
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _AsyncAction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(44);
/* harmony import */ var _AsyncScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(41);
/** PURE_IMPORTS_START tslib,_AsyncAction,_AsyncScheduler PURE_IMPORTS_END */



var VirtualTimeScheduler = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(VirtualTimeScheduler, _super);
    function VirtualTimeScheduler(SchedulerAction, maxFrames) {
        if (SchedulerAction === void 0) {
            SchedulerAction = VirtualAction;
        }
        if (maxFrames === void 0) {
            maxFrames = Number.POSITIVE_INFINITY;
        }
        var _this = _super.call(this, SchedulerAction, function () { return _this.frame; }) || this;
        _this.maxFrames = maxFrames;
        _this.frame = 0;
        _this.index = -1;
        return _this;
    }
    VirtualTimeScheduler.prototype.flush = function () {
        var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
        var error, action;
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

var VirtualAction = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(VirtualAction, _super);
    function VirtualAction(scheduler, work, index) {
        if (index === void 0) {
            index = scheduler.index += 1;
        }
        var _this = _super.call(this, scheduler, work) || this;
        _this.scheduler = scheduler;
        _this.work = work;
        _this.index = index;
        _this.active = true;
        _this.index = scheduler.index = index;
        return _this;
    }
    VirtualAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        if (!this.id) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.active = false;
        var action = new VirtualAction(this.scheduler, this.work);
        this.add(action);
        return action.schedule(state, delay);
    };
    VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
        this.delay = scheduler.frame + delay;
        var actions = scheduler.actions;
        actions.push(this);
        actions.sort(VirtualAction.sortActions);
        return true;
    };
    VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) {
            delay = 0;
        }
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
}(_AsyncAction__WEBPACK_IMPORTED_MODULE_2__.AsyncAction));

//# sourceMappingURL=VirtualTimeScheduler.js.map


/***/ }),
/* 56 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "noop": () => /* binding */ noop
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function noop() { }
//# sourceMappingURL=noop.js.map


/***/ }),
/* 57 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isObservable": () => /* binding */ isObservable
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */

function isObservable(obj) {
    return !!obj && (obj instanceof _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable || (typeof obj.lift === 'function' && typeof obj.subscribe === 'function'));
}
//# sourceMappingURL=isObservable.js.map


/***/ }),
/* 58 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ArgumentOutOfRangeError": () => /* binding */ ArgumentOutOfRangeError
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var ArgumentOutOfRangeErrorImpl = /*@__PURE__*/ (function () {
    function ArgumentOutOfRangeErrorImpl() {
        Error.call(this);
        this.message = 'argument out of range';
        this.name = 'ArgumentOutOfRangeError';
        return this;
    }
    ArgumentOutOfRangeErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
    return ArgumentOutOfRangeErrorImpl;
})();
var ArgumentOutOfRangeError = ArgumentOutOfRangeErrorImpl;
//# sourceMappingURL=ArgumentOutOfRangeError.js.map


/***/ }),
/* 59 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EmptyError": () => /* binding */ EmptyError
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var EmptyErrorImpl = /*@__PURE__*/ (function () {
    function EmptyErrorImpl() {
        Error.call(this);
        this.message = 'no elements in sequence';
        this.name = 'EmptyError';
        return this;
    }
    EmptyErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
    return EmptyErrorImpl;
})();
var EmptyError = EmptyErrorImpl;
//# sourceMappingURL=EmptyError.js.map


/***/ }),
/* 60 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TimeoutError": () => /* binding */ TimeoutError
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var TimeoutErrorImpl = /*@__PURE__*/ (function () {
    function TimeoutErrorImpl() {
        Error.call(this);
        this.message = 'Timeout has occurred';
        this.name = 'TimeoutError';
        return this;
    }
    TimeoutErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
    return TimeoutErrorImpl;
})();
var TimeoutError = TimeoutErrorImpl;
//# sourceMappingURL=TimeoutError.js.map


/***/ }),
/* 61 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindCallback": () => /* binding */ bindCallback
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(46);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/* harmony import */ var _util_canReportError__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(18);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_canReportError,_util_isArray,_util_isScheduler PURE_IMPORTS_END */






function bindCallback(callbackFunc, resultSelector, scheduler) {
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
                return bindCallback(callbackFunc, scheduler).apply(void 0, args).pipe((0,_operators_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (args) { return (0,_util_isArray__WEBPACK_IMPORTED_MODULE_2__.isArray)(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
            };
        }
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var context = this;
        var subject;
        var params = {
            context: context,
            subject: subject,
            callbackFunc: callbackFunc,
            scheduler: scheduler,
        };
        return new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(function (subscriber) {
            if (!scheduler) {
                if (!subject) {
                    subject = new _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__.AsyncSubject();
                    var handler = function () {
                        var innerArgs = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            innerArgs[_i] = arguments[_i];
                        }
                        subject.next(innerArgs.length <= 1 ? innerArgs[0] : innerArgs);
                        subject.complete();
                    };
                    try {
                        callbackFunc.apply(context, args.concat([handler]));
                    }
                    catch (err) {
                        if ((0,_util_canReportError__WEBPACK_IMPORTED_MODULE_5__.canReportError)(subject)) {
                            subject.error(err);
                        }
                        else {
                            console.warn(err);
                        }
                    }
                }
                return subject.subscribe(subscriber);
            }
            else {
                var state = {
                    args: args, subscriber: subscriber, params: params,
                };
                return scheduler.schedule(dispatch, 0, state);
            }
        });
    };
}
function dispatch(state) {
    var _this = this;
    var self = this;
    var args = state.args, subscriber = state.subscriber, params = state.params;
    var callbackFunc = params.callbackFunc, context = params.context, scheduler = params.scheduler;
    var subject = params.subject;
    if (!subject) {
        subject = params.subject = new _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__.AsyncSubject();
        var handler = function () {
            var innerArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                innerArgs[_i] = arguments[_i];
            }
            var value = innerArgs.length <= 1 ? innerArgs[0] : innerArgs;
            _this.add(scheduler.schedule(dispatchNext, 0, { value: value, subject: subject }));
        };
        try {
            callbackFunc.apply(context, args.concat([handler]));
        }
        catch (err) {
            subject.error(err);
        }
    }
    this.add(subject.subscribe(subscriber));
}
function dispatchNext(state) {
    var value = state.value, subject = state.subject;
    subject.next(value);
    subject.complete();
}
function dispatchError(state) {
    var err = state.err, subject = state.subject;
    subject.error(err);
}
//# sourceMappingURL=bindCallback.js.map


/***/ }),
/* 62 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "map": () => /* binding */ map,
/* harmony export */   "MapOperator": () => /* binding */ MapOperator
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function map(project, thisArg) {
    return function mapOperation(source) {
        if (typeof project !== 'function') {
            throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
        }
        return source.lift(new MapOperator(project, thisArg));
    };
}
var MapOperator = /*@__PURE__*/ (function () {
    function MapOperator(project, thisArg) {
        this.project = project;
        this.thisArg = thisArg;
    }
    MapOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
    };
    return MapOperator;
}());

var MapSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(MapSubscriber, _super);
    function MapSubscriber(destination, project, thisArg) {
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.count = 0;
        _this.thisArg = thisArg || _this;
        return _this;
    }
    MapSubscriber.prototype._next = function (value) {
        var result;
        try {
            result = this.project.call(this.thisArg, value, this.count++);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return MapSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=map.js.map


/***/ }),
/* 63 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bindNodeCallback": () => /* binding */ bindNodeCallback
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(46);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/* harmony import */ var _util_canReportError__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(18);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
/** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_canReportError,_util_isScheduler,_util_isArray PURE_IMPORTS_END */






function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
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
                return bindNodeCallback(callbackFunc, scheduler).apply(void 0, args).pipe((0,_operators_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (args) { return (0,_util_isArray__WEBPACK_IMPORTED_MODULE_2__.isArray)(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
            };
        }
    }
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var params = {
            subject: undefined,
            args: args,
            callbackFunc: callbackFunc,
            scheduler: scheduler,
            context: this,
        };
        return new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(function (subscriber) {
            var context = params.context;
            var subject = params.subject;
            if (!scheduler) {
                if (!subject) {
                    subject = params.subject = new _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__.AsyncSubject();
                    var handler = function () {
                        var innerArgs = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            innerArgs[_i] = arguments[_i];
                        }
                        var err = innerArgs.shift();
                        if (err) {
                            subject.error(err);
                            return;
                        }
                        subject.next(innerArgs.length <= 1 ? innerArgs[0] : innerArgs);
                        subject.complete();
                    };
                    try {
                        callbackFunc.apply(context, args.concat([handler]));
                    }
                    catch (err) {
                        if ((0,_util_canReportError__WEBPACK_IMPORTED_MODULE_5__.canReportError)(subject)) {
                            subject.error(err);
                        }
                        else {
                            console.warn(err);
                        }
                    }
                }
                return subject.subscribe(subscriber);
            }
            else {
                return scheduler.schedule(dispatch, 0, { params: params, subscriber: subscriber, context: context });
            }
        });
    };
}
function dispatch(state) {
    var _this = this;
    var params = state.params, subscriber = state.subscriber, context = state.context;
    var callbackFunc = params.callbackFunc, args = params.args, scheduler = params.scheduler;
    var subject = params.subject;
    if (!subject) {
        subject = params.subject = new _AsyncSubject__WEBPACK_IMPORTED_MODULE_4__.AsyncSubject();
        var handler = function () {
            var innerArgs = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                innerArgs[_i] = arguments[_i];
            }
            var err = innerArgs.shift();
            if (err) {
                _this.add(scheduler.schedule(dispatchError, 0, { err: err, subject: subject }));
            }
            else {
                var value = innerArgs.length <= 1 ? innerArgs[0] : innerArgs;
                _this.add(scheduler.schedule(dispatchNext, 0, { value: value, subject: subject }));
            }
        };
        try {
            callbackFunc.apply(context, args.concat([handler]));
        }
        catch (err) {
            this.add(scheduler.schedule(dispatchError, 0, { err: err, subject: subject }));
        }
    }
    this.add(subject.subscribe(subscriber));
}
function dispatchNext(arg) {
    var value = arg.value, subject = arg.subject;
    subject.next(value);
    subject.complete();
}
function dispatchError(arg) {
    var err = arg.err, subject = arg.subject;
    subject.error(err);
}
//# sourceMappingURL=bindNodeCallback.js.map


/***/ }),
/* 64 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "combineLatest": () => /* binding */ combineLatest,
/* harmony export */   "CombineLatestOperator": () => /* binding */ CombineLatestOperator,
/* harmony export */   "CombineLatestSubscriber": () => /* binding */ CombineLatestSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(16);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(74);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(65);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(35);
/** PURE_IMPORTS_START tslib,_util_isScheduler,_util_isArray,_OuterSubscriber,_util_subscribeToResult,_fromArray PURE_IMPORTS_END */






var NONE = {};
function combineLatest() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var resultSelector = undefined;
    var scheduler = undefined;
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_0__.isScheduler)(observables[observables.length - 1])) {
        scheduler = observables.pop();
    }
    if (typeof observables[observables.length - 1] === 'function') {
        resultSelector = observables.pop();
    }
    if (observables.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_1__.isArray)(observables[0])) {
        observables = observables[0];
    }
    return (0,_fromArray__WEBPACK_IMPORTED_MODULE_2__.fromArray)(observables, scheduler).lift(new CombineLatestOperator(resultSelector));
}
var CombineLatestOperator = /*@__PURE__*/ (function () {
    function CombineLatestOperator(resultSelector) {
        this.resultSelector = resultSelector;
    }
    CombineLatestOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new CombineLatestSubscriber(subscriber, this.resultSelector));
    };
    return CombineLatestOperator;
}());

var CombineLatestSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_3__.__extends(CombineLatestSubscriber, _super);
    function CombineLatestSubscriber(destination, resultSelector) {
        var _this = _super.call(this, destination) || this;
        _this.resultSelector = resultSelector;
        _this.active = 0;
        _this.values = [];
        _this.observables = [];
        return _this;
    }
    CombineLatestSubscriber.prototype._next = function (observable) {
        this.values.push(NONE);
        this.observables.push(observable);
    };
    CombineLatestSubscriber.prototype._complete = function () {
        var observables = this.observables;
        var len = observables.length;
        if (len === 0) {
            this.destination.complete();
        }
        else {
            this.active = len;
            this.toRespond = len;
            for (var i = 0; i < len; i++) {
                var observable = observables[i];
                this.add((0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_4__.subscribeToResult)(this, observable, undefined, i));
            }
        }
    };
    CombineLatestSubscriber.prototype.notifyComplete = function (unused) {
        if ((this.active -= 1) === 0) {
            this.destination.complete();
        }
    };
    CombineLatestSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
        var values = this.values;
        var oldVal = values[outerIndex];
        var toRespond = !this.toRespond
            ? 0
            : oldVal === NONE ? --this.toRespond : this.toRespond;
        values[outerIndex] = innerValue;
        if (toRespond === 0) {
            if (this.resultSelector) {
                this._tryResultSelector(values);
            }
            else {
                this.destination.next(values.slice());
            }
        }
    };
    CombineLatestSubscriber.prototype._tryResultSelector = function (values) {
        var result;
        try {
            result = this.resultSelector.apply(this, values);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return CombineLatestSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_5__.OuterSubscriber));

//# sourceMappingURL=combineLatest.js.map


/***/ }),
/* 65 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeToResult": () => /* binding */ subscribeToResult
/* harmony export */ });
/* harmony import */ var _InnerSubscriber__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(66);
/* harmony import */ var _subscribeTo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/** PURE_IMPORTS_START _InnerSubscriber,_subscribeTo,_Observable PURE_IMPORTS_END */



function subscribeToResult(outerSubscriber, result, outerValue, outerIndex, innerSubscriber) {
    if (innerSubscriber === void 0) {
        innerSubscriber = new _InnerSubscriber__WEBPACK_IMPORTED_MODULE_0__.InnerSubscriber(outerSubscriber, outerValue, outerIndex);
    }
    if (innerSubscriber.closed) {
        return undefined;
    }
    if (result instanceof _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable) {
        return result.subscribe(innerSubscriber);
    }
    return (0,_subscribeTo__WEBPACK_IMPORTED_MODULE_2__.subscribeTo)(result)(innerSubscriber);
}
//# sourceMappingURL=subscribeToResult.js.map


/***/ }),
/* 66 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "InnerSubscriber": () => /* binding */ InnerSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


var InnerSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(InnerSubscriber, _super);
    function InnerSubscriber(parent, outerValue, outerIndex) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.outerValue = outerValue;
        _this.outerIndex = outerIndex;
        _this.index = 0;
        return _this;
    }
    InnerSubscriber.prototype._next = function (value) {
        this.parent.notifyNext(this.outerValue, value, this.outerIndex, this.index++, this);
    };
    InnerSubscriber.prototype._error = function (error) {
        this.parent.notifyError(error, this);
        this.unsubscribe();
    };
    InnerSubscriber.prototype._complete = function () {
        this.parent.notifyComplete(this);
        this.unsubscribe();
    };
    return InnerSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

//# sourceMappingURL=InnerSubscriber.js.map


/***/ }),
/* 67 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeTo": () => /* binding */ subscribeTo
/* harmony export */ });
/* harmony import */ var _subscribeToArray__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(36);
/* harmony import */ var _subscribeToPromise__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(71);
/* harmony import */ var _subscribeToIterable__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(73);
/* harmony import */ var _subscribeToObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(68);
/* harmony import */ var _isArrayLike__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(69);
/* harmony import */ var _isPromise__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(70);
/* harmony import */ var _isObject__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(17);
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(72);
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/** PURE_IMPORTS_START _subscribeToArray,_subscribeToPromise,_subscribeToIterable,_subscribeToObservable,_isArrayLike,_isPromise,_isObject,_symbol_iterator,_symbol_observable PURE_IMPORTS_END */









var subscribeTo = function (result) {
    if (!!result && typeof result[_symbol_observable__WEBPACK_IMPORTED_MODULE_0__.observable] === 'function') {
        return (0,_subscribeToObservable__WEBPACK_IMPORTED_MODULE_1__.subscribeToObservable)(result);
    }
    else if ((0,_isArrayLike__WEBPACK_IMPORTED_MODULE_2__.isArrayLike)(result)) {
        return (0,_subscribeToArray__WEBPACK_IMPORTED_MODULE_3__.subscribeToArray)(result);
    }
    else if ((0,_isPromise__WEBPACK_IMPORTED_MODULE_4__.isPromise)(result)) {
        return (0,_subscribeToPromise__WEBPACK_IMPORTED_MODULE_5__.subscribeToPromise)(result);
    }
    else if (!!result && typeof result[_symbol_iterator__WEBPACK_IMPORTED_MODULE_6__.iterator] === 'function') {
        return (0,_subscribeToIterable__WEBPACK_IMPORTED_MODULE_7__.subscribeToIterable)(result);
    }
    else {
        var value = (0,_isObject__WEBPACK_IMPORTED_MODULE_8__.isObject)(result) ? 'an invalid object' : "'" + result + "'";
        var msg = "You provided " + value + " where a stream was expected."
            + ' You can provide an Observable, Promise, Array, or Iterable.';
        throw new TypeError(msg);
    }
};
//# sourceMappingURL=subscribeTo.js.map


/***/ }),
/* 68 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeToObservable": () => /* binding */ subscribeToObservable
/* harmony export */ });
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */

var subscribeToObservable = function (obj) {
    return function (subscriber) {
        var obs = obj[_symbol_observable__WEBPACK_IMPORTED_MODULE_0__.observable]();
        if (typeof obs.subscribe !== 'function') {
            throw new TypeError('Provided object does not correctly implement Symbol.observable');
        }
        else {
            return obs.subscribe(subscriber);
        }
    };
};
//# sourceMappingURL=subscribeToObservable.js.map


/***/ }),
/* 69 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isArrayLike": () => /* binding */ isArrayLike
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
var isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });
//# sourceMappingURL=isArrayLike.js.map


/***/ }),
/* 70 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isPromise": () => /* binding */ isPromise
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function isPromise(value) {
    return !!value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
}
//# sourceMappingURL=isPromise.js.map


/***/ }),
/* 71 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeToPromise": () => /* binding */ subscribeToPromise
/* harmony export */ });
/* harmony import */ var _hostReportError__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(11);
/** PURE_IMPORTS_START _hostReportError PURE_IMPORTS_END */

var subscribeToPromise = function (promise) {
    return function (subscriber) {
        promise.then(function (value) {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, function (err) { return subscriber.error(err); })
            .then(null, _hostReportError__WEBPACK_IMPORTED_MODULE_0__.hostReportError);
        return subscriber;
    };
};
//# sourceMappingURL=subscribeToPromise.js.map


/***/ }),
/* 72 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSymbolIterator": () => /* binding */ getSymbolIterator,
/* harmony export */   "iterator": () => /* binding */ iterator,
/* harmony export */   "$$iterator": () => /* binding */ $$iterator
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
var iterator = /*@__PURE__*/ getSymbolIterator();
var $$iterator = iterator;
//# sourceMappingURL=iterator.js.map


/***/ }),
/* 73 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeToIterable": () => /* binding */ subscribeToIterable
/* harmony export */ });
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72);
/** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */

var subscribeToIterable = function (iterable) {
    return function (subscriber) {
        var iterator = iterable[_symbol_iterator__WEBPACK_IMPORTED_MODULE_0__.iterator]();
        do {
            var item = void 0;
            try {
                item = iterator.next();
            }
            catch (err) {
                subscriber.error(err);
                return subscriber;
            }
            if (item.done) {
                subscriber.complete();
                break;
            }
            subscriber.next(item.value);
            if (subscriber.closed) {
                break;
            }
        } while (true);
        if (typeof iterator.return === 'function') {
            subscriber.add(function () {
                if (iterator.return) {
                    iterator.return();
                }
            });
        }
        return subscriber;
    };
};
//# sourceMappingURL=subscribeToIterable.js.map


/***/ }),
/* 74 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "OuterSubscriber": () => /* binding */ OuterSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


var OuterSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(OuterSubscriber, _super);
    function OuterSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    OuterSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
        this.destination.next(innerValue);
    };
    OuterSubscriber.prototype.notifyError = function (error, innerSub) {
        this.destination.error(error);
    };
    OuterSubscriber.prototype.notifyComplete = function (innerSub) {
        this.destination.complete();
    };
    return OuterSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

//# sourceMappingURL=OuterSubscriber.js.map


/***/ }),
/* 75 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concat": () => /* binding */ concat
/* harmony export */ });
/* harmony import */ var _of__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32);
/* harmony import */ var _operators_concatAll__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(76);
/** PURE_IMPORTS_START _of,_operators_concatAll PURE_IMPORTS_END */


function concat() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    return (0,_operators_concatAll__WEBPACK_IMPORTED_MODULE_0__.concatAll)()(_of__WEBPACK_IMPORTED_MODULE_1__.of.apply(void 0, observables));
}
//# sourceMappingURL=concat.js.map


/***/ }),
/* 76 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatAll": () => /* binding */ concatAll
/* harmony export */ });
/* harmony import */ var _mergeAll__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(77);
/** PURE_IMPORTS_START _mergeAll PURE_IMPORTS_END */

function concatAll() {
    return (0,_mergeAll__WEBPACK_IMPORTED_MODULE_0__.mergeAll)(1);
}
//# sourceMappingURL=concatAll.js.map


/***/ }),
/* 77 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeAll": () => /* binding */ mergeAll
/* harmony export */ });
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(78);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);
/** PURE_IMPORTS_START _mergeMap,_util_identity PURE_IMPORTS_END */


function mergeAll(concurrent) {
    if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
    }
    return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_0__.mergeMap)(_util_identity__WEBPACK_IMPORTED_MODULE_1__.identity, concurrent);
}
//# sourceMappingURL=mergeAll.js.map


/***/ }),
/* 78 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeMap": () => /* binding */ mergeMap,
/* harmony export */   "MergeMapOperator": () => /* binding */ MergeMapOperator,
/* harmony export */   "MergeMapSubscriber": () => /* binding */ MergeMapSubscriber,
/* harmony export */   "flatMap": () => /* binding */ flatMap
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(79);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_map,_observable_from,_innerSubscribe PURE_IMPORTS_END */




function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
    }
    if (typeof resultSelector === 'function') {
        return function (source) { return source.pipe(mergeMap(function (a, i) { return (0,_observable_from__WEBPACK_IMPORTED_MODULE_0__.from)(project(a, i)).pipe((0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (b, ii) { return resultSelector(a, b, i, ii); })); }, concurrent)); };
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return function (source) { return source.lift(new MergeMapOperator(project, concurrent)); };
}
var MergeMapOperator = /*@__PURE__*/ (function () {
    function MergeMapOperator(project, concurrent) {
        if (concurrent === void 0) {
            concurrent = Number.POSITIVE_INFINITY;
        }
        this.project = project;
        this.concurrent = concurrent;
    }
    MergeMapOperator.prototype.call = function (observer, source) {
        return source.subscribe(new MergeMapSubscriber(observer, this.project, this.concurrent));
    };
    return MergeMapOperator;
}());

var MergeMapSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(MergeMapSubscriber, _super);
    function MergeMapSubscriber(destination, project, concurrent) {
        if (concurrent === void 0) {
            concurrent = Number.POSITIVE_INFINITY;
        }
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.concurrent = concurrent;
        _this.hasCompleted = false;
        _this.buffer = [];
        _this.active = 0;
        _this.index = 0;
        return _this;
    }
    MergeMapSubscriber.prototype._next = function (value) {
        if (this.active < this.concurrent) {
            this._tryNext(value);
        }
        else {
            this.buffer.push(value);
        }
    };
    MergeMapSubscriber.prototype._tryNext = function (value) {
        var result;
        var index = this.index++;
        try {
            result = this.project(value, index);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.active++;
        this._innerSub(result);
    };
    MergeMapSubscriber.prototype._innerSub = function (ish) {
        var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleInnerSubscriber(this);
        var destination = this.destination;
        destination.add(innerSubscriber);
        var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.innerSubscribe)(ish, innerSubscriber);
        if (innerSubscription !== innerSubscriber) {
            destination.add(innerSubscription);
        }
    };
    MergeMapSubscriber.prototype._complete = function () {
        this.hasCompleted = true;
        if (this.active === 0 && this.buffer.length === 0) {
            this.destination.complete();
        }
        this.unsubscribe();
    };
    MergeMapSubscriber.prototype.notifyNext = function (innerValue) {
        this.destination.next(innerValue);
    };
    MergeMapSubscriber.prototype.notifyComplete = function () {
        var buffer = this.buffer;
        this.active--;
        if (buffer.length > 0) {
            this._next(buffer.shift());
        }
        else if (this.active === 0 && this.hasCompleted) {
            this.destination.complete();
        }
    };
    return MergeMapSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleOuterSubscriber));

var flatMap = mergeMap;
//# sourceMappingURL=mergeMap.js.map


/***/ }),
/* 79 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "from": () => /* binding */ from
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _util_subscribeTo__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(67);
/* harmony import */ var _scheduled_scheduled__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(80);
/** PURE_IMPORTS_START _Observable,_util_subscribeTo,_scheduled_scheduled PURE_IMPORTS_END */



function from(input, scheduler) {
    if (!scheduler) {
        if (input instanceof _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable) {
            return input;
        }
        return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable((0,_util_subscribeTo__WEBPACK_IMPORTED_MODULE_1__.subscribeTo)(input));
    }
    else {
        return (0,_scheduled_scheduled__WEBPACK_IMPORTED_MODULE_2__.scheduled)(input, scheduler);
    }
}
//# sourceMappingURL=from.js.map


/***/ }),
/* 80 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduled": () => /* binding */ scheduled
/* harmony export */ });
/* harmony import */ var _scheduleObservable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82);
/* harmony import */ var _schedulePromise__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(83);
/* harmony import */ var _scheduleArray__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(34);
/* harmony import */ var _scheduleIterable__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(85);
/* harmony import */ var _util_isInteropObservable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(81);
/* harmony import */ var _util_isPromise__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(70);
/* harmony import */ var _util_isArrayLike__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(69);
/* harmony import */ var _util_isIterable__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(84);
/** PURE_IMPORTS_START _scheduleObservable,_schedulePromise,_scheduleArray,_scheduleIterable,_util_isInteropObservable,_util_isPromise,_util_isArrayLike,_util_isIterable PURE_IMPORTS_END */








function scheduled(input, scheduler) {
    if (input != null) {
        if ((0,_util_isInteropObservable__WEBPACK_IMPORTED_MODULE_0__.isInteropObservable)(input)) {
            return (0,_scheduleObservable__WEBPACK_IMPORTED_MODULE_1__.scheduleObservable)(input, scheduler);
        }
        else if ((0,_util_isPromise__WEBPACK_IMPORTED_MODULE_2__.isPromise)(input)) {
            return (0,_schedulePromise__WEBPACK_IMPORTED_MODULE_3__.schedulePromise)(input, scheduler);
        }
        else if ((0,_util_isArrayLike__WEBPACK_IMPORTED_MODULE_4__.isArrayLike)(input)) {
            return (0,_scheduleArray__WEBPACK_IMPORTED_MODULE_5__.scheduleArray)(input, scheduler);
        }
        else if ((0,_util_isIterable__WEBPACK_IMPORTED_MODULE_6__.isIterable)(input) || typeof input === 'string') {
            return (0,_scheduleIterable__WEBPACK_IMPORTED_MODULE_7__.scheduleIterable)(input, scheduler);
        }
    }
    throw new TypeError((input !== null && typeof input || input) + ' is not observable');
}
//# sourceMappingURL=scheduled.js.map


/***/ }),
/* 81 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isInteropObservable": () => /* binding */ isInteropObservable
/* harmony export */ });
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(19);
/** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */

function isInteropObservable(input) {
    return input && typeof input[_symbol_observable__WEBPACK_IMPORTED_MODULE_0__.observable] === 'function';
}
//# sourceMappingURL=isInteropObservable.js.map


/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleObservable": () => /* binding */ scheduleObservable
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/* harmony import */ var _symbol_observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(19);
/** PURE_IMPORTS_START _Observable,_Subscription,_symbol_observable PURE_IMPORTS_END */



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
/* 83 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "schedulePromise": () => /* binding */ schedulePromise
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */


function schedulePromise(input, scheduler) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var sub = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
        sub.add(scheduler.schedule(function () {
            return input.then(function (value) {
                sub.add(scheduler.schedule(function () {
                    subscriber.next(value);
                    sub.add(scheduler.schedule(function () { return subscriber.complete(); }));
                }));
            }, function (err) {
                sub.add(scheduler.schedule(function () { return subscriber.error(err); }));
            });
        }));
        return sub;
    });
}
//# sourceMappingURL=schedulePromise.js.map


/***/ }),
/* 84 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isIterable": () => /* binding */ isIterable
/* harmony export */ });
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72);
/** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */

function isIterable(input) {
    return input && typeof input[_symbol_iterator__WEBPACK_IMPORTED_MODULE_0__.iterator] === 'function';
}
//# sourceMappingURL=isIterable.js.map


/***/ }),
/* 85 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scheduleIterable": () => /* binding */ scheduleIterable
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/* harmony import */ var _symbol_iterator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(72);
/** PURE_IMPORTS_START _Observable,_Subscription,_symbol_iterator PURE_IMPORTS_END */



function scheduleIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var sub = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
        var iterator;
        sub.add(function () {
            if (iterator && typeof iterator.return === 'function') {
                iterator.return();
            }
        });
        sub.add(scheduler.schedule(function () {
            iterator = input[_symbol_iterator__WEBPACK_IMPORTED_MODULE_2__.iterator]();
            sub.add(scheduler.schedule(function () {
                if (subscriber.closed) {
                    return;
                }
                var value;
                var done;
                try {
                    var result = iterator.next();
                    value = result.value;
                    done = result.done;
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                    this.schedule();
                }
            }));
        }));
        return sub;
    });
}
//# sourceMappingURL=scheduleIterable.js.map


/***/ }),
/* 86 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SimpleInnerSubscriber": () => /* binding */ SimpleInnerSubscriber,
/* harmony export */   "ComplexInnerSubscriber": () => /* binding */ ComplexInnerSubscriber,
/* harmony export */   "SimpleOuterSubscriber": () => /* binding */ SimpleOuterSubscriber,
/* harmony export */   "ComplexOuterSubscriber": () => /* binding */ ComplexOuterSubscriber,
/* harmony export */   "innerSubscribe": () => /* binding */ innerSubscribe
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _util_subscribeTo__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(67);
/** PURE_IMPORTS_START tslib,_Subscriber,_Observable,_util_subscribeTo PURE_IMPORTS_END */




var SimpleInnerSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SimpleInnerSubscriber, _super);
    function SimpleInnerSubscriber(parent) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        return _this;
    }
    SimpleInnerSubscriber.prototype._next = function (value) {
        this.parent.notifyNext(value);
    };
    SimpleInnerSubscriber.prototype._error = function (error) {
        this.parent.notifyError(error);
        this.unsubscribe();
    };
    SimpleInnerSubscriber.prototype._complete = function () {
        this.parent.notifyComplete();
        this.unsubscribe();
    };
    return SimpleInnerSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

var ComplexInnerSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ComplexInnerSubscriber, _super);
    function ComplexInnerSubscriber(parent, outerValue, outerIndex) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.outerValue = outerValue;
        _this.outerIndex = outerIndex;
        return _this;
    }
    ComplexInnerSubscriber.prototype._next = function (value) {
        this.parent.notifyNext(this.outerValue, value, this.outerIndex, this);
    };
    ComplexInnerSubscriber.prototype._error = function (error) {
        this.parent.notifyError(error);
        this.unsubscribe();
    };
    ComplexInnerSubscriber.prototype._complete = function () {
        this.parent.notifyComplete(this);
        this.unsubscribe();
    };
    return ComplexInnerSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

var SimpleOuterSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SimpleOuterSubscriber, _super);
    function SimpleOuterSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SimpleOuterSubscriber.prototype.notifyNext = function (innerValue) {
        this.destination.next(innerValue);
    };
    SimpleOuterSubscriber.prototype.notifyError = function (err) {
        this.destination.error(err);
    };
    SimpleOuterSubscriber.prototype.notifyComplete = function () {
        this.destination.complete();
    };
    return SimpleOuterSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

var ComplexOuterSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ComplexOuterSubscriber, _super);
    function ComplexOuterSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ComplexOuterSubscriber.prototype.notifyNext = function (_outerValue, innerValue, _outerIndex, _innerSub) {
        this.destination.next(innerValue);
    };
    ComplexOuterSubscriber.prototype.notifyError = function (error) {
        this.destination.error(error);
    };
    ComplexOuterSubscriber.prototype.notifyComplete = function (_innerSub) {
        this.destination.complete();
    };
    return ComplexOuterSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

function innerSubscribe(result, innerSubscriber) {
    if (innerSubscriber.closed) {
        return undefined;
    }
    if (result instanceof _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable) {
        return result.subscribe(innerSubscriber);
    }
    return (0,_util_subscribeTo__WEBPACK_IMPORTED_MODULE_3__.subscribeTo)(result)(innerSubscriber);
}
//# sourceMappingURL=innerSubscribe.js.map


/***/ }),
/* 87 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defer": () => /* binding */ defer
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(38);
/** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */



function defer(observableFactory) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var input;
        try {
            input = observableFactory();
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        var source = input ? (0,_from__WEBPACK_IMPORTED_MODULE_1__.from)(input) : (0,_empty__WEBPACK_IMPORTED_MODULE_2__.empty)();
        return source.subscribe(subscriber);
    });
}
//# sourceMappingURL=defer.js.map


/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "forkJoin": () => /* binding */ forkJoin
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(62);
/* harmony import */ var _util_isObject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(17);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(79);
/** PURE_IMPORTS_START _Observable,_util_isArray,_operators_map,_util_isObject,_from PURE_IMPORTS_END */





function forkJoin() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    if (sources.length === 1) {
        var first_1 = sources[0];
        if ((0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(first_1)) {
            return forkJoinInternal(first_1, null);
        }
        if ((0,_util_isObject__WEBPACK_IMPORTED_MODULE_1__.isObject)(first_1) && Object.getPrototypeOf(first_1) === Object.prototype) {
            var keys = Object.keys(first_1);
            return forkJoinInternal(keys.map(function (key) { return first_1[key]; }), keys);
        }
    }
    if (typeof sources[sources.length - 1] === 'function') {
        var resultSelector_1 = sources.pop();
        sources = (sources.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(sources[0])) ? sources[0] : sources;
        return forkJoinInternal(sources, null).pipe((0,_operators_map__WEBPACK_IMPORTED_MODULE_2__.map)(function (args) { return resultSelector_1.apply(void 0, args); }));
    }
    return forkJoinInternal(sources, null);
}
function forkJoinInternal(sources, keys) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(function (subscriber) {
        var len = sources.length;
        if (len === 0) {
            subscriber.complete();
            return;
        }
        var values = new Array(len);
        var completed = 0;
        var emitted = 0;
        var _loop_1 = function (i) {
            var source = (0,_from__WEBPACK_IMPORTED_MODULE_4__.from)(sources[i]);
            var hasValue = false;
            subscriber.add(source.subscribe({
                next: function (value) {
                    if (!hasValue) {
                        hasValue = true;
                        emitted++;
                    }
                    values[i] = value;
                },
                error: function (err) { return subscriber.error(err); },
                complete: function () {
                    completed++;
                    if (completed === len || !hasValue) {
                        if (emitted === len) {
                            subscriber.next(keys ?
                                keys.reduce(function (result, key, i) { return (result[key] = values[i], result); }, {}) :
                                values);
                        }
                        subscriber.complete();
                    }
                }
            }));
        };
        for (var i = 0; i < len; i++) {
            _loop_1(i);
        }
    });
}
//# sourceMappingURL=forkJoin.js.map


/***/ }),
/* 89 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromEvent": () => /* binding */ fromEvent
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */




var toString = /*@__PURE__*/ (function () { return Object.prototype.toString; })();
function fromEvent(target, eventName, options, resultSelector) {
    if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_0__.isFunction)(options)) {
        resultSelector = options;
        options = undefined;
    }
    if (resultSelector) {
        return fromEvent(target, eventName, options).pipe((0,_operators_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (args) { return (0,_util_isArray__WEBPACK_IMPORTED_MODULE_2__.isArray)(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(function (subscriber) {
        function handler(e) {
            if (arguments.length > 1) {
                subscriber.next(Array.prototype.slice.call(arguments));
            }
            else {
                subscriber.next(e);
            }
        }
        setupSubscription(target, eventName, handler, subscriber, options);
    });
}
function setupSubscription(sourceObj, eventName, handler, subscriber, options) {
    var unsubscribe;
    if (isEventTarget(sourceObj)) {
        var source_1 = sourceObj;
        sourceObj.addEventListener(eventName, handler, options);
        unsubscribe = function () { return source_1.removeEventListener(eventName, handler, options); };
    }
    else if (isJQueryStyleEventEmitter(sourceObj)) {
        var source_2 = sourceObj;
        sourceObj.on(eventName, handler);
        unsubscribe = function () { return source_2.off(eventName, handler); };
    }
    else if (isNodeStyleEventEmitter(sourceObj)) {
        var source_3 = sourceObj;
        sourceObj.addListener(eventName, handler);
        unsubscribe = function () { return source_3.removeListener(eventName, handler); };
    }
    else if (sourceObj && sourceObj.length) {
        for (var i = 0, len = sourceObj.length; i < len; i++) {
            setupSubscription(sourceObj[i], eventName, handler, subscriber, options);
        }
    }
    else {
        throw new TypeError('Invalid event target');
    }
    subscriber.add(unsubscribe);
}
function isNodeStyleEventEmitter(sourceObj) {
    return sourceObj && typeof sourceObj.addListener === 'function' && typeof sourceObj.removeListener === 'function';
}
function isJQueryStyleEventEmitter(sourceObj) {
    return sourceObj && typeof sourceObj.on === 'function' && typeof sourceObj.off === 'function';
}
function isEventTarget(sourceObj) {
    return sourceObj && typeof sourceObj.addEventListener === 'function' && typeof sourceObj.removeEventListener === 'function';
}
//# sourceMappingURL=fromEvent.js.map


/***/ }),
/* 90 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "fromEventPattern": () => /* binding */ fromEventPattern
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(16);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(14);
/* harmony import */ var _operators_map__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(62);
/** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */




function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
        return fromEventPattern(addHandler, removeHandler).pipe((0,_operators_map__WEBPACK_IMPORTED_MODULE_0__.map)(function (args) { return (0,_util_isArray__WEBPACK_IMPORTED_MODULE_1__.isArray)(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(function (subscriber) {
        var handler = function () {
            var e = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                e[_i] = arguments[_i];
            }
            return subscriber.next(e.length === 1 ? e[0] : e);
        };
        var retValue;
        try {
            retValue = addHandler(handler);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        if (!(0,_util_isFunction__WEBPACK_IMPORTED_MODULE_3__.isFunction)(removeHandler)) {
            return undefined;
        }
        return function () { return removeHandler(handler, retValue); };
    });
}
//# sourceMappingURL=fromEventPattern.js.map


/***/ }),
/* 91 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "generate": () => /* binding */ generate
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(21);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(33);
/** PURE_IMPORTS_START _Observable,_util_identity,_util_isScheduler PURE_IMPORTS_END */



function generate(initialStateOrOptions, condition, iterate, resultSelectorOrObservable, scheduler) {
    var resultSelector;
    var initialState;
    if (arguments.length == 1) {
        var options = initialStateOrOptions;
        initialState = options.initialState;
        condition = options.condition;
        iterate = options.iterate;
        resultSelector = options.resultSelector || _util_identity__WEBPACK_IMPORTED_MODULE_0__.identity;
        scheduler = options.scheduler;
    }
    else if (resultSelectorOrObservable === undefined || (0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(resultSelectorOrObservable)) {
        initialState = initialStateOrOptions;
        resultSelector = _util_identity__WEBPACK_IMPORTED_MODULE_0__.identity;
        scheduler = resultSelectorOrObservable;
    }
    else {
        initialState = initialStateOrOptions;
        resultSelector = resultSelectorOrObservable;
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(function (subscriber) {
        var state = initialState;
        if (scheduler) {
            return scheduler.schedule(dispatch, 0, {
                subscriber: subscriber,
                iterate: iterate,
                condition: condition,
                resultSelector: resultSelector,
                state: state
            });
        }
        do {
            if (condition) {
                var conditionResult = void 0;
                try {
                    conditionResult = condition(state);
                }
                catch (err) {
                    subscriber.error(err);
                    return undefined;
                }
                if (!conditionResult) {
                    subscriber.complete();
                    break;
                }
            }
            var value = void 0;
            try {
                value = resultSelector(state);
            }
            catch (err) {
                subscriber.error(err);
                return undefined;
            }
            subscriber.next(value);
            if (subscriber.closed) {
                break;
            }
            try {
                state = iterate(state);
            }
            catch (err) {
                subscriber.error(err);
                return undefined;
            }
        } while (true);
        return undefined;
    });
}
function dispatch(state) {
    var subscriber = state.subscriber, condition = state.condition;
    if (subscriber.closed) {
        return undefined;
    }
    if (state.needIterate) {
        try {
            state.state = state.iterate(state.state);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
    }
    else {
        state.needIterate = true;
    }
    if (condition) {
        var conditionResult = void 0;
        try {
            conditionResult = condition(state.state);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        if (!conditionResult) {
            subscriber.complete();
            return undefined;
        }
        if (subscriber.closed) {
            return undefined;
        }
    }
    var value;
    try {
        value = state.resultSelector(state.state);
    }
    catch (err) {
        subscriber.error(err);
        return undefined;
    }
    if (subscriber.closed) {
        return undefined;
    }
    subscriber.next(value);
    if (subscriber.closed) {
        return undefined;
    }
    return this.schedule(state);
}
//# sourceMappingURL=generate.js.map


/***/ }),
/* 92 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "iif": () => /* binding */ iif
/* harmony export */ });
/* harmony import */ var _defer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(87);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(38);
/** PURE_IMPORTS_START _defer,_empty PURE_IMPORTS_END */


function iif(condition, trueResult, falseResult) {
    if (trueResult === void 0) {
        trueResult = _empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY;
    }
    if (falseResult === void 0) {
        falseResult = _empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY;
    }
    return (0,_defer__WEBPACK_IMPORTED_MODULE_1__.defer)(function () { return condition() ? trueResult : falseResult; });
}
//# sourceMappingURL=iif.js.map


/***/ }),
/* 93 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "interval": () => /* binding */ interval
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _util_isNumeric__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(94);
/** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric PURE_IMPORTS_END */



function interval(period, scheduler) {
    if (period === void 0) {
        period = 0;
    }
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    if (!(0,_util_isNumeric__WEBPACK_IMPORTED_MODULE_1__.isNumeric)(period) || period < 0) {
        period = 0;
    }
    if (!scheduler || typeof scheduler.schedule !== 'function') {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(function (subscriber) {
        subscriber.add(scheduler.schedule(dispatch, period, { subscriber: subscriber, counter: 0, period: period }));
        return subscriber;
    });
}
function dispatch(state) {
    var subscriber = state.subscriber, counter = state.counter, period = state.period;
    subscriber.next(counter);
    this.schedule({ subscriber: subscriber, counter: counter + 1, period: period }, period);
}
//# sourceMappingURL=interval.js.map


/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isNumeric": () => /* binding */ isNumeric
/* harmony export */ });
/* harmony import */ var _isArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/** PURE_IMPORTS_START _isArray PURE_IMPORTS_END */

function isNumeric(val) {
    return !(0,_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(val) && (val - parseFloat(val) + 1) >= 0;
}
//# sourceMappingURL=isNumeric.js.map


/***/ }),
/* 95 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "merge": () => /* binding */ merge
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/* harmony import */ var _operators_mergeAll__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(77);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(35);
/** PURE_IMPORTS_START _Observable,_util_isScheduler,_operators_mergeAll,_fromArray PURE_IMPORTS_END */




function merge() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var concurrent = Number.POSITIVE_INFINITY;
    var scheduler = null;
    var last = observables[observables.length - 1];
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_0__.isScheduler)(last)) {
        scheduler = observables.pop();
        if (observables.length > 1 && typeof observables[observables.length - 1] === 'number') {
            concurrent = observables.pop();
        }
    }
    else if (typeof last === 'number') {
        concurrent = observables.pop();
    }
    if (scheduler === null && observables.length === 1 && observables[0] instanceof _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable) {
        return observables[0];
    }
    return (0,_operators_mergeAll__WEBPACK_IMPORTED_MODULE_2__.mergeAll)(concurrent)((0,_fromArray__WEBPACK_IMPORTED_MODULE_3__.fromArray)(observables, scheduler));
}
//# sourceMappingURL=merge.js.map


/***/ }),
/* 96 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "NEVER": () => /* binding */ NEVER,
/* harmony export */   "never": () => /* binding */ never
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(56);
/** PURE_IMPORTS_START _Observable,_util_noop PURE_IMPORTS_END */


var NEVER = /*@__PURE__*/ new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(_util_noop__WEBPACK_IMPORTED_MODULE_1__.noop);
function never() {
    return NEVER;
}
//# sourceMappingURL=never.js.map


/***/ }),
/* 97 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "onErrorResumeNext": () => /* binding */ onErrorResumeNext
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(79);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(16);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(38);
/** PURE_IMPORTS_START _Observable,_from,_util_isArray,_empty PURE_IMPORTS_END */




function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        sources[_i] = arguments[_i];
    }
    if (sources.length === 0) {
        return _empty__WEBPACK_IMPORTED_MODULE_0__.EMPTY;
    }
    var first = sources[0], remainder = sources.slice(1);
    if (sources.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_1__.isArray)(first)) {
        return onErrorResumeNext.apply(void 0, first);
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_2__.Observable(function (subscriber) {
        var subNext = function () { return subscriber.add(onErrorResumeNext.apply(void 0, remainder).subscribe(subscriber)); };
        return (0,_from__WEBPACK_IMPORTED_MODULE_3__.from)(first).subscribe({
            next: function (value) { subscriber.next(value); },
            error: subNext,
            complete: subNext,
        });
    });
}
//# sourceMappingURL=onErrorResumeNext.js.map


/***/ }),
/* 98 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pairs": () => /* binding */ pairs,
/* harmony export */   "dispatch": () => /* binding */ dispatch
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */


function pairs(obj, scheduler) {
    if (!scheduler) {
        return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
            var keys = Object.keys(obj);
            for (var i = 0; i < keys.length && !subscriber.closed; i++) {
                var key = keys[i];
                if (obj.hasOwnProperty(key)) {
                    subscriber.next([key, obj[key]]);
                }
            }
            subscriber.complete();
        });
    }
    else {
        return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
            var keys = Object.keys(obj);
            var subscription = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
            subscription.add(scheduler.schedule(dispatch, 0, { keys: keys, index: 0, subscriber: subscriber, subscription: subscription, obj: obj }));
            return subscription;
        });
    }
}
function dispatch(state) {
    var keys = state.keys, index = state.index, subscriber = state.subscriber, subscription = state.subscription, obj = state.obj;
    if (!subscriber.closed) {
        if (index < keys.length) {
            var key = keys[index];
            subscriber.next([key, obj[key]]);
            subscription.add(this.schedule({ keys: keys, index: index + 1, subscriber: subscriber, subscription: subscription, obj: obj }));
        }
        else {
            subscriber.complete();
        }
    }
}
//# sourceMappingURL=pairs.js.map


/***/ }),
/* 99 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "partition": () => /* binding */ partition
/* harmony export */ });
/* harmony import */ var _util_not__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(101);
/* harmony import */ var _util_subscribeTo__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(67);
/* harmony import */ var _operators_filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(100);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(5);
/** PURE_IMPORTS_START _util_not,_util_subscribeTo,_operators_filter,_Observable PURE_IMPORTS_END */




function partition(source, predicate, thisArg) {
    return [
        (0,_operators_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(predicate, thisArg)(new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable((0,_util_subscribeTo__WEBPACK_IMPORTED_MODULE_2__.subscribeTo)(source))),
        (0,_operators_filter__WEBPACK_IMPORTED_MODULE_0__.filter)((0,_util_not__WEBPACK_IMPORTED_MODULE_3__.not)(predicate, thisArg))(new _Observable__WEBPACK_IMPORTED_MODULE_1__.Observable((0,_util_subscribeTo__WEBPACK_IMPORTED_MODULE_2__.subscribeTo)(source)))
    ];
}
//# sourceMappingURL=partition.js.map


/***/ }),
/* 100 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "filter": () => /* binding */ filter
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function filter(predicate, thisArg) {
    return function filterOperatorFunction(source) {
        return source.lift(new FilterOperator(predicate, thisArg));
    };
}
var FilterOperator = /*@__PURE__*/ (function () {
    function FilterOperator(predicate, thisArg) {
        this.predicate = predicate;
        this.thisArg = thisArg;
    }
    FilterOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new FilterSubscriber(subscriber, this.predicate, this.thisArg));
    };
    return FilterOperator;
}());
var FilterSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(FilterSubscriber, _super);
    function FilterSubscriber(destination, predicate, thisArg) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.thisArg = thisArg;
        _this.count = 0;
        return _this;
    }
    FilterSubscriber.prototype._next = function (value) {
        var result;
        try {
            result = this.predicate.call(this.thisArg, value, this.count++);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        if (result) {
            this.destination.next(value);
        }
    };
    return FilterSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=filter.js.map


/***/ }),
/* 101 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "not": () => /* binding */ not
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function not(pred, thisArg) {
    function notPred() {
        return !(notPred.pred.apply(notPred.thisArg, arguments));
    }
    notPred.pred = pred;
    notPred.thisArg = thisArg;
    return notPred;
}
//# sourceMappingURL=not.js.map


/***/ }),
/* 102 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "race": () => /* binding */ race,
/* harmony export */   "RaceOperator": () => /* binding */ RaceOperator,
/* harmony export */   "RaceSubscriber": () => /* binding */ RaceSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(35);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(74);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(65);
/** PURE_IMPORTS_START tslib,_util_isArray,_fromArray,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */





function race() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    if (observables.length === 1) {
        if ((0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(observables[0])) {
            observables = observables[0];
        }
        else {
            return observables[0];
        }
    }
    return (0,_fromArray__WEBPACK_IMPORTED_MODULE_1__.fromArray)(observables, undefined).lift(new RaceOperator());
}
var RaceOperator = /*@__PURE__*/ (function () {
    function RaceOperator() {
    }
    RaceOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new RaceSubscriber(subscriber));
    };
    return RaceOperator;
}());

var RaceSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(RaceSubscriber, _super);
    function RaceSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.hasFirst = false;
        _this.observables = [];
        _this.subscriptions = [];
        return _this;
    }
    RaceSubscriber.prototype._next = function (observable) {
        this.observables.push(observable);
    };
    RaceSubscriber.prototype._complete = function () {
        var observables = this.observables;
        var len = observables.length;
        if (len === 0) {
            this.destination.complete();
        }
        else {
            for (var i = 0; i < len && !this.hasFirst; i++) {
                var observable = observables[i];
                var subscription = (0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_3__.subscribeToResult)(this, observable, undefined, i);
                if (this.subscriptions) {
                    this.subscriptions.push(subscription);
                }
                this.add(subscription);
            }
            this.observables = null;
        }
    };
    RaceSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
        if (!this.hasFirst) {
            this.hasFirst = true;
            for (var i = 0; i < this.subscriptions.length; i++) {
                if (i !== outerIndex) {
                    var subscription = this.subscriptions[i];
                    subscription.unsubscribe();
                    this.remove(subscription);
                }
            }
            this.subscriptions = null;
        }
        this.destination.next(innerValue);
    };
    return RaceSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_4__.OuterSubscriber));

//# sourceMappingURL=race.js.map


/***/ }),
/* 103 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "range": () => /* binding */ range,
/* harmony export */   "dispatch": () => /* binding */ dispatch
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */

function range(start, count, scheduler) {
    if (start === void 0) {
        start = 0;
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        if (count === undefined) {
            count = start;
            start = 0;
        }
        var index = 0;
        var current = start;
        if (scheduler) {
            return scheduler.schedule(dispatch, 0, {
                index: index, count: count, start: start, subscriber: subscriber
            });
        }
        else {
            do {
                if (index++ >= count) {
                    subscriber.complete();
                    break;
                }
                subscriber.next(current++);
                if (subscriber.closed) {
                    break;
                }
            } while (true);
        }
        return undefined;
    });
}
function dispatch(state) {
    var start = state.start, index = state.index, count = state.count, subscriber = state.subscriber;
    if (index >= count) {
        subscriber.complete();
        return;
    }
    subscriber.next(start);
    if (subscriber.closed) {
        return;
    }
    state.index = index + 1;
    state.start = start + 1;
    this.schedule(state);
}
//# sourceMappingURL=range.js.map


/***/ }),
/* 104 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timer": () => /* binding */ timer
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(51);
/* harmony import */ var _util_isNumeric__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(94);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(33);
/** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */




function timer(dueTime, periodOrScheduler, scheduler) {
    if (dueTime === void 0) {
        dueTime = 0;
    }
    var period = -1;
    if ((0,_util_isNumeric__WEBPACK_IMPORTED_MODULE_0__.isNumeric)(periodOrScheduler)) {
        period = Number(periodOrScheduler) < 1 && 1 || Number(periodOrScheduler);
    }
    else if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(periodOrScheduler)) {
        scheduler = periodOrScheduler;
    }
    if (!(0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(scheduler)) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_2__.async;
    }
    return new _Observable__WEBPACK_IMPORTED_MODULE_3__.Observable(function (subscriber) {
        var due = (0,_util_isNumeric__WEBPACK_IMPORTED_MODULE_0__.isNumeric)(dueTime)
            ? dueTime
            : (+dueTime - scheduler.now());
        return scheduler.schedule(dispatch, due, {
            index: 0, period: period, subscriber: subscriber
        });
    });
}
function dispatch(state) {
    var index = state.index, period = state.period, subscriber = state.subscriber;
    subscriber.next(index);
    if (subscriber.closed) {
        return;
    }
    else if (period === -1) {
        return subscriber.complete();
    }
    state.index = index + 1;
    this.schedule(state, period);
}
//# sourceMappingURL=timer.js.map


/***/ }),
/* 105 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "using": () => /* binding */ using
/* harmony export */ });
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(5);
/* harmony import */ var _from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79);
/* harmony import */ var _empty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(38);
/** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */



function using(resourceFactory, observableFactory) {
    return new _Observable__WEBPACK_IMPORTED_MODULE_0__.Observable(function (subscriber) {
        var resource;
        try {
            resource = resourceFactory();
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        var result;
        try {
            result = observableFactory(resource);
        }
        catch (err) {
            subscriber.error(err);
            return undefined;
        }
        var source = result ? (0,_from__WEBPACK_IMPORTED_MODULE_1__.from)(result) : _empty__WEBPACK_IMPORTED_MODULE_2__.EMPTY;
        var subscription = source.subscribe(subscriber);
        return function () {
            subscription.unsubscribe();
            if (resource) {
                resource.unsubscribe();
            }
        };
    });
}
//# sourceMappingURL=using.js.map


/***/ }),
/* 106 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "zip": () => /* binding */ zip,
/* harmony export */   "ZipOperator": () => /* binding */ ZipOperator,
/* harmony export */   "ZipSubscriber": () => /* binding */ ZipSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _fromArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(35);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(16);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7);
/* harmony import */ var _internal_symbol_iterator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(72);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_fromArray,_util_isArray,_Subscriber,_.._internal_symbol_iterator,_innerSubscribe PURE_IMPORTS_END */






function zip() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var resultSelector = observables[observables.length - 1];
    if (typeof resultSelector === 'function') {
        observables.pop();
    }
    return (0,_fromArray__WEBPACK_IMPORTED_MODULE_0__.fromArray)(observables, undefined).lift(new ZipOperator(resultSelector));
}
var ZipOperator = /*@__PURE__*/ (function () {
    function ZipOperator(resultSelector) {
        this.resultSelector = resultSelector;
    }
    ZipOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ZipSubscriber(subscriber, this.resultSelector));
    };
    return ZipOperator;
}());

var ZipSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(ZipSubscriber, _super);
    function ZipSubscriber(destination, resultSelector, values) {
        if (values === void 0) {
            values = Object.create(null);
        }
        var _this = _super.call(this, destination) || this;
        _this.resultSelector = resultSelector;
        _this.iterators = [];
        _this.active = 0;
        _this.resultSelector = (typeof resultSelector === 'function') ? resultSelector : undefined;
        return _this;
    }
    ZipSubscriber.prototype._next = function (value) {
        var iterators = this.iterators;
        if ((0,_util_isArray__WEBPACK_IMPORTED_MODULE_2__.isArray)(value)) {
            iterators.push(new StaticArrayIterator(value));
        }
        else if (typeof value[_internal_symbol_iterator__WEBPACK_IMPORTED_MODULE_3__.iterator] === 'function') {
            iterators.push(new StaticIterator(value[_internal_symbol_iterator__WEBPACK_IMPORTED_MODULE_3__.iterator]()));
        }
        else {
            iterators.push(new ZipBufferIterator(this.destination, this, value));
        }
    };
    ZipSubscriber.prototype._complete = function () {
        var iterators = this.iterators;
        var len = iterators.length;
        this.unsubscribe();
        if (len === 0) {
            this.destination.complete();
            return;
        }
        this.active = len;
        for (var i = 0; i < len; i++) {
            var iterator = iterators[i];
            if (iterator.stillUnsubscribed) {
                var destination = this.destination;
                destination.add(iterator.subscribe());
            }
            else {
                this.active--;
            }
        }
    };
    ZipSubscriber.prototype.notifyInactive = function () {
        this.active--;
        if (this.active === 0) {
            this.destination.complete();
        }
    };
    ZipSubscriber.prototype.checkIterators = function () {
        var iterators = this.iterators;
        var len = iterators.length;
        var destination = this.destination;
        for (var i = 0; i < len; i++) {
            var iterator = iterators[i];
            if (typeof iterator.hasValue === 'function' && !iterator.hasValue()) {
                return;
            }
        }
        var shouldComplete = false;
        var args = [];
        for (var i = 0; i < len; i++) {
            var iterator = iterators[i];
            var result = iterator.next();
            if (iterator.hasCompleted()) {
                shouldComplete = true;
            }
            if (result.done) {
                destination.complete();
                return;
            }
            args.push(result.value);
        }
        if (this.resultSelector) {
            this._tryresultSelector(args);
        }
        else {
            destination.next(args);
        }
        if (shouldComplete) {
            destination.complete();
        }
    };
    ZipSubscriber.prototype._tryresultSelector = function (args) {
        var result;
        try {
            result = this.resultSelector.apply(this, args);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return ZipSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_4__.Subscriber));

var StaticIterator = /*@__PURE__*/ (function () {
    function StaticIterator(iterator) {
        this.iterator = iterator;
        this.nextResult = iterator.next();
    }
    StaticIterator.prototype.hasValue = function () {
        return true;
    };
    StaticIterator.prototype.next = function () {
        var result = this.nextResult;
        this.nextResult = this.iterator.next();
        return result;
    };
    StaticIterator.prototype.hasCompleted = function () {
        var nextResult = this.nextResult;
        return Boolean(nextResult && nextResult.done);
    };
    return StaticIterator;
}());
var StaticArrayIterator = /*@__PURE__*/ (function () {
    function StaticArrayIterator(array) {
        this.array = array;
        this.index = 0;
        this.length = 0;
        this.length = array.length;
    }
    StaticArrayIterator.prototype[_internal_symbol_iterator__WEBPACK_IMPORTED_MODULE_3__.iterator] = function () {
        return this;
    };
    StaticArrayIterator.prototype.next = function (value) {
        var i = this.index++;
        var array = this.array;
        return i < this.length ? { value: array[i], done: false } : { value: null, done: true };
    };
    StaticArrayIterator.prototype.hasValue = function () {
        return this.array.length > this.index;
    };
    StaticArrayIterator.prototype.hasCompleted = function () {
        return this.array.length === this.index;
    };
    return StaticArrayIterator;
}());
var ZipBufferIterator = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(ZipBufferIterator, _super);
    function ZipBufferIterator(destination, parent, observable) {
        var _this = _super.call(this, destination) || this;
        _this.parent = parent;
        _this.observable = observable;
        _this.stillUnsubscribed = true;
        _this.buffer = [];
        _this.isComplete = false;
        return _this;
    }
    ZipBufferIterator.prototype[_internal_symbol_iterator__WEBPACK_IMPORTED_MODULE_3__.iterator] = function () {
        return this;
    };
    ZipBufferIterator.prototype.next = function () {
        var buffer = this.buffer;
        if (buffer.length === 0 && this.isComplete) {
            return { value: null, done: true };
        }
        else {
            return { value: buffer.shift(), done: false };
        }
    };
    ZipBufferIterator.prototype.hasValue = function () {
        return this.buffer.length > 0;
    };
    ZipBufferIterator.prototype.hasCompleted = function () {
        return this.buffer.length === 0 && this.isComplete;
    };
    ZipBufferIterator.prototype.notifyComplete = function () {
        if (this.buffer.length > 0) {
            this.isComplete = true;
            this.parent.notifyInactive();
        }
        else {
            this.destination.complete();
        }
    };
    ZipBufferIterator.prototype.notifyNext = function (innerValue) {
        this.buffer.push(innerValue);
        this.parent.checkIterators();
    };
    ZipBufferIterator.prototype.subscribe = function () {
        return (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_5__.innerSubscribe)(this.observable, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_5__.SimpleInnerSubscriber(this));
    };
    return ZipBufferIterator;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_5__.SimpleOuterSubscriber));
//# sourceMappingURL=zip.js.map


/***/ }),
/* 107 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "audit": () => /* reexport safe */ _internal_operators_audit__WEBPACK_IMPORTED_MODULE_0__.audit,
/* harmony export */   "auditTime": () => /* reexport safe */ _internal_operators_auditTime__WEBPACK_IMPORTED_MODULE_1__.auditTime,
/* harmony export */   "buffer": () => /* reexport safe */ _internal_operators_buffer__WEBPACK_IMPORTED_MODULE_2__.buffer,
/* harmony export */   "bufferCount": () => /* reexport safe */ _internal_operators_bufferCount__WEBPACK_IMPORTED_MODULE_3__.bufferCount,
/* harmony export */   "bufferTime": () => /* reexport safe */ _internal_operators_bufferTime__WEBPACK_IMPORTED_MODULE_4__.bufferTime,
/* harmony export */   "bufferToggle": () => /* reexport safe */ _internal_operators_bufferToggle__WEBPACK_IMPORTED_MODULE_5__.bufferToggle,
/* harmony export */   "bufferWhen": () => /* reexport safe */ _internal_operators_bufferWhen__WEBPACK_IMPORTED_MODULE_6__.bufferWhen,
/* harmony export */   "catchError": () => /* reexport safe */ _internal_operators_catchError__WEBPACK_IMPORTED_MODULE_7__.catchError,
/* harmony export */   "combineAll": () => /* reexport safe */ _internal_operators_combineAll__WEBPACK_IMPORTED_MODULE_8__.combineAll,
/* harmony export */   "combineLatest": () => /* reexport safe */ _internal_operators_combineLatest__WEBPACK_IMPORTED_MODULE_9__.combineLatest,
/* harmony export */   "concat": () => /* reexport safe */ _internal_operators_concat__WEBPACK_IMPORTED_MODULE_10__.concat,
/* harmony export */   "concatAll": () => /* reexport safe */ _internal_operators_concatAll__WEBPACK_IMPORTED_MODULE_11__.concatAll,
/* harmony export */   "concatMap": () => /* reexport safe */ _internal_operators_concatMap__WEBPACK_IMPORTED_MODULE_12__.concatMap,
/* harmony export */   "concatMapTo": () => /* reexport safe */ _internal_operators_concatMapTo__WEBPACK_IMPORTED_MODULE_13__.concatMapTo,
/* harmony export */   "count": () => /* reexport safe */ _internal_operators_count__WEBPACK_IMPORTED_MODULE_14__.count,
/* harmony export */   "debounce": () => /* reexport safe */ _internal_operators_debounce__WEBPACK_IMPORTED_MODULE_15__.debounce,
/* harmony export */   "debounceTime": () => /* reexport safe */ _internal_operators_debounceTime__WEBPACK_IMPORTED_MODULE_16__.debounceTime,
/* harmony export */   "defaultIfEmpty": () => /* reexport safe */ _internal_operators_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_17__.defaultIfEmpty,
/* harmony export */   "delay": () => /* reexport safe */ _internal_operators_delay__WEBPACK_IMPORTED_MODULE_18__.delay,
/* harmony export */   "delayWhen": () => /* reexport safe */ _internal_operators_delayWhen__WEBPACK_IMPORTED_MODULE_19__.delayWhen,
/* harmony export */   "dematerialize": () => /* reexport safe */ _internal_operators_dematerialize__WEBPACK_IMPORTED_MODULE_20__.dematerialize,
/* harmony export */   "distinct": () => /* reexport safe */ _internal_operators_distinct__WEBPACK_IMPORTED_MODULE_21__.distinct,
/* harmony export */   "distinctUntilChanged": () => /* reexport safe */ _internal_operators_distinctUntilChanged__WEBPACK_IMPORTED_MODULE_22__.distinctUntilChanged,
/* harmony export */   "distinctUntilKeyChanged": () => /* reexport safe */ _internal_operators_distinctUntilKeyChanged__WEBPACK_IMPORTED_MODULE_23__.distinctUntilKeyChanged,
/* harmony export */   "elementAt": () => /* reexport safe */ _internal_operators_elementAt__WEBPACK_IMPORTED_MODULE_24__.elementAt,
/* harmony export */   "endWith": () => /* reexport safe */ _internal_operators_endWith__WEBPACK_IMPORTED_MODULE_25__.endWith,
/* harmony export */   "every": () => /* reexport safe */ _internal_operators_every__WEBPACK_IMPORTED_MODULE_26__.every,
/* harmony export */   "exhaust": () => /* reexport safe */ _internal_operators_exhaust__WEBPACK_IMPORTED_MODULE_27__.exhaust,
/* harmony export */   "exhaustMap": () => /* reexport safe */ _internal_operators_exhaustMap__WEBPACK_IMPORTED_MODULE_28__.exhaustMap,
/* harmony export */   "expand": () => /* reexport safe */ _internal_operators_expand__WEBPACK_IMPORTED_MODULE_29__.expand,
/* harmony export */   "filter": () => /* reexport safe */ _internal_operators_filter__WEBPACK_IMPORTED_MODULE_30__.filter,
/* harmony export */   "finalize": () => /* reexport safe */ _internal_operators_finalize__WEBPACK_IMPORTED_MODULE_31__.finalize,
/* harmony export */   "find": () => /* reexport safe */ _internal_operators_find__WEBPACK_IMPORTED_MODULE_32__.find,
/* harmony export */   "findIndex": () => /* reexport safe */ _internal_operators_findIndex__WEBPACK_IMPORTED_MODULE_33__.findIndex,
/* harmony export */   "first": () => /* reexport safe */ _internal_operators_first__WEBPACK_IMPORTED_MODULE_34__.first,
/* harmony export */   "groupBy": () => /* reexport safe */ _internal_operators_groupBy__WEBPACK_IMPORTED_MODULE_35__.groupBy,
/* harmony export */   "ignoreElements": () => /* reexport safe */ _internal_operators_ignoreElements__WEBPACK_IMPORTED_MODULE_36__.ignoreElements,
/* harmony export */   "isEmpty": () => /* reexport safe */ _internal_operators_isEmpty__WEBPACK_IMPORTED_MODULE_37__.isEmpty,
/* harmony export */   "last": () => /* reexport safe */ _internal_operators_last__WEBPACK_IMPORTED_MODULE_38__.last,
/* harmony export */   "map": () => /* reexport safe */ _internal_operators_map__WEBPACK_IMPORTED_MODULE_39__.map,
/* harmony export */   "mapTo": () => /* reexport safe */ _internal_operators_mapTo__WEBPACK_IMPORTED_MODULE_40__.mapTo,
/* harmony export */   "materialize": () => /* reexport safe */ _internal_operators_materialize__WEBPACK_IMPORTED_MODULE_41__.materialize,
/* harmony export */   "max": () => /* reexport safe */ _internal_operators_max__WEBPACK_IMPORTED_MODULE_42__.max,
/* harmony export */   "merge": () => /* reexport safe */ _internal_operators_merge__WEBPACK_IMPORTED_MODULE_43__.merge,
/* harmony export */   "mergeAll": () => /* reexport safe */ _internal_operators_mergeAll__WEBPACK_IMPORTED_MODULE_44__.mergeAll,
/* harmony export */   "mergeMap": () => /* reexport safe */ _internal_operators_mergeMap__WEBPACK_IMPORTED_MODULE_45__.mergeMap,
/* harmony export */   "flatMap": () => /* reexport safe */ _internal_operators_mergeMap__WEBPACK_IMPORTED_MODULE_45__.flatMap,
/* harmony export */   "mergeMapTo": () => /* reexport safe */ _internal_operators_mergeMapTo__WEBPACK_IMPORTED_MODULE_46__.mergeMapTo,
/* harmony export */   "mergeScan": () => /* reexport safe */ _internal_operators_mergeScan__WEBPACK_IMPORTED_MODULE_47__.mergeScan,
/* harmony export */   "min": () => /* reexport safe */ _internal_operators_min__WEBPACK_IMPORTED_MODULE_48__.min,
/* harmony export */   "multicast": () => /* reexport safe */ _internal_operators_multicast__WEBPACK_IMPORTED_MODULE_49__.multicast,
/* harmony export */   "observeOn": () => /* reexport safe */ _internal_operators_observeOn__WEBPACK_IMPORTED_MODULE_50__.observeOn,
/* harmony export */   "onErrorResumeNext": () => /* reexport safe */ _internal_operators_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_51__.onErrorResumeNext,
/* harmony export */   "pairwise": () => /* reexport safe */ _internal_operators_pairwise__WEBPACK_IMPORTED_MODULE_52__.pairwise,
/* harmony export */   "partition": () => /* reexport safe */ _internal_operators_partition__WEBPACK_IMPORTED_MODULE_53__.partition,
/* harmony export */   "pluck": () => /* reexport safe */ _internal_operators_pluck__WEBPACK_IMPORTED_MODULE_54__.pluck,
/* harmony export */   "publish": () => /* reexport safe */ _internal_operators_publish__WEBPACK_IMPORTED_MODULE_55__.publish,
/* harmony export */   "publishBehavior": () => /* reexport safe */ _internal_operators_publishBehavior__WEBPACK_IMPORTED_MODULE_56__.publishBehavior,
/* harmony export */   "publishLast": () => /* reexport safe */ _internal_operators_publishLast__WEBPACK_IMPORTED_MODULE_57__.publishLast,
/* harmony export */   "publishReplay": () => /* reexport safe */ _internal_operators_publishReplay__WEBPACK_IMPORTED_MODULE_58__.publishReplay,
/* harmony export */   "race": () => /* reexport safe */ _internal_operators_race__WEBPACK_IMPORTED_MODULE_59__.race,
/* harmony export */   "reduce": () => /* reexport safe */ _internal_operators_reduce__WEBPACK_IMPORTED_MODULE_60__.reduce,
/* harmony export */   "repeat": () => /* reexport safe */ _internal_operators_repeat__WEBPACK_IMPORTED_MODULE_61__.repeat,
/* harmony export */   "repeatWhen": () => /* reexport safe */ _internal_operators_repeatWhen__WEBPACK_IMPORTED_MODULE_62__.repeatWhen,
/* harmony export */   "retry": () => /* reexport safe */ _internal_operators_retry__WEBPACK_IMPORTED_MODULE_63__.retry,
/* harmony export */   "retryWhen": () => /* reexport safe */ _internal_operators_retryWhen__WEBPACK_IMPORTED_MODULE_64__.retryWhen,
/* harmony export */   "refCount": () => /* reexport safe */ _internal_operators_refCount__WEBPACK_IMPORTED_MODULE_65__.refCount,
/* harmony export */   "sample": () => /* reexport safe */ _internal_operators_sample__WEBPACK_IMPORTED_MODULE_66__.sample,
/* harmony export */   "sampleTime": () => /* reexport safe */ _internal_operators_sampleTime__WEBPACK_IMPORTED_MODULE_67__.sampleTime,
/* harmony export */   "scan": () => /* reexport safe */ _internal_operators_scan__WEBPACK_IMPORTED_MODULE_68__.scan,
/* harmony export */   "sequenceEqual": () => /* reexport safe */ _internal_operators_sequenceEqual__WEBPACK_IMPORTED_MODULE_69__.sequenceEqual,
/* harmony export */   "share": () => /* reexport safe */ _internal_operators_share__WEBPACK_IMPORTED_MODULE_70__.share,
/* harmony export */   "shareReplay": () => /* reexport safe */ _internal_operators_shareReplay__WEBPACK_IMPORTED_MODULE_71__.shareReplay,
/* harmony export */   "single": () => /* reexport safe */ _internal_operators_single__WEBPACK_IMPORTED_MODULE_72__.single,
/* harmony export */   "skip": () => /* reexport safe */ _internal_operators_skip__WEBPACK_IMPORTED_MODULE_73__.skip,
/* harmony export */   "skipLast": () => /* reexport safe */ _internal_operators_skipLast__WEBPACK_IMPORTED_MODULE_74__.skipLast,
/* harmony export */   "skipUntil": () => /* reexport safe */ _internal_operators_skipUntil__WEBPACK_IMPORTED_MODULE_75__.skipUntil,
/* harmony export */   "skipWhile": () => /* reexport safe */ _internal_operators_skipWhile__WEBPACK_IMPORTED_MODULE_76__.skipWhile,
/* harmony export */   "startWith": () => /* reexport safe */ _internal_operators_startWith__WEBPACK_IMPORTED_MODULE_77__.startWith,
/* harmony export */   "subscribeOn": () => /* reexport safe */ _internal_operators_subscribeOn__WEBPACK_IMPORTED_MODULE_78__.subscribeOn,
/* harmony export */   "switchAll": () => /* reexport safe */ _internal_operators_switchAll__WEBPACK_IMPORTED_MODULE_79__.switchAll,
/* harmony export */   "switchMap": () => /* reexport safe */ _internal_operators_switchMap__WEBPACK_IMPORTED_MODULE_80__.switchMap,
/* harmony export */   "switchMapTo": () => /* reexport safe */ _internal_operators_switchMapTo__WEBPACK_IMPORTED_MODULE_81__.switchMapTo,
/* harmony export */   "take": () => /* reexport safe */ _internal_operators_take__WEBPACK_IMPORTED_MODULE_82__.take,
/* harmony export */   "takeLast": () => /* reexport safe */ _internal_operators_takeLast__WEBPACK_IMPORTED_MODULE_83__.takeLast,
/* harmony export */   "takeUntil": () => /* reexport safe */ _internal_operators_takeUntil__WEBPACK_IMPORTED_MODULE_84__.takeUntil,
/* harmony export */   "takeWhile": () => /* reexport safe */ _internal_operators_takeWhile__WEBPACK_IMPORTED_MODULE_85__.takeWhile,
/* harmony export */   "tap": () => /* reexport safe */ _internal_operators_tap__WEBPACK_IMPORTED_MODULE_86__.tap,
/* harmony export */   "throttle": () => /* reexport safe */ _internal_operators_throttle__WEBPACK_IMPORTED_MODULE_87__.throttle,
/* harmony export */   "throttleTime": () => /* reexport safe */ _internal_operators_throttleTime__WEBPACK_IMPORTED_MODULE_88__.throttleTime,
/* harmony export */   "throwIfEmpty": () => /* reexport safe */ _internal_operators_throwIfEmpty__WEBPACK_IMPORTED_MODULE_89__.throwIfEmpty,
/* harmony export */   "timeInterval": () => /* reexport safe */ _internal_operators_timeInterval__WEBPACK_IMPORTED_MODULE_90__.timeInterval,
/* harmony export */   "timeout": () => /* reexport safe */ _internal_operators_timeout__WEBPACK_IMPORTED_MODULE_91__.timeout,
/* harmony export */   "timeoutWith": () => /* reexport safe */ _internal_operators_timeoutWith__WEBPACK_IMPORTED_MODULE_92__.timeoutWith,
/* harmony export */   "timestamp": () => /* reexport safe */ _internal_operators_timestamp__WEBPACK_IMPORTED_MODULE_93__.timestamp,
/* harmony export */   "toArray": () => /* reexport safe */ _internal_operators_toArray__WEBPACK_IMPORTED_MODULE_94__.toArray,
/* harmony export */   "window": () => /* reexport safe */ _internal_operators_window__WEBPACK_IMPORTED_MODULE_95__.window,
/* harmony export */   "windowCount": () => /* reexport safe */ _internal_operators_windowCount__WEBPACK_IMPORTED_MODULE_96__.windowCount,
/* harmony export */   "windowTime": () => /* reexport safe */ _internal_operators_windowTime__WEBPACK_IMPORTED_MODULE_97__.windowTime,
/* harmony export */   "windowToggle": () => /* reexport safe */ _internal_operators_windowToggle__WEBPACK_IMPORTED_MODULE_98__.windowToggle,
/* harmony export */   "windowWhen": () => /* reexport safe */ _internal_operators_windowWhen__WEBPACK_IMPORTED_MODULE_99__.windowWhen,
/* harmony export */   "withLatestFrom": () => /* reexport safe */ _internal_operators_withLatestFrom__WEBPACK_IMPORTED_MODULE_100__.withLatestFrom,
/* harmony export */   "zip": () => /* reexport safe */ _internal_operators_zip__WEBPACK_IMPORTED_MODULE_101__.zip,
/* harmony export */   "zipAll": () => /* reexport safe */ _internal_operators_zipAll__WEBPACK_IMPORTED_MODULE_102__.zipAll
/* harmony export */ });
/* harmony import */ var _internal_operators_audit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(108);
/* harmony import */ var _internal_operators_auditTime__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(109);
/* harmony import */ var _internal_operators_buffer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(110);
/* harmony import */ var _internal_operators_bufferCount__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(111);
/* harmony import */ var _internal_operators_bufferTime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(112);
/* harmony import */ var _internal_operators_bufferToggle__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(113);
/* harmony import */ var _internal_operators_bufferWhen__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(114);
/* harmony import */ var _internal_operators_catchError__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(115);
/* harmony import */ var _internal_operators_combineAll__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(116);
/* harmony import */ var _internal_operators_combineLatest__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(117);
/* harmony import */ var _internal_operators_concat__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(118);
/* harmony import */ var _internal_operators_concatAll__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(76);
/* harmony import */ var _internal_operators_concatMap__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(119);
/* harmony import */ var _internal_operators_concatMapTo__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(120);
/* harmony import */ var _internal_operators_count__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(121);
/* harmony import */ var _internal_operators_debounce__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(122);
/* harmony import */ var _internal_operators_debounceTime__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(123);
/* harmony import */ var _internal_operators_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(124);
/* harmony import */ var _internal_operators_delay__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(125);
/* harmony import */ var _internal_operators_delayWhen__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(127);
/* harmony import */ var _internal_operators_dematerialize__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(128);
/* harmony import */ var _internal_operators_distinct__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(129);
/* harmony import */ var _internal_operators_distinctUntilChanged__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(130);
/* harmony import */ var _internal_operators_distinctUntilKeyChanged__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(131);
/* harmony import */ var _internal_operators_elementAt__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(132);
/* harmony import */ var _internal_operators_endWith__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(135);
/* harmony import */ var _internal_operators_every__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(136);
/* harmony import */ var _internal_operators_exhaust__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(137);
/* harmony import */ var _internal_operators_exhaustMap__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(138);
/* harmony import */ var _internal_operators_expand__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(139);
/* harmony import */ var _internal_operators_filter__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(100);
/* harmony import */ var _internal_operators_finalize__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(140);
/* harmony import */ var _internal_operators_find__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(141);
/* harmony import */ var _internal_operators_findIndex__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(142);
/* harmony import */ var _internal_operators_first__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(143);
/* harmony import */ var _internal_operators_groupBy__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(27);
/* harmony import */ var _internal_operators_ignoreElements__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(144);
/* harmony import */ var _internal_operators_isEmpty__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(145);
/* harmony import */ var _internal_operators_last__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(146);
/* harmony import */ var _internal_operators_map__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(62);
/* harmony import */ var _internal_operators_mapTo__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(148);
/* harmony import */ var _internal_operators_materialize__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(149);
/* harmony import */ var _internal_operators_max__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(150);
/* harmony import */ var _internal_operators_merge__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(153);
/* harmony import */ var _internal_operators_mergeAll__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(77);
/* harmony import */ var _internal_operators_mergeMap__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(78);
/* harmony import */ var _internal_operators_mergeMapTo__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(154);
/* harmony import */ var _internal_operators_mergeScan__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(155);
/* harmony import */ var _internal_operators_min__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(156);
/* harmony import */ var _internal_operators_multicast__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(157);
/* harmony import */ var _internal_operators_observeOn__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(30);
/* harmony import */ var _internal_operators_onErrorResumeNext__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__(158);
/* harmony import */ var _internal_operators_pairwise__WEBPACK_IMPORTED_MODULE_52__ = __webpack_require__(159);
/* harmony import */ var _internal_operators_partition__WEBPACK_IMPORTED_MODULE_53__ = __webpack_require__(160);
/* harmony import */ var _internal_operators_pluck__WEBPACK_IMPORTED_MODULE_54__ = __webpack_require__(161);
/* harmony import */ var _internal_operators_publish__WEBPACK_IMPORTED_MODULE_55__ = __webpack_require__(162);
/* harmony import */ var _internal_operators_publishBehavior__WEBPACK_IMPORTED_MODULE_56__ = __webpack_require__(163);
/* harmony import */ var _internal_operators_publishLast__WEBPACK_IMPORTED_MODULE_57__ = __webpack_require__(164);
/* harmony import */ var _internal_operators_publishReplay__WEBPACK_IMPORTED_MODULE_58__ = __webpack_require__(165);
/* harmony import */ var _internal_operators_race__WEBPACK_IMPORTED_MODULE_59__ = __webpack_require__(166);
/* harmony import */ var _internal_operators_reduce__WEBPACK_IMPORTED_MODULE_60__ = __webpack_require__(151);
/* harmony import */ var _internal_operators_repeat__WEBPACK_IMPORTED_MODULE_61__ = __webpack_require__(167);
/* harmony import */ var _internal_operators_repeatWhen__WEBPACK_IMPORTED_MODULE_62__ = __webpack_require__(168);
/* harmony import */ var _internal_operators_retry__WEBPACK_IMPORTED_MODULE_63__ = __webpack_require__(169);
/* harmony import */ var _internal_operators_retryWhen__WEBPACK_IMPORTED_MODULE_64__ = __webpack_require__(170);
/* harmony import */ var _internal_operators_refCount__WEBPACK_IMPORTED_MODULE_65__ = __webpack_require__(23);
/* harmony import */ var _internal_operators_sample__WEBPACK_IMPORTED_MODULE_66__ = __webpack_require__(171);
/* harmony import */ var _internal_operators_sampleTime__WEBPACK_IMPORTED_MODULE_67__ = __webpack_require__(172);
/* harmony import */ var _internal_operators_scan__WEBPACK_IMPORTED_MODULE_68__ = __webpack_require__(152);
/* harmony import */ var _internal_operators_sequenceEqual__WEBPACK_IMPORTED_MODULE_69__ = __webpack_require__(173);
/* harmony import */ var _internal_operators_share__WEBPACK_IMPORTED_MODULE_70__ = __webpack_require__(174);
/* harmony import */ var _internal_operators_shareReplay__WEBPACK_IMPORTED_MODULE_71__ = __webpack_require__(175);
/* harmony import */ var _internal_operators_single__WEBPACK_IMPORTED_MODULE_72__ = __webpack_require__(176);
/* harmony import */ var _internal_operators_skip__WEBPACK_IMPORTED_MODULE_73__ = __webpack_require__(177);
/* harmony import */ var _internal_operators_skipLast__WEBPACK_IMPORTED_MODULE_74__ = __webpack_require__(178);
/* harmony import */ var _internal_operators_skipUntil__WEBPACK_IMPORTED_MODULE_75__ = __webpack_require__(179);
/* harmony import */ var _internal_operators_skipWhile__WEBPACK_IMPORTED_MODULE_76__ = __webpack_require__(180);
/* harmony import */ var _internal_operators_startWith__WEBPACK_IMPORTED_MODULE_77__ = __webpack_require__(181);
/* harmony import */ var _internal_operators_subscribeOn__WEBPACK_IMPORTED_MODULE_78__ = __webpack_require__(182);
/* harmony import */ var _internal_operators_switchAll__WEBPACK_IMPORTED_MODULE_79__ = __webpack_require__(184);
/* harmony import */ var _internal_operators_switchMap__WEBPACK_IMPORTED_MODULE_80__ = __webpack_require__(185);
/* harmony import */ var _internal_operators_switchMapTo__WEBPACK_IMPORTED_MODULE_81__ = __webpack_require__(186);
/* harmony import */ var _internal_operators_take__WEBPACK_IMPORTED_MODULE_82__ = __webpack_require__(133);
/* harmony import */ var _internal_operators_takeLast__WEBPACK_IMPORTED_MODULE_83__ = __webpack_require__(147);
/* harmony import */ var _internal_operators_takeUntil__WEBPACK_IMPORTED_MODULE_84__ = __webpack_require__(187);
/* harmony import */ var _internal_operators_takeWhile__WEBPACK_IMPORTED_MODULE_85__ = __webpack_require__(188);
/* harmony import */ var _internal_operators_tap__WEBPACK_IMPORTED_MODULE_86__ = __webpack_require__(189);
/* harmony import */ var _internal_operators_throttle__WEBPACK_IMPORTED_MODULE_87__ = __webpack_require__(190);
/* harmony import */ var _internal_operators_throttleTime__WEBPACK_IMPORTED_MODULE_88__ = __webpack_require__(191);
/* harmony import */ var _internal_operators_throwIfEmpty__WEBPACK_IMPORTED_MODULE_89__ = __webpack_require__(134);
/* harmony import */ var _internal_operators_timeInterval__WEBPACK_IMPORTED_MODULE_90__ = __webpack_require__(192);
/* harmony import */ var _internal_operators_timeout__WEBPACK_IMPORTED_MODULE_91__ = __webpack_require__(193);
/* harmony import */ var _internal_operators_timeoutWith__WEBPACK_IMPORTED_MODULE_92__ = __webpack_require__(194);
/* harmony import */ var _internal_operators_timestamp__WEBPACK_IMPORTED_MODULE_93__ = __webpack_require__(195);
/* harmony import */ var _internal_operators_toArray__WEBPACK_IMPORTED_MODULE_94__ = __webpack_require__(196);
/* harmony import */ var _internal_operators_window__WEBPACK_IMPORTED_MODULE_95__ = __webpack_require__(197);
/* harmony import */ var _internal_operators_windowCount__WEBPACK_IMPORTED_MODULE_96__ = __webpack_require__(198);
/* harmony import */ var _internal_operators_windowTime__WEBPACK_IMPORTED_MODULE_97__ = __webpack_require__(199);
/* harmony import */ var _internal_operators_windowToggle__WEBPACK_IMPORTED_MODULE_98__ = __webpack_require__(200);
/* harmony import */ var _internal_operators_windowWhen__WEBPACK_IMPORTED_MODULE_99__ = __webpack_require__(201);
/* harmony import */ var _internal_operators_withLatestFrom__WEBPACK_IMPORTED_MODULE_100__ = __webpack_require__(202);
/* harmony import */ var _internal_operators_zip__WEBPACK_IMPORTED_MODULE_101__ = __webpack_require__(203);
/* harmony import */ var _internal_operators_zipAll__WEBPACK_IMPORTED_MODULE_102__ = __webpack_require__(204);
/** PURE_IMPORTS_START  PURE_IMPORTS_END */







































































































//# sourceMappingURL=index.js.map


/***/ }),
/* 108 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "audit": () => /* binding */ audit
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function audit(durationSelector) {
    return function auditOperatorFunction(source) {
        return source.lift(new AuditOperator(durationSelector));
    };
}
var AuditOperator = /*@__PURE__*/ (function () {
    function AuditOperator(durationSelector) {
        this.durationSelector = durationSelector;
    }
    AuditOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new AuditSubscriber(subscriber, this.durationSelector));
    };
    return AuditOperator;
}());
var AuditSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(AuditSubscriber, _super);
    function AuditSubscriber(destination, durationSelector) {
        var _this = _super.call(this, destination) || this;
        _this.durationSelector = durationSelector;
        _this.hasValue = false;
        return _this;
    }
    AuditSubscriber.prototype._next = function (value) {
        this.value = value;
        this.hasValue = true;
        if (!this.throttled) {
            var duration = void 0;
            try {
                var durationSelector = this.durationSelector;
                duration = durationSelector(value);
            }
            catch (err) {
                return this.destination.error(err);
            }
            var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(duration, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this));
            if (!innerSubscription || innerSubscription.closed) {
                this.clearThrottle();
            }
            else {
                this.add(this.throttled = innerSubscription);
            }
        }
    };
    AuditSubscriber.prototype.clearThrottle = function () {
        var _a = this, value = _a.value, hasValue = _a.hasValue, throttled = _a.throttled;
        if (throttled) {
            this.remove(throttled);
            this.throttled = undefined;
            throttled.unsubscribe();
        }
        if (hasValue) {
            this.value = undefined;
            this.hasValue = false;
            this.destination.next(value);
        }
    };
    AuditSubscriber.prototype.notifyNext = function () {
        this.clearThrottle();
    };
    AuditSubscriber.prototype.notifyComplete = function () {
        this.clearThrottle();
    };
    return AuditSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=audit.js.map


/***/ }),
/* 109 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "auditTime": () => /* binding */ auditTime
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _audit__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(108);
/* harmony import */ var _observable_timer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(104);
/** PURE_IMPORTS_START _scheduler_async,_audit,_observable_timer PURE_IMPORTS_END */



function auditTime(duration, scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return (0,_audit__WEBPACK_IMPORTED_MODULE_1__.audit)(function () { return (0,_observable_timer__WEBPACK_IMPORTED_MODULE_2__.timer)(duration, scheduler); });
}
//# sourceMappingURL=auditTime.js.map


/***/ }),
/* 110 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "buffer": () => /* binding */ buffer
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function buffer(closingNotifier) {
    return function bufferOperatorFunction(source) {
        return source.lift(new BufferOperator(closingNotifier));
    };
}
var BufferOperator = /*@__PURE__*/ (function () {
    function BufferOperator(closingNotifier) {
        this.closingNotifier = closingNotifier;
    }
    BufferOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new BufferSubscriber(subscriber, this.closingNotifier));
    };
    return BufferOperator;
}());
var BufferSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(BufferSubscriber, _super);
    function BufferSubscriber(destination, closingNotifier) {
        var _this = _super.call(this, destination) || this;
        _this.buffer = [];
        _this.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(closingNotifier, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(_this)));
        return _this;
    }
    BufferSubscriber.prototype._next = function (value) {
        this.buffer.push(value);
    };
    BufferSubscriber.prototype.notifyNext = function () {
        var buffer = this.buffer;
        this.buffer = [];
        this.destination.next(buffer);
    };
    return BufferSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=buffer.js.map


/***/ }),
/* 111 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferCount": () => /* binding */ bufferCount
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function bufferCount(bufferSize, startBufferEvery) {
    if (startBufferEvery === void 0) {
        startBufferEvery = null;
    }
    return function bufferCountOperatorFunction(source) {
        return source.lift(new BufferCountOperator(bufferSize, startBufferEvery));
    };
}
var BufferCountOperator = /*@__PURE__*/ (function () {
    function BufferCountOperator(bufferSize, startBufferEvery) {
        this.bufferSize = bufferSize;
        this.startBufferEvery = startBufferEvery;
        if (!startBufferEvery || bufferSize === startBufferEvery) {
            this.subscriberClass = BufferCountSubscriber;
        }
        else {
            this.subscriberClass = BufferSkipCountSubscriber;
        }
    }
    BufferCountOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new this.subscriberClass(subscriber, this.bufferSize, this.startBufferEvery));
    };
    return BufferCountOperator;
}());
var BufferCountSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(BufferCountSubscriber, _super);
    function BufferCountSubscriber(destination, bufferSize) {
        var _this = _super.call(this, destination) || this;
        _this.bufferSize = bufferSize;
        _this.buffer = [];
        return _this;
    }
    BufferCountSubscriber.prototype._next = function (value) {
        var buffer = this.buffer;
        buffer.push(value);
        if (buffer.length == this.bufferSize) {
            this.destination.next(buffer);
            this.buffer = [];
        }
    };
    BufferCountSubscriber.prototype._complete = function () {
        var buffer = this.buffer;
        if (buffer.length > 0) {
            this.destination.next(buffer);
        }
        _super.prototype._complete.call(this);
    };
    return BufferCountSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
var BufferSkipCountSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(BufferSkipCountSubscriber, _super);
    function BufferSkipCountSubscriber(destination, bufferSize, startBufferEvery) {
        var _this = _super.call(this, destination) || this;
        _this.bufferSize = bufferSize;
        _this.startBufferEvery = startBufferEvery;
        _this.buffers = [];
        _this.count = 0;
        return _this;
    }
    BufferSkipCountSubscriber.prototype._next = function (value) {
        var _a = this, bufferSize = _a.bufferSize, startBufferEvery = _a.startBufferEvery, buffers = _a.buffers, count = _a.count;
        this.count++;
        if (count % startBufferEvery === 0) {
            buffers.push([]);
        }
        for (var i = buffers.length; i--;) {
            var buffer = buffers[i];
            buffer.push(value);
            if (buffer.length === bufferSize) {
                buffers.splice(i, 1);
                this.destination.next(buffer);
            }
        }
    };
    BufferSkipCountSubscriber.prototype._complete = function () {
        var _a = this, buffers = _a.buffers, destination = _a.destination;
        while (buffers.length > 0) {
            var buffer = buffers.shift();
            if (buffer.length > 0) {
                destination.next(buffer);
            }
        }
        _super.prototype._complete.call(this);
    };
    return BufferSkipCountSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=bufferCount.js.map


/***/ }),
/* 112 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferTime": () => /* binding */ bufferTime
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(33);
/** PURE_IMPORTS_START tslib,_scheduler_async,_Subscriber,_util_isScheduler PURE_IMPORTS_END */




function bufferTime(bufferTimeSpan) {
    var length = arguments.length;
    var scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(arguments[arguments.length - 1])) {
        scheduler = arguments[arguments.length - 1];
        length--;
    }
    var bufferCreationInterval = null;
    if (length >= 2) {
        bufferCreationInterval = arguments[1];
    }
    var maxBufferSize = Number.POSITIVE_INFINITY;
    if (length >= 3) {
        maxBufferSize = arguments[2];
    }
    return function bufferTimeOperatorFunction(source) {
        return source.lift(new BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler));
    };
}
var BufferTimeOperator = /*@__PURE__*/ (function () {
    function BufferTimeOperator(bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler) {
        this.bufferTimeSpan = bufferTimeSpan;
        this.bufferCreationInterval = bufferCreationInterval;
        this.maxBufferSize = maxBufferSize;
        this.scheduler = scheduler;
    }
    BufferTimeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new BufferTimeSubscriber(subscriber, this.bufferTimeSpan, this.bufferCreationInterval, this.maxBufferSize, this.scheduler));
    };
    return BufferTimeOperator;
}());
var Context = /*@__PURE__*/ (function () {
    function Context() {
        this.buffer = [];
    }
    return Context;
}());
var BufferTimeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(BufferTimeSubscriber, _super);
    function BufferTimeSubscriber(destination, bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.bufferTimeSpan = bufferTimeSpan;
        _this.bufferCreationInterval = bufferCreationInterval;
        _this.maxBufferSize = maxBufferSize;
        _this.scheduler = scheduler;
        _this.contexts = [];
        var context = _this.openContext();
        _this.timespanOnly = bufferCreationInterval == null || bufferCreationInterval < 0;
        if (_this.timespanOnly) {
            var timeSpanOnlyState = { subscriber: _this, context: context, bufferTimeSpan: bufferTimeSpan };
            _this.add(context.closeAction = scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
        }
        else {
            var closeState = { subscriber: _this, context: context };
            var creationState = { bufferTimeSpan: bufferTimeSpan, bufferCreationInterval: bufferCreationInterval, subscriber: _this, scheduler: scheduler };
            _this.add(context.closeAction = scheduler.schedule(dispatchBufferClose, bufferTimeSpan, closeState));
            _this.add(scheduler.schedule(dispatchBufferCreation, bufferCreationInterval, creationState));
        }
        return _this;
    }
    BufferTimeSubscriber.prototype._next = function (value) {
        var contexts = this.contexts;
        var len = contexts.length;
        var filledBufferContext;
        for (var i = 0; i < len; i++) {
            var context_1 = contexts[i];
            var buffer = context_1.buffer;
            buffer.push(value);
            if (buffer.length == this.maxBufferSize) {
                filledBufferContext = context_1;
            }
        }
        if (filledBufferContext) {
            this.onBufferFull(filledBufferContext);
        }
    };
    BufferTimeSubscriber.prototype._error = function (err) {
        this.contexts.length = 0;
        _super.prototype._error.call(this, err);
    };
    BufferTimeSubscriber.prototype._complete = function () {
        var _a = this, contexts = _a.contexts, destination = _a.destination;
        while (contexts.length > 0) {
            var context_2 = contexts.shift();
            destination.next(context_2.buffer);
        }
        _super.prototype._complete.call(this);
    };
    BufferTimeSubscriber.prototype._unsubscribe = function () {
        this.contexts = null;
    };
    BufferTimeSubscriber.prototype.onBufferFull = function (context) {
        this.closeContext(context);
        var closeAction = context.closeAction;
        closeAction.unsubscribe();
        this.remove(closeAction);
        if (!this.closed && this.timespanOnly) {
            context = this.openContext();
            var bufferTimeSpan = this.bufferTimeSpan;
            var timeSpanOnlyState = { subscriber: this, context: context, bufferTimeSpan: bufferTimeSpan };
            this.add(context.closeAction = this.scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
        }
    };
    BufferTimeSubscriber.prototype.openContext = function () {
        var context = new Context();
        this.contexts.push(context);
        return context;
    };
    BufferTimeSubscriber.prototype.closeContext = function (context) {
        this.destination.next(context.buffer);
        var contexts = this.contexts;
        var spliceIndex = contexts ? contexts.indexOf(context) : -1;
        if (spliceIndex >= 0) {
            contexts.splice(contexts.indexOf(context), 1);
        }
    };
    return BufferTimeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_3__.Subscriber));
function dispatchBufferTimeSpanOnly(state) {
    var subscriber = state.subscriber;
    var prevContext = state.context;
    if (prevContext) {
        subscriber.closeContext(prevContext);
    }
    if (!subscriber.closed) {
        state.context = subscriber.openContext();
        state.context.closeAction = this.schedule(state, state.bufferTimeSpan);
    }
}
function dispatchBufferCreation(state) {
    var bufferCreationInterval = state.bufferCreationInterval, bufferTimeSpan = state.bufferTimeSpan, subscriber = state.subscriber, scheduler = state.scheduler;
    var context = subscriber.openContext();
    var action = this;
    if (!subscriber.closed) {
        subscriber.add(context.closeAction = scheduler.schedule(dispatchBufferClose, bufferTimeSpan, { subscriber: subscriber, context: context }));
        action.schedule(state, bufferCreationInterval);
    }
}
function dispatchBufferClose(arg) {
    var subscriber = arg.subscriber, context = arg.context;
    subscriber.closeContext(context);
}
//# sourceMappingURL=bufferTime.js.map


/***/ }),
/* 113 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferToggle": () => /* binding */ bufferToggle
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(13);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(65);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(74);
/** PURE_IMPORTS_START tslib,_Subscription,_util_subscribeToResult,_OuterSubscriber PURE_IMPORTS_END */




function bufferToggle(openings, closingSelector) {
    return function bufferToggleOperatorFunction(source) {
        return source.lift(new BufferToggleOperator(openings, closingSelector));
    };
}
var BufferToggleOperator = /*@__PURE__*/ (function () {
    function BufferToggleOperator(openings, closingSelector) {
        this.openings = openings;
        this.closingSelector = closingSelector;
    }
    BufferToggleOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new BufferToggleSubscriber(subscriber, this.openings, this.closingSelector));
    };
    return BufferToggleOperator;
}());
var BufferToggleSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(BufferToggleSubscriber, _super);
    function BufferToggleSubscriber(destination, openings, closingSelector) {
        var _this = _super.call(this, destination) || this;
        _this.closingSelector = closingSelector;
        _this.contexts = [];
        _this.add((0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__.subscribeToResult)(_this, openings));
        return _this;
    }
    BufferToggleSubscriber.prototype._next = function (value) {
        var contexts = this.contexts;
        var len = contexts.length;
        for (var i = 0; i < len; i++) {
            contexts[i].buffer.push(value);
        }
    };
    BufferToggleSubscriber.prototype._error = function (err) {
        var contexts = this.contexts;
        while (contexts.length > 0) {
            var context_1 = contexts.shift();
            context_1.subscription.unsubscribe();
            context_1.buffer = null;
            context_1.subscription = null;
        }
        this.contexts = null;
        _super.prototype._error.call(this, err);
    };
    BufferToggleSubscriber.prototype._complete = function () {
        var contexts = this.contexts;
        while (contexts.length > 0) {
            var context_2 = contexts.shift();
            this.destination.next(context_2.buffer);
            context_2.subscription.unsubscribe();
            context_2.buffer = null;
            context_2.subscription = null;
        }
        this.contexts = null;
        _super.prototype._complete.call(this);
    };
    BufferToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue) {
        outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
    };
    BufferToggleSubscriber.prototype.notifyComplete = function (innerSub) {
        this.closeBuffer(innerSub.context);
    };
    BufferToggleSubscriber.prototype.openBuffer = function (value) {
        try {
            var closingSelector = this.closingSelector;
            var closingNotifier = closingSelector.call(this, value);
            if (closingNotifier) {
                this.trySubscribe(closingNotifier);
            }
        }
        catch (err) {
            this._error(err);
        }
    };
    BufferToggleSubscriber.prototype.closeBuffer = function (context) {
        var contexts = this.contexts;
        if (contexts && context) {
            var buffer = context.buffer, subscription = context.subscription;
            this.destination.next(buffer);
            contexts.splice(contexts.indexOf(context), 1);
            this.remove(subscription);
            subscription.unsubscribe();
        }
    };
    BufferToggleSubscriber.prototype.trySubscribe = function (closingNotifier) {
        var contexts = this.contexts;
        var buffer = [];
        var subscription = new _Subscription__WEBPACK_IMPORTED_MODULE_2__.Subscription();
        var context = { buffer: buffer, subscription: subscription };
        contexts.push(context);
        var innerSubscription = (0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__.subscribeToResult)(this, closingNotifier, context);
        if (!innerSubscription || innerSubscription.closed) {
            this.closeBuffer(context);
        }
        else {
            innerSubscription.context = context;
            this.add(innerSubscription);
            subscription.add(innerSubscription);
        }
    };
    return BufferToggleSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_3__.OuterSubscriber));
//# sourceMappingURL=bufferToggle.js.map


/***/ }),
/* 114 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bufferWhen": () => /* binding */ bufferWhen
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_Subscription,_innerSubscribe PURE_IMPORTS_END */



function bufferWhen(closingSelector) {
    return function (source) {
        return source.lift(new BufferWhenOperator(closingSelector));
    };
}
var BufferWhenOperator = /*@__PURE__*/ (function () {
    function BufferWhenOperator(closingSelector) {
        this.closingSelector = closingSelector;
    }
    BufferWhenOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new BufferWhenSubscriber(subscriber, this.closingSelector));
    };
    return BufferWhenOperator;
}());
var BufferWhenSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(BufferWhenSubscriber, _super);
    function BufferWhenSubscriber(destination, closingSelector) {
        var _this = _super.call(this, destination) || this;
        _this.closingSelector = closingSelector;
        _this.subscribing = false;
        _this.openBuffer();
        return _this;
    }
    BufferWhenSubscriber.prototype._next = function (value) {
        this.buffer.push(value);
    };
    BufferWhenSubscriber.prototype._complete = function () {
        var buffer = this.buffer;
        if (buffer) {
            this.destination.next(buffer);
        }
        _super.prototype._complete.call(this);
    };
    BufferWhenSubscriber.prototype._unsubscribe = function () {
        this.buffer = undefined;
        this.subscribing = false;
    };
    BufferWhenSubscriber.prototype.notifyNext = function () {
        this.openBuffer();
    };
    BufferWhenSubscriber.prototype.notifyComplete = function () {
        if (this.subscribing) {
            this.complete();
        }
        else {
            this.openBuffer();
        }
    };
    BufferWhenSubscriber.prototype.openBuffer = function () {
        var closingSubscription = this.closingSubscription;
        if (closingSubscription) {
            this.remove(closingSubscription);
            closingSubscription.unsubscribe();
        }
        var buffer = this.buffer;
        if (this.buffer) {
            this.destination.next(buffer);
        }
        this.buffer = [];
        var closingNotifier;
        try {
            var closingSelector = this.closingSelector;
            closingNotifier = closingSelector();
        }
        catch (err) {
            return this.error(err);
        }
        closingSubscription = new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription();
        this.closingSubscription = closingSubscription;
        this.add(closingSubscription);
        this.subscribing = true;
        closingSubscription.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.innerSubscribe)(closingNotifier, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.SimpleInnerSubscriber(this)));
        this.subscribing = false;
    };
    return BufferWhenSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.SimpleOuterSubscriber));
//# sourceMappingURL=bufferWhen.js.map


/***/ }),
/* 115 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "catchError": () => /* binding */ catchError
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function catchError(selector) {
    return function catchErrorOperatorFunction(source) {
        var operator = new CatchOperator(selector);
        var caught = source.lift(operator);
        return (operator.caught = caught);
    };
}
var CatchOperator = /*@__PURE__*/ (function () {
    function CatchOperator(selector) {
        this.selector = selector;
    }
    CatchOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new CatchSubscriber(subscriber, this.selector, this.caught));
    };
    return CatchOperator;
}());
var CatchSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(CatchSubscriber, _super);
    function CatchSubscriber(destination, selector, caught) {
        var _this = _super.call(this, destination) || this;
        _this.selector = selector;
        _this.caught = caught;
        return _this;
    }
    CatchSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var result = void 0;
            try {
                result = this.selector(err, this.caught);
            }
            catch (err2) {
                _super.prototype.error.call(this, err2);
                return;
            }
            this._unsubscribeAndRecycle();
            var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this);
            this.add(innerSubscriber);
            var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(result, innerSubscriber);
            if (innerSubscription !== innerSubscriber) {
                this.add(innerSubscription);
            }
        }
    };
    return CatchSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=catchError.js.map


/***/ }),
/* 116 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "combineAll": () => /* binding */ combineAll
/* harmony export */ });
/* harmony import */ var _observable_combineLatest__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(64);
/** PURE_IMPORTS_START _observable_combineLatest PURE_IMPORTS_END */

function combineAll(project) {
    return function (source) { return source.lift(new _observable_combineLatest__WEBPACK_IMPORTED_MODULE_0__.CombineLatestOperator(project)); };
}
//# sourceMappingURL=combineAll.js.map


/***/ }),
/* 117 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "combineLatest": () => /* binding */ combineLatest
/* harmony export */ });
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _observable_combineLatest__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(64);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79);
/** PURE_IMPORTS_START _util_isArray,_observable_combineLatest,_observable_from PURE_IMPORTS_END */



var none = {};
function combineLatest() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    var project = null;
    if (typeof observables[observables.length - 1] === 'function') {
        project = observables.pop();
    }
    if (observables.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(observables[0])) {
        observables = observables[0].slice();
    }
    return function (source) { return source.lift.call((0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.from)([source].concat(observables)), new _observable_combineLatest__WEBPACK_IMPORTED_MODULE_2__.CombineLatestOperator(project)); };
}
//# sourceMappingURL=combineLatest.js.map


/***/ }),
/* 118 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concat": () => /* binding */ concat
/* harmony export */ });
/* harmony import */ var _observable_concat__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(75);
/** PURE_IMPORTS_START _observable_concat PURE_IMPORTS_END */

function concat() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    return function (source) { return source.lift.call(_observable_concat__WEBPACK_IMPORTED_MODULE_0__.concat.apply(void 0, [source].concat(observables))); };
}
//# sourceMappingURL=concat.js.map


/***/ }),
/* 119 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatMap": () => /* binding */ concatMap
/* harmony export */ });
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(78);
/** PURE_IMPORTS_START _mergeMap PURE_IMPORTS_END */

function concatMap(project, resultSelector) {
    return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_0__.mergeMap)(project, resultSelector, 1);
}
//# sourceMappingURL=concatMap.js.map


/***/ }),
/* 120 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "concatMapTo": () => /* binding */ concatMapTo
/* harmony export */ });
/* harmony import */ var _concatMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(119);
/** PURE_IMPORTS_START _concatMap PURE_IMPORTS_END */

function concatMapTo(innerObservable, resultSelector) {
    return (0,_concatMap__WEBPACK_IMPORTED_MODULE_0__.concatMap)(function () { return innerObservable; }, resultSelector);
}
//# sourceMappingURL=concatMapTo.js.map


/***/ }),
/* 121 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "count": () => /* binding */ count
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function count(predicate) {
    return function (source) { return source.lift(new CountOperator(predicate, source)); };
}
var CountOperator = /*@__PURE__*/ (function () {
    function CountOperator(predicate, source) {
        this.predicate = predicate;
        this.source = source;
    }
    CountOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new CountSubscriber(subscriber, this.predicate, this.source));
    };
    return CountOperator;
}());
var CountSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(CountSubscriber, _super);
    function CountSubscriber(destination, predicate, source) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.source = source;
        _this.count = 0;
        _this.index = 0;
        return _this;
    }
    CountSubscriber.prototype._next = function (value) {
        if (this.predicate) {
            this._tryPredicate(value);
        }
        else {
            this.count++;
        }
    };
    CountSubscriber.prototype._tryPredicate = function (value) {
        var result;
        try {
            result = this.predicate(value, this.index++, this.source);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        if (result) {
            this.count++;
        }
    };
    CountSubscriber.prototype._complete = function () {
        this.destination.next(this.count);
        this.destination.complete();
    };
    return CountSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=count.js.map


/***/ }),
/* 122 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "debounce": () => /* binding */ debounce
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function debounce(durationSelector) {
    return function (source) { return source.lift(new DebounceOperator(durationSelector)); };
}
var DebounceOperator = /*@__PURE__*/ (function () {
    function DebounceOperator(durationSelector) {
        this.durationSelector = durationSelector;
    }
    DebounceOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DebounceSubscriber(subscriber, this.durationSelector));
    };
    return DebounceOperator;
}());
var DebounceSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(DebounceSubscriber, _super);
    function DebounceSubscriber(destination, durationSelector) {
        var _this = _super.call(this, destination) || this;
        _this.durationSelector = durationSelector;
        _this.hasValue = false;
        return _this;
    }
    DebounceSubscriber.prototype._next = function (value) {
        try {
            var result = this.durationSelector.call(this, value);
            if (result) {
                this._tryNext(value, result);
            }
        }
        catch (err) {
            this.destination.error(err);
        }
    };
    DebounceSubscriber.prototype._complete = function () {
        this.emitValue();
        this.destination.complete();
    };
    DebounceSubscriber.prototype._tryNext = function (value, duration) {
        var subscription = this.durationSubscription;
        this.value = value;
        this.hasValue = true;
        if (subscription) {
            subscription.unsubscribe();
            this.remove(subscription);
        }
        subscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(duration, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this));
        if (subscription && !subscription.closed) {
            this.add(this.durationSubscription = subscription);
        }
    };
    DebounceSubscriber.prototype.notifyNext = function () {
        this.emitValue();
    };
    DebounceSubscriber.prototype.notifyComplete = function () {
        this.emitValue();
    };
    DebounceSubscriber.prototype.emitValue = function () {
        if (this.hasValue) {
            var value = this.value;
            var subscription = this.durationSubscription;
            if (subscription) {
                this.durationSubscription = undefined;
                subscription.unsubscribe();
                this.remove(subscription);
            }
            this.value = undefined;
            this.hasValue = false;
            _super.prototype._next.call(this, value);
        }
    };
    return DebounceSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=debounce.js.map


/***/ }),
/* 123 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "debounceTime": () => /* binding */ debounceTime
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async PURE_IMPORTS_END */



function debounceTime(dueTime, scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return function (source) { return source.lift(new DebounceTimeOperator(dueTime, scheduler)); };
}
var DebounceTimeOperator = /*@__PURE__*/ (function () {
    function DebounceTimeOperator(dueTime, scheduler) {
        this.dueTime = dueTime;
        this.scheduler = scheduler;
    }
    DebounceTimeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DebounceTimeSubscriber(subscriber, this.dueTime, this.scheduler));
    };
    return DebounceTimeOperator;
}());
var DebounceTimeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(DebounceTimeSubscriber, _super);
    function DebounceTimeSubscriber(destination, dueTime, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.dueTime = dueTime;
        _this.scheduler = scheduler;
        _this.debouncedSubscription = null;
        _this.lastValue = null;
        _this.hasValue = false;
        return _this;
    }
    DebounceTimeSubscriber.prototype._next = function (value) {
        this.clearDebounce();
        this.lastValue = value;
        this.hasValue = true;
        this.add(this.debouncedSubscription = this.scheduler.schedule(dispatchNext, this.dueTime, this));
    };
    DebounceTimeSubscriber.prototype._complete = function () {
        this.debouncedNext();
        this.destination.complete();
    };
    DebounceTimeSubscriber.prototype.debouncedNext = function () {
        this.clearDebounce();
        if (this.hasValue) {
            var lastValue = this.lastValue;
            this.lastValue = null;
            this.hasValue = false;
            this.destination.next(lastValue);
        }
    };
    DebounceTimeSubscriber.prototype.clearDebounce = function () {
        var debouncedSubscription = this.debouncedSubscription;
        if (debouncedSubscription !== null) {
            this.remove(debouncedSubscription);
            debouncedSubscription.unsubscribe();
            this.debouncedSubscription = null;
        }
    };
    return DebounceTimeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
function dispatchNext(subscriber) {
    subscriber.debouncedNext();
}
//# sourceMappingURL=debounceTime.js.map


/***/ }),
/* 124 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultIfEmpty": () => /* binding */ defaultIfEmpty
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function defaultIfEmpty(defaultValue) {
    if (defaultValue === void 0) {
        defaultValue = null;
    }
    return function (source) { return source.lift(new DefaultIfEmptyOperator(defaultValue)); };
}
var DefaultIfEmptyOperator = /*@__PURE__*/ (function () {
    function DefaultIfEmptyOperator(defaultValue) {
        this.defaultValue = defaultValue;
    }
    DefaultIfEmptyOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DefaultIfEmptySubscriber(subscriber, this.defaultValue));
    };
    return DefaultIfEmptyOperator;
}());
var DefaultIfEmptySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(DefaultIfEmptySubscriber, _super);
    function DefaultIfEmptySubscriber(destination, defaultValue) {
        var _this = _super.call(this, destination) || this;
        _this.defaultValue = defaultValue;
        _this.isEmpty = true;
        return _this;
    }
    DefaultIfEmptySubscriber.prototype._next = function (value) {
        this.isEmpty = false;
        this.destination.next(value);
    };
    DefaultIfEmptySubscriber.prototype._complete = function () {
        if (this.isEmpty) {
            this.destination.next(this.defaultValue);
        }
        this.destination.complete();
    };
    return DefaultIfEmptySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=defaultIfEmpty.js.map


/***/ }),
/* 125 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "delay": () => /* binding */ delay
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _util_isDate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(126);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7);
/* harmony import */ var _Notification__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(31);
/** PURE_IMPORTS_START tslib,_scheduler_async,_util_isDate,_Subscriber,_Notification PURE_IMPORTS_END */





function delay(delay, scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    var absoluteDelay = (0,_util_isDate__WEBPACK_IMPORTED_MODULE_1__.isDate)(delay);
    var delayFor = absoluteDelay ? (+delay - scheduler.now()) : Math.abs(delay);
    return function (source) { return source.lift(new DelayOperator(delayFor, scheduler)); };
}
var DelayOperator = /*@__PURE__*/ (function () {
    function DelayOperator(delay, scheduler) {
        this.delay = delay;
        this.scheduler = scheduler;
    }
    DelayOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DelaySubscriber(subscriber, this.delay, this.scheduler));
    };
    return DelayOperator;
}());
var DelaySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(DelaySubscriber, _super);
    function DelaySubscriber(destination, delay, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.delay = delay;
        _this.scheduler = scheduler;
        _this.queue = [];
        _this.active = false;
        _this.errored = false;
        return _this;
    }
    DelaySubscriber.dispatch = function (state) {
        var source = state.source;
        var queue = source.queue;
        var scheduler = state.scheduler;
        var destination = state.destination;
        while (queue.length > 0 && (queue[0].time - scheduler.now()) <= 0) {
            queue.shift().notification.observe(destination);
        }
        if (queue.length > 0) {
            var delay_1 = Math.max(0, queue[0].time - scheduler.now());
            this.schedule(state, delay_1);
        }
        else {
            this.unsubscribe();
            source.active = false;
        }
    };
    DelaySubscriber.prototype._schedule = function (scheduler) {
        this.active = true;
        var destination = this.destination;
        destination.add(scheduler.schedule(DelaySubscriber.dispatch, this.delay, {
            source: this, destination: this.destination, scheduler: scheduler
        }));
    };
    DelaySubscriber.prototype.scheduleNotification = function (notification) {
        if (this.errored === true) {
            return;
        }
        var scheduler = this.scheduler;
        var message = new DelayMessage(scheduler.now() + this.delay, notification);
        this.queue.push(message);
        if (this.active === false) {
            this._schedule(scheduler);
        }
    };
    DelaySubscriber.prototype._next = function (value) {
        this.scheduleNotification(_Notification__WEBPACK_IMPORTED_MODULE_3__.Notification.createNext(value));
    };
    DelaySubscriber.prototype._error = function (err) {
        this.errored = true;
        this.queue = [];
        this.destination.error(err);
        this.unsubscribe();
    };
    DelaySubscriber.prototype._complete = function () {
        this.scheduleNotification(_Notification__WEBPACK_IMPORTED_MODULE_3__.Notification.createComplete());
        this.unsubscribe();
    };
    return DelaySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_4__.Subscriber));
var DelayMessage = /*@__PURE__*/ (function () {
    function DelayMessage(time, notification) {
        this.time = time;
        this.notification = notification;
    }
    return DelayMessage;
}());
//# sourceMappingURL=delay.js.map


/***/ }),
/* 126 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isDate": () => /* binding */ isDate
/* harmony export */ });
/** PURE_IMPORTS_START  PURE_IMPORTS_END */
function isDate(value) {
    return value instanceof Date && !isNaN(+value);
}
//# sourceMappingURL=isDate.js.map


/***/ }),
/* 127 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "delayWhen": () => /* binding */ delayWhen
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(7);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(74);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(65);
/** PURE_IMPORTS_START tslib,_Subscriber,_Observable,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */





function delayWhen(delayDurationSelector, subscriptionDelay) {
    if (subscriptionDelay) {
        return function (source) {
            return new SubscriptionDelayObservable(source, subscriptionDelay)
                .lift(new DelayWhenOperator(delayDurationSelector));
        };
    }
    return function (source) { return source.lift(new DelayWhenOperator(delayDurationSelector)); };
}
var DelayWhenOperator = /*@__PURE__*/ (function () {
    function DelayWhenOperator(delayDurationSelector) {
        this.delayDurationSelector = delayDurationSelector;
    }
    DelayWhenOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DelayWhenSubscriber(subscriber, this.delayDurationSelector));
    };
    return DelayWhenOperator;
}());
var DelayWhenSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(DelayWhenSubscriber, _super);
    function DelayWhenSubscriber(destination, delayDurationSelector) {
        var _this = _super.call(this, destination) || this;
        _this.delayDurationSelector = delayDurationSelector;
        _this.completed = false;
        _this.delayNotifierSubscriptions = [];
        _this.index = 0;
        return _this;
    }
    DelayWhenSubscriber.prototype.notifyNext = function (outerValue, _innerValue, _outerIndex, _innerIndex, innerSub) {
        this.destination.next(outerValue);
        this.removeSubscription(innerSub);
        this.tryComplete();
    };
    DelayWhenSubscriber.prototype.notifyError = function (error, innerSub) {
        this._error(error);
    };
    DelayWhenSubscriber.prototype.notifyComplete = function (innerSub) {
        var value = this.removeSubscription(innerSub);
        if (value) {
            this.destination.next(value);
        }
        this.tryComplete();
    };
    DelayWhenSubscriber.prototype._next = function (value) {
        var index = this.index++;
        try {
            var delayNotifier = this.delayDurationSelector(value, index);
            if (delayNotifier) {
                this.tryDelay(delayNotifier, value);
            }
        }
        catch (err) {
            this.destination.error(err);
        }
    };
    DelayWhenSubscriber.prototype._complete = function () {
        this.completed = true;
        this.tryComplete();
        this.unsubscribe();
    };
    DelayWhenSubscriber.prototype.removeSubscription = function (subscription) {
        subscription.unsubscribe();
        var subscriptionIdx = this.delayNotifierSubscriptions.indexOf(subscription);
        if (subscriptionIdx !== -1) {
            this.delayNotifierSubscriptions.splice(subscriptionIdx, 1);
        }
        return subscription.outerValue;
    };
    DelayWhenSubscriber.prototype.tryDelay = function (delayNotifier, value) {
        var notifierSubscription = (0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__.subscribeToResult)(this, delayNotifier, value);
        if (notifierSubscription && !notifierSubscription.closed) {
            var destination = this.destination;
            destination.add(notifierSubscription);
            this.delayNotifierSubscriptions.push(notifierSubscription);
        }
    };
    DelayWhenSubscriber.prototype.tryComplete = function () {
        if (this.completed && this.delayNotifierSubscriptions.length === 0) {
            this.destination.complete();
        }
    };
    return DelayWhenSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_2__.OuterSubscriber));
var SubscriptionDelayObservable = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SubscriptionDelayObservable, _super);
    function SubscriptionDelayObservable(source, subscriptionDelay) {
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.subscriptionDelay = subscriptionDelay;
        return _this;
    }
    SubscriptionDelayObservable.prototype._subscribe = function (subscriber) {
        this.subscriptionDelay.subscribe(new SubscriptionDelaySubscriber(subscriber, this.source));
    };
    return SubscriptionDelayObservable;
}(_Observable__WEBPACK_IMPORTED_MODULE_3__.Observable));
var SubscriptionDelaySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SubscriptionDelaySubscriber, _super);
    function SubscriptionDelaySubscriber(parent, source) {
        var _this = _super.call(this) || this;
        _this.parent = parent;
        _this.source = source;
        _this.sourceSubscribed = false;
        return _this;
    }
    SubscriptionDelaySubscriber.prototype._next = function (unused) {
        this.subscribeToSource();
    };
    SubscriptionDelaySubscriber.prototype._error = function (err) {
        this.unsubscribe();
        this.parent.error(err);
    };
    SubscriptionDelaySubscriber.prototype._complete = function () {
        this.unsubscribe();
        this.subscribeToSource();
    };
    SubscriptionDelaySubscriber.prototype.subscribeToSource = function () {
        if (!this.sourceSubscribed) {
            this.sourceSubscribed = true;
            this.unsubscribe();
            this.source.subscribe(this.parent);
        }
    };
    return SubscriptionDelaySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_4__.Subscriber));
//# sourceMappingURL=delayWhen.js.map


/***/ }),
/* 128 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dematerialize": () => /* binding */ dematerialize
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function dematerialize() {
    return function dematerializeOperatorFunction(source) {
        return source.lift(new DeMaterializeOperator());
    };
}
var DeMaterializeOperator = /*@__PURE__*/ (function () {
    function DeMaterializeOperator() {
    }
    DeMaterializeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DeMaterializeSubscriber(subscriber));
    };
    return DeMaterializeOperator;
}());
var DeMaterializeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(DeMaterializeSubscriber, _super);
    function DeMaterializeSubscriber(destination) {
        return _super.call(this, destination) || this;
    }
    DeMaterializeSubscriber.prototype._next = function (value) {
        value.observe(this.destination);
    };
    return DeMaterializeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=dematerialize.js.map


/***/ }),
/* 129 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "distinct": () => /* binding */ distinct,
/* harmony export */   "DistinctSubscriber": () => /* binding */ DistinctSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function distinct(keySelector, flushes) {
    return function (source) { return source.lift(new DistinctOperator(keySelector, flushes)); };
}
var DistinctOperator = /*@__PURE__*/ (function () {
    function DistinctOperator(keySelector, flushes) {
        this.keySelector = keySelector;
        this.flushes = flushes;
    }
    DistinctOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DistinctSubscriber(subscriber, this.keySelector, this.flushes));
    };
    return DistinctOperator;
}());
var DistinctSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(DistinctSubscriber, _super);
    function DistinctSubscriber(destination, keySelector, flushes) {
        var _this = _super.call(this, destination) || this;
        _this.keySelector = keySelector;
        _this.values = new Set();
        if (flushes) {
            _this.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(flushes, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(_this)));
        }
        return _this;
    }
    DistinctSubscriber.prototype.notifyNext = function () {
        this.values.clear();
    };
    DistinctSubscriber.prototype.notifyError = function (error) {
        this._error(error);
    };
    DistinctSubscriber.prototype._next = function (value) {
        if (this.keySelector) {
            this._useKeySelector(value);
        }
        else {
            this._finalizeNext(value, value);
        }
    };
    DistinctSubscriber.prototype._useKeySelector = function (value) {
        var key;
        var destination = this.destination;
        try {
            key = this.keySelector(value);
        }
        catch (err) {
            destination.error(err);
            return;
        }
        this._finalizeNext(key, value);
    };
    DistinctSubscriber.prototype._finalizeNext = function (key, value) {
        var values = this.values;
        if (!values.has(key)) {
            values.add(key);
            this.destination.next(value);
        }
    };
    return DistinctSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));

//# sourceMappingURL=distinct.js.map


/***/ }),
/* 130 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "distinctUntilChanged": () => /* binding */ distinctUntilChanged
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function distinctUntilChanged(compare, keySelector) {
    return function (source) { return source.lift(new DistinctUntilChangedOperator(compare, keySelector)); };
}
var DistinctUntilChangedOperator = /*@__PURE__*/ (function () {
    function DistinctUntilChangedOperator(compare, keySelector) {
        this.compare = compare;
        this.keySelector = keySelector;
    }
    DistinctUntilChangedOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new DistinctUntilChangedSubscriber(subscriber, this.compare, this.keySelector));
    };
    return DistinctUntilChangedOperator;
}());
var DistinctUntilChangedSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(DistinctUntilChangedSubscriber, _super);
    function DistinctUntilChangedSubscriber(destination, compare, keySelector) {
        var _this = _super.call(this, destination) || this;
        _this.keySelector = keySelector;
        _this.hasKey = false;
        if (typeof compare === 'function') {
            _this.compare = compare;
        }
        return _this;
    }
    DistinctUntilChangedSubscriber.prototype.compare = function (x, y) {
        return x === y;
    };
    DistinctUntilChangedSubscriber.prototype._next = function (value) {
        var key;
        try {
            var keySelector = this.keySelector;
            key = keySelector ? keySelector(value) : value;
        }
        catch (err) {
            return this.destination.error(err);
        }
        var result = false;
        if (this.hasKey) {
            try {
                var compare = this.compare;
                result = compare(this.key, key);
            }
            catch (err) {
                return this.destination.error(err);
            }
        }
        else {
            this.hasKey = true;
        }
        if (!result) {
            this.key = key;
            this.destination.next(value);
        }
    };
    return DistinctUntilChangedSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=distinctUntilChanged.js.map


/***/ }),
/* 131 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "distinctUntilKeyChanged": () => /* binding */ distinctUntilKeyChanged
/* harmony export */ });
/* harmony import */ var _distinctUntilChanged__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(130);
/** PURE_IMPORTS_START _distinctUntilChanged PURE_IMPORTS_END */

function distinctUntilKeyChanged(key, compare) {
    return (0,_distinctUntilChanged__WEBPACK_IMPORTED_MODULE_0__.distinctUntilChanged)(function (x, y) { return compare ? compare(x[key], y[key]) : x[key] === y[key]; });
}
//# sourceMappingURL=distinctUntilKeyChanged.js.map


/***/ }),
/* 132 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "elementAt": () => /* binding */ elementAt
/* harmony export */ });
/* harmony import */ var _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(58);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(100);
/* harmony import */ var _throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(134);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(124);
/* harmony import */ var _take__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(133);
/** PURE_IMPORTS_START _util_ArgumentOutOfRangeError,_filter,_throwIfEmpty,_defaultIfEmpty,_take PURE_IMPORTS_END */





function elementAt(index, defaultValue) {
    if (index < 0) {
        throw new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__.ArgumentOutOfRangeError();
    }
    var hasDefaultValue = arguments.length >= 2;
    return function (source) {
        return source.pipe((0,_filter__WEBPACK_IMPORTED_MODULE_1__.filter)(function (v, i) { return i === index; }), (0,_take__WEBPACK_IMPORTED_MODULE_2__.take)(1), hasDefaultValue
            ? (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(defaultValue)
            : (0,_throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__.throwIfEmpty)(function () { return new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__.ArgumentOutOfRangeError(); }));
    };
}
//# sourceMappingURL=elementAt.js.map


/***/ }),
/* 133 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "take": () => /* binding */ take
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(38);
/** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError,_observable_empty PURE_IMPORTS_END */




function take(count) {
    return function (source) {
        if (count === 0) {
            return (0,_observable_empty__WEBPACK_IMPORTED_MODULE_0__.empty)();
        }
        else {
            return source.lift(new TakeOperator(count));
        }
    };
}
var TakeOperator = /*@__PURE__*/ (function () {
    function TakeOperator(total) {
        this.total = total;
        if (this.total < 0) {
            throw new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_1__.ArgumentOutOfRangeError;
        }
    }
    TakeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new TakeSubscriber(subscriber, this.total));
    };
    return TakeOperator;
}());
var TakeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(TakeSubscriber, _super);
    function TakeSubscriber(destination, total) {
        var _this = _super.call(this, destination) || this;
        _this.total = total;
        _this.count = 0;
        return _this;
    }
    TakeSubscriber.prototype._next = function (value) {
        var total = this.total;
        var count = ++this.count;
        if (count <= total) {
            this.destination.next(value);
            if (count === total) {
                this.destination.complete();
                this.unsubscribe();
            }
        }
    };
    return TakeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_3__.Subscriber));
//# sourceMappingURL=take.js.map


/***/ }),
/* 134 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throwIfEmpty": () => /* binding */ throwIfEmpty
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(59);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_util_EmptyError,_Subscriber PURE_IMPORTS_END */



function throwIfEmpty(errorFactory) {
    if (errorFactory === void 0) {
        errorFactory = defaultErrorFactory;
    }
    return function (source) {
        return source.lift(new ThrowIfEmptyOperator(errorFactory));
    };
}
var ThrowIfEmptyOperator = /*@__PURE__*/ (function () {
    function ThrowIfEmptyOperator(errorFactory) {
        this.errorFactory = errorFactory;
    }
    ThrowIfEmptyOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ThrowIfEmptySubscriber(subscriber, this.errorFactory));
    };
    return ThrowIfEmptyOperator;
}());
var ThrowIfEmptySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ThrowIfEmptySubscriber, _super);
    function ThrowIfEmptySubscriber(destination, errorFactory) {
        var _this = _super.call(this, destination) || this;
        _this.errorFactory = errorFactory;
        _this.hasValue = false;
        return _this;
    }
    ThrowIfEmptySubscriber.prototype._next = function (value) {
        this.hasValue = true;
        this.destination.next(value);
    };
    ThrowIfEmptySubscriber.prototype._complete = function () {
        if (!this.hasValue) {
            var err = void 0;
            try {
                err = this.errorFactory();
            }
            catch (e) {
                err = e;
            }
            this.destination.error(err);
        }
        else {
            return this.destination.complete();
        }
    };
    return ThrowIfEmptySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
function defaultErrorFactory() {
    return new _util_EmptyError__WEBPACK_IMPORTED_MODULE_2__.EmptyError();
}
//# sourceMappingURL=throwIfEmpty.js.map


/***/ }),
/* 135 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "endWith": () => /* binding */ endWith
/* harmony export */ });
/* harmony import */ var _observable_concat__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(75);
/* harmony import */ var _observable_of__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32);
/** PURE_IMPORTS_START _observable_concat,_observable_of PURE_IMPORTS_END */


function endWith() {
    var array = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        array[_i] = arguments[_i];
    }
    return function (source) { return (0,_observable_concat__WEBPACK_IMPORTED_MODULE_0__.concat)(source, _observable_of__WEBPACK_IMPORTED_MODULE_1__.of.apply(void 0, array)); };
}
//# sourceMappingURL=endWith.js.map


/***/ }),
/* 136 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "every": () => /* binding */ every
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function every(predicate, thisArg) {
    return function (source) { return source.lift(new EveryOperator(predicate, thisArg, source)); };
}
var EveryOperator = /*@__PURE__*/ (function () {
    function EveryOperator(predicate, thisArg, source) {
        this.predicate = predicate;
        this.thisArg = thisArg;
        this.source = source;
    }
    EveryOperator.prototype.call = function (observer, source) {
        return source.subscribe(new EverySubscriber(observer, this.predicate, this.thisArg, this.source));
    };
    return EveryOperator;
}());
var EverySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(EverySubscriber, _super);
    function EverySubscriber(destination, predicate, thisArg, source) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.thisArg = thisArg;
        _this.source = source;
        _this.index = 0;
        _this.thisArg = thisArg || _this;
        return _this;
    }
    EverySubscriber.prototype.notifyComplete = function (everyValueMatch) {
        this.destination.next(everyValueMatch);
        this.destination.complete();
    };
    EverySubscriber.prototype._next = function (value) {
        var result = false;
        try {
            result = this.predicate.call(this.thisArg, value, this.index++, this.source);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        if (!result) {
            this.notifyComplete(false);
        }
    };
    EverySubscriber.prototype._complete = function () {
        this.notifyComplete(true);
    };
    return EverySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=every.js.map


/***/ }),
/* 137 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "exhaust": () => /* binding */ exhaust
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function exhaust() {
    return function (source) { return source.lift(new SwitchFirstOperator()); };
}
var SwitchFirstOperator = /*@__PURE__*/ (function () {
    function SwitchFirstOperator() {
    }
    SwitchFirstOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SwitchFirstSubscriber(subscriber));
    };
    return SwitchFirstOperator;
}());
var SwitchFirstSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SwitchFirstSubscriber, _super);
    function SwitchFirstSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.hasCompleted = false;
        _this.hasSubscription = false;
        return _this;
    }
    SwitchFirstSubscriber.prototype._next = function (value) {
        if (!this.hasSubscription) {
            this.hasSubscription = true;
            this.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(value, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this)));
        }
    };
    SwitchFirstSubscriber.prototype._complete = function () {
        this.hasCompleted = true;
        if (!this.hasSubscription) {
            this.destination.complete();
        }
    };
    SwitchFirstSubscriber.prototype.notifyComplete = function () {
        this.hasSubscription = false;
        if (this.hasCompleted) {
            this.destination.complete();
        }
    };
    return SwitchFirstSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=exhaust.js.map


/***/ }),
/* 138 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "exhaustMap": () => /* binding */ exhaustMap
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(79);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_map,_observable_from,_innerSubscribe PURE_IMPORTS_END */




function exhaustMap(project, resultSelector) {
    if (resultSelector) {
        return function (source) { return source.pipe(exhaustMap(function (a, i) { return (0,_observable_from__WEBPACK_IMPORTED_MODULE_0__.from)(project(a, i)).pipe((0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (b, ii) { return resultSelector(a, b, i, ii); })); })); };
    }
    return function (source) {
        return source.lift(new ExhaustMapOperator(project));
    };
}
var ExhaustMapOperator = /*@__PURE__*/ (function () {
    function ExhaustMapOperator(project) {
        this.project = project;
    }
    ExhaustMapOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ExhaustMapSubscriber(subscriber, this.project));
    };
    return ExhaustMapOperator;
}());
var ExhaustMapSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(ExhaustMapSubscriber, _super);
    function ExhaustMapSubscriber(destination, project) {
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.hasSubscription = false;
        _this.hasCompleted = false;
        _this.index = 0;
        return _this;
    }
    ExhaustMapSubscriber.prototype._next = function (value) {
        if (!this.hasSubscription) {
            this.tryNext(value);
        }
    };
    ExhaustMapSubscriber.prototype.tryNext = function (value) {
        var result;
        var index = this.index++;
        try {
            result = this.project(value, index);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.hasSubscription = true;
        this._innerSub(result);
    };
    ExhaustMapSubscriber.prototype._innerSub = function (result) {
        var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleInnerSubscriber(this);
        var destination = this.destination;
        destination.add(innerSubscriber);
        var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.innerSubscribe)(result, innerSubscriber);
        if (innerSubscription !== innerSubscriber) {
            destination.add(innerSubscription);
        }
    };
    ExhaustMapSubscriber.prototype._complete = function () {
        this.hasCompleted = true;
        if (!this.hasSubscription) {
            this.destination.complete();
        }
        this.unsubscribe();
    };
    ExhaustMapSubscriber.prototype.notifyNext = function (innerValue) {
        this.destination.next(innerValue);
    };
    ExhaustMapSubscriber.prototype.notifyError = function (err) {
        this.destination.error(err);
    };
    ExhaustMapSubscriber.prototype.notifyComplete = function () {
        this.hasSubscription = false;
        if (this.hasCompleted) {
            this.destination.complete();
        }
    };
    return ExhaustMapSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleOuterSubscriber));
//# sourceMappingURL=exhaustMap.js.map


/***/ }),
/* 139 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "expand": () => /* binding */ expand,
/* harmony export */   "ExpandOperator": () => /* binding */ ExpandOperator,
/* harmony export */   "ExpandSubscriber": () => /* binding */ ExpandSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function expand(project, concurrent, scheduler) {
    if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
    }
    concurrent = (concurrent || 0) < 1 ? Number.POSITIVE_INFINITY : concurrent;
    return function (source) { return source.lift(new ExpandOperator(project, concurrent, scheduler)); };
}
var ExpandOperator = /*@__PURE__*/ (function () {
    function ExpandOperator(project, concurrent, scheduler) {
        this.project = project;
        this.concurrent = concurrent;
        this.scheduler = scheduler;
    }
    ExpandOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ExpandSubscriber(subscriber, this.project, this.concurrent, this.scheduler));
    };
    return ExpandOperator;
}());

var ExpandSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ExpandSubscriber, _super);
    function ExpandSubscriber(destination, project, concurrent, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.concurrent = concurrent;
        _this.scheduler = scheduler;
        _this.index = 0;
        _this.active = 0;
        _this.hasCompleted = false;
        if (concurrent < Number.POSITIVE_INFINITY) {
            _this.buffer = [];
        }
        return _this;
    }
    ExpandSubscriber.dispatch = function (arg) {
        var subscriber = arg.subscriber, result = arg.result, value = arg.value, index = arg.index;
        subscriber.subscribeToProjection(result, value, index);
    };
    ExpandSubscriber.prototype._next = function (value) {
        var destination = this.destination;
        if (destination.closed) {
            this._complete();
            return;
        }
        var index = this.index++;
        if (this.active < this.concurrent) {
            destination.next(value);
            try {
                var project = this.project;
                var result = project(value, index);
                if (!this.scheduler) {
                    this.subscribeToProjection(result, value, index);
                }
                else {
                    var state = { subscriber: this, result: result, value: value, index: index };
                    var destination_1 = this.destination;
                    destination_1.add(this.scheduler.schedule(ExpandSubscriber.dispatch, 0, state));
                }
            }
            catch (e) {
                destination.error(e);
            }
        }
        else {
            this.buffer.push(value);
        }
    };
    ExpandSubscriber.prototype.subscribeToProjection = function (result, value, index) {
        this.active++;
        var destination = this.destination;
        destination.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(result, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this)));
    };
    ExpandSubscriber.prototype._complete = function () {
        this.hasCompleted = true;
        if (this.hasCompleted && this.active === 0) {
            this.destination.complete();
        }
        this.unsubscribe();
    };
    ExpandSubscriber.prototype.notifyNext = function (innerValue) {
        this._next(innerValue);
    };
    ExpandSubscriber.prototype.notifyComplete = function () {
        var buffer = this.buffer;
        this.active--;
        if (buffer && buffer.length > 0) {
            this._next(buffer.shift());
        }
        if (this.hasCompleted && this.active === 0) {
            this.destination.complete();
        }
    };
    return ExpandSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));

//# sourceMappingURL=expand.js.map


/***/ }),
/* 140 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "finalize": () => /* binding */ finalize
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(13);
/** PURE_IMPORTS_START tslib,_Subscriber,_Subscription PURE_IMPORTS_END */



function finalize(callback) {
    return function (source) { return source.lift(new FinallyOperator(callback)); };
}
var FinallyOperator = /*@__PURE__*/ (function () {
    function FinallyOperator(callback) {
        this.callback = callback;
    }
    FinallyOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new FinallySubscriber(subscriber, this.callback));
    };
    return FinallyOperator;
}());
var FinallySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(FinallySubscriber, _super);
    function FinallySubscriber(destination, callback) {
        var _this = _super.call(this, destination) || this;
        _this.add(new _Subscription__WEBPACK_IMPORTED_MODULE_1__.Subscription(callback));
        return _this;
    }
    return FinallySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
//# sourceMappingURL=finalize.js.map


/***/ }),
/* 141 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "find": () => /* binding */ find,
/* harmony export */   "FindValueOperator": () => /* binding */ FindValueOperator,
/* harmony export */   "FindValueSubscriber": () => /* binding */ FindValueSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function find(predicate, thisArg) {
    if (typeof predicate !== 'function') {
        throw new TypeError('predicate is not a function');
    }
    return function (source) { return source.lift(new FindValueOperator(predicate, source, false, thisArg)); };
}
var FindValueOperator = /*@__PURE__*/ (function () {
    function FindValueOperator(predicate, source, yieldIndex, thisArg) {
        this.predicate = predicate;
        this.source = source;
        this.yieldIndex = yieldIndex;
        this.thisArg = thisArg;
    }
    FindValueOperator.prototype.call = function (observer, source) {
        return source.subscribe(new FindValueSubscriber(observer, this.predicate, this.source, this.yieldIndex, this.thisArg));
    };
    return FindValueOperator;
}());

var FindValueSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(FindValueSubscriber, _super);
    function FindValueSubscriber(destination, predicate, source, yieldIndex, thisArg) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.source = source;
        _this.yieldIndex = yieldIndex;
        _this.thisArg = thisArg;
        _this.index = 0;
        return _this;
    }
    FindValueSubscriber.prototype.notifyComplete = function (value) {
        var destination = this.destination;
        destination.next(value);
        destination.complete();
        this.unsubscribe();
    };
    FindValueSubscriber.prototype._next = function (value) {
        var _a = this, predicate = _a.predicate, thisArg = _a.thisArg;
        var index = this.index++;
        try {
            var result = predicate.call(thisArg || this, value, index, this.source);
            if (result) {
                this.notifyComplete(this.yieldIndex ? index : value);
            }
        }
        catch (err) {
            this.destination.error(err);
        }
    };
    FindValueSubscriber.prototype._complete = function () {
        this.notifyComplete(this.yieldIndex ? -1 : undefined);
    };
    return FindValueSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

//# sourceMappingURL=find.js.map


/***/ }),
/* 142 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "findIndex": () => /* binding */ findIndex
/* harmony export */ });
/* harmony import */ var _operators_find__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(141);
/** PURE_IMPORTS_START _operators_find PURE_IMPORTS_END */

function findIndex(predicate, thisArg) {
    return function (source) { return source.lift(new _operators_find__WEBPACK_IMPORTED_MODULE_0__.FindValueOperator(predicate, source, true, thisArg)); };
}
//# sourceMappingURL=findIndex.js.map


/***/ }),
/* 143 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "first": () => /* binding */ first
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(59);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(100);
/* harmony import */ var _take__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(133);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(124);
/* harmony import */ var _throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(134);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);
/** PURE_IMPORTS_START _util_EmptyError,_filter,_take,_defaultIfEmpty,_throwIfEmpty,_util_identity PURE_IMPORTS_END */






function first(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) { return source.pipe(predicate ? (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(function (v, i) { return predicate(v, i, source); }) : _util_identity__WEBPACK_IMPORTED_MODULE_1__.identity, (0,_take__WEBPACK_IMPORTED_MODULE_2__.take)(1), hasDefaultValue ? (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(defaultValue) : (0,_throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__.throwIfEmpty)(function () { return new _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__.EmptyError(); })); };
}
//# sourceMappingURL=first.js.map


/***/ }),
/* 144 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ignoreElements": () => /* binding */ ignoreElements
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function ignoreElements() {
    return function ignoreElementsOperatorFunction(source) {
        return source.lift(new IgnoreElementsOperator());
    };
}
var IgnoreElementsOperator = /*@__PURE__*/ (function () {
    function IgnoreElementsOperator() {
    }
    IgnoreElementsOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new IgnoreElementsSubscriber(subscriber));
    };
    return IgnoreElementsOperator;
}());
var IgnoreElementsSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(IgnoreElementsSubscriber, _super);
    function IgnoreElementsSubscriber() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    IgnoreElementsSubscriber.prototype._next = function (unused) {
    };
    return IgnoreElementsSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=ignoreElements.js.map


/***/ }),
/* 145 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isEmpty": () => /* binding */ isEmpty
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function isEmpty() {
    return function (source) { return source.lift(new IsEmptyOperator()); };
}
var IsEmptyOperator = /*@__PURE__*/ (function () {
    function IsEmptyOperator() {
    }
    IsEmptyOperator.prototype.call = function (observer, source) {
        return source.subscribe(new IsEmptySubscriber(observer));
    };
    return IsEmptyOperator;
}());
var IsEmptySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(IsEmptySubscriber, _super);
    function IsEmptySubscriber(destination) {
        return _super.call(this, destination) || this;
    }
    IsEmptySubscriber.prototype.notifyComplete = function (isEmpty) {
        var destination = this.destination;
        destination.next(isEmpty);
        destination.complete();
    };
    IsEmptySubscriber.prototype._next = function (value) {
        this.notifyComplete(false);
    };
    IsEmptySubscriber.prototype._complete = function () {
        this.notifyComplete(true);
    };
    return IsEmptySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=isEmpty.js.map


/***/ }),
/* 146 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "last": () => /* binding */ last
/* harmony export */ });
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(59);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(100);
/* harmony import */ var _takeLast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(147);
/* harmony import */ var _throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(134);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(124);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);
/** PURE_IMPORTS_START _util_EmptyError,_filter,_takeLast,_throwIfEmpty,_defaultIfEmpty,_util_identity PURE_IMPORTS_END */






function last(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function (source) { return source.pipe(predicate ? (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(function (v, i) { return predicate(v, i, source); }) : _util_identity__WEBPACK_IMPORTED_MODULE_1__.identity, (0,_takeLast__WEBPACK_IMPORTED_MODULE_2__.takeLast)(1), hasDefaultValue ? (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(defaultValue) : (0,_throwIfEmpty__WEBPACK_IMPORTED_MODULE_4__.throwIfEmpty)(function () { return new _util_EmptyError__WEBPACK_IMPORTED_MODULE_5__.EmptyError(); })); };
}
//# sourceMappingURL=last.js.map


/***/ }),
/* 147 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "takeLast": () => /* binding */ takeLast
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(58);
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(38);
/** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError,_observable_empty PURE_IMPORTS_END */




function takeLast(count) {
    return function takeLastOperatorFunction(source) {
        if (count === 0) {
            return (0,_observable_empty__WEBPACK_IMPORTED_MODULE_0__.empty)();
        }
        else {
            return source.lift(new TakeLastOperator(count));
        }
    };
}
var TakeLastOperator = /*@__PURE__*/ (function () {
    function TakeLastOperator(total) {
        this.total = total;
        if (this.total < 0) {
            throw new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_1__.ArgumentOutOfRangeError;
        }
    }
    TakeLastOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new TakeLastSubscriber(subscriber, this.total));
    };
    return TakeLastOperator;
}());
var TakeLastSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(TakeLastSubscriber, _super);
    function TakeLastSubscriber(destination, total) {
        var _this = _super.call(this, destination) || this;
        _this.total = total;
        _this.ring = new Array();
        _this.count = 0;
        return _this;
    }
    TakeLastSubscriber.prototype._next = function (value) {
        var ring = this.ring;
        var total = this.total;
        var count = this.count++;
        if (ring.length < total) {
            ring.push(value);
        }
        else {
            var index = count % total;
            ring[index] = value;
        }
    };
    TakeLastSubscriber.prototype._complete = function () {
        var destination = this.destination;
        var count = this.count;
        if (count > 0) {
            var total = this.count >= this.total ? this.total : this.count;
            var ring = this.ring;
            for (var i = 0; i < total; i++) {
                var idx = (count++) % total;
                destination.next(ring[idx]);
            }
        }
        destination.complete();
    };
    return TakeLastSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_3__.Subscriber));
//# sourceMappingURL=takeLast.js.map


/***/ }),
/* 148 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mapTo": () => /* binding */ mapTo
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function mapTo(value) {
    return function (source) { return source.lift(new MapToOperator(value)); };
}
var MapToOperator = /*@__PURE__*/ (function () {
    function MapToOperator(value) {
        this.value = value;
    }
    MapToOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MapToSubscriber(subscriber, this.value));
    };
    return MapToOperator;
}());
var MapToSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(MapToSubscriber, _super);
    function MapToSubscriber(destination, value) {
        var _this = _super.call(this, destination) || this;
        _this.value = value;
        return _this;
    }
    MapToSubscriber.prototype._next = function (x) {
        this.destination.next(this.value);
    };
    return MapToSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=mapTo.js.map


/***/ }),
/* 149 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "materialize": () => /* binding */ materialize
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _Notification__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(31);
/** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */



function materialize() {
    return function materializeOperatorFunction(source) {
        return source.lift(new MaterializeOperator());
    };
}
var MaterializeOperator = /*@__PURE__*/ (function () {
    function MaterializeOperator() {
    }
    MaterializeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MaterializeSubscriber(subscriber));
    };
    return MaterializeOperator;
}());
var MaterializeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(MaterializeSubscriber, _super);
    function MaterializeSubscriber(destination) {
        return _super.call(this, destination) || this;
    }
    MaterializeSubscriber.prototype._next = function (value) {
        this.destination.next(_Notification__WEBPACK_IMPORTED_MODULE_1__.Notification.createNext(value));
    };
    MaterializeSubscriber.prototype._error = function (err) {
        var destination = this.destination;
        destination.next(_Notification__WEBPACK_IMPORTED_MODULE_1__.Notification.createError(err));
        destination.complete();
    };
    MaterializeSubscriber.prototype._complete = function () {
        var destination = this.destination;
        destination.next(_Notification__WEBPACK_IMPORTED_MODULE_1__.Notification.createComplete());
        destination.complete();
    };
    return MaterializeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
//# sourceMappingURL=materialize.js.map


/***/ }),
/* 150 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "max": () => /* binding */ max
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(151);
/** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */

function max(comparer) {
    var max = (typeof comparer === 'function')
        ? function (x, y) { return comparer(x, y) > 0 ? x : y; }
        : function (x, y) { return x > y ? x : y; };
    return (0,_reduce__WEBPACK_IMPORTED_MODULE_0__.reduce)(max);
}
//# sourceMappingURL=max.js.map


/***/ }),
/* 151 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "reduce": () => /* binding */ reduce
/* harmony export */ });
/* harmony import */ var _scan__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(152);
/* harmony import */ var _takeLast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(147);
/* harmony import */ var _defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(124);
/* harmony import */ var _util_pipe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(20);
/** PURE_IMPORTS_START _scan,_takeLast,_defaultIfEmpty,_util_pipe PURE_IMPORTS_END */




function reduce(accumulator, seed) {
    if (arguments.length >= 2) {
        return function reduceOperatorFunctionWithSeed(source) {
            return (0,_util_pipe__WEBPACK_IMPORTED_MODULE_0__.pipe)((0,_scan__WEBPACK_IMPORTED_MODULE_1__.scan)(accumulator, seed), (0,_takeLast__WEBPACK_IMPORTED_MODULE_2__.takeLast)(1), (0,_defaultIfEmpty__WEBPACK_IMPORTED_MODULE_3__.defaultIfEmpty)(seed))(source);
        };
    }
    return function reduceOperatorFunction(source) {
        return (0,_util_pipe__WEBPACK_IMPORTED_MODULE_0__.pipe)((0,_scan__WEBPACK_IMPORTED_MODULE_1__.scan)(function (acc, value, index) { return accumulator(acc, value, index + 1); }), (0,_takeLast__WEBPACK_IMPORTED_MODULE_2__.takeLast)(1))(source);
    };
}
//# sourceMappingURL=reduce.js.map


/***/ }),
/* 152 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "scan": () => /* binding */ scan
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function scan(accumulator, seed) {
    var hasSeed = false;
    if (arguments.length >= 2) {
        hasSeed = true;
    }
    return function scanOperatorFunction(source) {
        return source.lift(new ScanOperator(accumulator, seed, hasSeed));
    };
}
var ScanOperator = /*@__PURE__*/ (function () {
    function ScanOperator(accumulator, seed, hasSeed) {
        if (hasSeed === void 0) {
            hasSeed = false;
        }
        this.accumulator = accumulator;
        this.seed = seed;
        this.hasSeed = hasSeed;
    }
    ScanOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ScanSubscriber(subscriber, this.accumulator, this.seed, this.hasSeed));
    };
    return ScanOperator;
}());
var ScanSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ScanSubscriber, _super);
    function ScanSubscriber(destination, accumulator, _seed, hasSeed) {
        var _this = _super.call(this, destination) || this;
        _this.accumulator = accumulator;
        _this._seed = _seed;
        _this.hasSeed = hasSeed;
        _this.index = 0;
        return _this;
    }
    Object.defineProperty(ScanSubscriber.prototype, "seed", {
        get: function () {
            return this._seed;
        },
        set: function (value) {
            this.hasSeed = true;
            this._seed = value;
        },
        enumerable: true,
        configurable: true
    });
    ScanSubscriber.prototype._next = function (value) {
        if (!this.hasSeed) {
            this.seed = value;
            this.destination.next(value);
        }
        else {
            return this._tryNext(value);
        }
    };
    ScanSubscriber.prototype._tryNext = function (value) {
        var index = this.index++;
        var result;
        try {
            result = this.accumulator(this.seed, value, index);
        }
        catch (err) {
            this.destination.error(err);
        }
        this.seed = result;
        this.destination.next(result);
    };
    return ScanSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=scan.js.map


/***/ }),
/* 153 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "merge": () => /* binding */ merge
/* harmony export */ });
/* harmony import */ var _observable_merge__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(95);
/** PURE_IMPORTS_START _observable_merge PURE_IMPORTS_END */

function merge() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    return function (source) { return source.lift.call(_observable_merge__WEBPACK_IMPORTED_MODULE_0__.merge.apply(void 0, [source].concat(observables))); };
}
//# sourceMappingURL=merge.js.map


/***/ }),
/* 154 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeMapTo": () => /* binding */ mergeMapTo
/* harmony export */ });
/* harmony import */ var _mergeMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(78);
/** PURE_IMPORTS_START _mergeMap PURE_IMPORTS_END */

function mergeMapTo(innerObservable, resultSelector, concurrent) {
    if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
    }
    if (typeof resultSelector === 'function') {
        return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_0__.mergeMap)(function () { return innerObservable; }, resultSelector, concurrent);
    }
    if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return (0,_mergeMap__WEBPACK_IMPORTED_MODULE_0__.mergeMap)(function () { return innerObservable; }, concurrent);
}
//# sourceMappingURL=mergeMapTo.js.map


/***/ }),
/* 155 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "mergeScan": () => /* binding */ mergeScan,
/* harmony export */   "MergeScanOperator": () => /* binding */ MergeScanOperator,
/* harmony export */   "MergeScanSubscriber": () => /* binding */ MergeScanSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function mergeScan(accumulator, seed, concurrent) {
    if (concurrent === void 0) {
        concurrent = Number.POSITIVE_INFINITY;
    }
    return function (source) { return source.lift(new MergeScanOperator(accumulator, seed, concurrent)); };
}
var MergeScanOperator = /*@__PURE__*/ (function () {
    function MergeScanOperator(accumulator, seed, concurrent) {
        this.accumulator = accumulator;
        this.seed = seed;
        this.concurrent = concurrent;
    }
    MergeScanOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new MergeScanSubscriber(subscriber, this.accumulator, this.seed, this.concurrent));
    };
    return MergeScanOperator;
}());

var MergeScanSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(MergeScanSubscriber, _super);
    function MergeScanSubscriber(destination, accumulator, acc, concurrent) {
        var _this = _super.call(this, destination) || this;
        _this.accumulator = accumulator;
        _this.acc = acc;
        _this.concurrent = concurrent;
        _this.hasValue = false;
        _this.hasCompleted = false;
        _this.buffer = [];
        _this.active = 0;
        _this.index = 0;
        return _this;
    }
    MergeScanSubscriber.prototype._next = function (value) {
        if (this.active < this.concurrent) {
            var index = this.index++;
            var destination = this.destination;
            var ish = void 0;
            try {
                var accumulator = this.accumulator;
                ish = accumulator(this.acc, value, index);
            }
            catch (e) {
                return destination.error(e);
            }
            this.active++;
            this._innerSub(ish);
        }
        else {
            this.buffer.push(value);
        }
    };
    MergeScanSubscriber.prototype._innerSub = function (ish) {
        var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this);
        var destination = this.destination;
        destination.add(innerSubscriber);
        var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(ish, innerSubscriber);
        if (innerSubscription !== innerSubscriber) {
            destination.add(innerSubscription);
        }
    };
    MergeScanSubscriber.prototype._complete = function () {
        this.hasCompleted = true;
        if (this.active === 0 && this.buffer.length === 0) {
            if (this.hasValue === false) {
                this.destination.next(this.acc);
            }
            this.destination.complete();
        }
        this.unsubscribe();
    };
    MergeScanSubscriber.prototype.notifyNext = function (innerValue) {
        var destination = this.destination;
        this.acc = innerValue;
        this.hasValue = true;
        destination.next(innerValue);
    };
    MergeScanSubscriber.prototype.notifyComplete = function () {
        var buffer = this.buffer;
        this.active--;
        if (buffer.length > 0) {
            this._next(buffer.shift());
        }
        else if (this.active === 0 && this.hasCompleted) {
            if (this.hasValue === false) {
                this.destination.next(this.acc);
            }
            this.destination.complete();
        }
    };
    return MergeScanSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));

//# sourceMappingURL=mergeScan.js.map


/***/ }),
/* 156 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "min": () => /* binding */ min
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(151);
/** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */

function min(comparer) {
    var min = (typeof comparer === 'function')
        ? function (x, y) { return comparer(x, y) < 0 ? x : y; }
        : function (x, y) { return x < y ? x : y; };
    return (0,_reduce__WEBPACK_IMPORTED_MODULE_0__.reduce)(min);
}
//# sourceMappingURL=min.js.map


/***/ }),
/* 157 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "multicast": () => /* binding */ multicast,
/* harmony export */   "MulticastOperator": () => /* binding */ MulticastOperator
/* harmony export */ });
/* harmony import */ var _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22);
/** PURE_IMPORTS_START _observable_ConnectableObservable PURE_IMPORTS_END */

function multicast(subjectOrSubjectFactory, selector) {
    return function multicastOperatorFunction(source) {
        var subjectFactory;
        if (typeof subjectOrSubjectFactory === 'function') {
            subjectFactory = subjectOrSubjectFactory;
        }
        else {
            subjectFactory = function subjectFactory() {
                return subjectOrSubjectFactory;
            };
        }
        if (typeof selector === 'function') {
            return source.lift(new MulticastOperator(subjectFactory, selector));
        }
        var connectable = Object.create(source, _observable_ConnectableObservable__WEBPACK_IMPORTED_MODULE_0__.connectableObservableDescriptor);
        connectable.source = source;
        connectable.subjectFactory = subjectFactory;
        return connectable;
    };
}
var MulticastOperator = /*@__PURE__*/ (function () {
    function MulticastOperator(subjectFactory, selector) {
        this.subjectFactory = subjectFactory;
        this.selector = selector;
    }
    MulticastOperator.prototype.call = function (subscriber, source) {
        var selector = this.selector;
        var subject = this.subjectFactory();
        var subscription = selector(subject).subscribe(subscriber);
        subscription.add(source.subscribe(subject));
        return subscription;
    };
    return MulticastOperator;
}());

//# sourceMappingURL=multicast.js.map


/***/ }),
/* 158 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "onErrorResumeNext": () => /* binding */ onErrorResumeNext,
/* harmony export */   "onErrorResumeNextStatic": () => /* binding */ onErrorResumeNextStatic
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79);
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_observable_from,_util_isArray,_innerSubscribe PURE_IMPORTS_END */




function onErrorResumeNext() {
    var nextSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        nextSources[_i] = arguments[_i];
    }
    if (nextSources.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(nextSources[0])) {
        nextSources = nextSources[0];
    }
    return function (source) { return source.lift(new OnErrorResumeNextOperator(nextSources)); };
}
function onErrorResumeNextStatic() {
    var nextSources = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        nextSources[_i] = arguments[_i];
    }
    var source = undefined;
    if (nextSources.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(nextSources[0])) {
        nextSources = nextSources[0];
    }
    source = nextSources.shift();
    return (0,_observable_from__WEBPACK_IMPORTED_MODULE_1__.from)(source).lift(new OnErrorResumeNextOperator(nextSources));
}
var OnErrorResumeNextOperator = /*@__PURE__*/ (function () {
    function OnErrorResumeNextOperator(nextSources) {
        this.nextSources = nextSources;
    }
    OnErrorResumeNextOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new OnErrorResumeNextSubscriber(subscriber, this.nextSources));
    };
    return OnErrorResumeNextOperator;
}());
var OnErrorResumeNextSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(OnErrorResumeNextSubscriber, _super);
    function OnErrorResumeNextSubscriber(destination, nextSources) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        _this.nextSources = nextSources;
        return _this;
    }
    OnErrorResumeNextSubscriber.prototype.notifyError = function () {
        this.subscribeToNextSource();
    };
    OnErrorResumeNextSubscriber.prototype.notifyComplete = function () {
        this.subscribeToNextSource();
    };
    OnErrorResumeNextSubscriber.prototype._error = function (err) {
        this.subscribeToNextSource();
        this.unsubscribe();
    };
    OnErrorResumeNextSubscriber.prototype._complete = function () {
        this.subscribeToNextSource();
        this.unsubscribe();
    };
    OnErrorResumeNextSubscriber.prototype.subscribeToNextSource = function () {
        var next = this.nextSources.shift();
        if (!!next) {
            var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleInnerSubscriber(this);
            var destination = this.destination;
            destination.add(innerSubscriber);
            var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.innerSubscribe)(next, innerSubscriber);
            if (innerSubscription !== innerSubscriber) {
                destination.add(innerSubscription);
            }
        }
        else {
            this.destination.complete();
        }
    };
    return OnErrorResumeNextSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleOuterSubscriber));
//# sourceMappingURL=onErrorResumeNext.js.map


/***/ }),
/* 159 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pairwise": () => /* binding */ pairwise
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function pairwise() {
    return function (source) { return source.lift(new PairwiseOperator()); };
}
var PairwiseOperator = /*@__PURE__*/ (function () {
    function PairwiseOperator() {
    }
    PairwiseOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new PairwiseSubscriber(subscriber));
    };
    return PairwiseOperator;
}());
var PairwiseSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(PairwiseSubscriber, _super);
    function PairwiseSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.hasPrev = false;
        return _this;
    }
    PairwiseSubscriber.prototype._next = function (value) {
        var pair;
        if (this.hasPrev) {
            pair = [this.prev, value];
        }
        else {
            this.hasPrev = true;
        }
        this.prev = value;
        if (pair) {
            this.destination.next(pair);
        }
    };
    return PairwiseSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=pairwise.js.map


/***/ }),
/* 160 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "partition": () => /* binding */ partition
/* harmony export */ });
/* harmony import */ var _util_not__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(101);
/* harmony import */ var _filter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(100);
/** PURE_IMPORTS_START _util_not,_filter PURE_IMPORTS_END */


function partition(predicate, thisArg) {
    return function (source) {
        return [
            (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)(predicate, thisArg)(source),
            (0,_filter__WEBPACK_IMPORTED_MODULE_0__.filter)((0,_util_not__WEBPACK_IMPORTED_MODULE_1__.not)(predicate, thisArg))(source)
        ];
    };
}
//# sourceMappingURL=partition.js.map


/***/ }),
/* 161 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "pluck": () => /* binding */ pluck
/* harmony export */ });
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(62);
/** PURE_IMPORTS_START _map PURE_IMPORTS_END */

function pluck() {
    var properties = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        properties[_i] = arguments[_i];
    }
    var length = properties.length;
    if (length === 0) {
        throw new Error('list of properties cannot be empty.');
    }
    return function (source) { return (0,_map__WEBPACK_IMPORTED_MODULE_0__.map)(plucker(properties, length))(source); };
}
function plucker(props, length) {
    var mapper = function (x) {
        var currentProp = x;
        for (var i = 0; i < length; i++) {
            var p = currentProp != null ? currentProp[props[i]] : undefined;
            if (p !== void 0) {
                currentProp = p;
            }
            else {
                return undefined;
            }
        }
        return currentProp;
    };
    return mapper;
}
//# sourceMappingURL=pluck.js.map


/***/ }),
/* 162 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publish": () => /* binding */ publish
/* harmony export */ });
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(157);
/** PURE_IMPORTS_START _Subject,_multicast PURE_IMPORTS_END */


function publish(selector) {
    return selector ?
        (0,_multicast__WEBPACK_IMPORTED_MODULE_0__.multicast)(function () { return new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject(); }, selector) :
        (0,_multicast__WEBPACK_IMPORTED_MODULE_0__.multicast)(new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject());
}
//# sourceMappingURL=publish.js.map


/***/ }),
/* 163 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publishBehavior": () => /* binding */ publishBehavior
/* harmony export */ });
/* harmony import */ var _BehaviorSubject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(28);
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(157);
/** PURE_IMPORTS_START _BehaviorSubject,_multicast PURE_IMPORTS_END */


function publishBehavior(value) {
    return function (source) { return (0,_multicast__WEBPACK_IMPORTED_MODULE_0__.multicast)(new _BehaviorSubject__WEBPACK_IMPORTED_MODULE_1__.BehaviorSubject(value))(source); };
}
//# sourceMappingURL=publishBehavior.js.map


/***/ }),
/* 164 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publishLast": () => /* binding */ publishLast
/* harmony export */ });
/* harmony import */ var _AsyncSubject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(46);
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(157);
/** PURE_IMPORTS_START _AsyncSubject,_multicast PURE_IMPORTS_END */


function publishLast() {
    return function (source) { return (0,_multicast__WEBPACK_IMPORTED_MODULE_0__.multicast)(new _AsyncSubject__WEBPACK_IMPORTED_MODULE_1__.AsyncSubject())(source); };
}
//# sourceMappingURL=publishLast.js.map


/***/ }),
/* 165 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "publishReplay": () => /* binding */ publishReplay
/* harmony export */ });
/* harmony import */ var _ReplaySubject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(29);
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(157);
/** PURE_IMPORTS_START _ReplaySubject,_multicast PURE_IMPORTS_END */


function publishReplay(bufferSize, windowTime, selectorOrScheduler, scheduler) {
    if (selectorOrScheduler && typeof selectorOrScheduler !== 'function') {
        scheduler = selectorOrScheduler;
    }
    var selector = typeof selectorOrScheduler === 'function' ? selectorOrScheduler : undefined;
    var subject = new _ReplaySubject__WEBPACK_IMPORTED_MODULE_0__.ReplaySubject(bufferSize, windowTime, scheduler);
    return function (source) { return (0,_multicast__WEBPACK_IMPORTED_MODULE_1__.multicast)(function () { return subject; }, selector)(source); };
}
//# sourceMappingURL=publishReplay.js.map


/***/ }),
/* 166 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "race": () => /* binding */ race
/* harmony export */ });
/* harmony import */ var _util_isArray__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(16);
/* harmony import */ var _observable_race__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(102);
/** PURE_IMPORTS_START _util_isArray,_observable_race PURE_IMPORTS_END */


function race() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    return function raceOperatorFunction(source) {
        if (observables.length === 1 && (0,_util_isArray__WEBPACK_IMPORTED_MODULE_0__.isArray)(observables[0])) {
            observables = observables[0];
        }
        return source.lift.call(_observable_race__WEBPACK_IMPORTED_MODULE_1__.race.apply(void 0, [source].concat(observables)));
    };
}
//# sourceMappingURL=race.js.map


/***/ }),
/* 167 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "repeat": () => /* binding */ repeat
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _observable_empty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(38);
/** PURE_IMPORTS_START tslib,_Subscriber,_observable_empty PURE_IMPORTS_END */



function repeat(count) {
    if (count === void 0) {
        count = -1;
    }
    return function (source) {
        if (count === 0) {
            return (0,_observable_empty__WEBPACK_IMPORTED_MODULE_0__.empty)();
        }
        else if (count < 0) {
            return source.lift(new RepeatOperator(-1, source));
        }
        else {
            return source.lift(new RepeatOperator(count - 1, source));
        }
    };
}
var RepeatOperator = /*@__PURE__*/ (function () {
    function RepeatOperator(count, source) {
        this.count = count;
        this.source = source;
    }
    RepeatOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new RepeatSubscriber(subscriber, this.count, this.source));
    };
    return RepeatOperator;
}());
var RepeatSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(RepeatSubscriber, _super);
    function RepeatSubscriber(destination, count, source) {
        var _this = _super.call(this, destination) || this;
        _this.count = count;
        _this.source = source;
        return _this;
    }
    RepeatSubscriber.prototype.complete = function () {
        if (!this.isStopped) {
            var _a = this, source = _a.source, count = _a.count;
            if (count === 0) {
                return _super.prototype.complete.call(this);
            }
            else if (count > -1) {
                this.count = count - 1;
            }
            source.subscribe(this._unsubscribeAndRecycle());
        }
    };
    return RepeatSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
//# sourceMappingURL=repeat.js.map


/***/ }),
/* 168 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "repeatWhen": () => /* binding */ repeatWhen
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_Subject,_innerSubscribe PURE_IMPORTS_END */



function repeatWhen(notifier) {
    return function (source) { return source.lift(new RepeatWhenOperator(notifier)); };
}
var RepeatWhenOperator = /*@__PURE__*/ (function () {
    function RepeatWhenOperator(notifier) {
        this.notifier = notifier;
    }
    RepeatWhenOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new RepeatWhenSubscriber(subscriber, this.notifier, source));
    };
    return RepeatWhenOperator;
}());
var RepeatWhenSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(RepeatWhenSubscriber, _super);
    function RepeatWhenSubscriber(destination, notifier, source) {
        var _this = _super.call(this, destination) || this;
        _this.notifier = notifier;
        _this.source = source;
        _this.sourceIsBeingSubscribedTo = true;
        return _this;
    }
    RepeatWhenSubscriber.prototype.notifyNext = function () {
        this.sourceIsBeingSubscribedTo = true;
        this.source.subscribe(this);
    };
    RepeatWhenSubscriber.prototype.notifyComplete = function () {
        if (this.sourceIsBeingSubscribedTo === false) {
            return _super.prototype.complete.call(this);
        }
    };
    RepeatWhenSubscriber.prototype.complete = function () {
        this.sourceIsBeingSubscribedTo = false;
        if (!this.isStopped) {
            if (!this.retries) {
                this.subscribeToRetries();
            }
            if (!this.retriesSubscription || this.retriesSubscription.closed) {
                return _super.prototype.complete.call(this);
            }
            this._unsubscribeAndRecycle();
            this.notifications.next(undefined);
        }
    };
    RepeatWhenSubscriber.prototype._unsubscribe = function () {
        var _a = this, notifications = _a.notifications, retriesSubscription = _a.retriesSubscription;
        if (notifications) {
            notifications.unsubscribe();
            this.notifications = undefined;
        }
        if (retriesSubscription) {
            retriesSubscription.unsubscribe();
            this.retriesSubscription = undefined;
        }
        this.retries = undefined;
    };
    RepeatWhenSubscriber.prototype._unsubscribeAndRecycle = function () {
        var _unsubscribe = this._unsubscribe;
        this._unsubscribe = null;
        _super.prototype._unsubscribeAndRecycle.call(this);
        this._unsubscribe = _unsubscribe;
        return this;
    };
    RepeatWhenSubscriber.prototype.subscribeToRetries = function () {
        this.notifications = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
        var retries;
        try {
            var notifier = this.notifier;
            retries = notifier(this.notifications);
        }
        catch (e) {
            return _super.prototype.complete.call(this);
        }
        this.retries = retries;
        this.retriesSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.innerSubscribe)(retries, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.SimpleInnerSubscriber(this));
    };
    return RepeatWhenSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.SimpleOuterSubscriber));
//# sourceMappingURL=repeatWhen.js.map


/***/ }),
/* 169 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "retry": () => /* binding */ retry
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function retry(count) {
    if (count === void 0) {
        count = -1;
    }
    return function (source) { return source.lift(new RetryOperator(count, source)); };
}
var RetryOperator = /*@__PURE__*/ (function () {
    function RetryOperator(count, source) {
        this.count = count;
        this.source = source;
    }
    RetryOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new RetrySubscriber(subscriber, this.count, this.source));
    };
    return RetryOperator;
}());
var RetrySubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(RetrySubscriber, _super);
    function RetrySubscriber(destination, count, source) {
        var _this = _super.call(this, destination) || this;
        _this.count = count;
        _this.source = source;
        return _this;
    }
    RetrySubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var _a = this, source = _a.source, count = _a.count;
            if (count === 0) {
                return _super.prototype.error.call(this, err);
            }
            else if (count > -1) {
                this.count = count - 1;
            }
            source.subscribe(this._unsubscribeAndRecycle());
        }
    };
    return RetrySubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=retry.js.map


/***/ }),
/* 170 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "retryWhen": () => /* binding */ retryWhen
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_Subject,_innerSubscribe PURE_IMPORTS_END */



function retryWhen(notifier) {
    return function (source) { return source.lift(new RetryWhenOperator(notifier, source)); };
}
var RetryWhenOperator = /*@__PURE__*/ (function () {
    function RetryWhenOperator(notifier, source) {
        this.notifier = notifier;
        this.source = source;
    }
    RetryWhenOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new RetryWhenSubscriber(subscriber, this.notifier, this.source));
    };
    return RetryWhenOperator;
}());
var RetryWhenSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(RetryWhenSubscriber, _super);
    function RetryWhenSubscriber(destination, notifier, source) {
        var _this = _super.call(this, destination) || this;
        _this.notifier = notifier;
        _this.source = source;
        return _this;
    }
    RetryWhenSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var errors = this.errors;
            var retries = this.retries;
            var retriesSubscription = this.retriesSubscription;
            if (!retries) {
                errors = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
                try {
                    var notifier = this.notifier;
                    retries = notifier(errors);
                }
                catch (e) {
                    return _super.prototype.error.call(this, e);
                }
                retriesSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.innerSubscribe)(retries, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.SimpleInnerSubscriber(this));
            }
            else {
                this.errors = undefined;
                this.retriesSubscription = undefined;
            }
            this._unsubscribeAndRecycle();
            this.errors = errors;
            this.retries = retries;
            this.retriesSubscription = retriesSubscription;
            errors.next(err);
        }
    };
    RetryWhenSubscriber.prototype._unsubscribe = function () {
        var _a = this, errors = _a.errors, retriesSubscription = _a.retriesSubscription;
        if (errors) {
            errors.unsubscribe();
            this.errors = undefined;
        }
        if (retriesSubscription) {
            retriesSubscription.unsubscribe();
            this.retriesSubscription = undefined;
        }
        this.retries = undefined;
    };
    RetryWhenSubscriber.prototype.notifyNext = function () {
        var _unsubscribe = this._unsubscribe;
        this._unsubscribe = null;
        this._unsubscribeAndRecycle();
        this._unsubscribe = _unsubscribe;
        this.source.subscribe(this);
    };
    return RetryWhenSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_2__.SimpleOuterSubscriber));
//# sourceMappingURL=retryWhen.js.map


/***/ }),
/* 171 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sample": () => /* binding */ sample
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function sample(notifier) {
    return function (source) { return source.lift(new SampleOperator(notifier)); };
}
var SampleOperator = /*@__PURE__*/ (function () {
    function SampleOperator(notifier) {
        this.notifier = notifier;
    }
    SampleOperator.prototype.call = function (subscriber, source) {
        var sampleSubscriber = new SampleSubscriber(subscriber);
        var subscription = source.subscribe(sampleSubscriber);
        subscription.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.innerSubscribe)(this.notifier, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.SimpleInnerSubscriber(sampleSubscriber)));
        return subscription;
    };
    return SampleOperator;
}());
var SampleSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(SampleSubscriber, _super);
    function SampleSubscriber() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.hasValue = false;
        return _this;
    }
    SampleSubscriber.prototype._next = function (value) {
        this.value = value;
        this.hasValue = true;
    };
    SampleSubscriber.prototype.notifyNext = function () {
        this.emitValue();
    };
    SampleSubscriber.prototype.notifyComplete = function () {
        this.emitValue();
    };
    SampleSubscriber.prototype.emitValue = function () {
        if (this.hasValue) {
            this.hasValue = false;
            this.destination.next(this.value);
        }
    };
    return SampleSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.SimpleOuterSubscriber));
//# sourceMappingURL=sample.js.map


/***/ }),
/* 172 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sampleTime": () => /* binding */ sampleTime
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async PURE_IMPORTS_END */



function sampleTime(period, scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return function (source) { return source.lift(new SampleTimeOperator(period, scheduler)); };
}
var SampleTimeOperator = /*@__PURE__*/ (function () {
    function SampleTimeOperator(period, scheduler) {
        this.period = period;
        this.scheduler = scheduler;
    }
    SampleTimeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SampleTimeSubscriber(subscriber, this.period, this.scheduler));
    };
    return SampleTimeOperator;
}());
var SampleTimeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(SampleTimeSubscriber, _super);
    function SampleTimeSubscriber(destination, period, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.period = period;
        _this.scheduler = scheduler;
        _this.hasValue = false;
        _this.add(scheduler.schedule(dispatchNotification, period, { subscriber: _this, period: period }));
        return _this;
    }
    SampleTimeSubscriber.prototype._next = function (value) {
        this.lastValue = value;
        this.hasValue = true;
    };
    SampleTimeSubscriber.prototype.notifyNext = function () {
        if (this.hasValue) {
            this.hasValue = false;
            this.destination.next(this.lastValue);
        }
    };
    return SampleTimeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
function dispatchNotification(state) {
    var subscriber = state.subscriber, period = state.period;
    subscriber.notifyNext();
    this.schedule(state, period);
}
//# sourceMappingURL=sampleTime.js.map


/***/ }),
/* 173 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sequenceEqual": () => /* binding */ sequenceEqual,
/* harmony export */   "SequenceEqualOperator": () => /* binding */ SequenceEqualOperator,
/* harmony export */   "SequenceEqualSubscriber": () => /* binding */ SequenceEqualSubscriber
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function sequenceEqual(compareTo, comparator) {
    return function (source) { return source.lift(new SequenceEqualOperator(compareTo, comparator)); };
}
var SequenceEqualOperator = /*@__PURE__*/ (function () {
    function SequenceEqualOperator(compareTo, comparator) {
        this.compareTo = compareTo;
        this.comparator = comparator;
    }
    SequenceEqualOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SequenceEqualSubscriber(subscriber, this.compareTo, this.comparator));
    };
    return SequenceEqualOperator;
}());

var SequenceEqualSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SequenceEqualSubscriber, _super);
    function SequenceEqualSubscriber(destination, compareTo, comparator) {
        var _this = _super.call(this, destination) || this;
        _this.compareTo = compareTo;
        _this.comparator = comparator;
        _this._a = [];
        _this._b = [];
        _this._oneComplete = false;
        _this.destination.add(compareTo.subscribe(new SequenceEqualCompareToSubscriber(destination, _this)));
        return _this;
    }
    SequenceEqualSubscriber.prototype._next = function (value) {
        if (this._oneComplete && this._b.length === 0) {
            this.emit(false);
        }
        else {
            this._a.push(value);
            this.checkValues();
        }
    };
    SequenceEqualSubscriber.prototype._complete = function () {
        if (this._oneComplete) {
            this.emit(this._a.length === 0 && this._b.length === 0);
        }
        else {
            this._oneComplete = true;
        }
        this.unsubscribe();
    };
    SequenceEqualSubscriber.prototype.checkValues = function () {
        var _c = this, _a = _c._a, _b = _c._b, comparator = _c.comparator;
        while (_a.length > 0 && _b.length > 0) {
            var a = _a.shift();
            var b = _b.shift();
            var areEqual = false;
            try {
                areEqual = comparator ? comparator(a, b) : a === b;
            }
            catch (e) {
                this.destination.error(e);
            }
            if (!areEqual) {
                this.emit(false);
            }
        }
    };
    SequenceEqualSubscriber.prototype.emit = function (value) {
        var destination = this.destination;
        destination.next(value);
        destination.complete();
    };
    SequenceEqualSubscriber.prototype.nextB = function (value) {
        if (this._oneComplete && this._a.length === 0) {
            this.emit(false);
        }
        else {
            this._b.push(value);
            this.checkValues();
        }
    };
    SequenceEqualSubscriber.prototype.completeB = function () {
        if (this._oneComplete) {
            this.emit(this._a.length === 0 && this._b.length === 0);
        }
        else {
            this._oneComplete = true;
        }
    };
    return SequenceEqualSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));

var SequenceEqualCompareToSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SequenceEqualCompareToSubscriber, _super);
    function SequenceEqualCompareToSubscriber(destination, parent) {
        var _this = _super.call(this, destination) || this;
        _this.parent = parent;
        return _this;
    }
    SequenceEqualCompareToSubscriber.prototype._next = function (value) {
        this.parent.nextB(value);
    };
    SequenceEqualCompareToSubscriber.prototype._error = function (err) {
        this.parent.error(err);
        this.unsubscribe();
    };
    SequenceEqualCompareToSubscriber.prototype._complete = function () {
        this.parent.completeB();
        this.unsubscribe();
    };
    return SequenceEqualCompareToSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=sequenceEqual.js.map


/***/ }),
/* 174 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "share": () => /* binding */ share
/* harmony export */ });
/* harmony import */ var _multicast__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(157);
/* harmony import */ var _refCount__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(23);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(24);
/** PURE_IMPORTS_START _multicast,_refCount,_Subject PURE_IMPORTS_END */



function shareSubjectFactory() {
    return new _Subject__WEBPACK_IMPORTED_MODULE_0__.Subject();
}
function share() {
    return function (source) { return (0,_refCount__WEBPACK_IMPORTED_MODULE_1__.refCount)()((0,_multicast__WEBPACK_IMPORTED_MODULE_2__.multicast)(shareSubjectFactory)(source)); };
}
//# sourceMappingURL=share.js.map


/***/ }),
/* 175 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "shareReplay": () => /* binding */ shareReplay
/* harmony export */ });
/* harmony import */ var _ReplaySubject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(29);
/** PURE_IMPORTS_START _ReplaySubject PURE_IMPORTS_END */

function shareReplay(configOrBufferSize, windowTime, scheduler) {
    var config;
    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
        config = configOrBufferSize;
    }
    else {
        config = {
            bufferSize: configOrBufferSize,
            windowTime: windowTime,
            refCount: false,
            scheduler: scheduler
        };
    }
    return function (source) { return source.lift(shareReplayOperator(config)); };
}
function shareReplayOperator(_a) {
    var _b = _a.bufferSize, bufferSize = _b === void 0 ? Number.POSITIVE_INFINITY : _b, _c = _a.windowTime, windowTime = _c === void 0 ? Number.POSITIVE_INFINITY : _c, useRefCount = _a.refCount, scheduler = _a.scheduler;
    var subject;
    var refCount = 0;
    var subscription;
    var hasError = false;
    var isComplete = false;
    return function shareReplayOperation(source) {
        refCount++;
        var innerSub;
        if (!subject || hasError) {
            hasError = false;
            subject = new _ReplaySubject__WEBPACK_IMPORTED_MODULE_0__.ReplaySubject(bufferSize, windowTime, scheduler);
            innerSub = subject.subscribe(this);
            subscription = source.subscribe({
                next: function (value) { subject.next(value); },
                error: function (err) {
                    hasError = true;
                    subject.error(err);
                },
                complete: function () {
                    isComplete = true;
                    subscription = undefined;
                    subject.complete();
                },
            });
        }
        else {
            innerSub = subject.subscribe(this);
        }
        this.add(function () {
            refCount--;
            innerSub.unsubscribe();
            if (subscription && !isComplete && useRefCount && refCount === 0) {
                subscription.unsubscribe();
                subscription = undefined;
                subject = undefined;
            }
        });
    };
}
//# sourceMappingURL=shareReplay.js.map


/***/ }),
/* 176 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "single": () => /* binding */ single
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _util_EmptyError__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(59);
/** PURE_IMPORTS_START tslib,_Subscriber,_util_EmptyError PURE_IMPORTS_END */



function single(predicate) {
    return function (source) { return source.lift(new SingleOperator(predicate, source)); };
}
var SingleOperator = /*@__PURE__*/ (function () {
    function SingleOperator(predicate, source) {
        this.predicate = predicate;
        this.source = source;
    }
    SingleOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SingleSubscriber(subscriber, this.predicate, this.source));
    };
    return SingleOperator;
}());
var SingleSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SingleSubscriber, _super);
    function SingleSubscriber(destination, predicate, source) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.source = source;
        _this.seenValue = false;
        _this.index = 0;
        return _this;
    }
    SingleSubscriber.prototype.applySingleValue = function (value) {
        if (this.seenValue) {
            this.destination.error('Sequence contains more than one element');
        }
        else {
            this.seenValue = true;
            this.singleValue = value;
        }
    };
    SingleSubscriber.prototype._next = function (value) {
        var index = this.index++;
        if (this.predicate) {
            this.tryNext(value, index);
        }
        else {
            this.applySingleValue(value);
        }
    };
    SingleSubscriber.prototype.tryNext = function (value, index) {
        try {
            if (this.predicate(value, index, this.source)) {
                this.applySingleValue(value);
            }
        }
        catch (err) {
            this.destination.error(err);
        }
    };
    SingleSubscriber.prototype._complete = function () {
        var destination = this.destination;
        if (this.index > 0) {
            destination.next(this.seenValue ? this.singleValue : undefined);
            destination.complete();
        }
        else {
            destination.error(new _util_EmptyError__WEBPACK_IMPORTED_MODULE_1__.EmptyError);
        }
    };
    return SingleSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
//# sourceMappingURL=single.js.map


/***/ }),
/* 177 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skip": () => /* binding */ skip
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function skip(count) {
    return function (source) { return source.lift(new SkipOperator(count)); };
}
var SkipOperator = /*@__PURE__*/ (function () {
    function SkipOperator(total) {
        this.total = total;
    }
    SkipOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SkipSubscriber(subscriber, this.total));
    };
    return SkipOperator;
}());
var SkipSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SkipSubscriber, _super);
    function SkipSubscriber(destination, total) {
        var _this = _super.call(this, destination) || this;
        _this.total = total;
        _this.count = 0;
        return _this;
    }
    SkipSubscriber.prototype._next = function (x) {
        if (++this.count > this.total) {
            this.destination.next(x);
        }
    };
    return SkipSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=skip.js.map


/***/ }),
/* 178 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skipLast": () => /* binding */ skipLast
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/* harmony import */ var _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(58);
/** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError PURE_IMPORTS_END */



function skipLast(count) {
    return function (source) { return source.lift(new SkipLastOperator(count)); };
}
var SkipLastOperator = /*@__PURE__*/ (function () {
    function SkipLastOperator(_skipCount) {
        this._skipCount = _skipCount;
        if (this._skipCount < 0) {
            throw new _util_ArgumentOutOfRangeError__WEBPACK_IMPORTED_MODULE_0__.ArgumentOutOfRangeError;
        }
    }
    SkipLastOperator.prototype.call = function (subscriber, source) {
        if (this._skipCount === 0) {
            return source.subscribe(new _Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber(subscriber));
        }
        else {
            return source.subscribe(new SkipLastSubscriber(subscriber, this._skipCount));
        }
    };
    return SkipLastOperator;
}());
var SkipLastSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(SkipLastSubscriber, _super);
    function SkipLastSubscriber(destination, _skipCount) {
        var _this = _super.call(this, destination) || this;
        _this._skipCount = _skipCount;
        _this._count = 0;
        _this._ring = new Array(_skipCount);
        return _this;
    }
    SkipLastSubscriber.prototype._next = function (value) {
        var skipCount = this._skipCount;
        var count = this._count++;
        if (count < skipCount) {
            this._ring[count] = value;
        }
        else {
            var currentIndex = count % skipCount;
            var ring = this._ring;
            var oldValue = ring[currentIndex];
            ring[currentIndex] = value;
            this.destination.next(oldValue);
        }
    };
    return SkipLastSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=skipLast.js.map


/***/ }),
/* 179 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skipUntil": () => /* binding */ skipUntil
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function skipUntil(notifier) {
    return function (source) { return source.lift(new SkipUntilOperator(notifier)); };
}
var SkipUntilOperator = /*@__PURE__*/ (function () {
    function SkipUntilOperator(notifier) {
        this.notifier = notifier;
    }
    SkipUntilOperator.prototype.call = function (destination, source) {
        return source.subscribe(new SkipUntilSubscriber(destination, this.notifier));
    };
    return SkipUntilOperator;
}());
var SkipUntilSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SkipUntilSubscriber, _super);
    function SkipUntilSubscriber(destination, notifier) {
        var _this = _super.call(this, destination) || this;
        _this.hasValue = false;
        var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(_this);
        _this.add(innerSubscriber);
        _this.innerSubscription = innerSubscriber;
        var innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(notifier, innerSubscriber);
        if (innerSubscription !== innerSubscriber) {
            _this.add(innerSubscription);
            _this.innerSubscription = innerSubscription;
        }
        return _this;
    }
    SkipUntilSubscriber.prototype._next = function (value) {
        if (this.hasValue) {
            _super.prototype._next.call(this, value);
        }
    };
    SkipUntilSubscriber.prototype.notifyNext = function () {
        this.hasValue = true;
        if (this.innerSubscription) {
            this.innerSubscription.unsubscribe();
        }
    };
    SkipUntilSubscriber.prototype.notifyComplete = function () {
    };
    return SkipUntilSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=skipUntil.js.map


/***/ }),
/* 180 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "skipWhile": () => /* binding */ skipWhile
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function skipWhile(predicate) {
    return function (source) { return source.lift(new SkipWhileOperator(predicate)); };
}
var SkipWhileOperator = /*@__PURE__*/ (function () {
    function SkipWhileOperator(predicate) {
        this.predicate = predicate;
    }
    SkipWhileOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SkipWhileSubscriber(subscriber, this.predicate));
    };
    return SkipWhileOperator;
}());
var SkipWhileSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SkipWhileSubscriber, _super);
    function SkipWhileSubscriber(destination, predicate) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.skipping = true;
        _this.index = 0;
        return _this;
    }
    SkipWhileSubscriber.prototype._next = function (value) {
        var destination = this.destination;
        if (this.skipping) {
            this.tryCallPredicate(value);
        }
        if (!this.skipping) {
            destination.next(value);
        }
    };
    SkipWhileSubscriber.prototype.tryCallPredicate = function (value) {
        try {
            var result = this.predicate(value, this.index++);
            this.skipping = Boolean(result);
        }
        catch (err) {
            this.destination.error(err);
        }
    };
    return SkipWhileSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=skipWhile.js.map


/***/ }),
/* 181 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "startWith": () => /* binding */ startWith
/* harmony export */ });
/* harmony import */ var _observable_concat__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(75);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(33);
/** PURE_IMPORTS_START _observable_concat,_util_isScheduler PURE_IMPORTS_END */


function startWith() {
    var array = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        array[_i] = arguments[_i];
    }
    var scheduler = array[array.length - 1];
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_0__.isScheduler)(scheduler)) {
        array.pop();
        return function (source) { return (0,_observable_concat__WEBPACK_IMPORTED_MODULE_1__.concat)(array, source, scheduler); };
    }
    else {
        return function (source) { return (0,_observable_concat__WEBPACK_IMPORTED_MODULE_1__.concat)(array, source); };
    }
}
//# sourceMappingURL=startWith.js.map


/***/ }),
/* 182 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "subscribeOn": () => /* binding */ subscribeOn
/* harmony export */ });
/* harmony import */ var _observable_SubscribeOnObservable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(183);
/** PURE_IMPORTS_START _observable_SubscribeOnObservable PURE_IMPORTS_END */

function subscribeOn(scheduler, delay) {
    if (delay === void 0) {
        delay = 0;
    }
    return function subscribeOnOperatorFunction(source) {
        return source.lift(new SubscribeOnOperator(scheduler, delay));
    };
}
var SubscribeOnOperator = /*@__PURE__*/ (function () {
    function SubscribeOnOperator(scheduler, delay) {
        this.scheduler = scheduler;
        this.delay = delay;
    }
    SubscribeOnOperator.prototype.call = function (subscriber, source) {
        return new _observable_SubscribeOnObservable__WEBPACK_IMPORTED_MODULE_0__.SubscribeOnObservable(source, this.delay, this.scheduler).subscribe(subscriber);
    };
    return SubscribeOnOperator;
}());
//# sourceMappingURL=subscribeOn.js.map


/***/ }),
/* 183 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "SubscribeOnObservable": () => /* binding */ SubscribeOnObservable
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Observable__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(5);
/* harmony import */ var _scheduler_asap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(47);
/* harmony import */ var _util_isNumeric__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(94);
/** PURE_IMPORTS_START tslib,_Observable,_scheduler_asap,_util_isNumeric PURE_IMPORTS_END */




var SubscribeOnObservable = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(SubscribeOnObservable, _super);
    function SubscribeOnObservable(source, delayTime, scheduler) {
        if (delayTime === void 0) {
            delayTime = 0;
        }
        if (scheduler === void 0) {
            scheduler = _scheduler_asap__WEBPACK_IMPORTED_MODULE_1__.asap;
        }
        var _this = _super.call(this) || this;
        _this.source = source;
        _this.delayTime = delayTime;
        _this.scheduler = scheduler;
        if (!(0,_util_isNumeric__WEBPACK_IMPORTED_MODULE_2__.isNumeric)(delayTime) || delayTime < 0) {
            _this.delayTime = 0;
        }
        if (!scheduler || typeof scheduler.schedule !== 'function') {
            _this.scheduler = _scheduler_asap__WEBPACK_IMPORTED_MODULE_1__.asap;
        }
        return _this;
    }
    SubscribeOnObservable.create = function (source, delay, scheduler) {
        if (delay === void 0) {
            delay = 0;
        }
        if (scheduler === void 0) {
            scheduler = _scheduler_asap__WEBPACK_IMPORTED_MODULE_1__.asap;
        }
        return new SubscribeOnObservable(source, delay, scheduler);
    };
    SubscribeOnObservable.dispatch = function (arg) {
        var source = arg.source, subscriber = arg.subscriber;
        return this.add(source.subscribe(subscriber));
    };
    SubscribeOnObservable.prototype._subscribe = function (subscriber) {
        var delay = this.delayTime;
        var source = this.source;
        var scheduler = this.scheduler;
        return scheduler.schedule(SubscribeOnObservable.dispatch, delay, {
            source: source, subscriber: subscriber
        });
    };
    return SubscribeOnObservable;
}(_Observable__WEBPACK_IMPORTED_MODULE_3__.Observable));

//# sourceMappingURL=SubscribeOnObservable.js.map


/***/ }),
/* 184 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchAll": () => /* binding */ switchAll
/* harmony export */ });
/* harmony import */ var _switchMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(185);
/* harmony import */ var _util_identity__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);
/** PURE_IMPORTS_START _switchMap,_util_identity PURE_IMPORTS_END */


function switchAll() {
    return (0,_switchMap__WEBPACK_IMPORTED_MODULE_0__.switchMap)(_util_identity__WEBPACK_IMPORTED_MODULE_1__.identity);
}
//# sourceMappingURL=switchAll.js.map


/***/ }),
/* 185 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchMap": () => /* binding */ switchMap
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/* harmony import */ var _observable_from__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(79);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_map,_observable_from,_innerSubscribe PURE_IMPORTS_END */




function switchMap(project, resultSelector) {
    if (typeof resultSelector === 'function') {
        return function (source) { return source.pipe(switchMap(function (a, i) { return (0,_observable_from__WEBPACK_IMPORTED_MODULE_0__.from)(project(a, i)).pipe((0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (b, ii) { return resultSelector(a, b, i, ii); })); })); };
    }
    return function (source) { return source.lift(new SwitchMapOperator(project)); };
}
var SwitchMapOperator = /*@__PURE__*/ (function () {
    function SwitchMapOperator(project) {
        this.project = project;
    }
    SwitchMapOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new SwitchMapSubscriber(subscriber, this.project));
    };
    return SwitchMapOperator;
}());
var SwitchMapSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(SwitchMapSubscriber, _super);
    function SwitchMapSubscriber(destination, project) {
        var _this = _super.call(this, destination) || this;
        _this.project = project;
        _this.index = 0;
        return _this;
    }
    SwitchMapSubscriber.prototype._next = function (value) {
        var result;
        var index = this.index++;
        try {
            result = this.project(value, index);
        }
        catch (error) {
            this.destination.error(error);
            return;
        }
        this._innerSub(result);
    };
    SwitchMapSubscriber.prototype._innerSub = function (result) {
        var innerSubscription = this.innerSubscription;
        if (innerSubscription) {
            innerSubscription.unsubscribe();
        }
        var innerSubscriber = new _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleInnerSubscriber(this);
        var destination = this.destination;
        destination.add(innerSubscriber);
        this.innerSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.innerSubscribe)(result, innerSubscriber);
        if (this.innerSubscription !== innerSubscriber) {
            destination.add(this.innerSubscription);
        }
    };
    SwitchMapSubscriber.prototype._complete = function () {
        var innerSubscription = this.innerSubscription;
        if (!innerSubscription || innerSubscription.closed) {
            _super.prototype._complete.call(this);
        }
        this.unsubscribe();
    };
    SwitchMapSubscriber.prototype._unsubscribe = function () {
        this.innerSubscription = undefined;
    };
    SwitchMapSubscriber.prototype.notifyComplete = function () {
        this.innerSubscription = undefined;
        if (this.isStopped) {
            _super.prototype._complete.call(this);
        }
    };
    SwitchMapSubscriber.prototype.notifyNext = function (innerValue) {
        this.destination.next(innerValue);
    };
    return SwitchMapSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleOuterSubscriber));
//# sourceMappingURL=switchMap.js.map


/***/ }),
/* 186 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "switchMapTo": () => /* binding */ switchMapTo
/* harmony export */ });
/* harmony import */ var _switchMap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(185);
/** PURE_IMPORTS_START _switchMap PURE_IMPORTS_END */

function switchMapTo(innerObservable, resultSelector) {
    return resultSelector ? (0,_switchMap__WEBPACK_IMPORTED_MODULE_0__.switchMap)(function () { return innerObservable; }, resultSelector) : (0,_switchMap__WEBPACK_IMPORTED_MODULE_0__.switchMap)(function () { return innerObservable; });
}
//# sourceMappingURL=switchMapTo.js.map


/***/ }),
/* 187 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "takeUntil": () => /* binding */ takeUntil
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


function takeUntil(notifier) {
    return function (source) { return source.lift(new TakeUntilOperator(notifier)); };
}
var TakeUntilOperator = /*@__PURE__*/ (function () {
    function TakeUntilOperator(notifier) {
        this.notifier = notifier;
    }
    TakeUntilOperator.prototype.call = function (subscriber, source) {
        var takeUntilSubscriber = new TakeUntilSubscriber(subscriber);
        var notifierSubscription = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.innerSubscribe)(this.notifier, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.SimpleInnerSubscriber(takeUntilSubscriber));
        if (notifierSubscription && !takeUntilSubscriber.seenValue) {
            takeUntilSubscriber.add(notifierSubscription);
            return source.subscribe(takeUntilSubscriber);
        }
        return takeUntilSubscriber;
    };
    return TakeUntilOperator;
}());
var TakeUntilSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(TakeUntilSubscriber, _super);
    function TakeUntilSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.seenValue = false;
        return _this;
    }
    TakeUntilSubscriber.prototype.notifyNext = function () {
        this.seenValue = true;
        this.complete();
    };
    TakeUntilSubscriber.prototype.notifyComplete = function () {
    };
    return TakeUntilSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.SimpleOuterSubscriber));
//# sourceMappingURL=takeUntil.js.map


/***/ }),
/* 188 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "takeWhile": () => /* binding */ takeWhile
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7);
/** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */


function takeWhile(predicate, inclusive) {
    if (inclusive === void 0) {
        inclusive = false;
    }
    return function (source) {
        return source.lift(new TakeWhileOperator(predicate, inclusive));
    };
}
var TakeWhileOperator = /*@__PURE__*/ (function () {
    function TakeWhileOperator(predicate, inclusive) {
        this.predicate = predicate;
        this.inclusive = inclusive;
    }
    TakeWhileOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new TakeWhileSubscriber(subscriber, this.predicate, this.inclusive));
    };
    return TakeWhileOperator;
}());
var TakeWhileSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(TakeWhileSubscriber, _super);
    function TakeWhileSubscriber(destination, predicate, inclusive) {
        var _this = _super.call(this, destination) || this;
        _this.predicate = predicate;
        _this.inclusive = inclusive;
        _this.index = 0;
        return _this;
    }
    TakeWhileSubscriber.prototype._next = function (value) {
        var destination = this.destination;
        var result;
        try {
            result = this.predicate(value, this.index++);
        }
        catch (err) {
            destination.error(err);
            return;
        }
        this.nextOrComplete(value, result);
    };
    TakeWhileSubscriber.prototype.nextOrComplete = function (value, predicateResult) {
        var destination = this.destination;
        if (Boolean(predicateResult)) {
            destination.next(value);
        }
        else {
            if (this.inclusive) {
                destination.next(value);
            }
            destination.complete();
        }
    };
    return TakeWhileSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_1__.Subscriber));
//# sourceMappingURL=takeWhile.js.map


/***/ }),
/* 189 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "tap": () => /* binding */ tap
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _util_noop__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(56);
/* harmony import */ var _util_isFunction__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(14);
/** PURE_IMPORTS_START tslib,_Subscriber,_util_noop,_util_isFunction PURE_IMPORTS_END */




function tap(nextOrObserver, error, complete) {
    return function tapOperatorFunction(source) {
        return source.lift(new DoOperator(nextOrObserver, error, complete));
    };
}
var DoOperator = /*@__PURE__*/ (function () {
    function DoOperator(nextOrObserver, error, complete) {
        this.nextOrObserver = nextOrObserver;
        this.error = error;
        this.complete = complete;
    }
    DoOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new TapSubscriber(subscriber, this.nextOrObserver, this.error, this.complete));
    };
    return DoOperator;
}());
var TapSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(TapSubscriber, _super);
    function TapSubscriber(destination, observerOrNext, error, complete) {
        var _this = _super.call(this, destination) || this;
        _this._tapNext = _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
        _this._tapError = _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
        _this._tapComplete = _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
        _this._tapError = error || _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
        _this._tapComplete = complete || _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
        if ((0,_util_isFunction__WEBPACK_IMPORTED_MODULE_2__.isFunction)(observerOrNext)) {
            _this._context = _this;
            _this._tapNext = observerOrNext;
        }
        else if (observerOrNext) {
            _this._context = observerOrNext;
            _this._tapNext = observerOrNext.next || _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
            _this._tapError = observerOrNext.error || _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
            _this._tapComplete = observerOrNext.complete || _util_noop__WEBPACK_IMPORTED_MODULE_1__.noop;
        }
        return _this;
    }
    TapSubscriber.prototype._next = function (value) {
        try {
            this._tapNext.call(this._context, value);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(value);
    };
    TapSubscriber.prototype._error = function (err) {
        try {
            this._tapError.call(this._context, err);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.error(err);
    };
    TapSubscriber.prototype._complete = function () {
        try {
            this._tapComplete.call(this._context);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        return this.destination.complete();
    };
    return TapSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_3__.Subscriber));
//# sourceMappingURL=tap.js.map


/***/ }),
/* 190 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "defaultThrottleConfig": () => /* binding */ defaultThrottleConfig,
/* harmony export */   "throttle": () => /* binding */ throttle
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_innerSubscribe PURE_IMPORTS_END */


var defaultThrottleConfig = {
    leading: true,
    trailing: false
};
function throttle(durationSelector, config) {
    if (config === void 0) {
        config = defaultThrottleConfig;
    }
    return function (source) { return source.lift(new ThrottleOperator(durationSelector, !!config.leading, !!config.trailing)); };
}
var ThrottleOperator = /*@__PURE__*/ (function () {
    function ThrottleOperator(durationSelector, leading, trailing) {
        this.durationSelector = durationSelector;
        this.leading = leading;
        this.trailing = trailing;
    }
    ThrottleOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ThrottleSubscriber(subscriber, this.durationSelector, this.leading, this.trailing));
    };
    return ThrottleOperator;
}());
var ThrottleSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(ThrottleSubscriber, _super);
    function ThrottleSubscriber(destination, durationSelector, _leading, _trailing) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        _this.durationSelector = durationSelector;
        _this._leading = _leading;
        _this._trailing = _trailing;
        _this._hasValue = false;
        return _this;
    }
    ThrottleSubscriber.prototype._next = function (value) {
        this._hasValue = true;
        this._sendValue = value;
        if (!this._throttled) {
            if (this._leading) {
                this.send();
            }
            else {
                this.throttle(value);
            }
        }
    };
    ThrottleSubscriber.prototype.send = function () {
        var _a = this, _hasValue = _a._hasValue, _sendValue = _a._sendValue;
        if (_hasValue) {
            this.destination.next(_sendValue);
            this.throttle(_sendValue);
        }
        this._hasValue = false;
        this._sendValue = undefined;
    };
    ThrottleSubscriber.prototype.throttle = function (value) {
        var duration = this.tryDurationSelector(value);
        if (!!duration) {
            this.add(this._throttled = (0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.innerSubscribe)(duration, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleInnerSubscriber(this)));
        }
    };
    ThrottleSubscriber.prototype.tryDurationSelector = function (value) {
        try {
            return this.durationSelector(value);
        }
        catch (err) {
            this.destination.error(err);
            return null;
        }
    };
    ThrottleSubscriber.prototype.throttlingDone = function () {
        var _a = this, _throttled = _a._throttled, _trailing = _a._trailing;
        if (_throttled) {
            _throttled.unsubscribe();
        }
        this._throttled = undefined;
        if (_trailing) {
            this.send();
        }
    };
    ThrottleSubscriber.prototype.notifyNext = function () {
        this.throttlingDone();
    };
    ThrottleSubscriber.prototype.notifyComplete = function () {
        this.throttlingDone();
    };
    return ThrottleSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_1__.SimpleOuterSubscriber));
//# sourceMappingURL=throttle.js.map


/***/ }),
/* 191 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "throttleTime": () => /* binding */ throttleTime
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _throttle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(190);
/** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async,_throttle PURE_IMPORTS_END */




function throttleTime(duration, scheduler, config) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    if (config === void 0) {
        config = _throttle__WEBPACK_IMPORTED_MODULE_1__.defaultThrottleConfig;
    }
    return function (source) { return source.lift(new ThrottleTimeOperator(duration, scheduler, config.leading, config.trailing)); };
}
var ThrottleTimeOperator = /*@__PURE__*/ (function () {
    function ThrottleTimeOperator(duration, scheduler, leading, trailing) {
        this.duration = duration;
        this.scheduler = scheduler;
        this.leading = leading;
        this.trailing = trailing;
    }
    ThrottleTimeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ThrottleTimeSubscriber(subscriber, this.duration, this.scheduler, this.leading, this.trailing));
    };
    return ThrottleTimeOperator;
}());
var ThrottleTimeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(ThrottleTimeSubscriber, _super);
    function ThrottleTimeSubscriber(destination, duration, scheduler, leading, trailing) {
        var _this = _super.call(this, destination) || this;
        _this.duration = duration;
        _this.scheduler = scheduler;
        _this.leading = leading;
        _this.trailing = trailing;
        _this._hasTrailingValue = false;
        _this._trailingValue = null;
        return _this;
    }
    ThrottleTimeSubscriber.prototype._next = function (value) {
        if (this.throttled) {
            if (this.trailing) {
                this._trailingValue = value;
                this._hasTrailingValue = true;
            }
        }
        else {
            this.add(this.throttled = this.scheduler.schedule(dispatchNext, this.duration, { subscriber: this }));
            if (this.leading) {
                this.destination.next(value);
            }
            else if (this.trailing) {
                this._trailingValue = value;
                this._hasTrailingValue = true;
            }
        }
    };
    ThrottleTimeSubscriber.prototype._complete = function () {
        if (this._hasTrailingValue) {
            this.destination.next(this._trailingValue);
            this.destination.complete();
        }
        else {
            this.destination.complete();
        }
    };
    ThrottleTimeSubscriber.prototype.clearThrottle = function () {
        var throttled = this.throttled;
        if (throttled) {
            if (this.trailing && this._hasTrailingValue) {
                this.destination.next(this._trailingValue);
                this._trailingValue = null;
                this._hasTrailingValue = false;
            }
            throttled.unsubscribe();
            this.remove(throttled);
            this.throttled = null;
        }
    };
    return ThrottleTimeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_3__.Subscriber));
function dispatchNext(arg) {
    var subscriber = arg.subscriber;
    subscriber.clearThrottle();
}
//# sourceMappingURL=throttleTime.js.map


/***/ }),
/* 192 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timeInterval": () => /* binding */ timeInterval,
/* harmony export */   "TimeInterval": () => /* binding */ TimeInterval
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _scan__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(152);
/* harmony import */ var _observable_defer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(87);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(62);
/** PURE_IMPORTS_START _scheduler_async,_scan,_observable_defer,_map PURE_IMPORTS_END */




function timeInterval(scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return function (source) {
        return (0,_observable_defer__WEBPACK_IMPORTED_MODULE_1__.defer)(function () {
            return source.pipe((0,_scan__WEBPACK_IMPORTED_MODULE_2__.scan)(function (_a, value) {
                var current = _a.current;
                return ({ value: value, current: scheduler.now(), last: current });
            }, { current: scheduler.now(), value: undefined, last: undefined }), (0,_map__WEBPACK_IMPORTED_MODULE_3__.map)(function (_a) {
                var current = _a.current, last = _a.last, value = _a.value;
                return new TimeInterval(value, current - last);
            }));
        });
    };
}
var TimeInterval = /*@__PURE__*/ (function () {
    function TimeInterval(value, interval) {
        this.value = value;
        this.interval = interval;
    }
    return TimeInterval;
}());

//# sourceMappingURL=timeInterval.js.map


/***/ }),
/* 193 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timeout": () => /* binding */ timeout
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _util_TimeoutError__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(60);
/* harmony import */ var _timeoutWith__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(194);
/* harmony import */ var _observable_throwError__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(37);
/** PURE_IMPORTS_START _scheduler_async,_util_TimeoutError,_timeoutWith,_observable_throwError PURE_IMPORTS_END */




function timeout(due, scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return (0,_timeoutWith__WEBPACK_IMPORTED_MODULE_1__.timeoutWith)(due, (0,_observable_throwError__WEBPACK_IMPORTED_MODULE_2__.throwError)(new _util_TimeoutError__WEBPACK_IMPORTED_MODULE_3__.TimeoutError()), scheduler);
}
//# sourceMappingURL=timeout.js.map


/***/ }),
/* 194 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timeoutWith": () => /* binding */ timeoutWith
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _util_isDate__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(126);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_scheduler_async,_util_isDate,_innerSubscribe PURE_IMPORTS_END */




function timeoutWith(due, withObservable, scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return function (source) {
        var absoluteTimeout = (0,_util_isDate__WEBPACK_IMPORTED_MODULE_1__.isDate)(due);
        var waitFor = absoluteTimeout ? (+due - scheduler.now()) : Math.abs(due);
        return source.lift(new TimeoutWithOperator(waitFor, absoluteTimeout, withObservable, scheduler));
    };
}
var TimeoutWithOperator = /*@__PURE__*/ (function () {
    function TimeoutWithOperator(waitFor, absoluteTimeout, withObservable, scheduler) {
        this.waitFor = waitFor;
        this.absoluteTimeout = absoluteTimeout;
        this.withObservable = withObservable;
        this.scheduler = scheduler;
    }
    TimeoutWithOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new TimeoutWithSubscriber(subscriber, this.absoluteTimeout, this.waitFor, this.withObservable, this.scheduler));
    };
    return TimeoutWithOperator;
}());
var TimeoutWithSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_2__.__extends(TimeoutWithSubscriber, _super);
    function TimeoutWithSubscriber(destination, absoluteTimeout, waitFor, withObservable, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.absoluteTimeout = absoluteTimeout;
        _this.waitFor = waitFor;
        _this.withObservable = withObservable;
        _this.scheduler = scheduler;
        _this.scheduleTimeout();
        return _this;
    }
    TimeoutWithSubscriber.dispatchTimeout = function (subscriber) {
        var withObservable = subscriber.withObservable;
        subscriber._unsubscribeAndRecycle();
        subscriber.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.innerSubscribe)(withObservable, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleInnerSubscriber(subscriber)));
    };
    TimeoutWithSubscriber.prototype.scheduleTimeout = function () {
        var action = this.action;
        if (action) {
            this.action = action.schedule(this, this.waitFor);
        }
        else {
            this.add(this.action = this.scheduler.schedule(TimeoutWithSubscriber.dispatchTimeout, this.waitFor, this));
        }
    };
    TimeoutWithSubscriber.prototype._next = function (value) {
        if (!this.absoluteTimeout) {
            this.scheduleTimeout();
        }
        _super.prototype._next.call(this, value);
    };
    TimeoutWithSubscriber.prototype._unsubscribe = function () {
        this.action = undefined;
        this.scheduler = null;
        this.withObservable = null;
    };
    return TimeoutWithSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_3__.SimpleOuterSubscriber));
//# sourceMappingURL=timeoutWith.js.map


/***/ }),
/* 195 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "timestamp": () => /* binding */ timestamp,
/* harmony export */   "Timestamp": () => /* binding */ Timestamp
/* harmony export */ });
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(62);
/** PURE_IMPORTS_START _scheduler_async,_map PURE_IMPORTS_END */


function timestamp(scheduler) {
    if (scheduler === void 0) {
        scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    }
    return (0,_map__WEBPACK_IMPORTED_MODULE_1__.map)(function (value) { return new Timestamp(value, scheduler.now()); });
}
var Timestamp = /*@__PURE__*/ (function () {
    function Timestamp(value, timestamp) {
        this.value = value;
        this.timestamp = timestamp;
    }
    return Timestamp;
}());

//# sourceMappingURL=timestamp.js.map


/***/ }),
/* 196 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "toArray": () => /* binding */ toArray
/* harmony export */ });
/* harmony import */ var _reduce__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(151);
/** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */

function toArrayReducer(arr, item, index) {
    if (index === 0) {
        return [item];
    }
    arr.push(item);
    return arr;
}
function toArray() {
    return (0,_reduce__WEBPACK_IMPORTED_MODULE_0__.reduce)(toArrayReducer, []);
}
//# sourceMappingURL=toArray.js.map


/***/ }),
/* 197 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "window": () => /* binding */ window
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _innerSubscribe__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(86);
/** PURE_IMPORTS_START tslib,_Subject,_innerSubscribe PURE_IMPORTS_END */



function window(windowBoundaries) {
    return function windowOperatorFunction(source) {
        return source.lift(new WindowOperator(windowBoundaries));
    };
}
var WindowOperator = /*@__PURE__*/ (function () {
    function WindowOperator(windowBoundaries) {
        this.windowBoundaries = windowBoundaries;
    }
    WindowOperator.prototype.call = function (subscriber, source) {
        var windowSubscriber = new WindowSubscriber(subscriber);
        var sourceSubscription = source.subscribe(windowSubscriber);
        if (!sourceSubscription.closed) {
            windowSubscriber.add((0,_innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.innerSubscribe)(this.windowBoundaries, new _innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.SimpleInnerSubscriber(windowSubscriber)));
        }
        return sourceSubscription;
    };
    return WindowOperator;
}());
var WindowSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_1__.__extends(WindowSubscriber, _super);
    function WindowSubscriber(destination) {
        var _this = _super.call(this, destination) || this;
        _this.window = new _Subject__WEBPACK_IMPORTED_MODULE_2__.Subject();
        destination.next(_this.window);
        return _this;
    }
    WindowSubscriber.prototype.notifyNext = function () {
        this.openWindow();
    };
    WindowSubscriber.prototype.notifyError = function (error) {
        this._error(error);
    };
    WindowSubscriber.prototype.notifyComplete = function () {
        this._complete();
    };
    WindowSubscriber.prototype._next = function (value) {
        this.window.next(value);
    };
    WindowSubscriber.prototype._error = function (err) {
        this.window.error(err);
        this.destination.error(err);
    };
    WindowSubscriber.prototype._complete = function () {
        this.window.complete();
        this.destination.complete();
    };
    WindowSubscriber.prototype._unsubscribe = function () {
        this.window = null;
    };
    WindowSubscriber.prototype.openWindow = function () {
        var prevWindow = this.window;
        if (prevWindow) {
            prevWindow.complete();
        }
        var destination = this.destination;
        var newWindow = this.window = new _Subject__WEBPACK_IMPORTED_MODULE_2__.Subject();
        destination.next(newWindow);
    };
    return WindowSubscriber;
}(_innerSubscribe__WEBPACK_IMPORTED_MODULE_0__.SimpleOuterSubscriber));
//# sourceMappingURL=window.js.map


/***/ }),
/* 198 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowCount": () => /* binding */ windowCount
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(7);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/** PURE_IMPORTS_START tslib,_Subscriber,_Subject PURE_IMPORTS_END */



function windowCount(windowSize, startWindowEvery) {
    if (startWindowEvery === void 0) {
        startWindowEvery = 0;
    }
    return function windowCountOperatorFunction(source) {
        return source.lift(new WindowCountOperator(windowSize, startWindowEvery));
    };
}
var WindowCountOperator = /*@__PURE__*/ (function () {
    function WindowCountOperator(windowSize, startWindowEvery) {
        this.windowSize = windowSize;
        this.startWindowEvery = startWindowEvery;
    }
    WindowCountOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new WindowCountSubscriber(subscriber, this.windowSize, this.startWindowEvery));
    };
    return WindowCountOperator;
}());
var WindowCountSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(WindowCountSubscriber, _super);
    function WindowCountSubscriber(destination, windowSize, startWindowEvery) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        _this.windowSize = windowSize;
        _this.startWindowEvery = startWindowEvery;
        _this.windows = [new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject()];
        _this.count = 0;
        destination.next(_this.windows[0]);
        return _this;
    }
    WindowCountSubscriber.prototype._next = function (value) {
        var startWindowEvery = (this.startWindowEvery > 0) ? this.startWindowEvery : this.windowSize;
        var destination = this.destination;
        var windowSize = this.windowSize;
        var windows = this.windows;
        var len = windows.length;
        for (var i = 0; i < len && !this.closed; i++) {
            windows[i].next(value);
        }
        var c = this.count - windowSize + 1;
        if (c >= 0 && c % startWindowEvery === 0 && !this.closed) {
            windows.shift().complete();
        }
        if (++this.count % startWindowEvery === 0 && !this.closed) {
            var window_1 = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
            windows.push(window_1);
            destination.next(window_1);
        }
    };
    WindowCountSubscriber.prototype._error = function (err) {
        var windows = this.windows;
        if (windows) {
            while (windows.length > 0 && !this.closed) {
                windows.shift().error(err);
            }
        }
        this.destination.error(err);
    };
    WindowCountSubscriber.prototype._complete = function () {
        var windows = this.windows;
        if (windows) {
            while (windows.length > 0 && !this.closed) {
                windows.shift().complete();
            }
        }
        this.destination.complete();
    };
    WindowCountSubscriber.prototype._unsubscribe = function () {
        this.count = 0;
        this.windows = null;
    };
    return WindowCountSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_2__.Subscriber));
//# sourceMappingURL=windowCount.js.map


/***/ }),
/* 199 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowTime": () => /* binding */ windowTime
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(24);
/* harmony import */ var _scheduler_async__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(51);
/* harmony import */ var _Subscriber__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(7);
/* harmony import */ var _util_isNumeric__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(94);
/* harmony import */ var _util_isScheduler__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(33);
/** PURE_IMPORTS_START tslib,_Subject,_scheduler_async,_Subscriber,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */






function windowTime(windowTimeSpan) {
    var scheduler = _scheduler_async__WEBPACK_IMPORTED_MODULE_0__.async;
    var windowCreationInterval = null;
    var maxWindowSize = Number.POSITIVE_INFINITY;
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(arguments[3])) {
        scheduler = arguments[3];
    }
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(arguments[2])) {
        scheduler = arguments[2];
    }
    else if ((0,_util_isNumeric__WEBPACK_IMPORTED_MODULE_2__.isNumeric)(arguments[2])) {
        maxWindowSize = Number(arguments[2]);
    }
    if ((0,_util_isScheduler__WEBPACK_IMPORTED_MODULE_1__.isScheduler)(arguments[1])) {
        scheduler = arguments[1];
    }
    else if ((0,_util_isNumeric__WEBPACK_IMPORTED_MODULE_2__.isNumeric)(arguments[1])) {
        windowCreationInterval = Number(arguments[1]);
    }
    return function windowTimeOperatorFunction(source) {
        return source.lift(new WindowTimeOperator(windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler));
    };
}
var WindowTimeOperator = /*@__PURE__*/ (function () {
    function WindowTimeOperator(windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler) {
        this.windowTimeSpan = windowTimeSpan;
        this.windowCreationInterval = windowCreationInterval;
        this.maxWindowSize = maxWindowSize;
        this.scheduler = scheduler;
    }
    WindowTimeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new WindowTimeSubscriber(subscriber, this.windowTimeSpan, this.windowCreationInterval, this.maxWindowSize, this.scheduler));
    };
    return WindowTimeOperator;
}());
var CountedSubject = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_3__.__extends(CountedSubject, _super);
    function CountedSubject() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._numberOfNextedValues = 0;
        return _this;
    }
    CountedSubject.prototype.next = function (value) {
        this._numberOfNextedValues++;
        _super.prototype.next.call(this, value);
    };
    Object.defineProperty(CountedSubject.prototype, "numberOfNextedValues", {
        get: function () {
            return this._numberOfNextedValues;
        },
        enumerable: true,
        configurable: true
    });
    return CountedSubject;
}(_Subject__WEBPACK_IMPORTED_MODULE_4__.Subject));
var WindowTimeSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_3__.__extends(WindowTimeSubscriber, _super);
    function WindowTimeSubscriber(destination, windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        _this.windowTimeSpan = windowTimeSpan;
        _this.windowCreationInterval = windowCreationInterval;
        _this.maxWindowSize = maxWindowSize;
        _this.scheduler = scheduler;
        _this.windows = [];
        var window = _this.openWindow();
        if (windowCreationInterval !== null && windowCreationInterval >= 0) {
            var closeState = { subscriber: _this, window: window, context: null };
            var creationState = { windowTimeSpan: windowTimeSpan, windowCreationInterval: windowCreationInterval, subscriber: _this, scheduler: scheduler };
            _this.add(scheduler.schedule(dispatchWindowClose, windowTimeSpan, closeState));
            _this.add(scheduler.schedule(dispatchWindowCreation, windowCreationInterval, creationState));
        }
        else {
            var timeSpanOnlyState = { subscriber: _this, window: window, windowTimeSpan: windowTimeSpan };
            _this.add(scheduler.schedule(dispatchWindowTimeSpanOnly, windowTimeSpan, timeSpanOnlyState));
        }
        return _this;
    }
    WindowTimeSubscriber.prototype._next = function (value) {
        var windows = this.windows;
        var len = windows.length;
        for (var i = 0; i < len; i++) {
            var window_1 = windows[i];
            if (!window_1.closed) {
                window_1.next(value);
                if (window_1.numberOfNextedValues >= this.maxWindowSize) {
                    this.closeWindow(window_1);
                }
            }
        }
    };
    WindowTimeSubscriber.prototype._error = function (err) {
        var windows = this.windows;
        while (windows.length > 0) {
            windows.shift().error(err);
        }
        this.destination.error(err);
    };
    WindowTimeSubscriber.prototype._complete = function () {
        var windows = this.windows;
        while (windows.length > 0) {
            var window_2 = windows.shift();
            if (!window_2.closed) {
                window_2.complete();
            }
        }
        this.destination.complete();
    };
    WindowTimeSubscriber.prototype.openWindow = function () {
        var window = new CountedSubject();
        this.windows.push(window);
        var destination = this.destination;
        destination.next(window);
        return window;
    };
    WindowTimeSubscriber.prototype.closeWindow = function (window) {
        window.complete();
        var windows = this.windows;
        windows.splice(windows.indexOf(window), 1);
    };
    return WindowTimeSubscriber;
}(_Subscriber__WEBPACK_IMPORTED_MODULE_5__.Subscriber));
function dispatchWindowTimeSpanOnly(state) {
    var subscriber = state.subscriber, windowTimeSpan = state.windowTimeSpan, window = state.window;
    if (window) {
        subscriber.closeWindow(window);
    }
    state.window = subscriber.openWindow();
    this.schedule(state, windowTimeSpan);
}
function dispatchWindowCreation(state) {
    var windowTimeSpan = state.windowTimeSpan, subscriber = state.subscriber, scheduler = state.scheduler, windowCreationInterval = state.windowCreationInterval;
    var window = subscriber.openWindow();
    var action = this;
    var context = { action: action, subscription: null };
    var timeSpanState = { subscriber: subscriber, window: window, context: context };
    context.subscription = scheduler.schedule(dispatchWindowClose, windowTimeSpan, timeSpanState);
    action.add(context.subscription);
    action.schedule(state, windowCreationInterval);
}
function dispatchWindowClose(state) {
    var subscriber = state.subscriber, window = state.window, context = state.context;
    if (context && context.action && context.subscription) {
        context.action.remove(context.subscription);
    }
    subscriber.closeWindow(window);
}
//# sourceMappingURL=windowTime.js.map


/***/ }),
/* 200 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowToggle": () => /* binding */ windowToggle
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(24);
/* harmony import */ var _Subscription__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(13);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(74);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(65);
/** PURE_IMPORTS_START tslib,_Subject,_Subscription,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */





function windowToggle(openings, closingSelector) {
    return function (source) { return source.lift(new WindowToggleOperator(openings, closingSelector)); };
}
var WindowToggleOperator = /*@__PURE__*/ (function () {
    function WindowToggleOperator(openings, closingSelector) {
        this.openings = openings;
        this.closingSelector = closingSelector;
    }
    WindowToggleOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new WindowToggleSubscriber(subscriber, this.openings, this.closingSelector));
    };
    return WindowToggleOperator;
}());
var WindowToggleSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(WindowToggleSubscriber, _super);
    function WindowToggleSubscriber(destination, openings, closingSelector) {
        var _this = _super.call(this, destination) || this;
        _this.openings = openings;
        _this.closingSelector = closingSelector;
        _this.contexts = [];
        _this.add(_this.openSubscription = (0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__.subscribeToResult)(_this, openings, openings));
        return _this;
    }
    WindowToggleSubscriber.prototype._next = function (value) {
        var contexts = this.contexts;
        if (contexts) {
            var len = contexts.length;
            for (var i = 0; i < len; i++) {
                contexts[i].window.next(value);
            }
        }
    };
    WindowToggleSubscriber.prototype._error = function (err) {
        var contexts = this.contexts;
        this.contexts = null;
        if (contexts) {
            var len = contexts.length;
            var index = -1;
            while (++index < len) {
                var context_1 = contexts[index];
                context_1.window.error(err);
                context_1.subscription.unsubscribe();
            }
        }
        _super.prototype._error.call(this, err);
    };
    WindowToggleSubscriber.prototype._complete = function () {
        var contexts = this.contexts;
        this.contexts = null;
        if (contexts) {
            var len = contexts.length;
            var index = -1;
            while (++index < len) {
                var context_2 = contexts[index];
                context_2.window.complete();
                context_2.subscription.unsubscribe();
            }
        }
        _super.prototype._complete.call(this);
    };
    WindowToggleSubscriber.prototype._unsubscribe = function () {
        var contexts = this.contexts;
        this.contexts = null;
        if (contexts) {
            var len = contexts.length;
            var index = -1;
            while (++index < len) {
                var context_3 = contexts[index];
                context_3.window.unsubscribe();
                context_3.subscription.unsubscribe();
            }
        }
    };
    WindowToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
        if (outerValue === this.openings) {
            var closingNotifier = void 0;
            try {
                var closingSelector = this.closingSelector;
                closingNotifier = closingSelector(innerValue);
            }
            catch (e) {
                return this.error(e);
            }
            var window_1 = new _Subject__WEBPACK_IMPORTED_MODULE_2__.Subject();
            var subscription = new _Subscription__WEBPACK_IMPORTED_MODULE_3__.Subscription();
            var context_4 = { window: window_1, subscription: subscription };
            this.contexts.push(context_4);
            var innerSubscription = (0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__.subscribeToResult)(this, closingNotifier, context_4);
            if (innerSubscription.closed) {
                this.closeWindow(this.contexts.length - 1);
            }
            else {
                innerSubscription.context = context_4;
                subscription.add(innerSubscription);
            }
            this.destination.next(window_1);
        }
        else {
            this.closeWindow(this.contexts.indexOf(outerValue));
        }
    };
    WindowToggleSubscriber.prototype.notifyError = function (err) {
        this.error(err);
    };
    WindowToggleSubscriber.prototype.notifyComplete = function (inner) {
        if (inner !== this.openSubscription) {
            this.closeWindow(this.contexts.indexOf(inner.context));
        }
    };
    WindowToggleSubscriber.prototype.closeWindow = function (index) {
        if (index === -1) {
            return;
        }
        var contexts = this.contexts;
        var context = contexts[index];
        var window = context.window, subscription = context.subscription;
        contexts.splice(index, 1);
        window.complete();
        subscription.unsubscribe();
    };
    return WindowToggleSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_4__.OuterSubscriber));
//# sourceMappingURL=windowToggle.js.map


/***/ }),
/* 201 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "windowWhen": () => /* binding */ windowWhen
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _Subject__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(24);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(74);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(65);
/** PURE_IMPORTS_START tslib,_Subject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */




function windowWhen(closingSelector) {
    return function windowWhenOperatorFunction(source) {
        return source.lift(new WindowOperator(closingSelector));
    };
}
var WindowOperator = /*@__PURE__*/ (function () {
    function WindowOperator(closingSelector) {
        this.closingSelector = closingSelector;
    }
    WindowOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new WindowSubscriber(subscriber, this.closingSelector));
    };
    return WindowOperator;
}());
var WindowSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(WindowSubscriber, _super);
    function WindowSubscriber(destination, closingSelector) {
        var _this = _super.call(this, destination) || this;
        _this.destination = destination;
        _this.closingSelector = closingSelector;
        _this.openWindow();
        return _this;
    }
    WindowSubscriber.prototype.notifyNext = function (_outerValue, _innerValue, _outerIndex, _innerIndex, innerSub) {
        this.openWindow(innerSub);
    };
    WindowSubscriber.prototype.notifyError = function (error) {
        this._error(error);
    };
    WindowSubscriber.prototype.notifyComplete = function (innerSub) {
        this.openWindow(innerSub);
    };
    WindowSubscriber.prototype._next = function (value) {
        this.window.next(value);
    };
    WindowSubscriber.prototype._error = function (err) {
        this.window.error(err);
        this.destination.error(err);
        this.unsubscribeClosingNotification();
    };
    WindowSubscriber.prototype._complete = function () {
        this.window.complete();
        this.destination.complete();
        this.unsubscribeClosingNotification();
    };
    WindowSubscriber.prototype.unsubscribeClosingNotification = function () {
        if (this.closingNotification) {
            this.closingNotification.unsubscribe();
        }
    };
    WindowSubscriber.prototype.openWindow = function (innerSub) {
        if (innerSub === void 0) {
            innerSub = null;
        }
        if (innerSub) {
            this.remove(innerSub);
            innerSub.unsubscribe();
        }
        var prevWindow = this.window;
        if (prevWindow) {
            prevWindow.complete();
        }
        var window = this.window = new _Subject__WEBPACK_IMPORTED_MODULE_1__.Subject();
        this.destination.next(window);
        var closingNotifier;
        try {
            var closingSelector = this.closingSelector;
            closingNotifier = closingSelector();
        }
        catch (e) {
            this.destination.error(e);
            this.window.error(e);
            return;
        }
        this.add(this.closingNotification = (0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_2__.subscribeToResult)(this, closingNotifier));
    };
    return WindowSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_3__.OuterSubscriber));
//# sourceMappingURL=windowWhen.js.map


/***/ }),
/* 202 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "withLatestFrom": () => /* binding */ withLatestFrom
/* harmony export */ });
/* harmony import */ var tslib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(8);
/* harmony import */ var _OuterSubscriber__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(74);
/* harmony import */ var _util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(65);
/** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */



function withLatestFrom() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return function (source) {
        var project;
        if (typeof args[args.length - 1] === 'function') {
            project = args.pop();
        }
        var observables = args;
        return source.lift(new WithLatestFromOperator(observables, project));
    };
}
var WithLatestFromOperator = /*@__PURE__*/ (function () {
    function WithLatestFromOperator(observables, project) {
        this.observables = observables;
        this.project = project;
    }
    WithLatestFromOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new WithLatestFromSubscriber(subscriber, this.observables, this.project));
    };
    return WithLatestFromOperator;
}());
var WithLatestFromSubscriber = /*@__PURE__*/ (function (_super) {
    tslib__WEBPACK_IMPORTED_MODULE_0__.__extends(WithLatestFromSubscriber, _super);
    function WithLatestFromSubscriber(destination, observables, project) {
        var _this = _super.call(this, destination) || this;
        _this.observables = observables;
        _this.project = project;
        _this.toRespond = [];
        var len = observables.length;
        _this.values = new Array(len);
        for (var i = 0; i < len; i++) {
            _this.toRespond.push(i);
        }
        for (var i = 0; i < len; i++) {
            var observable = observables[i];
            _this.add((0,_util_subscribeToResult__WEBPACK_IMPORTED_MODULE_1__.subscribeToResult)(_this, observable, undefined, i));
        }
        return _this;
    }
    WithLatestFromSubscriber.prototype.notifyNext = function (_outerValue, innerValue, outerIndex) {
        this.values[outerIndex] = innerValue;
        var toRespond = this.toRespond;
        if (toRespond.length > 0) {
            var found = toRespond.indexOf(outerIndex);
            if (found !== -1) {
                toRespond.splice(found, 1);
            }
        }
    };
    WithLatestFromSubscriber.prototype.notifyComplete = function () {
    };
    WithLatestFromSubscriber.prototype._next = function (value) {
        if (this.toRespond.length === 0) {
            var args = [value].concat(this.values);
            if (this.project) {
                this._tryProject(args);
            }
            else {
                this.destination.next(args);
            }
        }
    };
    WithLatestFromSubscriber.prototype._tryProject = function (args) {
        var result;
        try {
            result = this.project.apply(this, args);
        }
        catch (err) {
            this.destination.error(err);
            return;
        }
        this.destination.next(result);
    };
    return WithLatestFromSubscriber;
}(_OuterSubscriber__WEBPACK_IMPORTED_MODULE_2__.OuterSubscriber));
//# sourceMappingURL=withLatestFrom.js.map


/***/ }),
/* 203 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "zip": () => /* binding */ zip
/* harmony export */ });
/* harmony import */ var _observable_zip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(106);
/** PURE_IMPORTS_START _observable_zip PURE_IMPORTS_END */

function zip() {
    var observables = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        observables[_i] = arguments[_i];
    }
    return function zipOperatorFunction(source) {
        return source.lift.call(_observable_zip__WEBPACK_IMPORTED_MODULE_0__.zip.apply(void 0, [source].concat(observables)));
    };
}
//# sourceMappingURL=zip.js.map


/***/ }),
/* 204 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "zipAll": () => /* binding */ zipAll
/* harmony export */ });
/* harmony import */ var _observable_zip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(106);
/** PURE_IMPORTS_START _observable_zip PURE_IMPORTS_END */

function zipAll(project) {
    return function (source) { return source.lift(new _observable_zip__WEBPACK_IMPORTED_MODULE_0__.ZipOperator(project)); };
}
//# sourceMappingURL=zipAll.js.map


/***/ }),
/* 205 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(206)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, GreaseMonkeyCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.ChatApi = void 0;
    class ChatApi {
        constructor(chatUrl = 'https://chat.stackoverflow.com') {
            this.chatRoomUrl = `${chatUrl}`;
        }
        static GetExpiryDate() {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);
            return expiryDate;
        }
        async GetChannelFKey(roomId) {
            const cachingKey = `StackExchange.ChatApi.FKey_${roomId}`;
            const getterPromise = new Promise((resolve, reject) => {
                this.GetChannelPage(roomId).then(channelPage => {
                    const fkeyElement = $(channelPage).filter('#fkey');
                    if (fkeyElement.length > 0) {
                        const fkey = fkeyElement.val();
                        resolve(fkey);
                        return;
                    }
                    reject('Could not find fkey');
                });
            });
            const expiryDate = ChatApi.GetExpiryDate();
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(cachingKey, () => getterPromise, expiryDate);
        }
        async GetChatUserId(roomId) {
            const cachingKey = `StackExchange.ChatApi.UserId_${roomId}`;
            const getterPromise = new Promise((resolve, reject) => {
                this.GetChannelPage(roomId).then(channelPage => {
                    const activeUserDiv = $('#active-user', $(channelPage));
                    const classAtr = activeUserDiv.attr('class');
                    const match = classAtr.match(/user-(\d+)/);
                    if (match && match.length) {
                        resolve(parseInt(match[1], 10));
                    }
                    reject('Could not find user id');
                });
            });
            const expiryDate = ChatApi.GetExpiryDate();
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(cachingKey, () => getterPromise, expiryDate);
        }
        SendMessage(roomId, message, providedFkey) {
            return new Promise((resolve, reject) => {
                const requestFunc = () => {
                    const fkeyPromise = providedFkey
                        ? Promise.resolve(providedFkey)
                        : this.GetChannelFKey(roomId);
                    return fkeyPromise.then((fKey) => {
                        GM_xmlhttpRequest({
                            method: 'POST',
                            url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                            onload: (response) => {
                                if (response.status !== 200) {
                                    onFailure(response.statusText);
                                }
                                else {
                                    resolve();
                                }
                            },
                            onerror: (response) => {
                                onFailure(response);
                            },
                        });
                    });
                };
                let numTries = 0;
                const onFailure = (errorMessage) => {
                    numTries++;
                    if (numTries < 3) {
                        const fkeyCacheKey = `StackExchange.ChatApi.FKey_${roomId}`;
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
                        if (response.status !== 200) {
                            reject(response.statusText);
                        }
                        else {
                            resolve(response.responseText);
                        }
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
/* 206 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.GreaseMonkeyCache = void 0;
    class GreaseMonkeyCache {
        static async GetAndCache(cacheKey, getterPromise, expiresAt) {
            const cachedItem = GreaseMonkeyCache.GetFromCache(cacheKey);
            if (cachedItem !== undefined) {
                return cachedItem;
            }
            const result = await getterPromise();
            GreaseMonkeyCache.StoreInCache(cacheKey, result, expiresAt);
            return result;
        }
        static ClearExpiredKeys(regexes) {
            GM_listValues().forEach(key => {
                if (!regexes || regexes.filter(r => key.match(r)).length > 0) {
                    const jsonItem = GM_getValue(key, undefined);
                    if (jsonItem) {
                        try {
                            const dataItem = JSON.parse(jsonItem);
                            if ((dataItem.Expires && new Date(dataItem.Expires) < new Date())) {
                                GreaseMonkeyCache.Unset(key);
                            }
                        }
                        catch {
                            // Don't care
                        }
                    }
                }
            });
        }
        static ClearAll(regexes, condition) {
            GM_listValues().forEach(key => {
                if (regexes.filter(r => key.match(r)).length > 0) {
                    if (condition) {
                        const val = GM_getValue(key, undefined);
                        if (condition(val)) {
                            GreaseMonkeyCache.Unset(key);
                        }
                    }
                    else {
                        GreaseMonkeyCache.Unset(key);
                    }
                }
            });
        }
        static GetFromCache(cacheKey) {
            const jsonItem = GM_getValue(cacheKey, undefined);
            if (!jsonItem) {
                return undefined;
            }
            const dataItem = JSON.parse(jsonItem);
            if ((dataItem.Expires && new Date(dataItem.Expires) < new Date())) {
                return undefined;
            }
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
/* 207 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, sotools_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.GenericBotAPI = void 0;
    const genericBotKey = 'Cm45BSrt51FR3ju';
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
            if (!postContent) {
                return 0;
            }
            let hash = 0;
            for (let i = 0; i < postContent.length; ++i) {
                hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
                hash = hash & hash;
            }
            return hash;
        }
        makeTrackRequest() {
            const promise = new Promise((resolve, reject) => {
                if (!sotools_1.IsStackOverflow()) {
                    resolve(false);
                }
                if ($('#answer-' + this.answerId + ' .js-post-body').length === 0) {
                    resolve(false);
                }
                if ($('.top-bar .my-profile .gravatar-wrapper-24').length === 0) {
                    reject('Flag Tracker: Could not find username.');
                }
                const flaggerName = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
                const contentHash = this.computeContentHash($('#answer-' + this.answerId + ' .js-post-body').html().trim());
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://so.floern.com/api/trackpost.php',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: `key=${genericBotKey}`
                        + '&postId=' + this.answerId
                        + '&contentHash=' + contentHash
                        + '&flagger=' + encodeURIComponent(flaggerName),
                    onload: (response) => {
                        if (response.status !== 200) {
                            reject('Flag Tracker Error: Status ' + response.status);
                        }
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
/* 208 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(107), __webpack_require__(206)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1, GreaseMonkeyCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.MetaSmokeAPI = exports.MetaSmokeWasReportedConfig = exports.MetaSmokeUserKeyConfig = exports.MetaSmokeDisabledConfig = void 0;
    exports.MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
    exports.MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
    exports.MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';
    function Delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, milliseconds);
        });
    }
    class MetaSmokeAPI {
        static async Reset() {
            GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(exports.MetaSmokeDisabledConfig);
            GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(exports.MetaSmokeUserKeyConfig);
        }
        static async IsDisabled() {
            const cachedDisabled = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(exports.MetaSmokeDisabledConfig);
            if (cachedDisabled === undefined) {
                return false;
            }
            return cachedDisabled;
        }
        static async Setup(appKey, codeGetter) {
            if (!codeGetter) {
                codeGetter = async (metaSmokeOAuthUrl) => {
                    const isDisabled = await MetaSmokeAPI.IsDisabled();
                    if (isDisabled) {
                        return;
                    }
                    if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, see footer of Stack Overflow.')) {
                        GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(exports.MetaSmokeDisabledConfig, true);
                        return;
                    }
                    window.open(metaSmokeOAuthUrl, '_blank');
                    await Delay(100);
                    const returnCode = await new Promise((resolve) => {
                        const handleFDSCCode = () => {
                            $(window).off('focus', handleFDSCCode);
                            const code = window.prompt('Once you\'ve authenticated Advanced Flagging with metasmoke, you\'ll be given a code; enter it here.');
                            if (!code) {
                                resolve(undefined);
                            }
                            else {
                                return resolve(code);
                            }
                        };
                        $(window).focus(handleFDSCCode);
                    });
                    return returnCode;
                };
            }
            MetaSmokeAPI.codeGetter = codeGetter;
            MetaSmokeAPI.appKey = appKey;
            MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
        }
        static QueryMetaSmoke(postId, postType) {
            if (this.pendingTimeout) {
                clearTimeout(this.pendingTimeout);
            }
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
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            MetaSmokeAPI.IsDisabled().then(isDisabled => {
                if (isDisabled) {
                    return;
                }
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
                        if (pendingPost) {
                            const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                            const obs = MetaSmokeAPI.ObservableLookup[key];
                            if (obs) {
                                obs.next(item.id);
                            }
                            delete pendingPostLookup[item.link];
                        }
                    }
                    for (const url in pendingPostLookup) {
                        if (Object.prototype.hasOwnProperty.call(pendingPostLookup, url)) {
                            const pendingPost = pendingPostLookup[url];
                            const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                            const obs = MetaSmokeAPI.ObservableLookup[key];
                            if (obs) {
                                obs.next(null);
                            }
                        }
                    }
                }).fail(error => {
                    for (const url in pendingPostLookup) {
                        if (Object.prototype.hasOwnProperty.call(pendingPostLookup, url)) {
                            const pendingPost = pendingPostLookup[url];
                            const key = MetaSmokeAPI.GetObservableKey(pendingPost.postId, pendingPost.postType);
                            const obs = MetaSmokeAPI.ObservableLookup[key];
                            if (obs) {
                                obs.error(error);
                            }
                        }
                    }
                });
            });
        }
        static GetQueryUrl(postId, postType) {
            return postType === 'Answer'
                ? `//${window.location.hostname}/a/${postId}`
                : `//${window.location.hostname}/questions/${postId}`;
        }
        static async GetSmokeyId(postId, postType) {
            const observableKey = this.GetObservableKey(postId, postType);
            const observable = MetaSmokeAPI.ObservableLookup[observableKey];
            if (observable) {
                return observable.pipe(operators_1.take(1)).toPromise();
            }
            return null;
        }
        static GetObservableKey(postId, postType) {
            return JSON.stringify({ postId, postType });
        }
        static getUserKey() {
            // eslint-disable-next-line no-async-promise-executor
            return GreaseMonkeyCache_1.GreaseMonkeyCache.GetAndCache(exports.MetaSmokeUserKeyConfig, () => new Promise(async (resolve, reject) => {
                let prom = MetaSmokeAPI.actualPromise;
                if (prom === undefined) {
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
            if (smokeyid != null) {
                await this.SendFeedback(smokeyid, 'naa-');
                return true;
            }
            return false;
        }
        async ReportRedFlag(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid != null) {
                await this.SendFeedback(smokeyid, 'tpu-');
                return true;
            }
            else {
                const urlStr = postType === 'Answer'
                    ? `//${window.location.hostname}/a/${postId}`
                    : `//${window.location.hostname}/q/${postId}`;
                // eslint-disable-next-line no-async-promise-executor
                const promise = new Promise(async (resolve, reject) => {
                    const userKey = await MetaSmokeAPI.getUserKey();
                    if (userKey) {
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
                    }
                });
                const result = await promise;
                await Delay(1000);
                MetaSmokeAPI.QueryMetaSmoke(postId, postType);
                return result;
            }
        }
        async ReportLooksFine(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid != null) {
                await this.SendFeedback(smokeyid, 'fp-');
                return true;
            }
            return false;
        }
        async ReportNeedsEditing(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid != null) {
                await this.SendFeedback(smokeyid, 'fp-');
                return true;
            }
            return false;
        }
        async ReportVandalism(postId, postType) {
            const smokeyid = await MetaSmokeAPI.GetSmokeyId(postId, postType);
            if (smokeyid != null) {
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
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 209 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(107), __webpack_require__(205)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1, ChatApi_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.CopyPastorAPI = void 0;
    const copyPastorServer = 'https://copypastor.sobotics.org';
    const soboticsRoomId = 111347;
    class CopyPastorAPI {
        constructor(answerId, key) {
            this.answerId = answerId;
            this.key = key;
            this.subject = new rxjs_1.Subject();
            this.replaySubject = new rxjs_1.ReplaySubject(1);
            this.subject.subscribe(this.replaySubject);
        }
        Watch() {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            new Promise((resolve, reject) => {
                const url = `${copyPastorServer}/posts/findTarget?url=//${window.location.hostname}/a/${this.answerId}`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url,
                    onload: (response) => {
                        const responseObject = JSON.parse(response.responseText);
                        if (responseObject.status === 'success') {
                            resolve(responseObject.posts);
                        }
                        else {
                            reject(responseObject.message);
                        }
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
        Promise() {
            return this.replaySubject.pipe(operators_1.take(1)).toPromise();
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
            const chatId = await chatApi.GetChatUserId(soboticsRoomId);
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
                        url: `${copyPastorServer}/feedback/create`,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'post_id=' + payload.post_id
                            + '&feedback_type=' + payload.feedback_type
                            + '&username=' + payload.username
                            + '&link=' + payload.link
                            + '&key=' + payload.key,
                        onload: (response) => {
                            if (response.status !== 200) {
                                reject(JSON.parse(response.responseText));
                            }
                            else {
                                resolve(true);
                            }
                        },
                        onerror: (response) => {
                            reject(response);
                        },
                    });
                });
            });
            const allResults = await Promise.all(promises);
            if (allResults.length <= 0) {
                return false;
            }
            for (let i = 0; i < allResults.length; i++) {
                if (!allResults[i]) {
                    return false;
                }
            }
            return true;
        }
    }
    exports.CopyPastorAPI = CopyPastorAPI;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }),
/* 210 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(4), __webpack_require__(107)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, rxjs_1, operators_1) {
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
        if (initialized) {
            return;
        }
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
/* 211 */
/***/ ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(0), __webpack_require__(208), __webpack_require__(1), __webpack_require__(206)], __WEBPACK_AMD_DEFINE_RESULT__ = (function (require, exports, AdvancedFlagging_1, MetaSmokeAPI_1, FlagTypes_1, GreaseMonkeyCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", ({ value: true }));
    exports.SetupConfiguration = void 0;
    async function SetupConfiguration() {
        const bottomBox = $('.site-footer--copyright').children('.-list');
        const configurationDiv = $('<div>')
            .css('line-height', '18px')
            .css('text-align', 'left')
            .css('padding', '5px');
        await SetupDefaults();
        await BuildConfigurationOverlay();
        const configurationLink = $('<a id="af-modal-button">AdvancedFlagging configuration</a>');
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
    async function SetupDefaults() {
        const configurationEnabledFlags = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(AdvancedFlagging_1.ConfigurationEnabledFlags);
        if (!configurationEnabledFlags) {
            const flagTypeIds = getFlagTypes().map(f => f.Id);
            GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(AdvancedFlagging_1.ConfigurationEnabledFlags, flagTypeIds);
        }
    }
    async function BuildConfigurationOverlay() {
        const overlayModal = $('<aside class="s-modal" id="af-config" role="dialog" aria-labelledby="af-modal-title"'
            + '       aria-describedby="af-modal-description" aria-hidden="true"'
            + '    data-controller="s-modal" data-target="s-modal.modal">'
            + '    <div class="s-modal--dialog s-modal__full w60" role="document">'
            + '        <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>'
            + '        <div class="s-modal--body fs-body2" id="af-modal-description"></div>'
            + '        <div class="grid gs8 gsx s-modal--footer">'
            + '            <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>'
            + '            <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>'
            + '        </div>'
            + '        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide">'
            + '            <svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41L10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41z"></path></svg>'
            + '        </button>'
            + '    </div>'
            + '</aside>');
        const configElements = [];
        const sections = [
            {
                SectionName: 'General',
                Items: await GetGeneralConfigItems()
            },
            {
                SectionName: 'Flags',
                Items: await GetFlagSettings()
            },
            {
                SectionName: 'Admin',
                Items: await GetAdminConfigItems()
            }
        ];
        let firstSection = true;
        sections.forEach(section => {
            if (!firstSection) {
                overlayModal.find('#af-modal-description').append('<hr>');
            }
            firstSection = false;
            const sectionWrapper = $('<fieldset>').attr('class', 'grid gs8 gsy fd-column af-section-' + section.SectionName.toLowerCase())
                .html(`<h2 class="grid--cell">${section.SectionName}</h2>`);
            overlayModal.find('#af-modal-description').append(sectionWrapper);
            section.Items.forEach(item => {
                configElements.push(item);
                if (item.element) {
                    sectionWrapper.append(item.element);
                }
            });
        });
        const okayButton = overlayModal.find('.s-btn__primary');
        okayButton.click((event) => {
            event.preventDefault();
            let requiresReload = false;
            configElements.forEach(configElement => {
                if (configElement.onSave) {
                    configElement.onSave();
                }
                requiresReload = !!configElement.requiresReload;
            });
            AdvancedFlagging_1.displaySuccess('Configuration saved');
            if (requiresReload) {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        });
        $('body').append(overlayModal);
        $('label[for="flag-type-12"]').parent().removeClass('w25').css('width', '18.3%'); // because without it, the CSS breaks
        const flagOptions = $('.af-section-flags').children('div');
        for (let i = 0; i < flagOptions.length; i += 5) {
            flagOptions.slice(i, i + 5).wrapAll('<div class="grid--cell"><div class="grid gs16"></div></div>');
        }
    }
    async function GetGeneralConfigItems() {
        return Promise.all([
            createConfigCheckbox('Open dropdown on hover', AdvancedFlagging_1.ConfigurationOpenOnHover),
            createConfigCheckbox('Watch for manual flags', AdvancedFlagging_1.ConfigurationWatchFlags),
            createConfigCheckbox('Watch for queue responses', AdvancedFlagging_1.ConfigurationWatchQueues),
            createConfigCheckbox('Disable AdvancedFlagging link', AdvancedFlagging_1.ConfigurationLinkDisabled),
            createConfigCheckbox('Uncheck \'Comment\' by default', AdvancedFlagging_1.ConfigurationDefaultNoComment),
            createConfigCheckbox('Uncheck \'flag\' by default', AdvancedFlagging_1.ConfigurationDefaultNoFlag)
        ]);
    }
    async function GetFlagSettings() {
        const checkBoxes = [];
        const flagTypeIds = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(AdvancedFlagging_1.ConfigurationEnabledFlags) || [];
        const flagHTML = (id, name) => $('<div class="grid gs8 gsx w25">'
            + '  <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="' + id + '"></div>'
            + '  <label class="grid--cell s-label fw-normal" for="' + id + '">' + name + '</label>'
            + '</div>');
        getFlagTypes().forEach(f => {
            const configHTML = flagHTML('flag-type-' + f.Id, f.DisplayName);
            const storedValue = flagTypeIds.indexOf(f.Id) > -1;
            const checkBox = configHTML.find('input');
            if (storedValue) {
                checkBox.prop('checked', true);
            }
            checkBoxes.push({
                configHTML,
                checkBox,
                Id: f.Id
            });
        });
        const returnArr = checkBoxes.map(f => ({ element: f.configHTML }));
        returnArr.push({
            onSave: async () => {
                // Something here
                const updatedFlagTypes = checkBoxes.filter(cb => !!cb.checkBox.prop('checked')).map(cb => cb.Id);
                GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(AdvancedFlagging_1.ConfigurationEnabledFlags, updatedFlagTypes);
            },
            requiresReload: true
        });
        return returnArr;
    }
    async function GetAdminConfigItems() {
        return [
            {
                element: $('<a>').text('Clear expired items from cache').click(() => GreaseMonkeyCache_1.GreaseMonkeyCache.ClearExpiredKeys())
                    .wrap('<div class="grid--cell">').parent(),
                requiresReload: true
            },
            {
                element: $('<a>').text('Clear Metasmoke Configuration').click(async () => { await MetaSmokeAPI_1.MetaSmokeAPI.Reset(); })
                    .wrap('<div class="grid--cell">').parent(),
                requiresReload: true
            },
            {
                element: $('<a>').text('Get MetaSmoke key')
                    .attr('href', `https://metasmoke.erwaysoftware.com/oauth/request?key=${AdvancedFlagging_1.metaSmokeKey}`)
                    .wrap('<div class="grid--cell">').parent()
            },
            {
                element: $('<a>').text('Manually register MetaSmoke key')
                    .click(async () => {
                    const prompt = window.prompt('Enter metasmoke key');
                    if (prompt) {
                        GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(MetaSmokeAPI_1.MetaSmokeDisabledConfig, false);
                        localStorage.setItem('MetaSmoke.ManualKey', prompt);
                    }
                })
                    .wrap('<div class="grid--cell">').parent(),
                requiresReload: true
            }, {
                element: $('<a>').text('Clear chat FKey')
                    .click(async () => {
                    // Hard-code SOBotics for now
                    const roomId = 111347;
                    const fkeyCacheKey = `StackExchange.ChatApi.FKey_${roomId}`;
                    GreaseMonkeyCache_1.GreaseMonkeyCache.Unset(fkeyCacheKey);
                })
                    .wrap('<div class="grid--cell">').parent(),
                requiresReload: true
            }
        ];
    }
    async function createConfigCheckbox(text, configValue) {
        const optionId = text.toLowerCase().replace(/\s/g, '_');
        const configHTML = $('<div>'
            + '  <div class="grid gs8 gsx">'
            + '    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="' + optionId + '"/></div>'
            + '    <label class="grid--cell s-label fw-normal" for="' + optionId + '">' + text + '</label>'
            + '  </div>'
            + '</div>');
        const input = configHTML.find('input');
        const storedValue = GreaseMonkeyCache_1.GreaseMonkeyCache.GetFromCache(configValue);
        if (storedValue) {
            input.prop('checked', true);
        }
        return {
            element: configHTML,
            onSave: async () => {
                const isChecked = !!input.prop('checked');
                GreaseMonkeyCache_1.GreaseMonkeyCache.StoreInCache(configValue, isChecked);
            }
        };
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
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
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