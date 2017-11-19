// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      0.2.10
// @author       Robert Rudman
// @match        *://*.stackexchange.com/*
// @match        *://*.stackoverflow.com/*
// @match        *://*.superuser.com/*
// @match        *://*.serverfault.com/*
// @match        *://*.askubuntu.com/*
// @match        *://*.stackapps.com/*
// @match        *://*.mathoverflow.net/*
// @exclude      *://chat.stackexchange.com/*
// @exclude      *://chat.meta.stackexchange.com/*
// @exclude      *://chat.stackoverflow.com/*
// @exclude      *://blog.stackoverflow.com/*
// @exclude      *://*.area51.stackexchange.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.4/require.min.js
// @require      https://cdn.rawgit.com/ofirdagan/cross-domain-local-storage/d779a81a6383475a1bf88595a98b10a8bd5bb4ae/dist/scripts/xdLocalStorage.min.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 43);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var isArray_1 = __webpack_require__(36);
var isObject_1 = __webpack_require__(37);
var isFunction_1 = __webpack_require__(15);
var tryCatch_1 = __webpack_require__(41);
var errorObject_1 = __webpack_require__(14);
var UnsubscriptionError_1 = __webpack_require__(35);
/**
 * Represents a disposable resource, such as the execution of an Observable. A
 * Subscription has one important method, `unsubscribe`, that takes no argument
 * and just disposes the resource held by the subscription.
 *
 * Additionally, subscriptions may be grouped together through the `add()`
 * method, which will attach a child Subscription to the current Subscription.
 * When a Subscription is unsubscribed, all its children (and its grandchildren)
 * will be unsubscribed as well.
 *
 * @class Subscription
 */
var Subscription = (function () {
    /**
     * @param {function(): void} [unsubscribe] A function describing how to
     * perform the disposal of resources when the `unsubscribe` method is called.
     */
    function Subscription(unsubscribe) {
        /**
         * A flag to indicate whether this Subscription has already been unsubscribed.
         * @type {boolean}
         */
        this.closed = false;
        this._parent = null;
        this._parents = null;
        this._subscriptions = null;
        if (unsubscribe) {
            this._unsubscribe = unsubscribe;
        }
    }
    /**
     * Disposes the resources held by the subscription. May, for instance, cancel
     * an ongoing Observable execution or cancel any other type of work that
     * started when the Subscription was created.
     * @return {void}
     */
    Subscription.prototype.unsubscribe = function () {
        var hasErrors = false;
        var errors;
        if (this.closed) {
            return;
        }
        var _a = this, _parent = _a._parent, _parents = _a._parents, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
        this.closed = true;
        this._parent = null;
        this._parents = null;
        // null out _subscriptions first so any child subscriptions that attempt
        // to remove themselves from this subscription will noop
        this._subscriptions = null;
        var index = -1;
        var len = _parents ? _parents.length : 0;
        // if this._parent is null, then so is this._parents, and we
        // don't have to remove ourselves from any parent subscriptions.
        while (_parent) {
            _parent.remove(this);
            // if this._parents is null or index >= len,
            // then _parent is set to null, and the loop exits
            _parent = ++index < len && _parents[index] || null;
        }
        if (isFunction_1.isFunction(_unsubscribe)) {
            var trial = tryCatch_1.tryCatch(_unsubscribe).call(this);
            if (trial === errorObject_1.errorObject) {
                hasErrors = true;
                errors = errors || (errorObject_1.errorObject.e instanceof UnsubscriptionError_1.UnsubscriptionError ?
                    flattenUnsubscriptionErrors(errorObject_1.errorObject.e.errors) : [errorObject_1.errorObject.e]);
            }
        }
        if (isArray_1.isArray(_subscriptions)) {
            index = -1;
            len = _subscriptions.length;
            while (++index < len) {
                var sub = _subscriptions[index];
                if (isObject_1.isObject(sub)) {
                    var trial = tryCatch_1.tryCatch(sub.unsubscribe).call(sub);
                    if (trial === errorObject_1.errorObject) {
                        hasErrors = true;
                        errors = errors || [];
                        var err = errorObject_1.errorObject.e;
                        if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                            errors = errors.concat(flattenUnsubscriptionErrors(err.errors));
                        }
                        else {
                            errors.push(err);
                        }
                    }
                }
            }
        }
        if (hasErrors) {
            throw new UnsubscriptionError_1.UnsubscriptionError(errors);
        }
    };
    /**
     * Adds a tear down to be called during the unsubscribe() of this
     * Subscription.
     *
     * If the tear down being added is a subscription that is already
     * unsubscribed, is the same reference `add` is being called on, or is
     * `Subscription.EMPTY`, it will not be added.
     *
     * If this subscription is already in an `closed` state, the passed
     * tear down logic will be executed immediately.
     *
     * @param {TeardownLogic} teardown The additional logic to execute on
     * teardown.
     * @return {Subscription} Returns the Subscription used or created to be
     * added to the inner subscriptions list. This Subscription can be used with
     * `remove()` to remove the passed teardown logic from the inner subscriptions
     * list.
     */
    Subscription.prototype.add = function (teardown) {
        if (!teardown || (teardown === Subscription.EMPTY)) {
            return Subscription.EMPTY;
        }
        if (teardown === this) {
            return this;
        }
        var subscription = teardown;
        switch (typeof teardown) {
            case 'function':
                subscription = new Subscription(teardown);
            case 'object':
                if (subscription.closed || typeof subscription.unsubscribe !== 'function') {
                    return subscription;
                }
                else if (this.closed) {
                    subscription.unsubscribe();
                    return subscription;
                }
                else if (typeof subscription._addParent !== 'function' /* quack quack */) {
                    var tmp = subscription;
                    subscription = new Subscription();
                    subscription._subscriptions = [tmp];
                }
                break;
            default:
                throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
        }
        var subscriptions = this._subscriptions || (this._subscriptions = []);
        subscriptions.push(subscription);
        subscription._addParent(this);
        return subscription;
    };
    /**
     * Removes a Subscription from the internal list of subscriptions that will
     * unsubscribe during the unsubscribe process of this Subscription.
     * @param {Subscription} subscription The subscription to remove.
     * @return {void}
     */
    Subscription.prototype.remove = function (subscription) {
        var subscriptions = this._subscriptions;
        if (subscriptions) {
            var subscriptionIndex = subscriptions.indexOf(subscription);
            if (subscriptionIndex !== -1) {
                subscriptions.splice(subscriptionIndex, 1);
            }
        }
    };
    Subscription.prototype._addParent = function (parent) {
        var _a = this, _parent = _a._parent, _parents = _a._parents;
        if (!_parent || _parent === parent) {
            // If we don't have a parent, or the new parent is the same as the
            // current parent, then set this._parent to the new parent.
            this._parent = parent;
        }
        else if (!_parents) {
            // If there's already one parent, but not multiple, allocate an Array to
            // store the rest of the parent Subscriptions.
            this._parents = [parent];
        }
        else if (_parents.indexOf(parent) === -1) {
            // Only add the new parent to the _parents list if it's not already there.
            _parents.push(parent);
        }
    };
    Subscription.EMPTY = (function (empty) {
        empty.closed = true;
        return empty;
    }(new Subscription()));
    return Subscription;
}());
exports.Subscription = Subscription;
function flattenUnsubscriptionErrors(errors) {
    return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError_1.UnsubscriptionError) ? err.errors : err); }, []);
}
//# sourceMappingURL=Subscription.js.map

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Delay(milliseconds) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, milliseconds);
        });
    }
    exports.Delay = Delay;
    function GroupBy(collection, propertyGetter) {
        return collection.reduce(function (previousValue, currentItem) {
            (previousValue[propertyGetter(currentItem)] = previousValue[propertyGetter(currentItem)] || []).push(currentItem);
            return previousValue;
        }, {});
    }
    exports.GroupBy = GroupBy;
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
    function IsStackOverflow() {
        return window.location.href.match(/^https:\/\/stackoverflow.com/);
    }
    exports.IsStackOverflow = IsStackOverflow;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var SimpleCache = /** @class */ (function () {
        function SimpleCache() {
        }
        SimpleCache.GetAndCache = function (cacheKey, getterPromise, expiresAt) {
            return __awaiter(this, void 0, void 0, function () {
                var cachedItem, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cachedItem = SimpleCache.GetFromCache(cacheKey);
                            if (cachedItem !== null) {
                                return [2 /*return*/, cachedItem];
                            }
                            return [4 /*yield*/, getterPromise()];
                        case 1:
                            result = _a.sent();
                            SimpleCache.StoreInCache(cacheKey, result, expiresAt);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        SimpleCache.ClearCache = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    localStorage.clear();
                    return [2 /*return*/];
                });
            });
        };
        SimpleCache.GetFromCache = function (cacheKey) {
            var jsonItem = localStorage.getItem(cacheKey);
            if (jsonItem === null) {
                return null;
            }
            var dataItem = JSON.parse(jsonItem);
            if ((dataItem.Expires && dataItem.Expires < new Date())) {
                // It doesn't exist or is expired, so return nothing
                return null;
            }
            return dataItem.Data;
        };
        SimpleCache.StoreInCache = function (cacheKey, item, expiresAt) {
            return __awaiter(this, void 0, void 0, function () {
                var jsonStr;
                return __generator(this, function (_a) {
                    jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
                    localStorage.setItem(cacheKey, jsonStr);
                    return [2 /*return*/];
                });
            });
        };
        return SimpleCache;
    }());
    exports.SimpleCache = SimpleCache;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var root_1 = __webpack_require__(5);
var toSubscriber_1 = __webpack_require__(40);
var observable_1 = __webpack_require__(33);
var pipe_1 = __webpack_require__(39);
/**
 * A representation of any set of values over any amount of time. This is the most basic building block
 * of RxJS.
 *
 * @class Observable<T>
 */
