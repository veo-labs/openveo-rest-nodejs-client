'use strict';

var path = require('path');

module.exports = {
  root: path.join(__dirname, '..'),
  site: '<%= project.root %>/site',
  lib: '<%= project.root %>/lib'
};
