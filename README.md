ComPosiX
========

Extremely simple to use module system on top of your favorite `_` dialect such as
[Underscore](http://underscorejs.org/) or [Lodash](http://lodash.com/).
Modules will work easily on NodeJS and in the browser without any hassle.

##NodeJS

### Installation
Install ComPosiX along with your favorite `_` implementation.

For UnderscoreJS:
```
npm install underscore composix
```

For Lodash:
```
npm install lodash composix
```

### Usage
In your JavaScript code, require ComPosiX and feed it the _ implementation of
your choice.

For UnderscoreJS:
```javascript
const _ = require('composix')(require('underscore'));
```

For Lodash:
```javascript
const _ = require('composix')(require('lodash'));
```

Now the plugin `_.module` has been added and is ready to use. Start writing
your own modules.

Simple named module without dependencies:
```javascript
_.module('HelloWorld', function() {
    return "Hello World!"
});
```

Named module with one dependency:
```javascript
_.module('printHelloWorld', ['HelloWorld'], function(hw) {
    return function() {
        console.log(hw);
    };
});
```

Anonymous module with dependency:
```javascript
_.module(['printHelloWorld'], function(run) {
    run();
});
```

## Browsers

Instructions coming soon.

## Builtins

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