var Observable = (function () {
    /**
     * @constructor
     * @param {Function} subscribe the function that is called when the Observable is
     * initially subscribed to. This function is given a Subscriber, to which new values
     * can be `next`ed, or an `error` method can be called to raise an error, or
     * `complete` can be called to notify of a successful completion.
     */
    function Observable(subscribe) {
        this._isScalar = false;
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    /**
     * Creates a new Observable, with this Observable as the source, and the passed
     * operator defined as the new observable's operator.
     * @method lift
     * @param {Operator} operator the operator defining the operation to take on the observable
     * @return {Observable} a new observable with the Operator applied
     */
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    /**
     * Invokes an execution of an Observable and registers Observer handlers for notifications it will emit.
     *
     * <span class="informal">Use it when you have all these Observables, but still nothing is happening.</span>
     *
     * `subscribe` is not a regular operator, but a method that calls Observable's internal `subscribe` function. It
     * might be for example a function that you passed to a {@link create} static factory, but most of the time it is
     * a library implementation, which defines what and when will be emitted by an Observable. This means that calling
     * `subscribe` is actually the moment when Observable starts its work, not when it is created, as it is often
     * thought.
     *
     * Apart from starting the execution of an Observable, this method allows you to listen for values
     * that an Observable emits, as well as for when it completes or errors. You can achieve this in two
     * following ways.
     *
     * The first way is creating an object that implements {@link Observer} interface. It should have methods
     * defined by that interface, but note that it should be just a regular JavaScript object, which you can create
     * yourself in any way you want (ES6 class, classic function constructor, object literal etc.). In particular do
     * not attempt to use any RxJS implementation details to create Observers - you don't need them. Remember also
     * that your object does not have to implement all methods. If you find yourself creating a method that doesn't
     * do anything, you can simply omit it. Note however, that if `error` method is not provided, all errors will
     * be left uncaught.
     *
     * The second way is to give up on Observer object altogether and simply provide callback functions in place of its methods.
     * This means you can provide three functions as arguments to `subscribe`, where first function is equivalent
     * of a `next` method, second of an `error` method and third of a `complete` method. Just as in case of Observer,
     * if you do not need to listen for something, you can omit a function, preferably by passing `undefined` or `null`,
     * since `subscribe` recognizes these functions by where they were placed in function call. When it comes
     * to `error` function, just as before, if not provided, errors emitted by an Observable will be thrown.
     *
     * Whatever style of calling `subscribe` you use, in both cases it returns a Subscription object.
     * This object allows you to call `unsubscribe` on it, which in turn will stop work that an Observable does and will clean
     * up all resources that an Observable used. Note that cancelling a subscription will not call `complete` callback
     * provided to `subscribe` function, which is reserved for a regular completion signal that comes from an Observable.
     *
     * Remember that callbacks provided to `subscribe` are not guaranteed to be called asynchronously.
     * It is an Observable itself that decides when these functions will be called. For example {@link of}
     * by default emits all its values synchronously. Always check documentation for how given Observable
     * will behave when subscribed and if its default behavior can be modified with a {@link Scheduler}.
     *
     * @example <caption>Subscribe with an Observer</caption>
     * const sumObserver = {
     *   sum: 0,
     *   next(value) {
     *     console.log('Adding: ' + value);
     *     this.sum = this.sum + value;
     *   },
     *   error() { // We actually could just remove this method,
     *   },        // since we do not really care about errors right now.
     *   complete() {
     *     console.log('Sum equals: ' + this.sum);
     *   }
     * };
     *
     * Rx.Observable.of(1, 2, 3) // Synchronously emits 1, 2, 3 and then completes.
     * .subscribe(sumObserver);
     *
     * // Logs:
     * // "Adding: 1"
     * // "Adding: 2"
     * // "Adding: 3"
     * // "Sum equals: 6"
     *
     *
     * @example <caption>Subscribe with functions</caption>
     * let sum = 0;
     *
     * Rx.Observable.of(1, 2, 3)
     * .subscribe(
     *   function(value) {
     *     console.log('Adding: ' + value);
     *     sum = sum + value;
     *   },
     *   undefined,
     *   function() {
     *     console.log('Sum equals: ' + sum);
     *   }
     * );
     *
     * // Logs:
     * // "Adding: 1"
     * // "Adding: 2"
     * // "Adding: 3"
     * // "Sum equals: 6"
     *
     *
     * @example <caption>Cancel a subscription</caption>
     * const subscription = Rx.Observable.interval(1000).subscribe(
     *   num => console.log(num),
     *   undefined,
     *   () => console.log('completed!') // Will not be called, even
     * );                                // when cancelling subscription
     *
     *
     * setTimeout(() => {
     *   subscription.unsubscribe();
     *   console.log('unsubscribed!');
     * }, 2500);
     *
     * // Logs:
     * // 0 after 1s
     * // 1 after 2s
     * // "unsubscribed!" after 2.5s
     *
     *
     * @param {Observer|Function} observerOrNext (optional) Either an observer with methods to be called,
     *  or the first of three possible handlers, which is the handler for each value emitted from the subscribed
     *  Observable.
     * @param {Function} error (optional) A handler for a terminal event resulting from an error. If no error handler is provided,
     *  the error will be thrown as unhandled.
     * @param {Function} complete (optional) A handler for a terminal event resulting from successful completion.
     * @return {ISubscription} a subscription reference to the registered handlers
     * @method subscribe
     */
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var operator = this.operator;
        var sink = toSubscriber_1.toSubscriber(observerOrNext, error, complete);
        if (operator) {
            operator.call(sink, this.source);
        }
        else {
            sink.add(this.source ? this._subscribe(sink) : this._trySubscribe(sink));
        }
        if (sink.syncErrorThrowable) {
            sink.syncErrorThrowable = false;
            if (sink.syncErrorThrown) {
                throw sink.syncErrorValue;
            }
        }
        return sink;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.syncErrorThrown = true;
            sink.syncErrorValue = err;
            sink.error(err);
        }
    };
    /**
     * @method forEach
     * @param {Function} next a handler for each value emitted by the observable
     * @param {PromiseConstructor} [PromiseCtor] a constructor function used to instantiate the Promise
     * @return {Promise} a promise that either resolves on observable completion or
     *  rejects with the handled error
     */
    Observable.prototype.forEach = function (next, PromiseCtor) {
        var _this = this;
        if (!PromiseCtor) {
            if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
                PromiseCtor = root_1.root.Rx.config.Promise;
            }
            else if (root_1.root.Promise) {
                PromiseCtor = root_1.root.Promise;
            }
        }
        if (!PromiseCtor) {
            throw new Error('no Promise impl found');
        }
        return new PromiseCtor(function (resolve, reject) {
            // Must be declared in a separate statement to avoid a RefernceError when
            // accessing subscription below in the closure due to Temporal Dead Zone.
            var subscription;
            subscription = _this.subscribe(function (value) {
                if (subscription) {
                    // if there is a subscription, then we can surmise
                    // the next handling is asynchronous. Any errors thrown
                    // need to be rejected explicitly and unsubscribe must be
                    // called manually
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscription.unsubscribe();
                    }
                }
                else {
                    // if there is NO subscription, then we're getting a nexted
                    // value synchronously during subscription. We can just call it.
                    // If it errors, Observable's `subscribe` will ensure the
                    // unsubscription logic is called, then synchronously rethrow the error.
                    // After that, Promise will trap the error and send it
                    // down the rejection path.
                    next(value);
                }
            }, reject, resolve);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        return this.source.subscribe(subscriber);
    };
    /**
     * An interop point defined by the es7-observable spec https://github.com/zenparsing/es-observable
     * @method Symbol.observable
     * @return {Observable} this instance of the observable
     */
    Observable.prototype[observable_1.observable] = function () {
        return this;
    };
    /* tslint:enable:max-line-length */
    /**
     * Used to stitch together functional operators into a chain.
     * @method pipe
     * @return {Observable} the Observable result of all of the operators having
     * been called in the order they were passed in.
     *
     * @example
     *
     * import { map, filter, scan } from 'rxjs/operators';
     *
     * Rx.Observable.interval(1000)
     *   .pipe(
     *     filter(x => x % 2 === 0),
     *     map(x => x + x),
     *     scan((acc, x) => acc + x)
     *   )
     *   .subscribe(x => console.log(x))
     */
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i - 0] = arguments[_i];
        }
        if (operations.length === 0) {
            return this;
        }
        return pipe_1.pipeFromArray(operations)(this);
    };
    /* tslint:enable:max-line-length */
    Observable.prototype.toPromise = function (PromiseCtor) {
        var _this = this;
        if (!PromiseCtor) {
            if (root_1.root.Rx && root_1.root.Rx.config && root_1.root.Rx.config.Promise) {
                PromiseCtor = root_1.root.Rx.config.Promise;
            }
            else if (root_1.root.Promise) {
                PromiseCtor = root_1.root.Promise;
            }
        }
        if (!PromiseCtor) {
            throw new Error('no Promise impl found');
        }
        return new PromiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    // HACK: Since TypeScript inherits static properties too, we have to
    // fight against TypeScript here so Subject can have a different static create signature
    /**
     * Creates a new cold Observable by calling the Observable constructor
     * @static true
     * @owner Observable
     * @method create
     * @param {Function} subscribe? the subscriber function to be passed to the Observable constructor
     * @return {Observable} a new cold observable
     */
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());
exports.Observable = Observable;
//# sourceMappingURL=Observable.js.map

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var isFunction_1 = __webpack_require__(15);
var Subscription_1 = __webpack_require__(0);
var Observer_1 = __webpack_require__(9);
var rxSubscriber_1 = __webpack_require__(7);
/**
 * Implements the {@link Observer} interface and extends the
 * {@link Subscription} class. While the {@link Observer} is the public API for
 * consuming the values of an {@link Observable}, all Observers get converted to
 * a Subscriber, in order to provide Subscription-like capabilities such as
 * `unsubscribe`. Subscriber is a common type in RxJS, and crucial for
 * implementing operators, but it is rarely used as a public API.
 *
 * @class Subscriber<T>
 */
var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    /**
     * @param {Observer|function(value: T): void} [destinationOrNext] A partially
     * defined Observer or a `next` callback function.
     * @param {function(e: ?any): void} [error] The `error` callback of an
     * Observer.
     * @param {function(): void} [complete] The `complete` callback of an
     * Observer.
     */
    function Subscriber(destinationOrNext, error, complete) {
        _super.call(this);
        this.syncErrorValue = null;
        this.syncErrorThrown = false;
        this.syncErrorThrowable = false;
        this.isStopped = false;
        switch (arguments.length) {
            case 0:
                this.destination = Observer_1.empty;
                break;
            case 1:
                if (!destinationOrNext) {
                    this.destination = Observer_1.empty;
                    break;
                }
                if (typeof destinationOrNext === 'object') {
                    if (destinationOrNext instanceof Subscriber) {
                        this.destination = destinationOrNext;
                        this.destination.add(this);
                    }
                    else {
                        this.syncErrorThrowable = true;
                        this.destination = new SafeSubscriber(this, destinationOrNext);
                    }
                    break;
                }
            default:
                this.syncErrorThrowable = true;
                this.destination = new SafeSubscriber(this, destinationOrNext, error, complete);
                break;
        }
    }
    Subscriber.prototype[rxSubscriber_1.rxSubscriber] = function () { return this; };
    /**
     * A static factory for a Subscriber, given a (potentially partial) definition
     * of an Observer.
     * @param {function(x: ?T): void} [next] The `next` callback of an Observer.
     * @param {function(e: ?any): void} [error] The `error` callback of an
     * Observer.
     * @param {function(): void} [complete] The `complete` callback of an
     * Observer.
     * @return {Subscriber<T>} A Subscriber wrapping the (partially defined)
     * Observer represented by the given arguments.
     */
    Subscriber.create = function (next, error, complete) {
        var subscriber = new Subscriber(next, error, complete);
        subscriber.syncErrorThrowable = false;
        return subscriber;
    };
    /**
     * The {@link Observer} callback to receive notifications of type `next` from
     * the Observable, with a value. The Observable may call this method 0 or more
     * times.
     * @param {T} [value] The `next` value.
     * @return {void}
     */
    Subscriber.prototype.next = function (value) {
        if (!this.isStopped) {
            this._next(value);
        }
    };
    /**
     * The {@link Observer} callback to receive notifications of type `error` from
     * the Observable, with an attached {@link Error}. Notifies the Observer that
     * the Observable has experienced an error condition.
     * @param {any} [err] The `error` exception.
     * @return {void}
     */
    Subscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            this.isStopped = true;
            this._error(err);
        }
    };
    /**
     * The {@link Observer} callback to receive a valueless notification of type
     * `complete` from the Observable. Notifies the Observer that the Observable
     * has finished sending push-based notifications.
     * @return {void}
     */
    Subscriber.prototype.complete = function () {
        if (!this.isStopped) {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        this.destination.error(err);
        this.unsubscribe();
    };
    Subscriber.prototype._complete = function () {
        this.destination.complete();
        this.unsubscribe();
    };
    Subscriber.prototype._unsubscribeAndRecycle = function () {
        var _a = this, _parent = _a._parent, _parents = _a._parents;
        this._parent = null;
        this._parents = null;
        this.unsubscribe();
        this.closed = false;
        this.isStopped = false;
        this._parent = _parent;
        this._parents = _parents;
        return this;
    };
    return Subscriber;
}(Subscription_1.Subscription));
exports.Subscriber = Subscriber;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
        _super.call(this);
        this._parentSubscriber = _parentSubscriber;
        var next;
        var context = this;
        if (isFunction_1.isFunction(observerOrNext)) {
            next = observerOrNext;
        }
        else if (observerOrNext) {
            next = observerOrNext.next;
            error = observerOrNext.error;
            complete = observerOrNext.complete;
            if (observerOrNext !== Observer_1.empty) {
                context = Object.create(observerOrNext);
                if (isFunction_1.isFunction(context.unsubscribe)) {
                    this.add(context.unsubscribe.bind(context));
                }
                context.unsubscribe = this.unsubscribe.bind(this);
            }
        }
        this._context = context;
        this._next = next;
        this._error = error;
        this._complete = complete;
    }
    SafeSubscriber.prototype.next = function (value) {
        if (!this.isStopped && this._next) {
            var _parentSubscriber = this._parentSubscriber;
            if (!_parentSubscriber.syncErrorThrowable) {
                this.__tryOrUnsub(this._next, value);
            }
            else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.error = function (err) {
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            if (this._error) {
                if (!_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(this._error, err);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, this._error, err);
                    this.unsubscribe();
                }
            }
            else if (!_parentSubscriber.syncErrorThrowable) {
                this.unsubscribe();
                throw err;
            }
            else {
                _parentSubscriber.syncErrorValue = err;
                _parentSubscriber.syncErrorThrown = true;
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.complete = function () {
        var _this = this;
        if (!this.isStopped) {
            var _parentSubscriber = this._parentSubscriber;
            if (this._complete) {
                var wrappedComplete = function () { return _this._complete.call(_this._context); };
                if (!_parentSubscriber.syncErrorThrowable) {
                    this.__tryOrUnsub(wrappedComplete);
                    this.unsubscribe();
                }
                else {
                    this.__tryOrSetError(_parentSubscriber, wrappedComplete);
                    this.unsubscribe();
                }
            }
            else {
                this.unsubscribe();
            }
        }
    };
    SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            this.unsubscribe();
            throw err;
        }
    };
    SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
        try {
            fn.call(this._context, value);
        }
        catch (err) {
            parent.syncErrorValue = err;
            parent.syncErrorThrown = true;
            return true;
        }
        return false;
    };
    SafeSubscriber.prototype._unsubscribe = function () {
        var _parentSubscriber = this._parentSubscriber;
        this._context = null;
        this._parentSubscriber = null;
        _parentSubscriber.unsubscribe();
    };
    return SafeSubscriber;
}(Subscriber));
//# sourceMappingURL=Subscriber.js.map

