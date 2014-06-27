function test(model, $) {
    return describe("BindingJS Direction and Connector Test", function() {
        it("should one-way bind a model attribute to the view") {
            expect(model.m2vText).to.be.equal($("#m2v").text());
            
            // Changes to model should propagate to view
            var newText = "foo"
            model.m2vText = newText;
            expect($("#m2v").text()).to.be.equal(newText);
            
            // Changes to view should not propagate to model
            $("#m2v").text(newText + newText);
            expect(model.m2vText).to.be.equal(newText);
        }
    })
}