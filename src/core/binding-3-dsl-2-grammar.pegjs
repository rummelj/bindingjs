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
    var AST = function (T, A, C) {
        return _api.dsl.AST(T, A, C).pos(line(), column(), offset())
    }
}


/*
**  ==== TOP-LEVEL ====
*/

spec
    =   b:blocks eof {
            return b
        }

blocks
    =   b:(_ block)* _ {
            return AST("Blocks").add(unroll(null, b, 1))
        }

block
    =   group
    /   rule

group
    =   "@binding" _ n:string _  "{" b:blocks "}" {  /* RECURSION */
            return AST("Group").set({ name: n.get("value") }).add(b)
        }

rule
    =   s:selectors _ i:iterator? _ ie:importExport? _ "{" b:(_ body _ ";"?)* _ "}" {
            return AST("Rule").add(s, i, ie, unroll(null, b, 1))
        }

iterator
    =   "(" _ v:(variable (_ "," _ variable)? _ ":")? _ e:expr _ ")" {
            return AST("Iterator").add(
                AST("Variables")
                    .add(v !== null ?                  v[0]    : null)
                    .add(v !== null && v[1] !== null ? v[1][3] : null),
                AST("Expr").add(e)
            )
        }

importExport
    =   "<<" _ id:id "(" _ p:exprSeq? _ ")" {
            return AST("Import").set({ id: id.get("id") }).add(p)
        }
    /   ">>" _ id:id "(" _ p:(variable (_ "," _ variable)*)? _ ")" {
            return AST("Export").set({ id: id.get("id") })
                .add(p !== null ? unroll(p[0], p[1], 3) : null)
        }