/***/ },
/* 5 */
/***/ function(module, exports) {

"use strict";
"use strict";
// CommonJS / Node have global context exposed as "global" variable.
// We don't want to include the whole node.d.ts this this compilation unit so we'll just fake
// the global "global" var for now.
var __window = typeof window !== 'undefined' && window;
var __self = typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope && self;
var __global = typeof global !== 'undefined' && global;
var _root = __window || __global || __self;
exports.root = _root;
// Workaround Closure Compiler restriction: The body of a goog.module cannot use throw.
// This is needed when used with angular/tsickle which inserts a goog.module statement.
// Wrap in IIFE
(function () {
    if (!_root) {
        throw new Error('RxJS could not find any global context (window, self, global)');
    }
})();
//# sourceMappingURL=root.js.map

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Observable_1 = __webpack_require__(3);
var Subscriber_1 = __webpack_require__(4);
var Subscription_1 = __webpack_require__(0);
var ObjectUnsubscribedError_1 = __webpack_require__(13);
var SubjectSubscription_1 = __webpack_require__(11);
var rxSubscriber_1 = __webpack_require__(7);
/**
 * @class SubjectSubscriber<T>
 */
var SubjectSubscriber = (function (_super) {
    __extends(SubjectSubscriber, _super);
    function SubjectSubscriber(destination) {
        _super.call(this, destination);
        this.destination = destination;
    }
    return SubjectSubscriber;
}(Subscriber_1.Subscriber));
exports.SubjectSubscriber = SubjectSubscriber;
/**
 * @class Subject<T>
 */
var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        _super.call(this);
        this.observers = [];
        this.closed = false;
        this.isStopped = false;
        this.hasError = false;
        this.thrownError = null;
    }
    Subject.prototype[rxSubscriber_1.rxSubscriber] = function () {
        return new SubjectSubscriber(this);
    };
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype.next = function (value) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        if (!this.isStopped) {
            var observers = this.observers;
            var len = observers.length;
            var copy = observers.slice();
            for (var i = 0; i < len; i++) {
                copy[i].next(value);
            }
        }
    };
    Subject.prototype.error = function (err) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        this.hasError = true;
        this.thrownError = err;
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].error(err);
        }
        this.observers.length = 0;
    };
    Subject.prototype.complete = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        this.isStopped = true;
        var observers = this.observers;
        var len = observers.length;
        var copy = observers.slice();
        for (var i = 0; i < len; i++) {
            copy[i].complete();
        }
        this.observers.length = 0;
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = true;
        this.closed = true;
        this.observers = null;
    };
    Subject.prototype._trySubscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else {
            return _super.prototype._trySubscribe.call(this, subscriber);
        }
    };
    Subject.prototype._subscribe = function (subscriber) {
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscriber.error(this.thrownError);
            return Subscription_1.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscriber.complete();
            return Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            return new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable_1.Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable_1.Observable));
exports.Subject = Subject;
/**
 * @class AnonymousSubject<T>
 */
var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        _super.call(this);
        this.destination = destination;
        this.source = source;
    }
    AnonymousSubject.prototype.next = function (value) {
        var destination = this.destination;
        if (destination && destination.next) {
            destination.next(value);
        }
    };
    AnonymousSubject.prototype.error = function (err) {
        var destination = this.destination;
        if (destination && destination.error) {
            this.destination.error(err);
        }
    };
    AnonymousSubject.prototype.complete = function () {
        var destination = this.destination;
        if (destination && destination.complete) {
            this.destination.complete();
        }
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var source = this.source;
        if (source) {
            return this.source.subscribe(subscriber);
        }
        else {
            return Subscription_1.Subscription.EMPTY;
        }
    };
    return AnonymousSubject;
}(Subject));
exports.AnonymousSubject = AnonymousSubject;
//# sourceMappingURL=Subject.js.map

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var root_1 = __webpack_require__(5);
var Symbol = root_1.root.Symbol;
exports.rxSubscriber = (typeof Symbol === 'function' && typeof Symbol.for === 'function') ?
    Symbol.for('rxSubscriber') : '@@rxSubscriber';
/**
 * @deprecated use rxSubscriber instead
 */
exports.$$rxSubscriber = exports.rxSubscriber;
//# sourceMappingURL=rxSubscriber.js.map

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CrossDomainCaching = /** @class */ (function () {
        function CrossDomainCaching() {
        }
        CrossDomainCaching.InitializeCache = function (iframeUrl) {
            xdLocalStorage.init({
                iframeUrl: iframeUrl,
                initCallback: function () {
                    CrossDomainCaching.xdLocalStorageInitializedResolver();
                }
            });
        };
        CrossDomainCaching.GetAndCache = function (cacheKey, getterPromise, expiresAt) {
            return __awaiter(this, void 0, void 0, function () {
                var cachedItem, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.GetFromCache(cacheKey)];
                        case 1:
                            cachedItem = _a.sent();
                            if (cachedItem !== undefined) {
                                return [2 /*return*/, cachedItem];
                            }
                            return [4 /*yield*/, getterPromise()];
                        case 2:
                            result = _a.sent();
                            this.StoreInCache(cacheKey, result, expiresAt);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        CrossDomainCaching.ClearCache = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, CrossDomainCaching.xdLocalStorageInitialized];
                        case 1:
                            _a.sent();
                            xdLocalStorage.clear();
                            return [2 /*return*/];
                    }
                });
            });
        };
        CrossDomainCaching.GetFromCache = function (cacheKey) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, CrossDomainCaching.xdLocalStorageInitialized];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    CrossDomainCaching.xdLocalStorageInitialized.then(function () {
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
                                })];
                    }
                });
            });
        };
        CrossDomainCaching.StoreInCache = function (cacheKey, item, expiresAt) {
            return __awaiter(this, void 0, void 0, function () {
                var jsonStr;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, CrossDomainCaching.xdLocalStorageInitialized];
                        case 1:
                            _a.sent();
                            jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
                            xdLocalStorage.setItem(cacheKey, jsonStr);
                            return [2 /*return*/];
                    }
                });
            });
        };
        CrossDomainCaching.xdLocalStorageInitialized = new Promise(function (resolve, reject) { return CrossDomainCaching.xdLocalStorageInitializedResolver = resolve; });
        // tslint:disable-next-line:no-empty
        CrossDomainCaching.xdLocalStorageInitializedResolver = function () { };
        return CrossDomainCaching;
    }());
    exports.CrossDomainCaching = CrossDomainCaching;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 9 */
/***/ function(module, exports) {

"use strict";
"use strict";
exports.empty = {
    closed: true,
    next: function (value) { },
    error: function (err) { throw err; },
    complete: function () { }
};
//# sourceMappingURL=Observer.js.map

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Subject_1 = __webpack_require__(6);
var queue_1 = __webpack_require__(32);
var Subscription_1 = __webpack_require__(0);
var observeOn_1 = __webpack_require__(25);
var ObjectUnsubscribedError_1 = __webpack_require__(13);
var SubjectSubscription_1 = __webpack_require__(11);
/**
 * @class ReplaySubject<T>
 */
var ReplaySubject = (function (_super) {
    __extends(ReplaySubject, _super);
    function ReplaySubject(bufferSize, windowTime, scheduler) {
        if (bufferSize === void 0) { bufferSize = Number.POSITIVE_INFINITY; }
        if (windowTime === void 0) { windowTime = Number.POSITIVE_INFINITY; }
        _super.call(this);
        this.scheduler = scheduler;
        this._events = [];
        this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
        this._windowTime = windowTime < 1 ? 1 : windowTime;
    }
    ReplaySubject.prototype.next = function (value) {
        var now = this._getNow();
        this._events.push(new ReplayEvent(now, value));
        this._trimBufferThenGetEvents();
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        var _events = this._trimBufferThenGetEvents();
        var scheduler = this.scheduler;
        var subscription;
        if (this.closed) {
            throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError();
        }
        else if (this.hasError) {
            subscription = Subscription_1.Subscription.EMPTY;
        }
        else if (this.isStopped) {
            subscription = Subscription_1.Subscription.EMPTY;
        }
        else {
            this.observers.push(subscriber);
            subscription = new SubjectSubscription_1.SubjectSubscription(this, subscriber);
        }
        if (scheduler) {
            subscriber.add(subscriber = new observeOn_1.ObserveOnSubscriber(subscriber, scheduler));
        }
        var len = _events.length;
        for (var i = 0; i < len && !subscriber.closed; i++) {
            subscriber.next(_events[i].value);
        }
        if (this.hasError) {
            subscriber.error(this.thrownError);
        }
        else if (this.isStopped) {
            subscriber.complete();
        }
        return subscription;
    };
    ReplaySubject.prototype._getNow = function () {
        return (this.scheduler || queue_1.queue).now();
    };
    ReplaySubject.prototype._trimBufferThenGetEvents = function () {
        var now = this._getNow();
        var _bufferSize = this._bufferSize;
        var _windowTime = this._windowTime;
        var _events = this._events;
        var eventsCount = _events.length;
        var spliceCount = 0;
        // Trim events that fall out of the time window.
        // Start at the front of the list. Break early once
        // we encounter an event that falls within the window.
        while (spliceCount < eventsCount) {
            if ((now - _events[spliceCount].time) < _windowTime) {
                break;
            }
            spliceCount++;
        }
        if (eventsCount > _bufferSize) {
            spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
        }
        if (spliceCount > 0) {
            _events.splice(0, spliceCount);
        }
        return _events;
    };
    return ReplaySubject;
}(Subject_1.Subject));
exports.ReplaySubject = ReplaySubject;
var ReplayEvent = (function () {
    function ReplayEvent(time, value) {
        this.time = time;
        this.value = value;
    }
    return ReplayEvent;
}());
//# sourceMappingURL=ReplaySubject.js.map

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Subscription_1 = __webpack_require__(0);
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var SubjectSubscription = (function (_super) {
    __extends(SubjectSubscription, _super);
    function SubjectSubscription(subject, subscriber) {
        _super.call(this);
        this.subject = subject;
        this.subscriber = subscriber;
        this.closed = false;
    }
    SubjectSubscription.prototype.unsubscribe = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        var subject = this.subject;
        var observers = subject.observers;
        this.subject = null;
        if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
            return;
        }
        var subscriberIndex = observers.indexOf(this.subscriber);
        if (subscriberIndex !== -1) {
            observers.splice(subscriberIndex, 1);
        }
    };
    return SubjectSubscription;
}(Subscription_1.Subscription));
exports.SubjectSubscription = SubjectSubscription;
//# sourceMappingURL=SubjectSubscription.js.map

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var Observable_1 = __webpack_require__(3);
var take_1 = __webpack_require__(24);
Observable_1.Observable.prototype.take = take_1.take;
//# sourceMappingURL=take.js.map

/***/ },
/* 13 */
/***/ function(module, exports) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when an action is invalid because the object has been
 * unsubscribed.
 *
 * @see {@link Subject}
 * @see {@link BehaviorSubject}
 *
 * @class ObjectUnsubscribedError
 */
var ObjectUnsubscribedError = (function (_super) {
    __extends(ObjectUnsubscribedError, _super);
    function ObjectUnsubscribedError() {
        var err = _super.call(this, 'object unsubscribed');
        this.name = err.name = 'ObjectUnsubscribedError';
        this.stack = err.stack;
        this.message = err.message;
    }
    return ObjectUnsubscribedError;
}(Error));
exports.ObjectUnsubscribedError = ObjectUnsubscribedError;
//# sourceMappingURL=ObjectUnsubscribedError.js.map

