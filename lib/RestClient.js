'use strict';

/**
 * Defines a client to connect to REST web service.
 *
 * @module openveo-rest-nodejs-client/RestClient
 */

const url = require('url');
const fs = require('fs');
const path = require('path');
const errors = process.requireRestClient('lib/errors/index.js');
const Request = process.requireRestClient('lib/Request.js');
const RequestError = errors.RequestError;
const AuthenticationError = errors.AuthenticationError;

/**
 * Rejects all requests with the given error.
 *
 * If the request is running, it will be aborted.
 *
 * @private
 * @static
 * @memberof module:openveo-rest-nodejs-client/RestClient~RestClient
 * @param {Set} requests The list of requests to reject
 * @param {Error} error The reject's error
 */
function rejectAll(requests, error) {
  for (const request of requests) {
    request.abort();
    request.reject(error);
  }
}

class RestClient {

  /**
   * Creates a client to connect to REST web service.
   *
   * It aims to facilitate implementation of a REST web service client. Requesting an end point, without being
   * authenticated, will automatically execute the *authenticateRequest* first before calling the end point.
   * If token expired, a new authentication is made automatically.
   *
   * You MUST:
   * - Extend this class
   * - Define a *authenticateRequest* property with a Request as a value. This will be automatically called by
   *   the RestClient to get an access token from the server (response from server should contain the property
   *   *access_token* containing the access token which will be stored in RestClient *accessToken* property and used
   *   for all subsequent requests). Use *buildRequest* function to create the authenticate request
   * - Make sure that the web service server returns a property *error_description* set to "Token not found or expired"
   *   if token couln't be retrieved
   * - Make sure that the web service server returns a property *error_description* set to "Token already expired"
   *   if token has expired
   *
   * You MAY:
   * - Override function *getAuthenticationHeaders*. By default the list of headers returned by
   *   *getAuthenticationHeaders* function will be added to all requests sent to the server. One of this header may be
   *   the authentication header for example
   *
   * @class RestClient
   * @constructor
   * @param {String} webServiceUrl The complete URL of the REST web service (with protocol and port)
   * @param {String} [certificate] Absolute path to the web service server full chain certificate file
   * @throws {TypeError} Thrown if webServiceUrl is not a valid String
   */
  constructor(webServiceUrl, certificate) {
    if (!webServiceUrl || typeof webServiceUrl !== 'string')
      throw new TypeError(`Invalid web service url : ${webServiceUrl}`);

    // Parse web service url to get protocol, host and port
    const serverUrl = new url.URL(webServiceUrl);
    const protocol = serverUrl.protocol === 'https:' ? 'https' : 'http';
    const port = parseInt(serverUrl.port) || (protocol === 'http' ? 80 : 443);

    Object.defineProperties(this,

      /** @lends module:openveo-rest-nodejs-client/Request~Request */
      {

        /**
         * Web service protocol, either "http" or "https".
         *
         * @type {String}
         * @readonly
         * @instance
         */
        protocol: {value: protocol, enumerable: true},

        /**
         * Web service server host name.
         *
         * @type {String}
         * @readonly
         * @instance
         */
        hostname: {value: serverUrl.hostname, enumerable: true},

        /**
         * Web service server port.
         *
         * @type {Number}
         * @readonly
         * @instance
         */
        port: {value: port, enumerable: true},

        /**
         * Web service URL path.
         *
         * @type {String}
         * @readonly
         * @instance
         */
        path: {value: serverUrl.pathname, enumerable: true},

        /**
         * Application access token provided by the web service.
         *
         * @type {String}
         * @instance
         */
        accessToken: {value: null, writable: true, enumerable: true},

        /**
         * Path to the web service server certificate file.
         *
         * @type {String}
         * @readonly
         * @instance
         */
        certificate: {value: certificate, enumerable: true},

        /**
         * The collection of queued requests waiting to be executed.
         *
         * @type {Set}
         * @instance
         */
        queuedRequests: {writable: true, value: new Set(), enumerable: true},

        /**
         * Maximum number of authentication attempts to perform on a request in case of an invalid or expired token.
         *
         * @type {Number}
         * @default 1
         * @instance
         */
        maxAuthenticationAttempts: {value: 1, writable: true, enumerable: true}

      }

    );
  }

