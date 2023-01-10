// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      1.3.9
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
// @resource     iconCheckmark https://cdn.sstatic.net/Img/stacks-icons/Checkmark.svg
// @resource     iconClear https://cdn.sstatic.net/Img/stacks-icons/Clear.svg
// @resource     iconEyeOff https://cdn.sstatic.net/Img/stacks-icons/EyeOff.svg
// @resource     iconFlag https://cdn.sstatic.net/Img/stacks-icons/Flag.svg
// @resource     iconPencil https://cdn.sstatic.net/Img/stacks-icons/Pencil.svg
// @resource     iconTrash https://cdn.sstatic.net/Img/stacks-icons/Trash.svg
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
exports.createBotIcon = exports.upvoteSameComments = exports.displayToaster = exports.handleFlag = exports.handleActions = exports.getFlagToRaise = void 0;
const sotools_1 = __webpack_require__(1);
const Configuration_1 = __webpack_require__(4);
const popover_1 = __webpack_require__(39);
const review_1 = __webpack_require__(40);
const shared_1 = __webpack_require__(2);
const NattyApi_1 = __webpack_require__(43);
const GenericBotAPI_1 = __webpack_require__(44);
const MetaSmokeAPI_1 = __webpack_require__(7);
const CopyPastorAPI_1 = __webpack_require__(41);
const stacks_helpers_1 = __webpack_require__(8);
function setupStyles() {
    GM_addStyle(`
.advanced-flagging-popover {
    min-width: 10rem !important;
}

#advanced-flagging-comments-modal textarea {
    resize: vertical;
}

#advanced-flagging-snackbar {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}

.advanced-flagging-link:focus {
    outline: none;
}

.advanced-flagging-link li > a {
    padding-block: 4px;
}

.advanced-flagging-link li > .s-check-control {
    padding-inline: 6px;
    gap: 4px;
}

#advanced-flagging-comments-modal > .s-modal--dialog,
#advanced-flagging-configuration-modal > .s-modal--dialog {
    max-width: 90% !important;
}`);
}
const popupWrapper = document.createElement('div');
popupWrapper.classList.add('fc-white', 'fs-body3', 'ta-center', 'z-modal', 'ps-fixed', 'l50');
popupWrapper.id = 'advanced-flagging-snackbar';
document.body.append(popupWrapper);
function getFlagToRaise(flagName, qualifiesForVlq) {
    const vlqFlag = shared_1.FlagNames.VLQ;
    const naaFlag = shared_1.FlagNames.NAA;
    return flagName === vlqFlag
        ? (qualifiesForVlq ? vlqFlag : naaFlag)
        : flagName;
}
exports.getFlagToRaise = getFlagToRaise;
async function postComment(postId, fkey, comment) {
    const data = { fkey, comment };
    const url = `/posts/${postId}/comments`;
    if (shared_1.debugMode) {
        console.log('Post comment via', url, data);
        return;
    }
    const request = await fetch(url, {
        method: 'POST',
        body: (0, shared_1.getFormDataFromObject)(data)
    });
    const result = await request.text();
    const commentUI = StackExchange.comments.uiForPost($(`#comments-${postId}`));
    commentUI.addShow(true, false);
    commentUI.showComments(result, null, false, true);
    $(document).trigger('comment', postId);
}
function getErrorMessage({ Message }) {
    if (Message.includes('already flagged')) {
        return 'post already flagged';
    }
    else if (Message.includes('limit reached')) {
        return 'post flag limit reached';
    }
    else {
        return Message;
    }
}
async function flagPost(postId, fkey, flagName, flagged, flagText) {
    var _a;
    const failedToFlag = 'Failed to flag: ';
    const url = `/flags/posts/${postId}/add/${flagName}`;
    const data = { fkey, otherText: flagText || '' };
    if (shared_1.debugMode) {
        console.log(`Flag post as ${flagName} via`, url, data);
        return;
    }
    const flagPost = await fetch(url, {
        method: 'POST',
        body: (0, shared_1.getFormDataFromObject)(data)
    });
    const tooFast = /You may only flag a post every \d+ seconds?/;
    const responseText = await flagPost.text();
    if (tooFast.test(responseText)) {
        const rlCount = ((_a = /\d+/.exec(responseText)) === null || _a === void 0 ? void 0 : _a[0]) || 0;
        const pluralS = rlCount > 1 ? 's' : '';
        const message = `${failedToFlag}rate-limited for ${rlCount} second${pluralS}`;
        displayErrorFlagged(message, responseText);
        return;
    }
    const response = JSON.parse(responseText);
    if (response.Success) {
        displaySuccessFlagged(flagged, flagName);
    }
    else {
        const fullMessage = 'Failed to flag the post with outcome '
            + `${response.Outcome}: ${response.Message}.`;
        const message = getErrorMessage(response);
        displayErrorFlagged(failedToFlag + message, fullMessage);
    }
}
async function handleActions({ postId, element, flagged, raiseVlq }, { reportType, downvote }, flagRequired, downvoteRequired, flagText, commentText) {
    const fkey = StackExchange.options.user.fkey;
    if (commentText) {
        try {
            await postComment(postId, fkey, commentText);
        }
        catch (error) {
            displayToaster('Failed to comment on post', 'danger');
            console.error(error);
        }
    }
    if (flagRequired && reportType !== 'NoFlag') {
        autoFlagging = true;
        const flagName = getFlagToRaise(reportType, raiseVlq);
        try {
            await flagPost(postId, fkey, flagName, flagged, flagText);
        }
        catch (error) {
            displayErrorFlagged('Failed to flag post', error);
        }
    }
    const button = element.querySelector('.js-vote-down-btn');
    const hasDownvoted = button === null || button === void 0 ? void 0 : button.classList.contains('fc-theme-primary');
    if (!downvoteRequired || !downvote || hasDownvoted)
        return;
    if (shared_1.debugMode) {
        console.log('Downvote post by clicking', button);
        return;
    }
    button === null || button === void 0 ? void 0 : button.click();
}
exports.handleActions = handleActions;
async function handleFlag(flagType, reporters, post) {
    const { element } = post || {};
    let hasFailed = false;
    const allPromises = Object.values(reporters)
        .filter(({ name }) => {
        var _a;
        const sanitised = name.replace(/\s/g, '').toLowerCase();
        const input = element === null || element === void 0 ? void 0 : element.querySelector(`[id*="-send-feedback-to-${sanitised}-"]
            `);
        const sendFeedback = (_a = input === null || input === void 0 ? void 0 : input.checked) !== null && _a !== void 0 ? _a : true;
        return sendFeedback && flagType.feedbacks[name];
    })
        .map(reporter => {
        return reporter.sendFeedback(flagType.feedbacks[reporter.name])
            .then(message => {
            if (message) {
                displayToaster(message, 'success');
            }
        })
            .catch((promiseError) => {
            displayToaster(promiseError.message, 'danger');
            hasFailed = true;
        });
    });
    await Promise.allSettled(allPromises);
    return !hasFailed;
}
exports.handleFlag = handleFlag;
function displayToaster(text, state) {
    const element = document.createElement('div');
    element.classList.add('p12', `bg-${state}`);
    element.innerText = text;
    element.style.display = 'none';
    popupWrapper.append(element);
    $(element).fadeIn();
    window.setTimeout(() => {
        $(element).fadeOut('slow', () => element.remove());
    }, shared_1.popupDelay);
}
exports.displayToaster = displayToaster;
function displaySuccessFlagged(icon, reportType) {
    if (!reportType)
        return;
    const flaggedMessage = `Flagged ${(0, shared_1.getHumanFromDisplayName)(reportType)}`;
    (0, shared_1.attachPopover)(icon, flaggedMessage);
    $(icon).fadeIn();
    displayToaster(flaggedMessage, 'success');
}
function displayErrorFlagged(message, error) {
    displayToaster(message, 'danger');
    console.error(error);
}
function getStrippedComment(commentText) {
    return commentText
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
        .replace(/\[([^\]]+)\][^(]*?/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(' - From Review', '');
}
function upvoteSameComments(postNode, comment) {
    const strippedComment = getStrippedComment(comment);
    postNode
        .querySelectorAll('.comment-body .comment-copy')
        .forEach(element => {
        var _a;
        if (element.innerText !== strippedComment)
            return;
        const parent = element.closest('li');
        (_a = parent === null || parent === void 0 ? void 0 : parent.querySelector('a.comment-up.comment-up-off')) === null || _a === void 0 ? void 0 : _a.click();
    });
}
exports.upvoteSameComments = upvoteSameComments;
const botImages = {
    Natty: 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1',
    Smokey: 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1',
    'Generic Bot': 'https://i.stack.imgur.com/6DsXG.png?s=32&g=1',
    Guttenberg: 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1'
};
function createBotIcon(botName, href) {
    const iconWrapper = document.createElement('div');
    iconWrapper.classList.add('flex--item', 'd-inline-block');
    if (!shared_1.isQuestionPage && !shared_1.isLqpReviewPage) {
        iconWrapper.classList.add('ml8');
    }
    const iconLink = document.createElement('a');
    iconLink.classList.add('s-avatar', 's-avatar__16', 's-user-card--avatar');
    if (href) {
        iconLink.href = href;
        iconLink.target = '_blank';
    }
    (0, shared_1.attachPopover)(iconLink, `Reported by ${botName}`);
    iconWrapper.append(iconLink);
    const iconImage = document.createElement('img');
    iconImage.classList.add('s-avatar--image');
    iconImage.src = botImages[botName];
    iconLink.append(iconImage);
    return iconWrapper;
}
exports.createBotIcon = createBotIcon;
function buildFlaggingDialog(post, reporters) {
    const dropdown = document.createElement('div');
    dropdown.classList.add('s-popover', 's-anchors', 's-anchors__default', 'mt2', 'c-default', 'px0', 'py4', 'advanced-flagging-popover');
    const actionsMenu = (0, popover_1.makeMenu)(reporters, post);
    dropdown.append(actionsMenu);
    return dropdown;
}
function setPopoverOpening(advancedFlaggingLink, dropdown) {
    const openOnHover = shared_1.cachedConfiguration[shared_1.Cached.Configuration.openOnHover];
    if (openOnHover) {
        advancedFlaggingLink.addEventListener('mouseover', event => {
            event.stopPropagation();
            if (advancedFlaggingLink.isSameNode(event.target)) {
                $(dropdown).fadeIn('fast');
            }
        });
        advancedFlaggingLink.addEventListener('mouseleave', event => {
            event.stopPropagation();
            setTimeout(() => $(dropdown).fadeOut('fast'), 200);
        });
    }
    else {
        advancedFlaggingLink.addEventListener('click', event => {
            event.stopPropagation();
            if (advancedFlaggingLink.isSameNode(event.target)) {
                $(dropdown).fadeIn('fast');
            }
        });
        window.addEventListener('click', () => $(dropdown).fadeOut('fast'));
    }
}
function setFlagWatch({ postId, flagged }, reporters) {
    const watchFlags = shared_1.cachedConfiguration[shared_1.Cached.Configuration.watchFlags];
    (0, shared_1.addXHRListener)(xhr => {
        const { status, responseURL } = xhr;
        const flagNames = Object.values(shared_1.FlagNames).join('|');
        const regex = new RegExp(`/flags/posts/${postId}/add/(${flagNames})`);
        if (!watchFlags
            || autoFlagging
            || status !== 200
            || !regex.test(responseURL))
            return;
        const matches = regex.exec(responseURL);
        const flag = matches === null || matches === void 0 ? void 0 : matches[1];
        const flagType = shared_1.cachedFlagTypes
            .find(item => item.sendWhenFlagRaised && item.reportType === flag);
        if (!flagType)
            return;
        if (shared_1.debugMode) {
            console.log('Post', postId, 'manually flagged as', flag, flagType);
        }
        displaySuccessFlagged(flagged, flagType.reportType);
        void handleFlag(flagType, reporters);
    });
}
let autoFlagging = false;
function setupPostPage() {
    const linkDisabled = shared_1.cachedConfiguration[shared_1.Cached.Configuration.linkDisabled];
    if (linkDisabled || shared_1.isLqpReviewPage)
        return;
    (0, sotools_1.parseQuestionsAndAnswers)(post => {
        const { postId, postType, questionTime, answerTime, page, iconLocation, score, deleted, done, failed, flagged } = post;
        const reporters = {
            Smokey: new MetaSmokeAPI_1.MetaSmokeAPI(postId, postType, deleted)
        };
        if (postType === 'Answer' && shared_1.isStackOverflow) {
            reporters.Natty = new NattyApi_1.NattyAPI(postId, questionTime, answerTime, deleted);
            reporters.Guttenberg = new CopyPastorAPI_1.CopyPastorAPI(postId);
        }
        const icons = Object.values(reporters)
            .map(reporter => reporter.icon)
            .filter(Boolean);
        if (page !== 'Question') {
            iconLocation.after(...icons);
        }
        if (shared_1.isStackOverflow) {
            reporters['Generic Bot'] = new GenericBotAPI_1.GenericBotAPI(postId);
        }
        if (score === null)
            return;
        setFlagWatch(post, reporters);
        if (page !== 'Question')
            return;
        const advancedFlaggingLink = stacks_helpers_1.Buttons.makeStacksButton(`advanced-flagging-link-${postId}`, 'Advanced Flagging', {
            type: ['link'],
            classes: ['advanced-flagging-link']
        });
        const flexItem = document.createElement('div');
        flexItem.classList.add('flex--item');
        flexItem.append(advancedFlaggingLink);
        iconLocation.append(flexItem);
        const dropDown = buildFlaggingDialog(post, reporters);
        advancedFlaggingLink.append(dropDown);
        iconLocation.append(done, failed, flagged, ...icons);
        setPopoverOpening(advancedFlaggingLink, dropDown);
    });
}
function Setup() {
    void Promise.all([
        MetaSmokeAPI_1.MetaSmokeAPI.setup(),
        MetaSmokeAPI_1.MetaSmokeAPI.queryMetaSmokeInternal(),
        CopyPastorAPI_1.CopyPastorAPI.getAllCopyPastorIds(),
        NattyApi_1.NattyAPI.getAllNattyIds()
    ]).then(() => {
        setupPostPage();
        setupStyles();
        (0, Configuration_1.setupConfiguration)();
        (0, review_1.setupReview)();
        $(document).ajaxComplete(() => setupPostPage());
    });
}
Setup();


/***/ }),
/* 1 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getAllPostIds = exports.parseQuestionsAndAnswers = void 0;
const shared_1 = __webpack_require__(2);
const isNatoPage = location.href.includes('/tools/new-answers-old-questions');
const isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);
function getExistingElement() {
    if (!shared_1.isQuestionPage && !isNatoPage && !isFlagsPage)
        return;
    let elements;
    if (isNatoPage) {
        elements = document.querySelectorAll('.default-view-post-table > tbody > tr');
    }
    else if (isFlagsPage) {
        elements = document.querySelectorAll('.flagged-post');
    }
    else if (shared_1.isQuestionPage) {
        elements = document.querySelectorAll('.question, .answer');
    }
    else {
        elements = [];
    }
    return [...elements]
        .filter(element => !element.querySelector('.advanced-flagging-link'));
}
function getPage() {
    if (isFlagsPage)
        return 'Flags';
    else if (isNatoPage)
        return 'NATO';
    else if (shared_1.isQuestionPage)
        return 'Question';
    else
        return '';
}
function getPostType(element) {
    return element.classList.contains('question')
        || element.querySelector('.question-hyperlink')
        ? 'Question'
        : 'Answer';
}
function getPostId(postNode, postType) {
    var _a;
    const href = (_a = postNode.querySelector('.answer-hyperlink, .question-hyperlink')) === null || _a === void 0 ? void 0 : _a.href;
    const postIdString = (postNode.dataset.questionid
        || postNode.dataset.answerid) || (postType === 'Answer'
        ? href === null || href === void 0 ? void 0 : href.split('#')[1]
        : href === null || href === void 0 ? void 0 : href.split('/')[4]);
    return Number(postIdString);
}
function parseAuthorReputation(reputationDiv) {
    if (!reputationDiv)
        return 0;
    let reputationText = reputationDiv.innerText.replace(/,/g, '');
    if (!reputationText)
        return 0;
    if (reputationText.includes('k')) {
        reputationText = reputationText
            .replace(/\.\d/g, '')
            .replace(/k/, '');
        return Number(reputationText) * 1000;
    }
    else {
        return Number(reputationText);
    }
}
function getPostCreationDate(postNode, postType) {
    const post = postType === 'Question'
        ? document.querySelector('.question')
        : postNode;
    const dateElements = post === null || post === void 0 ? void 0 : post.querySelectorAll('.user-info .relativetime');
    const authorDateElement = Array.from(dateElements || []).pop();
    return new Date((authorDateElement === null || authorDateElement === void 0 ? void 0 : authorDateElement.title) || '');
}
function qualifiesForVlq(score, created) {
    const dayMillis = 1000 * 60 * 60 * 24;
    return (new Date().valueOf() - created.valueOf()) < dayMillis
        && score <= 0;
}
function getIcon(svg, classname) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex--item');
    wrapper.style.display = 'none';
    svg.classList.add(classname);
    wrapper.append(svg);
    return wrapper;
}
function getActionIcons() {
    return [
        ['Checkmark', 'fc-green-500'],
        ['Clear', 'fc-red-500'],
        ['Flag', 'fc-red-500']
    ]
        .map(([svg, classname]) => getIcon((0, shared_1.getSvg)(`icon${svg}`), classname));
}
function parseQuestionsAndAnswers(callback) {
    var _a;
    (_a = getExistingElement()) === null || _a === void 0 ? void 0 : _a.forEach(element => {
        var _a, _b;
        const postType = getPostType(element);
        const page = getPage();
        if (!page)
            return;
        const iconLocation = page === 'Question'
            ? (_a = element.querySelector('.js-post-menu')) === null || _a === void 0 ? void 0 : _a.firstElementChild
            : element.querySelector('a.question-hyperlink, a.answer-hyperlink');
        const postId = getPostId(element, postType);
        const questionTime = getPostCreationDate(element, 'Question');
        const answerTime = getPostCreationDate(element, 'Answer');
        const score = Number(element.dataset.score) || 0;
        const reputationEl = [...element.querySelectorAll('.user-info .reputation-score')].pop();
        const opReputation = parseAuthorReputation(reputationEl);
        const lastNameEl = [...document.querySelectorAll('.user-info .user-details a')].pop();
        const opName = ((_b = lastNameEl === null || lastNameEl === void 0 ? void 0 : lastNameEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || '';
        const deleted = element.classList.contains('deleted-answer');
        const raiseVlq = qualifiesForVlq(score, answerTime);
        const [done, failed, flagged] = getActionIcons();
        callback({
            postType,
            element,
            iconLocation: iconLocation,
            page,
            postId,
            questionTime,
            answerTime,
            score,
            opReputation,
            opName,
            deleted,
            raiseVlq,
            done,
            failed,
            flagged,
        });
    });
}
exports.parseQuestionsAndAnswers = parseQuestionsAndAnswers;
function getAllPostIds(includeQuestion, urlForm) {
    const elementToUse = getExistingElement();
    if (!elementToUse)
        return [];
    return elementToUse.map(item => {
        const postType = getPostType(item);
        if (!includeQuestion && postType === 'Question')
            return '';
        const postId = getPostId(item, postType);
        const type = postType === 'Answer' ? 'a' : 'questions';
        return urlForm
            ? `//${window.location.hostname}/${type}/${postId}`
            : postId;
    }).filter(String);
}
exports.getAllPostIds = getAllPostIds;


/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getHumanFromDisplayName = exports.getFlagTypeFromFlagId = exports.getFullFlag = exports.cachedCategories = exports.updateFlagTypes = exports.cachedFlagTypes = exports.debugMode = exports.updateConfiguration = exports.cachedConfiguration = exports.addXHRListener = exports.delay = exports.getSentMessage = exports.getCachedConfigBotKey = exports.getFormDataFromObject = exports.attachPopover = exports.displayStacksToast = exports.getSvg = exports.getIconPath = exports.Cached = exports.isLqpReviewPage = exports.isQuestionPage = exports.isStackOverflow = exports.popupDelay = exports.username = exports.FlagNames = exports.possibleFeedbacks = void 0;
const Store_1 = __webpack_require__(3);
exports.possibleFeedbacks = {
    Smokey: ['tpu-', 'tp-', 'fp-', 'naa-', ''],
    Natty: ['tp', 'fp', 'ne', ''],
    Guttenberg: ['tp', 'fp', ''],
    'Generic Bot': ['track', '']
};
var FlagNames;
(function (FlagNames) {
    FlagNames["Spam"] = "PostSpam";
    FlagNames["Rude"] = "PostOffensive";
    FlagNames["NAA"] = "AnswerNotAnAnswer";
    FlagNames["VLQ"] = "PostLowQuality";
    FlagNames["ModFlag"] = "PostOther";
    FlagNames["NoFlag"] = "NoFlag";
})(FlagNames = exports.FlagNames || (exports.FlagNames = {}));
exports.username = ((_a = document.querySelector('a[href^="/users/"] div[title]')) === null || _a === void 0 ? void 0 : _a.title) || '';
exports.popupDelay = 4 * 1000;
exports.isStackOverflow = /^https:\/\/stackoverflow.com/.test(location.href);
exports.isQuestionPage = /\/questions\/\d+.*/.test(location.href);
exports.isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(location.href);
exports.Cached = {
    Configuration: {
        key: 'Configuration',
        openOnHover: 'openOnHover',
        defaultNoFlag: 'defaultNoFlag',
        defaultNoComment: 'defaultNoComment',
        defaultNoDownvote: 'defaultNoDownvote',
        watchFlags: 'watchFlags',
        watchQueues: 'watchQueues',
        linkDisabled: 'linkDisabled',
        addAuthorName: 'addAuthorName',
        debug: 'debug',
    },
    Fkey: 'fkey',
    Metasmoke: {
        userKey: 'MetaSmoke.userKey',
        disabled: 'MetaSmoke.disabled'
    },
    FlagTypes: 'FlagTypes',
    FlagCategories: 'FlagCategories'
};
const getIconPath = (name) => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, 'text/html');
    const path = parsed.body.querySelector('path');
    return path.getAttribute('d') || '';
};
exports.getIconPath = getIconPath;
const getSvg = (name) => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, 'text/html');
    return parsed.body.firstElementChild;
};
exports.getSvg = getSvg;
function displayStacksToast(message, type, dismissable) {
    StackExchange.helpers.showToast(message, {
        type: type,
        transientTimeout: exports.popupDelay,
        dismissable,
    });
}
exports.displayStacksToast = displayStacksToast;
function attachPopover(element, text, position = 'bottom-start') {
    Stacks.setTooltipText(element, text, { placement: position });
}
exports.attachPopover = attachPopover;
function getFormDataFromObject(object) {
    return Object
        .keys(object)
        .reduce((formData, key) => {
        formData.append(key, object[key]);
        return formData;
    }, new FormData());
}
exports.getFormDataFromObject = getFormDataFromObject;
const getCachedConfigBotKey = (botName) => {
    const sanitised = botName.replace(/\s/g, '');
    return `defaultNo${sanitised}`;
};
exports.getCachedConfigBotKey = getCachedConfigBotKey;
function getSentMessage(success, feedback, bot) {
    return success
        ? `Feedback ${feedback} sent to ${bot}`
        : `Failed to send feedback ${feedback} to ${bot}`;
}
exports.getSentMessage = getSentMessage;
async function delay(milliseconds) {
    return await new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.delay = delay;
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
exports.cachedConfiguration = Store_1.Store.get(exports.Cached.Configuration.key)
    || {};
const updateConfiguration = () => Store_1.Store.set(exports.Cached.Configuration.key, exports.cachedConfiguration);
exports.updateConfiguration = updateConfiguration;
exports.debugMode = exports.cachedConfiguration[exports.Cached.Configuration.debug];
exports.cachedFlagTypes = Store_1.Store.get(exports.Cached.FlagTypes) || [];
const updateFlagTypes = () => Store_1.Store.set(exports.Cached.FlagTypes, exports.cachedFlagTypes);
exports.updateFlagTypes = updateFlagTypes;
exports.cachedCategories = Store_1.Store.get(exports.Cached.FlagCategories)
    || [];
function getFullFlag(flagType, target, postId) {
    const placeholderTarget = /\$TARGET\$/g;
    const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
    const content = flagType.flagText;
    if (!content)
        return null;
    const copypastorLink = `https://copypastor.sobotics.org/posts/${postId}`;
    return content
        .replace(placeholderTarget, target)
        .replace(placeholderCopypastorLink, copypastorLink);
}
exports.getFullFlag = getFullFlag;
function getFlagTypeFromFlagId(flagId) {
    return exports.cachedFlagTypes.find(({ id }) => id === flagId) || null;
}
exports.getFlagTypeFromFlagId = getFlagTypeFromFlagId;
function getHumanFromDisplayName(displayName) {
    const flags = {
        [FlagNames.Spam]: 'as spam',
        [FlagNames.Rude]: 'as R/A',
        [FlagNames.NAA]: 'as NAA',
        [FlagNames.VLQ]: 'as VLQ',
        [FlagNames.ModFlag]: 'for moderator attention',
        [FlagNames.NoFlag]: ''
    };
    return flags[displayName] || '';
}
exports.getHumanFromDisplayName = getHumanFromDisplayName;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Store = void 0;
class Store {
    static async getAndCache(cacheKey, getterPromise, expiresAt) {
        const cachedItem = Store.get(cacheKey);
        if (cachedItem)
            return cachedItem;
        const result = await getterPromise();
        Store.set(cacheKey, result, expiresAt);
        return result;
    }
    static get(cacheKey) {
        const cachedItem = GM_getValue(cacheKey);
        if (!cachedItem)
            return null;
        const isItemExpired = typeof cachedItem === 'object'
            && 'Data' in cachedItem
            && new Date(cachedItem.Expires) < new Date();
        if (isItemExpired)
            return null;
        return typeof cachedItem === 'object' && 'Data' in cachedItem
            ? cachedItem.Data
            : cachedItem;
    }
    static set(cacheKey, item, expiresAt) {
        const jsonObject = expiresAt
            ? { Expires: expiresAt, Data: item }
            : item;
        GM_setValue(cacheKey, jsonObject);
    }
    static unset(cacheKey) {
        GM_deleteValue(cacheKey);
    }
}
exports.Store = Store;


/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupConfiguration = exports.cacheFlags = exports.wrapInFlexItem = exports.isModOrNoFlag = void 0;
const FlagTypes_1 = __webpack_require__(5);
const Store_1 = __webpack_require__(3);
const shared_1 = __webpack_require__(2);
const config_1 = __webpack_require__(6);
const main_1 = __webpack_require__(36);
function isModOrNoFlag(flagName) {
    const result = [
        shared_1.FlagNames.NoFlag,
        shared_1.FlagNames.ModFlag
    ]
        .some(reportType => reportType === flagName);
    return result;
}
exports.isModOrNoFlag = isModOrNoFlag;
function wrapInFlexItem(element) {
    const flexItem = document.createElement('div');
    flexItem.classList.add('flex--item');
    flexItem.append(element);
    return flexItem;
}
exports.wrapInFlexItem = wrapInFlexItem;
function cacheFlags() {
    const flagTypesToCache = FlagTypes_1.flagCategories.flatMap(category => {
        return category.FlagTypes.map(flagType => {
            return Object.assign(flagType, {
                belongsTo: category.name,
                downvote: !isModOrNoFlag(flagType.reportType),
                enabled: true
            });
        });
    });
    Store_1.Store.set(shared_1.Cached.FlagTypes, flagTypesToCache);
    shared_1.cachedFlagTypes.push(...flagTypesToCache);
}
exports.cacheFlags = cacheFlags;
function cacheCategories() {
    const categories = FlagTypes_1.flagCategories
        .map(category => ({
        isDangerous: category.isDangerous,
        name: category.name,
        appliesTo: category.appliesTo
    }));
    Store_1.Store.set(shared_1.Cached.FlagCategories, categories);
    shared_1.cachedCategories.push(...categories);
}
function setupDefaults() {
    if (!shared_1.cachedFlagTypes.length
        || !('downvote' in shared_1.cachedFlagTypes[0])) {
        cacheFlags();
    }
    if (!shared_1.cachedCategories.length
        || !('appliesTo' in shared_1.cachedCategories[0])) {
        cacheCategories();
    }
}
function setupConfiguration() {
    setupDefaults();
    (0, config_1.buildConfigurationOverlay)();
    (0, main_1.setupCommentsAndFlagsModal)();
    const configModal = document.querySelector('#advanced-flagging-configuration-modal');
    const commentsModal = document.querySelector('#advanced-flagging-comments-modal');
    const bottomBox = document.querySelector('.site-footer--copyright > ul.-list');
    const configDiv = document.createElement('div');
    configDiv.classList.add('ta-left', 'pt6');
    const configLink = document.createElement('a');
    configLink.innerText = 'AdvancedFlagging configuration';
    configLink.addEventListener('click', () => Stacks.showModal(configModal));
    configDiv.append(configLink);
    const commentsDiv = configDiv.cloneNode();
    const commentsLink = document.createElement('a');
    commentsLink.innerText = 'AdvancedFlagging: edit comments and flags';
    commentsLink.addEventListener('click', () => Stacks.showModal(commentsModal));
    commentsDiv.append(commentsLink);
    bottomBox === null || bottomBox === void 0 ? void 0 : bottomBox.after(configDiv, commentsDiv);
    const propertyDoesNotExist = !Object.prototype.hasOwnProperty.call(shared_1.cachedConfiguration, shared_1.Cached.Configuration.addAuthorName);
    if (propertyDoesNotExist) {
        (0, shared_1.displayStacksToast)('Please set up AdvancedFlagging before continuing.', 'info', true);
        setTimeout(() => {
            Stacks.showModal(configModal);
            const checkbox = document.querySelector('#advanced-flagging-defaultNoDownvote');
            checkbox.checked = true;
        });
    }
}
exports.setupConfiguration = setupConfiguration;


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.flagCategories = void 0;
const shared_1 = __webpack_require__(2);
const deletedAnswers = '/help/deleted-answers';
const commentHelp = '/help/privileges/comment';
const reputationHelp = '/help/whats-reputation';
const voteUpHelp = '/help/privileges/vote-up';
const whyVote = '/help/why-vote';
const setBounties = '/help/privileges/set-bounties';
const flagPosts = '/help/privileges/flag-posts';
exports.flagCategories = [
    {
        isDangerous: true,
        name: 'Red flags',
        appliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                id: 1,
                displayName: 'Spam',
                reportType: shared_1.FlagNames.Spam,
                feedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            },
            {
                id: 2,
                displayName: 'Rude or Abusive',
                reportType: shared_1.FlagNames.Rude,
                feedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            }
        ]
    },
    {
        isDangerous: true,
        name: 'Guttenberg mod flags',
        appliesTo: ['Answer'],
        FlagTypes: [
            {
                id: 3,
                displayName: 'Plagiarism',
                reportType: shared_1.FlagNames.ModFlag,
                flagText: 'Possible plagiarism of another answer $TARGET$, as can be seen here $COPYPASTOR$',
                feedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 4,
                displayName: 'Duplicate answer',
                reportType: shared_1.FlagNames.ModFlag,
                flagText: 'The answer is a repost of their other answer $TARGET$, but as there are slight differences '
                    + '(see $COPYPASTOR$), an auto flag would not be raised.',
                comments: {
                    low: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227)."
                        + ' Answer the best one and flag the rest as duplicates, once you earn enough reputation. '
                        + 'If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                },
                feedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 5,
                displayName: 'Bad attribution',
                reportType: shared_1.FlagNames.ModFlag,
                flagText: 'This post is copied from [another answer]($TARGET$), as can be seen here $COPYPASTOR$. The author '
                    + 'only added a link to the other answer, which is [not the proper way of attribution]'
                    + '(//stackoverflow.blog/2009/06/25/attribution-required).',
                feedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            }
        ]
    },
    {
        isDangerous: false,
        name: 'Answer-related',
        appliesTo: ['Answer'],
        FlagTypes: [
            {
                id: 6,
                displayName: 'Link Only',
                reportType: shared_1.FlagNames.VLQ,
                comments: {
                    low: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
                        + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
                        + 'have some idea what it is and why it is there, then quote the most relevant part of the page '
                        + 'you are linking to in case the target page is unavailable. '
                        + `[Answers that are little more than a link may be deleted.](${deletedAnswers})`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            },
            {
                id: 7,
                displayName: 'Not an answer',
                reportType: shared_1.FlagNames.NAA,
                comments: {
                    low: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
                        + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
                        + 'If you have a related but different question, [ask a new question](/questions/ask), and include a '
                        + 'link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
                    high: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to '
                        + 'be an explicit attempt to *answer* this question; if you have a critique or need a clarification '
                        + `of the question or another answer, you can [post a comment](${commentHelp}) (like this `
                        + 'one) directly below it. Please remove this answer and create either a comment or a new question. '
                        + 'See: [Ask questions, get answers, no distractions](/tour).',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            },
            {
                id: 8,
                displayName: 'Thanks',
                reportType: shared_1.FlagNames.NAA,
                comments: {
                    low: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, and '
                        + 'can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) '
                        + `enough [reputation](${reputationHelp}), you will gain privileges to `
                        + `[upvote answers](${voteUpHelp}) you like. This way future visitors of the question `
                        + 'will see a higher vote count on that answer, and the answerer will also be rewarded with '
                        + `reputation points. See [Why is voting important](${whyVote}).`,
                    high: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
                        + 'and can be perceived as noise by its future visitors. Instead, '
                        + `[upvote answers](${voteUpHelp}) you like. This way future visitors of the question `
                        + 'will see a higher vote count on that answer, and the answerer will also be rewarded '
                        + `with reputation points. See [Why is voting important](${whyVote}).`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 9,
                displayName: 'Me too',
                reportType: shared_1.FlagNames.NAA,
                comments: {
                    low: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
                        + 'If you have a different but related question, then [ask](/questions/ask) it (reference this one '
                        + 'if it will help provide context). If you are interested in this specific question, you can '
                        + `[upvote](${voteUpHelp}) it, leave a [comment](${commentHelp}), or start a `
                        + `[bounty](${setBounties}) once you have enough [reputation](${reputationHelp}).`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 10,
                displayName: 'Library',
                reportType: shared_1.FlagNames.VLQ,
                comments: {
                    low: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
                        + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 11,
                displayName: 'Comment',
                reportType: shared_1.FlagNames.NAA,
                comments: {
                    low: 'This does not provide an answer to the question. Once you have sufficient '
                        + `[reputation](${reputationHelp}) you will be able to [comment on any post](${commentHelp}); instead, `
                        + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
                    high: 'This does not provide an answer to the question. Please write a comment instead.',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 12,
                displayName: 'Duplicate',
                reportType: shared_1.FlagNames.NAA,
                comments: {
                    low: 'Instead of posting an answer which merely links to another answer, please instead '
                        + `[flag the question](${flagPosts}) as a duplicate.`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 13,
                displayName: 'Non English',
                reportType: shared_1.FlagNames.VLQ,
                comments: {
                    low: 'Please write your answer in English, as Stack Overflow is an '
                        + '[English-only site](//meta.stackoverflow.com/a/297680).',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 14,
                displayName: 'Should be an edit',
                reportType: shared_1.FlagNames.NAA,
                comments: {
                    low: 'Please use the edit link on your question to add additional information. '
                        + 'The "Post Answer" button should be used only for complete answers to the question.',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            }
        ]
    },
    {
        isDangerous: false,
        name: 'General',
        appliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                id: 15,
                displayName: 'Looks Fine',
                reportType: shared_1.FlagNames.NoFlag,
                feedbacks: { Smokey: 'fp-', Natty: 'fp', Guttenberg: 'fp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 16,
                displayName: 'Needs Editing',
                reportType: shared_1.FlagNames.NoFlag,
                feedbacks: { Smokey: 'fp-', Natty: 'ne', Guttenberg: 'fp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 17,
                displayName: 'Vandalism',
                reportType: shared_1.FlagNames.NoFlag,
                feedbacks: { Smokey: 'tp-', Natty: '', Guttenberg: 'fp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            }
        ]
    }
];


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildConfigurationOverlay = void 0;
const Store_1 = __webpack_require__(3);
const MetaSmokeAPI_1 = __webpack_require__(7);
const shared_1 = __webpack_require__(2);
const stacks_helpers_1 = __webpack_require__(8);
function saveChanges() {
    document
        .querySelectorAll('#advanced-flagging-configuration-section-general > div > input')
        .forEach(element => {
        const id = element.id.split('-').pop();
        const checked = element.checked;
        shared_1.cachedConfiguration[id] = checked;
    });
    (0, shared_1.updateConfiguration)();
    (0, shared_1.displayStacksToast)('Configuration saved', 'success');
    setTimeout(() => window.location.reload(), 500);
}
function resetConfig() {
    Store_1.Store.unset(shared_1.Cached.Configuration.key);
    (0, shared_1.displayStacksToast)('Configuration settings have been reset to defaults', 'success');
    setTimeout(() => window.location.reload(), 500);
}
function buildConfigurationOverlay() {
    var _a;
    const modal = stacks_helpers_1.Modals.makeStacksModal('advanced-flagging-configuration-modal', {
        title: {
            text: 'AdvancedFlagging configuration',
        },
        body: {
            bodyHtml: getConfigModalBody()
        },
        footer: {
            buttons: [
                {
                    element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-configuration-modal-save', 'Save changes', {
                        primary: true,
                        click: {
                            handler: event => {
                                event.preventDefault();
                                saveChanges();
                            }
                        }
                    }),
                },
                {
                    element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-configuration-modal-cancel', 'Cancel'),
                    hideOnClick: true
                },
                {
                    element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-configuration-modal-reset', 'Reset', {
                        type: ['danger'],
                        click: {
                            handler: resetConfig
                        }
                    })
                }
            ]
        },
        fullscreen: true
    });
    (_a = modal.firstElementChild) === null || _a === void 0 ? void 0 : _a.classList.add('w60');
    document.body.append(modal);
    const resetButton = document.querySelector('.s-btn__danger');
    (0, shared_1.attachPopover)(resetButton, 'Resets config values to defaults. You will be prompted to reconfigure the script.', 'right');
}
exports.buildConfigurationOverlay = buildConfigurationOverlay;
function getGeneralConfigItems() {
    const checkboxes = [
        {
            text: 'Open dropdown on hover',
            configValue: shared_1.Cached.Configuration.openOnHover,
            tooltipText: 'Open the dropdown on hover and not on click'
        },
        {
            text: 'Watch for manual flags',
            configValue: shared_1.Cached.Configuration.watchFlags,
            tooltipText: 'Send feedback when a flag is raised manually'
        },
        {
            text: 'Watch for queue responses',
            configValue: shared_1.Cached.Configuration.watchQueues,
            tooltipText: 'Send feedback after a Looks OK or Recommend '
                + 'Deletion review in the Low Quality Answers queue'
        },
        {
            text: 'Disable AdvancedFlagging link',
            configValue: shared_1.Cached.Configuration.linkDisabled
        },
        {
            text: 'Uncheck \'Leave comment\' by default',
            configValue: shared_1.Cached.Configuration.defaultNoComment
        },
        {
            text: 'Uncheck \'Flag\' by default',
            configValue: shared_1.Cached.Configuration.defaultNoFlag
        },
        {
            text: 'Uncheck \'Downvote\' by default',
            configValue: shared_1.Cached.Configuration.defaultNoDownvote
        },
        {
            text: 'Add author\'s name before comments',
            configValue: shared_1.Cached.Configuration.addAuthorName,
            tooltipText: 'Add the author\'s name before every comment to make them friendlier'
        },
        {
            text: 'Don\'t send feedback to Smokey by default',
            configValue: (0, shared_1.getCachedConfigBotKey)('Smokey')
        },
        {
            text: 'Don\'t send feedback to Natty by default',
            configValue: (0, shared_1.getCachedConfigBotKey)('Natty')
        },
        {
            text: 'Don\'t send feedback to Guttenberg by default',
            configValue: (0, shared_1.getCachedConfigBotKey)('Guttenberg')
        },
        {
            text: 'Don\'t send feedback to Generic Bot by default',
            configValue: (0, shared_1.getCachedConfigBotKey)('Generic Bot')
        },
        {
            text: 'Enable debug mode',
            configValue: shared_1.Cached.Configuration.debug
        }
    ].map(({ text, configValue, tooltipText }) => {
        const selected = shared_1.cachedConfiguration[configValue];
        return {
            id: `advanced-flagging-${configValue}`,
            labelConfig: {
                text,
                description: tooltipText,
            },
            selected
        };
    });
    const [fieldset] = stacks_helpers_1.Checkbox.makeStacksCheckboxes(checkboxes);
    fieldset.id = 'advanced-flagging-configuration-section-general';
    return fieldset;
}
function getAdminConfigItems() {
    const section = document.createElement('fieldset');
    section.id = 'advanced-flagging-configuration-section-admin';
    section.classList.add('d-flex', 'g8', 'fd-column', 'fs-body2');
    const header = document.createElement('h2');
    header.innerText = 'Admin';
    header.classList.add('flex--item');
    const msInfoDiv = document.createElement('div');
    msInfoDiv.classList.add('flex--item');
    const clearMsInfo = document.createElement('a');
    clearMsInfo.innerText = 'Clear metasmoke configuration';
    clearMsInfo.addEventListener('click', () => {
        MetaSmokeAPI_1.MetaSmokeAPI.reset();
        (0, shared_1.displayStacksToast)('Successfully cleared MS configuration.', 'success', true);
    });
    const clearFkeyDiv = document.createElement('div');
    clearFkeyDiv.classList.add('flex--item');
    const clearChatFkey = document.createElement('a');
    clearChatFkey.innerText = 'Clear chat fkey';
    clearChatFkey.addEventListener('click', () => {
        Store_1.Store.unset(shared_1.Cached.Fkey);
        (0, shared_1.displayStacksToast)('Successfully cleared chat fkey.', 'success', true);
    });
    msInfoDiv.append(clearMsInfo);
    clearFkeyDiv.append(clearChatFkey);
    section.append(msInfoDiv, clearFkeyDiv);
    const chatFkey = Store_1.Store.get(shared_1.Cached.Fkey);
    const msAccessTokenText = MetaSmokeAPI_1.MetaSmokeAPI.accessToken
        ? `token: ${MetaSmokeAPI_1.MetaSmokeAPI.accessToken.substring(0, 32)}...`
        : 'no access token found in storage';
    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = 'This will clear the chat fkey. It will be regenerated '
        + 'the next time feedback is sent to Natty '
        + `(${chatFkey ? `fkey: ${chatFkey}` : 'fkey is not stored in cache'})`;
    (0, shared_1.attachPopover)(clearMsInfo, metasmokeTooltip, 'right');
    (0, shared_1.attachPopover)(clearChatFkey, fkeyClearTooltip, 'right');
    return section;
}
function getConfigModalBody() {
    const div = document.createElement('div');
    const divider = document.createElement('hr');
    divider.classList.add('my16');
    const general = document.createElement('h2');
    general.innerText = 'General';
    const admin = document.createElement('h2');
    admin.innerText = 'Admin';
    div.append(general, getGeneralConfigItems(), divider, admin, getAdminConfigItems());
    return div;
}


/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetaSmokeAPI = void 0;
const Store_1 = __webpack_require__(3);
const shared_1 = __webpack_require__(2);
const sotools_1 = __webpack_require__(1);
const stacks_helpers_1 = __webpack_require__(8);
const AdvancedFlagging_1 = __webpack_require__(0);
const metasmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
const metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
const metasmokeReportedMessage = 'Post reported to Smokey';
const metasmokeFailureMessage = 'Failed to report post to Smokey';
class MetaSmokeAPI {
    constructor(postId, postType, deleted) {
        this.postId = postId;
        this.postType = postType;
        this.deleted = deleted;
        this.name = 'Smokey';
        this.icon = this.getIcon();
    }
    static reset() {
        Store_1.Store.unset(shared_1.Cached.Metasmoke.disabled);
        Store_1.Store.unset(shared_1.Cached.Metasmoke.userKey);
    }
    static async setup() {
        MetaSmokeAPI.accessToken = await MetaSmokeAPI.getUserKey();
    }
    static getMetasmokeTokenPopup() {
        const codeInput = stacks_helpers_1.Input.makeStacksInput('advanced-flagging-metasmoke-token-input', { placeholder: 'Enter the code here', }, {
            text: 'Metasmoke access token',
            description: 'Once you\'ve authenticated Advanced Flagging with '
                + 'metasmoke, you\'ll be given a code; enter it below:'
        });
        const authModal = stacks_helpers_1.Modals.makeStacksModal('advanced-flagging-metasmoke-token-modal', {
            title: {
                text: 'Authenticate MS with AF'
            },
            body: {
                bodyHtml: codeInput
            },
            footer: {
                buttons: [
                    {
                        element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-submit-code', 'Submit', { primary: true })
                    },
                    {
                        element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-dismiss-code-modal', 'Cancel'),
                        hideOnClick: true
                    }
                ]
            }
        });
        return authModal;
    }
    static showMSTokenPopupAndGet() {
        return new Promise(resolve => {
            var _a;
            const popup = this.getMetasmokeTokenPopup();
            StackExchange.helpers.showModal(popup);
            (_a = popup
                .querySelector('.s-btn__primary')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
                const input = popup.querySelector('input');
                const token = input === null || input === void 0 ? void 0 : input.value;
                popup.remove();
                if (!token)
                    return;
                resolve(token.toString());
            });
        });
    }
    static async codeGetter(metaSmokeOAuthUrl) {
        if (MetaSmokeAPI.isDisabled)
            return;
        const authenticate = await StackExchange.helpers.showConfirmModal({
            title: 'Setting up metasmoke',
            bodyHtml: 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
                + 'To reset configuration, see the footer of Stack Overflow.',
            buttonLabel: 'Authenticate!'
        });
        if (!authenticate) {
            Store_1.Store.set(shared_1.Cached.Metasmoke.disabled, true);
            return;
        }
        window.open(metaSmokeOAuthUrl, '_blank');
        await (0, shared_1.delay)(100);
        return await this.showMSTokenPopupAndGet();
    }
    static async queryMetaSmokeInternal() {
        if (MetaSmokeAPI.isDisabled)
            return;
        const urlString = (0, sotools_1.getAllPostIds)(true, true).join(',');
        if (!urlString)
            return;
        const parameters = Object.entries({
            urls: urlString,
            key: MetaSmokeAPI.appKey,
            per_page: 1000,
            filter: metasmokeApiFilter
        })
            .map(item => item.join('='))
            .join('&');
        try {
            const url = `https://metasmoke.erwaysoftware.com/api/v2.0/posts/urls?${parameters}`;
            const call = await fetch(url);
            const result = await call.json();
            result.items.forEach(({ link, id }) => {
                var _a;
                const postId = Number((_a = /\d+$/.exec(link)) === null || _a === void 0 ? void 0 : _a[0]);
                if (!postId)
                    return;
                MetaSmokeAPI.metasmokeIds[postId] = id;
            });
        }
        catch (error) {
            (0, AdvancedFlagging_1.displayToaster)('Failed to get Metasmoke URLs.', 'danger');
            console.error(error);
        }
    }
    static getQueryUrl(postId, postType) {
        const path = postType === 'Answer' ? 'a' : 'questions';
        return `//${window.location.hostname}/${path}/${postId}`;
    }
    static async getUserKey() {
        while (typeof StackExchange.helpers.showConfirmModal === 'undefined') {
            await (0, shared_1.delay)(100);
        }
        const { appKey } = MetaSmokeAPI;
        const url = `https://metasmoke.erwaysoftware.com/oauth/request?key=${appKey}`;
        return await Store_1.Store.getAndCache(shared_1.Cached.Metasmoke.userKey, async () => {
            const code = await MetaSmokeAPI.codeGetter(url);
            if (!code)
                return '';
            const tokenUrl = `//metasmoke.erwaysoftware.com/oauth/token?key=${appKey}&code=${code}`;
            const tokenCall = await fetch(tokenUrl);
            const { token } = await tokenCall.json();
            return token;
        });
    }
    getSmokeyId() {
        return MetaSmokeAPI.metasmokeIds[this.postId] || 0;
    }
    async reportRedFlag() {
        const smokeyId = this.getSmokeyId();
        const urlString = MetaSmokeAPI.getQueryUrl(this.postId, this.postType);
        const { appKey, accessToken } = MetaSmokeAPI;
        const url = 'https://metasmoke.erwaysoftware.com/api/w/post/report';
        const data = {
            post_link: urlString,
            key: appKey,
            token: accessToken
        };
        if (shared_1.debugMode) {
            console.log('Report post via', url, data);
            throw new Error('Didn\'t report post: in debug mode');
        }
        const reportRequest = await fetch(url, {
            method: 'POST',
            body: (0, shared_1.getFormDataFromObject)(data)
        });
        const requestResponse = await reportRequest.text();
        if (!reportRequest.ok || requestResponse !== 'OK') {
            console.error(`Failed to report post ${smokeyId} to Smokey`, requestResponse);
            throw new Error(metasmokeFailureMessage);
        }
        return metasmokeReportedMessage;
    }
    async sendFeedback(feedback) {
        if (MetaSmokeAPI.isDisabled)
            return '';
        const { appKey, accessToken } = MetaSmokeAPI;
        const smokeyId = this.getSmokeyId();
        if (!smokeyId && feedback === 'tpu-' && !this.deleted) {
            return await this.reportRedFlag();
        }
        else if (!accessToken || !smokeyId) {
            return '';
        }
        const data = {
            type: feedback,
            key: appKey,
            token: accessToken
        };
        const url = `//metasmoke.erwaysoftware.com/api/w/post/${smokeyId}/feedback`;
        if (shared_1.debugMode) {
            console.log('Feedback to Smokey via', url, data);
            throw new Error('Didn\'t send feedback: debug mode');
        }
        const feedbackRequest = await fetch(url, {
            method: 'POST',
            body: (0, shared_1.getFormDataFromObject)(data)
        });
        const feedbackResponse = await feedbackRequest.json();
        if (!feedbackRequest.ok) {
            console.error(`Failed to send feedback for ${smokeyId} to Smokey`, feedbackResponse);
            throw new Error((0, shared_1.getSentMessage)(false, feedback, this.name));
        }
        return (0, shared_1.getSentMessage)(true, feedback, this.name);
    }
    getIcon() {
        const smokeyId = this.getSmokeyId();
        if (!smokeyId)
            return;
        const icon = (0, AdvancedFlagging_1.createBotIcon)('Smokey', `//metasmoke.erwaysoftware.com/post/${smokeyId}`);
        return icon;
    }
}
exports.MetaSmokeAPI = MetaSmokeAPI;
MetaSmokeAPI.isDisabled = Store_1.Store.get(shared_1.Cached.Metasmoke.disabled) || false;
MetaSmokeAPI.appKey = metasmokeKey;
MetaSmokeAPI.metasmokeIds = {};


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Notifications = exports.Modals = exports.Icons = exports.Buttons = exports.UserCard = exports.Toggle = exports.Textarea = exports.Tag = exports.Spinner = exports.Select = exports.Radio = exports.Popover = exports.Progress = exports.Pagination = exports.Notice = exports.Navigation = exports.Menu = exports.Links = exports.Label = exports.Input = exports.Indicator = exports.Checkbox = exports.ButtonGroup = exports.Breadcrumb = exports.Banners = exports.Badges = exports.Avatar = void 0;
const Avatar = __webpack_require__(9);
exports.Avatar = Avatar;
const Badges = __webpack_require__(10);
exports.Badges = Badges;
const Banners = __webpack_require__(11);
exports.Banners = Banners;
const Breadcrumb = __webpack_require__(12);
exports.Breadcrumb = Breadcrumb;
const ButtonGroup = __webpack_require__(13);
exports.ButtonGroup = ButtonGroup;
const Checkbox = __webpack_require__(14);
exports.Checkbox = Checkbox;
const Indicator = __webpack_require__(15);
exports.Indicator = Indicator;
const Input = __webpack_require__(16);
exports.Input = Input;
const Label = __webpack_require__(17);
exports.Label = Label;
const Links = __webpack_require__(18);
exports.Links = Links;
const Menu = __webpack_require__(19);
exports.Menu = Menu;
const Navigation = __webpack_require__(20);
exports.Navigation = Navigation;
const Notice = __webpack_require__(21);
exports.Notice = Notice;
const Pagination = __webpack_require__(22);
exports.Pagination = Pagination;
const Progress = __webpack_require__(23);
exports.Progress = Progress;
const Popover = __webpack_require__(24);
exports.Popover = Popover;
const Radio = __webpack_require__(25);
exports.Radio = Radio;
const Select = __webpack_require__(26);
exports.Select = Select;
const Spinner = __webpack_require__(27);
exports.Spinner = Spinner;
const Tag = __webpack_require__(28);
exports.Tag = Tag;
const Textarea = __webpack_require__(29);
exports.Textarea = Textarea;
const Toggle = __webpack_require__(30);
exports.Toggle = Toggle;
const UserCard = __webpack_require__(31);
exports.UserCard = UserCard;
const Buttons = __webpack_require__(32);
exports.Buttons = Buttons;
const Icons = __webpack_require__(33);
exports.Icons = Icons;
const Modals = __webpack_require__(34);
exports.Modals = Modals;
const Notifications = __webpack_require__(35);
exports.Notifications = Notifications;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeAvatar = void 0;
/**
 * @see https://stackoverflow.design/product/components/avatar/
 *
 * @summary creates a Stacks avatar
 * @param {StacksAvatarOptions} options configuration
 * @returns {HTMLAnchorElement}
 */
const makeAvatar = (options = {}, elementType = "a") => {
    const { size = "", href = "", src, classes = [] } = options;
    const avatar = document.createElement(elementType);
    avatar.classList.add("s-avatar", ...classes);
    if (size) { // default 16px
        avatar.classList.add(`s-avatar__${size}`);
    }
    if (href && avatar instanceof HTMLAnchorElement) {
        avatar.href = href;
    }
    const img = document.createElement("img");
    img.classList.add("s-avatar--image");
    img.src = src;
    avatar.append(img);
    return avatar;
};
exports.makeAvatar = makeAvatar;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeBling = exports.makeStacksBadge = void 0;
/**
 * @see https://stackoverflow.design/product/components/badges/
 *
 * @summary creates a Stacks badge
 * @param {StacksBadgesOptions} options configuration
 * @returns {HTMLSpanElement}
 */
const makeStacksBadge = (options) => {
    const { classes = [], blingColor = "", type = "", size = "", text, icon, } = options;
    const badge = document.createElement("span");
    badge.classList.add("s-badge", ...classes);
    if (type) {
        const typeClasses = type.map((name) => `s-badge__${name}`);
        badge.classList.add(...typeClasses);
    }
    if (size) {
        badge.classList.add(`s-badge__${size}`);
    }
    if (icon) {
        badge.classList.add("s-badge__icon");
        badge.append(icon, " ");
    }
    if (blingColor) {
        const bling = (0, exports.makeBling)("span", blingColor, text);
        badge.append(bling);
    }
    else {
        badge.append(text);
    }
    return badge;
};
exports.makeStacksBadge = makeStacksBadge;
/**
 * @summary Creates gold/silver/bronze bling
 * @param {keyof HTMLElementTagNameMap} elementType The type of the container element
 * @param {"gold" | "silver" | "bronze"} color The badge colour
 * @param {string} count The badge count
 * @returns {HTMLElement}
 */
const makeBling = (elementType, color, count) => {
    const element = document.createElement(elementType);
    element.classList.add("s-award-bling", `s-award-bling__${color}`);
    element.innerText = count;
    return element;
};
exports.makeBling = makeBling;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksBanner = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/banners/
 *
 * @summary Creates a Stacks banner
 * @param {StacksBannerOptions} options configuration
 * @returns {HTMLElement}
 */
const makeStacksBanner = (options) => {
    const { style, text, important = false, pinned = false, icon, classes = [], } = options;
    const banner = document.createElement("aside");
    banner.classList.add("s-banner", `s-banner__${style}`, "js-notice-banner", ...classes);
    banner.setAttribute("role", "alert");
    if (important) {
        banner.classList.add("s-banner__important");
    }
    if (pinned) {
        banner.classList.add("is-pinned");
    }
    const container = document.createElement("div");
    container.classList.add("d-flex", "flex__center", "jc-space-between", "s-banner--container");
    container.setAttribute("role", "alertdialog");
    const mainContainer = document.createElement("div");
    mainContainer.classList.add("d-flex", "g8");
    if (icon) {
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("flex--item");
        const [name, path] = icon;
        const [svgIcon] = index_1.Icons.makeStacksIcon(name, path, { width: 18 });
        iconContainer.append(svgIcon);
        mainContainer.append(iconContainer);
    }
    const textContainer = document.createElement("div");
    textContainer.classList.add("d-flex", "ai-center");
    const textElement = document.createElement("p");
    textElement.classList.add("m0");
    textElement.append(text);
    textContainer.append(textElement);
    mainContainer.append(textContainer);
    const closeContainer = document.createElement("div");
    closeContainer.classList.add("flex--item", "ml-auto", "myn8");
    const closeButton = document.createElement("a");
    closeButton.classList.add("p8", "s-btn", "d-flex", "flex__center", "fc-dark", "js-notice-close");
    closeButton.setAttribute("role", "status");
    const [svgClose] = index_1.Icons.makeStacksIcon("iconClearSm", "M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z", { classes: ["m0"] });
    closeButton.append(svgClose);
    closeContainer.append(closeButton);
    container.append(mainContainer, closeContainer);
    banner.append(container);
    return banner;
};
exports.makeStacksBanner = makeStacksBanner;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksBreadcrumb = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/breadcrumbs/
 *
 * @summary Creates a Stacks breadcrumb
 * @param {BreadcrumbItem[]} items An array of items to display in the breadcrumb
 * @param {StacksCommonOptions} options configuration
 * @returns {HTMLElement}
 */
const makeStacksBreadcrumb = (items, options) => {
    const { classes = [] } = options;
    const nav = document.createElement("nav");
    nav.classList.add("s-breadcrumbs", "mb6", "sm:mb2", ...classes);
    items.forEach((item, index) => {
        const { label, href = "#", } = item;
        const breadcrumbItem = document.createElement("div");
        breadcrumbItem.classList.add("s-breadcrumbs--item");
        const breadcrumbLink = document.createElement("a");
        breadcrumbLink.classList.add("s-breadcrumbs--link");
        breadcrumbLink.href = href;
        if (Array.isArray(label)) {
            // this is an icon
            const [name, path] = label;
            const [icon] = index_1.Icons.makeStacksIcon(name, path, {
                classes: ["mtn2"],
                width: 18
            });
            breadcrumbLink.append(icon);
        }
        else {
            breadcrumbLink.append(label);
        }
        breadcrumbItem.append(breadcrumbLink);
        if (index !== items.length - 1) {
            const [dividerIcon] = index_1.Icons.makeStacksIcon("iconArrowRightAltSm", "m4.38 4.62 1.24-1.24L9.24 7l-3.62 3.62-1.24-1.24L6.76 7 4.38 4.62Z", {
                classes: ["s-breadcrumbs--divider"],
                width: 13,
                height: 14
            });
            breadcrumbItem.append(dividerIcon);
        }
        nav.append(breadcrumbItem);
    });
    return nav;
};
exports.makeStacksBreadcrumb = makeStacksBreadcrumb;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksButtonGroup = void 0;
/**
 * @see https://stackoverflow.design/product/components/button-groups/
 *
 * @summary Creates a Stacks button group
 * @param {GroupButton[]} buttons the buttons to display in the group
 * @param {StacksButtonGroupOptions} [options] configuration
 * @returns {HTMLDivElement}
 */
const makeStacksButtonGroup = (buttons, options = {}) => {
    const { classes = [] } = options;
    const container = document.createElement("div");
    container.classList.add("s-btn-group", ...classes);
    buttons.forEach((buttonConfig) => {
        const { text, selected = false, count, form = false, } = buttonConfig;
        const button = document.createElement("button");
        button.classList.add("s-btn", "s-btn__muted", "s-btn__outlined");
        button.setAttribute("role", "button");
        button.append(text);
        if (selected) {
            button.classList.add("is-selected");
        }
        if (count) {
            const badge = document.createElement("span");
            badge.classList.add("s-btn--badge");
            const btnNumber = document.createElement("span");
            btnNumber.classList.add("s-btn--number");
            btnNumber.textContent = count.toString();
            badge.append(btnNumber);
            button.append(" ", badge);
        }
        if (form) {
            const formContainer = document.createElement("form");
            formContainer.classList.add("s-btn-group--container");
            formContainer.append(button);
            container.append(formContainer);
        }
        else {
            container.append(button);
        }
    });
    return container;
};
exports.makeStacksButtonGroup = makeStacksButtonGroup;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksCheckboxes = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/checkbox/
 *
 * @summary Creates a Stacks checkbox
 * @param {Input.StacksInputTypes[]} checkboxes The checkboxes to create
 * @param {Input.StacksRadioCheckboxOptions} [options] checkbox configuration
 * @returns {HTMLElement[]}
 */
const makeStacksCheckboxes = (checkboxes, options) => {
    return index_1.Input.makeStacksRadiosOrCheckboxes(checkboxes, "checkbox", options);
};
exports.makeStacksCheckboxes = makeStacksCheckboxes;


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeIndicator = void 0;
/**
 * @see https://stackoverflow.design/product/components/activity-indicator/
 *
 * @summary creates a Stacks activity indicator
 * @param {StacksIndicatorOptions} options configuration
 * @returns {HTMLDivElement}
 */
const makeIndicator = (options = {}) => {
    const { type = "", text = "", hiddenText = "", classes = [] } = options;
    const indicator = document.createElement("div");
    indicator.classList.add("s-activity-indicator", ...classes);
    if (type) {
        indicator.classList.add(`s-activity-indicator__${type}`);
    }
    if (text) {
        indicator.append(text);
    }
    if (hiddenText) {
        const hiddenElement = document.createElement("div");
        hiddenElement.classList.add("v-visible-sr");
        hiddenElement.innerText = hiddenText;
        indicator.append(hiddenElement);
    }
    return indicator;
};
exports.makeIndicator = makeIndicator;


/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksRadiosOrCheckboxes = exports.makeStacksInput = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/inputs/
 *
 * @summary creates a Stacks input
 * @param {string} id the input id
 * @param {StacksInputOptions} inputOptions input configuration
 * @param {StacksLabelOptions} [labelOptions] label configuration
 * @returns {HTMLDivElement}
 */
const makeStacksInput = (id, inputOptions = {}, labelOptions) => {
    var _a;
    const { value = "", classes = [], placeholder = "", title, isSearch } = inputOptions;
    const inputParent = document.createElement("div");
    inputParent.classList.add("d-flex", "ps-relative");
    const input = document.createElement("input");
    input.classList.add("s-input", ...classes);
    input.type = "text";
    input.id = input.name = id;
    input.placeholder = placeholder;
    input.value = value;
    if (title)
        input.title = title;
    if (isSearch) {
        input.classList.add("s-input__search");
        const [searchIcon] = index_1.Icons.makeStacksIcon("iconSearch", "m18 16.5-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z", {
            classes: ["s-input-icon", "s-input-icon__search"],
            width: 18,
        });
        inputParent.append(searchIcon);
    }
    inputParent.prepend(input);
    if (labelOptions) {
        (_a = (labelOptions.parentClasses || (labelOptions.parentClasses = []))) === null || _a === void 0 ? void 0 : _a.push("flex--item");
        const label = index_1.Label.makeStacksLabel(id, labelOptions);
        const container = document.createElement("div");
        container.classList.add("d-flex", "gy4", "fd-column");
        container.append(label, inputParent);
        return container;
    }
    return inputParent;
};
exports.makeStacksInput = makeStacksInput;
/**
 * @see https://stackoverflow.design/product/components/checkbox/
 * @see https://stackoverflow.design/product/components/radio/
 *
 * @summary Creates a Stacks input
 * @param {StacksInputTypes[]} inputs The checkboxes to create
 * @param {StacksRadioCheckboxOptions} [options] checkbox configuration
 * @returns {HTMLElement[]} The checkboxes with or without the wrapper
 */
const makeStacksRadiosOrCheckboxes = (inputs, type, options, withoutFieldset) => {
    const fieldset = document.createElement("fieldset");
    fieldset.classList.add("s-check-group");
    if (options) {
        const { legendText = "", legendDescription = "", horizontal, classes = [], } = options;
        if (horizontal) {
            fieldset.classList.add("s-check-group__horizontal");
        }
        fieldset.classList.add(...classes);
        const legend = document.createElement("legend");
        legend.classList.add("flex--item", "s-label");
        legend.innerText = legendText;
        if (legendDescription) {
            const span = document.createElement("span");
            span.classList.add("ml4", "fw-normal", "fc-light");
            span.innerText = legendDescription;
            legend.append(" ", span);
        }
        fieldset.append(legend);
    }
    const items = inputs.map((inputType) => makeFormContainer(inputType, type));
    if (withoutFieldset) {
        return items;
    }
    else {
        fieldset.append(...items);
        return [fieldset, ...items];
    }
};
exports.makeStacksRadiosOrCheckboxes = makeStacksRadiosOrCheckboxes;
/**
 * @summary Helper for creating a checkbox/radio container
 * @param {StacksInputTypes} radioCheckbox input configuration
 * @returns {HTMLDivElement}
 */
const makeFormContainer = (radioCheckbox, type) => {
    const { id, labelConfig, selected = false, disabled = false, name } = radioCheckbox;
    const container = document.createElement("div");
    container.classList.add("s-check-control");
    const input = document.createElement("input");
    input.classList.add(`s-${type}`);
    input.type = type;
    input.id = id;
    input.checked = selected;
    input.disabled = disabled;
    if (name) {
        input.name = name;
    }
    const label = index_1.Label.makeStacksLabel(id, labelConfig);
    container.append(input, label);
    return container;
};


/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksLabel = void 0;
/**
 * @see https://stackoverflow.design/product/components/labels/
 *
 * @summary creates a Stacks label
 * @param {string} forId the label htmlFor attribute
 * @param {StacksLabelOptions} labelOptions label configuration
 * @returns {HTMLDivElement | HTMLLabelElement}
 */
const makeStacksLabel = (forId, labelOptions) => {
    const { classes = [], parentClasses = [], text, description, statusText, statusType } = labelOptions;
    const labelParent = document.createElement("div");
    labelParent.classList.add(...parentClasses);
    const label = document.createElement("label");
    label.classList.add("s-label", ...classes);
    label.htmlFor = forId;
    label.innerHTML = text;
    // https://stackoverflow.design/product/components/labels/#status
    if (statusText && statusType) {
        const status = document.createElement("span");
        status.innerHTML = statusText;
        status.classList.add("s-label--status");
        if (statusType !== "optional") {
            status.classList.add(`s-label--status__${statusType}`);
        }
        label.append(" ", status);
    }
    if (description) {
        const p = document.createElement("p");
        p.classList.add("s-description", "mt2");
        p.innerHTML = description;
        // if there's a description, the label
        // must have a d-block class
        label.classList.add("d-block");
        label.append(p);
        labelParent.append(label);
        return labelParent;
    }
    else {
        label.classList.add("flex--item");
        return label;
    }
};
exports.makeStacksLabel = makeStacksLabel;


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeLink = void 0;
/**
 * @see https://stackoverflow.design/product/components/links/
 *
 * @summary creates a Stacks link
 * @param {StacksLinksOptions} options configuration
 * @returns {HTMLAnchorElement | HTMLButtonElement}
 */
const makeLink = (options = {}) => {
    const { href = "", isButton = false, type = "", blockLink = null, text, click, classes = [] } = options;
    const anchor = document.createElement(isButton ? "button" : "a");
    anchor.classList.add("s-link", ...classes);
    anchor.innerText = text;
    if (type) {
        anchor.classList.add(`s-link__${type}`);
    }
    if (blockLink) {
        anchor.classList.add("s-block-link");
        anchor.classList.remove("s-link");
        if (blockLink.border) {
            anchor.classList.add(`s-block-link__${blockLink.border}`);
        }
        if (blockLink.selected) {
            anchor.classList.add("is-selected");
        }
        if (blockLink.danger) {
            anchor.classList.add("s-block-link__danger");
        }
    }
    if (href && anchor instanceof HTMLAnchorElement) {
        anchor.href = href;
    }
    if (click) {
        const { handler, options } = click;
        anchor.addEventListener("click", handler, options);
    }
    return anchor;
};
exports.makeLink = makeLink;


/***/ }),
/* 19 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeMenu = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/menus/
 *
 * @summary creates a Stacks menu
 * @param {StacksMenuOptions} options configuration
 * @returns {HTMLUListElement}
 */
const makeMenu = (options = {}) => {
    const { itemsType = "a", childrenClasses = [], navItems, classes = [] } = options;
    const menu = document.createElement("ul");
    menu.classList.add("s-menu", ...classes);
    menu.setAttribute("role", "menu");
    // TODO
    // https://stackoverflow.design/product/components/menus/#radio-groups
    navItems.forEach((navItem) => {
        var _a;
        const li = document.createElement("li");
        if ("popover" in navItem && navItem.popover) {
            const { position = "auto", html, } = navItem.popover;
            Stacks.setTooltipHtml(li, html, {
                placement: position
            });
        }
        if ("separatorType" in navItem) {
            const { separatorType, separatorText } = navItem;
            li.setAttribute("role", "separator");
            li.classList.add(`s-menu--${separatorType}`);
            if (separatorText)
                li.innerText = separatorText;
            menu.append(li);
            return;
        }
        else if ("checkbox" in navItem) {
            const { checkbox, checkboxOptions } = navItem;
            // one checkbox returned, fetch second item of the array
            const [, input] = index_1.Checkbox.makeStacksCheckboxes([checkbox], checkboxOptions);
            li.append(input);
            menu.append(li);
            return;
        }
        (_a = navItem.classes) === null || _a === void 0 ? void 0 : _a.push(...childrenClasses);
        li.setAttribute("role", "menuitem");
        const item = index_1.Links.makeLink(Object.assign({
            isButton: itemsType === "button",
            blockLink: {},
        }, navItem));
        li.append(item);
        menu.append(li);
    });
    return menu;
};
exports.makeMenu = makeMenu;


/***/ }),
/* 20 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeNavigation = void 0;
/**
 * @see https://stackoverflow.design/product/components/navigation/
 *
 * @summary creates a Stacks navigation component
 * @param {StacksNavItems[]} navItems the children of the nav element
 * @param {"button" | "a"} type whether in-page navigation is used
 * @param {number} selectIndex the index of the item to select
 * @returns {HTMLElementTagNameMap["nav"]}
 */
const makeNavigation = (navItems, type, selectIndex = 0) => {
    const navigation = document.createElement("nav");
    const ul = document.createElement("ul");
    ul.classList.add("s-navigation");
    if (type === "button") {
        ul.setAttribute("role", "tablist");
        ul.setAttribute("data-controller", "s-navigation-tablist");
    }
    const children = navItems
        .map((item, i) => createNavItem(item, type, i === selectIndex));
    ul.append(...children);
    navigation.append(ul);
    return navigation;
};
exports.makeNavigation = makeNavigation;
/**
 * @summary creates a navigation item
 * @param {StacksNavItems} item info about the item to create
 * @param {"button" | "a"} type whether in-page navigation is used
 * @param {boolean} select whether the item should be selected
 * @returns {HTMLLIElement}
 */
const createNavItem = ({ id, text, ariaControls }, type, select) => {
    const li = document.createElement("li");
    const wrapper = document.createElement(type);
    wrapper.id = id;
    wrapper.innerText = text;
    wrapper.classList.add("s-navigation--item");
    if (select)
        wrapper.classList.add("is-selected");
    if (type === "button") {
        wrapper.setAttribute("role", "tab");
        wrapper.type = "button";
        if (ariaControls)
            wrapper.setAttribute("aria-controls", ariaControls);
    }
    li.append(wrapper);
    return li;
};


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksNotice = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/notices/
 *
 * @summary Creates a Stacks notice
 * @param {StacksNoticesOptions} options configuration
 * @returns {HTMLElement}
 */
const makeStacksNotice = (options) => {
    const { type, important = false, icon, text, classes = [], } = options;
    const notice = document.createElement("aside");
    notice.classList.add("s-notice", ...classes);
    notice.setAttribute("role", important ? "alert" : "status");
    if (type) {
        notice.classList.add(`s-notice__${type}`);
    }
    if (important) {
        notice.classList.add("s-notice__important");
    }
    if (icon) {
        notice.classList.add("d-flex");
        const iconContainer = document.createElement("div");
        iconContainer.classList.add("flex--item", "mr8");
        const [name, path] = icon;
        const [svgIcon] = index_1.Icons.makeStacksIcon(name, path, { width: 18 });
        iconContainer.append(svgIcon);
        const textContainer = document.createElement("div");
        textContainer.classList.add("flex--item", "lh-lg");
        textContainer.append(text);
        notice.append(iconContainer, textContainer);
    }
    else {
        const p = document.createElement("p");
        p.classList.add("m0");
        p.append(text);
        notice.append(p);
    }
    return notice;
};
exports.makeStacksNotice = makeStacksNotice;


/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makePagination = void 0;
/**
 * @see https://stackoverflow.design/product/components/pagination/
 *
 * @summary Creates a Stacks pagination component
 * @param {StacksPaginationOptions} options
 * @returns {HTMLDivElement}
 */
const makePagination = (options) => {
    const { first, middle, last, selectedPage = 1, generator, nextButtonHref = "#", classes = [] } = options;
    const container = document.createElement("div");
    container.classList.add("s-pagination", ...classes);
    const clear = document.createElement("span");
    clear.classList.add("s-pagination--item", "s-pagination--item__clear");
    clear.textContent = "...";
    const nextButton = document.createElement("a");
    nextButton.classList.add("s-pagination--item");
    nextButton.textContent = "Next";
    nextButton.href = nextButtonHref;
    container.append(...first.map((page) => createPage(page, generator(page), page === selectedPage)), clear.cloneNode(true));
    if (middle) {
        container.append(...middle.map((page) => createPage(page, generator(page), page === selectedPage)), clear.cloneNode(true));
    }
    container.append(...last.map((page) => createPage(page, generator(page), page === selectedPage)), nextButton);
    return container;
};
exports.makePagination = makePagination;
/**
 * @summary Creates a page button
 * @param {number} page - The page number
 * @param {string} url - The url for the page
 * @param {boolean} isSelected - Whether the page is selected
 * @returns {HTMLSpanElement | HTMLAnchorElement} The page button
 */
const createPage = (page, url, isSelected) => {
    const element = document.createElement(isSelected ? "span" : "a");
    element.classList.add("s-pagination--item");
    element.textContent = page.toString();
    if (element instanceof HTMLAnchorElement) {
        element.href = url;
    }
    else {
        //    element is not an anchor
        // => element is a span
        // => it should be selected
        element.classList.add("is-selected");
    }
    return element;
};


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeSteppedBar = exports.makeSegmentedBar = exports.makeCircularBar = exports.makeBaseBar = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/progress-bars/#base-style
 *
 * @summary Create a Stacks base progress bar
 * @param {string} id - The id of the progress bar
 * @param {StacksBaseBarOptions} options - configuration
 * @returns {HTMLDivElement}
 */
const makeBaseBar = (id, options) => {
    const { width, coloring, classes = [], } = options;
    const bar = document.createElement("div");
    bar.classList.add("s-progress--bar");
    bar.style.setProperty("width", `${width.toString()}%`);
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", width.toString());
    const progress = document.createElement("div");
    progress.classList.add("s-progress", ...classes);
    progress.id = id;
    if (coloring) {
        progress.classList.add(`s-progress__${coloring}`);
    }
    progress.append(bar);
    return progress;
};
exports.makeBaseBar = makeBaseBar;
/**
 * @see https://stackoverflow.design/product/components/progress-bars/#circular
 *
 * @summary Create a Stacks circular progress bar
 * @param {string} id - The id of the progress bar
 * @param {StacksCircularBarOptions} options - configuration
 * @returns {HTMLDivElement}
 */
const makeCircularBar = (id, options) => {
    const { width, classes = [], size } = options;
    const progress = document.createElement("div");
    progress.id = id;
    progress.classList.add("s-progress", "s-progress__circular", ...classes);
    progress.style.setProperty("--s-progress-value", `${(width / 100).toString()}`);
    if (size) {
        progress.classList.add(`s-progress__${size}`);
    }
    const bar = document.createElement("svg");
    bar.classList.add("s-progress-bar");
    bar.setAttribute("viewBox", "0 0 32 32");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", width.toString());
    const circle = document.createElement("circle");
    circle.setAttribute("cx", "16");
    circle.setAttribute("cy", "16");
    circle.setAttribute("r", "14");
    bar.append(circle, circle.cloneNode(true));
    progress.innerHTML = bar.outerHTML;
    return progress;
};
exports.makeCircularBar = makeCircularBar;
/**
 * @see https://stackoverflow.design/product/components/progress-bars/#segmented
 *
 * @summary Create a Stacks segmented progress bar
 * @param {string} id - The id of the progress bar
 * @param {StacksSegmentedBarOptions} options - configuration
 * @returns {HTMLDivElement}
 */
const makeSegmentedBar = (id, options) => {
    const { width, segments, coloring, classes = [], } = options;
    const progress = document.createElement("div");
    progress.id = id;
    progress.classList.add("s-progress", "s-progress__segmented", ...classes);
    if (coloring) {
        progress.classList.add(`s-progress__${coloring}`);
    }
    const bar = document.createElement("div");
    bar.classList.add("s-progress--bar");
    bar.style.setProperty("width", `${width.toString()}%"`);
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    bar.setAttribute("aria-valuenow", width.toString());
    const ol = document.createElement("ol");
    ol.classList.add("s-progress--segments");
    for (let i = 0; i < segments + 1; i++) {
        const li = document.createElement("li");
        ol.append(li);
    }
    progress.append(bar, ol);
    return progress;
};
exports.makeSegmentedBar = makeSegmentedBar;
/**
 * @see https://stackoverflow.design/product/components/progress-bars/#stepped
 *
 * @summary Create a Stacks stepped progress bar
 * @param {string} id - the id of the progress bar
 * @param {SteppedBarItem[]} items - the items to display
 * @param {StacksCommonOptions} options - configuration
 * @returns {HTMLDivElement}
 */
const makeSteppedBar = (id, items, options = {}) => {
    const { classes = [] } = options;
    const progress = document.createElement("div");
    progress.id = id;
    progress.classList.add("s-progress", "s-progress__stepped", ...classes);
    items.forEach((item, index) => {
        const { status, label, classes = [], href = "#", } = item;
        const step = document.createElement("div");
        step.classList.add("s-progress--step", ...classes);
        if (status) {
            step.classList.add(`is-${status}`);
        }
        const stop = document.createElement("a");
        stop.classList.add("s-progress--stop");
        stop.href = href;
        if (status === "complete") {
            const [checkmark] = index_1.Icons.makeStacksIcon("iconCheckmarkSm", "M13 3.41 11.59 2 5 8.59 2.41 6 1 7.41l4 4 8-8Z");
            stop.append(checkmark);
        }
        step.append(stop);
        const rightBar = document.createElement("div");
        rightBar.classList.add("s-progress--bar", "s-progress--bar__right");
        const leftBar = document.createElement("div");
        leftBar.classList.add("s-progress--bar", "s-progress--bar__left");
        if (index === 0) { // first item
            step.append(rightBar);
        }
        else if (index === items.length - 1) { // last item
            step.append(leftBar);
        }
        else {
            step.append(rightBar, leftBar);
        }
        const labelEl = document.createElement("a");
        labelEl.classList.add("s-progress--label");
        labelEl.href = href;
        labelEl.textContent = label;
        step.append(labelEl);
        progress.append(step);
    });
    return progress;
};
exports.makeSteppedBar = makeSteppedBar;


/***/ }),
/* 24 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksPopover = void 0;
/**
 * @see https://stackoverflow.design/product/components/popovers
 *
 * @summary Creates a Stacks popover
 * @param {string} id The id of the popover
 * @param {HTMLElement} controller The controller element
 * @param {StacksPopoverOptions} options Popover configuration
 */
