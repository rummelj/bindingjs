/* global setTimeout */
module.exports = {
    test: function(model, window) {
        var $ = window.$
        
        describe("BindingJS Direction and Connector Test", () => {
            it("should one-way bind a model attribute to the view", (done) => {
                // Test Success
                model.m2vText = "foobar"
                $("#m2v").one("change", () => {
                    // TODO
                    // expect($("#m2v").text()).to.be.equal(model.m2vText);
                    
                    // Test Failure
                    $("#m2v").one("change", () => {
                        // Should not be called
                        throw "View was changed"
                    })
                    model.m2vText = "otherText"
                    // Wait for error to occur
                    setTimeout(done, 50)
                })
                
                // TODO: Remove
                $("#m2v").trigger("change")
            })
        })
    }
}