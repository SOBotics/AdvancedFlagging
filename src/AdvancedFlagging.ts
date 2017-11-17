import * as jquery from 'jquery';
import { MetaSmokeyAPI } from './libs/MetaSmokeyAPI';
import { FlagType, flagCategories } from './FlagTypes';
import { NattyAPI } from './libs/NattyApi';
import { ClearCache, GetAndCache, GetFromCache, InitializeCache, StoreInCache } from './libs/Caching';
import { Delay } from './libs/FunctionUtils';
import { StackExchangeGlobal } from './libs/StackExchangeWeb/StackExchangeOptions';
import { parseCurrentPage } from './libs/StackExchangeWeb/StackExchangeWebParser';
// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';

declare const StackExchange: StackExchangeGlobal;
declare const unsafeWindow: any;

function setupStyles() {
    const scriptNode = document.createElement('style');
    scriptNode.type = 'text/css';
    scriptNode.textContent = `
#snackbar {
    visibility: hidden;
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
    visibility: visible;
    -webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;
    animation: fadein 0.5s, fadeout 0.5s 2.5s;
}

@-webkit-keyframes fadein {
    from {top: 0; opacity: 0;}
    to {top: 30px; opacity: 1;}
}

@keyframes fadein {
    from {top: 0; opacity: 0;}
    to {top: 30px; opacity: 1;}
}

@-webkit-keyframes fadeout {
    from {top: 30px; opacity: 1;}
    to {top: 0; opacity: 0;}
}

@keyframes fadeout {
    from {top: 30px; opacity: 1;}
    to {top: 0; opacity: 0;}
}`;

    const target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
    target.appendChild(scriptNode);
};