const makeStacksPopover = (id, controller, options) => {
    const { referenceSelector, toggleClass, placement, toggle, autoShow, hideOnOutsideClick, manualArrowPositioning, callbacks, contentHtml, classes = [], } = options;
    controller.setAttribute("data-controller", "popover");
    controller.setAttribute("aria-controls", id);
    if (referenceSelector) {
        controller.setAttribute("data-s-popover-reference-selector", referenceSelector);
    }
    if (placement) {
        controller.setAttribute("data-s-popover-placement", placement);
    }
    if (toggleClass) {
        controller.setAttribute("data-s-popover-toggle-class", toggleClass);
    }
    if (toggle) {
        controller.setAttribute("data-action", "s-popover#toggle");
    }
    if (autoShow) {
        controller.setAttribute("data-s-popover-auto-show", "true");
    }
    if (hideOnOutsideClick) {
        controller.setAttribute("data-s-popover-hide-on-outside-click", hideOnOutsideClick);
    }
    if (callbacks) {
        Object
            .entries(callbacks)
            .map(([name, callback]) => [`s-popover:${name}`, callback])
            .forEach(([name, callback]) => {
            const eventName = name;
            const handler = callback;
            controller.addEventListener(eventName, handler);
        });
    }
    controller.addEventListener("s-popover:show", callbacks.show);
    const popover = document.createElement("div");
    popover.id = id;
    popover.setAttribute("role", "menu");
    popover.classList.add("s-popover", ...classes);
    const arrow = document.createElement("div");
    arrow.classList.add("s-popover--arrow");
    if (manualArrowPositioning) {
        arrow.classList.add(`s-popover--arrow__${manualArrowPositioning}`);
    }
    popover.append(arrow, contentHtml);
    return popover;
};
exports.makeStacksPopover = makeStacksPopover;


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksRadios = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/checkbox/
 *
 * @summary Creates a Stacks radio
 * @param {Input.StacksInputTypes[]} radios The radios to create
 * @param {Input.StacksRadioCheckboxOptions} [options] radio configuration
 * @returns {HTMLElement[]}
 */
