import { FlagType, flagCategories } from './FlagTypes';
import { StackExchangeGlobal } from '@userscriptTools/sotools/StackExchangeConfiguration';
import { IsStackOverflow, parseQuestionsAndAnswers, parseDate } from '@userscriptTools/sotools/sotools';
import { NattyAPI } from '@userscriptTools/nattyapi/NattyApi';
import { GenericBotAPI } from '@userscriptTools/genericbotapi/GenericBotAPI';
import { MetaSmokeAPI } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';
import { CopyPastorAPI, CopyPastorFindTargetResponseItem } from '@userscriptTools/copypastorapi/CopyPastorAPI';
import { WatchFlags, WatchRequests } from '@userscriptTools/sotools/RequestWatcher';
import { SetupConfiguration } from 'Configuration';
import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';

export const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
const copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';

export const ConfigurationOpenOnHover = 'AdvancedFlagging.Configuration.OpenOnHover';
export const ConfigurationDefaultNoFlag = 'AdvancedFlagging.Configuration.DefaultNoFlag';
export const ConfigurationDefaultNoComment = 'AdvancedFlagging.Configuration.DefaultNoComment';
export const ConfigurationWatchFlags = 'AdvancedFlagging.Configuration.WatchFlags';
export const ConfigurationWatchQueues = 'AdvancedFlagging.Configuration.WatchQueues';
export const ConfigurationDetectAudits = 'AdvancedFlagging.Configuration.DetectAudits';
export const ConfigurationEnabledFlags = 'AdvancedFlagging.Configuration.EnabledFlags';
export const ConfigurationLinkDisabled = 'AdvancedFlagging.Configuration.LinkDisabled';

declare const GM_addStyle: any;
declare const StackExchange: StackExchangeGlobal;
declare const Svg: any;

