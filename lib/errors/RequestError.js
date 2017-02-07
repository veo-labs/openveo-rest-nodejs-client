'use strict';

/**
 * @module rest-client
 */

class RequestError extends Error {

  /**
   * Creates a request error with a message and http code.
   *
   * Request errors are thrown when a request to the Web Service failed.
   *
   * @class RequestError
   * @extends Error
   * @constructor
   * @param {String} message The error message
   * @param {Number} httpCode The HTTP error code
   */
  constructor(message, httpCode) {
    super(message);

    Object.defineProperties(this, {

      /**
       * The HTTP error code associated to this error.
       *
       * @property httpCode
       * @type Number
       * @final
       */
      httpCode: {value: httpCode}

    });
  }

}

module.exports = RequestError;
