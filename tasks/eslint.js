'use strict';

// Eslint validation
// For more information about Grunt ESLint, have a look at https://www.npmjs.com/package/grunt-eslint
module.exports = {

  // Validate the whole project
  validate: {
    src: [
      'Gruntfile.js',
      'index.js',
      'tasks/**/*.js',
      'tests/**/*.js',
      'lib/**/*.js'
    ]
  }

};
