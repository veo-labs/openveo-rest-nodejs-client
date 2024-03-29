# OpenVeo REST NodeJS Client

OpenVeo REST NodeJS client to interact with [OpenVeo](https://github.com/veo-labs/openveo-core) Web Service.

# Documentation

## Installation

Install the latest version with:

    npm install @openveo/rest-nodejs-client

## Usage

```js
'use strict';

const url = require('url');
const OpenVeoClient = require('@openveo/rest-nodejs-client').OpenVeoClient;

const OPENVEO_URL = 'OpenVeo web service url with port';
const CLIENT_ID = 'Your application client id generated by OpenVeo';
const CLIENT_SECRET = 'Your application client secret generated by OpenVeo';

const client = new OpenVeoClient(OPENVEO_URL, CLIENT_ID, CLIENT_SECRET);

// Example to get the list of videos exposed by OpenVeo publish plugin
client.get('publish/videos?page=1&limit=10').then((result) => {
  console.log(result);
}).catch((error) => {
  console.log(error);
});
```

# API

Documentation is available on [Github pages](https://veo-labs.github.io/openveo-rest-nodejs-client/5.0.1/index.html).

# Contributors

Maintainer: [Veo-Labs](http://www.veo-labs.com/)

# License

[AGPL](http://www.gnu.org/licenses/agpl-3.0.en.html)
