import * as jquery from 'jquery';

import { FlagType, flagCategories } from './FlagTypes';
import { StackExchangeGlobal } from '@userscriptTools/sotools/StackExchangeConfiguration';
import { SimpleCache } from '@userscriptTools/caching/SimpleCache';
import { IsStackOverflow, parseQuestionsAndAnswers } from '@userscriptTools/sotools/sotools';
import { NattyAPI } from '@userscriptTools/nattyapi/NattyApi';
import { GenericBotAPI } from '@userscriptTools/genericbotapi/GenericBotAPI';
import { MetaSmokeAPI } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';
import { CrossDomainCache } from '@userscriptTools/caching/CrossDomainCache';
import { CopyPastorAPI, CopyPastorFindTargetResponseItem } from '@userscriptTools/copypastorapi/CopyPastorAPI';

// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';

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

function handleFlagAndComment(postId: number, flag: FlagType, commentRequired: boolean, userReputation: number, copyPastorPromise: Promise<CopyPastorFindTargetResponseItem[]>) {
    const result: {
        CommentPromise?: Promise<string>;
        FlagPromise?: Promise<string>;
    } = {};

    if (commentRequired) {
        let commentText: string | null = null;
        if (flag.GetComment) {
            commentText = flag.GetComment(userReputation);
        }

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
    }

    if (flag.ReportType !== 'NoFlag') {
        const wasFlagged = SimpleCache.GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${postId}`);
        if (!wasFlagged) {
            if (flag.ReportType === 'Custom') {
                // Do something here
                result.FlagPromise = new Promise((resolve, reject) => {
                    copyPastorPromise.then(copyPastorResults => {
                        if (flag.GetCustomFlagText && copyPastorResults.length > 0) {
                            const flagText = flag.GetCustomFlagText(copyPastorResults[0]);
                            // tslint:disable-next-line:no-console
                            console.log('I wanted to make a custom flag with the following text: ', flagText);

                            // $.ajax({
                            //     url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
                            //     type: 'POST',
                            //     data: { fkey: StackExchange.options.user.fkey, otherText: flagText }
                            // }).done((data) => {
                            //     resolve(data);
                            // }).fail((jqXHR, textStatus, errorThrown) => {
                            //     reject({ jqXHR, textStatus, errorThrown });
                            // });
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
        if (!firstCategory) {
            dropDown.append(getDivider());
        }
        flagCategory.FlagTypes.forEach(flagType => {
            if (flagType.GetComment) {
                hasCommentOptions = true;
            }
            const dropdownItem = $('<dd />');
            if (flagCategory.BoxStyle) {
                dropdownItem.css(flagCategory.BoxStyle);
            }

            const reportLink = $('<a />').css(linkStyle);

            let linkEnabled = false;
            const disableLink = () => {
                linkEnabled = false;
                reportLink.css({ opacity: 0.5, cursor: 'default' });
            };
            const enableLink = () => {
                linkEnabled = true;
                reportLink.css({ opacity: 1, cursor: 'pointer' });
            };
            disableLink();
            copyPastorPromise.then(items => {
                if (flagType.Enabled) {
                    const hasItems = items.length > 0;
                    const isEnabled = flagType.Enabled(hasItems);
                    linkEnabled = isEnabled;
                    if (linkEnabled) {
                        enableLink();
                    }
                } else {
                    enableLink();
                }
            });

            reportLink.click(() => {
                if (!linkEnabled) {
                    return;
                }

                if (!deleted) {
                    try {
                        const result = handleFlagAndComment(postId, flagType, leaveCommentBox.is(':checked'), reputation, copyPastorPromise);
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

                const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
                const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
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

    if (hasCommentOptions) {
        dropDown.append(getDivider());

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

    return dropDown;
}

function SetupPostPage() {
    const results = parseQuestionsAndAnswers();

    for (let i = 0; i < results.Posts.length; i++) {
        const post = results.Posts[i];

        let iconLocation: JQuery;
        let advancedFlaggingLink: JQuery | null = null;

        const nattyIcon = getNattyIcon().click(() => {
            window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
        });

        let showFunc = (element: JQuery) => element.show();

        const copyPastorIcon = getCopyPastorIcon();
        const copyPastorApi = new CopyPastorAPI(post.postId);
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
                ReportVandalism: () => Promise.resolve(false)
            });

            copyPastorObservable.subscribe(items => {
                if (items.length) {
                    copyPastorIcon.attr('Title', `Reported by CopyPastor - ${items.length}`);
                    showFunc(copyPastorIcon);
                    copyPastorIcon.click(() =>
                        items.forEach(item => {
                            window.open(item.target_url);
                        })
                    );
                } else {
                    copyPastorIcon.hide();
                }
            });

            const genericBotAPI = new GenericBotAPI(post.postId);
            reporters.push({
                name: 'Generic Bot',
                ReportNaa: (answerDate: Date, questionDate: Date) => genericBotAPI.ReportNaa(),
                ReportRedFlag: () => Promise.resolve(false),
                ReportLooksFine: () => genericBotAPI.ReportLooksFine(),
                ReportNeedsEditing: () => genericBotAPI.ReportNeedsEditing(),
                ReportVandalism: () => Promise.resolve(true)
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
            ReportVandalism: () => metaSmoke.ReportVandalism()
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
            const dropDown = BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation as number, answerTime, questionTime,
                deleted,
                reportedIcon,
                performedActionIcon,
                reporters,
                copyPastorObservable.take(1).toPromise()
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
    }
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
function getCopyPastorIcon() {
    return $('<div>')
        .css({
            'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom', 'cursor': 'pointer',
            'background': 'url("https://i.imgur.com/ZQwCGvB.png?s=328&g=1"', 'background-size': '100%'
        })
        .attr('title', 'Reported by CopyPastor')
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

function SetupAdminTools() {
    const bottomBox = $('.-copyright, text-right').children('.g-column').children('.-list');
    const optionsDiv = $('<div>').text('AdvancedFlagging Admin');
    bottomBox.after(optionsDiv);

    const optionsList = $('<ul>').css({ 'list-style': 'none' });

    const clearMetaSmokeConfig = $('<a />').text('Clear Metasmoke Configuration');
    clearMetaSmokeConfig.click(async () => {
        await MetaSmokeAPI.Reset();
        location.reload();
    });

    optionsDiv.append(optionsList);
    optionsList.append($('<li>').append(clearMetaSmokeConfig));
}

$(async () => {
    CrossDomainCache.InitializeCache('https://metasmoke.erwaysoftware.com/xdom_storage.html');
    await MetaSmokeAPI.Setup(metaSmokeKey);

    SetupPostPage();
    SetupAdminTools();

    SetupStyles();
    document.body.appendChild(popupWrapper.get(0));
});
