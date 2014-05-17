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
    /*  build core parser  */
    grunt.config.merge({
        newer: {
            "src-core-parser": {
                src: [ "src/core/binding-3-dsl-2-grammar.pegjs" ],
                dest: "src/core/binding-3-dsl-2-grammar.js",
                options: { tasks: [ "shell:src-core-parser" ] }
            }
        },
        peg: {
            "src-core-parser": {
                src:  "src/core/binding-3-dsl-2-grammar.pegjs",
                dest: "src/core/binding-3-dsl-2-grammar.js",
                options: {
                    exportVar: "module.exports",
                    allowedStartRules: [ "spec", "binding" ],
                    optimize: "speed",
                    cache: true
                }
            }
        },
        shell: {
            "src-core-parser": {
                command: "pegjs " +
                    "--export-var module.exports " +
                    "--allowed-start-rules spec,binding " +
                    "--optimize speed " +
                    "--cache " +
                    "src/core/binding-3-dsl-2-grammar.pegjs " +
                    "src/core/binding-3-dsl-2-grammar.js",
                options: {
                    stdout: true,
                    stderr: true
                }
            }
        },
        clean: {
            "src-core-parser": [
                "src/binding-3-dsl-2-grammar.js"
            ]
        }
    });

    /*  build core  */
    grunt.config.merge({
        newer: {
            "src-core": {
                src: [ "src/core/*.js", "src/umd/*.js" ],
                dest: "bld/binding.js",
                options: { tasks: [ "expand-include:src-core" ] }
            }
        },
        "expand-include": {
            "src-core": {
                src: "src/core/binding.js",
                dest: "bld/binding.js",
                options: {
                    directiveSyntax: "js",
                    globalDefines: {
                        major: "<%= version.major %>",
                        minor: "<%= version.minor %>",
                        micro: "<%= version.micro %>",
                        date:  "<%= version.date  %>"
                    }
                }
            }
        },
        clean: {
            "src-core": [
                "bld/binding.js"
            ]
        }
    });

    /*  build plugins (others)  */
    grunt.config.merge({
        newer: {
            "src-plugin": {
                src: [ "src/plugin/*.js" ],
                dest: "bld/binding.plugin.FIXME.js",
                options: { tasks: [ "copy:src-plugin" ] }
            }
        },
        copy: {
            "src-plugin": {
                files: [{
                    expand: true,
                    src: [ "src/plugin/binding.plugin.*.js" ],
                    dest: "bld",
                    flatten: true
                }]
            }
        },
        clean: {
            "src-plugin": [
                "bld/binding.plugin.*.js"
            ]
        }
    });

    /*  linting (JSHint)  */
    grunt.config.merge({
        newer: {
            "src-jshint": {
                src: [ "bld/binding.js", "bld/binding.*.js", "!bld/binding.*.min.js" ],
                dest: "bld/.done-src-jshint",
                options: { tasks: [ "jshint:src", "touch:src-jshint-done" ] }
            },
            "src-eslint": {
                src: [ "bld/binding.js", "bld/binding.*.js", "!bld/binding.*.min.js" ],
                dest: "bld/.done-src-eslint",
                options: { tasks: [ "eslint:src", "touch:src-eslint-done" ] }
            }
        },
        jshint: {
            "src": [ "bld/*.js", "!bld/*.min.js" ]
        },
        eslint: {
            "src": {
                src: [ "bld/*.js", "!bld/*.min.js" ]
            }
        },
        touch: {
            "src-jshint-done": {
                src: [ "bld/.done-src-jshint" ]
            },
            "src-eslint-done": {
                src: [ "bld/.done-src-eslint" ]
            }
        },
        clean: {
            "src-jshint": [
                "bld/.done-src-jshint"
            ],
            "src-eslint": [
                "bld/.done-src-eslint"
            ]
        }
    });

    /*  minification (UglifyJS)  */
    grunt.config.merge({
        newer: {
            "src-min": {
                src: [ "bld/binding.js", "bld/binding.*.js", "!bld/binding.*.min.js" ],
                dest: "bld/binding.min.js",
                options: { tasks: [ "uglify:src-min" ] }
            }
        },
        uglify: {
            "src-min": {
                files: [{
                    expand: true,
                    src: [ "bld/*.js", "!bld/*.min.js" ],
                    dest: "bld/",
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
            "src-min": [
                "bld/binding*.min.js"
            ]
        }
    });

    /*  task aliasing  */
    grunt.registerTask("src-build", [
        "newer:src-core-parser",
        "newer:src-core",
        "newer:src-plugin",
        "newer:src-jshint",
        "newer:src-eslint",
        "newer:src-min"
    ]);
    grunt.registerTask("src-clean", [
        "clean:src-core-parser",
        "clean:src-core",
        "clean:src-plugin",
        "clean:src-jshint",
        "clean:src-eslint",
        "clean:src-min"
    ]);
};

