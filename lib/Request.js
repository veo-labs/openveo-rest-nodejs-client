'use strict';

/**
 * @module rest-client
 */

const timers = require('timers');

class Request {

  /**
   * Creates a REST request which can be executed / aborted.
   *
   * @class Request
   * @constructor
   * @param {String} protocol The protocol to use for the request (either 'http' or 'https')
   * @param {Object} [options] The complete list of http(s) options as described by NodeJS http.request
   * documentation. More headers can be added when executing the request.
   * @param {String|Object} [body] The request body
   * @throws {TypeError} Thrown if protocol is not valid or options is not a valid object
   */
  constructor(protocol, options, body) {
    if (!options || (options && typeof options !== 'object'))
      throw new TypeError('Invalid request options');

    if (!protocol || typeof protocol !== 'string')
      throw new TypeError('Invalid protocol');

    if (body && typeof body !== 'string')
      body = JSON.stringify(body);

    Object.defineProperties(this, {

      /**
       * Request protocol either "http" or "https".
       *
       * @property protocol
       * @type String
       * @final
       */
      protocol: {value: protocol},

      /**
       * Request options.
       *
       * @property options
       * @type Object
       * @final
       */
      options: {value: options},

      /**
       * The request body.
       *
       * @property body
       * @type String
       * @final
       */
      body: {value: body},

      /**
       * The HTTP(S) request.
       *
       * @property request
       * @type ClientRequest
       */
      request: {writable: true},

      /**
       * Maximum execution time for the request (in ms).
       *
       * @property executionTimeout
       * @type Number
       * @default 10000
       */
      executionTimeout: {value: 10000, writable: true},

      /**
       * Maximum time to wait until the request is aborted (in ms).
       *
       * @property abortTimeout
       * @type Number
       * @default 2000
       */
      abortTimeout: {value: 2000, writable: true},

      /**
       * Indicates if request is actually running.
       *
       * @property isRunning
       * @type Boolean
       * @default false
       */
      isRunning: {value: false, writable: true},

      /**
       * The number of attempts made on this request.
       *
       * @property attempts
       * @type Number
       * @default 0
       */
      attempts: {value: 0, writable: true}

    });
  }

  /**
   * Executes the request.
   *
   * Be careful, if request is executed while still running, the running one will be aborted.
   *
   * @async
   * @method execute
   * @param {Object} [headers] A list of http(s) headers. Headers will be merged with Request headers set in
   * the constructor
   * @return {Promise} Promise resolving with request's response as an Object, all request's responses are
   * considered success, promise is rejected only if an error occured during the transfer or while parsing the
   * reponse's body (expected JSON)
   * @throws {TypeError} Thrown if options is not a valid object
   */
  execute(headers) {
    if (headers && typeof headers !== 'object')
      throw new TypeError('Invalid request options');

    this.isRunning = true;
    this.options.headers = Object.assign(headers || {}, this.options.headers);

    return this.abort().then(() => {
      return new Promise((resolve, reject) => {
        this.isRunning = true;

        // Send request to the web service
        this.request = require(this.protocol).request(this.options, (response) => {
          let body = '';

          response.setEncoding('utf8');
          response.on('error', (error) => {
            this.isRunning = false;
            return reject(error);
          });
          response.on('data', (chunk) => body += chunk);
          response.on('end', () => {
            this.isRunning = false;

            try {
              const result = body ? JSON.parse(body) : {};
              result.httpCode = response.statusCode;
              resolve(result);
            } catch (error) {
              reject(new Error('Server error, response is not valid JSON'));
            }
          });
        });

        this.request.on('error', (error) => {
          this.isRunning = false;
          return reject(error);
        });
        this.request.setTimeout(this.executionTimeout, () => {
          this.abort().then(() => {
            reject(new Error('Server unavaible'));
          }).catch(() => {
            reject(new Error('Request can\'t be aborted'));
          });
        });

        if (this.body)
          this.request.write(this.body);

        this.request.end();
      });

    });
  }

  /**
   * Aborts the request.
   *
   * @async
   * @method abort
   * @return {Promise} Promise resolving when request has been aborted, promise is rejected if it takes too long
   * to abort the request
   */
  abort() {
    return new Promise((resolve, reject) => {
      if (this.request && this.isRunning) {
        const timeoutReference = timers.setTimeout(() => {
          reject('Request couldn\'t be aborted');
        }, this.abortTimeout);

        this.request.on('abort', () => {
          this.isRunning = false;
          timers.clearTimeout(timeoutReference);
          resolve();
        });

        this.request.abort();
      } else
        resolve();
    });
  }

}

module.exports = Request;
