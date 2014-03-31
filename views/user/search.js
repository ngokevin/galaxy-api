var auth = require('../../lib/auth');
var db = require('../../db');
var user = require('../../lib/user');


module.exports = function(server) {

    // Sample usage:
    // % curl 'http://localhost:5000/user/search?_user=ssatoken'
    server.get({
        url: '/user/search',
        validation: {
            _user: {
                description: "A user's SSA token",
                isRequired: true
            },
            email: {
                description: 'Email to search for',
                isRequired: false
            },
            id: {
                description: 'User ID to search for',
                isRequired: false
            },
            devSlug: {
                description: 'Company Slug to search for',
                isRequired: false
            },
            q: {
                description: 'Email/user ID/username to search for',
                isRequired: false
            }
        }
    }, db.redisView(function(client, done, req, res) {
        var DATA = req.params;
        console.log(DATA);

        var lookup_email = DATA.email;
        var lookup_username = DATA.username;
        var lookup_id = DATA.id;
        var lookup_q = DATA.q;
        var lookup_dev = DATA.devSlug;
        var lookup = lookup_email || lookup_id || lookup_q || lookup_dev || lookup_username;

        if (!lookup) {
            res.json(400, {error: 'Must provide either email, username or user ID'});
            done();
            return;
        }

        var email = req._email;

        if (lookup_dev) {
            user.getCompanyInfoFromDevSlug(client, lookup, function(err, obj) {
                if (err || !obj) {
                    res.json(400, {error: err || 'bad_dev_slug'});
                    done();
                    return;
                }
                res.json(obj);
            });
            done();
            return;
        }

        function tryFindUser(query, searchFunction) {
            return new Promise(function (resolve, reject) {
                searchFunction(client, query, function(err, obj) {
                    if (err || !obj) {
                        reject(err);
                        return;
                    }

                    resolve(user.publicUserObj(obj));
                });
            });
        }

        function tryEmail() {
            return tryFindUser(lookup, user.getUserFromEmail);
        }

        function tryUsername() {
            return tryFindUser(lookup, user.getUserFromUsername);
        }

        function tryID() {
            return tryFindUser(lookup, user.getUserFromID)
        }

        var search;

        if (lookup_q) {
            search = Promise.all([tryEmail(), tryUsername(), tryID()]);
        } else if (lookup_email) {
            search = tryEmail();
        } else if (lookup_username) {
            search = tryUsername();
        } else if (lookup_id) {
            search = tryID();
        }

        search.then(function (success) {
            console.log(success);
            return;
        }, function(err) {
            if(!err) {
                if(lookup_email) {
                    err = 'bad_email';
                } else if (lookup_username) {
                    err = 'bad_username';
                } else if (lookup_id) {
                    err = 'bad_id';
                } else {
                    err = 'bad_query';
                }
            }

            res.json(400, {error: err});
        }).then(function (result) {
            res.json(result);
        });

        done();

    }));
};
