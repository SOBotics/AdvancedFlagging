import { FlagType, flagCategories } from './FlagTypes';
import { GetNattyFeedback } from "./libs/NattyApi";
// tslint:disable-next-line:no-debugger
debugger;

declare const StackExchange: any;

function handleClick(postId: number, flag: FlagType, commentRequired: boolean, userReputation: number) {
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

    result.FlagPromise = new Promise((resolve, reject) => {
        $.ajax({
            url: `//stackoverflow.com/flags/posts/${postId}/add/${flag.ReportType}`,
            type: 'POST',
            data: { 'fkey': StackExchange.options.user.fkey, 'otherText': '' }
        }).done((data) => {
            resolve(data);
        }).fail(function (jqXHR, textStatus, errorThrown) {
            reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
        });
    })

    return result;
}

function SetupPostPage() {
    const postMenus = $('.answercell .post-menu');
    postMenus.each((index, item) => {
        const jqueryItem = $(item);

        const answerId = parseInt(jqueryItem.find('.flag-post-link').attr('data-postid'), 10);
        const reputationDiv = jqueryItem.closest('.answercell').find('.reputation-score');
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

        const checkboxName = `comment_checkbox_${answerId}`;
        const leaveCommentBox = $('<input />')
            .attr('type', 'checkbox')
            .attr('name', checkboxName)
            .prop('checked', true);

        const reportedIcon = $('<div>').addClass('comment-flag').css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' }).hide();

        const getDivider = () => $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' });
        flagCategories.forEach(flagCategory => {
            flagCategory.FlagTypes.forEach(flagType => {
                const dropdownItem = $('<dd />');
                if (flagCategory.BoxStyle) {
                    dropdownItem.css(flagCategory.BoxStyle);
                }

                const nattyLinkItem = $('<a />').css(linkStyle);
                nattyLinkItem.click(() => {
                    const result = handleClick(answerId, flagType, leaveCommentBox.is(':checked'), reputation)
                    if (result.CommentPromise) {
                        result.CommentPromise.then((data) => {
                            const commentUI = StackExchange.comments.uiForPost($('#comments-' + answerId));
                            commentUI.addShow(true, false);
                            commentUI.showComments(data, null, false, true);
                            $(document).trigger('comment', answerId);
                        })
                    }
                    if (result.FlagPromise) {
                        result.FlagPromise.then(() => reportedIcon.show());
                    }
                });

                nattyLinkItem.text(flagType.DisplayName);
                dropdownItem.append(nattyLinkItem);

                dropDown.append(dropdownItem);
            });

            dropDown.append(getDivider());
        });

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

        nattyLink.append(dropDown);
        nattyLink.hover(() => dropDown.toggle());

        jqueryItem.append(nattyLink);
        jqueryItem.append(reportedIcon);

        const nattyIcon = $('<img>').css({ 'width': '15px', 'height': '16px' })
            .attr('src', 'https://i.stack.imgur.com/aMUMt.jpg?s=328&g=1')
            .attr('title', 'Reported by Natty')
            .hide();

        GetNattyFeedback(answerId).then(nattyResult => {
            if (nattyResult.items && nattyResult.items[0]) {
                nattyIcon.show();
            }
        });

        jqueryItem.append(nattyIcon);
    })

}

$(function () {
    SetupPostPage();
});
