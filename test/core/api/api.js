/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

describe("api/api.js", () => {
    describe("create", () => {
        it("Should return a new instance", () => {
            let _api = BindingJS.internal()
            let viewDataBinding = BindingJS.create()
            expect(viewDataBinding).instanceof(_api.ViewDataBinding)
        })
    })
    describe("$", () => {
        it("Should throw if jQuery is accessed in node.js env", () => {
            expect(BindingJS.$).to.throw(Error)
        })
        it("Should set jQuery to a new value", () => {
            let jQuery = () => {}
            BindingJS.$(jQuery)
            expect(BindingJS.$()).to.equal(jQuery)
        })
    })
    describe("debug", () => {
        it("Should return the debug level", () => {
            // Checks default
            expect(BindingJS.debug()).to.equal(9)
        })
        it("Should set a new debug level", () => {
            BindingJS.debug(8)
            expect(BindingJS.debug()).to.equal(8)
        })
    })
    describe("plugin", () => {
        it("Should allow to register Adapter", () => {
            let adapter = {
                getValue: () => {},
                getPaths: () => {},
                type: () => { return "model" }
            }
            let factory = () => {
                return adapter
            }
            BindingJS.plugin("foo", factory)
            expect(BindingJS.plugin("foo")).to.equal(adapter)
        })
        it("Should allow to register Connector", () => {
            let connector = {
                process: () => {}
            }
            let factory = () => {
                return connector
            }
            BindingJS.plugin("bar", factory)
            expect(BindingJS.plugin("bar")).to.equal(connector)
        })
    })
    describe("version", () => {
        it("Should return reasonable structure", () => {
            expect(BindingJS.version).to.have.keys([ "major", "minor", "micro", "date" ])
            expect(BindingJS.version.major).to.be.a("number").least(0)
            expect(BindingJS.version.minor).to.be.a("number").least(0)
            expect(BindingJS.version.micro).to.be.a("number").least(0)
            expect(BindingJS.version.date ).to.be.a("number").least(19700101)
        })
    })
    describe("abortSymbol", () => {
        it("Should be defined", () => {
            // Not so great chai here: https://github.com/chaijs/chai/issues/41
            /* jshint -W024 */
            /* jshint expr:true */
            expect(BindingJS.abortSymbol).to.exist
        })
    })
})

