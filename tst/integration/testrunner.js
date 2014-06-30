describe("BindingJS Integration", function () {
    var cheerio = require("cheerio")
    var fs = require("fs")
    
    /* Gets all sub directories in dir */
    var getDirectories = (fs, dir) => {
        var files = fs.readdirSync(dir)
        var result = []
        files.forEach((file) => {
            var stat = fs.statSync(dir + "/" + file)
            if (stat.isDirectory()){
                result.push(file)
            }
        })
        return result
    }

    var intro = fs.readFileSync(__dirname + "/wrapperIntro.html")
    var outro = fs.readFileSync(__dirname + "/wrapperOutro.html")
    
    getDirectories(fs, __dirname).forEach((testCase) => {
        var dir = __dirname + "/" + testCase
        
        var template = fs.readFileSync(dir + "/view.html")
        var $ = cheerio.load(intro + template + outro);
        
        var model = require(dir + "/model.json");
        var setup = require(dir + "/setup.js")
        var test = require(dir + "/test.js")
        
        setup.setup(BindingJS);
        BindingJS.init($, model);
        test.test(model, $);
    });
})