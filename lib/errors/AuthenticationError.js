'use strict';

/**
 * @module rest-client
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
   * @extends RequestError
   * @constructor
   * @param {String} message The error message
   */
  constructor(message) {
    super(message, 401);
  }

}

module.exports = AuthenticationError;
