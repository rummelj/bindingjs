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
    /*  coverage testing  */
    grunt.config.merge({
        env: {
            "instrumented": {
                "COVERAGE_INSTRUMENTED": "true"
            }
        },
        instrument: {
            files: [ "bld/binding*.js" ],
            options: {
                lazy: true,
                basePath: "cov/",
                flatten: true
            }
        },
        storeCoverage: {
            options: {
                dir: "cov/report"
            }
        },
        makeReport: {
            src: "cov/report/**/*.json",
            options: {
                type: "lcov",
                dir: "cov/report",
                print: "detail"
            }
        },
        open: {
            "report": {
                path: "cov/report/lcov-report/index.html"
            }
        },
        clean: {
            "cover": [ "cov" ]
        }
    })

    /*  register coverage task  */
    grunt.registerTask("cover", [
        "clean:cover",
        "instrument",
        "env:instrumented",
        "test",
        "storeCoverage",
        "makeReport"
    ])
}

