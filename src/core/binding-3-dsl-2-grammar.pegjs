/*
**  BindingJS -- View Data Binding for JavaScript <http://bindingjs.com>
**  Copyright (c) 2014 Ralf S. Engelschall <http://engelschall.com>
**
**  This Source Code Form is subject to the terms of the Mozilla Public
**  License, v. 2.0. If a copy of the MPL was not distributed with this
**  file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/

/*  generate an Abstrast Syntax Tree (AST) node  */
{
    var AST = function (T, A, C) {
        return _api.AST(T, A, C).pos(line(), column(), offset());
    };
}


/*
**  ==== TOP-LEVEL ====
*/

spec
    =   b:(_ block)* _ eof {
            return AST("Spec", {}, unroll(null, b, 1))
        }

block
    =   rule
    /   macroDef

rule
    =   s:selectors _ "{" b:(_ body)* _ "}" {
            return AST("Rule", {}).add(s).add(unroll(null, b, 1))
        }

body
    =   rule      /* RECURSION */
    /   binding
    /   macroRef

macroDef
    =   "@" id:id "(" _ a:idSeq _ ")" _ "{" b:(_ binding)* _ "}" {
            return AST("MacroDef", { id: id }).add(a).add(unroll(null, b, 1))
        }

macroRef
    =   "@" id:id "(" _ p:exprSeq _ ")" {
            return AST("MacroRef", { id: id }, p)
        }


/*
**  ==== SELECTOR ====
**
**  http://dev.w3.org/csswg/selectors-4/
**  http://css4-selectors.com/selectors/
*/

selectors
    =   f:selector l:(_ "," _ selector)* {
            return AST("SelectorList", {}, unroll(f, l, 3))
        }

selector
    =   f:selectorSingle l:(_ selectorCombinator _ selectorSingle)* {
            return AST("SelectorCombination", {}, unroll(f, l, [ 1, 3 ]))
        }

selectorSingle
    =   s:"!"? c:selectorComponents {
            return AST("Selector", { isSubject: !!s }, c)
        }

selectorCombinator "selector combinator"
    =   ws   { return AST("Combinator", { type: "descendant" })        }
    /   ">"  { return AST("Combinator", { type: "child" })             }
    /   "+"  { return AST("Combinator", { type: "next-sibling" })      }
    /   "~"  { return AST("Combinator", { type: "following-sibling" }) }

selectorComponents
    =   f:selectorComponentElement l:selectorComponentRepeatable* {
            return unroll(f, l)
        }
    /   l:selectorComponentRepeatable+ {
            return l;
        }

selectorComponentElement "element-selector"
    =   t:$("*" / [a-zA-Z0-9_-]+) {
            return AST("Element", { name: t });
        }

selectorComponentRepeatable
    =   selectorId
    /   selectorClass
    /   selectorAttr
    /   selectorPseudo

selectorId "id-selector"
    =   "#" t:$([a-zA-Z0-9-_$]+) {
            return AST("Id", { name: t })
        }

selectorClass "class-selector"
    =   "." t:$([a-zA-Z0-9-_$]+) {
            return AST("Class", { name: t })
        }

selectorAttr
    =   "[" _ name:id _ op:selectorAttrOp _ value:selectorAttrValue _ "]"{
            return AST("Attr", { op: op }, [ name, value ])
        }
    /   "[" _ name:id _ "]" {
            return AST("Attr", { op: "has" }, [ name ])
        }

selectorAttrOp "attribute operator"
    =   "="  { return "equal";    }
    /   "!=" { return "notequal"; }
    /   "^=" { return "begins";   }
    /   "|=" { return "prefix";   }
    /   "*=" { return "contains"; }
    /   "$=" { return "ends";     }

selectorAttrValue
    =   v:string    { return v; }
    /   v:bareword  { return v; }

selectorPseudo
    =   ":" t:selectorPseudoTagNameSimple {
            return AST("PseudoSimple", { name: t })
        }
    /   ":" t:selectorPseudoTagNameArg args:("(" _ string _ ")")? {
            return AST("PseudoArg", { name: t }, [ args[1] ])
        }
    /   ":" t:selectorPseudoTagNameComplex args:("(" _ selector _ ")")? {
            return AST("PseudoComplex", { name: t }, [ args[1] ])
        }

selectorPseudoTagNameSimple "name of pseudo-selector (simple)"
    =   "animated"
    /   "button"
    /   "checkbox"
    /   "checked"
    /   "disabled"
    /   "empty"
    /   "enabled"
    /   "even"
    /   "file"
    /   "first-child"
    /   "first-of-type"
    /   "first"
    /   "focus"
    /   "header"
    /   "hidden"
    /   "image"
    /   "input"
    /   "last-child"
    /   "last-of-type"
    /   "odd"
    /   "only-child"
    /   "only-of-type"
    /   "parent"
    /   "password"
    /   "radio"
    /   "reset"
    /   "root"
    /   "selected"
    /   "submit"
    /   "target"
    /   "text"
    /   "visible"

