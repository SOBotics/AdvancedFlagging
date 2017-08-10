import { MetaSmokeyAPI } from './libs/MetaSmokeyAPI';
import { FlagType, flagCategories } from './FlagTypes';
import { NattyAPI } from './libs/NattyApi';
import { GetFromCache, StoreInCache, GetAndCache } from './libs/FunctionUtils';
// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey = '070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c';

declare const StackExchange: any;
declare const unsafeWindow: any;

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

function SetupPostPage() {
    const postMenus = $('.post-menu');
    postMenus.each((index, item) => {
        const jqueryItem = $(item);

        const postType = jqueryItem.closest('.answercell').length > 0
            ? 'Answer'
            : 'Question';

        const postId = parseInt(jqueryItem.find('.flag-post-link').attr('data-postid'), 10);

        const reputationDiv = jqueryItem.closest(postType == 'Answer' ? '.answercell' : '.postcell').find('.reputation-score');

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
            .attr('name', checkboxName)
            .prop('checked', true);


        const metaSmoke = new MetaSmokeyAPI(metaSmokeKey);
        const metaSmokeWasReported = metaSmoke.GetFeedback(postId, postType);

        const natty = new NattyAPI();
        const nattyWasReported = natty.WasReported(postId);

        const reportedIcon = $('<div>').addClass('comment-flag').css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' }).hide();
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

                    const rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType == 'PostOffensive';
                    const naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
                    const looksOk = flagType.ReportType === 'NoFlag';

                    metaSmokeWasReported.then(responseItems => {
                        debugger;
                        if (responseItems.length > 0) {
                            const metaSmokeId = responseItems[0].id;
                            if (rudeFlag) {
                                metaSmoke.ReportTruePositive(metaSmokeId);
                            } else if (naaFlag) {
                                metaSmoke.ReportNAA(metaSmokeId);
                            } else if (looksOk) {
                                metaSmoke.ReportFalsePositive(metaSmokeId);
                            }
                        } else if (rudeFlag) {
                            metaSmoke.Report(postId, postType);
                        }
                    });

                    nattyWasReported.then(wasReported => {
                        if (wasReported) {
                            if (naaFlag) {
                                natty.ReportTruePositive(postId);
                            } else if (looksOk) {
                                natty.ReportFalsePositive(postId);
                            }
                        } else if (naaFlag) {
                            natty.Report(postId);
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

        const nattyIcon = $('<div>')
            .css({
                'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
                'background': 'url("https://i.stack.imgur.com/aMUMt.jpg?s=328&g=1"', 'background-size': '100%'
            })
            .attr('title', 'Reported by Natty')
            .hide();

        const smokeyIcon = $('<div>')
            .css({
                'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
                'background': 'url("https://i.stack.imgur.com/WyV1l.png?s=128&g=1"', 'background-size': '100%'
            })
            .attr('title', 'Reported by Smokey')
            .hide();

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

$(function () {
    SetupPostPage();
});
