function test(model, $) {
    return describe("BindingJS Direction and Connector Test", function() {
        it("should one-way bind a model attribute to the view") {
            expect(model.m2vText).to.be.equal($(#m2v).text());
        }
    })
}