/***/ },
/* 14 */
/***/ function(module, exports) {

"use strict";
"use strict";
// typeof any so that it we don't have to cast when comparing a result to the error object
exports.errorObject = { e: {} };
//# sourceMappingURL=errorObject.js.map

/***/ },
/* 15 */
/***/ function(module, exports) {

"use strict";
"use strict";
function isFunction(x) {
    return typeof x === 'function';
}
exports.isFunction = isFunction;
//# sourceMappingURL=isFunction.js.map

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
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
                    Comments: [
                        {
                            ReputationLimit: 0,
                            Comment: 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                                'and can be perceived as noise by its future visitors. Once you [earn](http://meta.stackoverflow.com/q/146472) ' +
                                'enough [reputation](http://stackoverflow.com/help/whats-reputation), you will gain privileges to ' +
                                '[upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                                'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                                'See [Why is voting important](http://stackoverflow.com/help/why-vote).'
                        },
                        {
                            ReputationLimit: 15,
                            Comment: 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                                'and can be perceived as noise by its future visitors. ' +
                                'Instead, [upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                                'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                                'See [Why is voting important](http://stackoverflow.com/help/why-vote).'
                        }
                    ]
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
                },
                {
                    DisplayName: 'Comment',
                    ReportType: 'AnswerNotAnAnswer',
                    Comment: 'This does not provide an answer to the question. Once you have sufficient [reputation](https://stackoverflow.com/help/whats-reputation) you will be able to [comment on any post](https://stackoverflow.com/help/privileges/comment); instead, [provide answers that don\'t require clarification from the asker](https://meta.stackexchange.com/questions/214173/why-do-i-need-50-reputation-to-comment-what-can-i-do-instead).'
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
                },
                {
                    DisplayName: 'Needs Editing',
                    ReportType: 'NoFlag'
                }
            ]
        }
    ];
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, FunctionUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var genericBotUrl = 'https://so.floern.com/api/trackpost.php';
    var genericBotKey = 'Cm45BSrt51FR3ju';
    var GenericBotAPI = /** @class */ (function () {
        function GenericBotAPI(answerId) {
            this.answerId = answerId;
        }
        GenericBotAPI.prototype.ReportNaa = function () {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.makeTrackRequest()];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response];
                    }
                });
            });
        };
        GenericBotAPI.prototype.ReportRedFlag = function () {
            return __awaiter(this, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.makeTrackRequest()];
                        case 1:
                            response = _a.sent();
                            return [2 /*return*/, response];
                    }
                });
            });
        };
        GenericBotAPI.prototype.ReportLooksFine = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, false];
                });
            });
        };
        GenericBotAPI.prototype.ReportNeedsEditing = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, false];
                });
            });
        };
        GenericBotAPI.prototype.computeContentHash = function (postContent) {
            if (!postContent) {
                return 0;
            }
            var hash = 0;
            for (var i = 0; i < postContent.length; ++i) {
                hash = ((hash << 5) - hash) + postContent.charCodeAt(i);
                hash = hash & hash;
            }
            return hash;
        };
        GenericBotAPI.prototype.makeTrackRequest = function () {
            var _this = this;
            var promise = new Promise(function (resolve, reject) {
                if (!FunctionUtils_1.IsStackOverflow()) {
                    resolve(false);
                }
                if ($('#answer-' + _this.answerId + ' .post-text').length === 0) {
                    resolve(false);
                }
                if ($('.top-bar .my-profile .gravatar-wrapper-24').length === 0) {
                    reject('Flag Tracker: Could not find username.');
                }
                var flaggerName = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
                var contentHash = _this.computeContentHash($('#answer-' + _this.answerId + ' .post-text').html().trim());
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://so.floern.com/api/trackpost.php',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: "key=" + genericBotKey
                        + '&postId=' + _this.answerId
                        + '&contentHash=' + contentHash
                        + '&flagger=' + encodeURIComponent(flaggerName),
                    onload: function (response) {
                        if (response.status !== 200) {
                            reject('Flag Tracker Error: Status ' + response.status);
                        }
                        resolve(true);
                    },
                    onerror: function (response) {
                        reject('Flag Tracker Error: ' + response.responseText);
                    }
                });
            });
            return promise;
        };
        return GenericBotAPI;
    }());
    exports.GenericBotAPI = GenericBotAPI;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(1), __webpack_require__(6), __webpack_require__(10), __webpack_require__(8), __webpack_require__(2), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, FunctionUtils_1, Subject_1, ReplaySubject_1, CrossDomainCaching_1, SimpleCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
    var MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
    var MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';
    var MetaSmokeAPI = /** @class */ (function () {
        function MetaSmokeAPI(postId, postType) {
            this.postId = postId;
            this.postType = postType;
        }
        MetaSmokeAPI.Reset = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, CrossDomainCaching_1.CrossDomainCaching.StoreInCache(MetaSmokeDisabledConfig, undefined)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, CrossDomainCaching_1.CrossDomainCaching.StoreInCache(MetaSmokeUserKeyConfig, undefined)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        MetaSmokeAPI.IsDisabled = function () {
            return __awaiter(this, void 0, void 0, function () {
                var cachedDisabled;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, CrossDomainCaching_1.CrossDomainCaching.GetFromCache(MetaSmokeDisabledConfig)];
                        case 1:
                            cachedDisabled = _a.sent();
                            if (cachedDisabled === undefined) {
                                return [2 /*return*/, false];
                            }
                            return [2 /*return*/, cachedDisabled];
                    }
                });
            });
        };
        MetaSmokeAPI.Setup = function (appKey, codeGetter) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (!codeGetter) {
                        codeGetter = function (metaSmokeOAuthUrl) { return __awaiter(_this, void 0, void 0, function () {
                            var isDisabled, cachedUserKey, returnCode;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, MetaSmokeAPI.IsDisabled()];
                                    case 1:
                                        isDisabled = _a.sent();
                                        if (isDisabled) {
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, CrossDomainCaching_1.CrossDomainCaching.GetFromCache(MetaSmokeUserKeyConfig)];
                                    case 2:
                                        cachedUserKey = _a.sent();
                                        if (cachedUserKey) {
                                            return [2 /*return*/, cachedUserKey];
                                        }
                                        if (!confirm('Setting up MetaSmoke... If you do not wish to connect, press cancel. This will not show again if you press cancel. To reset configuration, see footer of Stack Overflow.')) {
                                            CrossDomainCaching_1.CrossDomainCaching.StoreInCache(MetaSmokeDisabledConfig, true);
                                            return [2 /*return*/];
                                        }
                                        window.open(metaSmokeOAuthUrl, '_blank');
                                        return [4 /*yield*/, FunctionUtils_1.Delay(100)];
                                    case 3:
                                        _a.sent();
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                var handleFDSCCode = function () {
                                                    $(window).off('focus', handleFDSCCode);
                                                    var code = window.prompt('Once you\'ve authenticated FDSC with metasmoke, you\'ll be given a code; enter it here.');
                                                    if (!code) {
                                                        resolve();
                                                    }
                                                    else {
                                                        return resolve(code);
                                                    }
                                                };
                                                $(window).focus(handleFDSCCode);
                                            })];
                                    case 4:
                                        returnCode = _a.sent();
                                        return [2 /*return*/, returnCode];
                                }
                            });
                        }); };
                    }
                    MetaSmokeAPI.codeGetter = codeGetter;
                    MetaSmokeAPI.appKey = appKey;
                    MetaSmokeAPI.getUserKey(); // Make sure we request it immediately
                    return [2 /*return*/];
                });
            });
        };
        MetaSmokeAPI.getUserKey = function () {
            var _this = this;
            return CrossDomainCaching_1.CrossDomainCaching.GetAndCache(MetaSmokeUserKeyConfig, function () { return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                var prom, code;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            prom = MetaSmokeAPI.actualPromise;
                            if (prom === undefined) {
                                prom = MetaSmokeAPI.codeGetter("https://metasmoke.erwaysoftware.com/oauth/request?key=" + MetaSmokeAPI.appKey);
                                MetaSmokeAPI.actualPromise = prom;
                            }
                            return [4 /*yield*/, prom];
                        case 1:
                            code = _a.sent();
                            if (code) {
                                $.ajax({
                                    url: 'https://metasmoke.erwaysoftware.com/oauth/token?key=' + MetaSmokeAPI.appKey + '&code=' + code,
                                    method: 'GET'
                                }).done(function (data) { return resolve(data.token); })
                                    .fail(function (err) { return reject(err); });
                            }
                            return [2 /*return*/];
                    }
                });
            }); }); });
        };
        MetaSmokeAPI.prototype.Watch = function () {
            this.subject = new Subject_1.Subject();
            this.replaySubject = new ReplaySubject_1.ReplaySubject(1);
            this.subject.subscribe(this.replaySubject);
            this.QueryMetaSmokey();
            return this.subject;
        };
        MetaSmokeAPI.prototype.ReportNaa = function () {
            return __awaiter(this, void 0, void 0, function () {
                var smokeyid;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.GetSmokeyId()];
                        case 1:
                            smokeyid = _a.sent();
                            if (!(smokeyid != null)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.SendFeedback(smokeyid, 'naa-')];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        MetaSmokeAPI.prototype.ReportRedFlag = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var smokeyid, urlStr_1, promise, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.GetSmokeyId()];
                        case 1:
                            smokeyid = _a.sent();
                            if (!(smokeyid != null)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.SendFeedback(smokeyid, 'tpu-')];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3:
                            urlStr_1 = this.postType === 'Answer'
                                ? "//" + window.location.hostname + "/a/" + this.postId
                                : "//" + window.location.hostname + "/q/" + this.postId;
                            promise = new Promise(function (resolve, reject) {
                                MetaSmokeAPI.getUserKey().then(function (userKey) {
                                    if (userKey) {
                                        $.ajax({
                                            type: 'POST',
                                            url: 'https://metasmoke.erwaysoftware.com/api/w/post/report',
                                            data: {
                                                post_link: urlStr_1,
                                                key: MetaSmokeAPI.appKey,
                                                token: userKey
                                            }
                                        }).done(function () { return resolve(); })
                                            .fail(function () { return reject(); });
                                        return true;
                                    }
                                    return false;
                                });
                            });
                            return [4 /*yield*/, promise.then(function (r) {
                                    var queryUrlStr = _this.postType === 'Answer'
                                        ? "//" + window.location.hostname + "/a/" + _this.postId
                                        : "//" + window.location.hostname + "/questions/" + _this.postId;
                                    SimpleCache_1.SimpleCache.StoreInCache(MetaSmokeWasReportedConfig + "." + queryUrlStr, undefined);
                                    _this.QueryMetaSmokey();
                                    return r;
                                })];
                        case 4:
                            result = _a.sent();
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        MetaSmokeAPI.prototype.ReportLooksFine = function () {
            return __awaiter(this, void 0, void 0, function () {
                var smokeyid;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.GetSmokeyId()];
                        case 1:
                            smokeyid = _a.sent();
                            if (!(smokeyid != null)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.SendFeedback(smokeyid, 'fp-')];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        MetaSmokeAPI.prototype.ReportNeedsEditing = function () {
            return __awaiter(this, void 0, void 0, function () {
                var smokeyid;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.GetSmokeyId()];
                        case 1:
                            smokeyid = _a.sent();
                            if (!(smokeyid != null)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.SendFeedback(smokeyid, 'fp-')];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        MetaSmokeAPI.prototype.QueryMetaSmokey = function () {
            var _this = this;
            var urlStr = this.postType === 'Answer'
                ? "//" + window.location.hostname + "/a/" + this.postId
                : "//" + window.location.hostname + "/questions/" + this.postId;
            var resultPromise = SimpleCache_1.SimpleCache.GetAndCache(MetaSmokeWasReportedConfig + "." + urlStr, function () { return new Promise(function (resolve, reject) {
                MetaSmokeAPI.IsDisabled().then(function (isDisabled) {
                    if (isDisabled) {
                        return;
                    }
                    $.ajax({
                        type: 'GET',
                        url: 'https://metasmoke.erwaysoftware.com/api/posts/urls',
                        data: {
                            urls: urlStr,
                            key: "" + MetaSmokeAPI.appKey
                        }
                    }).done(function (metaSmokeResult) {
                        if (metaSmokeResult.items.length > 0) {
                            resolve(metaSmokeResult.items[0].id);
                        }
                        else {
                            resolve(null);
                        }
                    }).fail(function (error) {
                        reject(error);
                    });
                });
            }); });
            resultPromise
                .then(function (r) { return _this.subject.next(r); })
                .catch(function (err) { return _this.subject.error(err); });
        };
        MetaSmokeAPI.prototype.GetSmokeyId = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.replaySubject.take(1).toPromise()];
                });
            });
        };
        MetaSmokeAPI.prototype.SendFeedback = function (metaSmokeId, feedbackType) {
            return new Promise(function (resolve, reject) {
                MetaSmokeAPI.getUserKey().then(function (userKey) {
                    $.ajax({
                        type: 'POST',
                        url: "https://metasmoke.erwaysoftware.com/api/w/post/" + metaSmokeId + "/feedback",
                        data: {
                            type: feedbackType,
                            key: MetaSmokeAPI.appKey,
                            token: userKey
                        }
                    }).done(function () { return resolve(); })
                        .fail(function () { return reject(); });
                });
            });
        };
        return MetaSmokeAPI;
    }());
    exports.MetaSmokeAPI = MetaSmokeAPI;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(42), __webpack_require__(6), __webpack_require__(10), __webpack_require__(1), __webpack_require__(2), __webpack_require__(12)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, ChatApi_1, Subject_1, ReplaySubject_1, FunctionUtils_1, SimpleCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var nattyFeedbackUrl = 'http://samserver.bhargavrao.com:8000/napi/api/feedback';
    var soboticsRoomId = 111347;
    var NattyAPI = /** @class */ (function () {
        function NattyAPI(answerId) {
            this.chat = new ChatApi_1.ChatApi();
            this.answerId = answerId;
        }
        NattyAPI.prototype.Watch = function () {
            var _this = this;
            this.subject = new Subject_1.Subject();
            this.replaySubject = new ReplaySubject_1.ReplaySubject(1);
            this.subject.subscribe(this.replaySubject);
            if (FunctionUtils_1.IsStackOverflow()) {
                SimpleCache_1.SimpleCache.GetAndCache("NattyApi.Feedback." + this.answerId, function () { return new Promise(function (resolve, reject) {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: nattyFeedbackUrl + "/" + _this.answerId,
                        onload: function (response) {
                            var nattyResult = JSON.parse(response.responseText);
                            if (nattyResult.items && nattyResult.items[0]) {
                                resolve(true);
                            }
                            else {
                                resolve(false);
                            }
                        },
                        onerror: function (response) {
                            reject(response);
                        },
                    });
                }); })
                    .then(function (r) { return _this.subject.next(r); })
                    .catch(function (err) { return _this.subject.error(err); });
            }
            return this.subject;
        };
        NattyAPI.prototype.ReportNaa = function (answerDate, questionDate) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var answerAge, daysPostedAfterQuestion, promise;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!FunctionUtils_1.IsStackOverflow()) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.WasReported()];
                        case 1:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.chat.SendMessage(soboticsRoomId, "@Natty feedback http://stackoverflow.com/a/" + this.answerId + " tp")];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3:
                            answerAge = this.DaysBetween(answerDate, new Date());
                            daysPostedAfterQuestion = this.DaysBetween(questionDate, answerDate);
                            if (answerAge > 30 || daysPostedAfterQuestion < 30) {
                                return [2 /*return*/, false];
                            }
                            promise = this.chat.SendMessage(soboticsRoomId, "@Natty report http://stackoverflow.com/a/" + this.answerId);
                            return [4 /*yield*/, promise.then(function () {
                                    SimpleCache_1.SimpleCache.StoreInCache("NattyApi.Feedback." + _this.answerId, true);
                                    _this.subject.next(true);
                                })];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, true];
                    }
                });
            });
        };
        NattyAPI.prototype.ReportRedFlag = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!FunctionUtils_1.IsStackOverflow()) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.WasReported()];
                        case 1:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.chat.SendMessage(soboticsRoomId, "@Natty feedback http://stackoverflow.com/a/" + this.answerId + " tp")];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        NattyAPI.prototype.ReportLooksFine = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!FunctionUtils_1.IsStackOverflow()) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.WasReported()];
                        case 1:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.chat.SendMessage(soboticsRoomId, "@Natty feedback http://stackoverflow.com/a/" + this.answerId + " fp")];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        NattyAPI.prototype.ReportNeedsEditing = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!FunctionUtils_1.IsStackOverflow()) {
                                return [2 /*return*/, false];
                            }
                            return [4 /*yield*/, this.WasReported()];
                        case 1:
                            if (!_a.sent()) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.chat.SendMessage(soboticsRoomId, "@Natty feedback http://stackoverflow.com/a/" + this.answerId + " ne")];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, true];
                        case 3: return [2 /*return*/, false];
                    }
                });
            });
        };
        NattyAPI.prototype.WasReported = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.replaySubject.take(1).toPromise()];
                });
            });
        };
        NattyAPI.prototype.DaysBetween = function (first, second) {
            return Math.round((second - first) / (1000 * 60 * 60 * 24));
        };
        return NattyAPI;
    }());
    exports.NattyAPI = NattyAPI;
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function isNatoPage() {
        return !!window.location.href.match(/\/tools\/new-answers-old-questions/);
    }
    exports.isNatoPage = isNatoPage;
    function parseNatoPage() {
        var nodes = $('.answer-hyperlink').parent().parent();
        var results = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = $(nodes[i]);
            var postId = parseInt(node.find('.answer-hyperlink').attr('href').split('#')[1], 10);
            var answerTime = parseActionDate(node.find('.user-action-time'));
            var questionTime = parseActionDate(node.find('td .relativetime'));
            var authorReputation = parseReputation(node.find('.reputation-score'));
            var _a = parseAuthorDetails(node.find('.user-details')), authorName = _a.authorName, authorId = _a.authorId;
            results.push({
                type: 'Answer',
                element: node,
                page: 'NATO',
                postId: postId,
                answerTime: answerTime,
                questionTime: questionTime,
                authorReputation: authorReputation,
                authorName: authorName,
                authorId: authorId,
            });
        }
        return results;
    }
    exports.parseNatoPage = parseNatoPage;
    function isQuestionPage() {
        return !!window.location.href.match(/\/questions\/\d+.*/);
    }
    exports.isQuestionPage = isQuestionPage;
    function parseQuestionPage() {
        var questionNode = $('.question');
        var postId = parseInt(questionNode.attr('data-questionid'), 10);
        function getPostDetails(node) {
            var score = parseInt(node.find('.vote-count-post').text(), 10);
            var authorReputation = parseReputation(node.find('.post-signature .reputation-score').last());
            var _a = parseAuthorDetails(node.find('.post-signature .user-details').last()), authorName = _a.authorName, authorId = _a.authorId;
            var postTime = parseActionDate(node.find('.post-signature .relativetime').last());
            return { score: score, authorReputation: authorReputation, authorName: authorName, authorId: authorId, postTime: postTime };
        }
        var postDetails = getPostDetails(questionNode);
        var results = [];
        var question = {
            type: 'Question',
            element: questionNode,
            page: 'Question',
            postId: postId,
            postTime: postDetails.postTime,
            score: postDetails.score,
            authorReputation: postDetails.authorReputation,
            authorName: postDetails.authorName,
            authorId: postDetails.authorId
        };
        results.push(question);
        var answerNodes = $('.answer');
        for (var i = 0; i < answerNodes.length; i++) {
            var answerNode = $(answerNodes[i]);
            var answerId = parseInt(answerNode.attr('data-answerid'), 10);
            postDetails = getPostDetails(answerNode);
            results.push({
                type: 'Answer',
                element: answerNode,
                page: 'Question',
                postId: answerId,
                question: question,
                postTime: postDetails.postTime,
                score: postDetails.score,
                authorReputation: postDetails.authorReputation,
                authorName: postDetails.authorName,
                authorId: postDetails.authorId
            });
        }
        return results;
    }
    exports.parseQuestionPage = parseQuestionPage;
    function isFlagsPage() {
        return !!window.location.href.match(/\/users\/flag-summary\//);
    }
    exports.isFlagsPage = isFlagsPage;
    function parseFlagsPage() {
        var nodes = $('.flagged-post');
        var results = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = $(nodes[i]);
            var type = node.find('.answer-hyperlink').length
                ? 'Answer'
                : 'Question';
            var postId = parseInt(type === 'Answer'
                ? node.find('.answer-hyperlink').attr('href').split('#')[1]
                : node.find('.question-hyperlink').attr('href').split('/')[2], 10);
            var score = parseInt(node.find('.answer-votes').text(), 10);
            var _a = parseAuthorDetails(node.find('.post-user-info')), authorName = _a.authorName, authorId = _a.authorId;
            var postTime = parseActionDate(node.find('.post-user-info .relativetime'));
            var handledTime = parseActionDate(node.find('.mod-flag .relativetime'));
            var fullHandledResult = node.find('.flag-outcome').text().trim().split(' - ');
            var handledResult = fullHandledResult[0].trim();
            var handledComment = fullHandledResult.slice(1).join(' - ').trim();
            results.push({
                type: type,
                element: node,
                page: 'Flags',
                postId: postId,
                score: score,
                postTime: postTime,
                handledTime: handledTime,
                handledResult: handledResult,
                handledComment: handledComment,
                authorName: authorName,
                authorId: authorId
            });
        }
        return results;
    }
    exports.parseFlagsPage = parseFlagsPage;
    function parseGenericPage() {
        var questionNodes = $('.question-hyperlink');
        var results = [];
        for (var i = 0; i < questionNodes.length; i++) {
            var questionNode = $(questionNodes[i]);
            var fragment = questionNode.attr('href').split('/')[2];
            if (fragment.indexOf('_') >= 0) {
                fragment = fragment.split('_')[1];
            }
            var postId = parseInt(fragment, 10);
            results.push({
                type: 'Question',
                element: questionNode,
                page: 'Unknown',
                postId: postId
            });
        }
        var answerNodes = $('.answer-hyperlink');
        for (var i = 0; i < answerNodes.length; i++) {
            var answerNode = $(answerNodes[i]);
            var fragment = answerNode.attr('href').split('#')[1];
            if (fragment.indexOf('_') >= 0) {
                fragment = fragment.split('_')[1];
            }
            var postId = parseInt(fragment, 10);
            results.push({
                type: 'Answer',
                element: answerNode,
                page: 'Unknown',
                postId: postId
            });
        }
        return results;
    }
    exports.parseGenericPage = parseGenericPage;
    function parseCurrentPage() {
        if (isNatoPage()) {
            // We explicitly type the page, as it allows the typescript compiler to
            // figure out the type of posts if a user checks if. For example:
            // const parsed = parseCurrentPage();
            // if (parsed.Page === 'Nato') {
            //     parsed.Posts is now properly typed as a nato post
            // }
            // If we don't do this, 'Page' is simply a string and doesn't give us any compiler hints
            return { Page: 'NATO', Posts: parseNatoPage() };
        }
        if (isQuestionPage()) {
            return { Page: 'Question', Posts: parseQuestionPage() };
        }
        if (isFlagsPage()) {
            return { Page: 'Flags', Posts: parseFlagsPage() };
        }
        return { Page: 'Unknown', Posts: parseGenericPage() };
    }
    exports.parseCurrentPage = parseCurrentPage;
    function parseReputation(reputationDiv) {
        var reputationText = reputationDiv.text();
        if (reputationText.indexOf('k') !== -1) {
            reputationText = reputationDiv.attr('title').substr('reputation score '.length);
        }
        reputationText = reputationText.replace(',', '');
        if (reputationText.trim() !== '') {
            return parseInt(reputationText, 10);
        }
        return undefined;
    }
    function parseAuthorDetails(authorDiv) {
        var userLink = authorDiv.find('a');
        var authorName = userLink.text();
        var userLinkRef = userLink.attr('href');
        var authorId;
        // Users can be deleted, and thus have no link to their profile.
        if (userLinkRef) {
            authorId = parseInt(userLinkRef.split('/')[2], 10);
        }
        return { authorName: authorName, authorId: authorId };
    }
    function parseActionDate(actionDiv) {
        if (!actionDiv.hasClass('relativetime')) {
            actionDiv = actionDiv.find('.relativetime');
        }
        var answerTime = new Date(actionDiv.attr('title'));
        return answerTime;
    }
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var Observable_1 = __webpack_require__(3);
/**
 * Represents a push-based event or value that an {@link Observable} can emit.
 * This class is particularly useful for operators that manage notifications,
 * like {@link materialize}, {@link dematerialize}, {@link observeOn}, and
 * others. Besides wrapping the actual delivered value, it also annotates it
 * with metadata of, for instance, what type of push message it is (`next`,
 * `error`, or `complete`).
 *
 * @see {@link materialize}
 * @see {@link dematerialize}
 * @see {@link observeOn}
 *
 * @class Notification<T>
 */
