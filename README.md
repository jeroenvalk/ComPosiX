ComPosiX
========

Extremely simple to use module system on top of your favorite `_` dialect such as
[Underscore](http://underscorejs.org/) or [Lodash](http://lodash.com/).
Modules will work easily on NodeJS and in the browser without any hassle.

#Getting Started

## Step 1: Get your favorite _ implementation
For example:
```shell
$ npm install composix lodash underscore
```
Make sure the _ variable is in the global scope before you load ComPosiX.

_NodeJS_:
```javascript
global._ = require('lodash');
require('composix').ComPosiX(require, true);
```

Note that ComPosiX uses the CommonJS require function to load all modules.
The boolean option true tells ComPosiX to automatically configure itself
using the default configuration.

_Browser_:
```html
<script type="application/javascript" src="lodash.js"></script>
<script type="application/javascript" src="composix.js"></script>
<script type="application/javascript" src="your_javascript_modules.js"></script>
<script type="application/javascript">
    _.ComPosiX('module');
    _.module(['your_first_module'], function(_, your_first_module) {
    	your_first_module.start();
    });
</script>
```

This runs ComPosiX without a module loader so you need to assure that
dependencies are already loaded before you use them. So given the HTML above
we expect 'your_first_module' to be defined in the 
file 'your_javascript_modules.js'.

## Step 2: start writing your own modules
Modules are created using the _.module(name, deps, func) plugin which takes up to
three arguments:
- name: a unique name you give to your module for future reference as a dependency
- deps: array with module names that you want to use as a dependency
- func: JavaScript function that provides the implementation of your module

Only the JavaScript function is required allowing you to write JavaScript
in a contained scope like so:
```javascript
_.module(function(_) {
	console.log("Hello World!");
});
console.log("Bye World!");
```
The module function is directly executed (synchronously). So you will see "Hello World!" and
"Bye World!" in the correct order.

Anonymous modules with dependencies are a bit more advanced:
```javascript
_.module(['uuid/v4'], function(uuidv4) {
	console.log("Hello " + uuidv4());
});
```
This module is again synchronously executed and depends on the uuid NodeJS module to
print a unique identifier to the console. 

Besides existing dependencies any named module can also be included as a dependency to a 
module. For example:
```javascript
_.module('HelloWorld', function() {
    return "Hello World!"
});

_.module(['HelloWorld'], function(hw) {
    console.log(hw);
 );
```

An interesting aspect of named modules is that they can be executed again when demanded
in another underscore context. Consider for example the following named module.
```javascript
_.module('counter', ['uuid/v4'], function(_, uuidv4) {
	var N = 0;
	
	const uuid = uuidv4(), count = function() {
		console.log(uuid, N++);
		_.delay(count, 1000);
	};
	
	return uuid;
});
```
Again this module executed synchronously and the immediately the counting starts on
the console. A named module may again be executed in another ComPosiX context.
A new ComPosiX context can be created by calling _.runInContext() to create
a new _ underscore object then initializing ComPosiX in it.
```javascript
// assume code block with counter module has already executed
// so first counter is already running

// create a new ComPosiX context
const __ = _.runInContext();
__.mixin({ComPosiX: _.ComPosiX});
__.ComPosiX('module');

// executes new counter because demanded as dependency in a new context
__.module(['counter'], function(second ) {
	console.log(second);
});
``` 

## Step 3: Learn more about ComPosiX

ComPosiX comes with a lot of useful modules built in. For example,
offers powerful YAML and CSV handling.

```javascript
#!/usr/bin/env node

const _ = require('composix')(require('lodash'));

_.module(["pipeline", "yaml", "csv"], function(pipeline, yaml, csv) {
	pipeline(
		process.stdin, 
		[csv, /^---/, yaml],
		JSON.stringify, 
		process.stdout
	);
});
```

This NodeJS script reads from stdin, autodetects YAML or CSV and parses
accordingly, serializes the result as JSON, and writes to stdout. 

## License

Copyright © 2016-2017 dr. ir. Jeroen M. Valk

This file is part of ComPosiX. ComPosiX is free software: you can
redistribute it and/or modify it under the terms of the GNU Lesser General
Public License as published by the Free Software Foundation, either version 3
of the License, or (at your option) any later version.

ComPosiX is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
details.

You should have received a copy of the GNU Lesser General Public License
along with ComPosiX. If not, see <http://www.gnu.org/licenses/>.
