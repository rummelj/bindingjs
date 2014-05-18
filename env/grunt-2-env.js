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
    /*  build environment  */
    grunt.config.merge({
        jshint: {
            "env": [ "Gruntfile.js", "env/*.js" ]
        },
        eslint: {
            "env": [ "Gruntfile.js", "env/*.js" ]
        },
        jsonlint: {
            "env": {
                src: [
                    "package.json",
                    "env/lint-1-jshint.json",
                    "env/lint-2-eslint.json"
                ]
            }
        },
        mkdir: {
            "env": {
                options: {
                    create: [
                        "bld/stage1",
                        "bld/stage2",
                        "bld/stage3",
                        "bld/stage4",
                        "bld/stage5"
                    ]
                }
            }
        },
        clean: {
            "env": [ "bld", "cov" ]
        }
    });

    /*  common task aliasing  */
    grunt.registerTask("env-build", [
        "jshint:env",
        "eslint:env",
        "jsonlint:env",
        "mkdir:env"
    ]);
    grunt.registerTask("env-clean", [
        "clean:env"
    ]);
};

