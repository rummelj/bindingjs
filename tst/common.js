/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  switch to strict mode  */
"use strict";

/*  provide exception swallowing  */
global.swallow = function (thrower) { try { thrower(); } catch (e) {} };

/*  provide mocking functionality  */
global.sinon   = require("sinon");

/*  provide assertion functionality (base features)  */
global.chai    = require("chai");
global.should  = require("chai").should();
global.expect  = require("chai").expect;
global.assert  = require("chai").assert;

/*  provide assertion functionality (extra features)  */
chai.use(require("sinon-chai"));
chai.use(require("chai-fuzzy"));
chai.use(require("chai-factories"));
chai.use(require("chai-things"));
chai.use(require("chai-interface"));

/*  print stack traces on assertion failures  */
chai.config.includeStack = true;

/*  load either instrumented or regular library  */
var load = function (name) {
    return process.env.COVERAGE_INSTRUMENTED ?
        require("../cov/" + name + ".js") :
        require("../bld/" + name + ".js");
};

/*  load all library parts  */
global.BindingJS = load("binding");
global.bd = global.BindingJS;

