import { none } from 'binaryen';
import { TreeCursor } from 'lezer';
import {parser} from 'lezer-python';
import {Parameter, Stmt, Expr, Type, isOp, FlowControl} from './ast';

export function parseProgram(source : string) : Array<Stmt<any>> {
  const t = parser.parse(source).cursor();
  return traverseStmts(source, t);
}

export function traverseStmts(s : string, t : TreeCursor) {
  // The top node in the program is a Script node with a list of children
  // that are various statements
  t.firstChild();
  const stmts = [];
  do {
    stmts.push(traverseStmt(s, t));
  } while(t.nextSibling()); // t.nextSibling() returns false when it reaches
                            //  the end of the list of children
  return stmts;
}

/*
  Invariant – t must focus on the same node at the end of the traversal
*/
export function traverseStmt(s : string, t : TreeCursor) : Stmt<any> {
  switch(t.type.name) {
    case "ReturnStatement":
      t.firstChild();  // Focus return keyword
      t.nextSibling(); // Focus expression
      var value = traverseExpr(s, t);
      t.parent();
      return { tag: "return", value };
    case "AssignStatement":
      t.firstChild(); // focused on name (the first child)
      var name = s.substring(t.from, t.to);
      t.nextSibling(); 
      let paramTC = t
      if(paramTC.type.name == "AssignOp"){
        t.nextSibling();
        var value = traverseExpr(s,t);
        t.parent();
        return {tag:"assign", name, value};
      }
      else if(paramTC.type.name != "TypeDef"){
        throw new Error("ParseError: The paramater "+ name + " doesn't have type")
      }
      t.firstChild()
      t.nextSibling();
      let type = traverseType(s, t);
      t.parent();
      t.nextSibling(); // focused on = sign. May need this for complex tasks, like +=!
      t.nextSibling(); // focused on the value expression
    
      var value = traverseExpr(s, t);
      t.parent();
      return { tag: "def", name, value,a: type};
    case "ExpressionStatement":
      t.firstChild(); // The child is some kind of expression, the
                      // ExpressionStatement is just a wrapper with no information
      var expr = traverseExpr(s, t);
      t.parent();
      return { tag: "expr", expr: expr };
    case "FunctionDefinition":
      t.firstChild();  // Focus on def
      t.nextSibling(); // Focus on name of function
      var name = s.substring(t.from, t.to);
      t.nextSibling(); // Focus on ParamList
      var params = traverseParameters(s, t)
      t.nextSibling(); // Focus on Body or TypeDef
      let ret : Type = "none";
      let maybeTD = t;
      if(maybeTD.type.name === "TypeDef") {
        t.firstChild();
        ret = traverseType(s, t);
        t.parent();
      }
      t.nextSibling(); // Focus on single statement (for now)
      t.firstChild();  // Focus on :
      const body = [];
      while(t.nextSibling()) {
        body.push(traverseStmt(s, t));
      }
      t.parent();      // Pop to Body
      t.parent();      // Pop to FunctionDefinition
      return {
        tag: "define",
        name, params, body, ret
      }
    case "WhileStatement":
      t.firstChild();
      if(s.substring(t.from, t.to) != "while"){
        throw new Error("ParseError: not a while loop statement");
      }
      t.nextSibling();
      let biConT = t
      if(biConT.type.name != "BinaryExpression" && biConT.type.name != "Boolean"){
        throw new Error("ParseError: invalid while condition");
      }
      const whileCondition = traverseExpr(s, t);
      t.nextSibling();
      t.firstChild();
      const whileBody = []
      while(t.nextSibling()){
        whileBody.push(traverseStmt(s,t));
      }
      t.parent();
      t.parent();
      return{
        tag:"while",
        condition: whileCondition, 
        body: whileBody,
      }
    case "PassStatement":
      return {tag:"pass"};
    case "IfStatement":
      t.firstChild();
      const ifBr = traversaFlowStmt(s, t);
      let elifBr = [];
      let elseBr = [];
      if(t.next()){
        t.nextSibling();
        if(s.substring(t.from, t.to) === "elif"){
          elifBr.push(traversaFlowStmt(s,t));
        }
        else if(s.substring(t.from, t.to) === 'else'){
          t.nextSibling();
          t.firstChild();
          const body = []
          while(t.nextSibling()){
            elseBr.push(traverseStmt(s,t));
          }
          t.parent();
        }
      }
      t.parent();
      return {tag:"flow", if: ifBr, elif: elifBr, else: elseBr};
  }
}

