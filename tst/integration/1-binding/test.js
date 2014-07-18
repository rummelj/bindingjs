/* global setTimeout */
module.exports = {
    test: function(model, window) {
        var $ = window.$
        
        describe("BindingJS Direction and Connector Test", () => {
            it("should one-way bind a model attribute to the view", (done) => {
                model.m2vText = "foobar"
                setTimeout(function() {
                    expect($("#m2v").text()).to.be.equal(model.m2vText);
                    done()
                }, 50)
            })
            
            it("should not one-way bind a model attribute to the view", (done) => {
                var oldVal = model.m2vText
                $("#m2v").text("foobar")
                setTimeout(function() {
                    expect(model.m2vText).to.be.equal(oldVal);
                    done()
                }, 50)
            })
            
            it("should one-way bind a view attribute to the model", (done) => {
                $("#v2m").val("foobar")
                setTimeout(function() {
                    expect(model.v2mValue).to.be.equal($("#v2m").val())
                    done()
                }, 50)
            })
            
            it("should not one-way bind a view attribute to the model", (done) => {
                var oldVal = $("#v2m").val()
                model.v2mValue = "foobar"
                setTimeout(function() {
                    expect($("#v2m").val()).to.be.equal(oldVal)
                    done()
                }, 50)
            })
            
            it("should two-way bind a view attribute to the model", (done) => {
                $("#twoway").val("foobar")
                setTimeout(function() {
                    expect(model.twowayValue).to.be.equal($("#twoway").val())
                    done()
                }, 50)
            })
            
            it("should two-way bind a model attribute to the view", (done) => {
                model.twowayValue = "foobar"
                setTimeout(function() {
                    expect($("#twoway").val()).to.be.equal(model.twowayValue)
                    done()
                }, 50)
            })
            
            it("should one-time bind a model attribute to the view", (done) => {
                model.otm2vText = "foobar"
                setTimeout(function() {
                    expect($("#otm2v").text()).to.be.equal(model.otm2vText)
                    
                    var oldValue = $("#otm2v").text()
                    model.otm2vText = "barquux"
                    setTimeout(function() {
                        expect($("#otm2v").text()).to.be.equal(oldValue)
                        done()
                    }, 50)
                }, 50)
            })
            
            it("should one-time bind a view attribute to the model", (done) => {
                $("#otv2m").text("foobar")
                setTimeout(function() {
                    expect(model.otv2mText).to.be.equal($("#otv2m").text())
                    
                    var oldValue = model.otv2mText
                    $("#otv2m").text("barquux")
                    setTimeout(function() {
                        expect(model.otv2mText).to.be.equal(oldValue)
                        done()
                    }, 50)
                }, 50)
            })
            
            it("should one-way bind a model attribute to the view with one connector", (done) => {
                model.m2vText = "foobar"
                setTimeout(function() {
                    expect($("#m2vc").text()).to.be.equal(model.m2vText.toUpperCase());
                    done()
                }, 50)
            })
            
            it("should one-way bind a model attribute to the view with two connectors", (done) => {
                model.m2vText = "  foobar  "
                setTimeout(function() {
                    expect($("#m2vcc").text()).to.be.equal(model.m2vText..trim().toUpperCase());
                    done()
                }, 50)
            })
            
            it("should one-way bind a view attribute to the model with one connector", (done) => {
                $("#v2mc").val("foobar")
                setTimeout(function() {
                    expect(model.v2mcValue).to.be.equal($("#v2mc").val().toUpperCase());
                    done()
                }, 50)
            })
            
            it("should one-way bind a view attribute to the model with two connectors", (done) => {
                $("#v2mcc").val("  foobar  ")
                setTimeout(function() {
                    expect(model.v2mcValue).to.be.equal($("#v2mc").val().trim().toUpperCase());
                    done()
                }, 50)
            })
            
            it("should two-way bind a model attribute to the view with one connector", (done) => {
                model.twowaycValue = "foobar"
                setTimeout(function() {
                    expect($("#twowayc").val()).to.be.equal(model.twowaycValue.toUpperCase());
                    done()
                }, 50)
            })
            
            it("should two-way bind a view attribute to the model with one connector", (done) => {
                $("#twowayc").val("foobar")
                setTimeout(function() {
                    expect(model.twowaycValue).to.be.equal($("#twowayc").val().toUpperCase());
                    done()
                }, 50)
            })
            
            it("should two-way bind a model attribute to the view with two connector", (done) => {
                model.twowayccValue = "foobar"
                setTimeout(function() {
                    expect($("#twowaycc").val()).to.be.equal("RABOOF");
                    done()
                }, 50)
            })
            
            it("should two-way bind a view attribute to the model with two connector", (done) => {
                $("#twowayc").val("foobar")
                setTimeout(function() {
                    expect(model.twowayccValue).to.be.equal("RABOOF");
                    done()
                }, 50)
            })
            
            it("should one-time bind a model attribute to the view with one connector", (done) => {
                model.otm2vText = "foobar"
                setTimeout(function() {
                    expect($("#otm2vc").text()).to.be.equal(model.otm2vText.toUpperCase())
                    
                    var oldValue = $("#otm2vc").text()
                    model.otm2vText = "barquux"
                    setTimeout(function() {
                        expect($("#otm2vc").text()).to.be.equal(oldValue)
                        done()
                    }, 50)
                }, 50)
            })
            
            it("should one-time bind a view attribute to the model with one connector", (done) => {
                $("#otv2mc").val("foobar")
                setTimeout(function() {
                    expect(model.otv2mcText).to.be.equal($("#otv2mc").val().toUpperCase())
                    
                    var oldValue = model.otv2mcText
                    $("#otv2mc").text("barquux")
                    setTimeout(function() {
                        expect(model.otv2mcText).to.be.equal(oldValue)
                        done()
                    }, 50)
                }, 50)
            })
            
            it("should two-way bind a view attribute to the model with one connector with direction logic", (done) => {
                $("#c").val("100 €")
                setTimeout(function() {
                    expect(model.cValue).to.be.equal("100");
                    done()
                }, 50)
            })
            
            it("should two-way bind a model attribute to the view with one connector with direction logic", (done) => {
                model.cValue = "100"
                setTimeout(function() {
                    expect($("#c")).to.be.equal("100 €");
                    done()
                }, 50)
            })
        })
    }
}