function SetupStyles() {
    GM_addStyle(`
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
    min-width: 10rem !important;
}

.advanced-flagging-icon {
    margin: 5px 0px 0px 5px;
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

function handleFlagAndComment(postId: number, flag: FlagType,
    flagRequired: boolean,
    commentText: string | undefined,
    copyPastorPromise: Promise<CopyPastorFindTargetResponseItem[]>
) {
    const result: {
        CommentPromise?: Promise<string>;
        FlagPromise?: Promise<string>;
    } = {};

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
            })

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

const popupWrapper = $('<div>').addClass('hide').attr('id', 'snackbar');
const popupDelay = 2000;
let toasterTimeout: number | null = null;
let toasterFadeTimeout: number | null = null;

function hidePopup() {
    popupWrapper.removeClass('show').addClass('hide');
    toasterFadeTimeout = window.setTimeout(() => popupWrapper.empty().addClass('hide'), 1000);
}

function displayToaster(message: string, state: string) {
    const messageDiv = $('<div>').attr('class', 'p12 bg-' + state).text(message);

    popupWrapper.append(messageDiv);
    popupWrapper.removeClass('hide').addClass('show');

    if (toasterFadeTimeout) clearTimeout(toasterFadeTimeout);
    if (toasterTimeout) clearTimeout(toasterTimeout);
    toasterTimeout = window.setTimeout(hidePopup, popupDelay);
}

const showElement = (element: JQuery) => element.addClass('d-block').removeClass('d-none');
const hideElement = (element: JQuery) => element.addClass('d-none').removeClass('d-block');
const showInlineElement = (element: JQuery) => element.addClass('d-inline-block').removeClass('d-none');
const displaySuccess = (message: string) => displayToaster(message, 'success');
const displayError = (message: string) => displayToaster(message, 'danger');

export function displayStacksToast(message: string, type: string) {
    StackExchange.helpers.showToast(message, { type: type });
}

function displaySuccessFlagged(reportedIcon: JQuery, reportType: string) {
    reportedIcon.attr('title', `Flagged as ${reportType}`);
    showInlineElement(reportedIcon);
    displaySuccess(`Flagged as ${reportType}`);
}

function displayErrorFlagged(message: string, error: any) {
    displayError(message);
    console.error(error);
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

async function BuildFlaggingDialog(element: JQuery,
    postId: number,
    postType: 'Question' | 'Answer',
    reputation: number,
    authorName: string,
    answerTime: Date,
    questionTime: Date,
    deleted: boolean,
    reportedIcon: JQuery,
    performedActionIcon: JQuery,
    reporters: Reporter[],
    copyPastorPromise: Promise<CopyPastorFindTargetResponseItem[]>
) {
    const getDivider = () => $('<hr>').attr('class', 'my8');
    const dropDown = $('<div>').attr('class', 'advanced-flagging-dialog s-popover s-anchors s-anchors__default p6 c-default d-none');

    const checkboxNameComment = `comment_checkbox_${postId}`;
    const checkboxNameFlag = `flag_checkbox_${postId}`;
    const leaveCommentBox = $('<input>').attr('type', 'checkbox').attr('name', checkboxNameComment).attr('id', checkboxNameComment)
                                        .attr('class', 's-checkbox');
    const flagBox = leaveCommentBox.clone().attr('name', checkboxNameFlag).attr('id', checkboxNameFlag);
    flagBox.prop('checked', true);

    const isStackOverflow = IsStackOverflow();

    const comments = element.find('.comment-body');
    const defaultNoComment = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationDefaultNoComment);

    if (!defaultNoComment && !comments.length && isStackOverflow) leaveCommentBox.prop('checked', true);

    const enabledFlagIds = GreaseMonkeyCache.GetFromCache<number[]>(ConfigurationEnabledFlags);

    let hasCommentOptions = false;
    let firstCategory = true;
    flagCategories.forEach(flagCategory => {
        if (flagCategory.AppliesTo.indexOf(postType) === -1) return;

        const divider = getDivider();
        if (!firstCategory) dropDown.append(divider);

        const categoryDiv = $('<div>').attr('class', `advanced-flagging-category bar-md${flagCategory.IsDangerous ? ' bg-red-200' : ''}`);
        let activeLinks = flagCategory.FlagTypes.length;
        flagCategory.FlagTypes.forEach(flagType => {
            const reportLink = $('<a>').attr('class', 'd-inline-block w-auto my4');
            hasCommentOptions = !!flagType.GetComment;
            const dropdownItem = $('<div>').attr('class', 'advanced-flagging-dropdown-item px4');

            const disableLink = () => {
                activeLinks--;
                hideElement(reportLink);
                if (!divider || activeLinks > 0) return;

                hideElement(divider);
            };
            const enableLink = () => {
                activeLinks++;
                showElement(reportLink);
                if (!divider || activeLinks <= 0) return;

                showElement(divider);
            };

            disableLink();
            if (!enabledFlagIds || enabledFlagIds.indexOf(flagType.Id) > -1) {
                if (flagType.Enabled) {
                    copyPastorPromise.then(items => {
                        // If it somehow changed within the promise, check again
                        if (flagType.Enabled) {
                            const hasItems = items.length > 0;
                            const isEnabled = flagType.Enabled(hasItems);
                            if (isEnabled) enableLink();
                        } else {
                            enableLink();
                        }
                    });
                } else {
                    enableLink();
                }
            }

            let commentText: string | undefined;
            if (flagType.GetComment) {
                commentText = flagType.GetComment({ Reputation: reputation, AuthorName: authorName });
                reportLink.attr('title', commentText);
            }

            reportLink.click(() => {
                if (!deleted) {
                    try {
                        if (!leaveCommentBox.is(':checked') && commentText) {
                            // Strip comment to find if one already exists
                            const strippedComment = commentText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Match [links](...)
                                                               .replace(/\[([^\]]+)\][^(]*?/g, '$1') // Match [edit]
                                                               .replace(/_([^_]+)_/g, '$1') //  _thanks_ => thanks
                                                               .replace(/\*\*([^*]+)\*\*/g, '$1') // **thanks** => thanks
                                                               .replace(/\*([^*]+)\*/g, '$1') // *thanks* => thanks
                                                               .replace(' - From Review', '');

                            element.find('.comment-body .comment-copy').each((_index, el) => {
                                const element = $(el);
                                const text = element.text();
                                if (text !== strippedComment) return;

                                element.closest('li').find('a.comment-up.comment-up-off').trigger('click');
                            });
                            commentText = undefined;
                        }

                        const result = handleFlagAndComment(postId, flagType, flagBox.is(':checked'),
                                                            commentText, copyPastorPromise);
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
                                const responseJson = JSON.parse(JSON.stringify(data)) as StackExchangeFlagResponse;
                                if (responseJson.Success) {
                                    displaySuccessFlagged(reportedIcon, flagType.ReportType);
                                } else { // sometimes, although the status is 200, the post isn't flagged.
                                    const fullMessage = `Failed to flag the post with outcome ${responseJson.Outcome}: ${responseJson.Message}.`;
                                    let message = 'Failed to flag: ';
                                    if (responseJson.Message.match('already flagged')) {
                                        message += 'post already flagged';
                                    } else if (responseJson.Message.match('limit reached')) {
                                        message += 'post flag limit reached';
                                    } else {
                                        message += responseJson.Message;
                                    }

                                    displayErrorFlagged(message, fullMessage);
                                }
                            }).catch(err => {
                                displayErrorFlagged('Failed to flag post', err);
                            });
                        }
                    } catch (err) { displayError(err); }
                }

                const noFlag = flagType.ReportType === 'NoFlag';
                if (noFlag) {
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 30);
                    performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                    showElement(performedActionIcon);
                }

                handleFlag(flagType, reporters, answerTime, questionTime);

                hideElement(dropDown);
            });

            reportLink.text(flagType.DisplayName);
            dropdownItem.append(reportLink);
            categoryDiv.append(dropdownItem)

            dropDown.append(categoryDiv);
        });
        firstCategory = false;
    });

    hasCommentOptions = isStackOverflow;

    dropDown.append(getDivider());
    if (hasCommentOptions) {
        const commentBoxLabel = $('<label>').text('Leave comment')
                                            .attr('for', checkboxNameComment)
                                            .attr('class', 's-label ml4 va-middle fs-body1 fw-normal');

        const commentingRow = $('<div>');
        commentingRow.append(leaveCommentBox);
        commentingRow.append(commentBoxLabel);

        dropDown.append(commentingRow);
        commentingRow.children().wrapAll('<div class="grid--cell"></div>');
    }

    const flagBoxLabel =
        $('<label>').text('Flag')
            .attr('for', checkboxNameFlag)
            .attr('class', 's-label ml4 va-middle fs-body1 fw-normal');

    const flaggingRow = $('<div>');

    const defaultNoFlag = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationDefaultNoFlag);
    if (defaultNoFlag) flagBox.prop('checked', false);

    flaggingRow.append(flagBox);
    flaggingRow.append(flagBoxLabel);

    dropDown.append(flaggingRow);
    flaggingRow.children().wrapAll('<div class="grid--cell"></div>');

    return dropDown;
}

function handleFlag(flagType: FlagType, reporters: Reporter[], answerTime: Date, questionTime: Date) {
    const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
    const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
    const customFlag = flagType.ReportType === 'PostOther';
    const noFlag = flagType.ReportType === 'NoFlag';
    reporters.forEach(reporter => {
        let promise: Promise<boolean> | null = null;
        if (rudeFlag) {
            promise = reporter.ReportRedFlag();
        } else if (naaFlag) {
            promise = reporter.ReportNaa(answerTime, questionTime);
        } else if (noFlag) {
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
        } else if (customFlag) {
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
        if (!promise) return;

        promise.then((didReport) => {
            if (!didReport) return;
            displaySuccess(`Feedback sent to ${reporter.name}`);
        }).catch(() => {
            displayError(`Failed to send feedback to ${reporter.name}.`);
        });
    });
}

let autoFlagging = false;
async function SetupPostPage() {
    // The Svg object is initialised after the body has loaded :(
    while (typeof Svg === "undefined") {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    parseQuestionsAndAnswers(async post => {
        if (!post.element.length) return;

        let iconLocation: JQuery;
        let advancedFlaggingLink: JQuery | null = null;

        const nattyIcon = getNattyIcon().click(() => {
            window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
        });

        const copyPastorIcon = getGuttenbergIcon();
        const copyPastorApi = new CopyPastorAPI(post.postId, copyPastorKey);
        const copyPastorObservable = copyPastorApi.Watch();

        const smokeyIcon = getSmokeyIcon();
        const reporters: Reporter[] = [];
        if (post.type === 'Answer') {
            const nattyApi = new NattyAPI(post.postId);
            nattyApi.Watch().subscribe(reported => reported ? showInlineElement(nattyIcon) : nattyIcon.addClass('d-none'));

            reporters.push({
                name: 'Natty',
                ReportNaa: (answerDate: Date, questionDate: Date) => nattyApi.ReportNaa(answerDate, questionDate),
                ReportRedFlag: () => nattyApi.ReportRedFlag(),
                ReportLooksFine: () => nattyApi.ReportLooksFine(),
                ReportNeedsEditing: () => nattyApi.ReportNeedsEditing(),
                ReportVandalism: () => Promise.resolve(false),
                ReportDuplicateAnswer: () => Promise.resolve(false),
                ReportPlagiarism: () => Promise.resolve(false)
            });

            copyPastorObservable.subscribe(items => {
                if (!items.length) {
                    copyPastorIcon.addClass('d-none');
                    return;
                }
                copyPastorIcon.attr('Title', `Reported by CopyPastor - ${items.length}`);
                showInlineElement(copyPastorIcon);
                copyPastorIcon.click(() =>
                    items.forEach(item => {
                        window.open('https://copypastor.sobotics.org/posts/' + item.post_id);
                    })
                );
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

            const genericBotAPI = new GenericBotAPI(post.postId);
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
        const metaSmoke = new MetaSmokeAPI();
        metaSmoke.Watch(post.postId, post.type)
            .subscribe(id => {
                if (!id) {
                    smokeyIcon.addClass('d-none');
                    return;
                }

                smokeyIcon.click(() => {
                    window.open(`https://metasmoke.erwaysoftware.com/post/${id}`, '_blank');
                });
                showInlineElement(smokeyIcon);
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
                                                .attr('class', 's-btn s-btn__link').text('Advanced Flagging');

            const questionTime: Date = post.type === 'Answer' ? post.question.postTime : post.postTime;
            const answerTime: Date = post.postTime;
            const deleted = post.element.hasClass('deleted-answer');

            const isEnabled = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationWatchFlags);
            WatchFlags().subscribe(xhr => {
                if (!isEnabled || autoFlagging) return;

                const matches = new RegExp(`/flags/posts/${post.postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther)`).exec(xhr.responseURL);
                if (!matches || xhr.status !== 200) return;

                const flagType = {
                    Id: 0,
                    ReportType: matches[1] as 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther',
                    DisplayName: matches[1]
                };
                handleFlag(flagType, reporters, answerTime, questionTime);

                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                displaySuccessFlagged(reportedIcon, flagType.ReportType);
            });

            const linkDisabled = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationLinkDisabled);
            if (!linkDisabled) {
                const dropDown = await BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation as number, post.authorName, answerTime, questionTime,
                    deleted,
                    reportedIcon,
                    performedActionIcon,
                    reporters,
                    copyPastorApi.Promise()
                );

                advancedFlaggingLink.append(dropDown);

                const link = advancedFlaggingLink;
                const openOnHover = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationOpenOnHover);
                link[openOnHover ? 'hover' : 'click'](e => {
                    e.stopPropagation();
                    if (e.target !== link.get(0)) return;

                    showElement(dropDown);
                });

                if (openOnHover) {
                    link.mouseleave(e => {
                        e.stopPropagation();
                        hideElement(dropDown);
                    });
                } else {
                    $(window).click(() => hideElement(dropDown));
                }
                iconLocation.append($('<div>').attr('class', 'grid--cell').append(advancedFlaggingLink));
            }

            iconLocation.append(performedActionIcon);
            iconLocation.append(reportedIcon);
            iconLocation.append(nattyIcon);
            iconLocation.append(copyPastorIcon);
            iconLocation.append(smokeyIcon);

        } else {
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
    return $('<div>').attr('class', 'c-default d-none')
        .append(Svg.CheckmarkSm().addClass('fc-green-500'));
}

