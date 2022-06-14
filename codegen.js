import parse from "./ast.js";
import fs from "fs";
import { format } from "prettier";
import { minify } from "terser";

let PRODUCTION = true;

const html = fs.readFileSync("./index.html", "utf8");
const ast = parse(html);

fs.writeFileSync("./ast.json", JSON.stringify(ast, null, 2));

let out = "";
let idmap = {};
let id = 0;
let updates = [];

let outCSS = "";
let outJS = "";

function print(str) {
	out += str + "\n";
}

function uid() {
	return "$" + (++id).toString(36);
}

function walk(node) {
	/**
	 * App node is the root of the AST
	 */

	/**
	 * Element node
	 */
	if (node.type === "Element" || node.type === "App") {
		let tagName = node.tagName;
		let id = uid();

		if (node.type === "App") {
			print(`const ${id} = ROOT`);
		} else {
			print(`const ${id} = element("${tagName}")`);
		}

		node.id = id;
		idmap[id] = node;

		let children = [];

		node.children.forEach((child) => {
			if (child.type === "Text") {
				let text = child.value;
				let id = uid();

				print(
					`const ${id} = text(${child.template ? text : JSON.stringify(text)});`
				);

				child.id = id;
				idmap[id] = child;

				/**
				 * If the text node is a template, we need to add a function to update the text
				 */
				if (child.template) {
					print(`const update${id} = () => { ${id}.textContent = ${text}; }`);
					updates.push(`update${id}`);
				}

				children.push(child.id);
			} else if (child.type === "Element") {
				children.push(walk(child));
			}
		});

		print(`${id}.append(${children.join(", ")});`);

		node.events?.forEach((event) => {
			print(`${id}.on("${event.name}", ()=>{
                ${event.value}
                update()
            });`);
		});

		return id;
	}
}

function get_css(node) {
	if (node.type === "Style") {
		outCSS += node.value;
	}

	node.children?.forEach((child) => {
		get_css(child);
	});
}

function get_js(node) {
	if (node.type === "Script") {
		outJS += node.value;
	}

	node.children?.forEach((child) => {
		get_js(child);
	});
}

get_css(ast);
get_js(ast);

if (outCSS) {
	print(`import "./build.css.js"`);
}

if (outJS) {
	print(outJS);
}

walk(ast);

print(`function element(tag) {
	const el = document.createElement(tag);
	const children = [];
	el.append = (...args) => {
		children.push(...args);
		args.forEach(child => el.appendChild(child));
	};
	el.on = (event, callback) => {
		el.addEventListener(event, callback);
	};
	return el;
}

function text(value) {
	const el = document.createTextNode(value);
	el.update = (value) => {
		el.textContent = value;
	};
	return el;
}`);

print("function update() {");
updates.forEach((update) => {
	print(`${update}();`);
});
print("}");

fs.writeFileSync("./build.js", await _format(out, { parser: "babel" }));

const css_code = `
function CSS() {
	const css_code = ${JSON.stringify(outCSS)};
	const style = document.createElement("style");
	style.type = "text/css";
	style.appendChild(document.createTextNode(css_code));
	document.head.appendChild(style);
}

CSS();
`;

fs.writeFileSync(
	"./build.css.js",
	await _format(css_code, { parser: "babel" })
);

async function _format(code, options) {
	if (PRODUCTION) {
		const mincode = await minify(code);
		console.log(mincode);
		return mincode.code;
	} else {
		return format(code, options);
	}
}
