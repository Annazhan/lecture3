const python = require('lezer-python');

const input = "x : int = 2";

const tree = python.parser.parse(input);

const cursor = tree.cursor();

do {
  console.log(cursor.node.type.name);
  console.log(input.substring(cursor.node.from, cursor.node.to));
} while(cursor.next());

