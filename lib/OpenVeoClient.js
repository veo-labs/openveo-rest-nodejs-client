'use strict';

/**
 * Defines a client to connect to OpenVeo web service.
 *
 * @module openveo-rest-nodejs-client/OpenVeoClient
 */

const RestClient = process.requireRestClient('lib/RestClient.js');

class OpenVeoClient extends RestClient {

  /**
   * Creates a client to connect to OpenVeo web service.
   *
   * It aims to facilitate the interaction with OpenVeo web service. All authentication aspects are managed by the
   * client and are transparent to the user. Requesting an end point, without being authenticated, will automatically
   * authenticate first before calling the end point. If token expired, a new authentication is made automatically.
   *
   * @example
   * const OpenVeoClient = require('@openveo/rest-nodejs-client').OpenVeoClient;
   * const client = new OpenVeoClient(
   *   'https://www.openveo-web-service:443',
   *   'client id',
   *   'client secret',
   *   '/absolute/path/to/fullchain/certificate.crt'
   * );
   *
   * @class OpenVeoClient
   * @extends module:openveo-rest-nodejs-client/RestClient~RestClient
   * @constructor
   * @param {String} webServiceUrl The complete URL of the OpenVeo Web Service (with protocol and port)
   * @param {String} clientId Application's client id
   * @param {String} clientSecret Application's client secret
   * @param {String} [certificate] Absolute path to the web service server full chain certificate file
   * @throws {TypeError} Thrown if webServiceUrl, clientId or clientSecret is not a valid String
   */
  constructor(webServiceUrl, clientId, clientSecret, certificate) {
    super(webServiceUrl, certificate);

    if (!clientId || typeof clientId !== 'string')
      throw new TypeError(`Invalid client id : ${clientId}`);

    if (!clientSecret || typeof clientSecret !== 'string')
      throw new TypeError(`Invalid client secret : ${clientSecret}`);

    Object.defineProperties(this,

      /** @lends module:openveo-rest-nodejs-client/OpenVeoClient~OpenVeoClient */
      {

        /**
         * Application client id.
         *
         * @type {String}
         * @instance
         * @readonly
         */
        clientId: {value: clientId},

        /**
         * Application client secret.
         *
         * @type {String}
         * @instance
         * @readonly
         */
        clientSecret: {value: clientSecret},

        /**
         * Encoded credentials ready for OAuth authentication.
         *
         * @type {String}
         * @instance
         * @readonly
         */
        credentials: {value: Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}

      }

    );

    /**
     * The authenticate request to get an access token.
     *
     * @name authenticateRequest
     * @type {module:openveo-rest-nodejs-client/Request~Request}
     * @memberof module:openveo-rest-nodejs-client/OpenVeoClient~OpenVeoClient
     * @readonly
     * @instance
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
   * Gets the list of headers to send with each request.
   *
   * @return {Object} The list of headers to add to all requests sent to the server
   */
  getAuthenticationHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`
    };
  }

}

module.exports = OpenVeoClient;
