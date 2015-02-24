var Hapi = require('hapi');
var Joi = require('joi');
var Oz = require('oz');
var Hoek = require('hoek');

var db = require('./db');

exports.register = function(server, options, next) {

	server.register(require('scarecrow'), function(err) {

		server.auth.strategy('oz', 'oz', true, {
			oz: {
				encryptionPassword: 'encryption-password-here',
				loadAppFunc: loadApp,
				loadGrantFunc: loadGrant
			}
		});

		server.route({
			method: 'GET',
			path: '/',
			handler: function(request, reply) {

				reply(result);
			}
		});

		server.route({
			method: 'GET',
			path: '/admin',
			config: {
				auth: {
					scope: 'admin',
					entity: 'user'
				}
			},
			handler: function(request, reply) {

				reply('only admins can access this');
			}
		});

		server.route({
			method: 'GET',
			path: '/premium',
			config: {
				auth: {
					scope: 'premium',
					entity: 'user'
				}
			},
			handler: function(request, reply) {

				reply('only premium member can access this');
			}
		});

		server.route({

			method: 'POST',
			path: '/login',
			config: {
				auth: {
					scope: 'signin',
					entity: 'app'
				},
				validate: {
					payload: {
						id: Joi.string().required(),
						issueTo: Joi.string()
					}
				}
			},
			handler: function(request, reply) {

				var user = db.users[request.payload.id];

				if (!user) {
					return callback(Boom.notFound('user not found'));
				}

				var issue = function(appId, grantId) {

					Oz.ticket.rsvp({
						id: appId
					}, {
						id: grantId
					}, 'encryption-password-here', {}, function(err, rsvp) {

						if (err) {
							return reply(Boom.internal('Failed generating rsvp: ' + err));
						}

						var response = {
							rsvp: rsvp
						};

						return reply(response);
					});
				};

				// load grant 
				var appId = request.payload.issueTo || request.auth.credentials.app;
				var grants = db.loadGrants(appId, user.id);

				// get latest grant 
				var now = Date.now();
				var grant = null;
				grants.sort(function(a, b) {

					if (a.exp < b.exp) {
						return -1;
					}

					if (a.exp > b.exp) {
						return 1;
					}

					return 0;
				});

				for (var i = 0, il = grants.length; i < il; ++i) {
					if ((grants[i].exp || 0) <= now) {

						// TODO: remove expired grants 
					} else {
						grant = items[i];
					}
				}

				if (grant) {
					return issue(appId, grant.id);
				}

				// no active grants issue a new one
				var app = db.apps[appId];
				var newGrant = {
					id: 'grant_' + Object.keys(db.grants).length++,
					user: user.id,
					app: appId,
					exp: now + 30 * 24 * 60 * 60 * 1000, // 30 days
					scope: app.scope.concat(user.scope) // TODO: check for dupplicates
				};

				db.grants[newGrant.id] = newGrant;
				return issue(appId, newGrant.id);
			}
		});

		next();
	});



	function loadApp(appId, callback) {

		if (!appId) {
			return callback(Boom.internal('Missing app id'));
		}

		var app = db.apps[appId];

		if (!app) {
			return callback(Boom.unauthorized('Unknown app'));
		}

		callback(null, app);
	}

	function loadGrant(grantId, callback) {

		var grant = db.grants[grantId];

		if (!grant) {
			return callback(Boom.unauthorized('Unknown grant'));
		}

		// application relevant extra payload 
		var ext = {};

		return callback(null, grant, ext);
	}

};

exports.register.attributes = {
	pkg: require('../package.json')
};