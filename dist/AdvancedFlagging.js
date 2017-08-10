"use strict";
define("libs/FunctionUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:typeof-compare
    var hasStorage = typeof (Storage) !== undefined;
    var xdLocalStorageInitializedResolver = function () { };
    var xdLocalStorageInitialized = new Promise(function (resolve, reject) { return xdLocalStorageInitializedResolver = resolve; });
    xdLocalStorage.init({
        iframeUrl: "https://metasmoke.erwaysoftware.com/xdom_storage.html",
        initCallback: function () {
            xdLocalStorageInitializedResolver();
        }
    });
    function GetAndCache(cacheKey, getterPromise, expiresAt) {
        var cachedItemPromise = GetFromCache(cacheKey);
        return new Promise(function (resolve) {
            cachedItemPromise.then(function (cachedItem) {
                if (cachedItem) {
                    resolve(cachedItem);
                    return;
                }
                var promise = getterPromise();
                promise.then(function (result) { StoreInCache(cacheKey, result, expiresAt); });
                promise.then(function (result) { return resolve(result); });
            });
        });
    }
    exports.GetAndCache = GetAndCache;
    function GetFromCache(cacheKey) {
        return new Promise(function (resolve, reject) {
            xdLocalStorageInitialized.then(function () {
                xdLocalStorage.getItem(cacheKey, function (data) {
                    var actualItem = JSON.parse(data.value);
                    if (!actualItem || (actualItem.Expires && actualItem.Expires < new Date())) {
                        // It doesn't exist or is expired, so return nothing
                        resolve();
                        return;
                    }
                    return resolve(actualItem.Data);
                });
            });
        });
    }
    exports.GetFromCache = GetFromCache;
    function StoreInCache(cacheKey, item, expiresAt) {
        xdLocalStorageInitialized.then(function () {
            var jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
            xdLocalStorage.setItem(cacheKey, jsonStr);
        });
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
define("libs/MetaSmokeyAPI", ["require", "exports", "libs/FunctionUtils"], function (require, exports, FunctionUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
    var MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
    var MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';
    var MetaSmokeyAPI = (function () {
        function MetaSmokeyAPI(appKey, codeGetter) {
            var _this = this;
            if (!codeGetter) {
                codeGetter = function (metaSmokeOAuthUrl) {
                    return new Promise(function (resolve, reject) {
                        var isDisabledPromise = _this.IsDisabled();
                        isDisabledPromise.then(function (isDisabled) {
                            if (isDisabled) {
                                reject();
                                return;
                            }
                            var cachedUserKeyPromise = FunctionUtils_1.GetFromCache(MetaSmokeUserKeyConfig);
                            cachedUserKeyPromise.then(function (cachedUserKey) {
                                if (cachedUserKey) {
                                    resolve(cachedUserKey);
                                    return;
                                }
                                var metaSmokeUserKeyPromise = FunctionUtils_1.GetFromCache(MetaSmokeUserKeyConfig);
                                metaSmokeUserKeyPromise.then(function (metaSmokeUserKey) {
                                    if (!metaSmokeUserKey) {
                                        if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, call window.resetMetaSmokeConfiguration().')) {
                                            FunctionUtils_1.StoreInCache('MetaSmoke.Disabled', true);
                                            reject();
                                            return;
                                        }
                                    }
                                    window.open(metaSmokeOAuthUrl, '_blank');
                                    setTimeout(function () {
                                        var handleFDSCCode = function () {
                                            $(window).off('focus', handleFDSCCode);
                                            var code = window.prompt('Once you\'ve authenticated FDSC with metasmoke, you\'ll be given a code; enter it here.');
                                            if (!code) {
                                                reject();
                                                return;
                                            }
                                            resolve(code);
                                        };
                                        $(window).focus(handleFDSCCode);
                                    }, 100);
                                });
                            });
                        });
                    });
                };
            }
            this.codeGetter = codeGetter;
            this.appKey = appKey;
            this.appendResetToWindow();
            this.getUserKey(); // Make sure we request it immediately
        }
        MetaSmokeyAPI.prototype.getUserKey = function () {
            var _this = this;
            return FunctionUtils_1.GetAndCache(MetaSmokeUserKeyConfig, function () { return new Promise(function (resolve, reject) {
                _this.codeGetter("https://metasmoke.erwaysoftware.com/oauth/request?key=" + _this.appKey)
                    .then(function (code) {
                    $.ajax({
                        url: "https://metasmoke.erwaysoftware.com/oauth/token?key=" + _this.appKey + "&code=" + code,
                        method: "GET"
                    }).done(function (data) { return resolve(data.token); })
                        .fail(function (err) { return reject(err); });
                });
            }); });
        };
        MetaSmokeyAPI.prototype.appendResetToWindow = function () {
            FunctionUtils_1.StoreInCache(MetaSmokeDisabledConfig, undefined);
            if (!localStorage) {
                return;
            }
            var scriptNode = document.createElement('script');
            scriptNode.type = 'text/javascript';
            scriptNode.textContent = "\n    window.resetMetaSmokeConfiguration = function() {\n        xdLocalStorage.removeItem('" + MetaSmokeDisabledConfig + "'); \n        xdLocalStorage.removeItem('" + MetaSmokeUserKeyConfig + "', undefined);\n    }\n    ";
            var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
            target.appendChild(scriptNode);
        };
        MetaSmokeyAPI.prototype.IsDisabled = function () {
            var disabledConfigPromise = FunctionUtils_1.GetFromCache(MetaSmokeDisabledConfig);
            return new Promise(function (resolve) {
                disabledConfigPromise.then(function (disabledConfig) {
                    if (disabledConfig === undefined) {
                        resolve(false);
                        return;
                    }
                    resolve(disabledConfig);
                });
            });
        };
        MetaSmokeyAPI.prototype.GetFeedback = function (postId, postType) {
            var _this = this;
            var urlStr = postType === 'Answer'
                ? "//" + window.location.hostname + "/a/" + postId
                : "//" + window.location.hostname + "/questions/" + postId;
            var isDisabledPromise = this.IsDisabled();
            return new Promise(function (resolve, reject) {
                isDisabledPromise.then(function (disabled) {
                    if (disabled) {
                        resolve([]);
                        return;
                    }
                    FunctionUtils_1.GetAndCache(MetaSmokeWasReportedConfig + "." + urlStr, function () { return new Promise(function (resolve, reject) {
                        $.ajax({
                            type: 'GET',
                            url: 'https://metasmoke.erwaysoftware.com/api/posts/urls',
                            data: {
                                urls: urlStr,
                                key: "" + _this.appKey
                            }
                        }).done(function (result) {
                            debugger;
                            resolve(result.items);
                        }).fail(function (error) {
                            reject(error);
                        });
                    }); })
                        .then(function (result) { return resolve(result); });
                });
            });
        };
        MetaSmokeyAPI.prototype.Report = function (postId, postType) {
            var _this = this;
            var urlStr = postType === 'Answer'
                ? "//" + window.location.hostname + "/a/" + postId
                : "//" + window.location.hostname + "/q/" + postId;
            return new Promise(function (resolve, reject) {
                _this.getUserKey().then(function (userKey) {
                    $.ajax({
                        type: "POST",
                        url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                        data: {
                            post_link: urlStr,
                            key: _this.appKey,
                            token: userKey
                        }
                    }).done(function () { return resolve(); })
                        .fail(function () { return reject(); });
                });
            });
        };
        MetaSmokeyAPI.prototype.ReportTruePositive = function (metaSmokeId) {
            return this.SendFeedback(metaSmokeId, 'tpu-');
        };
        MetaSmokeyAPI.prototype.ReportFalsePositive = function (metaSmokeId) {
            return this.SendFeedback(metaSmokeId, 'fp-');
        };
        MetaSmokeyAPI.prototype.ReportNAA = function (metaSmokeId) {
            return this.SendFeedback(metaSmokeId, 'naa-');
        };
        MetaSmokeyAPI.prototype.SendFeedback = function (metaSmokeId, feedbackType) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.getUserKey().then(function (userKey) {
                    $.ajax({
                        type: "POST",
                        url: "https://metasmoke.erwaysoftware.com/api/w/post/" + metaSmokeId + "/feedback",
                        data: {
                            type: feedbackType,
                            key: _this.appKey,
                            token: userKey
                        }
                    }).done(function () { return resolve(); })
                        .fail(function () { return reject(); });
                });
            });
        };
        return MetaSmokeyAPI;
    }());
    exports.MetaSmokeyAPI = MetaSmokeyAPI;
});
define("FlagTypes", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flagCategories = [
        {
            BoxStyle: { 'padding-left': '5px', 'padding-right': '5px', 'background-color': 'rgba(241, 148, 148, 0.6)' },
            AppliesTo: ['Answer', 'Question'],
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
            BoxStyle: { 'padding-left': '5px', 'padding-right': '5px' },
            AppliesTo: ['Answer'],
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
        },
        {
            BoxStyle: { 'padding-left': '5px', 'padding-right': '5px' },
            AppliesTo: ['Answer', 'Question'],
            FlagTypes: [
                {
                    DisplayName: 'Looks Fine',
                    ReportType: 'NoFlag'
                }
            ]
        }
    ];
});
define("libs/ChatApi", ["require", "exports", "libs/FunctionUtils"], function (require, exports, FunctionUtils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChatApi = (function () {
        function ChatApi(chatUrl) {
            if (chatUrl === void 0) { chatUrl = 'http://chat.stackoverflow.com'; }
            this.chatRoomUrl = "" + chatUrl;
        }
        ChatApi.prototype.GetChannelFKey = function (roomId) {
            var _this = this;
            var cachingKey = "StackExchange.ChatApi.FKey_" + roomId;
            var getterPromise = new Promise(function (resolve, reject) {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: _this.chatRoomUrl + "/rooms/" + roomId,
                    onload: function (response) {
                        var fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
                        resolve(fkey);
                    },
                    onerror: function (data) { return reject(data); }
                });
            });
            return FunctionUtils_2.GetAndCache(cachingKey, function () { return getterPromise; });
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
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: _this.chatRoomUrl + "/chats/" + roomId + "/messages/new",
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                        onload: function () { return resolve(); },
                        onerror: function (response) {
                            reject(response);
                        },
                    });
                });
            });
        };
        return ChatApi;
    }());
    exports.ChatApi = ChatApi;
});
define("libs/NattyApi", ["require", "exports", "libs/FunctionUtils", "libs/ChatApi"], function (require, exports, FunctionUtils_3, ChatApi_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var nattyFeedbackUrl = 'http://samserver.bhargavrao.com:8000/napi/api/feedback';
    var NattyAPI = (function () {
        function NattyAPI() {
            this.chat = new ChatApi_1.ChatApi();
        }
        NattyAPI.prototype.WasReported = function (answerId) {
            return FunctionUtils_3.GetAndCache("NattyApi.Feedback." + answerId, function () { return new Promise(function (resolve, reject) {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: nattyFeedbackUrl + "/" + answerId,
                    onload: function (response) {
                        var nattyResult = JSON.parse(response.responseText);
                        resolve(nattyResult.items && nattyResult.items[0]);
                    },
                    onerror: function (response) {
                        reject(response);
                    },
                });
            }); });
        };
        NattyAPI.prototype.Report = function (answerId) {
            this.chat.SendMessage(111347, "@Natty report http://stackoverflow.com/a/" + answerId);
        };
        NattyAPI.prototype.ReportTruePositive = function (answerId) {
            this.chat.SendMessage(111347, "@Natty feedback http://stackoverflow.com/a/" + answerId + " tp");
        };
        NattyAPI.prototype.ReportFalsePositive = function (answerId) {
            this.chat.SendMessage(111347, "@Natty feedback http://stackoverflow.com/a/" + answerId + " fp");
        };
        return NattyAPI;
    }());
    exports.NattyAPI = NattyAPI;
});
define("AdvancedFlagging", ["require", "exports", "libs/MetaSmokeyAPI", "FlagTypes", "libs/NattyApi", "libs/FunctionUtils"], function (require, exports, MetaSmokeyAPI_1, FlagTypes_1, NattyApi_1, FunctionUtils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:no-debugger
    debugger;
    var metaSmokeKey = '070f26ebb71c5e6cfca7893fe1139460cf23f30d686566f5707a4acfd50c';
    function handleFlagAndComment(postId, flag, commentRequired, userReputation) {
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
        if (flag.ReportType !== 'NoFlag') {
            result.FlagPromise = new Promise(function (resolve, reject) {
                $.ajax({
                    url: "//" + window.location.hostname + "/flags/posts/" + postId + "/add/" + flag.ReportType,
                    type: 'POST',
                    data: { 'fkey': StackExchange.options.user.fkey, 'otherText': '' }
                }).done(function (data) {
                    resolve(data);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                });
            });
        }
        return result;
    }
    function SetupPostPage() {
        var postMenus = $('.post-menu');
        postMenus.each(function (index, item) {
            var jqueryItem = $(item);
            var postType = jqueryItem.closest('.answercell').length > 0
                ? 'Answer'
                : 'Question';
            var postId = parseInt(jqueryItem.find('.flag-post-link').attr('data-postid'), 10);
            var reputationDiv = jqueryItem.closest(postType == 'Answer' ? '.answercell' : '.postcell').find('.reputation-score');
            var reputationText = reputationDiv.text();
            if (reputationText.indexOf('k') !== -1) {
                reputationText = reputationDiv.attr('title').substr('reputation score '.length);
            }
            reputationText = reputationText.replace(',', '');
            var reputation = parseInt(reputationText, 10);
            var nattyLink = $('<a />').text('Advanced Flagging');
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
            var checkboxName = "comment_checkbox_" + postId;
            var leaveCommentBox = $('<input />')
                .attr('type', 'checkbox')
                .attr('name', checkboxName)
                .prop('checked', true);
            var metaSmoke = new MetaSmokeyAPI_1.MetaSmokeyAPI(metaSmokeKey);
            var metaSmokeWasReported = metaSmoke.GetFeedback(postId, postType);
            var natty = new NattyApi_1.NattyAPI();
            var nattyWasReported = natty.WasReported(postId);
            var reportedIcon = $('<div>').addClass('comment-flag').css({ 'margin-left': '5px', 'background-position': '-61px -320px', 'visibility': 'visible' }).hide();
            var getDivider = function () { return $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' }); };
            var hasCommentOptions = false;
            var firstCategory = true;
            FlagTypes_1.flagCategories.forEach(function (flagCategory) {
                if (flagCategory.AppliesTo.indexOf(postType) === -1) {
                    return;
                }
                if (!firstCategory) {
                    dropDown.append(getDivider());
                }
                flagCategory.FlagTypes.forEach(function (flagType) {
                    if (flagType.Comment || (flagType.Comments && flagType.Comments.length > 0)) {
                        hasCommentOptions = true;
                    }
                    var dropdownItem = $('<dd />');
                    if (flagCategory.BoxStyle) {
                        dropdownItem.css(flagCategory.BoxStyle);
                    }
                    var nattyLinkItem = $('<a />').css(linkStyle);
                    nattyLinkItem.click(function () {
                        var result = handleFlagAndComment(postId, flagType, leaveCommentBox.is(':checked'), reputation);
                        if (result.CommentPromise) {
                            result.CommentPromise.then(function (data) {
                                var commentUI = StackExchange.comments.uiForPost($('#comments-' + postId));
                                commentUI.addShow(true, false);
                                commentUI.showComments(data, null, false, true);
                                $(document).trigger('comment', postId);
                            });
                        }
                        if (result.FlagPromise) {
                            result.FlagPromise.then(function () {
                                FunctionUtils_4.StoreInCache("AdvancedFlagging.Flagged." + postId, flagType);
                                reportedIcon.attr('title', "Flagged as " + flagType.ReportType);
                                reportedIcon.show();
                            });
                        }
                        var rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType == 'PostOffensive';
                        var naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
                        var looksOk = flagType.ReportType === 'NoFlag';
                        metaSmokeWasReported.then(function (responseItems) {
                            debugger;
                            if (responseItems.length > 0) {
                                var metaSmokeId = responseItems[0].id;
                                if (rudeFlag) {
                                    metaSmoke.ReportTruePositive(metaSmokeId);
                                }
                                else if (naaFlag) {
                                    metaSmoke.ReportNAA(metaSmokeId);
                                }
                                else if (looksOk) {
                                    metaSmoke.ReportFalsePositive(metaSmokeId);
                                }
                            }
                            else if (rudeFlag) {
                                metaSmoke.Report(postId, postType);
                            }
                        });
                        nattyWasReported.then(function (wasReported) {
                            if (wasReported) {
                                if (naaFlag) {
                                    natty.ReportTruePositive(postId);
                                }
                                else if (looksOk) {
                                    natty.ReportFalsePositive(postId);
                                }
                            }
                            else if (naaFlag) {
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
            }
            nattyLink.append(dropDown);
            $(window).click(function () {
                dropDown.hide();
            });
            nattyLink.click(function (e) {
                e.stopPropagation();
                if (e.target === nattyLink.get(0)) {
                    dropDown.toggle();
                }
            });
            jqueryItem.append(nattyLink);
            jqueryItem.append(reportedIcon);
            var nattyIcon = $('<div>')
                .css({
                'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
                'background': 'url("https://i.stack.imgur.com/aMUMt.jpg?s=328&g=1"', 'background-size': '100%'
            })
                .attr('title', 'Reported by Natty')
                .hide();
            var smokeyIcon = $('<div>')
                .css({
                'width': '15px', 'height': '16px', 'margin-left': '5px', 'vertical-align': 'text-bottom',
                'background': 'url("https://i.stack.imgur.com/WyV1l.png?s=128&g=1"', 'background-size': '100%'
            })
                .attr('title', 'Reported by Smokey')
                .hide();
            metaSmokeWasReported
                .then(function (responseItems) {
                if (responseItems.length > 0) {
                    smokeyIcon.show();
                }
            });
            nattyWasReported
                .then(function (wasReported) {
                if (wasReported) {
                    nattyIcon.show();
                }
            });
            var previousFlagPromise = FunctionUtils_4.GetFromCache("AdvancedFlagging.Flagged." + postId);
            previousFlagPromise.then(function (previousFlag) {
                if (previousFlag) {
                    reportedIcon.attr('title', "Previously flagged as " + previousFlag.ReportType);
                    reportedIcon.show();
                }
            });
            jqueryItem.append(nattyIcon);
            jqueryItem.append(smokeyIcon);
        });
    }
    $(function () {
        SetupPostPage();
    });
});
require(['AdvancedFlagging']);
define("libs/StackExchangeApi.Interfaces", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("libs/StackExchangeApi", ["require", "exports", "libs/FunctionUtils"], function (require, exports, FunctionUtils_5) {
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
            this.getAccessTokenPromise = function () { return new Promise(function (resolve, reject) {
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
            }); };
        };
        StackExchangeAPI.prototype.Answers_GetComments = function (answerIds, skipCache, site, filter) {
            if (skipCache === void 0) { skipCache = false; }
            if (site === void 0) { site = 'stackoverflow'; }
            return this.MakeRequest(function (objectId) { return "StackExchange.Api.AnswerComments." + objectId; }, function (objectIds) { return stackExchangeApiURL + "/answers/" + objectIds.join(';') + "/comments"; }, function (comment) { return comment.post_id; }, answerIds, skipCache, site, true, filter);
        };
        StackExchangeAPI.prototype.MakeRequest = function (cacheKey, apiUrl, uniqueIdentifier, objectIds, skipCache, site, multi, filter) {
            var cachedResultsPromise = this.GetCachedItems(objectIds.slice(), skipCache, cacheKey);
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
                        var grouping = FunctionUtils_5.GroupBy(returnItems, uniqueIdentifier);
                        FunctionUtils_5.GetMembers(grouping).forEach(function (key) { return FunctionUtils_5.StoreInCache(cacheKey(parseInt(key, 10)), grouping[key]); });
                        cachedResultsPromise.then(function (cachedResults) {
                            cachedResults.forEach(function (result) {
                                returnItems.push(result);
                            });
                            resolve(returnItems);
                        });
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                    });
                }
                else {
                    cachedResultsPromise.then(function (cachedResults) { return resolve(cachedResults); });
                }
            });
        };
        StackExchangeAPI.prototype.GetCachedItems = function (objectIds, skipCache, cacheKey) {
            var cachedResults = [];
            var promises = [];
            if (!skipCache) {
                objectIds.forEach(function (objectId) {
                    var cachedResultPromise = FunctionUtils_5.GetFromCache(cacheKey(objectId));
                    var tempPromise = new Promise(function (resolve) {
                        cachedResultPromise.then(function (cachedResult) {
                            if (cachedResult) {
                                var itemIndex = objectIds.indexOf(objectId);
                                if (itemIndex > -1) {
                                    objectIds.splice(itemIndex, 1);
                                }
                                cachedResult.forEach(function (r) { return cachedResults.push(r); });
                            }
                            resolve();
                        });
                    });
                    promises.push(tempPromise);
                });
            }
            return new Promise(function (resolve) {
                Promise.all(promises).then(function () {
                    resolve(cachedResults);
                });
            });
        };
        return StackExchangeAPI;
    }());
    exports.StackExchangeAPI = StackExchangeAPI;
});
