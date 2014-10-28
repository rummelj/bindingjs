/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Johannes Rummel
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

describe("api/viewDataBinding.js", () => {
    describe("binding", () => {
        it("Should set the binding", () => {
            let viewDataBinding = BindingJS.create()
            viewDataBinding.binding("@binding foo {}")
            /* jshint -W024 */
            /* jshint expr:true */
            expect(viewDataBinding.vars.ast).to.exist
        })
    })
    describe("template", () => {
        it("Should set the template", () => {
            let jQuery = (e) =>  { return { clone: () => { return e } } }
            BindingJS.$(jQuery)
            let viewDataBinding = BindingJS.create()
            viewDataBinding.template("<div></div>")
            /* jshint -W024 */
            /* jshint expr:true */
            expect(viewDataBinding.vars.template).to.exist
        })
    })
    describe("model", () => {
        it("Should set the model", () => {
            let viewDataBinding = BindingJS.create()
            let model = {}
            viewDataBinding.model(model)
            /* jshint -W024 */
            /* jshint expr:true */
            expect(viewDataBinding.vars.model).to.equal(model)
        })
    })
})

