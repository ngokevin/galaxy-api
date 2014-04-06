var url = require('url');
var redis = require('redis');

function redisClient(urlString) {
    var redisURL = url.parse(urlString || '');
    var client = redis.createClient(redisURL.port, redisURL.hostname);
    if (redisURL.auth) {
        client.auth(redisURL.auth.split(':')[1]);
    }
    return client;
}
exports.client = redisClient;
