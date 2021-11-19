# 5.0.1 / 2021-11-19

## BUG FIXES

- Fix NPM postpublish script

# 5.0.0 / 2021-11-19

## BREAKING CHANGES

- No longer tested on NodeJS &lt; 16.3.0 and NPM &lt; 7.15.1

## NEW FEATURES

- Improve code documentation by replacing Yuidoc by JSDoc

## BUG FIXES

- Fix error when retrying a request due to an expired token

## DEPENDENCIES

- **form-data** has been upgraded from 3.0.0 to **4.0.0**
- **grunt** has been removed
- **grunt-cli** has been removed
- **grunt-eslint** has been removed
- **grunt-gh-pages** has been replaced by @openveo/api ovDeployGithubPages script
- **yuidoc** has been replaced by **JSDoc**

# 4.0.0 / 2020-05-04

## BREAKING CHANGES

- Drop support for NodeJS &lt; 12.4.0 and NPM &lt; 6.9.0

## DEPENDENCIES

- **form-data** has been upgraded from 2.3.2 to **3.0.0**
- **grunt** has been upgraded from 1.0.1 to **1.1.0**
- **grunt-cli** has been upgraded from 1.2.0 to **1.3.2**
- **grunt-contrib-yuidoc** sub dependencies have been upgraded
- **grunt-eslint** has been upgraded from 19.0.0 to **22.0.0**
- **grunt-gh-pages** has been upgraded from 2.0.0 to **3.1.0**
- **pre-commit** sub dependencies have been upgraded

# 3.1.0 / 2018-10-16

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
