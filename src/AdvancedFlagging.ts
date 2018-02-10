import * as jquery from 'jquery';

import { FlagType, flagCategories } from './FlagTypes';
import { StackExchangeGlobal } from '@userscriptTools/sotools/StackExchangeConfiguration';
import { SimpleCache } from '@userscriptTools/caching/SimpleCache';
import { IsStackOverflow, parseQuestionsAndAnswers } from '@userscriptTools/sotools/sotools';
import { NattyAPI } from '@userscriptTools/nattyapi/NattyApi';
import { GenericBotAPI } from '@userscriptTools/genericbotapi/GenericBotAPI';
import { MetaSmokeAPI, MetaSmokeDisabledConfig } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';
import { CrossDomainCache } from '@userscriptTools/caching/CrossDomainCache';
import { CopyPastorAPI, CopyPastorFindTargetResponseItem } from '@userscriptTools/copypastorapi/CopyPastorAPI';

// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
const copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';

const ConfigurationWatchFlags = 'AdvancedFlagging.Configuration.WatchFlags';
const ConfigurationWatchQueues = 'AdvancedFlagging.Configuration.WatchQueues';

declare const StackExchange: StackExchangeGlobal;
declare const unsafeWindow: any;

function SetupStyles() {
    const scriptNode = document.createElement('style');
    scriptNode.type = 'text/css';
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
                url: `//stackoverflow.com/posts/${postId}/comments`,
                type: 'POST',
                data: { fkey: StackExchange.options.user.fkey, comment: commentText }
            }).done((data) => {
                resolve(data);
            }).fail((jqXHR, textStatus, errorThrown) => {
                reject({ jqXHR, textStatus, errorThrown });
            });
        });
    }

    if (flagRequired) {
        if (flag.ReportType !== 'NoFlag') {
            const wasFlagged = SimpleCache.GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${postId}`);
            if (!wasFlagged) {
                if (flag.ReportType === 'PostOther') {
                    // Do something here
                    result.FlagPromise = new Promise((resolve, reject) => {
                        copyPastorPromise.then(copyPastorResults => {
                            if (flag.GetCustomFlagText && copyPastorResults.length > 0) {
                                const flagText = flag.GetCustomFlagText(copyPastorResults[0]);
                                $.ajax({
                                    url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
                                    type: 'POST',
                                    data: { fkey: StackExchange.options.user.fkey, otherText: flagText }
                                }).done((data) => {
                                    resolve(data);
                                }).fail((jqXHR, textStatus, errorThrown) => {
                                    reject({ jqXHR, textStatus, errorThrown });
                                });
                            }
                        });

                    });

                } else {
                    result.FlagPromise = new Promise((resolve, reject) => {
                        $.ajax({
                            url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
                            type: 'POST',
                            data: { fkey: StackExchange.options.user.fkey, otherText: '' }
                        }).done((data) => {
                            resolve(data);
                        }).fail((jqXHR, textStatus, errorThrown) => {
                            reject({ jqXHR, textStatus, errorThrown });
                        });
                    });
                }
            }
        }
    }
    return result;
}

const popupWrapper = $('<div>').addClass('hide').hide().attr('id', 'snackbar');
const popupDelay = 2000;
let toasterTimeout: number | null = null;
let toasterFadeTimeout: number | null = null;
function displayToaster(message: string, colour: string) {
    const div = $('<div>')
        .css({
            'background-color': colour,
            'padding': '10px'
        })
        .text(message);

    popupWrapper.append(div);
    popupWrapper.removeClass('hide').addClass('show').show();

    function hidePopup() {
        popupWrapper.removeClass('show').addClass('hide');
        toasterFadeTimeout = setTimeout(() => {
            popupWrapper.empty().hide();
        }, 1000);
    }

    if (toasterFadeTimeout) {
        clearTimeout(toasterFadeTimeout);
    }
    if (toasterTimeout) {
        clearTimeout(toasterTimeout);
    }
    toasterTimeout = setTimeout(hidePopup, popupDelay);
}
function displaySuccess(message: string) {
    displayToaster(message, '#00690c');
}

function displayError(message: string) {
    displayToaster(message, '#ba1701');
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
function BuildFlaggingDialog(element: JQuery,
    postId: number,
    postType: 'Question' | 'Answer',
    reputation: number,
    answerTime: Date,
    questionTime: Date,
    deleted: boolean,
    reportedIcon: JQuery,
    performedActionIcon: JQuery,
    reporters: Reporter[],
    copyPastorPromise: Promise<CopyPastorFindTargetResponseItem[]>
) {
    const getDivider = () => $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' });
    const linkStyle = { 'display': 'inline-block', 'margin-top': '5px', 'width': 'auto' };
    const dropDown = $('<dl />').css({
        'margin': '0',
        'z-index': '1',
        'position': 'absolute',
        'white-space': 'nowrap',
        'background': '#FFF',
        'padding': '5px',
        'border': '1px solid #9fa6ad',
        'box-shadow': '0 2px 4px rgba(36,39,41,0.3)',
        'cursor': 'default'
    }).hide();

    const checkboxName = `comment_checkbox_${postId}`;
    const leaveCommentBox = $('<input />')
        .attr('type', 'checkbox')
        .attr('name', checkboxName);
    const flagBox = $('<input />')
        .attr('type', 'checkbox')
        .attr('name', checkboxName)
        .prop('checked', true);

    const isStackOverflow = IsStackOverflow();

    const comments = element.find('.comment-body');
    if (comments.length === 0 && isStackOverflow) {
        leaveCommentBox.prop('checked', true);
    }

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
            const dropdownItem = $('<dd />');
            if (flagCategory.BoxStyle) {
                dropdownItem.css(flagCategory.BoxStyle);
            }

            const reportLink = $('<a />').css(linkStyle);

            const disableLink = () => {
                activeLinks--;
                reportLink.hide();
                if (divider && activeLinks <= 0) {
                    divider.hide();
                }
            };
            const enableLink = () => {
                activeLinks++;
                reportLink.show();
                if (divider && activeLinks > 0) {
                    divider.show();
                }
            };

            disableLink();
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

            let commentText: string | undefined;
            if (flagType.GetComment) {
                commentText = flagType.GetComment(reputation);
                reportLink.attr('title', commentText);
            }

            reportLink.click(() => {
                if (!deleted) {
                    try {
                        if (!leaveCommentBox.is(':checked')) {
                            // Now we need to investigate the existing comments to upvote them.
                            const commentTextItems = element.find('.comment-body .comment-copy').map((i, ele) => $(ele).text());
                            if (commentText) {
                                // Match [some text](http://somehyperlink.com)
                                let strippedComment = commentText.replace(/\[([^\]]+)\]\(([^\]]+)\)/g, '$1');
                                // Match [edit]
                                strippedComment = strippedComment.replace(/\[([^\]]+)\][^\(]*?/g, '$1');

                                // Strip out italics. _thanks_ => thanks
                                strippedComment = strippedComment.replace(/_([^_]+)_/g, '$1');

                                // Strip out bolds. **thanks** => thanks
                                strippedComment = strippedComment.replace(/\*\*([^\*]+)\*\*/g, '$1');

                                // Strip out italics. *thanks* => thanks
                                strippedComment = strippedComment.replace(/\*([^\*]+)\*/g, '$1');

                                element.find('.comment-body .comment-copy').each((i, ele) => {
                                    const jEle = $(ele);
                                    let text = jEle.text();
                                    const fromReviewText = ' - From Review';
                                    if (text.endsWith(fromReviewText)) {
                                        text = text.substring(0, text.length - fromReviewText.length);
                                    }

                                    if (text === strippedComment) {
                                        jEle.closest('tr').find('a.comment-up.comment-up-off').trigger('click');
                                    }
                                });
                            }

                            commentText = undefined;
                        }

                        const result = handleFlagAndComment(postId, flagType, flagBox.is(':checked'), commentText, copyPastorPromise);
                        if (result.CommentPromise) {
                            result.CommentPromise.then((data) => {
                                const commentUI = StackExchange.comments.uiForPost($('#comments-' + postId));
                                commentUI.addShow(true, false);
                                commentUI.showComments(data, null, false, true);
                                $(document).trigger('comment', postId);
                            }).catch(err => displayError('Failed to comment on post'));
                        }

                        if (result.FlagPromise) {
                            result.FlagPromise.then(() => {
                                SimpleCache.StoreInCache(`AdvancedFlagging.Flagged.${postId}`, flagType);
                                reportedIcon.attr('title', `Flagged as ${flagType.ReportType}`);
                                reportedIcon.show();
                                displaySuccess('Flagged');
                            }).catch(err => displayError('Failed to flag post'));
                        }
                    } catch (err) { displayError(err); }
                }

                const noFlag = flagType.ReportType === 'NoFlag';
                if (noFlag) {
                    SimpleCache.StoreInCache(`AdvancedFlagging.PerformedAction.${postId}`, flagType);
                    performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`);
                    performedActionIcon.show();
                }

                handleFlag(flagType, reporters, answerTime, questionTime);

                dropDown.hide();
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
        const commentBoxLabel =
            $('<label />').text('Leave comment')
                .attr('for', checkboxName)
                .css({
                    'margin-right': '5px',
                    'margin-left': '4px',
                });

        commentBoxLabel.click(() => leaveCommentBox.click());

        const commentingRow = $('<dd />');
        commentingRow.append(commentBoxLabel);
        commentingRow.append(leaveCommentBox);

        dropDown.append(commentingRow);
    }

    const flagBoxLabel =
        $('<label />').text('Flag')
            .attr('for', checkboxName)
            .css({
                'margin-right': '5px',
                'margin-left': '4px',
            });

    flagBoxLabel.click(() => flagBox.click());

    const flaggingRow = $('<dd />');
    flaggingRow.append(flagBoxLabel);
    flaggingRow.append(flagBox);

    dropDown.append(flaggingRow);

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
                default:
                    promise = Promise.resolve(false);
            }
        }
        if (promise) {
            promise.then((didReport) => {
                if (didReport) {
                    displaySuccess(`Feedback sent to ${reporter.name}`);
                }
            }).catch(error => {
                displayError(`Failed to send feedback to ${reporter.name}.`);
            });
        }
    }
}