const makeStacksRadios = (radios, groupName, options) => {
    radios.forEach((radio) => {
        radio.name = groupName;
    });
    return index_1.Input.makeStacksRadiosOrCheckboxes(radios, "radio", options);
};
exports.makeStacksRadios = makeStacksRadios;


/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toggleValidation = exports.makeStacksSelect = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/select/
 *
 * @summary Creates a Stacks select element
 * @param {string} id The id of the select
 * @param {SelectOption[]} items The options to display in the select
 * @param {StacksSelectOptions} [options] configuration
 * @param {Label.StacksLabelOptions} [labelOptions] label configuration
 * @returns {HTMLDivElement}
 */
const makeStacksSelect = (id, items, options = {}, labelOptions) => {
    const { disabled = false, size, validation, classes = [] } = options;
    const container = document.createElement("div");
    container.classList.add("d-flex", "gy4", "fd-column");
    if (labelOptions) {
        (labelOptions.parentClasses || (labelOptions.parentClasses = [])).push("flex--item");
        const label = index_1.Label.makeStacksLabel(id, labelOptions);
        container.append(label);
    }
    const selectContainer = document.createElement("div");
    selectContainer.classList.add("flex--item", "s-select");
    if (size) {
        selectContainer.classList.add(`s-select__${size}`);
    }
    const select = document.createElement("select");
    select.id = id;
    select.classList.add(...classes);
    if (disabled) {
        container.classList.add("is-disabled");
        select.disabled = true;
    }
    items.forEach((item) => {
        const { value, text, selected = false } = item;
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        option.selected = selected;
        select.append(option);
    });
    selectContainer.append(select);
    container.append(selectContainer);
    if (validation) {
        (0, exports.toggleValidation)(container, validation);
    }
    return container;
};
exports.makeStacksSelect = makeStacksSelect;
/**
 * @see https://stackoverflow.design/product/components/select/#validation-states
 *
 * @summary Toggles validation styling to a select
 * @param {HTMLDivElement} container the select's container
 * @param {StacksSelectOptions["validation"]} [state] configuration
 * @returns {void}
 */
