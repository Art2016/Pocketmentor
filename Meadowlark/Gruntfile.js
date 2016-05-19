module.exports = function (grunt) {
    // Loading Plugin
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        /*'grunt-exec',*/
        'grunt-lint-pattern'
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // Plugin Settings
    grunt.initConfig({
        cafemocha: {
            all: { src: 'qa/tests-*.js', options: { ui: 'tdd' } }
        },
        jshint: {
            app: ['app.js', 'public/javascripts/**/*.js', 'lib/**/*.js', 'routes/**/*.js'],
            qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js']
        },
        /*exec: {
            linkchecker: {
                cmd: 'linckchecker http://localhost:3000'
            }
        },*/
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
                    src: ['views/**/*.handlebars']
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
                        'public/stylesheets/**/*.styl'
                    ]
                }
            }
        }
    });

    // Working Register
    grunt.registerTask('default', ['cafemocha', 'jshint',/*'exec',*/'lint_pattern']);
};