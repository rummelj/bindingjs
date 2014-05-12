/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

describe("BindingJS API Management", function () {
    describe("symbol()", function () {
        it("cannot be tested in Node's CommonJS environment", function () {
            /*  cannot be tested  */
        })
    })
    describe("version()", function () {
        it("should return reasonable structure", function () {
            expect(BindingJS.version).to.have.keys([ "major", "minor", "micro", "date" ])
            expect(BindingJS.version.major).to.be.a("number").least(0)
            expect(BindingJS.version.minor).to.be.a("number").least(0)
            expect(BindingJS.version.micro).to.be.a("number").least(0)
            expect(BindingJS.version.date ).to.be.a("number").least(19700101)
        })
    })
})

