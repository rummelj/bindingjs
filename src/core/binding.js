/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

include("../umd/umd-library-prolog.js", { library: "bindingjs" })

    include("binding-1-version.js")
    include("binding-2-util.js")
    include("binding-3-dsl.js")
    include("binding-3-dsl-1-ast.js")
    include("binding-3-dsl-3-parser.js")
    include("binding-3-dsl-4-transform.js")
    include("binding-4-dom.js")
    include("binding-5-adapter.js")
    include("binding-6-connector.js")
    include("binding-7-engine.js")
    include("binding-8-api.js")

include("../umd/umd-library-epilog.js")