const toggleValidation = (container, state) => {
    var _a, _b;
    container.classList.remove("has-success", "has-warning", "has-error");
    (_a = container.querySelector(".s-input-icon")) === null || _a === void 0 ? void 0 : _a.remove();
    if (!state)
        return;
    container.classList.add(`has-${state}`);
    const [name, path] = index_1.Icons.validationIcons[state];
    const [icon] = index_1.Icons.makeStacksIcon(name, path, {
        classes: ["s-input-icon"],
        width: 18
    });
    (_b = container.querySelector(".s-select")) === null || _b === void 0 ? void 0 : _b.append(icon);
};
exports.toggleValidation = toggleValidation;


/***/ }),
/* 27 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeSpinner = void 0;
/**
 * @see https://stackoverflow.design/product/components/spinner/
 *
 * @summary creates a Stacks spinner
 * @param {StacksSpinnerOptions} options configuration
 * @returns {HTMLDivElement}
 */
const makeSpinner = (options = {}) => {
    const { size = "", hiddenText = "", classes = [] } = options;
    const spinner = document.createElement("div");
    spinner.classList.add("s-spinner", ...classes);
    if (size) {
        spinner.classList.add(`s-spinner__${size}`);
    }
    if (hiddenText) {
        const hiddenElement = document.createElement("div");
        hiddenElement.classList.add("v-visible-sr");
        hiddenElement.innerText = hiddenText;
        spinner.append(hiddenElement);
    }
    return spinner;
};
exports.makeSpinner = makeSpinner;


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksTag = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/tags/
 *
 * @summary Creates a Stacks tag
 * @param {StacksTagsOptions} options - configuration
 * @returns {AnchorElement}
 */
