YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "AuthenticationError",
        "OpenVeoClient",
        "Request",
        "RequestError"
    ],
    "modules": [
        "errors",
        "rest-client"
    ],
    "allModules": [
        {
            "displayName": "errors",
            "name": "errors",
            "description": "All REST-nodejs-client specific errors."
        },
        {
            "displayName": "rest-client",
            "name": "rest-client",
            "description": "REST client for OpenVeo web service.\n\nIt aims to facilitate the interaction with OpenVeo web service. All authentication aspects are managed by the\nclient and are transparent to the user. Requesting an end point, without being authenticated will automatically\nauthenticate first before calling the end point. If token expired, a new authentication is made automatically."
        }
    ],
    "elements": []
} };
});