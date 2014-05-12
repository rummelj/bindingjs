/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  Universal Module Definition (UMD) for Plugin  */
(function (root, name_library, name_plugin, name_deps, factory) {
    /* global define:false */
    /* global require:false */
    /* global module:false */
    var export_type = root[name_plugin.replace(/[^a-zA-Z0-9_]/g, "_") + "_export"];
    var make_name = function (name_plugin) { return name_library + "-" + name_plugin; };
    var deps = [ name_library ].concat(name_deps !== "" ? name_deps.split(",").map(make_name) : []);
    if (   (   typeof define === "function"
            && typeof define.amd !== "undefined"
            && typeof export_type === "undefined")
        || (   typeof export_type !== "undefined"
            && export_type === "AMD"             )) {
        /*  AMD environment  */
        define(make_name(name_plugin), deps, function (api) {
            return api.plugin(name_plugin, factory);
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
        module.exports = load(name_library).plugin(name_plugin, factory);
    }
    else {
        /*  Browser environment  */
        root[name_library].plugin(name_plugin, factory);
    }
}(this, "$library", "$plugin", "$deps", function (root, _api, $api) {