function handleFlagAndComment(postId: number, flag: FlagType, commentRequired: boolean, userReputation?: number) {
    const result: {
        CommentPromise?: Promise<string>;
        FlagPromise?: Promise<string>;
        PerformedActionPromise?: Promise<void>
    } = {};

    if (commentRequired) {
        let commentText: string | null = null;
        if (flag.Comment) {
            commentText = flag.Comment;
        } else if (flag.Comments) {
            const comments = flag.Comments;
            comments.sort((a, b) => b.ReputationLimit - a.ReputationLimit);
            for (let i = 0; i < comments.length; i++) {
                if (userReputation === undefined || comments[i].ReputationLimit <= userReputation) {
                    commentText = comments[i].Comment;
                    break;
                }
            }
        }

        if (commentText) {
            result.CommentPromise = new Promise((resolve, reject) => {
                $.ajax({
                    url: `//stackoverflow.com/posts/${postId}/comments`,
                    type: 'POST',
                    data: { 'fkey': StackExchange.options.user.fkey, 'comment': commentText }
                }).done((data) => {
                    resolve(data);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                });
            })
        }
    }

    if (flag.ReportType !== 'NoFlag') {
        result.FlagPromise = new Promise((resolve, reject) => {
            $.ajax({
                url: `//${window.location.hostname}/flags/posts/${postId}/add/${flag.ReportType}`,
                type: 'POST',
                data: { 'fkey': StackExchange.options.user.fkey, 'otherText': '' }
            }).done((data) => {
                resolve(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
            });
        });
    }
    result.PerformedActionPromise = Promise.resolve();

    return result;
}

const popup = $('<div>').attr('id', 'snackbar');

let showingPromise: Promise<void> | null = null;
async function displaySuccess(message: string) {
    if (!showingPromise) {
        showingPromise = Delay(3500);
        popup.css('background-color', '#00690c');
        popup.text(message);
        popup.addClass('show')
        await Delay(3000);
        popup.removeClass('show');
        showingPromise = null;
    } else {
        await showingPromise;
        displaySuccess(message);
    }
}

async function displayError(message: string) {
    if (!showingPromise) {
        showingPromise = Delay(3500);
        popup.css('background-color', '#ba1701');
        popup.text(message);
        popup.addClass('show')
        await Delay(3000);
        popup.removeClass('show');
        showingPromise = null;
    } else {
        await showingPromise;
        displayError(message);
    }
}

interface Reporter {
    name: string,
    ReportNaa(answerDate: Date, questionDate: Date): Promise<boolean>;
    ReportRedFlag(): Promise<boolean>;
    ReportLooksFine(): Promise<boolean>;
    ReportNeedsEditing(): Promise<boolean>;
}
function BuildFlaggingDialog(element: JQuery,
    postId: number,
    postType: 'Question' | 'Answer',
    reputation: number | undefined,
    answerTime: Date,
    questionTime: Date,
    reportedIcon: JQuery,
    performedActionIcon: JQuery,
    reporters: Reporter[]
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

    const comments = element.find('.comment-body');
    if (comments.length === 0) {
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
            if (flagType.Comment || (flagType.Comments && flagType.Comments.length > 0)) {
                hasCommentOptions = true;
            }
            const dropdownItem = $('<dd />');
            if (flagCategory.BoxStyle) {
                dropdownItem.css(flagCategory.BoxStyle);
            }

            const nattyLinkItem = $('<a />').css(linkStyle);
            nattyLinkItem.click(() => {
                const result = handleFlagAndComment(postId, flagType, leaveCommentBox.is(':checked'), reputation)
                if (result.CommentPromise) {
                    result.CommentPromise.then((data) => {
                        const commentUI = StackExchange.comments.uiForPost($('#comments-' + postId));
                        commentUI.addShow(true, false);
                        commentUI.showComments(data, null, false, true);
                        $(document).trigger('comment', postId);
                    })
                }

                if (result.FlagPromise) {
                    result.FlagPromise.then(() => {
                        StoreInCache(`AdvancedFlagging.Flagged.${postId}`, flagType);
                        reportedIcon.attr('title', `Flagged as ${flagType.ReportType}`)
                        reportedIcon.show();
                    });
                }

                const noFlag = flagType.ReportType === 'NoFlag';
                if (noFlag && result.PerformedActionPromise) {
                    result.PerformedActionPromise.then(() => {
                        StoreInCache(`AdvancedFlagging.PerformedAction.${postId}`, flagType);
                        performedActionIcon.attr('title', `Performed action: ${flagType.DisplayName}`)
                        performedActionIcon.show();
                    })
                }

                const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
                const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
                for (var i = 0; i < reporters.length; i++) {
                    const reporter = reporters[i];
                    let promise: Promise<boolean> | null = null;
                    if (rudeFlag) {
                        promise = reporter.ReportRedFlag();
                    } else if (naaFlag) {
                        promise = reporter.ReportNaa(answerTime, questionTime);
                    } else if (noFlag) {
                        if (flagType.DisplayName === 'Needs Editing') {
                            promise = reporter.ReportNeedsEditing();
                        } else {
                            promise = reporter.ReportLooksFine();
                        }
                    }
                    if (promise) {
                        promise.then((didReport) => {
                            if (didReport) {
                                displaySuccess(`Feedback sent to ${reporter.name}`);
                            }
                        }).catch(error => displayError(`Failed to send feedback to ${reporter.name}.`));
                    }
                }

                dropDown.hide();
            });

            nattyLinkItem.text(flagType.DisplayName);
            dropdownItem.append(nattyLinkItem);

            dropDown.append(dropdownItem);
        });
        firstCategory = false;
    });

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
    const results = parseCurrentPage();

    for (var i = 0; i < results.Posts.length; i++) {
        const post = results.Posts[i];

        let iconLocation: JQuery;
        let advancedFlaggingLink: JQuery | null = null;

        const nattyIcon = getNattyIcon().click(() => {
            window.open(`https://sentinel.erwaysoftware.com/posts/aid/${post.postId}`, '_blank');
        });

        let showFunc = (element:JQuery) => element.show();

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
                ReportNeedsEditing: () => nattyApi.ReportNeedsEditing()
            });
        }
        const metaSmoke = new MetaSmokeyAPI(post.postId, post.type);
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
            ReportNeedsEditing: () => metaSmoke.ReportNeedsEditing()
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

            const dropDown = BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation, answerTime, questionTime,
                reportedIcon,
                performedActionIcon,
                reporters);

            advancedFlaggingLink.append(dropDown);

            $(window).click(function () {
                dropDown.hide();
            });
            const link = advancedFlaggingLink;
            link.click(e => {
                e.stopPropagation();
                if (e.target === link.get(0)) {
                    dropDown.toggle()
                }
            });

            iconLocation.append(advancedFlaggingLink);
            iconLocation.append(performedActionIcon);
            iconLocation.append(reportedIcon);
            iconLocation.append(nattyIcon);
            iconLocation.append(smokeyIcon);

        } else {
            iconLocation = post.element.find('a.answer-hyperlink');

            iconLocation.after(smokeyIcon);
            iconLocation.after(nattyIcon);
            iconLocation.after(reportedIcon);
            iconLocation.after(performedActionIcon);
            
            showFunc = (element: JQuery) => element.css('display', 'inline-block');
        }

        const previousFlagPromise = GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${post.postId}`);
        previousFlagPromise.then(previousFlag => {
            if (previousFlag) {
                reportedIcon.attr('title', `Previously flagged as ${previousFlag.ReportType}`)
                showFunc(reportedIcon);
            }
        });

        const previousPerformedActionPromise = GetFromCache<FlagType>(`AdvancedFlagging.PerformedAction.${post.postId}`);
        previousPerformedActionPromise.then(previousAction => {
            if (previousAction && previousAction.ReportType === 'NoFlag') {
                performedActionIcon.attr('title', `Previously performed action: ${previousAction.DisplayName}`)
                showFunc(performedActionIcon);
            }
        });
    }
}

function getPerformedActionIcon() {
    return $('<div>').addClass('comment-flag')
        .css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' })
        .css({ 'width': '15px', 'height': '15px', 'background-position': '-20px -320px' })
        .css({ 'cursor': 'default' })
        .hide();
}

function getReportedIcon() {
    return $('<div>').addClass('comment-flag')
        .css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' })
        .css({ 'cursor': 'default' })
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
    clearMetaSmokeConfig.click(() => {
        MetaSmokeyAPI.Reset();
        location.reload();
    });

    const clearAllCachedInfo = $('<a />').text('Clear all cached info');
    clearAllCachedInfo.click(() => {
        ClearCache();
        location.reload();
    });

    optionsDiv.append(optionsList);
    optionsList.append($('<li>').append(clearMetaSmokeConfig));
    optionsList.append($('<li>').append(clearAllCachedInfo));
}

$(async function () {
    InitializeCache('https://metasmoke.erwaysoftware.com/xdom_storage.html');
    await MetaSmokeyAPI.Setup(metaSmokeKey);

    SetupPostPage();
    SetupAdminTools();

    setupStyles();
    document.body.appendChild(popup.get(0));
});
