// Copyright (c) 2012-2016 Florian Hartmann, https://github.com/florian/x18n

import { Observable } from './Observable';

const slice = [].slice;

function X18n() {

	Observable.call(this);

	this.t = this.t.bind( this ) ;

	this.dict = {};
	this.defaultlocal = 'en';
	this.chosenLocal = void 0;
	this.availableLocales = [];
	this.locales = [];
	this.missingTranslations = {};
	this.on('dict:change', (function(_this) {
		return function() {
			return _this.sortLocales();
		};
	})(this));
}

X18n.prototype = Object.create ( Observable.prototype );

X18n.prototype.utils = {
	merge: function(one, two) {
		var k, results, v;
		results = [];
		for (k in two) {
			v = two[k];
			if (typeof v === 'object' && typeof one[k] === 'object') {
				results.push(this.merge(one[k], v));
			} else {
				results.push(one[k] = v);
			}
		}
		return results;
	},
	filter: function(arr, fn) {
		var i, len, results, v;
		results = [];
		for (i = 0, len = arr.length; i < len; i++) {
			v = arr[i];
			if (fn(v)) {
				results.push(v);
			}
		}
		return results;
	},
	unique: function(arr) {
		var i, k, len, results, ret, v;
		ret = {};
		for (i = 0, len = arr.length; i < len; i++) {
			v = arr[i];
			ret[v] = v;
		}
		results = [];
		for (k in ret) {
			v = ret[k];
			results.push(v);
		}
		return results;
	},
	getByDotNotation: function(obj, key) {
		var keys;
		keys = key.split('.');
		while (!(keys.length === 0 || obj === void 0)) {
			obj = obj[keys[0]];
			keys.shift();
		}
		return obj;
	},
	isPlainObject: function(value) {
		return !!value && Object.prototype.toString.call(value) === '[object Object]';
	}
};

X18n.prototype.register = function(local, dict) {
	if (!(local in this.dict)) {
		this.dict[local] = {};
		this.availableLocales.push(local);
	}
	this.utils.merge(this.dict[local], dict);
	return this.trigger('dict:change', [local]);
};

X18n.prototype.set = function(local) {
	this.chosenLocal = local;
	return this.sortLocales();
};

X18n.prototype.setDefault = function(local) {
	this.defaultLocal = local;
	return this.sortLocales();
};

X18n.prototype.detectLocal = function() {
	return navigator.userLanguage || navigator.language;
};

X18n.prototype.similiarLocales = function(local) {
	local = String(local).slice(0, 2).toLowerCase();
	return this.utils.filter(this.availableLocales, function(l) {
		if (local === l) {
			return false;
		}
		return l.toLowerCase().indexOf(local) === 0;
	});
};

X18n.prototype.sortLocales = function() {
	var _locales, i, len, local, locales, oldLocales;
	oldLocales = this.locales.slice();
	_locales = [this.chosenLocal].concat(slice.call(this.similiarLocales(this.chosenLocal)), [this.detectLocal()], slice.call(this.similiarLocales(this.detectLocal())), [this.defaultLocal], slice.call(this.similiarLocales(this.defaultlocal)), ['en'], slice.call(this.similiarLocales('en')));
	locales = [];
	for (i = 0, len = _locales.length; i < len; i++) {
		local = _locales[i];
		if (this.availableLocales.indexOf(local) >= 0) {
			locales.push(local);
		}
	}
	locales.push.apply(locales, this.availableLocales);
	this.locales = this.utils.unique(locales);
	if (oldLocales.join(',') !== this.locales.join(',')) {
		return this.trigger('lang:change', [this.locales, oldLocales]);
	}
};

X18n.prototype.interpolate = function() {
	var interpolation, str;
	str = arguments[0], interpolation = 2 <= arguments.length ? slice.call(arguments, 1) : [];
	if (this.utils.isPlainObject(interpolation[0])) {
		str = str.replace(/%\{([^}]+)\}/g, function(_, key) {
			return interpolation[0][key];
		});
	} else {
		str = str.replace(/%(\d+)/g, function(_, n) {
			return interpolation[Number(n) - 1];
		});
	}
	return str;
};

X18n.prototype.t = function() {
	var i, interpolation, key, len, local, ref, tr;
	key = arguments[0], interpolation = 2 <= arguments.length ? slice.call(arguments, 1) : [];
	tr = void 0;
	ref = this.locales;
	for (i = 0, len = ref.length; i < len; i++) {
		local = ref[i];
		tr = this.utils.getByDotNotation(this.dict[local], key);
		if (tr) {
			break;
		} else {
			if (!(local in this.missingTranslations)) {
				this.missingTranslations[local] = [];
			}
			this.missingTranslations[local].push(key);
			this.missingTranslations[local] = this.utils.unique(this.missingTranslations[local]);
			this.trigger('missing-translation', [local, key]);
		}
	}
	if (typeof tr === 'string') {
		tr = this.interpolate.apply(this, [tr].concat(slice.call(interpolation)));
	} else if (tr !== void 0) {
		tr.plural = (function(_this) {
			return function(n) {
				if (n in tr) {
					return tr[n];
				} else {
					return _this.interpolate(tr.n, n);
				}
			};
		})(this);
	}
	return tr;
};

const x18n  = new X18n();

export { x18n };
