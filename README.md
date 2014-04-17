ClassJS
-----
[![Build Status](https://travis-ci.org/atmajs/ClassJS.png?branch=master)](https://travis-ci.org/atmajs/ClassJS)

Business and Data Access layers for browsers or nodejs

[Documentation](http://atmajs.com/class)

##### Install

- NodeJS
	- Standalone: ``` $ npm install atma-class ``` ``` var Class = require('atma-class') ```
	- [AtmaPackage](https://github.com/atmajs/Atma.Libs)
- Browser
	- ``` <script src='/lib/class.js'></script> ```

-----
- [Attributes Overview](#attributes)
- [Serialization](#serialization)
- [Collections](#collections)
- [Persistence](#store)
	- [RESTful](#remote)
	- [Local Storage](#localstore)
	- [MongoDB](#mongodb)
	- MySQL _in progress_
- [Repository](#repository)
- [Static Functions](#static-functions)
- [Validation](#validation)
- [Classes](#classes)
	- [Deferred](#deferred)
	- [EventEmitter](#eventemitter)



### Attributes

Class definition object is a simple `prototype` object, but with `Attributes` it is possible to add or change some functionality of the resulted class, like inheritance, overrides, persistance, validation and some more. 

```javascript
Class({
	/*
	 * instanceof also works on deep inheritances
	\*/
	Base: < Function > BaseConstructor,
	/* 
	 * Same as base, but instanceof wont work, 
	 * as instanceof allows linear inheritance only
	\*/
	Extends: < Function | Object | Array > Mixins
	/*
	 * constructor of a class - if has inheritance, 
	 * also all constructors will be called
	\*/
	Construct: < Function > function(){}
	/*
	 * Static functions of a created Class
	 * User.key()
	\*/
	Static: < Object > { key: function(){} }
	/*
	 * RESTfull/LocalStorage/MongoDB serialization/deserialization
	\*/
	Store: <| Class.Remote('/user/:id')
            | Class.LocalStore('user')
            | Class.MongoStore.Single('users')
            | Class.MongoStore.Collection('users') /* use in Class.Collection */ |>
    /*
	 * Override any Base or Extended Function
	 * Using this object, there will be access to overriden function
     * via this.super();
    \*/
	Override: < Object > {
		some: function(){
			
			// default arguments
			this.super(arguments);
			
			// overriden arguments
			this.super(arg1, arg2);
		}
	},
	Self: {
		/*
		 * Functions, that are always bound to the instance of the class
		 * e.g. setTimeout(this.foo, 1000);
        \*/
		foo: function(){}
	},
    Validate: {
        user: function(val){
            if (val == null)
                return 'Username is not defined';
        }
    },
	/*
	 * Private properties with the underscore contract.
	 * Such properties wont be serialized
	\*/
	'_property': null,
	
	/*
	 * Other class functions/properties
	 * This Object is then transformed into prototype object of
	 * a class.
	\*/
	...
});
```

### Serialization

A `Class` instance can be serialized to or deserialiazed from a string or simple JSON object. For this to happen, the instance schould be inherited from a `Serialization` class.
```javascript
var Foo = Class({
	Base: Class.Serializable,
	...
});
var foo = new Foo({baz: 'Baz'});
foo.baz === 'Baz';
```
There could be also some meta specified
```javascript
var Foo = Class({
	Base: Class.Serializable({
		// constructor deserialization, e.g.:
		'date': Date,
		
		// use entity from ClassJS IoC Repository
		'article': 'Article',
		
		// same
		'user': {
			deserialize: User
		},
		
		// skip property
		'none': {
			serialize: null
		},
		
		// rename property when de-/serializing
		'myKey': {
			key: 'yourKey'
		}
	})
});

var jsonStr = '{"date":"2014-03-27T23:33:45.594Z","user":{"name":"baz"},"yourKey":5}';
var foo = new Foo(jsonStr);

foo.date instanceof Date //> true
foo.user instanceof User //> true
foo.myKey === 5 //> true
```


### Collections

Creates Array-like Object with all class features

```javascript
var Users = Class.Collection(User, {
	// ... Class Definition Object, e.g. Remote
	Store: Class.Remote('/api/users?location={?country}')
});

var list = Users
	.fetch({country: 'DE'});
	.done(function(obj){
	
		list === obj 
		list.length
		list[0]
		// user instance
		list.first({age: '>20', genre: 'm'}); 
		// collection instance
		list.where({age: '>20'});
		list.where(function(x){ return x.age > 20 });
		// mutator
		list.remove({age: '<5'});
		// storage
		list.save();
		// mutator + storage
		list.del({age: '<5'});
	});
```

### Store

Storage Interface is same for all types, so you can easily switch between local storage, Ajax or MongoDB.

#### Remote

_async - extends [Class.Deferred](#deferred)_

```javascript
var User = Class({
	Base: Class.Serializable,
	Store: Class.Remote('/user/:id')
});

// resolve user (GET)
var user = User
	.fetch({id: 5})
    .done(onSuccess)
	.fail(onFail)
	.always(onComplete)
	.then(onSuccess, onFail);

// update (PUT) or Save (POST) - (look for existance of id/_id properties);
user.name = 'X';
user
    .save()
	.done(onSuccess)
	.fail(onFail)
	.always(onComplete);

// Remove (DELETE)
user
    .del()
	.done(onSuccess)
	.fail(onFail)
	.always(onComplete)

// patch object (PATCH) - MongoDB update query syntax is used
user
	.patch({
		$inc: { 'visits': 1 },
		$set: { 'current.date' : new Date }
	});
	
// Static service comunication
var user = new User({
	username: 'baz'
	age: 40
});
Class
	.Remote
	.send('/user/publish', 'put', user)
	.done(function(responseJSON){
		
	});
```

More route samples can be found from tests [Route Tests](test/route.test)

#### LocalStore
_sync, as localStorage is synchronous - but also inherits from [Class.Deferred](#deferred)_
```javascript
var Settings = Class({
	Base: Class.Serializable,
	Store: Class.LocalStore('app/settings'),
	points: 5
});
var setts = new Settings;
// get
setts.fetch();
// save or update
setts.points = 10;
setts.save();
// remove
setts.del();
// patch
setts.patch({
	$inc: { points: 1 }
});
```

#### MongoDB

```javascript
// settings:
Class.MongoStore.settings({
	db: 'myDBName',
	ip: '127.0.0.1' // <- default
	port: 27017 // <- default
});
//

var User = Class({
	Base: Class.Serializable,
	Store: Class.MongoStore.Single('users'),
	username: ''
});
var Users = Class.Collection(User, {
	Store: Class.MongoStore.Collection('users')
});

var user = User
	.fetch({ username: 'bar' })
//  .fetch({ age: '>10' })
	.done(function(user_){
		user === user_ //> true
	})
	.fail(function(error){})

// Complex queries. (Use $query from MongoDB API)
User
	.fetch({
		$query:{
			name: 'Smith'
			age: {
				$gte: 40
			}
		},
		$orderby:{
			surname: -1
		}, 
		$maxScan: 1, 
	})
	.done(function(users){});

user.username = 'foo'
// save or update if `_id` is present.
user
	.save()
	.done(callback)
	.fail(callback)
	.always(callback)
	;
// delete
user
	.del()
	.done(callback)
	.fail(callback)
	.always(callback);
// patch
user
	.patch({
		$inc: { age: 1 }
	});

// Any MongoDB queries:

// 1) Get MongoDB `db` object
Class
	.MongoStore
	.resolveDb()
	.done(function(db){
		// do smth with the database
	})
	.fail(onError);

// 2) Get MongoDB `collection` object
User
	.resolveCollection()
	.done(function(collection){
		// do smth with the collection object
	})
	.fail(onError)
	;
```

All work with the database is encapsulated, so you do not need even to connect to the database,
just apply settings and with the first query the connection will be established.

##### Indexes
```javascript
var User = Class({
	Base: Class.Serializable,
	Store: Class.MongoStore.Single({
		collection: 'users',
		indexes: [
			// simple indexes
			{
				bar: 1,
				baz: 1
			},
			// with options
			[{ username: 1 }, { unique: true }]
		]
	})
});
// ensure indexes
Class
	.MongoStore
	.ensureIndexes(User)
	.done(onComplete)
	.fail(onError)
	;
```

##### Advanced connections and settings:
```javascript
Class
	.MongoStore
	.settings({
		connection: 'mongodb://localhost:30000,localhost:30001,localhost:30002/myDatabase',
		
		// redefine options, defaults are:
		params: {
			auto_reconnect: true,
			native_parser: true,
			w: 1
		}
	})
```

### Repository
_Namespaces_ When declaring a Class, it can be stored in the repository object for simpler access.

[MaskJS.Node](https://github.com/atmajs/mask-node) profits of this feature to automatically serialize _(server-side)_ and deserialize _(browser)_ class instances.
```javascript

var User = Class('User', ClassDefinition);

User === Class('User') === Class.Model.User;

// redefine the repository object
Class.cfg('ModelHost', window.Model = {});

User === Class('User') === Model.User;
```

### Static Functions

##### ```Class.validate(instance [, ?validationModel])```

	@see [Validation](#validation). `validationModel` is not required, instance has `Validate` Attribute. 
	returns error if the instance is invalid or nothing (`void 0`) if is ok.

##### ```Class.properties(Ctor | instance)```

	returns hash of all properties with types if known.

##### ```Class.stringify(instance)```

	Serializes the instance. If class has name, the name is included, for later deserialization and initialization

##### ```Class.parse(string)```

	Deserializes instance. e.g - serialize models on NodeJS, pass them to the front-end and restore the models there.

	
	```javascript
	var User = Class('User', {
		Base: Class.Serializable,
		name: '',
		log: function(){ console.log(this.name) };
	});
	var user = new User({name: 'baz'});
	user.log(); //> 'baz'
	
	var str = Class.stringify(user) //> {"name":"baz","__$class__":"User"}
	...
	
	var user = Class.parse(str);
	user.log() //> 'baz'
	```

### Validation

Validation Model
```javascript
{
	// required, not empty string
	foo: 'string',
	// required, of type number
	foo: 'number',
	// required, validate with regexp
	age: /^\d+$/,
	// required, custom check function (return 'nothing' if ok)
	number: function(value){
		if (value % 2 !== 0)
			return 'Only even numbers';
	}
	// optional. Same value types as by 'required'
	'?baz': 'number',
	// unexpect. Same value types as by 'required'
	'-quz': null,
	// validate subobject
	jokers: {
		left: 'number',
		right: 'number'
	},
	// validate arrays
	collection: [ {_id: 'string', username: 'string'} ]
}
```

- Class Validation

	```javascript
	var Foo = Class({
		Validate: ValidationModel
	});
	var foo = new Foo;
	var error = Class.validate(foo);
	```
- Simple object validation

	```javascript
	var user = { username: 'foo' }
	var error = Class.validate(user, ValidationModel);
	```


### Classes
There are some classes you can start to use.

#### Deferred
_Simple `Promise` implementation_
```javascript
var X = Class({
	Extends: Class.Deferred
});
new X()
	.resolve ( arg )
	.reject  ( arg )
	.done   ( callback )
	.fail   ( callback )
	.always ( callback ),
	.then   ( onSuccess, onFailure )
	;
```

#### EventEmitter
```javascript
var X = Class({
	Extends: Class.EventEmitter
});

new X()

	.trigger( ..args )
	.on(event, callback)
	// function is detached after one call
	.once(event, callback)
	.off(event, callback)
	// creates function that can be bound to other event emitter
	// and transmits the event with new eventName to current listeners
	.pipe(event);
```

#### Run tests and build
```bash
$ npm install -g atma
$ cd class

# tests
$ atma test

# build
$ atma
```
----
(c) 2014 MIT