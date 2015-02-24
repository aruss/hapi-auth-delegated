var Lab = require('lab');
var Code = require('code');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

var Hapi = require('hapi');
var Oz = require('oz');

var db = require('../lib/db'); 

function createRequest(url, method, token, payload) {

	var request = {
		url: url,
		method: method,
		headers: {
			host: 'example.com',
			authorization: Oz.client.header(url, method, token).field
		}
	};

	if (payload) {
		request.payload = JSON.stringify(payload);
	}

	return request;
}

function login(user, server, appTicket, callback) {

	var payload = {
		id: user,
		issueTo: 'web'
	};

	// sign in user 
	var request = createRequest('http://example.com/login', 'POST', appTicket, payload);
	server.inject(request, function(loginResponse) {

		var app = {
			id: 'web',
			key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
			algorithm: 'sha256'
		};

		var request = createRequest('http://example.com/oz/app', 'POST', app);
		server.inject(request, function(appResonse) {

			var request = createRequest('http://example.com/oz/rsvp', 'POST', appResonse.result, {
				rsvp: loginResponse.result.rsvp
			});

			server.inject(request, function(response) {

				//console.log('-----------------------------------------------------------');
				//console.log(response.result);

				callback(response.result);
			});
		});
	});
}

function initServer(callback) {

	var server = new Hapi.Server({
		app: {}
	});

	server.connection({
		port: 80
	});

	server.register(require('../'), function(err) {

		expect(err).to.not.exist();

		var app = {
			id: 'api',
			key: '89ruxnpa98w4rxn98xrunpaw38rpawerxhqbxn39844',
			algorithm: 'sha256'
		};

		var request = createRequest('http://example.com/oz/app', 'POST', app);
		server.inject(request, function(response) {

			expect(err).to.not.exist();

			callback(server, response.result);
		});
	});
}

describe('Auth thingies', function() {

	it('login as bob', function(done) {

		initServer(function(server, appTicket) {

			login('bob', server, appTicket, function(userTicket) {

				console.log(db.grants); 

				// Should be able to access admin endpoint
				var request = createRequest('http://example.com/admin', 'GET', userTicket, {});
				server.inject(request, function(response) {

					expect(response.statusCode).to.equal(200); 

					// Should be able to access premium endpoint
					var request = createRequest('http://example.com/premium', 'GET', userTicket, {});
					server.inject(request, function(response) {

						expect(response.statusCode).to.equal(200); 

						// Should not be able to access app endpoint
						var request = createRequest('http://example.com/login', 'POST', userTicket, {});
						server.inject(request, function(response) {

							expect(response.statusCode).to.equal(403); 

							done();
						});
					});
				});
			});
		});
	});

	it('login as wilma', function(done) {

		initServer(function(server, appTicket) {

			login('wilma', server, appTicket, function(userTicket) {

				console.log(db.grants); 

				// Should be able to access admin endpoint
				var request = createRequest('http://example.com/admin', 'GET', userTicket, {});
				server.inject(request, function(response) {

					expect(response.statusCode).to.equal(403); 

					// Should be able to access premium endpoint
					var request = createRequest('http://example.com/premium', 'GET', userTicket, {});
					server.inject(request, function(response) {

						expect(response.statusCode).to.equal(200); 

						// Should not be able to access app endpoint
						var request = createRequest('http://example.com/login', 'POST', userTicket, {});
						server.inject(request, function(response) {

							expect(response.statusCode).to.equal(403); 

							done();
						});
					});
				});
			});
		});
	});

	it('login as billy', function(done) {

		initServer(function(server, appTicket) {

			login('billy', server, appTicket, function(userTicket) {

				console.log(db.grants); 

				// Should be able to access admin endpoint
				var request = createRequest('http://example.com/admin', 'GET', userTicket, {});
				server.inject(request, function(response) {

					expect(response.statusCode).to.equal(403); 

					// Should be able to access premium endpoint
					var request = createRequest('http://example.com/premium', 'GET', userTicket, {});
					server.inject(request, function(response) {

						expect(response.statusCode).to.equal(403); 

						// Should not be able to access app endpoint
						var request = createRequest('http://example.com/login', 'POST', userTicket, {});
						server.inject(request, function(response) {

							expect(response.statusCode).to.equal(403); 

							done();
						});
					});
				});
			});
		});
	});
});