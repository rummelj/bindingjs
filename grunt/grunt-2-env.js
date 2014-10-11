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
            "grunt": [ "Gruntfile.js", "grunt/*.js" ]
        },
        eslint: {
            "grunt": [ "Gruntfile.js", "grunt/*.js" ]
        },
        jsonlint: {
            "grunt": {
                src: [
                    "package.json",
                    "grunt/lint-1-jshint.json",
                    "grunt/lint-2-eslint.json"
                ]
            }
        },
        mkdir: {
            "grunt": {
                options: {
                    create: [
                        "bld/stage1",
                        "bld/stage2",
                        "bld/stage3",
                        "bld/stage4"
                    ]
                }
            }
        },
        clean: {
            "grunt": [ "bld", "cov" ]
        }
    })

    /*  common task aliasing  */
    grunt.registerTask("grunt-build", [
        "jshint:grunt",
        "eslint:grunt",
        "jsonlint:grunt",
        "mkdir:grunt"
    ])
    grunt.registerTask("grunt-clean", [
        "clean:grunt"
    ])
}

