/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  utility function: Promises/A+ compliant Promise  */
_api.util.Promise = (function () {
    let module = { exports: {} };
    /* jshint -W062 */
    /* --- START VERBATIM EMBEDDING ---- */

/*!
**  Thenable -- Embeddable Minimum Strictly-Compliant Promises/A+ 1.1.1 Thenable
**  Copyright (c) 2013-2014 Ralf S. Engelschall <http://engelschall.com>
**  Licensed under The MIT License <http://opensource.org/licenses/MIT>
**  Source-Code distributed on <http://github.com/rse/thenable>
*/
!function(a,b,c){"function"==typeof define&&"undefined"!=typeof define.amd?define(b,function(){return c(a)}):"object"==typeof module&&"object"==typeof module.exports?module.exports=c(a):a[b]=function(){var d=a[b],e=c(a);return e.noConflict=function(){return a[b]=d,e},e}()}(this,"Thenable",function(){var a=0,b=1,c=2,d=function(b){return this instanceof d?(this.id="Thenable/1.0.3",this.state=a,this.fulfillValue=void 0,this.rejectReason=void 0,this.onFulfilled=[],this.onRejected=[],void("function"==typeof b&&b.call(this,this.fulfill.bind(this),this.reject.bind(this)))):new d(b)};d.prototype={fulfill:function(a){return e(this,b,"fulfillValue",a)},reject:function(a){return e(this,c,"rejectReason",a)},then:function(a,b){var c=this,e=new d;return c.onFulfilled.push(h(a,e,"fulfill")),c.onRejected.push(h(b,e,"reject")),f(c),e},proxy:function(){return{then:this.then.bind(this)}}};var e=function(b,c,d,e){return b.state===a&&(b.state=c,b[d]=e,f(b)),b},f=function(a){a.state===b?g(a,"onFulfilled",a.fulfillValue):a.state===c&&g(a,"onRejected",a.rejectReason)},g=function(a,b,c){if(0!==a[b].length){var d=a[b];a[b]=[];var e=function(){for(var a=0;a<d.length;a++)d[a](c)};"object"==typeof process&&"function"==typeof process.nextTick?process.nextTick(e):"function"==typeof setImmediate?setImmediate(e):setTimeout(e,0)}},h=function(a,b,c){return function(d){if("function"!=typeof a)b[c].call(b,d);else{var e;try{e=a(d)}catch(f){return void b.reject(f)}i(b,e)}}},i=function(a,b){if(a===b)return void a.reject(new TypeError("cannot resolve promise with itself"));var c;if("object"==typeof b&&null!==b||"function"==typeof b)try{c=b.then}catch(d){return void a.reject(d)}if("function"!=typeof c)a.fulfill(b);else{var e=!1;try{c.call(b,function(c){e||(e=!0,c===b?a.reject(new TypeError("circular thenable chain")):i(a,c))},function(b){e||(e=!0,a.reject(b))})}catch(d){e||a.reject(d)}}};return d});

    /* --- END VERBATIM EMBEDDING ---- */
    return module.exports;
})()