function SetupPostPage() {
    parseQuestionsAndAnswers(post => {

        let iconLocation: JQuery;
        let advancedFlaggingLink: JQuery | null = null;

        const nattyIcon = getNattyIcon().click(() => {
            window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
        });

        let showFunc = (element: JQuery) => element.show();

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
                        nattyIcon.hide();
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
                            window.open('http://copypastor.sobotics.org/posts/' + item.post_id);
                        })
                    );
                } else {
                    copyPastorIcon.hide();
                }
            });

            reporters.push({
                name: 'Guttenberg',
                ReportNaa: (answerDate: Date, questionDate: Date) => copyPastorApi.ReportFalsePositive(),
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
                ReportNaa: (answerDate: Date, questionDate: Date) => genericBotAPI.ReportNaa(),
                ReportRedFlag: () => Promise.resolve(false),
                ReportLooksFine: () => genericBotAPI.ReportLooksFine(),
                ReportNeedsEditing: () => genericBotAPI.ReportNeedsEditing(),
                ReportVandalism: () => Promise.resolve(true),
                ReportDuplicateAnswer: () => Promise.resolve(false),
                ReportPlagiarism: () => Promise.resolve(false)
            });

        }
        const metaSmoke = new MetaSmokeAPI(post.postId, post.type);
        metaSmoke.Watch()
            .subscribe(id => {
                if (id !== null) {
                    smokeyIcon.click(() => {
                        window.open(`https://metasmoke.erwaysoftware.com/post/${id}`, '_blank');
                    });
                    showFunc(smokeyIcon);
                } else {
                    smokeyIcon.hide();
                }
            });
        reporters.push({
            name: 'Smokey',
            ReportNaa: (answerDate: Date, questionDate: Date) => metaSmoke.ReportNaa(),
            ReportRedFlag: () => metaSmoke.ReportRedFlag(),
            ReportLooksFine: () => metaSmoke.ReportLooksFine(),
            ReportNeedsEditing: () => metaSmoke.ReportNeedsEditing(),
            ReportVandalism: () => metaSmoke.ReportVandalism(),
            ReportDuplicateAnswer: () => Promise.resolve(false),
            ReportPlagiarism: () => Promise.resolve(false)
        });

        const performedActionIcon = getPerformedActionIcon();
        const reportedIcon = getReportedIcon();

        if (post.page === 'Question') {
            // Now we setup the flagging dialog
            iconLocation = post.element.find('.post-menu');
            advancedFlaggingLink = $('<a />').text('Advanced Flagging');

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

            getFromCaches<boolean>(ConfigurationWatchFlags).then(isEnabled => {
                if (isEnabled) {
                    addXHRListener((xhr) => {
                        const matches = new RegExp(`/flags\/posts\/${post.postId}\/add\/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther)`).exec(xhr.responseURL);
                        if (matches !== null && xhr.status === 200) {
                            const flagType = {
                                ReportType: matches[1] as 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther',
                                DisplayName: matches[1]
                            };
                            handleFlag(flagType, reporters, answerTime, questionTime);
                        }
                    });
                }
            });

            const dropDown = BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation as number, answerTime, questionTime,
                deleted,
                reportedIcon,
                performedActionIcon,
                reporters,
                copyPastorApi.Promise()
            );

            advancedFlaggingLink.append(dropDown);

            $(window).click(() => {
                dropDown.hide();
            });
            const link = advancedFlaggingLink;
            link.click(e => {
                e.stopPropagation();
                if (e.target === link.get(0)) {
                    dropDown.toggle();
                }
            });

            iconLocation.append(advancedFlaggingLink);
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

            showFunc = (element: JQuery) => element.css('display', 'inline-block');
        }

        const previousFlag = SimpleCache.GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${post.postId}`);
        if (previousFlag) {
            reportedIcon.attr('title', `Previously flagged as ${previousFlag.ReportType}`);
            showFunc(reportedIcon);
        }

        const previousAction = SimpleCache.GetFromCache<FlagType>(`AdvancedFlagging.PerformedAction.${post.postId}`);
        if (previousAction && previousAction.ReportType === 'NoFlag') {
            performedActionIcon.attr('title', `Previously performed action: ${previousAction.DisplayName}`);
            showFunc(performedActionIcon);
        }
    });
}

function getPerformedActionIcon() {
    return $('<div>').addClass('comment-flag')
        .css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' })
        .css({ 'width': '15px', 'height': '15px', 'background-position': '-20px -320px' })
        .css({ cursor: 'default' })
        .hide();
}

function getReportedIcon() {
    return $('<div>').addClass('comment-flag')
        .css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' })
        .css({ cursor: 'default' })
        .hide();
}

function getNattyIcon() {
    return $('<div>')
        .css({
            'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom', 'cursor': 'pointer',
            'background': 'url("https://i.stack.imgur.com/aMUMt.jpg?s=328&g=1"', 'background-size': '100%'
        })
        .attr('title', 'Reported by Natty')
        .hide();
}
function getGuttenbergIcon() {
    return $('<div>')
        .css({
            'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom', 'cursor': 'pointer',
            'background': 'url("https://i.imgur.com/ZQwCGvB.png?s=328&g=1"', 'background-size': '100%'
        })
        .attr('title', 'Reported by Guttenberg')
        .hide();
}

function getSmokeyIcon() {
    return $('<div>')
        .css({
            'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom', 'cursor': 'pointer',
            'background': 'url("https://i.stack.imgur.com/WyV1l.png?s=128&g=1"', 'background-size': '100%'
        })
        .attr('title', 'Reported by Smokey')
        .hide();
}

function getDropdown() {
    $('<dl />').css({
        'margin': '0',
        'z-index': '1',
        'position': 'absolute',
        'white-space': 'nowrap',
        'background': '#FFF',
        'padding': '5px',
        'border': '1px solid #9fa6ad',
        'box-shadow': '0 2px 4px rgba(36,39,41,0.3)',
        'cursor': 'default'
    }).hide();
}

const metaSmokeManualKey = 'MetaSmoke.ManualKey';

function SetupAdminTools() {
    const bottomBox = $('.-copyright, text-right').children('.g-column').children('.-list');
    const optionsDiv = $('<div>')
        .css('line-height', '18px')
        .css('background-color', '#3b3b3c')
        .css('text-align', 'right')
        .css('padding', '5px')
        .css('border-radius', '3px');
    bottomBox.after(optionsDiv);

    const title = $('<span>').css('color', '#c1cccc').text('AdvancedFlagging Admin');
    optionsDiv.append(title);

    const optionsList = $('<ul>').css({ 'list-style': 'none' }).css('margin', '0px');

    const clearMetaSmokeConfig = $('<a />').text('Clear Metasmoke Configuration');
    clearMetaSmokeConfig.click(async () => {
        await MetaSmokeAPI.Reset();
        location.reload();
    });

    const manualMetaSmokeAuthUrl = $('<a />').text('Get MetaSmoke key').attr('href', `https://metasmoke.erwaysoftware.com/oauth/request?key=${metaSmokeKey}`);
    const manualRegisterMetaSmokeKey = $('<a />').text('Manually register MetaSmoke key');
    manualRegisterMetaSmokeKey.click(async () => {
        const prompt = window.prompt('Enter metasmoke key');
        if (prompt) {
            CrossDomainCache.StoreInCache(MetaSmokeDisabledConfig, false);
            localStorage.setItem(metaSmokeManualKey, prompt);
            location.reload();
        }
    });

    const configWatchFlags = $('<input type="checkbox" />');
    getFromCaches(ConfigurationWatchFlags).then((isEnabled) => {
        if (isEnabled) {
            configWatchFlags.prop('checked', true);
        }
    });
    configWatchFlags.click(async a => {
        const isChecked = !!configWatchFlags.prop('checked');
        await storeInCaches(ConfigurationWatchFlags, isChecked);
        window.location.reload();
    });
    const configWatchFlagsLabel = $('<label />').append(configWatchFlags).append('Watch for manual flags');

    const configWatchQueues = $('<input type="checkbox" />');
    getFromCaches(ConfigurationWatchQueues).then((isEnabled) => {
        if (isEnabled) {
            configWatchQueues.prop('checked', true);
        }
    });
    configWatchQueues.click(async a => {
        const isChecked = !!configWatchQueues.prop('checked');
        await storeInCaches(ConfigurationWatchQueues, isChecked);
        window.location.reload();
    });
    const configWatchQueuesLabel = $('<label />').append(configWatchQueues).append('Watch for queue responses');

    optionsDiv.append(optionsList);
    optionsList.append($('<li>').append(clearMetaSmokeConfig));
    optionsList.append($('<li>').append(manualMetaSmokeAuthUrl));
    optionsList.append($('<li>').append(manualRegisterMetaSmokeKey));
    optionsList.append($('<li>').append(configWatchFlagsLabel));
    optionsList.append($('<li>').append(configWatchQueuesLabel));
}

