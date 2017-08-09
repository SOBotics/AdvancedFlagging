"use strict";
define("FlagTypes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flagCategories = [
        {
            BoxStyle: { 'padding-left': '5px', 'background-color': 'rgba(241, 148, 148, 0.6)' },
            FlagTypes: [
                {
                    DisplayName: 'Spam',
                    ReportType: 'PostSpam'
                },
                {
                    DisplayName: 'Rude or Abusive',
                    ReportType: 'PostOffensive'
                }
            ]
        },
        {
            BoxStyle: { 'padding-left': '5px' },
            FlagTypes: [
                {
                    DisplayName: 'Link Only',
                    ReportType: 'AnswerNotAnAnswer',
                    Comment: 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
                        '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
                        'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
                        'page you\'re linking to in case the target page is unavailable. ' +
                        '[Answers that are little more than a link may be deleted.](//stackoverflow.com/help/deleted-answers)'
                },
                {
                    DisplayName: 'Not an answer',
                    ReportType: 'AnswerNotAnAnswer',
                    Comments: [
                        {
                            ReputationLimit: 0,
                            Comment: 'This does not provide an answer to the question. You can [search for similar questions](//stackoverflow.com/search), ' +
                                'or refer to the related and linked questions on the right-hand side of the page to find an answer. ' +
                                'If you have a related but different question, [ask a new question](//stackoverflow.com/questions/ask), ' +
                                'and include a link to this one to help provide context. ' +
                                'See: [Ask questions, get answers, no distractions](//stackoverflow.com/tour)',
                        },
                        {
                            ReputationLimit: 50,
                            Comment: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be ' +
                                'an explicit attempt to *answer* this question; if you have a critique or need a clarification of ' +
                                'the question or another answer, you can [post a comment](//stackoverflow.com/help/privileges/comment) ' +
                                '(like this one) directly below it. Please remove this answer and create either a comment or a new question. ' +
                                'See: [Ask questions, get answers, no distractions](//stackoverflow.com/tour)',
                        }
                    ]
                },
                {
                    DisplayName: 'Thanks',
                    ReportType: 'AnswerNotAnAnswer',
                    Comment: 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                        'and can be perceived as noise by its future visitors. Once you [earn](http://meta.stackoverflow.com/q/146472) ' +
                        'enough [reputation](http://stackoverflow.com/help/whats-reputation), you will gain privileges to ' +
                        '[upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                        'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                        'See [Why is voting important](http://stackoverflow.com/help/why-vote).',
                },
                {
                    DisplayName: 'Me too',
                    ReportType: 'AnswerNotAnAnswer',
                    Comment: 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
                        'If you have a different but related question, then [ask](//$SITEURL$/questions/ask) it ' +
                        '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
                        'you can [upvote](//stackoverflow.com/help/privileges/vote-up) it, leave a [comment](//stackoverflow.com/help/privileges/comment), ' +
                        'or start a [bounty](//stackoverflow.com/help/privileges/set-bounties) ' +
                        'once you have enough [reputation](//stackoverflow.com/help/whats-reputation).',
                },
                {
                    DisplayName: 'Library',
                    ReportType: 'AnswerNotAnAnswer',
                    Comment: 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](http://meta.stackoverflow.com/a/251605) in the answer itself.'
                }
            ]
        }
    ];
});
define("AdvancedFlagging", ["require", "exports", "FlagTypes"], function (require, exports, FlagTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:no-debugger
    debugger;
    function handleClick(postId, flag, commentRequired, userReputation) {
        var result = {};
        if (commentRequired) {
            var commentText_1 = null;
            if (flag.Comment) {
                commentText_1 = flag.Comment;
            }
            else if (flag.Comments) {
                var comments = flag.Comments;
                comments.sort(function (a, b) { return b.ReputationLimit - a.ReputationLimit; });
                for (var i = 0; i < comments.length; i++) {
                    if (comments[i].ReputationLimit <= userReputation) {
                        commentText_1 = comments[i].Comment;
                        break;
                    }
                }
            }
            if (commentText_1) {
                result.CommentPromise = new Promise(function (resolve, reject) {
                    $.ajax({
                        url: "//stackoverflow.com/posts/" + postId + "/comments",
                        type: 'POST',
                        data: { 'fkey': StackExchange.options.user.fkey, 'comment': commentText_1 }
                    }).done(function (data) {
                        resolve(data);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                    });
                });
            }
        }
        result.FlagPromise = new Promise(function (resolve, reject) {
            $.ajax({
                url: "//stackoverflow.com/flags/posts/" + postId + "/add/" + flag.ReportType,
                type: 'POST',
                data: { 'fkey': StackExchange.options.user.fkey, 'otherText': '' }
            }).done(function (data) {
                resolve(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
            });
        });
        return result;
    }
    function SetupPostPage() {
        var postMenus = $('.answercell .post-menu');
        postMenus.each(function (index, item) {
            var jqueryItem = $(item);
            var answerId = parseInt(jqueryItem.find('.flag-post-link').attr('data-postid'), 10);
            var reputationDiv = jqueryItem.closest('.answercell').find('.reputation-score');
            var reputationText = reputationDiv.text();
            if (reputationText.indexOf('k') !== -1) {
                reputationText = reputationDiv.attr('title').substr('reputation score '.length);
            }
            reputationText = reputationText.replace(',', '');
            var reputation = parseInt(reputationText, 10);
            var nattyLink = $('<a />').text('Natty ' + answerId);
            var dropDown = $('<dl />').css({
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
            var linkStyle = { 'display': 'inline-block', 'margin-top': '5px', 'width': 'auto' };
            var checkboxName = "comment_checkbox_" + answerId;
            var leaveCommentBox = $('<input />')
                .attr('type', 'checkbox')
                .attr('name', checkboxName)
                .prop('checked', true);
            var reportedIcon = $('<div>').addClass('comment-flag').css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' }).hide();
            var getDivider = function () { return $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' }); };
            FlagTypes_1.flagCategories.forEach(function (flagCategory) {
                flagCategory.FlagTypes.forEach(function (flagType) {
                    var dropdownItem = $('<dd />');
                    if (flagCategory.BoxStyle) {
                        dropdownItem.css(flagCategory.BoxStyle);
                    }
                    var nattyLinkItem = $('<a />').css(linkStyle);
                    nattyLinkItem.click(function () {
                        var result = handleClick(answerId, flagType, leaveCommentBox.is(':checked'), reputation);
                        if (result.CommentPromise) {
                            result.CommentPromise.then(function (data) {
                                var commentUI = StackExchange.comments.uiForPost($('#comments-' + answerId));
                                commentUI.addShow(true, false);
                                commentUI.showComments(data, null, false, true);
                                $(document).trigger('comment', answerId);
                            });
                        }
                        if (result.FlagPromise) {
                            result.FlagPromise.then(function () { return reportedIcon.show(); });
                        }
                    });
                    nattyLinkItem.text(flagType.DisplayName);
                    dropdownItem.append(nattyLinkItem);
                    dropDown.append(dropdownItem);
                });
                dropDown.append(getDivider());
            });
            var commentBoxLabel = $('<label />').text('Leave comment')
                .attr('for', checkboxName)
                .css({
                'margin-right': '5px',
                'margin-left': '4px',
            });
            commentBoxLabel.click(function () { return leaveCommentBox.click(); });
            var commentingRow = $('<dd />');
            commentingRow.append(commentBoxLabel);
            commentingRow.append(leaveCommentBox);
            dropDown.append(commentingRow);
            nattyLink.append(dropDown);
            nattyLink.hover(function () { return dropDown.toggle(); });
            jqueryItem.append(nattyLink);
            jqueryItem.append(reportedIcon);
        });
    }
    $(function () {
        SetupPostPage();
    });
});
require(['AdvancedFlagging']);
define("libs/FunctionUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var hasStorage = typeof (Storage) !== undefined;
    function GetAndCache(cacheKey, getterPromise, expiresAt) {
        var cachedItem = GetFromCache(cacheKey);
        if (cachedItem) {
            return Promise.resolve(cachedItem);
        }
        getterPromise.then(function (result) { StoreInCache(cacheKey, result, expiresAt); });
        return getterPromise;
    }
    exports.GetAndCache = GetAndCache;
    function GetFromCache(cacheKey) {
        if (hasStorage) {
            var cachedItem = localStorage.getItem(cacheKey);
            if (cachedItem) {
                try {
                    var actualItem = JSON.parse(cachedItem);
                    if (actualItem.Expires && actualItem.Expires < new Date()) {
                        // It expired, so return nothing
                        return;
                    }
                    return actualItem.Data;
                }
                catch (error) { }
            }
        }
    }
    exports.GetFromCache = GetFromCache;
    function StoreInCache(cacheKey, item, expiresAt) {
        if (hasStorage) {
            var jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
            localStorage.setItem(cacheKey, jsonStr);
        }
    }
    exports.StoreInCache = StoreInCache;
    function GroupBy(collection, propertyGetter) {
        return collection.reduce(function (previousValue, currentItem) {
            (previousValue[propertyGetter(currentItem)] = previousValue[propertyGetter(currentItem)] || []).push(currentItem);
            return previousValue;
        }, {});
    }
    exports.GroupBy = GroupBy;
    ;
    function GetMembers(item) {
        var members = [];
        for (var key in item) {
            if (item.hasOwnProperty(key)) {
                members.push(key);
            }
        }
        return members;
    }
    exports.GetMembers = GetMembers;
});
define("libs/ChatApi", ["require", "exports", "libs/FunctionUtils"], function (require, exports, FunctionUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChatApi = (function () {
        function ChatApi(chatUrl) {
            if (chatUrl === void 0) { chatUrl = 'https://chat.stackoverflow.com'; }
            this.chatRoomUrl = "" + chatUrl;
        }
        ChatApi.prototype.GetChannelFKey = function (roomId) {
            var _this = this;
            var cachingKey = "StackExchange.ChatApi.FKey_" + roomId;
            var getterPromise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: _this.chatRoomUrl + "/rooms/" + roomId,
                    type: 'GET'
                }).done(function (data, textStatus, jqXHR) {
                    var fkey = data.match(/hidden" value="([\dabcdef]{32})/)[1];
                    resolve(fkey);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                });
            });
            return FunctionUtils_1.GetAndCache(cachingKey, getterPromise);
        };
        ChatApi.prototype.SendMessage = function (roomId, message, providedFkey) {
            var _this = this;
            var fkeyPromise;
            if (!providedFkey) {
                fkeyPromise = this.GetChannelFKey(roomId);
            }
            else {
                fkeyPromise = Promise.resolve(providedFkey);
            }
            return fkeyPromise.then(function (fKey) {
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        url: _this.chatRoomUrl + "/chats/" + roomId + "/messages/new",
                        type: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                    })
                        .done(function () { return resolve(); })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                        reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                    });
                });
            });
        };
        return ChatApi;
    }());
    exports.ChatApi = ChatApi;
});
define("libs/NattyApi", ["require", "exports", "libs/FunctionUtils"], function (require, exports, FunctionUtils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var nattyFeedbackUrl = 'http://samserver.bhargavrao.com:8000/napi/api/feedback';
    function GetNattyFeedback(answerId) {
        var getterPromise = new Promise(function (resolve, reject) {
            $.ajax({
                url: nattyFeedbackUrl + "/" + answerId,
                type: 'GET',
                dataType: 'json'
            }).done(function (data, textStatus, jqXHR) {
                resolve(data);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
            });
        });
        return FunctionUtils_2.GetAndCache("NattyApi.Feedback." + answerId, getterPromise);
    }
    exports.GetNattyFeedback = GetNattyFeedback;
});
define("libs/StackExchangeApi.Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("libs/StackExchangeApi", ["require", "exports", "libs/FunctionUtils"], function (require, exports, FunctionUtils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var stackExchangeApiURL = '//api.stackexchange.com/2.2';
    var StackExchangeAPI = (function () {
        function StackExchangeAPI(clientId, key) {
            this.initializeAccessToken(clientId, key);
        }
        StackExchangeAPI.prototype.initializeAccessToken = function (clientId, key) {
            if (typeof clientId === 'string') {
                this.getAccessTokenPromise = function () { return Promise.resolve(clientId); };
                return;
            }
            if (!clientId || !key) {
                this.getAccessTokenPromise = function () { throw Error('Access token not available. StackExchangeAPI class must be passed either an access token, or a clientId and a key.'); };
                return;
            }
            var promise = new Promise(function (resolve, reject) {
                SE.init({
                    clientId: clientId,
                    key: key,
                    channelUrl: window.location,
                    complete: function (data) {
                        SE.authenticate({
                            success: function (result) {
                                resolve(result.accessToken);
                            },
                            error: function (error) {
                                reject(error);
                            },
                            networkUsers: true
                        });
                    }
                });
            });
            this.getAccessTokenPromise = function () { return promise; };
        };
        StackExchangeAPI.prototype.Answers_GetComments = function (answerIds, skipCache, site, filter) {
            if (skipCache === void 0) { skipCache = false; }
            if (site === void 0) { site = 'stackoverflow'; }
            return this.MakeRequest(function (objectId) { return "StackExchange.Api.AnswerComments." + objectId; }, function (objectIds) { return stackExchangeApiURL + "/answers/" + objectIds.join(';') + "/comments"; }, function (comment) { return comment.post_id; }, answerIds, skipCache, site, true, filter);
        };
        StackExchangeAPI.prototype.MakeRequest = function (cacheKey, apiUrl, uniqueIdentifier, objectIds, skipCache, site, multi, filter) {
            var cachedResults = this.GetCachedItems(objectIds.slice(), skipCache, cacheKey);
            return new Promise(function (resolve, reject) {
                if (objectIds.length > 0) {
                    var url = apiUrl(objectIds) + ("?site=" + site);
                    if (filter) {
                        url += "?filter=" + filter;
                    }
                    ;
                    $.ajax({
                        url: url,
                        type: 'GET',
                    }).done(function (data, textStatus, jqXHR) {
                        var returnItems = (data.items || []);
                        var grouping = FunctionUtils_3.GroupBy(returnItems, uniqueIdentifier);
                        FunctionUtils_3.GetMembers(grouping).forEach(function (key) { return FunctionUtils_3.StoreInCache(cacheKey(parseInt(key, 10)), grouping[key]); });
                        cachedResults.forEach(function (result) {
                            returnItems.push(result);
                        });
                        resolve(returnItems);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                    });
                }
                else {
                    resolve(cachedResults);
                }
            });
        };
        StackExchangeAPI.prototype.GetCachedItems = function (objectIds, skipCache, cacheKey) {
            var cachedResults = [];
            if (!skipCache) {
                objectIds.forEach(function (objectId) {
                    var cachedResult = FunctionUtils_3.GetFromCache(cacheKey(objectId));
                    if (cachedResult) {
                        var itemIndex = objectIds.indexOf(objectId);
                        if (itemIndex > -1) {
                            objectIds.splice(itemIndex, 1);
                        }
                        cachedResult.forEach(function (r) { return cachedResults.push(r); });
                    }
                });
            }
            return cachedResults;
        };
        return StackExchangeAPI;
    }());
    exports.StackExchangeAPI = StackExchangeAPI;
});
