'use strict';

/**
 * @module openveo-rest-nodejs-client/Request
 */

const timers = require('timers');
const FormData = require('form-data');

class Request {

  /**
   * Creates a REST request which can be executed / aborted.
   *
   * @class Request
   * @constructor
   * @param {String} protocol The protocol to use for the request (either 'http' or 'https')
   * @param {Object} [options] The complete list of http(s) options as described by NodeJS http.request
   * documentation. More headers can be added when executing the request.
   * @param {(String|Object)} [body] The request body
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @param {Boolean} [multiparted=false] true to send body as multipart/form-data
   * @throws {TypeError} Thrown if protocol is not valid or options is not a valid object
   */
  constructor(protocol, options, body, timeout, multiparted) {
    if (!options || (options && typeof options !== 'object'))
      throw new TypeError('Invalid request options');

    if (!protocol || typeof protocol !== 'string')
      throw new TypeError('Invalid protocol');

    if (body && typeof body !== 'string' && !multiparted)
      body = JSON.stringify(body);

    Object.defineProperties(this,

      /** @lends module:openveo-rest-nodejs-client/Request~Request */
      {

        /**
         * Request protocol either "http" or "https".
         *
         * @type {String}
         * @instance
         * @readonly
         */
        protocol: {value: protocol},

        /**
         * Request options.
         *
         * @type {Object}
         * @instance
         * @readonly
         */
        options: {value: options},

        /**
         * The request body.
         *
         * @type {String}
         * @instance
         * @readonly
         */
        body: {value: body},

        /**
         * The HTTP(S) request.
         *
         * @type {Object}
         * @see {@link https://nodejs.org/dist/latest-v16.x/docs/api/http.html#http_class_http_clientrequest}
         * @instance
         */
        request: {writable: true},

        /**
         * Maximum execution time for the request (in ms).
         *
         * @type {Number}
         * @default 10000
         * @instance
         */
        executionTimeout: {value: (timeout || 10000), writable: true},

        /**
         * Maximum time to wait until the request is aborted (in ms).
         *
         * @type {Number}
         * @default 2000
         * @instance
         */
        abortTimeout: {value: 2000, writable: true},

        /**
         * Indicates if request is actually running.
         *
         * @type {Boolean}
         * @default false
         * @instance
         */
        isRunning: {value: false, writable: true},

        /**
         * The number of attempts made on this request.
         *
         * @type {Number}
         * @default 0
         * @instance
         */
        attempts: {value: 0, writable: true},

        /**
         * Indicates if request body must be sent as multipart/form-data.
         *
         * @type {Boolean}
         * @default false
         * @instance
         */
        multiparted: {value: multiparted, writable: true}

      }

    );
  }

  /**
   * Executes the request.
   *
   * Be careful, if request is executed while still running, the running one will be aborted.
   *
   * @async
   * @param {Object} [headers] A list of http(s) headers. Headers will be merged with Request headers set in
   * the constructor. It takes priority over Request headers.
   * @return {Promise} Promise resolving with request's response as an Object, all request's responses are
   * considered success, promise is rejected only if an error occured during the transfer or while parsing the
   * reponse's body (expected JSON)
   * @throws {TypeError} Thrown if options is not a valid object
   */
  execute(headers) {
    if (headers && typeof headers !== 'object')
      throw new TypeError('Invalid request options');

    let form;
    this.isRunning = true;
    this.options.headers = Object.assign(this.options.headers, headers || {});

    if (this.multiparted) {

      // Request body should be sent as multipart/form-data, use form-data module to achieve this
      form = new FormData();
      this.options.headers = form.getHeaders(this.options.headers);

    }

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

        if (this.executionTimeout !== Infinity) {
          this.request.setTimeout(this.executionTimeout, () => {
            this.abort().then(() => {
              reject(new Error('Server unavaible'));
            }).catch(() => {
              reject(new Error('Request can\'t be aborted'));
            });
          });
        }

        if (this.body) {
          if (!this.multiparted) {

            // Request body should be sent as is
            this.request.write(this.body);
            return this.request.end();

          }

          // Request body should be sent as multipart/form-data
          for (const fieldName in this.body) {
            form.append(fieldName, this.body[fieldName]);
          }

          form.pipe(this.request);
        } else
          this.request.end();

      });

    });
  }

  /**
   * Aborts the request.
   *
   * @async
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
