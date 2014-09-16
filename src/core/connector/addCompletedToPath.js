/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.connector.addCompletedToPath = class AddCompletedToPath {
    process (input) {
        if (!_api.util.isReference(input)) {
            return input.completed
        }
        let newPath = input.getPath().slice().push("completed")
        let newRef = new _api.engine.binding.Reference(input.getAdapter(), newPath)
        newRef.setElement(input.getElement())
        newRef.setModel(input.getModel())
        return newRef
    }
}

_api.repository.connector.register("addCompletedToPath", new _api.connector.addCompletedToPath())
