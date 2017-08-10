import { MetaSmokeyAPI } from './libs/MetaSmokeyAPI';
import { FlagType, flagCategories } from './FlagTypes';
import { NattyAPI } from './libs/NattyApi';
import { GetFromCache, StoreInCache, GetAndCache, InitializeCache } from './libs/Caching';
import { Delay } from './libs/FunctionUtils';
// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey = '070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c';

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

        const nattyLink = $('<a />').text('Advanced Flagging');

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

                    const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
                    const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
                    const noFlag = flagType.ReportType === 'NoFlag';
                    const needsEditing = flagType.DisplayName === 'Needs Editing'

                    metaSmokeWasReported.then(responseItems => {
                        if (responseItems.length > 0) {
                            const metaSmokeId = responseItems[0].id;
                            if (rudeFlag) {
                                metaSmoke.ReportTruePositive(metaSmokeId).then(() => displaySuccess('Reported to MS'));
                            } else if (naaFlag) {
                                metaSmoke.ReportNAA(metaSmokeId).then(() => displaySuccess('Reported to MS'));
                            } else if (noFlag) {
                                metaSmoke.ReportFalsePositive(metaSmokeId).then(() => displaySuccess('Reported to MS'));
                            }
                        } else if (rudeFlag) {
                            metaSmoke.Report(postId, postType).then(() => displaySuccess('Reported to MS'));
                        }
                    });

                    nattyWasReported.then(wasReported => {
                        if (wasReported) {
                            if (naaFlag || rudeFlag) {
                                natty.ReportTruePositive(postId).then(() => displaySuccess('Reported to natty'));
                            } else if (noFlag) {
                                if (needsEditing) {
                                    natty.ReportNeedsEditing(postId).then(() => displaySuccess('Reported to natty'));
                                } else {
                                    natty.ReportFalsePositive(postId).then(() => displaySuccess('Reported to natty'));
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

        nattyLink.append(dropDown);
        $(window).click(function () {
            dropDown.hide();
        });
        nattyLink.click(e => {
            e.stopPropagation();
            if (e.target === nattyLink.get(0)) {
                dropDown.toggle()
            }
        });

        jqueryItem.append(nattyLink);
        jqueryItem.append(reportedIcon);

        const nattyIcon = getNattyIcon();
        const smokeyIcon = getSmokeyIcon();

        metaSmokeWasReported
            .then(responseItems => {
                if (responseItems.length > 0) {
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

        jqueryItem.append(nattyIcon);
        jqueryItem.append(smokeyIcon);


    })
}

function getReportedIcon() {
    return $('<div>').addClass('comment-flag').css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' }).hide();
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
            'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
            'background': 'url("https://i.stack.imgur.com/WyV1l.png?s=128&g=1"', 'background-size': '100%'
        })
        .attr('title', 'Reported by Smokey')
        .hide()
}

function SetupNatoPage() {
    $('.answer-hyperlink').each((index, item) => {
        const jqueryItem = $(item);

        const displayStyle = { 'display': 'inline-block' };

        const reportedIcon = getReportedIcon();
        const nattyIcon = getNattyIcon();
        const smokeyIcon = getSmokeyIcon();

        jqueryItem.after(smokeyIcon);
        jqueryItem.after(nattyIcon);
        jqueryItem.after(reportedIcon);


        const postId = parseInt(jqueryItem.attr('href').split('#')[1], 10);

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

        metaSmokeWasReported
            .then(responseItems => {
                if (responseItems.length > 0) {
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

$(function () {
    InitializeCache('https://metasmoke.erwaysoftware.com/xdom_storage.html');

    SetupPostPage();
    SetupNatoPage();

    setupStyles();
    document.body.appendChild(popup.get(0));
});
