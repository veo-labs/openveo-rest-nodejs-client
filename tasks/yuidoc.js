'use strict';

// Generate yuidoc
// For more information about Grunt yuidoc, have a look at https://www.npmjs.com/package/grunt-contrib-yuidoc
module.exports = {

  // Generate library API
  api: {
    name: 'OpenVeo REST NodeJS client API',
    description: 'OpenVeo REST NodeJS client API to interact with OpenVeo web service',
    version: '<%= pkg.version %>',
    options: {
      paths: '<%= project.lib %>',
      outdir: '<%= project.site %>/<%= pkg.version %>',
      linkNatives: true,
      themedir: 'node_modules/yuidoc-theme-blue'
    }
  }

};
