exports.loadGrants = function(appId, userId) {

	var grants = [];
	for (var i = 0; i < this.grants.length; i++) {
		var grant = this.grants[i];
		if (grant.user === userId && grant.app === appId) {
			grants.push(grant);
		}
	}

	return grants;
};

exports.users = {
	'bob': {
		id: 'bob',
		name: 'Bob Beaver',
		scope: ['admin', 'premium']
	},
	'wilma': {
		id: 'wilma',
		name: 'Wilma Jackson',
		scope: ['premium']
	},
	'billy': {
		id: 'billy',
		name: 'Billybob Jackson',
		scope: []
	}
};

exports.apps = {
	'web': {
		id: 'web',
		scope: ['webfoo'],
		key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
		algorithm: 'sha256'
	},
	'api': {
		id: 'api',
		scope: ['signin', 'admin'],
		key: '89ruxnpa98w4rxn98xrunpaw38rpawerxhqbxn39844',
		algorithm: 'sha256'
	}
};

exports.grants = {};