var Notification = (function () {
    function Notification(kind, value, error) {
        this.kind = kind;
        this.value = value;
        this.error = error;
        this.hasValue = kind === 'N';
    }
    /**
     * Delivers to the given `observer` the value wrapped by this Notification.
     * @param {Observer} observer
     * @return
     */
    Notification.prototype.observe = function (observer) {
        switch (this.kind) {
            case 'N':
                return observer.next && observer.next(this.value);
            case 'E':
                return observer.error && observer.error(this.error);
            case 'C':
                return observer.complete && observer.complete();
        }
    };
    /**
     * Given some {@link Observer} callbacks, deliver the value represented by the
     * current Notification to the correctly corresponding callback.
     * @param {function(value: T): void} next An Observer `next` callback.
     * @param {function(err: any): void} [error] An Observer `error` callback.
     * @param {function(): void} [complete] An Observer `complete` callback.
     * @return {any}
     */
    Notification.prototype.do = function (next, error, complete) {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return next && next(this.value);
            case 'E':
                return error && error(this.error);
            case 'C':
                return complete && complete();
        }
    };
    /**
     * Takes an Observer or its individual callback functions, and calls `observe`
     * or `do` methods accordingly.
     * @param {Observer|function(value: T): void} nextOrObserver An Observer or
     * the `next` callback.
     * @param {function(err: any): void} [error] An Observer `error` callback.
     * @param {function(): void} [complete] An Observer `complete` callback.
     * @return {any}
     */
    Notification.prototype.accept = function (nextOrObserver, error, complete) {
        if (nextOrObserver && typeof nextOrObserver.next === 'function') {
            return this.observe(nextOrObserver);
        }
        else {
            return this.do(nextOrObserver, error, complete);
        }
    };
    /**
     * Returns a simple Observable that just delivers the notification represented
     * by this Notification instance.
     * @return {any}
     */
    Notification.prototype.toObservable = function () {
        var kind = this.kind;
        switch (kind) {
            case 'N':
                return Observable_1.Observable.of(this.value);
            case 'E':
                return Observable_1.Observable.throw(this.error);
            case 'C':
                return Observable_1.Observable.empty();
        }
        throw new Error('unexpected notification kind value');
    };
    /**
     * A shortcut to create a Notification instance of the type `next` from a
     * given value.
     * @param {T} value The `next` value.
     * @return {Notification<T>} The "next" Notification representing the
     * argument.
     */
    Notification.createNext = function (value) {
        if (typeof value !== 'undefined') {
            return new Notification('N', value);
        }
        return Notification.undefinedValueNotification;
    };
    /**
     * A shortcut to create a Notification instance of the type `error` from a
     * given error.
     * @param {any} [err] The `error` error.
     * @return {Notification<T>} The "error" Notification representing the
     * argument.
     */
    Notification.createError = function (err) {
        return new Notification('E', undefined, err);
    };
    /**
     * A shortcut to create a Notification instance of the type `complete`.
     * @return {Notification<any>} The valueless "complete" Notification.
     */
    Notification.createComplete = function () {
        return Notification.completeNotification;
    };
    Notification.completeNotification = new Notification('C');
    Notification.undefinedValueNotification = new Notification('N', undefined);
    return Notification;
}());
exports.Notification = Notification;
//# sourceMappingURL=Notification.js.map

