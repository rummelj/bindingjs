/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License (MPL), version 2.0. If a copy of the MPL was not distributed
**  with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

{
    /*  unroll an AST node sequence  */
    var unroll = _api.dsl.parser.unroll

    /*  generate an AST node  */
    var AST = function (T, A, C) { return _api.dsl.AST(T, A, C).pos(line(), column(), offset()) }
}


/*
**  ==== TOP-LEVEL ====
*/

spec
    =   b:(_ block)* _ eof {
            return AST("Spec").add(unroll(null, b, 1))
        }

block
    =   rule
    /   macroDef

rule
    =   s:selectors _ "{" b:(_ body)* _ "}" {
            return AST("Rule").add(s, unroll(null, b, 1))
        }

body
    =   rule      /* RECURSION */
    /   binding
    /   macroRef

macroDef
    =   "@" id:id "(" _ a:(id (_ "," _ id)*)? _ ")" _ "{" b:(_ binding)* _ "}" {
            return AST("MacroDef").set({ id: id.get("id") })
                .add(AST("MacroParams").add(unroll(a[0], a[1], 3)))
                .add(AST("MacroBody").add(unroll(null, b, 1)))
        }

macroRef
    =   "@" id:id "(" _ p:exprSeq _ ")" {
            return AST("MacroRef").set({ id: id.get("id") }).add(p)
        }


/*
**  ==== SELECTOR ====
**
**  http://dev.w3.org/csswg/selectors-4/
**  http://css4-selectors.com/selectors/
*/

selectors
    =   f:selector l:(_ "," _ selector)* {
            return AST("SelectorList").add(unroll(f, l, 3))
        }

selector
    =   f:selectorSingle l:(_ selectorCombinator _ selectorSingle)* {
            return AST("SelectorCombination").add(unroll(f, l, [ 1, 3 ]))
        }

selectorSingle
    =   s:"!"? c:selectorComponents {
            return AST("Selector").set({ subject: !!s }).add(c)
        }

selectorCombinator "selector combinator"
    =   ws   { return AST("Combinator").set({ type: "descendant" })        }
    /   ">"  { return AST("Combinator").set({ type: "child" })             }
    /   "+"  { return AST("Combinator").set({ type: "next-sibling" })      }
    /   "~"  { return AST("Combinator").set({ type: "following-sibling" }) }

selectorComponents
    =   f:selectorComponentElement l:selectorComponentRepeatable* {
            return unroll(f, l)
        }
    /   l:selectorComponentRepeatable+ {
            return l
        }

selectorComponentElement "element-selector"
    =   t:$("*" / [a-zA-Z0-9_-]+) {
            return AST("Element").set({ name: t })
        }

selectorComponentRepeatable
    =   selectorId
    /   selectorClass
    /   selectorAttr
    /   selectorPseudo

selectorId "id-selector"
    =   "#" t:$([a-zA-Z0-9-_$]+) {
            return AST("Id").set({ name: t })
        }

selectorClass "class-selector"
    =   "." t:$([a-zA-Z0-9-_$]+) {
            return AST("Class").set({ name: t })
        }

selectorAttr
    =   "[" _ name:id _ op:selectorAttrOp _ value:selectorAttrValue _ "]"{
            return AST("Attr").set({ op: op }).add(name, value)
        }
    /   "[" _ name:id _ "]" {
            return AST("Attr").set({ op: "has" }).add(name)
        }

selectorAttrOp "attribute operator"
    =   "="  { return "equal"    }
    /   "!=" { return "notequal" }
    /   "^=" { return "begins"   }
    /   "|=" { return "prefix"   }
    /   "*=" { return "contains" }
    /   "$=" { return "ends"     }

selectorAttrValue
    =   v:string    { return v }
    /   v:bareword  { return v }

selectorPseudo
    =   ":" t:selectorPseudoTagNameSimple {
            return AST("PseudoSimple").set({ name: t })
        }
    /   ":" t:selectorPseudoTagNameArg args:("(" _ string _ ")")? {
            return AST("PseudoArg").set({ name: t }).add(args[1])
        }
    /   ":" t:selectorPseudoTagNameComplex args:("(" _ selector _ ")")? {
            return AST("PseudoComplex").set({ name: t }).add(args[1])
        }

selectorPseudoTagNameSimple "name of pseudo-selector (simple)"
    =   "animated"      / "button"       / "checkbox"   / "checked"      / "disabled"
    /   "empty"         / "enabled"      / "even"       / "file"         / "first-child"
    /   "first-of-type" / "first"        / "focus"      / "header"       / "hidden"
    /   "image"         / "input"        / "last-child" / "last-of-type" / "odd"
    /   "only-child"    / "only-of-type" / "parent"     / "password"     / "radio"
    /   "reset"         / "root"         / "selected"   / "submit"       / "target"
    /   "text"          / "visible"

selectorPseudoTagNameArg "name of pseudo-selector (with simple argument)"
    =   "contains"
    /   "eq" / "gt" / "lt"
    /   "lang"
    /   "nth-child" / "nth-last-child" / "nth-last-of-type" / "nth-of-type" / "nth-of-type"

selectorPseudoTagNameComplex "name of pseudo-selector (with complex argument)"
    =   "has" / "not" / "matches"

/*
**  ==== BINDING ====
*/

binding
    =   f:bindingLink l:(_ bindingOp _ bindingLink)+ {
            return AST("Binding").add(unroll(f, l, [ 1, 3 ]))
        }

bindingLink
    =   exprSeq

