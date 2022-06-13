import { Parser } from "parse5";
import fs from "fs";
import util from "util";
import { format } from "prettier";

const CODE = fs.readFileSync("index.html", "utf8");
const PARSED = Parser.parse(CODE, { locationInfo: true }).childNodes[0];

function escape(str) {
	return str.replace(/\`/g, "\\`");
}

let __id_generator = {};

function id(name = "") {
	return `${name}_${(
		++__id_generator[name] || (__id_generator[name] = 0)
	).toString(36)}`;
}

let map = {};
let output = "";

const codegen = {
	text(str) {
		return `text(\`${escape(str)}\`)`;
	},
	element(tag) {
		return `element("${tag}")`;
	},
	appendTo(parent, children) {
		return `appendTo(${parent}, ${children})`;
	},
	const(name, value) {
		return `const ${name} = ${value};`;
	},
	functionStart(name, args) {
		return `function ${name}(${args}) {`;
	},
	functionEnd(name) {
		return `}`;
	},
};

function genCode(node) {
	const { nodeName, childNodes, parentNode } = node;

	switch (nodeName) {
		case "#text":
			{
				const el_id = id("text");

				output += codegen.const(el_id, codegen.text(node.value.trim())) + "\n";

				node.id = el_id;
			}
			break;

		case "#comment":
		case "head":
			break;

		case "html":
			childNodes.forEach(genCode);
			break;

		case "for":
			{
				const el_id = id("for_block");
				const counter_id = id("counter");
				const array_id = id("array");
				const pushed_id = id("pushed");
				const parent = parentNode.id || "ROOT";

				console.log(parent);

				const array = node.attrs.find((attr) => attr.name === "array").value;
				const as = node.attrs.find((attr) => attr.name === "as").value;

				output += codegen.functionStart(el_id, as) + "\n";

				childNodes.forEach((child) => {
					if (child.nodeName === "#text") return;
					else genCode(child);
				});

				output += `return { \n`;

				/**
				 * Mounting function
				 */
				output += "mount() {\n";

				childNodes.forEach((child) => {
					if (child.id) output += codegen.appendTo(parent, child.id) + "\n";
				});

				output += "},";

				/**
				 * Destroying function
				 */
				output += "\ndestroy() {\n";

				childNodes.forEach((child) => {
					if (child.id) output += `${child.id}.remove();\n`;
				});

				output += "}\n";

				output += "}";

				output += codegen.functionEnd(el_id) + "\n";

				node.id = el_id;

				output += `let ${array_id} = ${array};\n`;
				output += `let ${pushed_id} = [];\n`;
				output += `let ${counter_id} = 0;\n`;

				output += array + ".forEach((item, i) => {\n";
				output += `\t${el_id}(item, i);\n`;
				output += "})\n";
			}
			break;

		default:
			{
				const el_id = id("element");

				if (nodeName === "body") {
					output += codegen.const(el_id, "ROOT") + "\n";
				} else {
					output += codegen.const(el_id, codegen.element(nodeName)) + "\n";
				}

				childNodes.forEach((child) => {
					genCode(child);
				});

				node.id = el_id;

				/**
				 * Appending children to the element
				 */
				const children = [];

				childNodes.forEach((child) => {
					if (child.id) children.push(child.id);
				});

				output += codegen.appendTo(el_id, children) + "\n";
			}
			break;
	}

	return output;
}

fs.writeFileSync(
	"test.js",
	"" + format(genCode(PARSED), { semi: false, parser: "babel" })
);

//console.log(util.inspect(PARSED.childNodes, false, null, true));
