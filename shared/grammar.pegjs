# ENTRY POINT
Program
  = _ elements:Element* EOF { return elements }

# ELEMENTS
Element
  = annotations:Annotation* name:Identifier params:Parameters? body:ElementBody {
      return { type: "Element", name, annotations, params, body }
    }

Annotation
  = "@" name:Identifier args:Arguments? _ { return { type: "Annotation", name, args } }

Parameters
  = "(" _ kv:KeyValueList? _ ")" { return kv || [] }

KeyValueList
  = head:KeyValue tail:(_ "," _ KeyValue)* {
      return [head].concat(tail.map(t => t[3]))
    }

KeyValue
  = key:Identifier _ ":" _ value:Expression { return { key, value } }

ElementBody
  = "{" _ content:ElementContent* "}" _ { return content }

ElementContent
  = Comment
  / ChildLine
  / Element               # nested element
  / KeyValue              # property-only element lines

# CHILD LINE (bare or with modifier)
ChildLine
  = mod:Identifier? _ id:(Identifier / DynamicIdentifier) sig:Signature? _ annotations:Annotation* body:ElementBody? _ {
      return { type: "ChildLine", modifier: mod, id, signature: sig, annotations, body }
    }

Signature
  = !"{" chars:[^@{}\n]+ { return chars.join("").trim() }

# EXPRESSIONS (minimal)
Expression
  = String
  / Number
  / Boolean
  / Array
  / Object
  / Identifier

String  = "'" chars:[^']* "'" _ { return chars.join("") }
Number  = digits:[0-9]+ _ { return parseInt(digits.join(""), 10) }

# TOKENS & UTILITY
Identifier
  = $([A-Za-z_][A-Za-z0-9_]*) _

Arguments
  = "(" _ args:ArgumentList? _ ")" { return args || [] }

ArgumentList
  = head:Expression tail:(_ "," _ Expression)* { return [head].concat(tail.map(t => t[3])) }

Comment  = "//" [^\n]* _

# WHITESPACE / EOF
_        = [ \t\n\r]*
EOF      = !.

# Dynamic identifier like [slug]
DynamicIdentifier
  = "[" _ inner:Identifier _ "]" { return `[${inner}]`; }

Boolean = b:("true" / "false") _ { return b === "true" }

# Array literal
Array
  = "[" _ elements:(Expression (_ "," _ Expression)*)? _ "]" {
      return elements ? [elements[0]].concat(elements[1].map(e => e[3])) : []
    }

# Object literal (key: value pairs)
Object
  = "{" _ pairs:(KeyValue (_ "," _ KeyValue)*)? _ "}" {
      return pairs ? [pairs[0]].concat(pairs[1].map(p => p[3])) : []
    }