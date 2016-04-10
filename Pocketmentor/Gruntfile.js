module.exports = function (grunt) {
    // Loading Plugin
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-lint-pattern',
        'grunt-contrib-less',
        'grunt-contrib-cssmin',
        'grunt-contrib-watch',
        'grunt-nodemon',
        'grunt-concurrent'
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // Plugin Settings
    grunt.initConfig({
        cafemocha: {
            all: { src: 'qa/tests-*.js', options: { ui: 'tdd' } }
        },
        jshint: {
            app: ['app.js', 'public/js/**/*.js', 'lib/**/*.js'],
            qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js']
        },
        nodemon: {
            dev: {
                script: 'app.js'
            }
        },
        less: {
            development: {
                options: {
                    paths: ["css"],
                    customFunctions: {
                        static: function (lessObject, name) {
                            return 'url("' +
								require('./lib/static.js').map(name.value) +
								'")';
                        }
                    }
                },
                files: {
                    "css/app.css": "less/app.less",
                },
                cleancss: true
            }
        },
        cssmin: {
            options: {
                keepSpecialComments: 0
            },
            target: {
                files: {
                    'css/app.min.css': ['css/app.css']
                }
            }
        },
        watch: {
            scripts: {
                files: ['*/*.js'],
                tasks: ['jshint'],
                options: {
                    spawn: false,
                },
            },
            styles: {
                files: ['css/**/*.css'], // which files to watch
                tasks: ['cssmin'],
                options: {
                    spawn: false,
                },
            }
        },
        concurrent: {
            options: {
                logConcurrentOutput: true
            },
            tasks: ['nodemon', 'watch']
        },
        lint_pattern: {
            view_statics: {
                options: {
                    rules: [
                        {
                            pattern: /<link [^>]*href=["'](?!\{\{static )/,
                            message: 'Un-mapped static resource found in <link>.'
                        },
                        {
                            pattern: /<script [^>]*src=["'](?!\{\{static )/,
                            message: 'Un-mapped static resource found in <script>.'
                        },
                        {
                            pattern: /<img [^>]*src=["'](?!\{\{static )/,
                            message: 'Un-mapped static resource found in <img>.'
                        },
                    ]
                },
                files: {
                    src: ['views/**\/*.hbs']
                }
            },
            css_statics: {
                options: {
                    rules: [
                        {
                            pattern: /url\(/,
                            message: 'Un-mapped static found in Stylus property.'
                        },
                    ]
                },
                files: {
                    src: [
                        'public/css/**/*.less'
                    ]
                }
            }
        }
    });

    // Working Register
    grunt.registerTask('default', ['cafemocha', 'jshint', 'cssmin', 'concurrent']);
};