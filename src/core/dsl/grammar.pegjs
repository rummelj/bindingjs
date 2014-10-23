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
        return _api.util.Tree(T, A, C).pos(line(), column(), offset())
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
    /   scope

group
    =   "@binding" ws n:id ws "{" b:blocks "}" {  /* RECURSION */
            return AST("Group").set({ id: n.get("id") }).add(b)
        }

scope
    =   s:selectors _ i:scopeIterator? _ e:scopeExport? _ "{" b:(_ scopeBody _ ";"?)* _ "}" {
            return AST("Scope").add(s, i, e, unroll(null, b, 1)).set("text", text())
        }
    /   s:selectors _ x:(scopeLabel / scopeIterator / scopeImport / scopeExport) {
            return AST("Scope").add(s, x).set("text", text())
        }

scopeLabel
    =   "::" _ id:id {
            return AST("Label").set({ id: id.get("id") })
        }

scopeIterator
    =   "(" _ v:(variable (_ "," _ variable)? _ ":")? _ e:expr _ ")" {
            return AST("Iterator").add(
                AST("Variables")
                    .add(v !== null ?                  v[0]    : null)
                    .add(v !== null && v[1] !== null ? v[1][3] : null),
                AST("Expr").add(e)
            )
        }

scopeImport
    =   "<<" _ id:id "(" _ p:exprSeq? _ ")" {
            return AST("Import").set({ id: id.get("id") }).add(p)
        }

scopeExport
    =   ">>" _ id:id "(" _ p:(variable (_ "," _ variable)*)? _ ")" {
            return AST("Export").set({ id: id.get("id") })
                .add(p !== null ? unroll(p[0], p[1], 3) : null)
        }

scopeBody
    =   binding
    /   block        /* RECURSION */


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
    =   "!"? selectorComponents (selectorCombinator _ "!"? selectorComponents)* {
            return AST("SelectorCombination").set("text", text())
        }
    
selectorCombinator "selector combinator"
    =   ws
    /   _ ">"
    /   _ "+"
    /   _ "~"

selectorComponents
    =   $("*" / [a-zA-Z0-9_-]+) selectorComponentRepeatable*
    /   selectorComponentRepeatable+

selectorComponentRepeatable
    =   ("#" / ".") $([a-zA-Z0-9-_$]+) // Id or class
    /   selectorAttr
    /   selectorPseudo

selectorAttr
    =   "[" _ $([a-zA-Z_][a-zA-Z0-9_-]*) (_ selectorAttrOp _ (string / bareword))? _ "]"

selectorAttrOp "attribute operator"
    =   "="
    /   "!="
    /   "^="
    /   "|="
    /   "*="
    /   "$="

selectorPseudo
    =   ":" bareword ("(" _ [^\)]* _ ")")?
    /   ":" bareword ("(" _ selector _ ")")?

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
    =   f:bindingOp l:(_ connector _ bindingOp)* {
            return AST("ConnectorChain").add(unroll(f, l, [ 1, 3 ]))
        }

connector
    =   i:id p:parameters? {
            return AST("Connector").set({ id: i.get("id") }).add(p)
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
    =   e1:exprLogical _ "?" _ e2:expr _ ":" _ e3:expr {  /* RECURSION */
            return AST("Conditional").add(e1, e2, e3)
        }
    /   e1:exprLogical _ "?:" _ e2:expr {  /* RECURSION */
            return AST("Conditional").add(e1, e1, e2)
        }
    /   exprLogical

exprLogical
    =   "!" _ e:expr {  /* RECURSION */
            return AST("LogicalNot").add(e)
        }
    /   e1:exprRelational e2:(_ exprLogicalOp _ exprRelational)+ {  /* RECURSION */
            return AST("Logical").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprRelational

exprLogicalOp "boolean logical operator"
    =   op:$("&&" / "||") {
            return AST("LogicalOp").set({ op: op })
        }

exprRelational
    =   e1:exprAdditive e2:(_ exprRelationalOp _ exprAdditive)+ {  /* RECURSION */
            return AST("Relational").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprAdditive

exprRelationalOp "relational operator"
    =   op:$("===" / "==" / "!==" / "!=" / "<=" / ">=" / "<" / ">") {
            return AST("RelationalOp").set({ op: op })
        }

exprAdditive
    =   e1:exprMultiplicative e2:(_ exprAdditiveOp _ exprMultiplicative)+ {  /* RECURSION */
            return AST("Additive").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprMultiplicative

exprAdditiveOp "additive arithmetic operator"
    =   op:$("+" / "-") {
            return AST("AdditiveOp").set({ op: op })
        }

exprMultiplicative
    =   e1:exprDereference e2:(_ exprMultiplicativeOp _ exprDereference)+ {  /* RECURSION */
            return AST("Multiplicative").add(unroll(e1, e2, [ 1, 3 ]))
        }
    /   exprDereference

exprMultiplicativeOp "multiplicative arithmetic operator"
    =   op:$("*" / "/" / "%") {
            return AST("MultiplicativeOp").set({ op: op })
        }

exprDereference
    =   e1:exprOther e2:(("." id) / ("[" expr "]"))+ {
            return AST("Deref").add(unroll(e1, e2, 1))
        }
    / exprOther

exprOther
    =   exprArray
    /   exprHash
    /   exprLiteral
    /   exprVariable
    /   exprParenthesis

exprLiteral
    =   string
    /   regexp
    /   number
    /   value

exprVariable
    =   v:variable p:parameters? {
            return v.add(p)
        }

exprParenthesis
    =   "(" _ e:expr _ ")" {  /* RECURSION */
             return e
        }

exprArray
    =   "[" _ f:expr l:(_ "," _ expr)* _ "]" {  /* RECURSION */
            return AST("Array").add(unroll(f, l, 3))
        }
    /   "[" _ "]" {
            return AST("Array")
        }

exprHash
    =   "{" _ f:exprHashKV l:(_ "," _ exprHashKV)* _ "}" {
            return AST("Hash").add(unroll(f, l, 3))
        }
    /   "{" _ "}" {
            return AST("Hash")
        }

exprHashKV
    =   k:id _ ":" _ v:expr {  /* RECURSION */
            return AST("KeyVal").add(k, v)
        }

parameters
    =   "(" _ p:params? _ ")" {
            return AST("Parameters").add(p)
        }
        
params
    =   f:param l:(_ "," _ param)* {
            return unroll(f, l, 3)
        }

param
    =   id:id _ "=" _ e:expr {  /* RECURSION */
            return AST("ParamNamed").set({ id: id.get("id") }).add(e)
        }
    /   e:expr {  /* RECURSION */
            return AST("ParamPositional").add(e)
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
            return AST("Variable").set({ ns: ns, id: id, text: text() })
        }
    /   ns:$([a-zA-Z_][a-zA-Z0-9_]*) ":" id:$([a-zA-Z_][a-zA-Z0-9_-]*) {
            return AST("Variable").set({ ns: ns, id: id, text: text() })
        }
    /   id:$([a-zA-Z_][a-zA-Z0-9_-]*) {
            return AST("Variable").set({ ns: "", id: id , text: text() })
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
