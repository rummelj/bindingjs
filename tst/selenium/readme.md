Test Instructions
-----------------

- Get Selenium IDE for Firefox (http://docs.seleniumhq.org/download/)
- Open about:config in firefox and change security.fileuri.strict_origin_policy to false
	to allow Selenium IDE to open local URLs
- Load the test suite bindingjs.seleniumsuite
- Open the first test case setEnv and modify the target of baseUrl to point
  to your local repository of BindingJS
- Open a new tab
- Press "Play entire test suite" in Selenium IDE