bindingOp "binding operator"
    =   op:"<-"   { return AST("BindingOperator").set({ value: op }) }
    /   op:"<->"  { return AST("BindingOperator").set({ value: op }) }
    /   op:"->"   { return AST("BindingOperator").set({ value: op }) }

exprSeq
    =   f:expr l:(_ "," _ expr)* {
            return AST("ExprSeq").add(unroll(f, l, 3))
        }

expr
    =   exprConditional

exprConditional
    =   e1:exprLogical _ "?" _ e2:expr _ ":" _ e3:expr {
            return AST("Conditional").add(e1, e2, e3)
        }
    /   exprLogical

exprLogical
    =   "!" _ e:expr {
            return AST("LogicalNot").add(e)
        }
    /   e1:exprRelational e2:(_ exprLogicalOp _ expr)+ {
            return AST("Logical").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprRelational

exprLogicalOp "boolean logical operator"
    =   op:("&&" / "||") {
            return AST("LogicalOp").set({ op: op })
        }

exprRelational
    =   e1:exprAdditive e2:(_ exprRelationalOp _ expr)+ {
            return AST("Relational").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprAdditive

exprRelationalOp "relational operator"
    =   op:("==" / "!=" / "<=" / ">=" / "<" / ">" / "=~" / "!~") {
            return AST("RelationalOp").set({ op: op })
        }

exprAdditive
    =   e1:exprMultiplicative e2:(_ exprAdditiveOp _ expr)+ {
            return AST("Arith").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprMultiplicative

exprAdditiveOp "additive arithmetic operator"
    =   op:("+"/"-") {
            return AST("ArithOp").set({ op: op })
        }

exprMultiplicative
    =   e1:exprOther e2:(_ exprMultiplicativeOp _ expr)+ {
            return AST("Arith").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprOther

exprMultiplicativeOp "multiplicative arithmetic operator"
    =   op:("*" / "/") {
            return AST("ArithOp").set({ op: op })
        }

exprOther
    =   exprLiteral
    /   exprDereference
    /   exprFunctionCall
    /   exprVariable
    /   exprParenthesis

exprLiteral
    =   string
    /   regexp
    /   number

exprDereference
    =   "." id:id {
            return AST("Deref").set({ id: id.get("id") })
        }
    /   "[" _ e:expr _ "]" {
            return AST("Deref").add(e)
        }

exprFunctionCall
    =   id:id "(" _ p:exprSeq? _ ")" {
            return AST("Func").set({ id: id.get("id") }).add(p)
        }

exprVariable
    =   id:id {
            return AST("Var").set({ id: id.get("id") })
        }

exprParenthesis
    =   "(" _ e:expr _ ")" {
             return e
        }

/*
**  ==== GENERIC ====
*/

id "identifier"
    =   id:$(("\\" . / [a-zA-Z_][a-zA-Z0-9_]*)+) {
            return AST("Identifier").set({ id: id.replace(/\\/g, "") })
        }

bareword "bareword (FIXME: still unused)"
    =   bw:$(("\\" . / [a-zA-Z0-9_])+) {
            return AST("LiteralBareword").set({ value: bw.replace(/\\/g, "") })
        }

string "quoted string literal"
    =   "\"" s:((stringEscapedChar / [^"])*) "\"" {
            return AST("LiteralString").set({ value: s.join("") })
        }
    /   "'" t:$(("\\'" / [^'])*) "'" {
            return AST("LiteralString").set({ value: t.replace(/\\'/g, "'") })
        }

stringEscapedChar "escaped string character"
    =   "\\\\" { return "\\"   }
    /   "\\\"" { return "\""   }
    /   "'"    { return "'"    }
    /   "\\b"  { return "\b"   }
    /   "\\v"  { return "\x0B" }
    /   "\\f"  { return "\f"   }
    /   "\\t"  { return "\t"   }
    /   "\\r"  { return "\r"   }
    /   "\\n"  { return "\n"   }
    /   "\\e"  { return "\x1B" }
    /   "\\x" n:$([0-9a-fA-F][0-9a-fA-F]) {
            return String.fromCharCode(parseInt(n, 16))
        }
    /   "\\u" n:$([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {
            return String.fromCharCode(parseInt(n, 16))
        }

regexp "regular expression literal"
    =   "/" re:$(("\\/" / [^/])*) "/" {
            var v
            try { v = new RegExp(re.replace(/\\\//g, "/")) }
            catch (e) { error(e.message) }
            return AST("LiteralRegExp").set({ value: v })
        }

number "numeric literal"
    =   n:$([+-]? [0-9]+) {
            return AST("LiteralNumber").set({ value: parseInt(n, 10) })
        }
    /   n:$([+-]? [0-9]* "." [0-9]+ ([eE] [+-] [0-9]+)?) {
            return AST("LiteralNumber").set({ value: parseInt(n, 10) })
        }
    /   s:$([+-]?) "0x" n:$([0-9a-fA-F]+) {
            return AST("LiteralNumber").set({ value: parseInt(s + n, 16) })
        }
    /   s:$([+-]?) "0o" n:$([0-7]+) {
            return AST("LiteralNumber").set({ value: parseInt(s + n, 8) })
        }
    /   s:$([+-]?) "0b" n:$([01]+) {
            return AST("LiteralNumber").set({ value: parseInt(s + n, 2) })
        }

_ "optional blank"
    =   (co / ws)*

co "end-of-line or multi-line comment"
    =   "//" (![\r\n] .)*
    /   "/*" (!"*/" .)* "*/"

ws "any whitespaces"
    =   [ \t\r\n]+

eof "end of file"
    =   !.
