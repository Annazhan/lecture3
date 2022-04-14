export type Type =
  | "int"
  | "bool"
  | "none"

export type Parameter =
  | { name: string, typ: Type }

export type FlowControl<A> = 
  | {a?: A, name:string, condition: Expr<A>, body: Stmt<A>[]}

export type Stmt<A> =
  | { a?: A, tag: "assign", name: string, value: Expr<A> }
  | { a?: A, tag: "def", name:string, value: Expr<A>}
  | { a?: A, tag: "expr", expr: Expr<A> }
  | { a?: A, tag: "define", name: string, params: Parameter[], ret: Type, body: Stmt<A>[] }
  | { a?: A, tag: "return", value: Expr<A>}
  | { a?: A, tag: "flow", if: FlowControl<A>, elif: FlowControl<A>[], else: Stmt<A>[]}
  | { a?: A, tag: "while", condition: Expr<A>, body: Stmt<A>[]}
  | { a?: A, tag: "pass"}

export type Expr<A> = 
  | { a?: A, tag: "number", value: number }
  | { a?: A, tag: "true" }
  | { a?: A, tag: "false" }
  | { a?: A, tag: "binop", op: Op, lhs: Expr<A>, rhs: Expr<A> }
  | { a?: A, tag: "id", name: string, global?: boolean }
  | { a?: A, tag: "call", name: string, args: Expr<A>[] }

const ops = {"+": true, "-": true, "*": true, "//":true, "%":true, 
              ">": true, "<":true, "<=":true, ">=":true, "==":true,
              "and": true, "or": true, "is":true };
export type Op = keyof (typeof ops);
export function isOp(maybeOp : string) : maybeOp is Op {
  return maybeOp in ops;
}