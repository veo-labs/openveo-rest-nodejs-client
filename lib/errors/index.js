'use strict';

/**
 * Exposes a list of custom error types.
 *
 * @module openveo-rest-nodejs-client/errors
 * @ignore
 * @property {module:openveo-rest-nodejs-client/errors/RequestError} RequestError RequestError module
 * @property {module:openveo-rest-nodejs-client/errors/AuthenticationError} AuthenticationError AuthenticationError
 * module
 */

module.exports.RequestError = process.requireRestClient('lib/errors/RequestError.js');
module.exports.AuthenticationError = process.requireRestClient('lib/errors/AuthenticationError.js');
