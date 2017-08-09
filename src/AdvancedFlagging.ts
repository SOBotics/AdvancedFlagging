import { FlagType, flagCategories } from './FlagTypes';
import { GetNattyFeedback } from './libs/NattyApi';
import { GetFromCache, StoreInCache, GetAndCache } from './libs/FunctionUtils';
import { ChatApi } from "./libs/ChatApi";
// tslint:disable-next-line:no-debugger
debugger;

const metaSmokeKey: String = '070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c';

declare const StackExchange: any;
declare const unsafeWindow: any;

const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';

(<any>unsafeWindow).resetMetaSmokeConfig = function () {
    StoreInCache(MetaSmokeDisabledConfig, false);
    StoreInCache(MetaSmokeUserKeyConfig, false);
}

function handleMetaSmoke() {
    let metasmokeDisabled = GetFromCache<boolean>(MetaSmokeDisabledConfig);
    metasmokeDisabled = false;
    if (metasmokeDisabled) {
        return;
    }
    const metaSmokeUserKey = GetFromCache<string>(MetaSmokeUserKeyConfig);
    if (!metaSmokeUserKey) {
        if (!confirm('AdvancedFlagging can connect to MetaSmoke for reporting. If you do not wish to connect, press cancel. This will only be asked once. Invoke window.resetMetaSmokeConfig() to see this again.')) {
            StoreInCache('MetaSmoke.Disabled', true);
            return;
        }
    } else {
        return;
    }

    const oldWindow = window;
    window.open(`https://metasmoke.erwaysoftware.com/oauth/request?key=${metaSmokeKey}`, '_blank');
    setTimeout(() => {
        const handleFDSCCode = () => {
            $(window).off('focus', handleFDSCCode);
            setTimeout(() => {
                const code = oldWindow.prompt('Once you\'ve authenticated FDSC with metasmoke, you\'ll be given a code; enter it here.');
                if (code) {
                    $.ajax({
                        url: `https://metasmoke.erwaysoftware.com/oauth/token?key=${metaSmokeKey}&code=${code}`,
                        method: 'GET'
                    }).done(data => {
                        StoreInCache(MetaSmokeDisabledConfig, false)
                        StoreInCache(MetaSmokeUserKeyConfig, data.token)
                    });
                }
            }, 500);
        }
        $(window).focus(handleFDSCCode);
    }, 500);
}

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

        let smokeyPromiseResolver: (value: boolean) => void;
        const smokeyPromise = new Promise<boolean>((resolve, reject) => smokeyPromiseResolver = resolve);
        let nattyPromiseResolver: (value: boolean) => void;
        const nattyPromise = new Promise<boolean>((resolve, reject) => nattyPromiseResolver = resolve);

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
                        result.FlagPromise.then(() => {
                            StoreInCache(`AdvancedFlagging.Flagged.${answerId}`, flagType);
                            reportedIcon.attr('title', `Flagged as ${flagType.ReportType}`)
                            reportedIcon.show();
                        });
                    }

                    smokeyPromise.then(r => {
                        if (r) {
                            // Flag TP
                        } else {
                            // Report
                        }
                    });

                    nattyPromise.then(r => {
                        const chat = new ChatApi();
                        if (r) {
                            if (flagType.ReportType === 'AnswerNotAnAnswer') {
                                chat.SendMessage(111347, `@Natty feedback http://stackoverflow.com/a/${answerId} tp`);
                            } else {
                                // chat.SendMessage(111347, `feedback http://stackoverflow.com/a/${answerId} fp`)
                            }
                        } else {
                            chat.SendMessage(111347, `@Natty report http://stackoverflow.com/a/${answerId}`);
                        }
                    })

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
        nattyLink.click(() => dropDown.toggle());

        jqueryItem.append(nattyLink);
        jqueryItem.append(reportedIcon);

        const nattyIcon = $('<div>')
            .css({
                'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
                'background': 'url("https://i.stack.imgur.com/aMUMt.jpg?s=328&g=1"', 'background-size': '100%'
            })
            .attr('title', 'Reported by Natty')
            .hide();

        const smokeyIcon = $('<img>')
            .css({
                'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
                'background': 'url("https://i.stack.imgur.com/WyV1l.png?s=128&g=1"', 'background-size': '100%'
            })
            .attr('title', 'Reported by Smokey')
            .hide();

        GetAndCache(`NattyFeedback.${answerId}`, () => GetNattyFeedback(answerId))
            .then(nattyResult => {
                if (nattyResult.items && nattyResult.items[0]) {
                    nattyPromiseResolver(true);
                    nattyIcon.show();
                } else {
                    nattyPromiseResolver(false);
                }
            });

        GetAndCache(`SmokeyFeedback.${answerId}`, () => new Promise((resolve, reject) => {
            $.ajax({
                url: `https://metasmoke.erwaysoftware.com/api/posts/urls?urls=//${window.location.hostname}/a/${answerId}&key=${metaSmokeKey}`,
                type: 'GET'
            }).done(result => {
                resolve(result);
            }).fail(error => {
                reject(error);
            })
        })).then((smokeyResult: any) => {
            if (smokeyResult.items.length > 0) {
                smokeyPromiseResolver(true);
                smokeyIcon.show();
            } else {
                smokeyPromiseResolver(false);
            }
        });

        const previousFlag = GetFromCache<FlagType>(`AdvancedFlagging.Flagged.${answerId}`);
        if (previousFlag) {
            reportedIcon.attr('title', `Previously flagged as ${previousFlag.ReportType}`)
            reportedIcon.show();
        }

        jqueryItem.append(nattyIcon);
        jqueryItem.append(smokeyIcon);
    })

}

$(function () {
    handleMetaSmoke();
    SetupPostPage();
});
