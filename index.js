'use strict';

require('./processRequire.js');

module.exports.OpenVeoClient = process.requireRestClient('lib/OpenVeoClient.js');
module.exports.RestClient = process.requireRestClient('lib/RestClient.js');
