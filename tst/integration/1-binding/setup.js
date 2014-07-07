module.exports = {
    setup: function(bindingjs) {  
        bindingjs.registerConnector = function(){}
        bindingjs.init = function(){}
        
        bindingjs.registerConnector({ 
            "uppercase" : function (value) {
                return value.toUpperCase();
            },
            "trim" : function (value) {
                return value.trim();
            },
            "format" : function (value, m2v) {
                if (m2v) {
                    return value + " €"
                } else {
                    return value.substring(0, value.length - 2)
                }
            }
        })
        bindingjs.registerConnector("reverse", function (value) {
            return value.split("").reverse().join("");
        })
    }
}