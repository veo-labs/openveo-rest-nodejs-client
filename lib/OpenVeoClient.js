'use strict';

/**
 * Defines a client to connect to OpenVeo web service.
 *
 * @module rest-client
 * @main rest-client
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
 * @param {Set} requests The list of requests to reject
 * @param {Error} error The reject's error
 */
function rejectAll(requests, error) {
  for (const request of requests) {
    request.abort();
    request.reject(error);
  }
}

class OpenVeoClient {

  /**
   * Creates a client to connect to OpenVeo web service.
   *
   * It aims to facilitate the interaction with OpenVeo web service. All authentication aspects are managed by the
   * client and are transparent to the user. Requesting an end point, without being authenticated, will automatically
   * authenticate first before calling the end point. If token expired, a new authentication is made automatically.
   *
   * @example
   *
   *     const OpenVeoClient = require('@openveo/rest-nodejs-client').OpenVeoClient;
   *     const client = new OpenVeoClient(
   *                 'https://www.openveo-web-service:443',
   *                 'client id',
   *                 'client secret',
   *                 '/home/test/server.crt'
   *     );
   *
   * @class OpenVeoClient
   * @constructor
   * @param {String} webServiceUrl The complete url of the OpenVeo Web Service (with protocol and port)
   * @param {String} clientId Application's client id
   * @param {String} clientSecret Application's client
   * @param {String} [certificate] Path to the Web Service server trusted certificate file
   * @throws {TypeError} Thrown if webServiceUrl, clientId or clientSecret is not a valid String
   */
  constructor(webServiceUrl, clientId, clientSecret, certificate) {
    if (!webServiceUrl || typeof webServiceUrl !== 'string')
      throw new TypeError(`Invalid web service url : ${webServiceUrl}`);

    if (!clientId || typeof clientId !== 'string')
      throw new TypeError(`Invalid client id : ${clientId}`);

    if (!clientSecret || typeof clientSecret !== 'string')
      throw new TypeError(`Invalid client secret : ${clientSecret}`);

    // Parse web service url to get protocol, host and port
    const urlChunks = url.parse(webServiceUrl);
    const protocol = urlChunks.protocol === 'https:' ? 'https' : 'http';
    const port = parseInt(urlChunks.port) || (protocol === 'http' ? 80 : 443);
    const serverUrl = url.format({
      protocol,
      port,
      hostname: urlChunks.hostname
    });

    Object.defineProperties(this, {

      /**
       * Web service protocol, either "http" or "https".
       *
       * @property protocol
       * @type String
       * @final
       */
      protocol: {value: protocol},

      /**
       * Web service server host name.
       *
       * @property hostname
       * @type String
       * @final
       */
      hostname: {value: urlChunks.hostname},

      /**
       * Web service server port.
       *
       * @property port
       * @type Number
       * @final
       */
      port: {value: port},

      /**
       * Web service server url.
       *
       * @property url
       * @type String
       * @final
       */
      url: {value: serverUrl},

      /**
       * Application client id.
       *
       * @property clientId
       * @type String
       * @final
       */
      clientId: {value: clientId},

      /**
       * Application client secret.
       *
       * @property clientSecret
       * @type String
       * @final
       */
      clientSecret: {value: clientSecret},

      /**
       * Encoded credentials ready for OAuth authentication.
       *
       * @property credentials
       * @type String
       * @final
       */
      credentials: {value: Buffer.from(`${clientId}:${clientSecret}`).toString('base64')},

      /**
       * Application access token provided by the web service.
       *
       * @property accessToken
       * @type String
       */
      accessToken: {value: null, writable: true},

      /**
       * Path to the web service server certificate file.
       *
       * @property certificate
       * @type String
       * @final
       */
      certificate: {value: certificate},

      /**
       * The collection of queued requests waiting to be executed.
       *
       * @property queuedRequests
       * @type Set
       */
      queuedRequests: {writable: true, value: new Set()},

      /**
       * Maximum number of authentication attempts to perform on a request in case of an invalid or expired token.
       *
       * @property maxAuthenticationAttempts
       * @type Number
       * @default 1
       */
      maxAuthenticationAttempts: {value: 1, writable: true}

    });

    /**
     * The authenticate request to get an access token.
     *
     * @property authenticateRequest
     * @type Request
     * @final
     */
    Object.defineProperty(this, 'authenticateRequest', {
      value: this.buildRequest({
        path: '/token',
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.credentials}`,
          'Content-Type': 'application/json'
        }
      }, {grant_type: 'client_credentials'})
    });
  }

  /**
   * Executes a GET request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @method get
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @return {Promise} Promise resolving with result as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  get(endPoint, options) {
    return this.executeRequest('get', endPoint, options);
  }

  /**
   * Executes a POST request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @method post
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object|String} [body] The request body
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  post(endPoint, body, options) {
    return this.executeRequest('post', endPoint, options, body);
  }

  /**
   * Executes a PUT request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @method put
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object|String} [body] The request body
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  put(endPoint, body, options) {
    return this.executeRequest('put', endPoint, options, body);
  }

  /**
   * Executes a DELETE request.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed.
   *
   * @async
   * @method delete
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @return {Promise} Promise resolving with results as an Object
   * @throws {TypeError} Thrown if endPoint is not valid a String
   */
  delete(endPoint, options) {
    return this.executeRequest('delete', endPoint, options);
  }

  /**
   * Executes a REST request after making sure the client is authenticated.
   *
   * If client is not authenticated or access token has expired, a new authentication is automatically
   * performed and request is retried.
   *
   * @method executeRequest
   * @async
   * @private
   * @param {String} method The HTTP method to use (either get, post, delete or put)
   * @param {String} endPoint The web service end point to reach with query parameters
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Object|String} [body] The request body
   * @return {Promise} Promise resolving with request's response
   * @throws {TypeError} Thrown if method or endPoint is not a valid String
   */
  executeRequest(method, endPoint, options, body) {
    return new Promise((resolve, reject) => {
      endPoint = endPoint.replace(/^\/+/, '');
      options = options || {};

      // Merge options
      Object.assign(options, {
        path: `/${endPoint}`,
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      });

      this.queuedRequests.add(this.buildRequest(options, body, resolve, reject));
      this.authenticateAndExecute();
    });
  }

  /**
   * Indicates if the client is authenticated to the web service or not.
   *
   * @private
   * @method isAuthenticated
   * @return {Boolean} true if the client is authenticated, false otherwise
   */
  isAuthenticated() {
    return this.accessToken ? true : false;
  }

  /**
   * Authenticates the client to the web service.
   *
   * @private
   * @async
   * @method authenticate
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

      if (result.error) {
        if (result.httpCode === 403)
          return `You don't have the authorization to access the endpoint "${options.method} ${options.path}"`;
        else if (result.httpCode === 401)
          return 'Authentication failed, verify your credentials';
        else if (result.httpCode === 404)
          return `Resource ${options.path} not found`;
        else if (result.error.message) {
          const error = result.error;
          return `Server error : "${error.message}" (code=${error.code}, module=${error.module})`;
        } else
          return 'Unkown server error';
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

          request.execute({
            Authorization: `Bearer ${this.accessToken}`
          }).then((result) => {

            // Request done (meaning that transfer worked)

            if (result.error) {
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
   * @private
   * @method buildRequest
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {Object|String} [body] The request body
   * @param {Function} resolve The function to call with request's result
   * @param {Function} reject The function to call if request fails
   * @return {Request} The request, ready to be executed
   */
  buildRequest(options, body, resolve, reject) {
    Object.assign(options, {
      hostname: this.hostname,
      port: this.port
    });

    // Add web service certificate as a trusted certificate
    if (this.certificate && this.protocol === 'https') {

      /* eslint no-sync: 0 */
      Object.assign(options, {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        ca: fs.readFileSync(path.normalize(this.certificate))
      });

    }

    const request = new Request(this.protocol, options, body);
    request.resolve = resolve;
    request.reject = reject;
    return request;
  }

}

module.exports = OpenVeoClient;