body
    =   rule      /* RECURSION */
    /   binding


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
    =   "[" _ name:$([a-zA-Z_][a-zA-Z0-9_-]*) _ op:selectorAttrOp _ value:selectorAttrValue _ "]"{
            return AST("Attr").set({ op: op }).add(AST("Name").set({ name  :name }), value)
        }
    /   "[" _ name:$([a-zA-Z_][a-zA-Z0-9_-]*) _ "]" {
            return AST("Attr").set({ op: "has" }).add(AST("Name").set({ name: name }), name)
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
    =   l:bindingAdaptionL _ c:bindingConnection _ r:bindingAdaptionR {
            return AST("Binding").add(l, c, r)
        }

bindingAdaptionL
    =   i:(exprSeq _ "+>" _)? e:exprSeq {
            return AST("Adapter").add(e).add(i !== null ? AST("Initiator").add(i[0]) : null)
        }

bindingAdaptionR
    =   e:exprSeq i:(_ "<+" _ exprSeq)? {
            return AST("Adapter").add(e).add(i !== null ? AST("Initiator").add(i[3]) : null)
        }

bindingConnection
    =   f:bindingOp l:(_ exprFunctionCall _ bindingOp)* {
            return AST("Connector").add(unroll(f, l, [ 1, 3 ]))
        }

bindingOp "binding operator"
    =   op:$("<->" / "<-" / "->" / "<~" / "~>") {
            return AST("BindingOperator").set({ value: op })
        }


/*
**  ==== EXPRESSION ====
*/

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
    /   e1:exprLogical _ "??" _ e2:expr {
            return AST("Conditional").add(e1, e2, e1)
        }
    /   e1:exprLogical _ "?:" _ e2:expr {
            return AST("Conditional").add(e1, e1, e2)
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
    =   op:$("&&" / "||") {
            return AST("LogicalOp").set({ op: op })
        }

exprRelational
    =   e1:exprAdditive e2:(_ exprRelationalOp _ expr)+ {
            return AST("Relational").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprAdditive

exprRelationalOp "relational operator"
    =   op:$("==" / "!=" / "<=" / ">=" / "<" / ">" / "=~" / "!~") {
            return AST("RelationalOp").set({ op: op })
        }

exprAdditive
    =   e1:exprMultiplicative e2:(_ exprAdditiveOp _ expr)+ {
            return AST("Arith").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprMultiplicative

exprAdditiveOp "additive arithmetic operator"
    =   op:$("+" / "-") {
            return AST("ArithOp").set({ op: op })
        }

exprMultiplicative
    =   e1:exprDereference e2:(_ exprMultiplicativeOp _ expr)+ {
            return AST("Arith").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprDereference

exprMultiplicativeOp "multiplicative arithmetic operator"
    =   op:$("*" / "/" / "%") {
            return AST("ArithOp").set({ op: op })
        }

exprDereference
    =   e1:exprOther e2:("." id)+ {
            return AST("Deref").add(unroll(e1, e2, 1))
        }
    /   e1:exprOther e2:("[" _ expr _ "]")+ {
            return AST("Deref").add(unroll(e1, e2, 2))
        }
    /   exprOther

exprOther
    =   exprArray
    /   exprHash
    /   exprLiteral
    /   exprFunctionCall
    /   exprVariable
    /   exprParenthesis

exprLiteral
    =   string
    /   regexp
    /   number
    /   value

exprFunctionCall
    =   v:variable "(" _ p:exprFunctionCallParams? _ ")" {  /* RECURSION */
            return AST("Func").set({ ns: v.get("ns"), id: v.get("id") }).add(p)
        }

exprFunctionCallParams
    =   f:exprFunctionCallParam l:(_ "," _ exprFunctionCallParam)* {
            return unroll(f, l, 3)
        }

exprFunctionCallParam
    =   id:id _ "=" _ e:expr {
            return AST("FuncParamNamed").set({ id: id.get("id") }).add(e)
        }
    /   e:expr {
            return AST("FuncParamPositional").add(e)
        }

exprVariable
    =   variable

exprParenthesis
    =   "(" _ e:expr _ ")" {  /* RECURSION */
             return e
        }

exprArray
    =   "[" _ f:expr? l:(_ "," _ expr)* _ "]" {
            return AST("Array").add(unroll(f, l, 3))
        }

exprHash
    =   "{" _ f:exprHashKV? l:(_ "," _ exprHashKV)* _ "}" {
            return AST("Hash").add(unroll(f, l, 3))
        }

exprHashKV
    =   k:id _ ":" _ v:expr {
            return AST("KeyVal").add(k, v)
        }


/*
**  ==== GENERIC ====
*/

id "identifier"
    =   id:$([a-zA-Z_][a-zA-Z0-9_]*) {
            return AST("Identifier").set({ id: id })
        }

variable "variable"
    =   ns:$([@$#%&]) id:$([a-zA-Z_][a-zA-Z0-9_-]*) {
            return AST("Variable").set({ ns: ns, id: id })
        }
    /   ns:$([a-zA-Z_][a-zA-Z0-9_]*) ":" id:$([a-zA-Z_][a-zA-Z0-9_-]*) {
            return AST("Variable").set({ ns: ns, id: id })
        }
    /   id:$([a-zA-Z_][a-zA-Z0-9_-]*) {
            return AST("Variable").set({ ns: "", id: id })
        }

bareword "bareword"
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
    =   n:$([+-]? [0-9]* "." [0-9]+ ([eE] [+-]? [0-9]+)?) {
            return AST("LiteralNumber").set({ value: parseFloat(n) })
        }
    /   n:$([+-]? [0-9]+) {
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

value "global value"
    =   "true"      { return AST("LiteralValue").set({ value: true      }) }
    /   "false"     { return AST("LiteralValue").set({ value: false     }) }
    /   "null"      { return AST("LiteralValue").set({ value: null      }) }
    /   "NaN"       { return AST("LiteralValue").set({ value: NaN       }) }
    /   "undefined" { return AST("LiteralValue").set({ value: undefined }) }


/*
**  ==== GLUE ====
*/

_ "optional blank"
    =   (co / ws)*

co "end-of-line or multi-line comment"
    =   "//" [^\r\n]*
    /   "/*" (!"*/" .)* "*/"

ws "any whitespaces"
    =   [ \t\r\n]+

eof "end of file"
    =   !.
