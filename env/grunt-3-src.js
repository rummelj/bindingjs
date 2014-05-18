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
                src: [ "src/core/*.js", "src/plugin/*.js" ],
                dest: "bld/stage1/done-jshint-src",
                options: { tasks: [ "jshint:stage1-src", "touch:stage1-src" ] }
            },
            "stage1-tst": {
                src: [ "tst/**/*.js" ],
                dest: "bld/stage1/done-jshint-tst",
                options: { tasks: [ "jshint:stage1-tst", "touch:stage1-tst" ] }
            }
        },
        jshint: {
            "stage1-src": [
                "src/core/*.js",
                "src/plugin/*.js"
            ],
            "stage1-tst": [
                "tst/**/*.js"
            ]
        },
        touch: {
            "stage1-src": {
                src: [ "bld/stage1/done-jshint-src" ]
            },
            "stage1-tst": {
                src: [ "bld/stage1/done-jshint-tst" ]
            }
        },
        clean: {
            "stage1-src": [
                "bld/stage1/done-jshint-src"
            ],
            "stage1-tst": [
                "bld/stage1/done-jshint-tst"
            ]
        }
    });
    grunt.registerTask("stage1", [
        "newer:stage1-src",
        "newer:stage1-tst"
    ]);
    grunt.registerTask("stage1-clean", [
        "clean:stage1-src",
        "clean:stage1-tst"
    ]);

    /*  stage 2: compiling & transpiling  */
    grunt.config.merge({
        newer: {
            "stage2-src": {
                src: [ "src/**/*.js", "!src/umd/*.js" ],
                dest: "bld/stage2/src/core/binding.js",
                options: { tasks: [ "es6transpiler:stage2-src" ] }
            },
            "stage2-src-peg": {
                src: [ "src/core/binding-3-dsl-2-grammar.pegjs" ],
                dest: "bld/stage2/src/core/binding-3-dsl-2-grammar.js",
                options: { tasks: [ "shell:stage2-src-peg" ] }
            },
            "stage2-src-umd": {
                src: [ "src/umd/*.js" ],
                dest: "bld/stage2/src/umd/umd-library-prolog.js",
                options: { tasks: [ "copy:stage2-src-umd" ] }
            },
            "stage2-tst": {
                src: [ "tst/**/*.js" ],
                dest: "bld/stage2/tst/common.js",
                options: { tasks: [ "es6transpiler:stage2-tst" ] }
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
                    dest: "bld/stage2/src/"
                }]
            },
            "stage2-tst": {
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: "tst",
                    src: "**/*.js",
                    dest: "bld/stage2/tst/"
                }]
            }
        },
        peg: {
            "stage2-src-peg": {
                src:  "src/core/binding-3-dsl-2-grammar.pegjs",
                dest: "bld/stage2/src/core/binding-3-dsl-2-grammar.js",
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
                    "src/core/binding-3-dsl-2-grammar.pegjs " +
                    "bld/stage2/src/core/binding-3-dsl-2-grammar.js",
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
                    dest: "bld/stage2/",
                    flatten: false
                }]
            }
        },
        clean: {
            "stage2-src": [
                "bld/stage2/src"
            ],
            "stage2-tst": [
                "bld/stage2/tst"
            ]
        }
    });
    grunt.registerTask("stage2", [
        "newer:stage2-src",
        "newer:stage2-src-peg",
        "newer:stage2-src-umd",
        "newer:stage2-tst"
    ]);
    grunt.registerTask("stage2-clean", [
        "clean:stage3-src",
        "clean:stage2-tst"
    ]);

    /*  stage 3: merge  */
    grunt.config.merge({
        newer: {
            "stage3-src-core": {
                src: [ "bld/stage2/src/core/*.js", "bld/stage2/src/umd/*.js" ],
                dest: "bld/stage3/src/core/binding.js",
                options: { tasks: [ "expand-include:stage3-src-core" ] }
            },
            "stage3-src-plugin": {
                src: [ "bld/stage2/src/plugin/*.js" ],
                dest: "bld/stage3/src/plugin/binding.plugin.componentjs.js",
                options: { tasks: [ "expand-include:stage3-src-plugin" ] }
            }
        },
        "expand-include": {
            "stage3-src-core": {
                src: "bld/stage2/src/core/binding.js",
                dest: "bld/stage3/src/core/binding.js",
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
                    src: [ "bld/stage2/src/plugin/*.js" ],
                    dest: "bld/stage3/src/plugin/",
                    flatten: true
                }],
                options: {
                    directiveSyntax: "js"
                }
            }
        },
        clean: {
            "stage3-src": [
                "bld/stage3/src"
            ]
        }
    });
    grunt.registerTask("stage3", [
        "newer:stage3-src-core",
        "newer:stage3-src-plugin"
    ]);
    grunt.registerTask("stage3-clean", [
        "clean:stage3-src"
    ]);

    /*  stage 4: minification  */
    grunt.config.merge({
        newer: {
            "stage4": {
                src: [ "bld/stage3/src/core/*.js", "bld/stage3/src/plugin/*.js" ],
                dest: "bld/stage4/binding.min.js",
                options: { tasks: [ "jshint:stage4", "uglify:stage4" ] }
            }
        },
        jshint: {
            "stage4": [
                "bld/stage3/src/**/*.js"
            ]
        },
        uglify: {
            "stage4": {
                files: [{
                    expand: true,
                    src: [ "bld/stage3/**/*.js" ],
                    dest: "bld/stage4/",
                    rename: function (dest, src) { return dest + src.replace(/\.js$/, ".min.js"); },
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
                "bld/stage4/src/**/*.min.js"
            ]
        }
    });
    grunt.registerTask("stage4", [
        "newer:stage4"
    ]);
    grunt.registerTask("stage4-clean", [
        "clean:stage4"
    ]);

    /*  task aliasing  */
    grunt.registerTask("src-build", [
        "stage1",
        "stage2",
        "stage3",
        "stage4"
    ]);
    grunt.registerTask("src-clean", [
        "stage1-clean",
        "stage2-clean",
        "stage3-clean",
        "stage4-clean"
    ]);
};