const makeStacksTag = (options) => {
    const { classes = [], name, href = "#", moderator = false, selected = false, size = "", muted = false, required = false, sponsor = null, dismissable = false, onDismiss = null, watched = false, ignored = false, } = options;
    const tag = document.createElement("a");
    tag.classList.add("s-tag", ...classes);
    tag.href = href;
    tag.textContent = name;
    if (moderator) {
        tag.classList.add("s-tag__moderator");
    }
    if (selected) {
        tag.classList.add("is-selected");
    }
    if (size) {
        tag.classList.add(`s-tag__${size}`);
    }
    if (muted) {
        tag.classList.add("s-tag__muted");
    }
    if (required) {
        tag.classList.add("s-tag__required");
    }
    if (watched) {
        tag.classList.add("s-tag__watched");
    }
    else if (ignored) {
        tag.classList.add("s-tag__ignored");
    }
    if (sponsor) {
        const { imgUrl, width = 18, height = 16, alt = "" } = sponsor;
        const sponsorImg = document.createElement("img");
        sponsorImg.classList.add("s-tag--sponsor");
        sponsorImg.src = imgUrl;
        sponsorImg.width = width;
        sponsorImg.height = height;
        sponsorImg.alt = alt;
        tag.prepend(" ", sponsorImg);
    }
    if (dismissable) {
        const [iconClearSm] = index_1.Icons.makeStacksIcon("iconClearSm", "M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41Z");
        const dismiss = document.createElement("span");
        dismiss.classList.add("s-tag--dismiss");
        dismiss.append(iconClearSm);
        if (onDismiss) {
            dismiss.addEventListener("click", (event) => {
                const span = event.target;
                onDismiss(span === null || span === void 0 ? void 0 : span.closest(".s-tag"), event);
            });
        }
        tag.append(" ", dismiss);
    }
    return tag;
};
exports.makeStacksTag = makeStacksTag;


/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.toggleValidation = exports.makeStacksTextarea = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/textarea/
 *
 * @summary creates a Stacks textarea
 * @param {string} id the textarea id
 * @param {StacksTextareaOptions} textareaOptions textarea configuration
 * @param {Label.StacksLabelOptions} [labelOptions] label configuration
 * @returns {HTMLDivElement}
 */
const makeStacksTextarea = (id, textareaOptions = {}, labelOptions) => {
    const { value = "", classes = [], placeholder = "", title = "", size, validation, } = textareaOptions;
    const textareaParent = document.createElement("div");
    textareaParent.classList.add("d-flex", "fd-column", "gy4", ...classes);
    if (labelOptions) {
        const label = index_1.Label.makeStacksLabel(id, labelOptions);
        textareaParent.append(label);
    }
    const textarea = document.createElement("textarea");
    textarea.classList.add("flex--item", "s-textarea");
    textarea.id = id;
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.title = title;
    if (size) {
        textarea.classList.add(`s-textarea__${size}`);
    }
    textareaParent.append(textarea);
    if (validation) {
        (0, exports.toggleValidation)(textareaParent, validation);
    }
    return textareaParent;
};
exports.makeStacksTextarea = makeStacksTextarea;
/**
 * @see https://stackoverflow.design/product/components/textarea/#validation-states
 *
 * @summary Toggles validation styling to a textarea
 * @param {HTMLDivElement} textareaParent the textarea's container
 * @param {StacksTextareaOptions["validation"]} validation configuration
 * @returns {void}
 */
const toggleValidation = (textareaParent, validation) => {
    var _a, _b;
    textareaParent.classList.remove("has-success", "has-warning", "has-error");
    const oldTextarea = textareaParent.querySelector(".s-textarea");
    if (!validation) {
        // toggle off all styles
        (_a = textareaParent.querySelector(".s-input-icon")) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = textareaParent.querySelector(".s-input-message")) === null || _b === void 0 ? void 0 : _b.remove();
        const validationContainer = oldTextarea.parentElement;
        validationContainer === null || validationContainer === void 0 ? void 0 : validationContainer.replaceWith(oldTextarea);
        return;
    }
    const { state, description } = validation;
    textareaParent.classList.add(`has-${state}`);
    const [iconName, iconPath] = index_1.Icons.validationIcons[state];
    const [icon] = index_1.Icons.makeStacksIcon(iconName, iconPath, {
        classes: ["s-input-icon"],
        width: 18,
    });
    // switch validation
    if (oldTextarea.nextElementSibling) {
        oldTextarea.nextElementSibling.replaceWith(icon);
        const inputMessage = textareaParent.querySelector(".s-input-message");
        if (description) {
            if (inputMessage) {
                inputMessage.innerHTML = description;
            }
            else {
                createAndAppendDescription(description, textareaParent);
            }
        }
        else if (!description && inputMessage) {
            inputMessage.remove();
        }
    }
    else {
        // create validation
        const validationContainer = document.createElement("div");
        validationContainer.classList.add("d-flex", "ps-relative");
        validationContainer.append(oldTextarea, icon);
        textareaParent.append(validationContainer);
        if (description) {
            createAndAppendDescription(description, textareaParent);
        }
    }
};
exports.toggleValidation = toggleValidation;
const createAndAppendDescription = (description, appendTo) => {
    const message = document.createElement("p");
    message.classList.add("flex--item", "s-input-message");
    message.innerHTML = description;
    appendTo.append(message);
};


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksToggle = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/toggle-switch/
 *
 * @summary Creates a Stacks toggle switch
 * @param {string} id the switch id
 * @param {StacksToggleOptions} labelOptions attached label configuration
 * @param {boolean} on the state of the switch
 * @param {string[]} classes the classes to apply to the container of the switch
 * @returns {HTMLDivElement}
 */
const makeStacksToggle = (id, labelOptions, on = false, ...classes) => {
    const container = document.createElement("div");
    container.classList.add("d-flex", "g8", "ai-center", ...classes);
    const label = index_1.Label.makeStacksLabel(id, labelOptions);
    const toggle = document.createElement("input");
    toggle.id = id;
    toggle.classList.add("s-toggle-switch");
    toggle.type = "checkbox";
    toggle.checked = on;
    container.append(label, toggle);
    return container;
};
exports.makeStacksToggle = makeStacksToggle;


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeMinimalUserCard = exports.makeSmallUserCard = exports.makeBaseUserCard = exports.makeFullUserCard = void 0;
const _1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/user-cards/#full
 *
 * @summary Creates a Stacks full user card
 * @param {FullUserCardOptions} options configuration
 * @returns {HTMLDivElement}
 */
const makeFullUserCard = (options) => {
    const { avatar, user: { name = "", href = "#", reputation = "1", badges, labels, role, location, tags }, userType, classes = [], } = options;
    const userCard = document.createElement("div");
    userCard.classList.add("s-user-card", "s-user-card__full", ...classes);
    const avatarContainer = getDefaultUserCardAvatar(avatar, href, 48);
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("s-user-card--info");
    const link = document.createElement("a");
    link.classList.add("s-user-card--link", "d-flex", "g4");
    link.href = href;
    const username = document.createElement("div");
    username.classList.add("flex--item");
    username.innerHTML = name;
    link.append(username);
    if (labels) {
        const elements = getLabelElements(labels);
        link.append(...elements);
    }
    const awards = getUserAwards(reputation, badges);
    infoContainer.append(link, awards);
    if (role) {
        const roleEl = document.createElement("div");
        roleEl.classList.add("s-user-card--role");
        roleEl.innerHTML = role;
        infoContainer.append(roleEl);
    }
    if (location) {
        const locationEl = document.createElement("div");
        locationEl.classList.add("s-user-card--location");
        locationEl.innerHTML = location;
        infoContainer.append(locationEl);
    }
    if (tags) {
        const userTags = document.createElement("div");
        userTags.classList.add("s-user-card--tags", "d-flex", "g4");
        const tagsEls = tags.map((config) => {
            var _a;
            (_a = config.classes) === null || _a === void 0 ? void 0 : _a.push("flex--item");
            if (!(config === null || config === void 0 ? void 0 : config.size)) {
                // default tag size for full cards
                config.size = "xs";
            }
            return _1.Tag.makeStacksTag(config);
        });
        userTags.append(...tagsEls);
        infoContainer.append(userTags);
    }
    userCard.append(avatarContainer, infoContainer);
    if (userType) {
        const userTypeEl = document.createElement("div");
        userTypeEl.classList.add("s-user-card--type");
        userTypeEl.innerHTML = userType;
        userCard.append(userTypeEl);
    }
    return userCard;
};
exports.makeFullUserCard = makeFullUserCard;
/**
 * @see https://stackoverflow.design/product/components/user-cards/#base
 *
 * @summary Creates a Stacks base user card
 * @param {BaseUserCardOptions} options configuration
 * @returns {HTMLDivElement}
 */
const makeBaseUserCard = (options) => {
    const { avatar, time = "", user: { name = "", href = "#", reputation = "1", badges, labels, }, deleted, highlight, userType, classes = [], } = options;
    const userCard = document.createElement("div");
    userCard.classList.add("s-user-card", ...classes);
    if (highlight) {
        userCard.classList.add("s-user-card__highlighted");
    }
    const timeEl = document.createElement("time");
    timeEl.classList.add("s-user-card--time");
    timeEl.innerHTML = time;
    const avatarContainer = getDefaultUserCardAvatar(avatar, href, 32, deleted);
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("s-user-card--info");
    const link = document.createElement(deleted ? "div" : "a");
    link.classList.add("s-user-card--link", "d-flex", "g4");
    if (labels) {
        const nameDiv = document.createElement("div");
        nameDiv.classList.add("flex--item");
        nameDiv.innerHTML = name;
        link.append(nameDiv, ...getLabelElements(labels));
    }
    else {
        link.innerHTML = name;
    }
    infoContainer.append(link);
    userCard.append(timeEl, avatarContainer, infoContainer);
    // (if one is true, both are guaranteed to be true,
    //  doing this to shut up the TS compiler)
    if (deleted || link instanceof HTMLDivElement) {
        userCard.classList.add("s-user-card__deleted");
        // no more info for deleted users
        return userCard;
    }
    link.href = href;
    const awards = getUserAwards(reputation, badges);
    infoContainer.append(awards);
    if (userType) {
        const userTypeEl = document.createElement("div");
        userTypeEl.classList.add("s-user-card--type");
        userTypeEl.innerText = userType;
        userCard.append(userTypeEl);
    }
    return userCard;
};
exports.makeBaseUserCard = makeBaseUserCard;
/**
 * @see https://stackoverflow.design/product/components/user-cards/#small
 *
 * @summary Creates a Stacks small user card
 * @param {SmallUserCardOptions} options configuration
 * @returns {HTMLDivElement}
 */
const makeSmallUserCard = (options) => {
    const { avatar, user: { badges, href = "#", reputation = "1", }, classes = [], } = options;
    const userCard = document.createElement("div");
    userCard.classList.add("s-user-card", "s-user-card__small", ...classes);
    const avatarContainer = getDefaultUserCardAvatar(avatar, href, 24);
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("s-user-card--info");
    const awards = getUserAwards(reputation, badges);
    infoContainer.append(awards);
    userCard.append(avatarContainer, infoContainer);
    return userCard;
};
exports.makeSmallUserCard = makeSmallUserCard;
/**
 * @see https://stackoverflow.design/product/components/user-cards/#minimal
 *
 * @summary Creates a Stacks minimal user card
 * @param {MinimalUserCardOptions} options configuration
 * @returns {HTMLDivElement}
 */
const makeMinimalUserCard = (options) => {
    const { avatar, time = "", user: { name = "", href = "#", reputation = "1", }, deleted, classes = [], } = options;
    const userCard = document.createElement("div");
    userCard.classList.add("s-user-card", "s-user-card__minimal", ...classes);
    if (deleted) {
        userCard.classList.add("s-user-card__deleted");
    }
    if (avatar) {
        const avatarContainer = getDefaultUserCardAvatar(avatar, href, "", deleted);
        userCard.prepend(avatarContainer);
    }
    const infoContainer = document.createElement("div");
    infoContainer.classList.add("s-user-card--info");
    const link = document.createElement(deleted ? "div" : "a");
    link.classList.add("s-user-card--link");
    link.innerHTML = name;
    if (link instanceof HTMLAnchorElement) {
        link.href = href;
    }
    const awards = getUserAwards(reputation);
    infoContainer.append(link, !deleted ? awards : "");
    const timeEl = document.createElement("time");
    timeEl.classList.add("s-user-card--time");
    timeEl.innerText = time;
    userCard.append(infoContainer, timeEl);
    return userCard;
};
exports.makeMinimalUserCard = makeMinimalUserCard;
/**
 * @summary Helper for getting the user awards `<li>`
 * @param {string} reputation The user's reputation
 * @param {AllUserCardOptions["user"]["badge"]} badges The user's badges
 * @returns {HTMLUListElement}
 */
