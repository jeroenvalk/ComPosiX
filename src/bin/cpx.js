#!/usr/bin/env node

const cpx = require('../main/javascript/index.js');
const x = JSON.parse(require('fs').readFileSync('src/test/ComPosiX.json'));
cpx.execute(x);
console.log(x);
 