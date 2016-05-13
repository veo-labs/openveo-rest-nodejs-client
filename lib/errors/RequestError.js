'use strict';

/**
 * Defines a RequestError.
 *
 * Request errors are thrown when a request to the Web Service failed.
 *
 * @class RequestError
 * @module errors
 * @extends Error
 */
class RequestError extends Error {

  /**
   * Creates a request error with a message and http code.
   *
   * @constructor
   * @param {String} message The error message
   * @param {Number} httpCode The HTTP error code
   */
  constructor(message, httpCode) {
    super(message);
    this.httpCode = httpCode;
  }

}

module.exports = RequestError;
