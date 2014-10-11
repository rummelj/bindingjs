Test Instructions
-----------------

- Get Selenium IDE for Firefox (http://docs.seleniumhq.org/download/)
- Open about:config in firefox and change security.fileuri.strict_origin_policy to false
	to allow Selenium IDE to open local URLs
- Load the test suite bindingjs.seleniumsuite
- Open the first test case setEnv and modify the target of baseUrl to point
  to your local repository of BindingJS
- Open a new tab
- Set the execution speed of the test cases to ~90% (This is necessary since Firefox does not yet support Object.observe and uses the fallback polling of the Model)
- Press "Play entire test suite" in Selenium IDE
