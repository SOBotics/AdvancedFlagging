import * as jquery from 'jquery';
import { MetaSmokeyAPI } from './libs/MetaSmokeyAPI';
import { FlagType, flagCategories } from './FlagTypes';
import { NattyAPI } from './libs/NattyApi';
import { ClearCache, GetAndCache, GetFromCache, InitializeCache, StoreInCache } from './libs/Caching';
import { Delay } from './libs/FunctionUtils';
// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';

declare const StackExchange: any;
declare const unsafeWindow: any;

function setupStyles() {
    const scriptNode = document.createElement('style');
    scriptNode.type = 'text/css';
    scriptNode.textContent = `
#snackbar {
    visibility: hidden;
    min-width: 250px;
    margin-left: -125px;
    background-color: #00690c;
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

function handleFlagAndComment(postId: number, flag: FlagType, commentRequired: boolean, userReputation: number) {
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
                if (comments[i].ReputationLimit <= userReputation) {
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

const metaSmoke = new MetaSmokeyAPI(metaSmokeKey);
const natty = new NattyAPI();

function SetupPostPage() {
    const postMenus = $('.post-menu');

    postMenus.each((index, item) => {
        const jqueryItem = $(item);

        const postType = jqueryItem.closest('.answercell').length > 0
            ? 'Answer'
            : 'Question';

        const postId = parseInt(jqueryItem.find('.flag-post-link').attr('data-postid'), 10);

        const reputationDiv = jqueryItem.closest(postType === 'Answer' ? '.answercell' : '.postcell').find('.reputation-score');

        let reputationText = reputationDiv.text();
        if (reputationText.indexOf('k') !== -1) {
            reputationText = reputationDiv.attr('title').substr('reputation score '.length);
        }
        reputationText = reputationText.replace(',', '');
        const reputation = parseInt(reputationText, 10);

        const advancedFlaggingLink = $('<a />').text('Advanced Flagging');

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

        const linkStyle = { 'display': 'inline-block', 'margin-top': '5px', 'width': 'auto' };

        const checkboxName = `comment_checkbox_${postId}`;
        const leaveCommentBox = $('<input />')
            .attr('type', 'checkbox')
            .attr('name', checkboxName);

        const postDiv = jqueryItem.closest(postType === 'Answer' ? '.answer' : '.question');
        const comments = postDiv.find('.comment-body');
        if (comments.length === 0) {
            leaveCommentBox.prop('checked', true);
        }

        const metaSmokeWasReported = metaSmoke.GetFeedback(postId, postType);
        const nattyWasReported = natty.WasReported(postId);

        const performedActionIcon = getPerformedActionIcon();
        const reportedIcon = getReportedIcon();
        const getDivider = () => $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' });

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
                    
                    const needsEditing = flagType.DisplayName === 'Needs Editing'

                    metaSmokeWasReported.then(responseItems => {
                        if (responseItems.length > 0) {
                            const metaSmokeId = responseItems[0].id;
                            if (rudeFlag) {
                                metaSmoke.ReportTruePositive(metaSmokeId).then(() => displaySuccess('Feedback sent to MS'));
                            } else if (naaFlag) {
                                metaSmoke.ReportNAA(metaSmokeId).then(() => displaySuccess('Feedback sent to MS'));
                            } else if (noFlag) {
                                metaSmoke.ReportFalsePositive(metaSmokeId).then(() => displaySuccess('Feedback sent to MS'));
                            }
                        } else if (rudeFlag) {
                            metaSmoke.Report(postId, postType).then(() => displaySuccess('Reported to MS'));
                        }
                    });

                    nattyWasReported.then(wasReported => {
                        if (wasReported) {
                            if (naaFlag || rudeFlag) {
                                natty.ReportTruePositive(postId).then(() => displaySuccess('Feedback sent to natty'));
                            } else if (noFlag) {
                                if (needsEditing) {
                                    natty.ReportNeedsEditing(postId).then(() => displaySuccess('Feedback sent to natty'));
                                } else {
                                    natty.ReportFalsePositive(postId).then(() => displaySuccess('Feedback sent to natty'));
                                }
                            }
                        } else if (naaFlag) {
                            natty.Report(postId).then(() => displaySuccess('Reported to natty'));
                        }
                    });

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

        advancedFlaggingLink.append(dropDown);
        $(window).click(function () {
            dropDown.hide();
        });
        advancedFlaggingLink.click(e => {
            e.stopPropagation();
            if (e.target === advancedFlaggingLink.get(0)) {
                dropDown.toggle()
            }
        });

        jqueryItem.append(advancedFlaggingLink);
        jqueryItem.append(performedActionIcon);
        jqueryItem.append(reportedIcon);

        const nattyIcon = getNattyIcon();
        const smokeyIcon = getSmokeyIcon();

        metaSmokeWasReported
            .then(responseItems => {
                if (responseItems.length > 0) {
                    const metaSmokeId = responseItems[0].id;
                    smokeyIcon.click(() => {
                        window.open(`https://metasmoke.erwaysoftware.com/post/${metaSmokeId}`, '_blank');
                    });

                    smokeyIcon.show();
                }
            });

        nattyWasReported
            .then(wasReported => {
                if (wasReported) {
                    nattyIcon.show();
                }
            });

        const previousFlagPromise = GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${postId}`);
        previousFlagPromise.then(previousFlag => {
            if (previousFlag) {
                reportedIcon.attr('title', `Previously flagged as ${previousFlag.ReportType}`)
                reportedIcon.show();
            }
        });

        const previousPerformedActionPromise = GetFromCache<FlagType>(`AdvancedFlagging.PerformedAction.${postId}`);
        previousPerformedActionPromise.then(previousAction => {
            if (previousAction && previousAction.ReportType === 'NoFlag') {
                performedActionIcon.attr('title', `Previously performed action: ${previousAction.DisplayName}`)
                performedActionIcon.show();
            }
        });

        jqueryItem.append(nattyIcon);
        jqueryItem.append(smokeyIcon);
// xdLocalStorage.clear(function (data) { /* callback */ });

    })
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
            'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
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
        .hide()
}

function SetupAnswerLinks() {
    $('a.answer-hyperlink').each((index, item) => {
        const jqueryItem = $(item);

        const displayStyle = { 'display': 'inline-block' };

        const performedActionIcon = getPerformedActionIcon();
        const reportedIcon = getReportedIcon();
        const nattyIcon = getNattyIcon();
        const smokeyIcon = getSmokeyIcon();

        jqueryItem.after(smokeyIcon);
        jqueryItem.after(nattyIcon);
        jqueryItem.after(reportedIcon);
        jqueryItem.after(performedActionIcon);

        const hyperLink = jqueryItem.attr('href');
        const postId = parseInt(hyperLink.split('#')[1], 10);

        const metaSmoke = new MetaSmokeyAPI(metaSmokeKey);
        const metaSmokeWasReported = metaSmoke.GetFeedback(postId, 'Answer');

        const natty = new NattyAPI();
        const nattyWasReported = natty.WasReported(postId);

        const previousFlagPromise = GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${postId}`);
        previousFlagPromise.then(previousFlag => {
            if (previousFlag) {
                reportedIcon.attr('title', `Previously flagged as ${previousFlag.ReportType}`)
                reportedIcon.show();
            }
        });

        const previousPerformedActionPromise = GetFromCache<FlagType>(`AdvancedFlagging.PerformedAction.${postId}`);
        previousPerformedActionPromise.then(previousAction => {
            if (previousAction && previousAction.ReportType === 'NoFlag') {
                performedActionIcon.attr('title', `Previously performed action: ${previousAction.DisplayName}`)
                performedActionIcon.show();
            }
        });

        metaSmokeWasReported
            .then(responseItems => {
                if (responseItems.length > 0) {
                    const metaSmokeId = responseItems[0].id;
                    smokeyIcon.click(() => {
                        window.open(`https://metasmoke.erwaysoftware.com/post/${metaSmokeId}`, '_blank');
                    });

                    smokeyIcon.css(displayStyle);
                }
            });

        nattyWasReported
            .then(wasReported => {
                if (wasReported) {
                    nattyIcon.css(displayStyle);
                }
            });
    });
}

function SetupAdminTools() {
    const bottomBox = $('.-copyright, text-right').children('.g-column').children('.-list');
    const optionsDiv = $('<div>').text('AdvancedFlagging Admin');
    bottomBox.after(optionsDiv);

    var optionsList = $('<ul>').css({'list-style': 'none' });

    const clearMetaSmokeConfig =$('<a />').text('Clear Metasmoke Configuration');
    clearMetaSmokeConfig.click(() => {
        metaSmoke.Reset();
    });

    const clearAllCachedInfo = $('<a />').text('Clear all cached info');
    clearAllCachedInfo.click(() => {
        ClearCache();
    });

    optionsDiv.append(optionsList);
    optionsList.append($('<li>').append(clearMetaSmokeConfig));
    optionsList.append($('<li>').append(clearAllCachedInfo));
}

$(function () {
    InitializeCache('https://metasmoke.erwaysoftware.com/xdom_storage.html');

    SetupPostPage();
    SetupAnswerLinks();
    SetupAdminTools();

    setupStyles();
    document.body.appendChild(popup.get(0));
});
