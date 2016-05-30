'use strict';

// Deploy directory to github pages.
// For more information about Grunt gh-pages, have a look at https://www.npmjs.com/package/grunt-gh-pages
module.exports = {

  // Deploy project's API
  doc: {
    options: {
      base: '<%= project.site %>',
      message: 'Auto-generated documentation for version <%= pkg.version %>',
      push: true,
      add: true
    },
    src: '**/*'
  }

};