export function traversaFlowStmt(s: string, t: TreeCursor): FlowControl<any> {
  let name = s.substring(t.from, t.to);
  t.nextSibling()
  if(t.type.name != "BinaryExpression" && t.type.name != "Boolean"){
    throw new Error("ParseError: invalid while condition");
  }
  const condition = traverseExpr(s, t);
  t.nextSibling();
  t.firstChild();
  const body = []
  while(t.nextSibling()){
      body.push(traverseStmt(s,t));
  }
  t.parent();
  return {name, condition, body};
}

export function traverseType(s : string, t : TreeCursor) : Type {
  switch(t.type.name) {
    case "VariableName":
      const name = s.substring(t.from, t.to);
      if(name !== "int" && name != "bool") {
        throw new Error("Unknown type: " + name)
      }
      return name;
    default:
      throw new Error("Unknown type: " + t.type.name)

  }
}

export function traverseParameters(s : string, t : TreeCursor) : Parameter[] {
  t.firstChild();  // Focuses on open paren
  const parameters = []
  t.nextSibling(); // Focuses on a VariableName
  while(t.type.name !== ")") {
    let name = s.substring(t.from, t.to);
    t.nextSibling(); // Focuses on "TypeDef", hopefully, or "," if mistake
    let nextTagName = t.type.name; // NOTE(joe): a bit of a hack so the next line doesn't if-split
    if(nextTagName !== "TypeDef") { throw new Error("Missed type annotation for parameter " + name)};
    t.firstChild();  // Enter TypeDef
    t.nextSibling(); // Focuses on type itself
    let typ = traverseType(s, t);
    t.parent();
    t.nextSibling(); // Move on to comma or ")"
    parameters.push({name, typ});
    t.nextSibling(); // Focuses on a VariableName
  }
  t.parent();       // Pop to ParamList
  return parameters;
}

export function traverseExpr(s : string, t : TreeCursor) : Expr<any> {
  switch(t.type.name) {
    case "None":
      return {
        tag:"none",
      }
    case "Boolean":
      if(s.substring(t.from, t.to) === "True") { return { tag: "true" }; }
      else { return { tag: "false" }; }
    case "Number":
      return { tag: "number", value: Number(s.substring(t.from, t.to)) };
    case "VariableName":
      return { tag: "id", name: s.substring(t.from, t.to) };
    case "CallExpression":
      t.firstChild(); // Focus name
      var name = s.substring(t.from, t.to);
      t.nextSibling(); // Focus ArgList
      t.firstChild(); // Focus open paren
      var args = traverseArguments(t, s);
      var result : Expr<any> = { tag: "call", name, args: args};
      t.parent();
      return result;
    case "UnaryExpression":
      t.firstChild();
      const unaryOp  = s.substring(t.from, t.to);
      if (unaryOp != "-" && unaryOp != "+"){
        throw new Error("ParseError: not an unary operator");
      }
      t.nextSibling();
      const value = Number("-"+s.substring(t.from, t.to));
      if(isNaN(value)){
        throw new Error("ParseError: not a number");
      }
      t.parent();
      return {
        tag:"number",
        value: value,
      }
    case "BinaryExpression":
      t.firstChild(); // go to lhs
      const lhsExpr = traverseExpr(s, t);
      t.nextSibling(); // go to op
      var opStr = s.substring(t.from, t.to);
      if(!isOp(opStr)) {
        throw new Error(`ParseError: Unknown or unhandled op: ${opStr}`);
      }
      t.nextSibling(); // go to rhs
      const rhsExpr = traverseExpr(s, t);
      t.parent();
      return {
        tag: "binop",
        op: opStr,
        lhs: lhsExpr,
        rhs: rhsExpr
      };
  
  }
}

export function traverseArguments(c : TreeCursor, s : string) : Expr<any>[] {
  c.firstChild();  // Focuses on open paren
  const args = [];
  c.nextSibling();
  while(c.type.name !== ")") {
    let expr = traverseExpr(s, c);
    args.push(expr);
    c.nextSibling(); // Focuses on either "," or ")"
    c.nextSibling(); // Focuses on a VariableName
  } 
  c.parent();       // Pop to ArgList
  return args;
}