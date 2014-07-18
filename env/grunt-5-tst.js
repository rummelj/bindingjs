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
                src: [ "bld/stage2/tst/core/**/*.js" ]
            },
            "integration": {
                src: [ "bld/stage2/tst/integration/testrunner.js" ]
            },
            options: {
                reporter: "spec",
                require: "bld/stage2/tst/common.js",
                clearRequireCache: true,
                timeout: 86400000
            }
        }
    })

    /*  register testing task  */
    grunt.registerTask("test", [
        "mochaTest:core",
        "mochaTest:integration"
    ])
}

