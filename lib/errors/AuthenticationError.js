'use strict';

const errors = process.requireRestClient('lib/errors/index.js');
const RequestError = errors.RequestError;

/**
 * Defines an AuthenticationError.
 *
 * Authentication errors are thrown when client failed to authenticate to the web service.
 *
 * @class AuthenticationError
 * @module errors
 * @extends RequestError
 */
class AuthenticationError extends RequestError {

  /**
   * Creates an authentication request error.
   *
   * @constructor
   * @param {String} message The error message
   */
  constructor(message) {
    super(message, 401);
  }

}

module.exports = AuthenticationError;
