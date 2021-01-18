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

declare const StackExchange: StackExchangeGlobal;

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

#advanced-flagging-configuration-div {
    line-height: 18px;
    text-align: left;
    padding: 5px';
}
`;

    const target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
    target.appendChild(scriptNode);
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

const popupWrapper = $('<div>').addClass('hide').hide().attr('id', 'snackbar');
const popupDelay = 2000;
let toasterTimeout: number | null = null;
let toasterFadeTimeout: number | null = null;
function displayToaster(message: string, colour: string, textColour?: string, duration?: number) {
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
export function displaySuccess(message: string) {
    displayToaster(message, '#00690c');
}

function displayError(message: string) {
    displayToaster(message, '#ba1701');
}

function displaySuccessFlagged(reportedIcon: JQuery, reportType: string) {
    reportedIcon.attr('title', `Flagged as ${reportType}`);
    reportedIcon.addClass('d-inline-block').removeClass('d-none');
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
    const getDivider = () => $('<hr>').attr('class', 'advanced-flagging-hr');
    const dropDown = $('<dl>').attr('class', 'advanced-flagging-dialog s-anchors s-anchors__default d-none');

    const checkboxNameComment = `comment_checkbox_${postId}`;
    const checkboxNameFlag = `flag_checkbox_${postId}`;
    const leaveCommentBox = $('<input>').attr('type', 'checkbox').attr('name', checkboxNameComment).attr('id', checkboxNameComment)
                                        .attr('class', 's-checkbox').wrap('<div class="grid--cell"></div>').parent();
    const flagBox = leaveCommentBox.clone().find('input').attr('name', checkboxNameFlag).attr('id', checkboxNameFlag).parent();
    flagBox.find('input').prop('checked', true);

    const isStackOverflow = IsStackOverflow();

    const comments = element.find('.comment-body');
    const defaultNoComment = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationDefaultNoComment);

    if (!defaultNoComment && comments.length === 0 && isStackOverflow) {
        leaveCommentBox.find('input').prop('checked', true);
    }

    const enabledFlagIds = GreaseMonkeyCache.GetFromCache<number[]>(ConfigurationEnabledFlags);

    let hasCommentOptions = false;
    let firstCategory = true;
    flagCategories.forEach(flagCategory => {
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

                        const result = handleFlagAndComment(postId, flagType, flagBox.find('input').is(':checked'),
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

    const flagBoxLabel =
        $('<label>').text('Flag')
            .attr('for', checkboxNameFlag)
            .attr('class', 'advanced-flagging-label-options grid--cell s-label fw-normal');

    const flaggingRow = $('<dd />');

    const defaultNoFlag = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationDefaultNoFlag);
    if (defaultNoFlag) {
        flagBox.find('input').prop('checked', false);
    }

    flaggingRow.append(flagBox);
    flaggingRow.append(flagBoxLabel);

    dropDown.append(flaggingRow);
    flaggingRow.children().wrapAll('<div class="grid gs8"></div>');

    return dropDown;
}

function handleFlag(flagType: FlagType, reporters: Reporter[], answerTime: Date, questionTime: Date) {
    const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
    const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
    const customFlag = flagType.ReportType === 'PostOther';
    const noFlag = flagType.ReportType === 'NoFlag';
    for (let i = 0; i < reporters.length; i++) {
        const reporter = reporters[i];
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
    parseQuestionsAndAnswers(async post => {
        if (!post.element.length) {
            return;
        }

        let iconLocation: JQuery;
        let advancedFlaggingLink: JQuery | null = null;

        const nattyIcon = getNattyIcon().click(() => {
            window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
        });

        const showFunc = (element: JQuery) => element.addClass('d-inline-block').removeClass('d-none');

        const copyPastorIcon = getGuttenbergIcon();
        const copyPastorApi = new CopyPastorAPI(post.postId, copyPastorKey);
        const copyPastorObservable = copyPastorApi.Watch();

        const smokeyIcon = getSmokeyIcon();
        const reporters: Reporter[] = [];
        if (post.type === 'Answer') {
            const nattyApi = new NattyAPI(post.postId);
            nattyApi.Watch()
                .subscribe(reported => {
                    if (reported) {
                        showFunc(nattyIcon);
                    } else {
                        nattyIcon.addClass('d-none');
                    }
                });

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
                if (items.length) {
                    copyPastorIcon.attr('Title', `Reported by CopyPastor - ${items.length}`);
                    showFunc(copyPastorIcon);
                    copyPastorIcon.click(() =>
                        items.forEach(item => {
                            window.open('https://copypastor.sobotics.org/posts/' + item.post_id);
                        })
                    );
                } else {
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
                if (id !== null) {
                    smokeyIcon.click(() => {
                        window.open(`https://metasmoke.erwaysoftware.com/post/${id}`, '_blank');
                    });
                    showFunc(smokeyIcon);
                } else {
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

            let questionTime: Date;
            let answerTime: Date;
            if (post.type === 'Answer') {
                questionTime = post.question.postTime;
                answerTime = post.postTime;
            } else {
                questionTime = post.postTime;
                answerTime = post.postTime;
            }
            const deleted = post.element.hasClass('deleted-answer');

            const isEnabled = GreaseMonkeyCache.GetFromCache<boolean>(ConfigurationWatchFlags);
            WatchFlags().subscribe(xhr => {
                if (isEnabled && !autoFlagging) {
                    const matches = new RegExp(`/flags/posts/${post.postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther)`).exec(xhr.responseURL);
                    if (matches !== null && xhr.status === 200) {
                        const flagType = {
                            Id: 0,
                            ReportType: matches[1] as 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther',
                            DisplayName: matches[1]
                        };
                        handleFlag(flagType, reporters, answerTime, questionTime);

                        const expiryDate = new Date();
                        expiryDate.setDate(expiryDate.getDate() + 30);
                        displaySuccessFlagged(reportedIcon, flagType.ReportType);
                    }
                }
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
                } else {
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
