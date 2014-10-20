![BindingJS -- Separable, Reactive, Model-Agnostic View Data Binding](https://raw.githubusercontent.com/rummelj/bindingjs/master/resources/logo.png)

BindingJS is a view data binding library for single page web applications. Another one? Yes! One that combines all the cool stuff, you may already know from other libraries like Knockout or AngularJS. BindingJS is not completely different, but has unique characteristics, that will convince you.

**Separable**  
The binding is not mixed up with the HTML of the page, but defined in a separate place much like CSS. This makes it not only easier to understand and maintain, but also allows a more compact and powerful syntax. In addition, less code has to be repeated and the bad syntax highlighting in attribute strings is a thing of the past. You ever heard of *Separation of Concerns*? Here it is!

**Reactive**  
BindingJS propagates changes of values and follows the idea of reactive programming. Your users will be thankful, if your web page immediately updates without a reload or any nasty wait times.

**Model-Agnostic**  
Any access to the View Model or Presentation Model is made exclusively through a component called Adapter. This means, that BindingJS can be adapted to any kind of Model implementation such as JSON objects, Knockout Observables or Backbone Models by just exchanging a single component.

Have you ever noticed a web page flickering especially on a mobile device? This was probably caused by the binding library that changed more than necessary to render changes. BindingJS uses [surgical updates](https://github.com/rummelj/bindingjs/wiki/Surgical-Updates) taking care, that the modification of html is always minimal no matter if a list or an attributes is modified.

Getting Started
---------------

To start using BindingJS just **[download](https://github.com/rummelj/bindingjs/releases)** its latest version, which includes the library itself and a set of Model Adapters. If there is no Adapter for your Model yet, you can easily [implement your own](https://github.com/rummelj/bindingjs/wiki/How-to-Write-an-Adapter). After that, use the [examples](https://github.com/rummelj/bindingjs/tree/master/examples) to get a first impression and to have a starting point for your experiments. To get the most out of BindingJS you need to learn how to interact with it through its API and what the syntax of its domain specific language is.

API
---

Here is a simple example, that two way binds the value of a text box to an attribute of the Model. Although it is very simple and artificial, it shows a great deal of the API, that you're most likely to use first.

```HTML
<html>
  <head>
    <title>BindingJS - API Example</title>
    <!-- jQuery is the only dependency of BindingJS -->
    <script src="jQuery.js"></script>
    <!-- Include BindingJS -->
    <script src="binding.js"></script>
    <!-- Include a JSON Model Adapter -->
    <script src="binding.adapter.model.json.js"></script>
    <!-- This is the external Binding Specification -->
    <script type="text/binding">
        // Select the text box
        #username {
            // Bind the value of the text box to the
            // model attribute username. $ is the Model
            // Adapter and value is a view Adapter
            value <-> $username
        }
    </script>
    <script type="text/javascript">
        // This is the Model
        var model = {
            username: "John Doe"
        }
      
        // On Page Ready
        $(function() {
            BindingJS
              .create() // Create an instance
              .template("#template") // Set the template
              .binding($("script[type='text/binding']")) // Set the Binding
              .model(model) // Set the model
              .mount("#template") // Mount the bound template
              .activate() // Activate the binding
        })
    </script>
  </head>
  <body>
      <!-- This is the Template -->
      <div id="template">
        <input id="username" type="text" />
      </div>
  </body>
</html>
```

As you can see, BindingJS allows you to fluently chain calls to cut down the amount of code to a minimum. In addition, all of its methods are highly polymorphic, so that you could pass the template and the binding as a string, too. To not bloat this overview, please enquire the wiki for a [full documentation of BindingJS' API](https://github.com/rummelj/bindingjs/wiki/Application-User-Interface-(API)).

Syntax
------

BindingJS differentiates between *Core* and *Convenience Concepts* as well as between *Binding* and *Structure Concepts*. All Convenience Concepts could also be expressed with Core Concepts and Structure Concepts do not deal with data binding, but the structure of applications. Surprisingly there are only three real Core Binding Concepts, which are *Selection*, *Binding* and *Iteration*, so we explain them first.

###Selection

BindingJS' selection syntax is inspired by [Less](http://lesscss.org/), which among other features allows to nest CSS selectors. In contrast to CSS, however, BindingJS expects Bindings instead of Style instructions.

```JavaScript
#wrapper {
  // <Binding-1>
  div > .input, span {
    // <Binding-2>
  }
  // <Binding-3>
  div {
    div + p {
      // <Binding-4>
      // <Binding-5>
    }
    .empty {}
  }
  // <Binding-6>
}
```

A *Scope* consists of one or more CSS selectors separated by commas and a *Scope Body* that is enclosed in curly braces. The Scope Body may contain *Bindings* or other Scopes, which can be seen as a Tree of Scopes. Each Scope slices a portion out of the template, which can be refined when nesting deeper. The idea is, that any Binding applies to all elements that are matched by its enclosing Scope. In the example the first and last Binding would apply to any elements of the template which have *wrapper* as their id. Assuming that there is exactly one such wrapper element, the second Binding would then apply to all of its descendants which are either a *span* or have the class *input* a *div* as their parent. Here is the same example without nesting. Obviously more code has to be repeated now.

```JavaScript
#wrapper {
  // <Binding-1>
  // <Binding-3>
  // <Binding-6
}
#wrapper div > .input {
  // <Binding-2>
}
#wrapper span {
  // <Binding-2>
}
#wrapper div div + p {
  // <Binding-4>
  // <Binding-5>
}
#wrapper div .empty {}
```

###Binding

BindingJS synchronizes values from three data targets, namely the *Model*, *View* and the *Binding Scope*. The binding scope is an artificial temporary variable pool that is useful to store intermediate values and give them aliases. Also, BindingJS uses it to realize *Iteration*. Each of these data targets is accessed through an Adapter, that has a *Prefix* and a *Qualifier*. By default the prefix of the model adapter is $ and that of the binding scope adapter is @. There are multiple [view adapter](https://github.com/rummelj/bindingjs/wiki/List-of-View--Adapter) such as *value*, *text*, *attr* or *on* that are already included in BindingJS. The qualifier of an adapter is a static instruction for the Adapter and is written directly behind the prefix, if that is only one character long. Otherwise it is separated by a colon from the prefix.

```
$username // Prefix = $,     Qualifier = username
value     // Prefix = value, Qualifier = (none)
attr:id   // Prefix = attr,  Qualiifier = id
@temp     // Prefix = @,     Qualifier = temp
```

Apart from adapter there are *Connectors*, that may manipulate values as they are propagated through a binding. BindingJS comes with a small amount of [connectors](hhttps://github.com/rummelj/bindingjs/wiki/List-of-Connectors) such as the debug connector, but mainly you'll need them to execute your individual business logic. BindingJS allows to register new connectors, that [can be easily implemented](https://github.com/rummelj/bindingjs/wiki/How-to-Write-a-Connector) as a function receiving and producing values. A binding consists of two adapters on its ends and any number of connectors in between. All parts are connected with arrows that indicate the direction of the binding.

```
// Whenever the username attribute from the presentation model changes
// uppercase it and write it into value. Value refers to the elements matched
// by the selector of the surrounding scope
value <- uppercase <- $username

// Alias an attribute with the binding scope
@nI <- $netIncome

// Whenever the value of an element changes, store it in the model attribute
// username
value -> $username
```

There is one specialty about the binding scope adapter. If it is used within a scope, it becomes visible to all descendants of that scope. This means, that the same qualifier for the binding scope might not necessarily refer to the same value, if its used within sibling scopes.

```
span {
  @notTheSame <- text
}
input {
  @notTheSame <- value
}
```

One use case for the binding scope adapter is to realize dependent view elements. Imagine the situation, where you want to only enable a submit button, if the value of a text box is not empty. 

```
div {
  // Define in parent
  @isEmpty <~ false
  input {
    @isEmpty <- value === ""
  }
  button {
    attr:enabled <- !@isEmpty
  }
}
```

###Iteration

It is common to iterate certain parts of a user interface for instance to show a list of names or options. In BindingJS this can be done by providing additional information after the selector of a scope.

```
// With Element and Index
li (@element, @index: $collection) {
  // Do something with @element and @index
  text <- @index + ". " + @element.name
}

// Element only
li (@name: $names) {
  // Do something with @name
  text <- @name
}

// Conditional hide or display elements
div (@showFooter) {
  ...
}
```

As you can see, conditionally hiding or displaying is a special case of iteration. It basically means to iterate something zero times or once. This means that if the last adapter or expression within the brackets after a scope returns a Boolean value, the iteration is either shown or not. If it returns something that can be iterated including arrays and objects, the template is duplicated for each element in the collection and the binding within the iteration applied to each individually with the correct element and index stored in the binding scope adapters provided by you.  What's nice about this, is that here the binding scope adapter starts to really make sense, because it is just an alias for the current element or its index. Considering the inheritance, it is obvious, that you cannot use their qualifiers in any parent, so that they all are actually different.  
Another thing to note is that you get those surgical updates mentioned earlier for free with this. If $collection or $names from the example changes, only those elements in the view are touched, which actually changed.

- You must use the binding scope adapter to store the current element and index of the iteration.
- Iterations may be nested.
- The part that is repeated is defined by the selector of the scope. Other libraries only repeat all descendants, but BindingJS also repeats the root. This means, that you can have multiple iterations next to each other without the necessity of an artificial wrapper element. If there are no items in the iteration, BindingJS remembers the position of the iteration by using a comment tag for reference.
- If the selector of an iterated scope matches more than one element, each of them is iterated individually
- The same element of the template may not be iterated twice or more times
- If the last adapter for the iteration is a view adapter it refers to the element matched by its parent. If there is no parent, it is not allowed to use the view adapter.

With selection, binding and iteration everything that is conceptually necessary for view data binding is already present. The convenience binding concepts that we present now are only syntactic sugar to make your life (a lot) easier. If you're interested in the theory behind the reduction of these convenience concepts to selection, binding and iteration, please have a look at the [master's thesis](TODO), which is the theoretical foundation of this library.

###Two-Way Binding

In addition to just `<-` and `->` you may also use `<->` to realize two bindings with one.

```
value <-> trim <-> $username
// Equals
// value <- trim <- $username
// value -> trim -> $username

@temp <-> $someAttribute
// Equals
// @temp <- $someAttribute
// @temp -> $someAttribute
```

###One-Time Binding

Apart from the arrows so far, you can also use `<~` and `~>`, which expresses a binding that is exactly executed once. This can be used to initialize binding scope variables or to set view attributes more efficiently, if they do not change.

```
@count <~ 0
text <~ $welcomeMessage
```

###Sequence

Instead of just one adapter on the left or right of a binding, you may also use a list of adapter separated by commas.

```
@temp1, @temp2 <~ false, 0
// Equals
// @temp1 <~ false
// @temp2 <~ 0

// Some more examples
@dirtyValue -> sanitize -> @sanitizedValue, @valueValid
@fullName -> split -> @firstName, @lastName
@time, @day -> makeDate -> @date
@min, @max, @average <- stats <- $numbers[0], $numbers[1], $numbers[2]
```

###Initiator

By default, a binding is propagated, if (one of) its source adapter notifies BindingJS about a change through its observation mechanism. If this is however not wished, two adapter may be combined into a new adapter by borrowing the observation functionality from one and the retrieving functionality from another.

```
value -> $username
```

By default, the value adapter listens to the change event of the text box. If you, however, want, that the value is propagated to `$username` as soon as a key is pressed you can use the *on* adapter.

```
on:keyup +> value -> $username
```

`on:keyup` now acts as an initiator and is observed instead of `value`, which is still used to retrieve the value that is propagated through the binding.

- You may use sequences of initiators like `on:change, on:keyup, on:keydown +> ...`
- You can initiate a sequence of adapter
- If an initiator is used with the sink of a binding it has no effect, since the sink of a binding is never observed anyway.

###Parameter

Both adapter and connectors may have name based or positional parameters.

```
on:keydown("enter") +> value -> split(token: " ") -> $firstname, $lastname
on:keydown("f1", "f2", "f3", "f4") +> true -> @fButtonPressed
```

###Expression

Here the fun part starts. BindingJS supports a variety of expressions that make your life easier. You can use expression, wherever adapter were allowed until now. This includes the sources of bindings, parameters, expressions for iterations and so on.

```
@formValid <- (@textFilled || @denyClicked) && @passwordValid
...
// Increase counter on every click
on:click +> @count + 1 -> @count
...
#footer ($todos.count > 0) {
  // Only show footer if at least one todo
}
```

The available set of expressions includes literal values and compound expressions.

**Literals**

| Name               | Description                                                                                                                | Examples                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| Static Value       |                                                                                                                            | true, false, null, NaN, undefined         |
| Number             | Numeric values supporting signs, decimal points and exponents. Further hexadecimal, octal and binary numbers are possible. | +314.592654e-2, 0xABAD1DEA, 0b101010      |
| Regular Expression | Special string literal, that requires less escaping                                                                        | /[a-z]/, /\[A-Z0-9]+@[A-Z0-9]+[A-Z]2,4\b/ |
| Quoted String      | Might comprise only ASCII characters or escapes for UTF-8 encoded characters                                               |                                           |

**Compound**

| Name           | Syntax                                                      | Examples                                                           |
|----------------|-------------------------------------------------------------|--------------------------------------------------------------------|
| Conditional    | `Expr ? Expr : Expr`<br>`Expr ?: Expr`                      | `$checked ? $password : "*****"`<br>`$name ?: "Please enter name"` |
| Logical        | `!Expr`<br>`Expr && Expr`<br>`Expr || Expr`                 | `!$checked`<br>`$checked && $valid`<br>`$toBe || !$toBe`           |
| Relational     | `Expr == Expr`<br>`Expr === Expr`<br>`Expr != Expr`<br>`Expr !== Expr`<br>`Expr <= Expr`<br>`Expr >= Expr`<br>`Expr < Expr`<br>`Expr > Expr`<br> | `"3" == 3`<br>`$name === "admin"`<br>`$duration != 0`<br>`0 !== false`<br>`$age <= 120`<br>`$end >= $start`<br>`!($money < $cost)`<br>`$amount > 0`|
| Additive       | `Expr + Expr`<br>`Expr - Expr`                              | `$price + $tax`<br>`$price - $discount`                            |
| Multiplicative | `Expr * Expr`<br>`Expr / Expr`<br>`Expr % Expr`             | `$quantitiy * $price`<br>`$sea / 2`<br>`$people % $groupSize`      |
| Dereference    | `Expr(.Id)+`<br>`Expr([Expr])+`                             | `@person.name`<br>`@person["na" + "me"]`                           |
| Array          | `[Expr (, Expr)*]`                                          | `[$name , "Tom", 5]`                                               |
| Hash           | `{(Id:Expr)? (, Id:Expr)*}`                                 | `{name: $name, age: 25}`                                           |
| Parenthesis    | `(Expr)`                                                    | `!(@foo && (@bar || @baz))`                                        |

The two core structure concepts offered by BindingJS are *Identification* and *Insertion*

###Identification

```
@binding whole {
  @binding partOne {
    div {
      ...
    }
    @binding partOneSub {
      ...
    }
  }
  @binding partTwo {
  
  }
}
```

Identification allows naming and later identifying certain parts of a binding specification. Syntactically it can be placed, wherever a scope could be placed. One of its purposes is to only use a certain part of the binding specification. Please refer to the [API documentation](https://github.com/rummelj/bindingjs/wiki/Application-User-Interface-(API)) for more information.

###Insertion

Insertion allows marking certain parts of the template as hooks for external content. A possible use case would be that you want to initialize a third-party library for each item that is created when iterating a collection.

```
...
@binding foo {
  ...
  .hook::mySocket
  ...
}
```

The scope that is marked as an insertion point may not have a body. With such a socket defined it is now possible, to observe when instances of it are created or destroyed.

```
var binding = BindingJS.create()
binding.socket("foo.mySocket").onInsert(function(keys, element) { ... })
```

It is also possible to get the current number of instances and iterate them. Please refer to the [API documentation](https://github.com/rummelj/bindingjs/wiki/Application-User-Interface-(API)) for more information.


We provided only examples for the syntax. If you are brave enough, look at the [grammar specification](https://github.com/rummelj/bindingjs/blob/master/src/core/dsl/grammar.pegjs) to get the best and most accurate documentation available. If that's not your thing, just go on and try, the parser recognizes errors and tells you exactly where it didn't find what it expected.

Debugging
---------

If your binding behaves different than you expect, you can use the debug connector that comes with BindingJS to see when a binding is propagated. It logs to the console any inputs it receives and is otherwise a no-op.

```
@what, @is, @going -> debug -> @on, @here
```

If this does not help you, please [create an issue](https://github.com/rummelj/bindingjs/issues/new) and we'll be in touch as soon as we can.

How to Contribute
-----------------

If you want to help, there are many possibilities:

1. Star BindingJS
2. Tell your friends and colleagues about BindingJS
3. Try out BindingJS
4. [Create an issue](https://github.com/rummelj/bindingjs/issues/new) for every bug or problem you face and give us feedback
5. Help developing BindingJS by working on issues or stuff, you may think suitable. Please [create an issue](https://github.com/rummelj/bindingjs/issues/new) before you commit larger changes to the code base, so we can discuss the implications.

Your help is much appreciated!

Developer Setup
---------------

```
npm install
grunt
```

The tasks `clean`, `test` and `watch` are also available for grunt. There are additional Selenium IDE test cases. You can find [instructions on how to run them](https://github.com/rummelj/bindingjs/tree/master/test/selenium) in the test sub directory.
