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
    /*  task defaults  */
    grunt.config.merge({
        jshint: {
            options: {
                jshintrc: "grunt/lint-1-jshint.json"
            }
        },
        eslint: {
            options: {
                config: "grunt/lint-2-eslint.json"
            }
        },
        shell: {
            options: {
                stdout: true,
                stderr: true
            }
        }
    })
}

