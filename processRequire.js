'use strict';

var path = require('path');

// Set module's root directory and define a requireRestClient method to load scripts from project's root directory
// instead of using relative paths
process.rootRestClient = __dirname;
process.requireRestClient = filePath => require(path.join(process.rootRestClient, filePath));
