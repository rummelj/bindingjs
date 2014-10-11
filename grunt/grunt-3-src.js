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
    /*  stage 1: linting  */
    grunt.config.merge({
        newer: {
            "stage1-src": {
                src: [ "src/core/**/*.js", "src/plugin/**/*.js" ],
                dest: "build/stage1/done-jshint-src",
                options: { tasks: [ "jshint:stage1-src", "touch:stage1-src" ] }
            },
            "stage1-test": {
                src: [ "test/**/*.js" ],
                dest: "build/stage1/done-jshint-test",
                options: { tasks: [ "jshint:stage1-test", "touch:stage1-test" ] }
            }
        },
        jshint: {
            "stage1-src": [
                "src/core/**/*.js",
                "src/plugin/*.js"
            ],
            "stage1-test": [
                "test/**/*.js",
                "!test/res/*.js"
            ]
        },
        touch: {
            "stage1-src": {
                src: [ "build/stage1/done-jshint-src" ]
            },
            "stage1-test": {
                src: [ "build/stage1/done-jshint-test" ]
            }
        },
        clean: {
            "stage1-src": [
                "build/stage1/done-jshint-src"
            ],
            "stage1-test": [
                "build/stage1/done-jshint-test"
            ]
        }
    })
    grunt.registerTask("stage1", [
        "newer:stage1-src",
        "newer:stage1-test"
    ])
    grunt.registerTask("stage1-clean", [
        "clean:stage1-src",
        "clean:stage1-test"
    ])

    /*  stage 2: compiling & transpiling  */
    grunt.config.merge({
        newer: {
            "stage2-src": {
                src: [ "src/**/*.js", "!src/umd/*.js" ],
                dest: "build/stage2/src/core/wrapper.js",
                options: { tasks: [ "es6transpiler:stage2-src" ] }
            },
            "stage2-src-peg": {
                src: [ "src/core/dsl/grammar.pegjs" ],
                dest: "build/stage2/src/core/dsl/grammar.js",
                options: { tasks: [ "shell:stage2-src-peg" ] }
            },
            "stage2-src-umd": {
                src: [ "src/umd/*.js" ],
                dest: "build/stage2/src/umd/umd-library-prolog.js",
                options: { tasks: [ "copy:stage2-src-umd" ] }
            },
            "stage2-test": {
                src: [ "test/**/*.js" ],
                dest: "build/stage2/test/common.js",
                options: { tasks: [ "es6transpiler:stage2-test", "copy:stage2-test" ] }
            }
        },
        es6transpiler: {
            options: {
                environments: [ "browser" ],
                disallowVars: false,
                disallowDuplicated: false,
                disallowUnknownReferences: false,
                includePolyfills: false
            },
            "stage2-src": {
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: "src",
                    src: [ "**/*.js", "!umd/*.js" ],
                    dest: "build/stage2/src/"
                }]
            },
            "stage2-test": {
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: "test",
                    src: "**/*.js",
                    dest: "build/stage2/test/"
                }]
            }
        },
        peg: {
            "stage2-src-peg": {
                src:  "src/core/dsl/grammar.pegjs",
                dest: "build/stage2/src/core/dsl/grammar.js",
                options: {
                    exportVar: "module.exports",
                    allowedStartRules: [ "spec", "binding" ],
                    optimize: "speed",
                    cache: true
                }
            }
        },
        shell: {
            "stage2-src-peg": {
                command: "pegjs " +
                    "--export-var module.exports " +
                    "--allowed-start-rules spec,binding " +
                    "--optimize speed " +
                    "--cache " +
                    "src/core/dsl/grammar.pegjs " +
                    "build/stage2/src/core/dsl/grammar.js",
                options: {
                    stdout: true,
                    stderr: true
                }
            }
        },
        copy: {
            "stage2-src-umd": {
                files: [{
                    expand: true,
                    src: [ "src/umd/*.js" ],
                    dest: "build/stage2/",
                    flatten: false
                }]
            },
            "stage2-test": {
                files: [{
                    expand: true,
                    src: [ "test/**/*.bind" ],
                    dest: "build/stage2/",
                    flatten: false
                }]
            }
        },
        clean: {
            "stage2-src": [
                "build/stage2/src"
            ],
            "stage2-test": [
                "build/stage2/test"
            ]
        }
    })
    grunt.registerTask("stage2", [
        "newer:stage2-src",
        "newer:stage2-src-peg",
        "newer:stage2-src-umd",
        "newer:stage2-test"
    ])
    grunt.registerTask("stage2-clean", [
        "clean:stage3-src",
        "clean:stage2-test"
    ])

    /*  stage 3: merge  */
    grunt.config.merge({
        newer: {
            "stage3-src-core": {
                src: [ "build/stage2/src/core/*.js", "build/stage2/src/umd/*.js" ],
                dest: "build/stage3/src/core/binding.js",
                options: { tasks: [ "expand-include:stage3-src-core" ] }
            },
            "stage3-src-plugin": {
                src: [ "build/stage2/src/plugin/**/*.js" ],
                dest: "build/stage3/src/plugin/",
                options: { tasks: [ "expand-include:stage3-src-plugin" ] }
            }
        },
        "expand-include": {
            "stage3-src-core": {
                src: "build/stage2/src/core/wrapper.js",
                dest: "build/stage3/src/core/binding.js",
                options: {
                    directiveSyntax: "js",
                    globalDefines: {
                        major: "<%= version.major %>",
                        minor: "<%= version.minor %>",
                        micro: "<%= version.micro %>",
                        date:  "<%= version.date  %>"
                    }
                }
            },
            "stage3-src-plugin": {
                files: [{
                    expand: true,
                    src: [ "build/stage2/src/plugin/**/*.js" ],
                    dest: "build/stage3/src/plugin/",
                    flatten: true
                }],
                options: {
                    directiveSyntax: "js"
                }
            }
        },
        clean: {
            "stage3-src": [
                "build/stage3/src"
            ]
        }
    })
    grunt.registerTask("stage3", [
        "newer:stage3-src-core",
        "newer:stage3-src-plugin"
    ])
    grunt.registerTask("stage3-clean", [
        "clean:stage3-src"
    ])

    /*  stage 4: minification  */
    grunt.config.merge({
        newer: {
            "stage4": {
                src: [ "build/stage3/src/core/*.js", "build/stage3/src/plugin/**/*.js" ],
                dest: "build/stage4/binding.min.js",
                options: { tasks: [ "uglify:stage4" ] }
            }
        },
        uglify: {
            "stage4": {
                files: [{
                    expand: true,
                    src: [ "build/stage3/**/*.js" ],
                    dest: "build/stage4/",
                    rename: function (dest, src) { return dest + src.replace(/\.js$/, ".min.js") },
                    flatten: true
                }]
            },
            options: {
                preserveComments: "some",
                report: "none"
            }
        },
        clean: {
            "stage4": [
                "build/stage4/src/**/*.min.js"
            ]
        }
    })
    grunt.registerTask("stage4", [
        "newer:stage4"
    ])
    grunt.registerTask("stage4-clean", [
        "clean:stage4"
    ])

    /*  task aliasing  */
    grunt.registerTask("src-build", [
        "stage1",
        "stage2",
        "stage3",
        "stage4"
    ])
    grunt.registerTask("src-clean", [
        "stage1-clean",
        "stage2-clean",
        "stage3-clean",
        "stage4-clean"
    ])
}

