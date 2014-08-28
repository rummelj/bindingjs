describe("BindingJS Integration", () => {
    it("should execute all testcases", (done) => {
        var jsdom = require("jsdom")
        jsdom.defaultDocumentFeatures = {
            FetchExternalResources   : ["script"],
            ProcessExternalResources : ["script"],
            MutationEvents           : true,
            QuerySelector            : true
        };

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
        
        var executeTestCases = (testcases, index) => {
            var testCase = testcases[index];
            var dir = __dirname + "/" + testCase
            
            var template = fs.readFileSync(dir + "/view.html") + ""
            var binding = fs.readFileSync(dir + "/view.bind") + ""
            jsdom.env({
                html: intro + template + outro,
                // TODO: Add bindingjs
                scripts: [__dirname + "/../res/jquery-2.1.1.min.js"],
                done: (errors, window) => {
                    if (errors) {
                        throw errors;
                    }
                    var model = require(dir + "/model.json");
                    //var setup = require(dir + "/setup.js")
                    var test = require(dir + "/test.js")
                    
                    BindingJS
                        .$(window.$)
                        .create()
                        .template("#template")
                        .binding(binding)
                        .model(model)
                        .mount("#template")
                        .activate()
                    console.log("Binding JS created succesfullly")
                        
                    // TODO: Adapt setup
                    // setup.setup(bindingjs);
                    
                    test.test(model, window);
                    
                    // Recursion
                    if (index + 1 < testcases.length) {
                        executeTestCases(testcases, index + 1)
                    } else {
                        done()
                    }
                }
            });
        }
        executeTestCases(getDirectories(fs, __dirname), 0);
    })
})