selectorPseudoTagNameArg "name of pseudo-selector (with simple argument)"
    =   "contains"
    /   "eq"
    /   "gt"
    /   "lt"
    /   "lang"
    /   "nth-child"
    /   "nth-last-child"
    /   "nth-last-of-type"
    /   "nth-of-type"
    /   "nth-of-type"

selectorPseudoTagNameComplex "name of pseudo-selector (with complex argument)"
    =   "has"
    /   "not"
    /   "matches"

/*
**  ==== BINDING ====
*/

binding
    =   f:bindingLink l:(_ bindingOp _ bindingLink)+ {
            return AST("Binding", {}, unroll(f, l, [ 1, 3 ]))
        }

bindingLink
    =   exprSeq

bindingOp "binding operator"
    =   op:"<-"   { return AST("BindingOperator", { value: op }) }
    /   op:"<->"  { return AST("BindingOperator", { value: op }) }
    /   op:"->"   { return AST("BindingOperator", { value: op }) }

exprSeq
    =   f:expr l:(_ "," _ expr)* {
            return AST("ExprSeq", {}, unroll(f, l, 3))
        }

expr
    =   exprConditional

exprConditional
    =   e1:exprLogical _ "?" _ e2:expr _ ":" _ e3:expr {
            return AST("Conditional", {}, [ e1, e2, e3 ])
        }
    /   exprLogical

exprLogical
    =   "!" _ e:expr {
            return AST("LogicalNot", {}, [ e ])
        }
    /   e1:exprRelational _ op:exprLogicalOp _ e2:expr {
            return AST("Logical", { op: op }, [ e1, e2 ])
        }
    /   exprRelational

exprLogicalOp "boolean logical operator"
    =   "&&" / "||"

exprRelational
    =   e1:exprAdditive _ op:exprRelationalOp _ e2:expr {
            return AST("Relational", { op: op }, [ e1, e2 ])
        }
    /   exprAdditive

exprRelationalOp "relational operator"
    =   "==" / "!=" / "<=" / ">=" / "<" / ">" / "=~" / "!~"

exprAdditive
    =   e1:exprMultiplicative _ op:exprAdditiveOp _ e2:expr {
            return AST("Arith", { op: op }, [ e1, e2 ])
        }
    /   exprMultiplicative

exprAdditiveOp "additive arithmetic operator"
    =   "+" / "-"

exprMultiplicative
    =   e1:exprOther _ op:exprMultiplicativeOp _ e2:expr {
            return AST("Arith", { op: op }, [ e1, e2 ])
        }
    /   exprOther

exprMultiplicativeOp "multiplicative arithmetic operator"
    =   "*" / "/"

exprOther
    =   exprLiteral
    /   exprVariable
    /   exprDereference
    /   exprFunctionCall
    /   exprParenthesis

exprLiteral
    =   string
    /   number

exprVariable
    =   id:id {
            return AST("Var", {}, [ id ])
        }

exprDereference
    =   "." id:id {
            return AST("Deref", {}, [ id ])
        }
    /   "[" _ e:expr _ "]" {
            return AST("Deref", {}, [ e ])
        }

exprFunctionCall
    =   id:id "(" _ p:exprSeq? _ ")" {
            return AST("Func", {}, [ id, p ])
        }

exprParenthesis
    =   "(" e:expr ")" {
             return AST("Parenthesis", {}, [ e ])
        }

/*
**  ==== GENERIC ====
*/

id "identifier"
    =   id:$(("\\" . / [a-zA-Z_][a-zA-Z0-9_]*)+) {
            return AST("Identifier", { id: id.replace(/\\/g, "") })
        }

idSeq "identifier sequence"
    =   id:id ids:(_ "," _ id)* {
            return unroll(id, ids, 3)
        }

bareword "bareword"
    =   bw:$(("\\" . / [a-zA-Z0-9_])+) {
            return AST("LiteralBareword", { value: bw.replace(/\\/g, "") })
        }

string "quoted string literal"
    =   "\"" t:$(("\\\"" / [^\\"])*) "\"" {
            return AST("LiteralString", { value: t.replace(/\\"/g, "\"") })
        }
    /   "'" t:$(("\\'" / [^\\'])*) "'" {
            return AST("LiteralString", { value: t.replace(/\\'/g, "'") })
        }

number "numeric literal"
    =   n:$([+-]? [0-9]+) {
            return AST("LiteralNumber", { value: parseInt(n, 10) })
        }
    /   n:$([+-]? [0-9]* "." [0-9]+ ([eE] [+-] [0-9]+)?) {
            return AST("LiteralNumber", { value: parseInt(n, 10) })
        }
    /   s:$([+-]?) "0x" n:$([0-9a-fA-F]+) {
            return AST("LiteralNumber", { value: parseInt(s + n, 16) })
        }
    /   s:$([+-]?) "0b" n:$([01]+) {
            return AST("LiteralNumber", { value: parseInt(s + n, 2) })
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
