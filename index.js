'use strict';

/**
 * Exposes a list of modules used to create an OpenVeo REST client.
 *
 * @module openveo-rest-nodejs-client
 * @property {module:openveo-rest-nodejs-client/OpenVeoClient} OpenVeoClient OpenVeoClient module
 * @property {module:openveo-rest-nodejs-client/Request} Request Request module
 * @property {module:openveo-rest-nodejs-client/RestClient} RestClient RestClient module
 */

require('./processRequire.js');

module.exports.OpenVeoClient = process.requireRestClient('lib/OpenVeoClient.js');
module.exports.Request = process.requireRestClient('lib/Request.js');
module.exports.RestClient = process.requireRestClient('lib/RestClient.js');
