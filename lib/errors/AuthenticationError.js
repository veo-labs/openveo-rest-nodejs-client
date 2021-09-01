'use strict';

/**
 * @module openveo-rest-nodejs-client/errors/AuthenticationError
 * @ignore
 */

const errors = process.requireRestClient('lib/errors/index.js');
const RequestError = errors.RequestError;

class AuthenticationError extends RequestError {

  /**
   * Creates an authentication request error.
   *
   * Authentication errors are thrown when client failed to authenticate to the web service.
   *
   * @class AuthenticationError
   * @ignore
   * @extends module:openveo-rest-nodejs-client/errors/RequestError~RequestError
   * @constructor
   * @param {String} message The error message
   */
  constructor(message) {
    super(message, 401);
  }

}

module.exports = AuthenticationError;
