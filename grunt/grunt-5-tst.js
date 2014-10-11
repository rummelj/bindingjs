/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/* global module: true */
module.exports = function (grunt) {
    /*  unit testing  */
    grunt.config.merge({
        mochaTest: {
            "core": {
                src: [ "build/stage2/test/core/**/*.js" ]
            },
            options: {
                reporter: "spec",
                require: "build/stage2/test/common.js",
                clearRequireCache: true,
                timeout: 86400000
            }
        }
    })

    /*  register testing task  */
    grunt.registerTask("test", [
        "mochaTest:core"
    ])
}

