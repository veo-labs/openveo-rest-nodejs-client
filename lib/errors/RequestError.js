'use strict';

/**
 * @module openveo-rest-nodejs-client/errors/RequestError
 * @ignore
 */

class RequestError extends Error {

  /**
   * Creates a request error with a message and http code.
   *
   * Request errors are thrown when a request to the Web Service failed.
   *
   * @class RequestError
   * @ignore
   * @extends Error
   * @constructor
   * @param {String} message The error message
   * @param {Number} httpCode The HTTP error code
   */
  constructor(message, httpCode) {
    super(message);
    Error.captureStackTrace(this, this.constructor);

    Object.defineProperties(this,

      /** @lends module:openveo-rest-nodejs-client/RequestError~RequestError */
      {

        /**
         * The HTTP error code associated to this error.
         *
         * @type {Number}
         * @readonly
         * @instance
         */
        httpCode: {value: httpCode},

        /**
         * Error message.
         *
         * @type {String}
         * @instance
         */
        message: {value: message, writable: true},

        /**
         * Error name.
         *
         * @type {String}
         * @instance
         */
        name: {value: 'RequestError', writable: true}

      }

    );
  }

}

module.exports = RequestError;
