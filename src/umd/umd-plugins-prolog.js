/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  Universal Module Definition (UMD) for Plugin  */
(function (root, nameLibrary, namePlugin, nameDeps, factory) {
    /* global define:false */
    /* global require:false */
    /* global module:false */
    var export_type = root[namePlugin.replace(/[^a-zA-Z0-9_]/g, "_") + "_export"];
    var make_name = function (namePlugin) { return nameLibrary + "-" + namePlugin; };
    var deps = [ nameLibrary ].concat(nameDeps !== "" ? nameDeps.split(",").map(make_name) : []);
    if (   (   typeof define === "function"
            && typeof define.amd !== "undefined"
            && typeof export_type === "undefined")
        || (   typeof export_type !== "undefined"
            && export_type === "AMD"             )) {
        /*  AMD environment  */
        define(make_name(namePlugin), deps, function (api) {
            return api.plugin(namePlugin, factory);
        });
    }
    else if (
           (   typeof module === "object"
            && typeof module.exports === "object"
            && typeof export_type === "undefined")
        || (   typeof export_type !== "undefined"
            && export_type === "CommonJS"        )) {
        /*  CommonJS environment  */
        var load = function (name) {
            var m;
            try { m = require("./" + name); }
            catch (e) { if (e.code === "MODULE_NOT_FOUND") m = require(name); }
            return m;
        };
        deps.map(load);
        module.exports = load(nameLibrary).plugin(namePlugin, factory);
    }
    else {
        /*  Browser environment  */
        root[nameLibrary].plugin(namePlugin, factory);
    }
}(this, "$library", "$plugin", "$deps", function (/* jshint unused: false */ _api, $api, root) {

