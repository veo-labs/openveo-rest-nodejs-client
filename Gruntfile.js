'use strict';

/* eslint no-sync: 0 */
require('./processRequire.js');
const fs = require('fs');

/**
 * Loads a bunch of grunt configuration files from the given directory.
 *
 * Loaded configurations can be referenced using the configuration file name.
 * For example, if myConf.js returns an object with a property "test", it will be accessible using myConf.test.
 *
 * @param {String} path Path of the directory containing configuration files
 * @return {Object} The list of configurations indexed by filename without the extension
 */
function loadConfig(path) {
  const configuration = {};
  const configurationFiles = fs.readdirSync(path);

  for (const configurationFile of configurationFiles)
    configuration[configurationFile.replace(/\.js$/, '')] = require(`${path}/${configurationFile}`);

  return configuration;
}

/**
 * Initializes grunt, load extensions and register tasks.
 */
module.exports = (grunt) => {
  const config = {
    pkg: grunt.file.readJSON('package.json'),
    env: process.env
  };

  grunt.initConfig(config);

  // Load tasks definitions
  grunt.config.merge(loadConfig('./tasks'));

  // Load grunt extensions
  grunt.loadNpmTasks('grunt-contrib-yuidoc');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-eslint');

  // Generate documentation
  grunt.registerTask('doc', ['yuidoc']);

  // Deploy documentation to github pages
  grunt.registerTask('deploy-doc', ['doc', 'gh-pages:doc']);

};
