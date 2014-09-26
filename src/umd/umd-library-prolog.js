/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
//TODO: Evaluate, In what ways the library can be used outside a browser
/*  Universal Module Definition (UMD) for Library  */
(function (root, name, factory) {
    /* global define: false */
    /* global module: false */
    var export_type = root[name.replace(/[^a-zA-Z0-9_]/g, "_") + "_export"];
    if (   (   typeof define === "function"
            && typeof define.amd !== "undefined"
            && typeof export_type === "undefined")
        || (   typeof export_type !== "undefined"
            && export_type === "AMD"             ))
        /*  AMD environment  */
        define(name, function () {
            return factory(root);
        });
    else if (
           (   typeof module === "object"
            && typeof module.exports === "object"
            && typeof export_type === "undefined")
        || (   typeof export_type !== "undefined"
            && export_type === "CommonJS"        ))
        /*  CommonJS environment  */
        module.exports = factory(root);
    else {
        /*  Browser environment  */
        var api = factory(root);
        api.symbol = (function () {
            var symbol_name = null;
            var symbol_value;
            return function (symbol) {
                if (symbol_name !== null) {
                    root[symbol_name] = symbol_value;
                    symbol_name = null;
                }
                if (arguments.length === 1) {
                    symbol_name = symbol;
                    symbol_value = root[symbol_name];
                    root[symbol_name] = api;
                }
                return api;
            };
        })();
        api.symbol(name);
    }
}(/* global global: false */
  (typeof global !== "undefined" ? global : 
  /* global window: false */
  (typeof window !== "undefined" ? window : this)), "BindingJS", function (root) {
    /*  define internal and external API  */
    var _api = {};
    var $api = {};