/***/ },
/* 22 */
/***/ function(module, exports) {

"use strict";
"use strict";
/**
 * An execution context and a data structure to order tasks and schedule their
 * execution. Provides a notion of (potentially virtual) time, through the
 * `now()` getter method.
 *
 * Each unit of work in a Scheduler is called an {@link Action}.
 *
 * ```ts
 * class Scheduler {
 *   now(): number;
 *   schedule(work, delay?, state?): Subscription;
 * }
 * ```
 *
 * @class Scheduler
 */
var Scheduler = (function () {
    function Scheduler(SchedulerAction, now) {
        if (now === void 0) { now = Scheduler.now; }
        this.SchedulerAction = SchedulerAction;
        this.now = now;
    }
    /**
     * Schedules a function, `work`, for execution. May happen at some point in
     * the future, according to the `delay` parameter, if specified. May be passed
     * some context object, `state`, which will be passed to the `work` function.
     *
     * The given arguments will be processed an stored as an Action object in a
     * queue of actions.
     *
     * @param {function(state: ?T): ?Subscription} work A function representing a
     * task, or some unit of work to be executed by the Scheduler.
     * @param {number} [delay] Time to wait before executing the work, where the
     * time unit is implicit and defined by the Scheduler itself.
     * @param {T} [state] Some contextual data that the `work` function uses when
     * called by the Scheduler.
     * @return {Subscription} A subscription in order to be able to unsubscribe
     * the scheduled work.
     */
    Scheduler.prototype.schedule = function (work, delay, state) {
        if (delay === void 0) { delay = 0; }
        return new this.SchedulerAction(this, work).schedule(state, delay);
    };
    Scheduler.now = Date.now ? Date.now : function () { return +new Date(); };
    return Scheduler;
}());
exports.Scheduler = Scheduler;
//# sourceMappingURL=Scheduler.js.map

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Observable_1 = __webpack_require__(3);
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @extends {Ignored}
 * @hide true
 */
var EmptyObservable = (function (_super) {
    __extends(EmptyObservable, _super);
    function EmptyObservable(scheduler) {
        _super.call(this);
        this.scheduler = scheduler;
    }
    /**
     * Creates an Observable that emits no items to the Observer and immediately
     * emits a complete notification.
     *
     * <span class="informal">Just emits 'complete', and nothing else.
     * </span>
     *
     * <img src="./img/empty.png" width="100%">
     *
     * This static operator is useful for creating a simple Observable that only
     * emits the complete notification. It can be used for composing with other
     * Observables, such as in a {@link mergeMap}.
     *
     * @example <caption>Emit the number 7, then complete.</caption>
     * var result = Rx.Observable.empty().startWith(7);
     * result.subscribe(x => console.log(x));
     *
     * @example <caption>Map and flatten only odd numbers to the sequence 'a', 'b', 'c'</caption>
     * var interval = Rx.Observable.interval(1000);
     * var result = interval.mergeMap(x =>
     *   x % 2 === 1 ? Rx.Observable.of('a', 'b', 'c') : Rx.Observable.empty()
     * );
     * result.subscribe(x => console.log(x));
     *
     * // Results in the following to the console:
     * // x is equal to the count on the interval eg(0,1,2,3,...)
     * // x will occur every 1000ms
     * // if x % 2 is equal to 1 print abc
     * // if x % 2 is not equal to 1 nothing will be output
     *
     * @see {@link create}
     * @see {@link never}
     * @see {@link of}
     * @see {@link throw}
     *
     * @param {Scheduler} [scheduler] A {@link IScheduler} to use for scheduling
     * the emission of the complete notification.
     * @return {Observable} An "empty" Observable: emits only the complete
     * notification.
     * @static true
     * @name empty
     * @owner Observable
     */
    EmptyObservable.create = function (scheduler) {
        return new EmptyObservable(scheduler);
    };
    EmptyObservable.dispatch = function (arg) {
        var subscriber = arg.subscriber;
        subscriber.complete();
    };
    EmptyObservable.prototype._subscribe = function (subscriber) {
        var scheduler = this.scheduler;
        if (scheduler) {
            return scheduler.schedule(EmptyObservable.dispatch, 0, { subscriber: subscriber });
        }
        else {
            subscriber.complete();
        }
    };
    return EmptyObservable;
}(Observable_1.Observable));
exports.EmptyObservable = EmptyObservable;
//# sourceMappingURL=EmptyObservable.js.map

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var take_1 = __webpack_require__(26);
/**
 * Emits only the first `count` values emitted by the source Observable.
 *
 * <span class="informal">Takes the first `count` values from the source, then
 * completes.</span>
 *
 * <img src="./img/take.png" width="100%">
 *
 * `take` returns an Observable that emits only the first `count` values emitted
 * by the source Observable. If the source emits fewer than `count` values then
 * all of its values are emitted. After that, it completes, regardless if the
 * source completes.
 *
 * @example <caption>Take the first 5 seconds of an infinite 1-second interval Observable</caption>
 * var interval = Rx.Observable.interval(1000);
 * var five = interval.take(5);
 * five.subscribe(x => console.log(x));
 *
 * @see {@link takeLast}
 * @see {@link takeUntil}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @throws {ArgumentOutOfRangeError} When using `take(i)`, it delivers an
 * ArgumentOutOrRangeError to the Observer's `error` callback if `i < 0`.
 *
 * @param {number} count The maximum number of `next` values to emit.
 * @return {Observable<T>} An Observable that emits only the first `count`
 * values emitted by the source Observable, or all of the values from the source
 * if the source emits fewer than `count` values.
 * @method take
 * @owner Observable
 */
function take(count) {
    return take_1.take(count)(this);
}
exports.take = take;
//# sourceMappingURL=take.js.map

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Subscriber_1 = __webpack_require__(4);
var Notification_1 = __webpack_require__(21);
/**
 *
 * Re-emits all notifications from source Observable with specified scheduler.
 *
 * <span class="informal">Ensure a specific scheduler is used, from outside of an Observable.</span>
 *
 * `observeOn` is an operator that accepts a scheduler as a first parameter, which will be used to reschedule
 * notifications emitted by the source Observable. It might be useful, if you do not have control over
 * internal scheduler of a given Observable, but want to control when its values are emitted nevertheless.
 *
 * Returned Observable emits the same notifications (nexted values, complete and error events) as the source Observable,
 * but rescheduled with provided scheduler. Note that this doesn't mean that source Observables internal
 * scheduler will be replaced in any way. Original scheduler still will be used, but when the source Observable emits
 * notification, it will be immediately scheduled again - this time with scheduler passed to `observeOn`.
 * An anti-pattern would be calling `observeOn` on Observable that emits lots of values synchronously, to split
 * that emissions into asynchronous chunks. For this to happen, scheduler would have to be passed into the source
 * Observable directly (usually into the operator that creates it). `observeOn` simply delays notifications a
 * little bit more, to ensure that they are emitted at expected moments.
 *
 * As a matter of fact, `observeOn` accepts second parameter, which specifies in milliseconds with what delay notifications
 * will be emitted. The main difference between {@link delay} operator and `observeOn` is that `observeOn`
 * will delay all notifications - including error notifications - while `delay` will pass through error
 * from source Observable immediately when it is emitted. In general it is highly recommended to use `delay` operator
 * for any kind of delaying of values in the stream, while using `observeOn` to specify which scheduler should be used
 * for notification emissions in general.
 *
 * @example <caption>Ensure values in subscribe are called just before browser repaint.</caption>
 * const intervals = Rx.Observable.interval(10); // Intervals are scheduled
 *                                               // with async scheduler by default...
 *
 * intervals
 * .observeOn(Rx.Scheduler.animationFrame)       // ...but we will observe on animationFrame
 * .subscribe(val => {                           // scheduler to ensure smooth animation.
 *   someDiv.style.height = val + 'px';
 * });
 *
 * @see {@link delay}
 *
 * @param {IScheduler} scheduler Scheduler that will be used to reschedule notifications from source Observable.
 * @param {number} [delay] Number of milliseconds that states with what delay every notification should be rescheduled.
 * @return {Observable<T>} Observable that emits the same notifications as the source Observable,
 * but with provided scheduler.
 *
 * @method observeOn
 * @owner Observable
 */
function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return function observeOnOperatorFunction(source) {
        return source.lift(new ObserveOnOperator(scheduler, delay));
    };
}
exports.observeOn = observeOn;
var ObserveOnOperator = (function () {
    function ObserveOnOperator(scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        this.scheduler = scheduler;
        this.delay = delay;
    }
    ObserveOnOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new ObserveOnSubscriber(subscriber, this.scheduler, this.delay));
    };
    return ObserveOnOperator;
}());
exports.ObserveOnOperator = ObserveOnOperator;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var ObserveOnSubscriber = (function (_super) {
    __extends(ObserveOnSubscriber, _super);
    function ObserveOnSubscriber(destination, scheduler, delay) {
        if (delay === void 0) { delay = 0; }
        _super.call(this, destination);
        this.scheduler = scheduler;
        this.delay = delay;
    }
    ObserveOnSubscriber.dispatch = function (arg) {
        var notification = arg.notification, destination = arg.destination;
        notification.observe(destination);
        this.unsubscribe();
    };
    ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
        this.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
    };
    ObserveOnSubscriber.prototype._next = function (value) {
        this.scheduleMessage(Notification_1.Notification.createNext(value));
    };
    ObserveOnSubscriber.prototype._error = function (err) {
        this.scheduleMessage(Notification_1.Notification.createError(err));
    };
    ObserveOnSubscriber.prototype._complete = function () {
        this.scheduleMessage(Notification_1.Notification.createComplete());
    };
    return ObserveOnSubscriber;
}(Subscriber_1.Subscriber));
exports.ObserveOnSubscriber = ObserveOnSubscriber;
var ObserveOnMessage = (function () {
    function ObserveOnMessage(notification, destination) {
        this.notification = notification;
        this.destination = destination;
    }
    return ObserveOnMessage;
}());
exports.ObserveOnMessage = ObserveOnMessage;
//# sourceMappingURL=observeOn.js.map

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Subscriber_1 = __webpack_require__(4);
var ArgumentOutOfRangeError_1 = __webpack_require__(34);
var EmptyObservable_1 = __webpack_require__(23);
/**
 * Emits only the first `count` values emitted by the source Observable.
 *
 * <span class="informal">Takes the first `count` values from the source, then
 * completes.</span>
 *
 * <img src="./img/take.png" width="100%">
 *
 * `take` returns an Observable that emits only the first `count` values emitted
 * by the source Observable. If the source emits fewer than `count` values then
 * all of its values are emitted. After that, it completes, regardless if the
 * source completes.
 *
 * @example <caption>Take the first 5 seconds of an infinite 1-second interval Observable</caption>
 * var interval = Rx.Observable.interval(1000);
 * var five = interval.take(5);
 * five.subscribe(x => console.log(x));
 *
 * @see {@link takeLast}
 * @see {@link takeUntil}
 * @see {@link takeWhile}
 * @see {@link skip}
 *
 * @throws {ArgumentOutOfRangeError} When using `take(i)`, it delivers an
 * ArgumentOutOrRangeError to the Observer's `error` callback if `i < 0`.
 *
 * @param {number} count The maximum number of `next` values to emit.
 * @return {Observable<T>} An Observable that emits only the first `count`
 * values emitted by the source Observable, or all of the values from the source
 * if the source emits fewer than `count` values.
 * @method take
 * @owner Observable
 */
function take(count) {
    return function (source) {
        if (count === 0) {
            return new EmptyObservable_1.EmptyObservable();
        }
        else {
            return source.lift(new TakeOperator(count));
        }
    };
}
exports.take = take;
var TakeOperator = (function () {
    function TakeOperator(total) {
        this.total = total;
        if (this.total < 0) {
            throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
        }
    }
    TakeOperator.prototype.call = function (subscriber, source) {
        return source.subscribe(new TakeSubscriber(subscriber, this.total));
    };
    return TakeOperator;
}());
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var TakeSubscriber = (function (_super) {
    __extends(TakeSubscriber, _super);
    function TakeSubscriber(destination, total) {
        _super.call(this, destination);
        this.total = total;
        this.count = 0;
    }
    TakeSubscriber.prototype._next = function (value) {
        var total = this.total;
        var count = ++this.count;
        if (count <= total) {
            this.destination.next(value);
            if (count === total) {
                this.destination.complete();
                this.unsubscribe();
            }
        }
    };
    return TakeSubscriber;
}(Subscriber_1.Subscriber));
//# sourceMappingURL=take.js.map

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Subscription_1 = __webpack_require__(0);
/**
 * A unit of work to be executed in a {@link Scheduler}. An action is typically
 * created from within a Scheduler and an RxJS user does not need to concern
 * themselves about creating and manipulating an Action.
 *
 * ```ts
 * class Action<T> extends Subscription {
 *   new (scheduler: Scheduler, work: (state?: T) => void);
 *   schedule(state?: T, delay: number = 0): Subscription;
 * }
 * ```
 *
 * @class Action<T>
 */