const getUserAwards = (reputation, badges) => {
    const awards = document.createElement("ul");
    awards.classList.add("s-user-card--awards");
    const repContainer = document.createElement("li");
    repContainer.classList.add("s-user-card--rep");
    repContainer.innerHTML = reputation;
    awards.append(repContainer);
    if (badges) {
        const badgesEls = Object
            .entries(badges)
            .map(([color, count]) => {
            const badgeColor = color;
            return _1.Badges.makeBling("li", badgeColor, count.toString());
        });
        awards.append(...badgesEls);
    }
    return awards;
};
/**
 * @summary Helper for getting the user staff/admin/mod badges
 * @param {Required<AllUserCardOptions["user"]>["labels"]} labels badges configuration
 * @returns {HTMLSpanElement[]}
 */
const getLabelElements = (labels) => {
    return labels.map((config) => {
        var _a;
        (_a = config.classes) === null || _a === void 0 ? void 0 : _a.push("flex--item");
        if (!config.size) {
            // default badge size for full cards
            config.size = "xs";
        }
        return _1.Badges.makeStacksBadge(config);
    });
};
/**
 * @summary Helper for getting the default user avatar
 * @param {AllUserCardOptions["avatar"]} avatar avatar configuration
 * @param {string} defaultHref The default href to apply
 * @param {number} defaultSize The default size of the avatar
 * @param {boolean} deleted Whether the user is a deleted user
 * @returns {HTMLDivElement}
 */
const getDefaultUserCardAvatar = (config, defaultHref, defaultSize, deleted) => {
    var _a;
    (_a = config === null || config === void 0 ? void 0 : config.classes) === null || _a === void 0 ? void 0 : _a.push("s-user-card--avatar");
    if (config && !config.size && defaultSize) {
        // default size for base cards
        config.size = defaultSize;
    }
    if (config && !config.href) {
        config.href = defaultHref;
    }
    return _1.Avatar.makeAvatar(config, deleted ? "div" : "a");
};


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksButton = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/buttons/
 *
 * @summary creates a stacks button
 * @param {string} id id of the button
 * @param {string} text text of the button
 * @param {StacksIconButtonOptions} [options] configuration
 * @returns {HTMLButtonElement}
 */
const makeStacksButton = (id, text, options = {}) => {
    const { title, type = [], primary = false, loading = false, selected = false, disabled = false, badge, size, iconConfig, click, classes = [], } = options;
    const btn = document.createElement("button");
    btn.id = id;
    btn.textContent = text;
    btn.classList.add("s-btn", ...type.map((name) => `s-btn__${name}`), ...classes);
    btn.type = "button";
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", title || text);
    if (primary) {
        btn.classList.add("s-btn__primary");
    }
    if (loading) {
        btn.classList.add("is-loading");
    }
    if (title) {
        btn.title = title;
    }
    if (selected) {
        btn.classList.add("is-selected");
    }
    if (disabled) {
        btn.disabled = true;
    }
    if (badge) {
        const badgeEl = document.createElement("span");
        badgeEl.classList.add("s-btn--badge");
        const badgeNumber = document.createElement("span");
        badgeNumber.classList.add("s-btn--number");
        badgeNumber.textContent = badge.toString();
        badgeEl.append(badgeNumber);
        btn.append(" ", badgeEl);
    }
    if (size) {
        btn.classList.add(`s-btn__${size}`);
    }
    if (iconConfig) {
        btn.classList.add("s-btn__icon");
        const { name, path, width, height } = iconConfig;
        const [icon] = index_1.Icons.makeStacksIcon(name, path, { width, height });
        btn.prepend(icon, " ");
    }
    if (click) {
        const { handler, options } = click;
        btn.addEventListener("click", handler, options);
    }
    return btn;
};
exports.makeStacksButton = makeStacksButton;


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksIcon = exports.validationIcons = void 0;
exports.validationIcons = {
    warning: [
        "iconAlert",
        "M7.95 2.71c.58-.94 1.52-.94 2.1 0l7.69 12.58c.58.94.15 1.71-.96 1.71H1.22C.1 17-.32 16.23.26 15.29L7.95 2.71ZM8 6v5h2V6H8Zm0 7v2h2v-2H8Z"
    ],
    error: [
        "iconAlertCircle",
        "M9 17c-4.36 0-8-3.64-8-8 0-4.36 3.64-8 8-8 4.36 0 8 3.64 8 8 0 4.36-3.64 8-8 8ZM8 4v6h2V4H8Zm0 8v2h2v-2H8Z"
    ],
    success: [
        "iconCheckmark",
        "M16 4.41 14.59 3 6 11.59 2.41 8 1 9.41l5 5 10-10Z"
    ]
};
/**
 * @see https://stackoverflow.design/product/resources/icons/
 *
 * @summary makes Stacks icon
 * @param {string} name the name of the icon
 * @param {string} pathConfig the SVG's `path` attribute
 */
const makeStacksIcon = (name, pathConfig, { classes = [], width = 14, height = width } = {}) => {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.classList.add("svg-icon", name, ...classes);
    svg.setAttribute("width", width.toString());
    svg.setAttribute("height", height.toString());
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", pathConfig);
    svg.append(path);
    return [svg, path];
};
exports.makeStacksIcon = makeStacksIcon;


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeStacksModal = void 0;
const index_1 = __webpack_require__(8);
/**
 * @see https://stackoverflow.design/product/components/modals/
 *
 * @summary creates a Stacks modal
 * @param {string} id the id of the modal
 * @param {StacksModalOptions} options configuration
 * @returns {HTMLElement}
 */
const makeStacksModal = (id, options) => {
    const { classes = [], danger = false, fullscreen = false, celebratory = false, title: { text, id: titleId, classes: titleClasses = [] }, body: { bodyHtml, id: bodyId, classes: bodyClasses = [] }, footer: { buttons, classes: footerClasses = [] }, } = options;
    const modal = document.createElement("aside");
    modal.id = id;
    modal.classList.add("s-modal", ...classes);
    modal.setAttribute("role", "dialog");
    modal.setAttribute("data-controller", "s-modal");
    modal.setAttribute("data-s-modal-target", "modal");
    if (danger) {
        modal.classList.add("s-modal__danger");
    }
    if (celebratory) {
        modal.classList.add("s-modal__celebration");
    }
    const dialog = document.createElement("div");
    dialog.classList.add("s-modal--dialog");
    dialog.setAttribute("role", "document");
    if (fullscreen) {
        dialog.classList.add("s-modal__full");
    }
    const header = document.createElement("h1");
    header.classList.add("s-modal--header", ...titleClasses);
    header.append(text);
    if (titleId) {
        header.id = titleId;
        modal.setAttribute("aria-labelledby", titleId);
    }
    const body = document.createElement("p");
    body.classList.add("s-modal--body", ...bodyClasses);
    body.append(bodyHtml);
    if (bodyId) {
        body.id = bodyId;
        modal.setAttribute("aria-describedby", bodyId);
    }
    const footer = document.createElement("div");
    footer.classList.add("d-flex", "gx8", "s-modal--footer", ...footerClasses);
    buttons.forEach((button) => {
        const { element, hideOnClick } = button;
        element.classList.add("flex--item");
        if (hideOnClick) {
            element.setAttribute("data-action", "s-modal#hide");
        }
        footer.append(element);
    });
    const [iconClear] = index_1.Icons.makeStacksIcon("iconClear", "M15 4.41 13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9 15 4.41Z", { width: 18 });
    const close = document.createElement("button");
    close.classList.add("s-modal--close", "s-btn", "s-btn__muted");
    close.setAttribute("type", "button");
    close.setAttribute("aria-label", "Close");
    close.setAttribute("data-action", "s-modal#hide");
    close.append(iconClear);
    dialog.append(header, body, footer, close);
    modal.append(dialog);
    return modal;
};
exports.makeStacksModal = makeStacksModal;


/***/ }),
/* 35 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.showToast = exports.hideToast = exports.toggleToast = exports.makeStacksToast = void 0;
const index_1 = __webpack_require__(33);
/**
 * @see https://stackoverflow.design/product/components/notices/
 *
 * @summary builder for Stacks notifications
 * @param {string} id the toast id
 * @param {string} text the message text
 */
const makeStacksToast = (id, text, { buttons = [], classes = [], msgClasses = [], type = "none", important = false, } = {}) => {
    const wrap = document.createElement("div");
    wrap.classList.add("s-toast", ...classes);
    wrap.setAttribute("aria-hidden", "true");
    wrap.setAttribute("role", "alertdialog");
    wrap.setAttribute("aria-labelledby", "notice-message");
    wrap.id = id;
    const aside = document.createElement("aside");
    aside.classList.add("s-notice", "p8", "pl16");
    if (type !== "none")
        aside.classList.add(`s-notice__${type}`);
    if (important)
        aside.classList.add("s-notice__important");
    const msgWrap = document.createElement("div");
    msgWrap.classList.add("d-flex", "gx16", "ai-center", "jc-space-between", ...msgClasses);
    const message = document.createElement("div");
    message.classList.add("flex--item");
    message.textContent = text;
    const btnWrap = document.createElement("div");
    btnWrap.classList.add("d-flex");
    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.classList.add("s-btn", "s-notice--btn");
    dismissBtn.setAttribute("aria-label", "Dismiss");
    buttons.push(dismissBtn);
    const [dismissIcon] = (0, index_1.makeStacksIcon)("iconClearSm", "M12 3.41 10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41z");
    dismissBtn.append(dismissIcon);
    btnWrap.append(...buttons);
    msgWrap.append(message, btnWrap);
    aside.append(msgWrap);
    wrap.append(aside);
    return wrap;
};
exports.makeStacksToast = makeStacksToast;
/**
 * @summary toggles the Stacks toast visibility
 */
const toggleToast = (target, show) => {
    const toast = typeof target === "string" ? document.querySelector(target) : target;
    if (!toast)
        throw new ReferenceError(`missing toast: ${target}`);
    const isShown = (toast === null || toast === void 0 ? void 0 : toast.getAttribute("aria-hidden")) !== "true";
    toast.setAttribute("aria-hidden", (show !== void 0 ? !show : isShown).toString());
    return toast;
};
exports.toggleToast = toggleToast;
/**
 * @summary hides the Stacks toast
 */
const hideToast = (target, hideFor) => {
    const toast = (0, exports.toggleToast)(target, false);
    if (hideFor)
        setTimeout(() => (0, exports.showToast)(toast), hideFor * 1e3);
};
exports.hideToast = hideToast;
/**
 * @summary shows the Stacks toast
 */
const showToast = (target, showFor) => {
    const toast = (0, exports.toggleToast)(target, true);
    if (showFor)
        setTimeout(() => (0, exports.hideToast)(toast), showFor * 1e3);
};
exports.showToast = showToast;


