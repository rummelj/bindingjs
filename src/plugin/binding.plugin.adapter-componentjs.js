/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

include("../umd/umd-plugins-prolog.js", { library: "bindingjs", plugin: "adapter-componentjs", deps: "" })

class AdapterComponentJS {
    startup () {
    }
    configure (/* qualifier, params */) {
    }
    observe (/* cb */) {
    }
    unobserve (/* id */) {
    }
    fetch (/* name */) {
    }
    store (/* name, value */) {
    }
    shutdown () {
    }
}

$api.defineAdapter("ComponentJS", AdapterComponentJS)

include("../umd/umd-plugins-epilog.js")