var Action = (function (_super) {
    __extends(Action, _super);
    function Action(scheduler, work) {
        _super.call(this);
    }
    /**
     * Schedules this action on its parent Scheduler for execution. May be passed
     * some context object, `state`. May happen at some point in the future,
     * according to the `delay` parameter, if specified.
     * @param {T} [state] Some contextual data that the `work` function uses when
     * called by the Scheduler.
     * @param {number} [delay] Time to wait before executing the work, where the
     * time unit is implicit and defined by the Scheduler.
     * @return {void}
     */
    Action.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        return this;
    };
    return Action;
}(Subscription_1.Subscription));
exports.Action = Action;
//# sourceMappingURL=Action.js.map

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var root_1 = __webpack_require__(5);
var Action_1 = __webpack_require__(27);
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var AsyncAction = (function (_super) {
    __extends(AsyncAction, _super);
    function AsyncAction(scheduler, work) {
        _super.call(this, scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
        this.pending = false;
    }
    AsyncAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (this.closed) {
            return this;
        }
        // Always replace the current state with the new state.
        this.state = state;
        // Set the pending flag indicating that this action has been scheduled, or
        // has recursively rescheduled itself.
        this.pending = true;
        var id = this.id;
        var scheduler = this.scheduler;
        //
        // Important implementation note:
        //
        // Actions only execute once by default, unless rescheduled from within the
        // scheduled callback. This allows us to implement single and repeat
        // actions via the same code path, without adding API surface area, as well
        // as mimic traditional recursion but across asynchronous boundaries.
        //
        // However, JS runtimes and timers distinguish between intervals achieved by
        // serial `setTimeout` calls vs. a single `setInterval` call. An interval of
        // serial `setTimeout` calls can be individually delayed, which delays
        // scheduling the next `setTimeout`, and so on. `setInterval` attempts to
        // guarantee the interval callback will be invoked more precisely to the
        // interval period, regardless of load.
        //
        // Therefore, we use `setInterval` to schedule single and repeat actions.
        // If the action reschedules itself with the same delay, the interval is not
        // canceled. If the action doesn't reschedule, or reschedules with a
        // different delay, the interval will be canceled after scheduled callback
        // execution.
        //
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, delay);
        }
        this.delay = delay;
        // If this action has already an async Id, don't request a new one.
        this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
        return this;
    };
    AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        return root_1.root.setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        // If this action is rescheduled with the same delay time, don't clear the interval id.
        if (delay !== null && this.delay === delay && this.pending === false) {
            return id;
        }
        // Otherwise, if the action's delay time is different from the current delay,
        // or the action has been rescheduled before it's executed, clear the interval id
        return root_1.root.clearInterval(id) && undefined || undefined;
    };
    /**
     * Immediately executes this action and the `work` it contains.
     * @return {any}
     */
    AsyncAction.prototype.execute = function (state, delay) {
        if (this.closed) {
            return new Error('executing a cancelled action');
        }
        this.pending = false;
        var error = this._execute(state, delay);
        if (error) {
            return error;
        }
        else if (this.pending === false && this.id != null) {
            // Dequeue if the action didn't reschedule itself. Don't call
            // unsubscribe(), because the action could reschedule later.
            // For example:
            // ```
            // scheduler.schedule(function doWork(counter) {
            //   /* ... I'm a busy worker bee ... */
            //   var originalAction = this;
            //   /* wait 100ms before rescheduling the action */
            //   setTimeout(function () {
            //     originalAction.schedule(counter + 1);
            //   }, 100);
            // }, 1000);
            // ```
            this.id = this.recycleAsyncId(this.scheduler, this.id, null);
        }
    };
    AsyncAction.prototype._execute = function (state, delay) {
        var errored = false;
        var errorValue = undefined;
        try {
            this.work(state);
        }
        catch (e) {
            errored = true;
            errorValue = !!e && e || new Error(e);
        }
        if (errored) {
            this.unsubscribe();
            return errorValue;
        }
    };
    AsyncAction.prototype._unsubscribe = function () {
        var id = this.id;
        var scheduler = this.scheduler;
        var actions = scheduler.actions;
        var index = actions.indexOf(this);
        this.work = null;
        this.state = null;
        this.pending = false;
        this.scheduler = null;
        if (index !== -1) {
            actions.splice(index, 1);
        }
        if (id != null) {
            this.id = this.recycleAsyncId(scheduler, id, null);
        }
        this.delay = null;
    };
    return AsyncAction;
}(Action_1.Action));
exports.AsyncAction = AsyncAction;
//# sourceMappingURL=AsyncAction.js.map

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Scheduler_1 = __webpack_require__(22);
var AsyncScheduler = (function (_super) {
    __extends(AsyncScheduler, _super);
    function AsyncScheduler() {
        _super.apply(this, arguments);
        this.actions = [];
        /**
         * A flag to indicate whether the Scheduler is currently executing a batch of
         * queued actions.
         * @type {boolean}
         */
        this.active = false;
        /**
         * An internal ID used to track the latest asynchronous task such as those
         * coming from `setTimeout`, `setInterval`, `requestAnimationFrame`, and
         * others.
         * @type {any}
         */
        this.scheduled = undefined;
    }
    AsyncScheduler.prototype.flush = function (action) {
        var actions = this.actions;
        if (this.active) {
            actions.push(action);
            return;
        }
        var error;
        this.active = true;
        do {
            if (error = action.execute(action.state, action.delay)) {
                break;
            }
        } while (action = actions.shift()); // exhaust the scheduler queue
        this.active = false;
        if (error) {
            while (action = actions.shift()) {
                action.unsubscribe();
            }
            throw error;
        }
    };
    return AsyncScheduler;
}(Scheduler_1.Scheduler));
exports.AsyncScheduler = AsyncScheduler;
//# sourceMappingURL=AsyncScheduler.js.map

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AsyncAction_1 = __webpack_require__(28);
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @ignore
 * @extends {Ignored}
 */
var QueueAction = (function (_super) {
    __extends(QueueAction, _super);
    function QueueAction(scheduler, work) {
        _super.call(this, scheduler, work);
        this.scheduler = scheduler;
        this.work = work;
    }
    QueueAction.prototype.schedule = function (state, delay) {
        if (delay === void 0) { delay = 0; }
        if (delay > 0) {
            return _super.prototype.schedule.call(this, state, delay);
        }
        this.delay = delay;
        this.state = state;
        this.scheduler.flush(this);
        return this;
    };
    QueueAction.prototype.execute = function (state, delay) {
        return (delay > 0 || this.closed) ?
            _super.prototype.execute.call(this, state, delay) :
            this._execute(state, delay);
    };
    QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
        if (delay === void 0) { delay = 0; }
        // If delay exists and is greater than 0, or if the delay is null (the
        // action wasn't rescheduled) but was originally scheduled as an async
        // action, then recycle as an async action.
        if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
            return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
        }
        // Otherwise flush the scheduler starting with this action.
        return scheduler.flush(this);
    };
    return QueueAction;
}(AsyncAction_1.AsyncAction));
exports.QueueAction = QueueAction;
//# sourceMappingURL=QueueAction.js.map

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AsyncScheduler_1 = __webpack_require__(29);
var QueueScheduler = (function (_super) {
    __extends(QueueScheduler, _super);
    function QueueScheduler() {
        _super.apply(this, arguments);
    }
    return QueueScheduler;
}(AsyncScheduler_1.AsyncScheduler));
exports.QueueScheduler = QueueScheduler;
//# sourceMappingURL=QueueScheduler.js.map

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var QueueAction_1 = __webpack_require__(30);
var QueueScheduler_1 = __webpack_require__(31);
/**
 *
 * Queue Scheduler
 *
 * <span class="informal">Put every next task on a queue, instead of executing it immediately</span>
 *
 * `queue` scheduler, when used with delay, behaves the same as {@link async} scheduler.
 *
 * When used without delay, it schedules given task synchronously - executes it right when
 * it is scheduled. However when called recursively, that is when inside the scheduled task,
 * another task is scheduled with queue scheduler, instead of executing immediately as well,
 * that task will be put on a queue and wait for current one to finish.
 *
 * This means that when you execute task with `queue` scheduler, you are sure it will end
 * before any other task scheduled with that scheduler will start.
 *
 * @examples <caption>Schedule recursively first, then do something</caption>
 *
 * Rx.Scheduler.queue.schedule(() => {
 *   Rx.Scheduler.queue.schedule(() => console.log('second')); // will not happen now, but will be put on a queue
 *
 *   console.log('first');
 * });
 *
 * // Logs:
 * // "first"
 * // "second"
 *
 *
 * @example <caption>Reschedule itself recursively</caption>
 *
 * Rx.Scheduler.queue.schedule(function(state) {
 *   if (state !== 0) {
 *     console.log('before', state);
 *     this.schedule(state - 1); // `this` references currently executing Action,
 *                               // which we reschedule with new state
 *     console.log('after', state);
 *   }
 * }, 0, 3);
 *
 * // In scheduler that runs recursively, you would expect:
 * // "before", 3
 * // "before", 2
 * // "before", 1
 * // "after", 1
 * // "after", 2
 * // "after", 3
 *
 * // But with queue it logs:
 * // "before", 3
 * // "after", 3
 * // "before", 2
 * // "after", 2
 * // "before", 1
 * // "after", 1
 *
 *
 * @static true
 * @name queue
 * @owner Scheduler
 */
exports.queue = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);
//# sourceMappingURL=queue.js.map

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var root_1 = __webpack_require__(5);
function getSymbolObservable(context) {
    var $$observable;
    var Symbol = context.Symbol;
    if (typeof Symbol === 'function') {
        if (Symbol.observable) {
            $$observable = Symbol.observable;
        }
        else {
            $$observable = Symbol('observable');
            Symbol.observable = $$observable;
        }
    }
    else {
        $$observable = '@@observable';
    }
    return $$observable;
}
exports.getSymbolObservable = getSymbolObservable;
exports.observable = getSymbolObservable(root_1.root);
/**
 * @deprecated use observable instead
 */
exports.$$observable = exports.observable;
//# sourceMappingURL=observable.js.map

/***/ },
/* 34 */
/***/ function(module, exports) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when an element was queried at a certain index of an
 * Observable, but no such index or position exists in that sequence.
 *
 * @see {@link elementAt}
 * @see {@link take}
 * @see {@link takeLast}
 *
 * @class ArgumentOutOfRangeError
 */
var ArgumentOutOfRangeError = (function (_super) {
    __extends(ArgumentOutOfRangeError, _super);
    function ArgumentOutOfRangeError() {
        var err = _super.call(this, 'argument out of range');
        this.name = err.name = 'ArgumentOutOfRangeError';
        this.stack = err.stack;
        this.message = err.message;
    }
    return ArgumentOutOfRangeError;
}(Error));
exports.ArgumentOutOfRangeError = ArgumentOutOfRangeError;
//# sourceMappingURL=ArgumentOutOfRangeError.js.map

