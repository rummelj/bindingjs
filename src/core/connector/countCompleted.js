/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/


_api.connector.countCompleted = class countCompleted {
    process (input) {
        let count = 0
        for (var i = 0; i < input.length; i++) {
          let item = input[i]
          if (_api.util.isReference(item)) {
              item = item.getValue()
          }
          if (item.completed) {
            count++
          }
        }
        return parseInt(input) + 1
    }
}

_api.repository.connector.register("countCompleted", new _api.connector.countCompleted())
