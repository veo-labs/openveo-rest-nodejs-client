# 3.1.0 / YYYY-MM-DD

## NEW FEATURES

- Headers set by the RestClient can now be overriden for each request
- Add more control on request timeouts. A specific timeout can be set on each request instead of the default one (10 seconds), timeout can also be deactivated using Infinity value
- Add multipart/form-data support for post(), patch() and put() requests

## BUG FIXES

- Fix the "Unknown error" message when the error is identified. Message now includes the OpenVeo error code and concerned module name, when known

# 3.0.0 / 2018-06-15

## BREAKING CHANGES

- Drop support for Node.js &lt;8.9.4
- Drop support for NPM &lt;5.6.0

## NEW FEATURES

- require('@openveo/rest-nodejs-client').RestClient can now be used to implement a REST client without taking care of queue and requests processing

## BUG FIXES

- Empty body response from web service no longer reject the promise
- Requests responding with an HTTP code greater than or equal to 400, are now treated as errors even if no *error* property is present in the response

# 2.0.0 / 2017-05-04

## BREAKING CHANGES

- Drop support for Node.js &lt;7.4.0
- Drop support for NPM &lt;4.0.5

## DEPENDENCIES

- **grunt** has been updated from 0.4.5 to **1.0.1**
- **grunt-eslint** has been updated from 18.1.0 to **19.0.0**
- **grunt-gh-pages** has been updated from 1.1.0 to **2.0.0**
- **pre-commit** has been updated from 1.1.2 to **1.2.2**
- **grunt-extend-config** has been removed

# 1.0.0 / 2016-05-30

First stable version of OpenVeo Rest Node JS client for OpenVeo Web Service.
