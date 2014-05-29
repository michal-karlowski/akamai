module.exports = function(grunt) {

  require('time-grunt')(grunt);

  require('jit-grunt')(grunt,  {
    includereplace: 'grunt-include-replace',
    useminPrepare: 'grunt-usemin',
    validation: 'grunt-html-validation',
    replace: 'grunt-text-replace'
  });

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    // Configs
    xh: {
      src: 'src',
      dist: 'dist'
    },

    // HTML Includes
    includereplace: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= xh.src %>',
          src: ['*.html'],
          dest: '<%= xh.dist %>',
          ext: '.html'
        }]
      }
    },

    useminPrepare: {
      html: '<%= xh.dist %>/*.html',
      options: {
        dest: '<%= xh.dist %>',
        root: '<%= xh.src %>',
        flow: {
          steps: {'js': ['concat'], 'css': ['concat'] },
          post: {}
        }
      }
    },

    usemin: {
      html: '<%= xh.dist %>/*.html'
    },

    clean: {
      src: [".tmp"]
    },

    jsbeautifier: {
      options : {
        html: {
          indentSize: 2
        },
        js: {
          indentSize: 2
        }
      },

      html: {
        src: '<%= xh.dist %>/*.html'
      },

      js: {
        src: '<%= xh.dist %>/js/main.js'
      }
    },

    validation: {
      src: ['<%= xh.dist %>/*.html'],
      options: {
        reset: true
      }
    },

    // CSS
    
    sass: {
      dist: {
        options: {
          style: 'expanded',
          sourcemap: true,
          loadPath: 'src/bower_components/'
        },
        files: {
          '<%= xh.dist %>/css/main.css': '<%= xh.src %>/scss/main.scss'
        }
      }
    }, 

    autoprefixer: {
      main: {
        src: '<%= xh.dist %>/css/main.css',
        dest: '<%= xh.dist %>/css/main.css'
      }
    },

    cssbeautifier: {
      files: ['<%= xh.dist %>/css/*.css', '!<%= xh.dist %>/css/libraries.min.css'],
    },

    // JS
    copy: {
      files: {
        cwd: '<%= xh.src %>/js/',
        src: 'main.js',
        dest: '<%= xh.dist %>/js/',
        expand: true
      }
    },

    jshint: {
      options: {
        jshintrc: true,
        force: true
      },
      dist: {
        src: ['<%= xh.src %>/js/main.js', '<%= xh.dist %>/js/main.js'],
      }
    },
    
    uglify: {
      modernizr: {
        files: {
          'src/bower_components/modernizr/modernizr.min.js': ['src/bower_components/modernizr/modernizr.js']
        }
      }
    },

    // Remplacements in main.css and main.js
    replace: {
      css: {
        src: ['<%= xh.dist %>/css/main.css'],
        overwrite: true,
        replacements: [{
          from: '@@timestamp',
          to: '<%= grunt.template.today() %>'
        },
        // Table of contents in main.css
        {
          from: '@@toc',
          to: function () {

            if (!grunt.file.exists('csstoc.json')) {
              return '';
            }

            var toc_file = grunt.file.readJSON('csstoc.json')
            var files = toc_file.results;
            var toc = '';
            var i = 1;
            var match;

            function capitalize(s) {
              return s[0].toUpperCase() + s.slice(1);
            }

            for (var key in files) {
              if (files.hasOwnProperty(key)) {

                var results = files[key];

                for (var key in results) {
                  if (results.hasOwnProperty(key)) {

                    match = results[key]['match'];
                    match = match.replace(/"|'|@import|;|.scss|.less/gi, "").trim();
                    match = match.split('/').pop();
                    match = capitalize(match);

                    if (match !== 'Variables' && match !== 'Mixins') {
                      toc += '\n    ' + i + '. ' + match;
                      i++;
                    }
                  }
                }
              }
            }
            return toc;
          }
        },
        // Add empty line after section & subsection comment
        {
          from: /=== \*\//g,
          to: '=== */\n'
        }
        ]
      },

      js: {
        src: ['<%= xh.dist %>/js/main.js'],
        overwrite: true,
        replacements: [{
          from: '@@timestamp',
          to: '<%= grunt.template.today() %>'
        }]
      },

      xprecise: {
        src: ['<%= xh.src %>/includes/scripts.html'],
        overwrite: true,
        replacements: [{
          from: '<script src="http://cssonsails.org/xprecise/xprecise.min.js"></script>',
          to: ''
        }]
      }
    },

    // Create list of @imports
    search: {
      imports: {
        files: {
            src: ['<%= xh.src %>/scss/main.scss']
        },
        options: {
          searchString: /@import[ \("']*([^;]+)[;\)"']*/g,
          logFormat: "json",
          logFile: "csstoc.json"
        }
      }
    },

    // Watch
    watch: {
      scss: {
        files: ['<%= xh.src %>/scss/*.scss'],
        tasks: ['sass', 'autoprefixer', 'cssbeautifier', 'search', 'replace:css'],
        options: {
          livereload: true
        }
      },

      html: {
        files: ['<%= xh.src %>/*.html', '<%= xh.src %>/includes/*.html'],
        tasks: [
          'includereplace',
          'useminPrepare',
          'concat',
          'usemin',
          'jsbeautifier:html',
          'clean'
        ],
        options: {
          livereload: true
        }
      },

      js: {
        files: '<%= xh.src %>/js/*.js',
        tasks: ['copy', 'jsbeautifier:js', 'replace:js', 'jshint'],
        options: {
          livereload: true
        }
      }
    }

  });

  grunt.registerTask('default', [
    // HTML
    'includereplace',
    'useminPrepare',
    'concat',
    'usemin',
    'jsbeautifier:html',
    'clean',

    // CSS
    
    'sass',
    'autoprefixer',
    'cssbeautifier',

    // JS
    'copy',
    'jsbeautifier:js',

    // Replacements
    'search',
    'replace:css',
    'replace:js',

    // Checks
    'jshint'
  ]);

  grunt.registerTask('validate', [
    'validation'
  ]);

  grunt.registerTask('qa', 'QA Task', function() {
    grunt.task.run(['replace:xprecise', 'default', 'validate', 'jshint']);
  });
};

