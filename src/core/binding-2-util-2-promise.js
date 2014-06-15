/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  utility function: Promises/A+ compliant Promise  */
_api.Promise = (function () {
    let module = { exports: {} };
    /* jshint -W062 */
    /* --- START VERBATIM EMBEDDING ---- */

/*!
**  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
**  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Source-Code distributed on <http://github.com/rse/thenable>
*/

/*  Universal Module Definition (UMD)  */
(function (root, name, factory) {
    /* global define: false */
    /* global module: false */
    if (typeof define === "function" && typeof define.amd !== "undefined")
        /*  AMD environment  */
        define(name, function () { return factory(root); });
    else if (typeof module === "object" && typeof module.exports === "object")
        /*  CommonJS environment  */
        module.exports = factory(root);
    else
        /*  Browser environment  */
        root[name] = (function () {
            var api_orig = root[name];
            var api = factory(root);
            api.noConflict = function () {
                root[name] = api_orig;
                return api;
            };
            return api;
        })();
}(this, "Thenable", function (/* root */) {

    /*  helper functions to reduce (compressed) code size  */
    var isObject = function (v) { return typeof v === "object";   };
    var isFunc   = function (v) { return typeof v === "function"; };

    /*  promise states [Promises/A+ 2.1]  */
    var STATE_PENDING   = 0;                                         /*  [Promises/A+ 2.1.1]  */
    var STATE_FULFILLED = 1;                                         /*  [Promises/A+ 2.1.2]  */
    var STATE_REJECTED  = 2;                                         /*  [Promises/A+ 2.1.3]  */

    /*  promise object constructor  */
    var api = function (executor) {
        /*  optionally support non-constructor/plain-function call  */
        if (!(this instanceof api))
            return new api(executor);

        /*  initialize object  */
        this.id           = "Thenable/1.0.1";
        this.state        = STATE_PENDING; /*  initial state  */
        this.fulfillValue = undefined;     /*  initial value  */     /*  [Promises/A+ 1.3, 2.1.2.2]  */
        this.rejectReason = undefined;     /*  initial reason */     /*  [Promises/A+ 1.5, 2.1.3.2]  */
        this.onFulfilled  = [];            /*  initial handlers  */
        this.onRejected   = [];            /*  initial handlers  */

        /*  optionally support executor function  */
        if (isFunc(executor))
            executor.call(this, this.fulfill.bind(this), this.reject.bind(this));
    };

    /*  promise API methods  */
    api.prototype = {
        /*  promise resolving methods  */
        fulfill: function (value) { return deliver(this, STATE_FULFILLED, "fulfillValue", value); },
        reject:  function (value) { return deliver(this, STATE_REJECTED,  "rejectReason", value); },

        /*  "The then Method" [Promises/A+ 1.1, 1.2, 2.2]  */
        then: function (onFulfilled, onRejected) {
            var curr = this;
            var next = new api();                                    /*  [Promises/A+ 2.2.7]  */
            curr.onFulfilled.push(
                resolver(onFulfilled, next, "fulfill"));             /*  [Promises/A+ 2.2.2/2.2.6]  */
            curr.onRejected.push(
                resolver(onRejected,  next, "reject" ));             /*  [Promises/A+ 2.2.3/2.2.6]  */
            execute(curr);
            return next;                                             /*  [Promises/A+ 2.2.7, 3.3]  */
        },

        /*  optional promise information-hiding proxy generation  */
        proxy: function () {
            return { then: this.then.bind(this) };
        }
    };

    /*  deliver an action  */
    var deliver = function (curr, state, name, value) {
        if (curr.state === STATE_PENDING) {  
            curr.state = state;                                      /*  [Promises/A+ 2.1.2.1, 2.1.3.1]  */
            curr[name] = value;                                      /*  [Promises/A+ 2.1.2.2, 2.1.3.2]  */
            execute(curr);
        }
        return curr;
    };

    /*  execute all handlers  */
    var execute = function (curr) {
        if (curr.state === STATE_FULFILLED)
            execute_handlers(curr, "onFulfilled", curr.fulfillValue);
        else if (curr.state === STATE_REJECTED)
            execute_handlers(curr, "onRejected",  curr.rejectReason);
    };

    /*  execute particular set of handlers  */
    var execute_handlers = function (curr, name, value) {
        /* global process: true */
        /* global setImmediate: true */
        /* global setTimeout: true */
        
        /*  short-circuit processing  */
        if (curr[name].length === 0)
            return;

        /*  iterate over all handlers, exactly once  */
        var handlers = curr[name];
        curr[name] = [];                                             /*  [Promises/A+ 2.2.2.3, 2.2.3.3]  */
        var func = function () {
            for (var i = 0; i < handlers.length; i++)
                handlers[i](value);                                  /*  [Promises/A+ 2.2.5]  */
        };

        /*  execute procedure asynchronously  */                     /*  [Promises/A+ 2.2.4, 3.1]  */
        if (isObject(process) && isFunc(process.nextTick))
            process.nextTick(func);
        else if (isFunc(setImmediate))
            setImmediate(func);
        else
            setTimeout(func, 0);
    };

    /*  generate a resolver function  */
    var resolver = function (cb, next, method) {
        return function (value) {
            if (!isFunc(cb))                                         /*  [Promises/A+ 2.2.1, 2.2.7.3, 2.2.7.4]  */
                next[method].call(next, value);                      /*  [Promises/A+ 2.2.7.3, 2.2.7.4]  */
            else {
                var result;
                try { result = cb(value); }                          /*  [Promises/A+ 2.2.2.1, 2.2.3.1, 2.2.5, 3.2]  */ 
                catch (e) {
                    next.reject(e);                                  /*  [Promises/A+ 2.2.7.2]  */
                    return;
                }
                resolve(next, result);                               /*  [Promises/A+ 2.2.7.1]  */
            }
        };
    };

    /*  "Promise Resolution Procedure"  */                           /*  [Promises/A+ 2.3]  */
    var resolve = function (promise, x) {
        /*  sanity check arguments  */                               /*  [Promises/A+ 2.3.1]  */
        if (promise === x) {
            promise.reject(new TypeError("cannot resolve promise with itself"));
            return;
        }

        /*  surgically check for a "then" method
            (mainly to just call the "getter" of "then" only once)  */
        var then;
        if ((isObject(x) && x !== null) || isFunc(x)) {
            try { then = x.then; }                                   /*  [Promises/A+ 2.3.3.1, 3.5]  */
            catch (e) { 
                promise.reject(e);                                   /*  [Promises/A+ 2.3.3.2]  */
                return;
            }
        }

        /*  handle own eThenables   [Promises/A+ 2.3.2]
            and similar "thenables" [Promises/A+ 2.3.3]  */
        if (isFunc(then)) {
            var resolved = false;
            try {
                /*  call retrieved "then" method */                  /*  [Promises/A+ 2.3.3.3]  */
                then.call(x,
                    /*  resolvePromise  */                           /*  [Promises/A+ 2.3.3.3.1]  */
                    function (y) { 
                        if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
                        if (y === x)                                 /*  [Promises/A+ 3.6]  */
                            promise.reject(new TypeError("circular thenable chain"));  
                        else
                            resolve(promise, y);
                    },

                    /*  rejectPromise  */                            /*  [Promises/A+ 2.3.3.3.2]  */
                    function (r) { 
                        if (resolved) return; resolved = true;       /*  [Promises/A+ 2.3.3.3.3]  */
                        promise.reject(r);
                    }
                );
            }
            catch (e) {
                if (!resolved)                                       /*  [Promises/A+ 2.3.3.3.3]  */
                    promise.reject(e);                               /*  [Promises/A+ 2.3.3.3.4]  */
            }
            return;
        }

        /*  handle other values  */                               
        promise.fulfill(x);                                          /*  [Promises/A+ 2.3.4, 2.3.3.4]  */
    };

    /*  export API  */
    return api;
}));

    /* --- END VERBATIM EMBEDDING ---- */
    return module.exports;
})()

