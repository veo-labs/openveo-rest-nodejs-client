'use strict';

const url = require('url');
const fs = require('fs');
const path = require('path');

/**
 * OpenVeo REST client for OpenVeo web service.
 *
 * @module rest-client
 * @main rest-client
 * @class OpenVeoClient
 */
class OpenVeoClient {

  /**
   * Creates a client to connect to OpenVeo web service.
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
   * @constructor
   * @param {String} webServiceUrl The complete url of the OpenVeo web service (with protocol and port)
   * @param {String} clientId Application client id to authenticate
   * @param {String} clientSecret Application client secret to authenticate
   * @param {String} [certificate] Path to the web service server trusted certificate
   */
  constructor(webServiceUrl, clientId, clientSecret, certificate) {
    if (!webServiceUrl || typeof webServiceUrl !== 'string')
      throw new Error(`Invalid web service url : ${webServiceUrl}`);

    if (!clientId || typeof clientId !== 'string')
      throw new Error(`Invalid web service client id : ${clientId}`);

    if (!clientSecret || typeof clientSecret !== 'string')
      throw new Error(`Invalid web service client secret : ${clientSecret}`);

    // Parse web service url to get protocol, host and port
    const urlChunks = url.parse(webServiceUrl);
    const protocol = urlChunks.protocol === 'https:' ? 'https' : 'http';
    const port = urlChunks.port || (protocol === 'http' ? 80 : 443);
    const serverUrl = url.format({
      protocol,
      port,
      hostname: urlChunks.hostname
    });

    Object.defineProperties(this, {

      /**
       * Web service protocol, either "http" or "https".
       *
       * @property prototol
       * @type String
       */
      protocol: {value: protocol},

      /**
       * Web service server host name.
       *
       * @property hostname
       * @type String
       */
      hostname: {value: urlChunks.hostname},

      /**
       * Web service server port.
       *
       * @property port
       * @type String
       */
      port: {value: port},

      /**
       * Web service server url.
       *
       * @property url
       * @type String
       */
      url: {value: serverUrl},

      /**
       * Application client id.
       *
       * @property clientId
       * @type String
       */
      clientId: {value: clientId},

      /**
       * Application client secret.
       *
       * @property clientSecret
       * @type String
       */
      clientSecret: {value: clientSecret},

      /**
       * Encoded credentials ready for OAuth authentication.
       *
       * @property credentials
       * @type String
       */
      credentials: {value: new Buffer(`${clientId}:${clientSecret}`).toString('base64')},

      /**
       * Application access token provided by the web service.
       *
       * @property accessToken
       * @type String
       */
      accessToken: {writable: true},

      /**
       * Path to the web service server certificate.
       *
       * @property certificate
       * @type String
       */
      certificate: {value: certificate}

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
   * @param {String} [body] The request body
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @return {Promise} Promise resolving with results as an Object
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
   * @param {Object} [options] The list of http(s) options as described by NodeJS http.request documentation
   * @param {String} [body] The request body
   * @return {Promise} Promise resolving with results as an Object
   */
  put(endPoint, options) {
    return this.executeRequest('put', endPoint, options);
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
   * @param {String} [body] The request body
   * @return {Promise} Promise resolving with request's response
   */
  executeRequest(method, endPoint, options, body) {
    const self = this;

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

      /**
       * Authenticates and executes the request.
       *
       * @return {Promise} Promise resolving with request's response
       */
      const authenticateAndExecute = () => {

        // Authenticate to the web service
        return self.authenticate().then(() => {

          // Add new access token to request options
          Object.assign(options.headers, {
            Authorization: `Bearer ${self.accessToken}`
          });

          // Execute request
          return self.execute(options, body);
        });

      };

      /**
       * Interprets response results to get a human readable error message.
       *
       * @param {Object} result Web service response with an eventually error property and an httpCode property
       * @return {String|Null} The error message
       */
      const getErrorMessage = (result) => {
        if (result.error) {
          if (result.httpCode === 403)
            return `You don't have the authorization to access the endpoint "${options.path}"`;
          else if (result.httpCode === 401)
            return 'Authentication failed, verify your credentials';
          else if (result.error.message) {
            const error = result.error;
            return `Server error : "${error.message}" (code=${error.code}, module=${error.module})`;
          } else
            return 'Unkown server error';
        }

        return null;
      };

      // Authenticate and execute the request
      authenticateAndExecute().then((result) => {
        if (result.error) {
          if (result.error_description && (result.error_description === 'Token not found or expired' ||
                                           result.error_description === 'Token already expired')) {
            self.accessToken = null;

            // Token has expired, authenticate and try again
            // If still on error reject the promise
            authenticateAndExecute().then((result) => {
              if (result.error)
                reject(new Error(getErrorMessage(result)));
              else
                resolve(result);
            }).catch((error) => {
              reject(error);
            });
          } else
            reject(new Error(getErrorMessage(result)));
        } else
          resolve(result);
      }).catch((error) => {
        reject(error);
      });

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
   * @return {Promise} Promise resolving when the client is authenticated
   */
  authenticate() {
    const self = this;

    return new Promise((resolve, reject) => {

      // Already authenticated
      if (this.isAuthenticated())
        return resolve();
      else {

        // Not authenticated
        // Request web service to get an access token
        this.execute({
          path: '/token',
          method: 'POST',
          headers: {
            Authorization: `Basic ${this.credentials}`,
            'Content-Type': 'application/json'
          }
        }, JSON.stringify({grant_type: 'client_credentials'})).then((result) => {
          if (result.error)
            return reject(new Error(result.error_description));
          else if (!result.access_token)
            return reject(new Error('Invalid token'));
          else {
            self.accessToken = result.access_token;
            resolve();
          }
        }).catch((error) => {
          reject(error);
        });
      }
    });
  }

  /**
   * Executes a request.
   *
   * @private
   * @async
   * @method execute
   * @param {Object} [options] The complete list of http(s) options as described by NodeJS http.request
   * documentation
   * @param {String} [body] The request body
   * @return {Promise} Promise resolving with request's response as an Object
   */
  execute(options, body) {
    if (!options || (options && typeof options !== 'object'))
      throw new Error('Invalid request options');

    Object.assign(options, {
      hostname: this.hostname,
      port: this.port
    });

    // Add web service certificate as a trusted certificate
    if (this.certificate && this.protocol === 'https') {
      Object.assign(options, {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        ca: fs.readFileSync(path.normalize(this.certificate))
      });
    }

    return new Promise((resolve, reject) => {

      // Send request to web service
      const request = require(this.protocol).request(options, (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('error', (error) => reject(error));
        response.on('data', (chunk) => body += chunk);
        response.on('end', () => {
          try {
            const result = JSON.parse(body);
            result.httpCode = response.statusCode;
            resolve(result);
          } catch (error) {
            reject('Server error, response is not valid JSON');
          }
        });
      });

      request.on('error', (error) => reject(error));
      request.setTimeout(10000, () => {
        request.abort();
        reject('Server unavaible');
      });

      if (body)
        request.write(body);

      request.end();
    });
  }

}

module.exports = OpenVeoClient;
