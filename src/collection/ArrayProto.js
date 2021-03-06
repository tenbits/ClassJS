
var ArrayProto = (function(){

	function check(x, mix) {
		if (mix == null)
			return false;
		
		if (typeof mix === 'function') 
			return mix(x);
		
		if (typeof mix === 'object'){
			
			if (x.constructor === mix.constructor && x.constructor !== Object) {
				return x === mix;
			}
			
			var value, matcher;
			for (var key in mix) {
				
				value = x[key];
				matcher = mix[key];
				
				if (typeof matcher === 'string') {
					var c = matcher[0],
						index = 1;
					
					if ('<' === c || '>' === c){
						
						if ('=' === matcher[1]){
							c +='=';
							index++;
						}
						
						matcher = matcher.substring(index);
						
						switch (c) {
							case '<':
								if (value >= matcher)
									return false;
								continue;
							case '<=':
								if (value > matcher)
									return false;
								continue;
							case '>':
								if (value <= matcher)
									return false;
								continue;
							case '>=':
								if (value < matcher)
									return false;
								continue;
						}
					}
				}
				
				/*jshint eqeqeq: false*/
				if (value != matcher) { 
					return false;
				}
				/*jshint eqeqeq: true*/
				
			}
			return true;
		}
		
		console.warn('No valid matcher', mix);
		return false;
	}

	var ArrayProto = {
		length: 0,
		push: function(/*mix*/) {
			var imax = arguments.length,
				i = -1;
			while ( ++i < imax ) {
				
				this[this.length++] = create(this._ctor, arguments[i]);
			}
			
			return this;
		},
		pop: function() {
			var instance = this[--this.length];
	
			this[this.length] = null;
			return instance;
		},
		shift: function(){
			if (this.length === 0) 
				return null;
			
			
			var first = this[0],
				imax = this.length - 1,
				i = 0;
			
			for (; i < imax; i++){
				this[i] = this[i + 1];
			}
			
			this[imax] = null;
			this.length--;
			
			return first;
		},
		unshift: function(mix){
			this.length++;
			
			var imax = this.length;
			
			while (--imax) {
				this[imax] = this[imax - 1];
			}
			
			this[0] = create(this._ctor, mix);
			return this;
		},
		
		splice: function(index, count /* args */){
			
			var length = this.length;
			var i, imax, y;
			
			// clear range after length until index
			if (index >= length) {
				count = 0;
				for (i = length, imax = index; i < imax; i++){
					this[i] = void 0;
				}
			}
			
			var	rm_count = count,
				rm_start = index,
				rm_end = index + rm_count,
				add_count = arguments.length - 2,
				
				new_length = length + add_count - rm_count;
			
			
			// move block
			
			var block_start = rm_end,
				block_end = length,
				block_shift = new_length - length;
			
			if (0 < block_shift) {
				// move forward
				
				i = block_end;
				while (--i >= block_start) {
					
					this[i + block_shift] = this[i];
					
				}

			}
			
			if (0 > block_shift) {
				// move backwards
				
				i = block_start;				
				while (i < block_end) {
					this[i + block_shift] = this[i];
					i++;
				}
			}
			
			// insert
			
			i = rm_start;
			y = 2;
			for (; y < arguments.length; y) {
				this[i++] = create(this._ctor, arguments[y++]);
			}
			
			
			this.length = new_length;
			return this;
		},
		
		slice: function(){
			return fn_apply(_Array_slice, this, arguments);
		},
		
		sort: function(fn){
			_Array_sort.call(this, fn);
			return this;
		},
		
		reverse: function(){
			var array = _Array_slice.call(this),
				imax = this.length,
				i = -1
				;
			while( ++i < imax) {
				this[i] = array[imax - i - 1];
			}
			return this;
		},
		
		toString: function(){
			return _Array_slice.call(this, 0).toString()
		},
		
		each: forEach,
		forEach: forEach,
		
		
		where: function(mix){
			
			var collection = new this.constructor();
			
			for (var i = 0, x, imax = this.length; i < imax; i++){
				x = this[i];
				
				if (check(x, mix)) {
					collection[collection.length++] = x;
				}
			}
			
			return collection;
		},
		remove: function(mix){
			var index = -1,
				array = [];
			for (var i = 0, imax = this.length; i < imax; i++){
				
				if (check(this[i], mix)) {
					array.push(this[i]);
					continue;
				}
				
				this[++index] = this[i];
			}
			for (i = ++index; i < imax; i++) {
				this[i] = null;
			}
			
			this.length = index;
			return array;
		},
		first: function(mix){
			if (mix == null)
				return this[0];
			
			var i = this.indexOf(mix);
			return i !== -1
				? this[i]
				: null;
				
		},
		last: function(mix){
			if (mix == null)
				return this[this.length - 1];
			
			var i = this.lastIndexOf(mix);
			return i !== -1
				? this[i]
				: null;
		},
		indexOf: function(mix, index){
			if (mix == null)
				return -1;
			
			if (index != null) {
				if (index < 0) 
					index = 0;
					
				if (index >= this.length) 
					return -1;
				
			}
			else{
				index = 0;
			}
			
			
			var imax = this.length;
			for(; index < imax; index++) {
				if (check(this[index], mix))
					return index;
			}
			return -1;
		},
		lastIndexOf: function(mix, index){
			if (mix == null)
				return -1;
			
			if (index != null) {
				if (index >= this.length) 
					index = this.length - 1;
				
				if (index < 0) 
					return -1;
			}
			else {
				index = this.length - 1;
			}
			
			
			for (; index > -1; index--) {
				if (check(this[index], mix))
					return index;
			}
			
			return -1;
		},
		
		map: function(fn){
			
			var arr = [],
				imax = this.length,
				i = -1;
			while( ++i < imax ){
				arr[i] = fn(this[i]);
			}
			return arr;
		},
		
		filter: function(fn, ctx){
			var coll = new this.constructor(),
				imax = this.length,
				i = -1;
			while ( ++i < imax ){
				if (fn.call(ctx || this, this[i])) {
					coll.push(this[i]);
				}
			}
			return coll;
		}
	};
	
	// ES6 iterator
	if (typeof Symbol !== 'undefined' && Symbol.iterator) {
		ArrayProto[Symbol.iterator] = function(){
			var arr = this,
				i = -1;
			return {
				next: function(){
					return {
						value: arr[++i],
						done: i > arr.length - 1
					};
				},
				hasNext: function(){
					return i < arr.length;
				}
			}
		};
	}
	
	function forEach(fn, ctx){
		var imax = this.length,
			i = -1
			;
		while( ++i < imax ) {
			fn.call(ctx || this, this[i], i);
		}
		return this;
	}
	
	
	return ArrayProto;
}());