function getReportedIcon() {
    return $('<div>')
        .attr('class', 'advanced-flagging-flag-icon c-default d-none')
        .append(Svg.Flag().addClass('fc-red-500'));
}

const sampleIconClass = $('<div>').attr('class', 'advanced-flagging-icon bg-cover c-pointer w16 h16 d-none');

function getNattyIcon() {
    return sampleIconClass.clone().attr('title', 'Reported by Natty').addClass('advanced-flagging-natty-icon');
}

function getGuttenbergIcon() {
    return sampleIconClass.clone().attr('title', 'Reported by Guttenberg').addClass('advanced-flagging-gut-icon');
}

function getSmokeyIcon() {
    return sampleIconClass.clone().attr('title', 'Reported by Smokey').addClass('advanced-flagging-smokey-icon');
}

const metaSmokeManualKey = 'MetaSmoke.ManualKey';

async function Setup() {
    const manualKey = localStorage.getItem(metaSmokeManualKey);
    if (manualKey) {
        localStorage.removeItem(metaSmokeManualKey);
        MetaSmokeAPI.Setup(metaSmokeKey, async () => manualKey);
    } else {
        MetaSmokeAPI.Setup(metaSmokeKey);
    }

    SetupPostPage();
    SetupStyles();
    SetupConfiguration();

    document.body.appendChild(popupWrapper.get(0));

    const watchedQueuesEnabled = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationWatchQueues);
    const postDetails: { questionTime: Date, answerTime: Date }[] = [];
    if (watchedQueuesEnabled) {
        WatchRequests().subscribe((xhr) => {
            const parseReviewDetails = (review: string) => {
                const reviewJson = JSON.parse(review);
                const postId = reviewJson.postId;
                const content = $(reviewJson.content);
                postDetails[postId] = {
                    questionTime: parseDate($('.post-signature.owner .user-action-time span', content).attr('title')),
                    answerTime: parseDate($('.user-info .user-action-time span', content).attr('title'))
                };
            };

            // We can't just parse the page after a recommend/delete request, as the page will have sometimes already updated
            // This means we're actually grabbing the information for the following review

            // So, we watch the next-task requests and remember which post we were looking at for when a delete/recommend-delete vote comes through.
            // next-task is invoked when visiting the review queue
            // task-reviewed is invoked when making a response
            const isReviewItem = /(\/review\/next-task)|(\/review\/task-reviewed\/)/.exec(xhr.responseURL);
            if (isReviewItem && xhr.status === 200) {
                const review = xhr.responseText;
                parseReviewDetails(review);
                return;
            }

            const matches = /(\d+)\/vote\/10|(\d+)\/recommend-delete/.exec(xhr.responseURL);
            if (!matches || xhr.status !== 200) return;

            const postIdStr = matches[1] || matches[2];
            const postId = parseInt(postIdStr, 10);
            const currentPostDetails = postDetails[postId];
            if (!currentPostDetails || !$('.answers-subheader').length) return;

            const nattyApi = new NattyAPI(postId);
            nattyApi.Watch();

            handleFlag({ Id: 0, ReportType: 'AnswerNotAnAnswer', DisplayName: 'AnswerNotAnAnswer' }, [
                {
                    name: 'Natty',
                    ReportNaa: (answerDate: Date, questionDate: Date) => nattyApi.ReportNaa(answerDate, questionDate),
                    ReportRedFlag: () => nattyApi.ReportRedFlag(),
                    ReportLooksFine: () => nattyApi.ReportLooksFine(),
                    ReportNeedsEditing: () => nattyApi.ReportNeedsEditing(),
                    ReportVandalism: () => Promise.resolve(false),
                    ReportDuplicateAnswer: () => Promise.resolve(false),
                    ReportPlagiarism: () => Promise.resolve(false)
                }
            ], currentPostDetails.answerTime, currentPostDetails.questionTime);
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
    if (document.hasFocus && document.hasFocus()) actionWatcher();
});
