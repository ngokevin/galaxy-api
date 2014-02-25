var settings = require('./settings_local.js');

var db = require('./db');
var serverHTTP = require('./server_http');
var serverWS = require('./server_ws');

var auth = require('./lib/auth');
var user = require('./lib/user');


[
    'game/board',
    'game/detail',
    'game/genre',
    'game/list',
    'game/moderate',
    'game/submit',
    'user/acl',
    'user/friends',
    'user/login',
    'user/purchase',
    'user/profile',
    'user/search'
].forEach(function(view) {
    require('./views/' + view)(serverHTTP);
});

var serverName = serverHTTP.name;

serverHTTP.listen(process.env.PORT || 5000, function() {
    console.log('%s HTTP server listening at %s', serverName, serverHTTP.url);
    if (process.env.DB_PREFILL) {
        var client = db.redis();
        client.publish('galaxy-db-prefill:api', 'ready', function() {
            client.end();
        });
    }
});

serverWS.listen(function(url) {
    console.log('%s WebSocket server listening at %s', serverName, url);
});