/***/ },
/* 35 */
/***/ function(module, exports) {

"use strict";
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * An error thrown when one or more errors have occurred during the
 * `unsubscribe` of a {@link Subscription}.
 */
var UnsubscriptionError = (function (_super) {
    __extends(UnsubscriptionError, _super);
    function UnsubscriptionError(errors) {
        _super.call(this);
        this.errors = errors;
        var err = Error.call(this, errors ?
            errors.length + " errors occurred during unsubscription:\n  " + errors.map(function (err, i) { return ((i + 1) + ") " + err.toString()); }).join('\n  ') : '');
        this.name = err.name = 'UnsubscriptionError';
        this.stack = err.stack;
        this.message = err.message;
    }
    return UnsubscriptionError;
}(Error));
exports.UnsubscriptionError = UnsubscriptionError;
//# sourceMappingURL=UnsubscriptionError.js.map

/***/ },
/* 36 */
/***/ function(module, exports) {

"use strict";
"use strict";
exports.isArray = Array.isArray || (function (x) { return x && typeof x.length === 'number'; });
//# sourceMappingURL=isArray.js.map

/***/ },
/* 37 */
/***/ function(module, exports) {

"use strict";
"use strict";
function isObject(x) {
    return x != null && typeof x === 'object';
}
exports.isObject = isObject;
//# sourceMappingURL=isObject.js.map

/***/ },
/* 38 */
/***/ function(module, exports) {

"use strict";
"use strict";
/* tslint:disable:no-empty */
function noop() { }
exports.noop = noop;
//# sourceMappingURL=noop.js.map

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var noop_1 = __webpack_require__(38);
/* tslint:enable:max-line-length */
function pipe() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i - 0] = arguments[_i];
    }
    return pipeFromArray(fns);
}
exports.pipe = pipe;
/* @internal */
function pipeFromArray(fns) {
    if (!fns) {
        return noop_1.noop;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}
exports.pipeFromArray = pipeFromArray;
//# sourceMappingURL=pipe.js.map

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var Subscriber_1 = __webpack_require__(4);
var rxSubscriber_1 = __webpack_require__(7);
var Observer_1 = __webpack_require__(9);
function toSubscriber(nextOrObserver, error, complete) {
    if (nextOrObserver) {
        if (nextOrObserver instanceof Subscriber_1.Subscriber) {
            return nextOrObserver;
        }
        if (nextOrObserver[rxSubscriber_1.rxSubscriber]) {
            return nextOrObserver[rxSubscriber_1.rxSubscriber]();
        }
    }
    if (!nextOrObserver && !error && !complete) {
        return new Subscriber_1.Subscriber(Observer_1.empty);
    }
    return new Subscriber_1.Subscriber(nextOrObserver, error, complete);
}
exports.toSubscriber = toSubscriber;
//# sourceMappingURL=toSubscriber.js.map

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";
var errorObject_1 = __webpack_require__(14);
var tryCatchTarget;
function tryCatcher() {
    try {
        return tryCatchTarget.apply(this, arguments);
    }
    catch (e) {
        errorObject_1.errorObject.e = e;
        return errorObject_1.errorObject;
    }
}
function tryCatch(fn) {
    tryCatchTarget = fn;
    return tryCatcher;
}
exports.tryCatch = tryCatch;
;
//# sourceMappingURL=tryCatch.js.map

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, SimpleCache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ChatApi = /** @class */ (function () {
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
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 1);
            return SimpleCache_1.SimpleCache.GetAndCache(cachingKey, function () { return getterPromise; }, expiryDate);
        };
        ChatApi.prototype.SendMessage = function (roomId, message, providedFkey) {
            var _this = this;
            var fkeyPromise = providedFkey
                ? Promise.resolve(providedFkey)
                : this.GetChannelFKey(roomId);
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
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__, exports, __webpack_require__(18), __webpack_require__(16), __webpack_require__(19), __webpack_require__(1), __webpack_require__(20), __webpack_require__(17), __webpack_require__(8), __webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function (require, exports, MetaSmokeAPI_1, FlagTypes_1, NattyApi_1, FunctionUtils_1, StackExchangeWebParser_1, GenericBotAPI_1, CrossDomainCaching_1, SimpleCache_1) {
    "use strict";
    var _this = this;
    Object.defineProperty(exports, "__esModule", { value: true });
    // tslint:disable-next-line:no-debugger
    debugger;
    var metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
    function SetupStyles() {
        var scriptNode = document.createElement('style');
        scriptNode.type = 'text/css';
        scriptNode.textContent = "\n#snackbar {\n    min-width: 250px;\n    margin-left: -125px;\n    color: #fff;\n    text-align: center;\n    border-radius: 2px;\n    padding: 16px;\n    position: fixed;\n    z-index: 2000;\n    left: 50%;\n    top: 30px;\n    font-size: 17px;\n}\n\n#snackbar.show {\n    opacity: 1;\n    transition: opacity 1s ease-out;\n    -ms-transition: opacity 1s ease-out;\n    -moz-transition: opacity 1s ease-out;\n    -webkit-transition: opacity 1s ease-out;\n}\n\n#snackbar.hide {\n    opacity: 0;\n    transition: opacity 1s ease-in;\n    -ms-transition: opacity 1s ease-in;\n    -moz-transition: opacity 1s ease-in;\n    -webkit-transition: opacity 1s ease-in;\n}\n";
        var target = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
        target.appendChild(scriptNode);
    }
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
                    if (userReputation === undefined || comments[i].ReputationLimit <= userReputation) {
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
                        data: { fkey: StackExchange.options.user.fkey, comment: commentText_1 }
                    }).done(function (data) {
                        resolve(data);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                    });
                });
            }
        }
        if (flag.ReportType !== 'NoFlag') {
            var wasFlagged = SimpleCache_1.SimpleCache.GetFromCache("AdvancedFlagging.Flagged." + postId);
            if (!wasFlagged) {
                result.FlagPromise = new Promise(function (resolve, reject) {
                    $.ajax({
                        url: "//" + window.location.hostname + "/flags/posts/" + postId + "/add/" + flag.ReportType,
                        type: 'POST',
                        data: { fkey: StackExchange.options.user.fkey, otherText: '' }
                    }).done(function (data) {
                        resolve(data);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        reject({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
                    });
                });
            }
        }
        return result;
    }
    var popupWrapper = $('<div>').addClass('hide').attr('id', 'snackbar');
    var popupDelay = 2000;
    var toasterTimeout = null;
    var toasterFadeTimeout = null;
    function displayToaster(message, colour) {
        var div = $('<div>')
            .css({
            'background-color': colour,
            'padding': '10px'
        })
            .text(message);
        popupWrapper.append(div);
        popupWrapper.removeClass('hide').addClass('show');
        function hidePopup() {
            popupWrapper.removeClass('show').addClass('hide');
            toasterFadeTimeout = setTimeout(function () {
                popupWrapper.empty();
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
    function displaySuccess(message) {
        displayToaster(message, '#00690c');
    }
    function displayError(message) {
        displayToaster(message, '#ba1701');
    }
    function BuildFlaggingDialog(element, postId, postType, reputation, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters) {
        var getDivider = function () { return $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' }); };
        var linkStyle = { 'display': 'inline-block', 'margin-top': '5px', 'width': 'auto' };
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
        var checkboxName = "comment_checkbox_" + postId;
        var leaveCommentBox = $('<input />')
            .attr('type', 'checkbox')
            .attr('name', checkboxName);
        var isStackOverflow = FunctionUtils_1.IsStackOverflow();
        var comments = element.find('.comment-body');
        if (comments.length === 0 && isStackOverflow) {
            leaveCommentBox.prop('checked', true);
        }
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
                var reportLink = $('<a />').css(linkStyle);
                reportLink.click(function () {
                    if (!deleted) {
                        try {
                            var result = handleFlagAndComment(postId, flagType, leaveCommentBox.is(':checked'), reputation);
                            if (result.CommentPromise) {
                                result.CommentPromise.then(function (data) {
                                    var commentUI = StackExchange.comments.uiForPost($('#comments-' + postId));
                                    commentUI.addShow(true, false);
                                    commentUI.showComments(data, null, false, true);
                                    $(document).trigger('comment', postId);
                                }).catch(function (err) { return displayError('Failed to comment on post'); });
                            }
                            if (result.FlagPromise) {
                                result.FlagPromise.then(function () {
                                    SimpleCache_1.SimpleCache.StoreInCache("AdvancedFlagging.Flagged." + postId, flagType);
                                    reportedIcon.attr('title', "Flagged as " + flagType.ReportType);
                                    reportedIcon.show();
                                }).catch(function (err) { return displayError('Failed to flag post'); });
                            }
                        }
                        catch (err) {
                            displayError(err);
                        }
                    }
                    var noFlag = flagType.ReportType === 'NoFlag';
                    if (noFlag) {
                        SimpleCache_1.SimpleCache.StoreInCache("AdvancedFlagging.PerformedAction." + postId, flagType);
                        performedActionIcon.attr('title', "Performed action: " + flagType.DisplayName);
                        performedActionIcon.show();
                    }
                    var rudeFlag = flagType.ReportType === 'PostSpam' || flagType.ReportType === 'PostOffensive';
                    var naaFlag = flagType.ReportType === 'AnswerNotAnAnswer';
                    var _loop_1 = function (i) {
                        var reporter = reporters[i];
                        var promise = null;
                        if (rudeFlag) {
                            promise = reporter.ReportRedFlag();
                        }
                        else if (naaFlag) {
                            promise = reporter.ReportNaa(answerTime, questionTime);
                        }
                        else if (noFlag) {
                            promise =
                                flagType.DisplayName === 'Needs Editing'
                                    ? reporter.ReportNeedsEditing()
                                    : reporter.ReportLooksFine();
                        }
                        if (promise) {
                            promise.then(function (didReport) {
                                if (didReport) {
                                    displaySuccess("Feedback sent to " + reporter.name);
                                }
                            }).catch(function (error) {
                                displayError("Failed to send feedback to " + reporter.name + ".");
                            });
                        }
                    };
                    for (var i = 0; i < reporters.length; i++) {
                        _loop_1(i);
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
        return dropDown;
    }
    function SetupPostPage() {
        var results = StackExchangeWebParser_1.parseCurrentPage();
        var _loop_2 = function (i) {
            var post = results.Posts[i];
            var iconLocation = void 0;
            var advancedFlaggingLink = null;
            var nattyIcon = getNattyIcon().click(function () {
                window.open("https://sentinel.erwaysoftware.com/posts/aid/" + post.postId, '_blank');
            });
            var showFunc = function (element) { return element.show(); };
            var smokeyIcon = getSmokeyIcon();
            var reporters = [];
            if (post.type === 'Answer') {
                var nattyApi_1 = new NattyApi_1.NattyAPI(post.postId);
                nattyApi_1.Watch()
                    .subscribe(function (reported) {
                    if (reported) {
                        showFunc(nattyIcon);
                    }
                    else {
                        nattyIcon.hide();
                    }
                });
                reporters.push({
                    name: 'Natty',
                    ReportNaa: function (answerDate, questionDate) { return nattyApi_1.ReportNaa(answerDate, questionDate); },
                    ReportRedFlag: function () { return nattyApi_1.ReportRedFlag(); },
                    ReportLooksFine: function () { return nattyApi_1.ReportLooksFine(); },
                    ReportNeedsEditing: function () { return nattyApi_1.ReportNeedsEditing(); }
                });
                var genericBotAPI_1 = new GenericBotAPI_1.GenericBotAPI(post.postId);
                reporters.push({
                    name: 'Generic Bot',
                    ReportNaa: function (answerDate, questionDate) { return genericBotAPI_1.ReportNaa(); },
                    ReportRedFlag: function () { return genericBotAPI_1.ReportRedFlag(); },
                    ReportLooksFine: function () { return genericBotAPI_1.ReportLooksFine(); },
                    ReportNeedsEditing: function () { return genericBotAPI_1.ReportNeedsEditing(); }
                });
            }
            var metaSmoke = new MetaSmokeAPI_1.MetaSmokeAPI(post.postId, post.type);
            metaSmoke.Watch()
                .subscribe(function (id) {
                if (id !== null) {
                    smokeyIcon.click(function () {
                        window.open("https://metasmoke.erwaysoftware.com/post/" + id, '_blank');
                    });
                    showFunc(smokeyIcon);
                }
                else {
                    smokeyIcon.hide();
                }
            });
            reporters.push({
                name: 'Smokey',
                ReportNaa: function (answerDate, questionDate) { return metaSmoke.ReportNaa(); },
                ReportRedFlag: function () { return metaSmoke.ReportRedFlag(); },
                ReportLooksFine: function () { return metaSmoke.ReportLooksFine(); },
                ReportNeedsEditing: function () { return metaSmoke.ReportNeedsEditing(); }
            });
            var performedActionIcon = getPerformedActionIcon();
            var reportedIcon = getReportedIcon();
            if (post.page === 'Question') {
                // Now we setup the flagging dialog
                iconLocation = post.element.find('.post-menu');
                advancedFlaggingLink = $('<a />').text('Advanced Flagging');
                var questionTime = void 0;
                var answerTime = void 0;
                if (post.type === 'Answer') {
                    questionTime = post.question.postTime;
                    answerTime = post.postTime;
                }
                else {
                    questionTime = post.postTime;
                    answerTime = post.postTime;
                }
                var deleted = post.element.hasClass('deleted-answer');
                var dropDown_1 = BuildFlaggingDialog(post.element, post.postId, post.type, post.authorReputation, answerTime, questionTime, deleted, reportedIcon, performedActionIcon, reporters);
                advancedFlaggingLink.append(dropDown_1);
                $(window).click(function () {
                    dropDown_1.hide();
                });
                var link_1 = advancedFlaggingLink;
                link_1.click(function (e) {
                    e.stopPropagation();
                    if (e.target === link_1.get(0)) {
                        dropDown_1.toggle();
                    }
                });
                iconLocation.append(advancedFlaggingLink);
                iconLocation.append(performedActionIcon);
                iconLocation.append(reportedIcon);
                iconLocation.append(nattyIcon);
                iconLocation.append(smokeyIcon);
            }
            else {
                iconLocation = post.element.find('a.answer-hyperlink');
                iconLocation.after(smokeyIcon);
                iconLocation.after(nattyIcon);
                iconLocation.after(reportedIcon);
                iconLocation.after(performedActionIcon);
                showFunc = function (element) { return element.css('display', 'inline-block'); };
            }
            var previousFlag = SimpleCache_1.SimpleCache.GetFromCache("AdvancedFlagging.Flagged." + post.postId);
            if (previousFlag) {
                reportedIcon.attr('title', "Previously flagged as " + previousFlag.ReportType);
                showFunc(reportedIcon);
            }
            var previousAction = SimpleCache_1.SimpleCache.GetFromCache("AdvancedFlagging.PerformedAction." + post.postId);
            if (previousAction && previousAction.ReportType === 'NoFlag') {
                performedActionIcon.attr('title', "Previously performed action: " + previousAction.DisplayName);
                showFunc(performedActionIcon);
            }
        };
        for (var i = 0; i < results.Posts.length; i++) {
            _loop_2(i);
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
        var bottomBox = $('.-copyright, text-right').children('.g-column').children('.-list');
        var optionsDiv = $('<div>').text('AdvancedFlagging Admin');
        bottomBox.after(optionsDiv);
        var optionsList = $('<ul>').css({ 'list-style': 'none' });
        var clearMetaSmokeConfig = $('<a />').text('Clear Metasmoke Configuration');
        clearMetaSmokeConfig.click(function () {
            MetaSmokeAPI_1.MetaSmokeAPI.Reset();
            location.reload();
        });
        optionsDiv.append(optionsList);
        optionsList.append($('<li>').append(clearMetaSmokeConfig));
    }
    $(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    CrossDomainCaching_1.CrossDomainCaching.InitializeCache('https://metasmoke.erwaysoftware.com/xdom_storage.html');
                    return [4 /*yield*/, MetaSmokeAPI_1.MetaSmokeAPI.Setup(metaSmokeKey)];
                case 1:
                    _a.sent();
                    SetupPostPage();
                    SetupAdminTools();
                    SetupStyles();
                    document.body.appendChild(popupWrapper.get(0));
                    return [2 /*return*/];
            }
        });
    }); });
}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ }
/******/ ]);