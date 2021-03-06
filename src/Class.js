var Class = function(mix) {
	
	var namespace,
		data;
	
	if (is_String(mix)) {
		namespace = mix;
		
		if (arguments.length === 1) 
			return class_get(mix);
		
		
		data = arguments[1];
		data[str_CLASS_IDENTITY] = namespace;
	} else {
		data = mix;
	}
	
	
	var _base = data.Base,
		_baseCallable = null,
		_extends = data.Extends,
		_extendsCallable = null,
		_static = data.Static,
		_construct = data.Construct,
		_class = null,
		_store = data.Store,
		_self = data.Self,
		_overrides = data.Override,
		
		key;

	if (_base != null) {
		_baseCallable = ensureCallableSingle(_base);
		delete data.Base;
	}
	
	if (_extends != null) 
		delete data.Extends;
	
	if (_static != null) 
		delete data.Static;
	
	if (_self != null) 
		delete data.Self;
	
	if (_construct != null) {
		delete data.Construct;
	}
	
	
	if (_store != null) {		
		if (_extends == null) {
			_extends = _store;
		} else if (is_Array(_extends)) {
			_extends.unshift(_store)
		} else {
			_extends = [_store, _extends];
		}
		
		delete data.Store;
	}
	if (_extends != null) {
		var wrap = is_Array(_extends) ? ensureCallable : ensureCallableSingle;
		_extendsCallable = wrap(_extends);
	}
	
	if (_overrides != null) 
		delete data.Override;
	
	if (_base == null && _extends == null && _self == null) {
	
		if (data.toJSON === void 0) 
			data.toJSON = json_proto_toJSON;
		
		_class = _construct == null
			? function() {}
			: _construct
			;
		
		data.constructor = _class.prototype.constructor;

		if (_static != null) {
			obj_extendDescriptors(_class, _static);
		}

		_class.prototype = data;
		
		if (namespace != null) 
			class_register(namespace, _class);
		
		return _class;
	}

	_class = function() {
		
		//// consider to remove 
		////if (this instanceof _class === false) 
		////	return new (_class.bind.apply(_class, [null].concat(_Array_slice.call(arguments))));
		
	
		if (_extendsCallable != null) {
			var isarray = _extendsCallable instanceof Array,				
				imax = isarray ? _extendsCallable.length : 1,
				i = 0,
				x = null;
			for (; i < imax; i++) {
				x = isarray
					? _extendsCallable[i]
					: _extendsCallable
					;
				if (typeof x === 'function') {
					fn_apply(x, this, arguments);
				}
			}
		}

		if (_base != null) {
			fn_apply(_baseCallable, this, arguments);
		}
		
		if (_self != null && is_NullOrGlobal(this) === false) {
			
			for (var key in _self) {
				this[key] = fn_proxy(_self[key], this);
			}
		}

		if (_construct != null) {
			var r = fn_apply(_construct, this, arguments);
			if (r != null) {
				return r;
			}
		}
		
		this['super'] = null;
		
		return this;
	};
	
	if (namespace != null) 
		class_register(namespace, _class);

	if (_static != null) {
		obj_extendDescriptors(_class, _static);
	}
	
	if (_base != null) 
		class_inheritStatics(_class, _base);
	
	if (_extends != null) 
		class_inheritStatics(_class, _extends);
	
	class_extendProtoObjects(data, _base, _extends);
	
	class_inherit(_class, _base, _extends, data, _overrides, {
		toJSON: json_proto_toJSON
	});
	
	data = null;
	_static = null;
	return _class;
};

var ensureCallableSingle, 
	ensureCallable;
(function () {
	ensureCallable = function (arr) {
		var out = [],
			i = arr.length;
		while(--i > -1) out[i] = ensureCallableSingle(arr[i]);
		return out;
	};
	ensureCallableSingle = function (mix) {
		if (is_Function(mix) === false) {
			return mix;
		}		
		var fn = mix;
		var caller = directCaller;
		var safe = false;
		var wrapped = function () {
			var self = this;
			var args = _Array_slice.call(arguments);
			var x;
			if (safe === true) {
				caller(fn, self, args);
				return;
			}
			try {
				x = caller(fn, self, args);
				safe = true;					
			} catch (error) {
				caller = newCaller;
				safe = true;
				caller(fn, self, args);					
			}
			if (x != null) {
				return x;
			}
		};		
		return wrapped;
	};
	function directCaller (fn, self, args) {
		return fn.apply(self, args);
	}
	function newCaller (fn, self, args) {
		var x = new (fn.bind.apply(fn, [null].concat(args)));
		obj_extend(self, x);
	}
}());