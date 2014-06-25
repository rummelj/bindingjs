
![BindingJS -- Separable, Reactive, Model-Agnostic View Data Binding](http://bindingjs.com/bindingjs-logo.png)

BindingJS
=========

Summary
-------

1. Binding Characteristics:
    - Separable      (via external file)
    - Reactive       (triggered by adapter observation events)
    - Model-Agnostic (via arbitrary adapters)
    - Declarative    ("what", not "how")

2. Core Concepts: 
    - Fundamental Building-Blocks
    - Base Functionality
    - Essentially Required

3. Convenience Concepts: 
    - Increased Expressiveness
    - Increased Usability
    - Increased Acceptance

Binding Specification Variants
------------------------------

### Embedded

<pre>&lt;<span class="marked">div</span> class="<span class="marked">list</span>" data-bind="<span class="marked">(persons) { text <- username }</span>"/&gt;
</pre>

<ul>
    <li class="pro">easy to understand (binding is directly attached to target node)</li>
    <li class="con">bindings have to be repeated (binding can be attached to a single node only)</li>
    <li class="con">no Separation of Concern (bindings and markup are interweaved)</li>
    <li class="con">no easy syntax highlighting and checking (bindings are embedded DSL of markup language)</li>
</ul>

### Programmatic 

<pre>BindingJS.create().binding("<span class="marked">div.list (persons) { text <- username }</span>")
</pre>

<ul>
    <li class="pro">full flexibility (binding specification can be dynamically generated)</li>
    <li class="con">no Separation of Concern (declarative bindings and imperative code are interweaved)</li>
    <li class="con">no easy syntax highlighting and checking (bindings are embedded DSL of programming language)</li>
</ul>

### Separate

<pre><span class="marked">div.list (persons) { text <- username }</span>
</pre>

<ul>
   <li class="pro">bindings have NOT to be repeated (binding can be attached to a multiple nodes)</li>
   <li class="pro">full Separation of Concern</li>
   <li class="pro">easy syntax highlighting and checking (bindings are separate DSL)</li>
</ul>

Core Concepts
-------------

- Selection
- Iteration
- Binding

### Selection: hierarchically select template nodes and create scope

<pre>
<span class="marked">body &gt; ul</span> {
    <span class="marked">li.item</span> { 
        [...]
    }
}
</pre>

### Iteration: repeat a template node zero, one or more times

<div class="listing"><pre>
ul (<span class="marked">length(data:items) > 0</span>) {
    li (<span class="marked">@item: data:items</span>) {
        text <- @item.name
    }
}
</pre></div>

### Binding: pass data between DOM and PM

<div class="listing"><pre>
input {
    <span class="marked">value <- data:name</span>
    <span class="marked">value -> data:name</span>
    <span class="marked">css:color <- colorize() <- data:isValid</span>
}
</pre></div>

Naming:

```
    on:blur +> value(def="foo") <- upper <- join(" ") <- title ?: "Mr.", firstname, lastname
    
    |--------------------------------------------------------------------------------------|  binding
    |-----|    |--------------|                          |---------------------------------|  resource sequence
                               |------------------------|                                     connector chain
    |---------|                                                                               initiator
           |--|                |--|     |--|         |--|                                     coupling
    
               |--------------|                          |------------|  |-------|  |------|  resource
                                   |---|    |-------|                                         connector
    
               |--------------|    |---|    |-------|    |------------|  |-------|  |------|  expression
                                   |---|    |-------|                                         pure-connector expression
               |--------------|                                          |-------|  |------|  pure-adapter   expression

    Binding {
        leftInitiator:    Resource*
        leftResources:    Resource+
        middleConnectors: Connector*
        rightResources:   Resource+
        rightInitiator:   Resource*
    }
```

Convenience Concepts
--------------------

- Identification
- Embedding
- Adapter
- Adapter Sequence
- Adapter Chaining
- Initiator
- Expression
- Parametrization
- Templating
- One-Time Binding
- Two-Way Binding

### Identification: optionally group and identify whole specifications

    @binding names {
        input.firstname { value <-> data:firstname }
        input.lastname  { value <-> data:lastname  }
    }


### Embedding: mark template nodes as embedding slots

    ul {
        li :: items
    }

### Adapter

### Adapter Sequence

    input {
        value -> split(/\s+/) -> data:firstname, data:lastname
        value <- join(" ")    <- data:firstname, data:lastname
    }

### Adapter Chaining

### Initiator

    input {
        on:blur +> value <-> data:username
        on:blur -> event:blurred
    }

### Expression

    div {
        value <- "No. " + (data:number + 1)
        class:disabled <- !data:isEnabled
    }

### Functions: functions for expressions

    div {
        value <- toUpper(data:name)
    }

### Parametrization: positional or named parameters for adapters and connectors

    input {
        value(default = "foo") -> split(/\s+/) -> data:firstname, data:lastname
    }



### Templating

### One-Time Binding

### Two-Way Binding




Binding Data Pools:
- DOM Source Fragment (Template)
- DOM Target Fragment
- DOM Temporary Variable Pool
- Presentation Model 

DOM Source Fragment (Template) Origin:
- separated HTML template fragment string (to be parsed)
- in-place DOM template fragment          (to be extracted)
- separated DOM template fragment         (as is)

Binding
 - 2    adapters
 - 0..n connectors (generator n>m, converter n>n, filter m>n)

Expression Variants:
- connector function: validate(//)      ==> read-write function
- adapter function:   $text()           ==> read-write function
- adapter expression: username + "foo"  ==> read-only  function

  << a <- b + c - 1
  >> a <- tmp() <- b, c
     tmp() = $1 + $2 - 1

Binding Directions:
- bi-directional                             <->
- uni-directional left-to-right               ->
- uni-directional right-to-left              <-
- uni-directional left-to-right one-time      ~>       title <~ i18n(...)
- uni-directional right-to-left one-time     <~

Binding Stream and Inputs/Outputs:
- a, b <- f <- c, d   =>  [a, b] = f(c, d)
- a    <- f <- c      =>   a     = f(c)

left-or-right-side:
- arbitrary expression
- adapter expression

middle:
- connector expression

binding

xx sequence
xx
adapter expression | arbitrary expression
adapter

connection chain
connection
connector expression
connector

- ??, ?:
- ohne {}
- naming

