/*
 **  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
 **  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
 **
 **  This Source Code Form is subject to the terms of the Mozilla Public
 **  License (MPL), version 2.0. If a copy of the MPL was not distributed
 **  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

include("../umd/umd-library-prolog.js", {
	library : "bindingjs"
})

include("api/wrapper.js")
include("repository/wrapper.js")
include("adapter/wrapper.js")
include("connector/wrapper.js")
include("dsl/wrapper.js")
include("engine/wrapper.js")
include("preprocessor/wrapper.js")
include("util/wrapper.js")

include("../umd/umd-library-epilog.js")