$(async () => {
    CrossDomainCache.InitializeCache('https://metasmoke.erwaysoftware.com/xdom_storage.html');
    const manualKey = localStorage.getItem(metaSmokeManualKey);
    if (manualKey) {
        localStorage.removeItem(metaSmokeManualKey);
        await MetaSmokeAPI.Setup(metaSmokeKey, async () => manualKey);
    } else {
        await MetaSmokeAPI.Setup(metaSmokeKey);
    }

    SetupPostPage();
    SetupAdminTools();

    SetupStyles();
    document.body.appendChild(popupWrapper.get(0));

    getFromCaches<boolean>(ConfigurationWatchQueues).then(isEnabled => {
        if (isEnabled) {
            addXHRListener((xhr) => {
                const matches = /(\d+)\/vote\/10|(\d+)\/recommend-delete/.exec(xhr.responseURL);
                if (matches !== null && xhr.status === 200) {
                    // Check we're reviewing an answer
                    if ($('.answers-subheader').length > 0) {
                        let postIdStr = matches[1];
                        if (postIdStr === undefined) {
                            postIdStr = matches[2];
                        }

                        const postId = parseInt(postIdStr, 10);
                        const nattyApi = new NattyAPI(postId);
                        nattyApi.Watch();

                        const answerTime = new Date($('.post-signature.owner .user-action-time span').attr('title'));
                        const questionTime = new Date($('.post-signature .user-action-time span').attr('title'));

                        handleFlag({ ReportType: 'AnswerNotAnAnswer', DisplayName: 'AnswerNotAnAnswer' }, [
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
                        ], answerTime, questionTime);
                    }
                }
            });
        }
    });
});

// Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
function addXHRListener(callback: (request: JQueryXHR) => void) {
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', callback.bind(null, this), false);
        open.apply(this, arguments);
    };
}

// First attempt to retrieve the value from the local cache.
// If it doesn't exist, check the cross domain cache, and store it locally
async function getFromCaches<T>(key: string) {
    return SimpleCache.GetAndCache<T | undefined>(key, () => {
        return CrossDomainCache.GetFromCache<T>(key);
    });
}

// Store the value in both the local and global cache
async function storeInCaches<T>(key: string, item: any) {
    await SimpleCache.StoreInCache<T>(key, item);
    await CrossDomainCache.StoreInCache<T>(key, item);
}