/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupCommentsAndFlagsModal = exports.toggleHideIfNeeded = void 0;
const Store_1 = __webpack_require__(3);
const shared_1 = __webpack_require__(2);
const submit_1 = __webpack_require__(37);
const rows_1 = __webpack_require__(38);
const Configuration_1 = __webpack_require__(4);
const stacks_helpers_1 = __webpack_require__(8);
function toggleHideIfNeeded(parent) {
    var _a;
    const children = (_a = parent.firstElementChild) === null || _a === void 0 ? void 0 : _a.children;
    const shouldHide = [...children]
        .every(element => element.style.display === 'none');
    parent.style.display = shouldHide ? 'none' : 'block';
}
exports.toggleHideIfNeeded = toggleHideIfNeeded;
function getExpandableContent(flagType) {
    const content = [
        (0, rows_1.getCommentInputs)(flagType),
        (0, rows_1.getTextareas)(flagType),
        (0, rows_1.getSelectRow)(flagType),
        (0, rows_1.getRadioRow)(flagType)
    ].map(row => {
        const flexItem = (0, Configuration_1.wrapInFlexItem)(row);
        toggleHideIfNeeded(flexItem);
        return flexItem;
    });
    return content;
}
function expandableToggled(edit) {
    var _a, _b;
    const save = edit.previousElementSibling;
    const expandable = (_a = edit
        .closest('.s-card')) === null || _a === void 0 ? void 0 : _a.querySelector('.s-expandable');
    if (!save || !expandable)
        return;
    const isExpanded = expandable.classList.contains('is-expanded');
    const pencil = (0, shared_1.getIconPath)('iconPencil');
    const eyeOff = (0, shared_1.getIconPath)('iconEyeOff');
    const [svg, , text] = [...edit.childNodes];
    svg.classList.toggle('iconPencil');
    svg.classList.toggle('iconEyeOff');
    (_b = svg.firstElementChild) === null || _b === void 0 ? void 0 : _b.setAttribute('d', isExpanded ? eyeOff : pencil);
    text.textContent = isExpanded ? ' Hide' : 'Edit';
    isExpanded
        ? $(save).fadeIn('fast')
        : $(save).fadeOut('fast');
}
function getActionItems(flagId, enabled, expandableId) {
    const save = stacks_helpers_1.Buttons.makeStacksButton(`advanced-flagging-save-flagtype-${flagId}`, 'Save', {
        primary: true,
        classes: ['flex--item']
    });
    save.style.display = 'none';
    save.addEventListener('click', () => (0, submit_1.submitChanges)(save));
    const edit = stacks_helpers_1.Buttons.makeStacksButton(`advanced-flagging-edit-flagtype-${flagId}`, 'Edit', {
        iconConfig: {
            name: 'iconPencil',
            path: (0, shared_1.getIconPath)('iconPencil'),
            height: 18,
            width: 18
        },
        classes: ['flex--item']
    });
    edit.dataset.controller = 's-expandable-control';
    edit.setAttribute('aria-controls', expandableId);
    edit.addEventListener('s-expandable-control:hide', () => expandableToggled(edit));
    edit.addEventListener('s-expandable-control:show', () => expandableToggled(edit));
    const remove = stacks_helpers_1.Buttons.makeStacksButton(`advanced-flagging-remove-flagtype-${flagId}`, 'Remove', {
        type: ['danger'],
        iconConfig: {
            name: 'iconTrash',
            path: (0, shared_1.getIconPath)('iconTrash'),
            width: 18,
            height: 18
        },
        classes: ['flex--item']
    });
    remove.addEventListener('click', () => {
        const wrapper = remove.closest('.s-card');
        const flagId = Number(wrapper.dataset.flagId);
        const index = shared_1.cachedFlagTypes.findIndex(({ id }) => id === flagId);
        shared_1.cachedFlagTypes.splice(index, 1);
        (0, shared_1.updateFlagTypes)();
        $(wrapper).fadeOut('fast', () => {
            const category = wrapper.parentElement;
            wrapper.remove();
            if ((category === null || category === void 0 ? void 0 : category.childElementCount) === 1) {
                $(category).fadeOut('fast', () => category.remove());
            }
        });
        (0, shared_1.displayStacksToast)('Successfully removed flag type', 'success', true);
    });
    const toggle = stacks_helpers_1.Toggle.makeStacksToggle(`advanced-flagging-toggle-flagtype-${flagId}`, { text: '' }, enabled).querySelector('.s-toggle-switch');
    toggle.addEventListener('change', () => {
        const wrapper = toggle.closest('.s-card');
        const flagId = Number(wrapper === null || wrapper === void 0 ? void 0 : wrapper.dataset.flagId);
        const current = (0, shared_1.getFlagTypeFromFlagId)(flagId);
        if (!current) {
            (0, shared_1.displayStacksToast)('Failed to toggle flag type', 'danger', true);
            return;
        }
        current.enabled = toggle.checked;
        (0, shared_1.updateFlagTypes)();
        wrapper === null || wrapper === void 0 ? void 0 : wrapper.classList.toggle('s-card__muted');
        (0, shared_1.displayStacksToast)(`Successfully ${toggle.checked ? 'en' : 'dis'}abled flag type`, 'success', true);
    });
    return [save, edit, remove, toggle];
}
function createFlagTypeDiv(flagType) {
    const { id, displayName, enabled, } = flagType;
    const card = document.createElement('div');
    card.dataset.flagId = id.toString();
    card.classList.add('s-card', 'bs-sm', 'py4');
    if (!enabled) {
        card.classList.add('s-card__muted');
    }
    const idedName = displayName.toLowerCase().replace(/\s/g, '');
    const expandableId = `advanced-flagging-${id}-${idedName}`;
    const content = document.createElement('div');
    content.classList.add('d-flex', 'ai-center', 'sm:fd-column', 'sm:ai-start');
    const h3 = document.createElement('h3');
    h3.classList.add('mb0', 'mr-auto', 'fs-body3');
    h3.innerText = displayName;
    const actions = document.createElement('div');
    actions.classList.add('d-flex', 'g8', 'ai-center');
    actions.append(...getActionItems(id, enabled, expandableId));
    content.append(h3, actions);
    const expandableContent = getExpandableContent(flagType);
    const expandable = document.createElement('div');
    expandable.classList.add('s-expandable');
    expandable.id = expandableId;
    const expandableDiv = document.createElement('div');
    expandableDiv.classList.add('s-expandable--content', 'd-flex', 'fd-column', 'g16', 'py12');
    expandableDiv.append(...expandableContent);
    expandable.append(expandableDiv);
    card.append(content, expandable);
    return card;
}
function createCategoryDiv(displayName) {
    const container = document.createElement('div');
    container.classList.add('flex--item');
    const header = document.createElement('h2');
    header.classList.add('ta-center', 'mb8', 'fs-title');
    header.innerHTML = displayName;
    container.append(header);
    return container;
}
function getCommentsModalBody() {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'g16');
    const categories = shared_1.cachedCategories
        .filter(({ name }) => name)
        .map(({ name }) => {
        const div = createCategoryDiv(name || '');
        const flagTypes = shared_1.cachedFlagTypes
            .filter(({ belongsTo: BelongsTo }) => BelongsTo === name)
            .map(flagType => createFlagTypeDiv(flagType));
        div.append(...flagTypes);
        return div;
    })
        .filter(element => element.childElementCount > 1);
    container.append(...categories);
    return container;
}
function resetFlagTypes() {
    Store_1.Store.unset(shared_1.Cached.FlagTypes);
    (0, Configuration_1.cacheFlags)();
    (0, shared_1.displayStacksToast)('Comments and flags have been reset to defaults', 'success');
    setTimeout(() => window.location.reload(), 500);
}
function setupCommentsAndFlagsModal() {
    var _a;
    const modal = stacks_helpers_1.Modals.makeStacksModal('advanced-flagging-comments-modal', {
        title: {
            text: 'AdvancedFlagging: edit comments and flags',
        },
        body: {
            bodyHtml: getCommentsModalBody()
        },
        footer: {
            buttons: [
                {
                    element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-comments-modal-done', 'I\'m done!', { primary: true }),
                    hideOnClick: true
                },
                {
                    element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-comments-modal-cancel', 'Cancel'),
                    hideOnClick: true
                },
                {
                    element: stacks_helpers_1.Buttons.makeStacksButton('advanced-flagging-configuration-modal-reset', 'Reset', {
                        type: ['danger'],
                        click: {
                            handler: resetFlagTypes
                        }
                    }),
                }
            ]
        },
        fullscreen: true,
    });
    (_a = modal.firstElementChild) === null || _a === void 0 ? void 0 : _a.classList.add('w80', 'sm:w100', 'md:w100');
    document.body.append(modal);
}
exports.setupCommentsAndFlagsModal = setupCommentsAndFlagsModal;


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.submitChanges = void 0;
const shared_1 = __webpack_require__(2);
function saveTextareaContent(expandable, flagType) {
    const [flag, low, high] = [
        'text-modflag',
        'comment-lowrep',
        'comment-highrep'
    ]
        .map(id => expandable.querySelector(`[id*="${id}"]`))
        .map(textarea => (textarea === null || textarea === void 0 ? void 0 : textarea.offsetParent) ? textarea.value : '');
    flagType.flagText = flag;
    if (low) {
        flagType.comments = { low, high };
    }
}
function saveReportType(expandable, flagType) {
    const select = expandable.querySelector('select');
    const newReportType = select === null || select === void 0 ? void 0 : select.value;
    if (newReportType === 'PostOther') {
        (0, shared_1.displayStacksToast)('This type of flag cannot be raised with this option', 'danger', true);
    }
    else {
        flagType.reportType = newReportType;
    }
}
function saveSwfr(expandable, flagType, flagId) {
    const swfrBox = expandable.querySelector('[id*="-send-when-flag-raised-"');
    const sendFeedback = (swfrBox === null || swfrBox === void 0 ? void 0 : swfrBox.checked) || false;
    flagType.sendWhenFlagRaised = sendFeedback;
    const similar = shared_1.cachedFlagTypes.find(item => item.sendWhenFlagRaised
        && item.reportType === flagType.reportType
        && item.id !== flagId);
    if (!similar || !sendFeedback)
        return;
    similar.sendWhenFlagRaised = false;
    const similarEl = document.querySelector(`[id*="-send-when-flag-raised-${similar.id}"]`);
    if (similarEl) {
        similarEl.checked = false;
    }
}
function saveDownvote(expandable, flagType) {
    const downvote = expandable.querySelector('[id*="-downvote-post-"');
    flagType.downvote = (downvote === null || downvote === void 0 ? void 0 : downvote.checked) || false;
}
function saveFeedbacks(expandable, flagType) {
    const feedbacks = [
        'Smokey',
        'Natty',
        'Guttenberg',
        'Generic Bot'
    ]
        .map(name => {
        const selector = `[name*="-feedback-to-${name.replace(/\s/g, '-')}"]:checked`;
        const radio = expandable.querySelector(`.s-radio${selector}`);
        const feedback = (radio === null || radio === void 0 ? void 0 : radio.dataset.feedback) || '';
        return [name, feedback];
    });
    flagType.feedbacks = Object.fromEntries(feedbacks);
}
function submitChanges(element) {
    const wrapper = element.closest('.s-card');
    const expandable = wrapper === null || wrapper === void 0 ? void 0 : wrapper.querySelector('.s-expandable');
    const flagId = Number(wrapper === null || wrapper === void 0 ? void 0 : wrapper.dataset.flagId);
    if (!flagId || !wrapper || !expandable) {
        (0, shared_1.displayStacksToast)('Failed to save options', 'danger', true);
        return;
    }
    const invalids = [...wrapper.querySelectorAll('textarea.is-invalid')]
        .filter(textarea => textarea.offsetParent !== null);
    if (invalids.length) {
        $(invalids).fadeOut(100).fadeIn(100);
        (0, shared_1.displayStacksToast)('One or more of the textareas are invalid', 'danger', true);
        return;
    }
    const flagType = (0, shared_1.getFlagTypeFromFlagId)(flagId);
    if (!flagType) {
        (0, shared_1.displayStacksToast)('Failed to save options', 'danger', true);
        return;
    }
    saveTextareaContent(expandable, flagType);
    saveReportType(expandable, flagType);
    saveSwfr(expandable, flagType, flagId);
    saveDownvote(expandable, flagType);
    saveFeedbacks(expandable, flagType);
    (0, shared_1.updateFlagTypes)();
    const hideButton = element.nextElementSibling;
    hideButton.click();
    (0, shared_1.displayStacksToast)('Content saved successfully', 'success', true);
}
exports.submitChanges = submitChanges;


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getRadioRow = exports.getSelectRow = exports.getTextareas = exports.getCommentInputs = void 0;
const shared_1 = __webpack_require__(2);
const FlagTypes_1 = __webpack_require__(5);
const Configuration_1 = __webpack_require__(4);
const main_1 = __webpack_require__(36);
const stacks_helpers_1 = __webpack_require__(8);
const flagTypes = FlagTypes_1.flagCategories.flatMap(({ FlagTypes }) => FlagTypes);
const flagNames = [...new Set(flagTypes.map(({ reportType }) => reportType))];
function getCharSpan(textarea, contentType) {
    const content = textarea.value;
    const minCharacters = contentType === 'flag' ? 10 : 15;
    const maxCharacters = contentType === 'flag' ? 500 : 600;
    const charCount = content.length;
    const diff = Math.abs(charCount - maxCharacters);
    const pluralS = diff !== 1 ? 's' : '';
    let spanText;
    if (charCount === 0)
        spanText = `Enter at least ${minCharacters} characters`;
    else if (charCount < minCharacters)
        spanText = `${minCharacters - charCount} more to go...`;
    else if (charCount > maxCharacters)
        spanText = `Too long by ${diff} character${pluralS}`;
    else
        spanText = `${diff} character${pluralS} left`;
    let classname;
    if (charCount > maxCharacters)
        classname = 'fc-red-400';
    else if (diff >= maxCharacters * 3 / 5)
        classname = 'cool';
    else if (diff >= maxCharacters * 2 / 5)
        classname = 'warm';
    else if (diff >= maxCharacters / 5)
        classname = 'hot';
    else
        classname = 'supernova';
    const isInvalid = classname === 'fc-red-400' || /more|at least/.test(spanText);
    textarea.classList[isInvalid ? 'add' : 'remove']('is-invalid');
    const span = document.createElement('span');
    span.classList.add('ml-auto', classname);
    span.innerText = spanText;
    return span;
}
function toggleTextarea(element, comment, type) {
    var _a, _b, _c;
    const wrapper = (_b = (_a = element
        .closest('.s-card')) === null || _a === void 0 ? void 0 : _a.querySelector(`[id*="-comment-${comment}rep"]`)) === null || _b === void 0 ? void 0 : _b.closest('div.flex--item');
    if (!wrapper)
        return;
    const row = (_c = wrapper
        .parentElement) === null || _c === void 0 ? void 0 : _c.parentElement;
    if (type === 'In') {
        row.style.display = 'block';
    }
    $(wrapper)[`fade${type}`](400, () => {
        (0, main_1.toggleHideIfNeeded)(row);
    });
}
function getCommentInputs({ id, comments }) {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'ai-center', 'g16');
    const toggleContainer = document.createElement('div');
    toggleContainer.classList.add('flex--item');
    const toggle = stacks_helpers_1.Toggle.makeStacksToggle(`advanced-flagging-comments-toggle-${id}`, { text: 'Leave comment' }, Boolean(comments === null || comments === void 0 ? void 0 : comments.low));
    toggleContainer.append(toggle);
    const [, checkbox] = stacks_helpers_1.Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-toggle-highrep-${id}`,
            labelConfig: {
                text: 'Add a different comment for high reputation users'
            },
            selected: Boolean(comments === null || comments === void 0 ? void 0 : comments.high),
            disabled: !(comments === null || comments === void 0 ? void 0 : comments.low),
        },
    ]);
    checkbox.classList.add('fs-body2', 'pt1');
    const toggleInput = toggle.querySelector('input');
    const cbInput = checkbox.querySelector('input');
    toggleInput.addEventListener('change', () => {
        const cbInput = checkbox.querySelector('input');
        cbInput.disabled = !toggleInput.checked;
        if (toggleInput.checked) {
            toggleTextarea(toggleInput, 'low', 'In');
            if (cbInput.checked) {
                toggleTextarea(toggleInput, 'high', 'In');
            }
            checkbox.classList.remove('is-disabled');
        }
        else {
            toggleTextarea(toggleInput, 'low', 'Out');
            toggleTextarea(toggleInput, 'high', 'Out');
            checkbox.classList.add('is-disabled');
        }
    });
    cbInput.addEventListener('change', () => {
        var _a;
        toggleTextarea(cbInput, 'high', cbInput.checked ? 'In' : 'Out');
        const lowLabel = (_a = cbInput
            .closest('.s-card')) === null || _a === void 0 ? void 0 : _a.querySelector('label[for*="-comment-lowrep-"]');
        lowLabel.innerText = cbInput.checked
            ? 'Comment text for low reputation users'
            : 'Comment text';
    });
    container.append(toggleContainer, (0, Configuration_1.wrapInFlexItem)(checkbox));
    return container;
}
exports.getCommentInputs = getCommentInputs;
function getTextareas({ id, flagText, comments }) {
    const flag = stacks_helpers_1.Textarea.makeStacksTextarea(`advanced-flagging-text-modflag-${id}`, { value: flagText }, { text: 'Flag text' });
    const lowRep = stacks_helpers_1.Textarea.makeStacksTextarea(`advanced-flagging-comment-lowrep-${id}`, { value: comments === null || comments === void 0 ? void 0 : comments.low }, { text: 'Comment text' + ((comments === null || comments === void 0 ? void 0 : comments.high) ? ' for low reputation users' : '') });
    const highRep = stacks_helpers_1.Textarea.makeStacksTextarea(`advanced-flagging-comment-highrep-${id}`, { value: comments === null || comments === void 0 ? void 0 : comments.high }, { text: 'Comment text for high reputation users' });
    const wrappers = [flag, lowRep, highRep].map(element => {
        const textarea = element.querySelector('textarea');
        textarea.classList.add('fs-body2');
        textarea.rows = 4;
        const contentType = textarea.id.includes('comment')
            ? 'comment'
            : 'flag';
        const charsLeft = getCharSpan(textarea, contentType);
        textarea.insertAdjacentElement('afterend', charsLeft);
        textarea.addEventListener('keyup', function () {
            var _a;
            const newCharsLeft = getCharSpan(this, contentType);
            (_a = this.nextElementSibling) === null || _a === void 0 ? void 0 : _a.replaceWith(newCharsLeft);
        });
        const wrapper = (0, Configuration_1.wrapInFlexItem)(element);
        wrapper.style.display = textarea.value
            ? 'block'
            : 'none';
        return wrapper;
    });
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gsy', 'gs16');
    container.append(...wrappers);
    return container;
}
exports.getTextareas = getTextareas;
function getFlagSelect(id, reportType) {
    var _a;
    const options = flagNames.map(flagName => {
        return {
            value: flagName,
            text: (0, shared_1.getHumanFromDisplayName)(flagName) || '(none)',
            selected: flagName === reportType
        };
    });
    const select = stacks_helpers_1.Select.makeStacksSelect(`advanced-flagging-select-flag-${id}`, options, { disabled: reportType === 'PostOther' });
    select.className = 'd-flex ai-center';
    const sSelect = select.querySelector('.s-select');
    sSelect.style.right = '35px';
    (_a = select.querySelector('select')) === null || _a === void 0 ? void 0 : _a.classList.add('pl48');
    const flagLabel = document.createElement('label');
    flagLabel.classList.add('fw-bold', 'ps-relative', 'z-selected', 'l12', 'fs-body1', 'flex--item');
    flagLabel.innerText = 'Flag:';
    if (reportType === 'PostOther') {
        flagLabel.classList.add('o50');
    }
    return [flagLabel, select];
}
function getSelectRow({ id, sendWhenFlagRaised, downvote, reportType }) {
    const [label, select] = getFlagSelect(id, reportType);
    const [, feedback] = stacks_helpers_1.Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-send-when-flag-raised-${id}`,
            labelConfig: {
                text: 'Send feedback from this flag type when this flag is raised'
            },
            selected: sendWhenFlagRaised
        }
    ]);
    const [, downvoteBox] = stacks_helpers_1.Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-downvote-post-${id}`,
            labelConfig: {
                text: 'Downvote post'
            },
            selected: downvote
        },
    ]);
    const container = document.createElement('div');
    container.classList.add('d-flex', 'ai-center', 'gsx', 'gs6');
    container.append(label, select, (0, Configuration_1.wrapInFlexItem)(downvoteBox));
    if (!(0, Configuration_1.isModOrNoFlag)(reportType)) {
        container.append((0, Configuration_1.wrapInFlexItem)(feedback));
    }
    return container;
}
exports.getSelectRow = getSelectRow;
function getRadiosForBot(botName, currentFeedback, flagId) {
    const feedbacks = shared_1.possibleFeedbacks[botName];
    const idedName = botName.replace(/\s/g, '-');
    const name = `advanced-flagging-${flagId}-feedback-to-${idedName}`;
    const config = feedbacks.map(feedback => {
        return {
            id: `advanced-flagging-${idedName}-feedback-${feedback}-${flagId}`,
            labelConfig: {
                text: feedback || '(none)',
            },
            selected: feedback === currentFeedback
        };
    });
    const [fieldset] = stacks_helpers_1.Radio.makeStacksRadios(config, name, {
        horizontal: true,
        classes: ['fs-body2']
    });
    fieldset.querySelectorAll('input').forEach(radio => {
        const [feedback] = radio.id.split('-').slice(-2, -1);
        radio.dataset.feedback = feedback;
    });
    const description = document.createElement('div');
    description.classList.add('flex--item');
    description.innerText = `Feedback to ${botName}:`;
    fieldset.prepend(description);
    return fieldset;
}
function getRadioRow({ id, feedbacks }) {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gsy', 'gs4');
    const feedbackRadios = Object
        .keys(shared_1.possibleFeedbacks)
        .map(item => {
        const botName = item;
        return getRadiosForBot(botName, feedbacks[botName], id);
    })
        .map(checkbox => (0, Configuration_1.wrapInFlexItem)(checkbox));
    container.append(...feedbackRadios);
    return container;
}
exports.getRadioRow = getRadioRow;


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.makeMenu = exports.createPopoverToOption = void 0;
const shared_1 = __webpack_require__(2);
const AdvancedFlagging_1 = __webpack_require__(0);
const MetaSmokeAPI_1 = __webpack_require__(7);
const stacks_helpers_1 = __webpack_require__(8);
const noneSpan = document.createElement('span');
noneSpan.classList.add('o50');
noneSpan.innerText = '(none)';
function increaseTooltipWidth(menu) {
    [...menu.querySelectorAll('li')]
        .filter(li => { var _a; return (_a = li.firstElementChild) === null || _a === void 0 ? void 0 : _a.classList.contains('s-block-link'); })
        .map(reportLink => reportLink.nextElementSibling)
        .forEach(tooltip => {
        var _a;
        const textLength = (_a = tooltip === null || tooltip === void 0 ? void 0 : tooltip.textContent) === null || _a === void 0 ? void 0 : _a.length;
        if (!textLength)
            return;
        tooltip.classList.add(textLength > 100
            ? 'wmn5'
            : 'wmn2');
    });
}
function canSendFeedback(botName, feedback, reporters, postDeleted) {
    const { Guttenberg: copypastor, Natty: natty, Smokey: metasmoke } = reporters;
    const smokeyId = metasmoke === null || metasmoke === void 0 ? void 0 : metasmoke.getSmokeyId();
    const smokeyDisabled = MetaSmokeAPI_1.MetaSmokeAPI.isDisabled;
    const { copypastorId } = copypastor || {};
    const nattyReported = (natty === null || natty === void 0 ? void 0 : natty.wasReported()) || false;
    const nattyCanReport = (natty === null || natty === void 0 ? void 0 : natty.canBeReported()) || false;
    switch (botName) {
        case 'Natty':
            return (nattyReported
                && !postDeleted) || (nattyCanReport
                && feedback === 'tp');
        case 'Smokey':
            return Boolean(smokeyId) || (feedback === 'tpu-'
                && !postDeleted
                && !smokeyDisabled);
        case 'Guttenberg':
            return Boolean(copypastorId);
        case 'Generic Bot':
            return feedback === 'track' && !postDeleted && shared_1.isStackOverflow;
    }
}
function getFeedbackSpans(flagType, reporters, postDeleted) {
    const { Natty: natty, Smokey: metasmoke } = reporters;
    const smokeyId = metasmoke === null || metasmoke === void 0 ? void 0 : metasmoke.getSmokeyId();
    const nattyReported = (natty === null || natty === void 0 ? void 0 : natty.wasReported()) || false;
    const spans = Object.entries(flagType.feedbacks)
        .filter(([, feedback]) => feedback)
        .filter(([botName, feedback]) => {
        return canSendFeedback(botName, feedback, reporters, postDeleted);
    })
        .map(([botName, feedback]) => {
        const feedbackSpan = document.createElement('span');
        const strong = document.createElement('b');
        feedbackSpan.append(strong);
        if (feedback === 'track') {
            strong.innerText = 'track';
            feedbackSpan.append(' with Generic Bot');
            return feedbackSpan;
        }
        const [isGreen, isRed, isYellow] = [/tp/, /fp/, /naa|ne/].map(regex => regex.test(feedback));
        let className = '';
        if (isGreen)
            className = 'success';
        else if (isRed)
            className = 'danger';
        else if (isYellow)
            className = 'warning';
        const shouldReport = (botName === 'Smokey' && !smokeyId)
            || (botName === 'Natty' && !nattyReported);
        strong.classList.add(`fc-${className}`);
        strong.innerHTML = shouldReport ? 'report' : feedback;
        feedbackSpan.append(` to ${botName}`);
        return feedbackSpan;
    }).filter(String);
    return spans.length
        ? spans
        : [noneSpan];
}
async function handleReportLinkClick(post, reporters, flagType, flagText) {
    var _a;
    const { deleted, element } = post;
    const dropdown = element.querySelector('.advanced-flagging-popover');
    if (!dropdown)
        return;
    $(dropdown).fadeOut('fast');
    if (!deleted) {
        let comment = getCommentText(post, flagType);
        const leaveComment = (_a = dropdown.querySelector('[id*="-leave-comment-checkbox-"]')) === null || _a === void 0 ? void 0 : _a.checked;
        if (!leaveComment && comment) {
            (0, AdvancedFlagging_1.upvoteSameComments)(element, comment);
            comment = null;
        }
        const [flag, downvote] = [
            'flag',
            'downvote'
        ]
            .map(type => {
            var _a, _b;
            return (_b = (_a = dropdown.querySelector(`[id*="-${type}-checkbox-"]`)) === null || _a === void 0 ? void 0 : _a.checked) !== null && _b !== void 0 ? _b : false;
        });
        await (0, AdvancedFlagging_1.handleActions)(post, flagType, flag, downvote, flagText, comment);
    }
    const success = await (0, AdvancedFlagging_1.handleFlag)(flagType, reporters, post);
    const { done, failed } = post;
    const { reportType, displayName } = flagType;
    if (reportType !== 'NoFlag')
        return;
    if (success) {
        (0, shared_1.attachPopover)(done, `Performed action ${displayName}`);
        $(done).fadeIn();
    }
    else {
        (0, shared_1.attachPopover)(failed, `Failed to perform action ${displayName}`);
        $(failed).fadeIn();
    }
}
function createPopoverToOption(boldText, value) {
    if (!value)
        return;
    const wrapper = document.createElement('li');
    const bold = document.createElement('strong');
    bold.innerHTML = `${boldText}: `;
    wrapper.append(bold);
    if (Array.isArray(value)) {
        wrapper.append(...value);
    }
    else {
        wrapper.append(value || noneSpan);
    }
    return wrapper;
}
exports.createPopoverToOption = createPopoverToOption;
function getTooltipHtml(reporters, flagType, post, flagText) {
    const { deleted, raiseVlq } = post;
    const { reportType, downvote } = flagType;
    const feedbackText = getFeedbackSpans(flagType, reporters, deleted)
        .map(span => span.outerHTML)
        .join(', ');
    const feedbacks = document.createElement('span');
    feedbacks.innerHTML = feedbackText;
    const tooltipFlagText = deleted ? '' : flagText;
    const commentText = getCommentText(post, flagType);
    const tooltipCommentText = (deleted ? '' : commentText) || '';
    const flagName = (0, AdvancedFlagging_1.getFlagToRaise)(reportType, raiseVlq);
    let reportTypeHuman = reportType === 'NoFlag' || !deleted
        ? (0, shared_1.getHumanFromDisplayName)(flagName)
        : '';
    if (reportType !== flagName) {
        reportTypeHuman += ' (VLQ criteria weren\'t met)';
    }
    const popoverParent = document.createElement('div');
    Object.entries({
        'Flag': reportTypeHuman,
        'Comment': tooltipCommentText,
        'Flag text': tooltipFlagText,
        'Feedbacks': feedbacks
    })
        .filter(([, value]) => value)
        .map(([boldText, value]) => createPopoverToOption(boldText, value))
        .filter(Boolean)
        .forEach(element => popoverParent.append(element));
    const downvoteWrapper = document.createElement('li');
    const downvoteOrNot = downvote
        ? '<b>Downvotes</b>'
        : 'Does <b>not</b> downvote';
    downvoteWrapper.innerHTML = `${downvoteOrNot} the post`;
    popoverParent.append(downvoteWrapper);
    return popoverParent.innerHTML;
}
function getCommentText({ opReputation, opName }, { comments }) {
    const { addAuthorName: AddAuthorName } = shared_1.cachedConfiguration;
    const commentType = (opReputation || 0) > 50 ? 'high' : 'low';
    const comment = (comments === null || comments === void 0 ? void 0 : comments[commentType]) || (comments === null || comments === void 0 ? void 0 : comments.low);
    return (comment && AddAuthorName
        ? `${opName}, ${comment[0].toLowerCase()}${comment.slice(1)}`
        : comment) || null;
}
function getReportLinks(reporters, post) {
    const { postType } = post;
    const { Guttenberg: copypastor, } = reporters;
    const { copypastorId, repost, targetUrl } = copypastor || {};
    const categories = shared_1.cachedCategories
        .filter(item => { var _a; return (_a = item.appliesTo) === null || _a === void 0 ? void 0 : _a.includes(postType); })
        .map(item => ({ ...item, FlagTypes: [] }));
    shared_1.cachedFlagTypes
        .filter(({ reportType, displayName, belongsTo, enabled }) => {
        const isGuttenbergItem = reportType === shared_1.FlagNames.ModFlag;
        const showGutReport = Boolean(copypastorId)
            && (displayName === 'Duplicate Answer' ? repost : !repost);
        const showOnSo = ['Red flags', 'General'].includes(belongsTo) || shared_1.isStackOverflow;
        return enabled && (isGuttenbergItem ? showGutReport : showOnSo);
    })
        .forEach(flagType => {
        const { belongsTo } = flagType;
        const category = categories.find(({ name: Name }) => belongsTo === Name);
        category === null || category === void 0 ? void 0 : category.FlagTypes.push(flagType);
    });
    return categories
        .filter(category => category.FlagTypes.length)
        .flatMap(category => {
        const { isDangerous } = category;
        const mapped = category.FlagTypes.flatMap(flagType => {
            const { displayName } = flagType;
            const flagText = copypastorId && targetUrl
                ? (0, shared_1.getFullFlag)(flagType, targetUrl, copypastorId)
                : '';
            const tooltipHtml = getTooltipHtml(reporters, flagType, post, flagText);
            const classes = isDangerous
                ? ['fc-red-500']
                : '';
            return {
                text: displayName,
                blockLink: { selected: false },
                ...(classes ? { classes } : {}),
                click: {
                    handler: function () {
                        void handleReportLinkClick(post, reporters, flagType, flagText);
                    }
                },
                popover: {
                    html: tooltipHtml,
                    position: 'right-start'
                }
            };
        });
        return [...mapped, { separatorType: 'divider' }];
    });
}
function getOptionsRow({ element, postId }) {
    const comments = element.querySelector('.comment-body');
    const config = [
        ['Leave comment', shared_1.Cached.Configuration.defaultNoComment],
        ['Flag', shared_1.Cached.Configuration.defaultNoFlag],
        ['Downvote', shared_1.Cached.Configuration.defaultNoDownvote]
    ];
    return config
        .filter(([text]) => text === 'Leave comment' ? shared_1.isStackOverflow : true)
        .map(([text, cacheKey]) => {
        const uncheck = shared_1.cachedConfiguration[cacheKey]
            || (text === 'Leave comment' && comments);
        const idified = text.toLowerCase().replace(' ', '-');
        const id = `advanced-flagging-${idified}-checkbox-${postId}`;
        return {
            checkbox: {
                id,
                labelConfig: {
                    text,
                    classes: ['pt1', 'fs-body1']
                },
                selected: !uncheck
            }
        };
    });
}
function getSendFeedbackToRow(reporters, { postId }) {
    return Object.entries(reporters)
        .filter(([bot, instance]) => {
        switch (bot) {
            case 'Natty':
                return instance.wasReported() || instance.canBeReported();
            case 'Guttenberg':
                return instance.copypastorId;
            case 'Generic Bot':
                return shared_1.isStackOverflow;
            case 'Smokey':
                return !MetaSmokeAPI_1.MetaSmokeAPI.isDisabled;
        }
    })
        .map(([botName]) => {
        const cacheKey = (0, shared_1.getCachedConfigBotKey)(botName);
        const sanitised = botName.replace(/\s/g, '').toLowerCase();
        const botImage = (0, AdvancedFlagging_1.createBotIcon)(botName);
        const botNameId = `advanced-flagging-send-feedback-to-${sanitised}-${postId}`;
        const defaultNoCheck = shared_1.cachedConfiguration[cacheKey];
        const imageClone = botImage.cloneNode(true);
        return {
            checkbox: {
                id: botNameId,
                labelConfig: {
                    text: `Feedback to ${imageClone.outerHTML}`,
                    classes: ['fs-body1']
                },
                selected: !defaultNoCheck,
            },
            checkboxOptions: {
                classes: ['px6']
            },
            popover: {
                html: `Send feedback to ${botName}`,
                position: 'right-start'
            }
        };
    });
}
function makeMenu(reporters, post) {
    const actionBoxes = getOptionsRow(post);
    const menu = stacks_helpers_1.Menu.makeMenu({
        itemsType: 'a',
        navItems: [
            ...getReportLinks(reporters, post),
            ...actionBoxes,
            { separatorType: 'divider' },
            ...getSendFeedbackToRow(reporters, post)
        ],
    });
    const arrow = document.createElement('div');
    arrow.classList.add('s-popover--arrow', 's-popover--arrow__tc');
    menu.prepend(arrow);
    setTimeout(() => increaseTooltipWidth(menu));
    return menu;
}
exports.makeMenu = makeMenu;


/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupReview = void 0;
const shared_1 = __webpack_require__(2);
const AdvancedFlagging_1 = __webpack_require__(0);
const sotools_1 = __webpack_require__(1);
const MetaSmokeAPI_1 = __webpack_require__(7);
const CopyPastorAPI_1 = __webpack_require__(41);
const NattyApi_1 = __webpack_require__(43);
const reviewPostsInformation = [];
function getPostIdFromReview() {
    const answer = document.querySelector('[id^="answer-"]');
    const id = answer === null || answer === void 0 ? void 0 : answer.id.split('-')[1];
    return Number(id);
}
function addBotIconsToReview(post) {
    var _a;
    const { postType, element, postId, questionTime, answerTime, deleted } = post;
    if (postType !== 'Answer')
        return;
    const reporters = {
        Natty: new NattyApi_1.NattyAPI(postId, questionTime, answerTime, deleted),
        Smokey: new MetaSmokeAPI_1.MetaSmokeAPI(postId, postType, deleted),
        Guttenberg: new CopyPastorAPI_1.CopyPastorAPI(postId)
    };
    const iconLocation = (_a = element
        .querySelector('.js-post-menu')) === null || _a === void 0 ? void 0 : _a.firstElementChild;
    const icons = Object.values(reporters)
        .map(reporter => reporter.icon)
        .filter(Boolean);
    iconLocation === null || iconLocation === void 0 ? void 0 : iconLocation.append(...icons);
    reviewPostsInformation.push({ postId, post, reporters });
}
function setupReview() {
    const watchReview = shared_1.cachedConfiguration[shared_1.Cached.Configuration.watchQueues];
    if (!watchReview)
        return;
    const regex = /\/review\/(next-task|task-reviewed\/)/;
    (0, shared_1.addXHRListener)(xhr => {
        var _a;
        if (xhr.status !== 200
            || !regex.test(xhr.responseURL)
            || !document.querySelector('#answer'))
            return;
        const reviewResponse = JSON.parse(xhr.responseText);
        if (reviewResponse.isAudit
            || reviewResponse.postTypeId !== 2)
            return;
        const cachedPost = (_a = reviewPostsInformation
            .find(item => item.postId === reviewResponse.postId)) === null || _a === void 0 ? void 0 : _a.post;
        cachedPost
            ? addBotIconsToReview(cachedPost)
            : (0, sotools_1.parseQuestionsAndAnswers)(addBotIconsToReview);
    });
    $(document).on('click', '.js-review-submit', () => {
        const looksGood = document.querySelector('#review-action-LooksGood');
        if (!(looksGood === null || looksGood === void 0 ? void 0 : looksGood.checked))
            return;
        const postId = getPostIdFromReview();
        const reviewCachedInfo = reviewPostsInformation
            .find(item => item.postId === postId);
        const flagType = shared_1.cachedFlagTypes
            .find(({ displayName }) => displayName === 'Looks Fine');
        if (!reviewCachedInfo || !flagType)
            return;
        void (0, AdvancedFlagging_1.handleFlag)(flagType, reviewCachedInfo.reporters);
    });
    (0, shared_1.addXHRListener)(xhr => {
        const regex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
        if (xhr.status !== 200
            || !regex.test(xhr.responseURL)
            || !document.querySelector('#answer'))
            return;
        const postId = getPostIdFromReview();
        const cached = reviewPostsInformation
            .find(item => item.postId === postId);
        if (!cached)
            return;
        const { postType, questionTime, answerTime, deleted } = cached.post;
        if (postType !== 'Answer')
            return;
        const reportersArray = {
            Natty: new NattyApi_1.NattyAPI(postId, questionTime, answerTime, deleted)
        };
        const flagType = shared_1.cachedFlagTypes
            .find(({ displayName }) => displayName === 'Not an answer');
        if (!flagType)
            return;
        void (0, AdvancedFlagging_1.handleFlag)(flagType, reportersArray);
    });
}
exports.setupReview = setupReview;


/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CopyPastorAPI = void 0;
const ChatApi_1 = __webpack_require__(42);
const shared_1 = __webpack_require__(2);
const sotools_1 = __webpack_require__(1);
const AdvancedFlagging_1 = __webpack_require__(0);
const copypastorServer = 'https://copypastor.sobotics.org';
const copypastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
class CopyPastorAPI {
    constructor(answerId) {
        this.answerId = answerId;
        this.name = 'Guttenberg';
        const { copypastorId = 0, repost = false, target_url: targetUrl = '' } = CopyPastorAPI.copypastorIds[this.answerId] || {};
        this.copypastorId = copypastorId;
        this.repost = repost;
        this.targetUrl = targetUrl;
        this.icon = this.getIcon();
    }
    static async getAllCopyPastorIds() {
        if (!shared_1.isStackOverflow)
            return;
        const postUrls = (0, sotools_1.getAllPostIds)(false, true);
        if (!postUrls.length)
            return;
        await this.storeReportedPosts(postUrls);
    }
    static storeReportedPosts(postUrls) {
        const url = `${copypastorServer}/posts/findTarget?url=${postUrls.join(',')}`;
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: ({ responseText }) => {
                    const response = JSON.parse(responseText);
                    if (response.status === 'failure')
                        return;
                    response.posts.forEach(item => {
                        var _a;
                        const { post_id: postId, target_url: targetUrl, repost, } = item;
                        const id = (_a = /\d+/.exec(targetUrl)) === null || _a === void 0 ? void 0 : _a[0];
                        const sitePostId = Number(id);
                        this.copypastorIds[sitePostId] = {
                            copypastorId: Number(postId),
                            repost,
                            target_url: targetUrl
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
        if (!this.copypastorId) {
            return Promise.resolve('');
        }
        const successMessage = (0, shared_1.getSentMessage)(true, feedback, this.name);
        const failureMessage = (0, shared_1.getSentMessage)(false, feedback, this.name);
        const payload = {
            post_id: this.copypastorId,
            feedback_type: feedback,
            username: shared_1.username,
            link: `//chat.stackoverflow.com/users/${chatId}`,
            key: copypastorKey,
        };
        const data = Object
            .entries(payload)
            .map(item => item.join('='))
            .join('&');
        return new Promise((resolve, reject) => {
            const url = `${copypastorServer}/feedback/create`;
            if (shared_1.debugMode) {
                console.log('Feedback to Guttenberg via', url, data);
                reject('Didn\'t send feedback: debug mode');
            }
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data,
                onload: ({ status }) => {
                    status === 200
                        ? resolve(successMessage)
                        : reject(failureMessage);
                },
                onerror: () => reject(failureMessage)
            });
        });
    }
    getIcon() {
        if (!this.copypastorId)
            return;
        const icon = (0, AdvancedFlagging_1.createBotIcon)('Guttenberg', `${copypastorServer}/posts/${this.copypastorId}`);
        return icon;
    }
}
exports.CopyPastorAPI = CopyPastorAPI;
CopyPastorAPI.copypastorIds = {};


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChatApi = void 0;
const Store_1 = __webpack_require__(3);
const shared_1 = __webpack_require__(2);
class ChatApi {
    static getExpiryDate() {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return expiryDate;
    }
    constructor(chatUrl = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = chatUrl;
        this.soboticsRoomId = 111347;
    }
    getChannelFKey(roomId) {
        const expiryDate = ChatApi.getExpiryDate();
        return Store_1.Store.getAndCache(shared_1.Cached.Fkey, async () => {
            try {
                const channelPage = await this.getChannelPage(roomId);
                const parsed = new DOMParser().parseFromString(channelPage, 'text/html');
                const fkeyInput = parsed.querySelector('input[name="fkey"]');
                const fkey = (fkeyInput === null || fkeyInput === void 0 ? void 0 : fkeyInput.value) || '';
                return fkey;
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
    async sendMessage(message, bot, roomId = this.soboticsRoomId) {
        let numTries = 0;
        const feedback = message.split(' ').pop() || '';
        const makeRequest = async () => {
            return await this.sendRequestToChat(message, roomId);
        };
        const onFailure = async () => {
            numTries++;
            if (numTries < 3) {
                Store_1.Store.unset(shared_1.Cached.Fkey);
                if (!await makeRequest()) {
                    return onFailure();
                }
            }
            else {
                throw new Error('Failed to send message to chat');
            }
            return (0, shared_1.getSentMessage)(true, feedback, bot);
        };
        if (!await makeRequest()) {
            return onFailure();
        }
        return (0, shared_1.getSentMessage)(true, feedback, bot);
    }
    async sendRequestToChat(message, roomId) {
        const url = `${this.chatRoomUrl}/chats/${roomId}/messages/new`;
        if (shared_1.debugMode) {
            console.log('Send', message, `to ${roomId} via`, url);
            return Promise.resolve(true);
        }
        const fkey = await this.getChannelFKey(roomId);
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `text=${encodeURIComponent(message)}&fkey=${fkey}`,
                onload: ({ status }) => resolve(status === 200),
                onerror: () => resolve(false),
            });
        });
    }
    getChannelPage(roomId) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.chatRoomUrl}/rooms/${roomId}`,
                onload: ({ status, responseText }) => {
                    status === 200
                        ? resolve(responseText)
                        : reject();
                },
                onerror: () => reject()
            });
        });
    }
}
exports.ChatApi = ChatApi;


/***/ }),
/* 43 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NattyAPI = void 0;
const ChatApi_1 = __webpack_require__(42);
const shared_1 = __webpack_require__(2);
const sotools_1 = __webpack_require__(1);
const AdvancedFlagging_1 = __webpack_require__(0);
const dayMillis = 1000 * 60 * 60 * 24;
const nattyFeedbackUrl = 'https://logs.sobotics.org/napi-1.1/api/stored/';
const nattyReportedMessage = 'Post reported to Natty';
class NattyAPI {
    constructor(answerId, questionDate, answerDate, deleted) {
        this.answerId = answerId;
        this.questionDate = questionDate;
        this.answerDate = answerDate;
        this.deleted = deleted;
        this.chat = new ChatApi_1.ChatApi();
        this.name = 'Natty';
        this.feedbackMessage = `@Natty feedback https://stackoverflow.com/a/${this.answerId}`;
        this.reportMessage = `@Natty report https://stackoverflow.com/a/${this.answerId}`;
        this.icon = this.getIcon();
    }
    static getAllNattyIds() {
        const postIds = (0, sotools_1.getAllPostIds)(false, false).join(',');
        if (!shared_1.isStackOverflow || !postIds)
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${nattyFeedbackUrl}${postIds}`,
                onload: ({ status, responseText }) => {
                    if (status !== 200)
                        reject();
                    const result = JSON.parse(responseText);
                    this.nattyIds = result.items.map(({ name }) => Number(name));
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
        return this.answerDate > this.questionDate
            && answerAge < 30
            && daysPostedAfterQuestion > 30
            && !this.deleted;
    }
    async reportNaa(feedback) {
        if (!this.canBeReported() || feedback !== 'tp')
            return '';
        await this.chat.sendMessage(this.reportMessage, this.name);
        return nattyReportedMessage;
    }
    getDaysBetween(questionDate, answerDate) {
        return (answerDate.valueOf() - questionDate.valueOf()) / dayMillis;
    }
    async sendFeedback(feedback) {
        return this.wasReported()
            ? await this.chat.sendMessage(`${this.feedbackMessage} ${feedback}`, this.name)
            : await this.reportNaa(feedback);
    }
    getIcon() {
        if (!this.wasReported())
            return;
        const icon = (0, AdvancedFlagging_1.createBotIcon)('Natty', `//sentinel.erwaysoftware.com/posts/aid/${this.answerId}`);
        return icon;
    }
}
exports.NattyAPI = NattyAPI;
NattyAPI.nattyIds = [];


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GenericBotAPI = void 0;
const shared_1 = __webpack_require__(2);
const genericBotKey = 'Cm45BSrt51FR3ju';
const genericBotSuccess = 'Post tracked with Generic Bot';
const genericBotFailure = 'Server refused to track the post';
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
        const flaggerName = encodeURIComponent(shared_1.username || '');
        if (!trackPost || !shared_1.isStackOverflow || !flaggerName) {
            return Promise.resolve('');
        }
        const answer = document.querySelector(`#answer-${this.answerId} .js-post-body`);
        const answerBody = (answer === null || answer === void 0 ? void 0 : answer.innerHTML.trim()) || '';
        const contentHash = this.computeContentHash(answerBody);
        const url = 'https://so.floern.com/api/trackpost.php';
        const payload = {
            key: genericBotKey,
            postId: this.answerId,
            contentHash,
            flagger: flaggerName,
        };
        const data = Object
            .entries(payload)
            .map(item => item.join('='))
            .join('&');
        if (shared_1.debugMode) {
            console.log('Track post via', url, payload);
            return Promise.resolve('');
        }
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data,
                onload: ({ status, response }) => {
                    if (status !== 200) {
                        console.error('Failed to send track request.', response);
                        reject(genericBotFailure);
                    }
                    resolve(genericBotSuccess);
                },
                onerror: () => reject(genericBotFailure)
            });
        });
    }
}
exports.GenericBotAPI = GenericBotAPI;


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