  /**
   * Executes a GET request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @return {Promise} Promise resolving with result as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  get(endPoint, options, timeout) {
    return this.executeRequest('get', endPoint, options, null, timeout);
  }

  /**
   * Executes a POST request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {(Object|String)} [body] The request body
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @param {Boolean} [multiparted=false] true to send body as multipart/form-data
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  post(endPoint, body, options, timeout, multiparted) {
    return this.executeRequest('post', endPoint, options, body, timeout, multiparted);
  }

  /**
   * Executes a PATCH request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {(Object|String)} [body] The request body
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @param {Boolean} [multiparted=false] true to send body as multipart/form-data
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  patch(endPoint, body, options, timeout, multiparted) {
    return this.executeRequest('patch', endPoint, options, body, timeout, multiparted);
  }

  /**
   * Executes a PUT request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {(Object|String)} [body] The request body
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @param {Boolean} [multiparted=false] true to send body as multipart/form-data
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  put(endPoint, body, options, timeout, multiparted) {
    return this.executeRequest('put', endPoint, options, body, timeout, multiparted);
  }

  /**
   * Executes a DELETE request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  delete(endPoint, options, timeout) {
    return this.executeRequest('delete', endPoint, options, null, timeout);
  }

  /**
   * Executes a REST request after making sure the client is authenticated.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed and request is retried.
   *
   * @async
   * @ignore
   * @param {String} method The HTTP method to use (either get, post, delete or put)
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {(Object|String)} [body] The request body
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @param {Boolean} [multiparted=false] true to send body as multipart/form-data
   * @return {Promise} Promise resolving with request's response
   * @throws {TypeError} Thrown if method or endPoint is not a valid String
   */
  executeRequest(method, endPoint, options, body, timeout, multiparted) {
    return new Promise((resolve, reject) => {
      endPoint = `${this.path}/${endPoint}`.replace(/^\/+/, '');
      options = options || {};

      // Merge options with default options
      options = Object.assign({
        path: `/${endPoint}`,
        method: method.toUpperCase(),
        headers: {}
      }, options);

      // Merge headers with default headers
      options.headers = Object.assign(
        {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        options.headers
      );

      // Remove Content-Type header if multiparted, form-data will generate this header for us
      if (multiparted) delete options.headers['Content-Type'];

      this.queuedRequests.add(this.buildRequest(options, body, timeout, multiparted, resolve, reject));
      this.authenticateAndExecute();
    });
  }

  /**
   * Indicates if the client is authenticated to the web service or not.
   *
   * @ignore
   * @return {Boolean} true if the client is authenticated, false otherwise
   */
  isAuthenticated() {
    return this.accessToken ? true : false;
  }

  /**
   * Gets the list of headers to send with each request.
   *
   * @ignore
   * @return {Object} The list of headers to add to all requests sent to the server
   */
  getRequestHeaders() {
    return {};
  }

  /**
   * Authenticates the client to the web service.
   *
   * @ignore
   * @async
   * @return {Promise} Promise resolving when the client is authenticated, promise is rejected if authentication
   * failed
   */
  authenticate() {
    return new Promise((resolve, reject) => {

      // Already authenticated
      if (this.isAuthenticated())
        resolve();
      else {

        // Not authenticated
        // Authenticate to the web service
        this.authenticateRequest.execute().then((result) => {
          if (result.error)
            reject(new AuthenticationError(result.error_description));
          else if (!result.access_token)
            reject(new AuthenticationError('Invalid token'));
          else {
            this.accessToken = result.access_token;
            resolve();
          }
        }).catch((error) => {
          reject(error);
        });

      }

    });
  }

  /**
   * Authenticates client to the web service and execute all queued requests.
   *
   * @ignore
   */
  authenticateAndExecute() {

    /**
     * Interprets response results to get a human readable error message.
     *
     * @param {Object} result Web service response with an eventually error property and an httpCode property
     * @param {Request} request The request associated to the result
     * @return {String|Null} The error message
     */
    const getErrorMessage = (result, request) => {
      const options = request.options;

      if (result.error || result.httpCode >= 400) {
        if (result.httpCode === 403)
          return `You don't have the authorization to access the endpoint "${options.method} ${options.path}"`;
        else if (result.httpCode === 401)
          return 'Authentication failed, verify your credentials';
        else if (result.httpCode === 404)
          return `Resource ${options.path} not found`;
        else if (result.error) {
          const error = result.error;
          const message = error.message || '';
          return `Error: "${message}" (code=${error.code}, module=${error.module})`;
        } else
          return 'Unkown error';
      }

      return null;
    };

    if (!this.authenticateRequest.isRunning) {

      // Authenticate to the web service
      this.authenticate().then(() => {

        // Client is now authenticated to the web service
        // Execute all queued requests
        this.queuedRequests.forEach((request) => {
          if (request.isRunning || this.authenticateRequest.isRunning) return;

          request.execute(this.getAuthenticationHeaders()).then((result) => {

            // Request done (meaning that transfer worked)

            if (result.error || result.httpCode >= 400) {
              if (result.error_description && (result.error_description === 'Token not found or expired' ||
                                               result.error_description === 'Token already expired')) {

                // Token has expired, authenticate and try again
                // If still on error, after the maximum authentication attempts, reject the request

                this.accessToken = null;

                // Max attempts reached for this request, reject
                if (request.attempts >= this.maxAuthenticationAttempts) {
                  this.queuedRequests.delete(request);
                  request.reject(new RequestError('Max attempts reached', result.httpCode));
                } else {
                  request.attempts++;
                  this.authenticateAndExecute();
                }

              } else {

                // An error has been returned by the web service
                // Reject the request with the error
                this.queuedRequests.delete(request);
                request.reject(new RequestError(getErrorMessage(result, request), result.httpCode));

              }
            } else {

              // Everything went fine
              // Resolve with the results
              this.queuedRequests.delete(request);
              request.resolve(result);

            }
          }).catch((error) => {

            // Request failed
            // Reject the request
            this.queuedRequests.delete(request);
            request.reject(error);

          });
        });
      }).catch((error) => {

        // Authentication failed
        // Reject and abort all queued requests with the same error and clear the queue
        rejectAll(this.queuedRequests, error);
        this.queuedRequests.clear();

      });
    }
  }

  /**
   * Builds a request.
   *
   * @ignore
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {(Object|String)} [body] The request body
   * @param {Number} [timeout=10000] Maximum execution time for the request (in ms), set it to Infinity for a request
   * without limits
   * @param {Boolean} [multiparted=false] true to send body as multipart/form-data
   * @param {Function} resolve The function to call with request's result
   * @param {Function} reject The function to call if request fails
   * @return {Request} The request, ready to be executed
   */
  buildRequest(options, body, timeout, multiparted, resolve, reject) {
    options = Object.assign({
      hostname: this.hostname,
      port: this.port
    }, options);

    // Add web service certificate as a trusted certificate
    if (this.certificate && this.protocol === 'https') {

      /* eslint node/no-sync: 0 */
      options = Object.assign({
        ca: fs.readFileSync(path.normalize(this.certificate))
      }, options);

    }

    const request = new Request(this.protocol, options, body, timeout, multiparted);
    request.resolve = resolve;
    request.reject = reject;
    return request;
  }

  /**
   * Gets the list of headers to send with each request.
   *
   * @return {Object} The list of headers to add to all requests sent to the server
   */
  getAuthenticationHeaders() {
    return {};
  }

}

module.exports = RestClient;
