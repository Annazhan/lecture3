import { Expr, Stmt, Type } from "./ast";

type FunctionsEnv = Map<string, [Type[], Type]>;
type BodyEnv = Map<string, Type>;

export function tcExpr(e : Expr<any>, functions : FunctionsEnv, variables : BodyEnv) : Expr<Type> {
  switch(e.tag) {
    case "number": return { ...e, a: "int" };
    case "true": return { ...e, a: "bool" };
    case "false": return { ...e, a: "bool" };
    case "binop": {
      const newRhs = tcExpr(e.rhs, functions, variables);
      const newLhs = tcExpr(e.rhs, functions, variables);
      switch(e.op) {
        case "+":
        case "-":
        case "*":
        case "//":
        case "%":
          if (newRhs.a != "int" || newLhs.a != "int"){
              throw new Error(`TypeError: The type of ${newRhs.a} doesn't match with ${newLhs.a}`)
          }
          return { tag: "binop", op: e.op , lhs:newLhs, rhs: newRhs, a: "int" };
        case ">" : 
        case "<" :
        case ">=":
        case "<=":
          if (newRhs.a != "int" || newLhs.a != "int"){
              throw new Error(`TypeError: The type of ${newRhs.a} doesn't match with ${newLhs.a}`)
          }
          return { tag: "binop", op: e.op , lhs:newLhs, rhs: newRhs, a: "bool" };
        case "==":
          if ((newRhs.a != "int" || newLhs.a != "int") && (newRhs.a != "bool" || newLhs.a != "bool")){
            throw new Error(`TypeError: The type of ${newRhs.a} doesn't match with ${newLhs.a}`)
          }
        return { tag: "binop", op: e.op , lhs:newLhs, rhs: newRhs, a: "bool" };
        case "and": 
        case "or":
          if (newRhs.a != "bool" || newLhs.a != "bool") {
            throw new Error(`TypeError: The type of ${newRhs.a} doesn't match with ${newLhs.a}`)
          }
          return { tag: "binop", op: e.op , lhs:newLhs, rhs: newRhs, a: "bool" };
        case "is":
          if (newRhs.a == "bool" || newLhs.a == "bool" || newRhs.a == "int" || newLhs.a == "int"){
            throw new Error(`TypeError: IS can't be used on ${newRhs.a} or ${newLhs.a}`);
          }
        default: throw new Error(`Unhandled op ${e.op}`)
      }
    }
    case "id": return { ...e, a: variables.get(e.name) };
    case "call":
      if(e.name === "print") {
        if(e.args.length !== 1) { throw new Error("print expects a single argument"); }
        const newArgs = [tcExpr(e.args[0], functions, variables)];
        const res : Expr<Type> = { ...e, a: "none", args: newArgs } ;
        return res;
      }
      if(!functions.has(e.name)) {
        throw new Error(`function ${e.name} not found`);
      }

      const [args, ret] = functions.get(e.name);
      if(args.length !== e.args.length) {
        throw new Error(`Expected ${args.length} arguments but got ${e.args.length}`);
      }

      const newArgs = args.map((a, i) => {
        const argtyp = tcExpr(e.args[i], functions, variables);
        if(a !== argtyp.a) { throw new Error(`Got ${argtyp} as argument ${i + 1}, expected ${a}`); }
        return argtyp
      });

      return { ...e, a: ret, args: newArgs };
  }
}

export function tcStmt(s : Stmt<any>, functions : FunctionsEnv, variables : BodyEnv, currentReturn : Type) : Stmt<Type> {
  switch(s.tag) {
    case "assign": {
      const rhs = tcExpr(s.value, functions, variables);
      if(variables.has(s.name) && variables.get(s.name) !== rhs.a) {
        throw new Error(`Cannot assign ${rhs} to ${variables.get(s.name)}`);
      }
      if (rhs.a != s.a){
        throw new Error(`TypeError: The type ${s.a} of ${s.name} doesn't match with the type of value ${rhs.a}`)
      }
      variables.set(s.name, rhs.a);
      return { ...s, value: rhs };
    }
    case "define": {
      const bodyvars = new Map<string, Type>(variables.entries());
      s.params.forEach(p => { bodyvars.set(p.name, p.typ)});
      const newStmts = s.body.map(bs => tcStmt(bs, functions, bodyvars, s.ret));
      return { ...s, body: newStmts };
    }
    case "expr": {
      const ret = tcExpr(s.expr, functions, variables);
      return { ...s, expr: ret };
    }
    case "return": {
      const valTyp = tcExpr(s.value, functions, variables);
      if(valTyp.a !== currentReturn) {
        throw new Error(`TypeError: ${valTyp} returned but ${currentReturn} expected.`);
      }
      return { ...s, value: valTyp };
    }
    case "while":{
      const whileCondition = tcExpr(s.condition, functions, variables);
      if(whileCondition.a !== "bool") {
        throw new Error(`TypeError: while condition is not bool expression`);
      }
      const whileBody = s.body.map(ws => tcStmt(ws, functions, variables, currentReturn));
      return {...s, condition: whileCondition, body: whileBody};
    }
  }
}

export function tcProgram(p : Stmt<any>[]) : Stmt<Type>[] {
  const functions = new Map<string, [Type[], Type]>();
  p.forEach(s => {
    if(s.tag === "define") {
      functions.set(s.name, [s.params.map(p => p.typ), s.ret]);
    }
  });

  const globals = new Map<string, Type>();
  return p.map(s => {
    if(s.tag === "assign") {
      const rhs = tcExpr(s.value, functions, globals);
      if(globals.has(s.name) && globals.get(s.name) !== rhs.a) {
        throw new Error(`Cannot assign ${rhs} to ${globals.get(s.name)}`);
      }
      if (rhs.a != s.a){
        throw new Error(`TypeError: The type ${s.a} of ${s.name} doesn't match with the type of value ${rhs.a}`)
      }
      globals.set(s.name, rhs.a);
      return { ...s, value: rhs };
    }
    else {
      const res = tcStmt(s, functions, globals, "none");
      return res;
    }
  });
}