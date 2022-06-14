import { parseFragment } from "parse5";

let ast = {
	type: "App",
	children: [],
};

const template_regex = /{(.*)}/gm;

function walk(node, parent) {
	/**
	 * Text node
	 */
	if (node.nodeName === "#text") {
		const value = node.value.trim();
		const match = template_regex.exec(value);

		/**
		 * If there's a template string, we need to create a new node
		 */
		if (match) {
			/**
			 * Get before and after text
			 */
			const before = value.substring(0, match.index);
			const after = value.substring(match.index + match[0].length);

			if (before) {
				parent.children.push({
					type: "Text",
					value: before,
				});
			}

			parent.children.push({
				type: "Text",
				value: match[0].slice(1, -1) /** Remove 1st and last char */,
				template: true,
			});

			if (after) {
				parent.children.push({
					type: "Text",
					value: after,
				});
			}
		} else {
			/**
			 * else, just add the text node
			 */

			/**
			 * Make sure we don't add empty text nodes
			 */
			if (value) {
				parent.children.push({
					type: "Text",
					value,
				});
			}
		}
	}

	/**
	 * Element node
	 *
	 * If it doesn't start with #, it's an element
	 */
	if (!node.nodeName.startsWith("#")) {
		let element = {
			type: "Element",
			tagName: node.nodeName,
			children: [],
			events: [],
		};

		if (node.nodeName === "style") {
			parent.children.push({
				type: "Style",
				value: node.childNodes[0].value,
			});

			return;
		}

		if (node.nodeName === "script") {
			parent.children.push({
				type: "Script",
				value: node.childNodes[0].value,
			});

			return;
		}

		if (node.attrs) {
			node.attrs.forEach((attr) => {
				if (attr.name.startsWith(":")) {
					element.events.push({
						name: attr.name.slice(1),
						value: attr.value,
					});
				}
			});
		}

		if (node.childNodes) {
			node.childNodes.forEach((child) => {
				walk(child, element);
			});
		}

		parent.children.push(element);
	}

	/**
	 *
	 * #document-fragment node
	 *
	 */
	if (node.nodeName === "#document-fragment") {
		if (node.childNodes) {
			node.childNodes.forEach((child) => {
				walk(child, parent);
			});
		}
	}
}

function parse(html) {
	const document = parseFragment(html, { locationInfo: true });
	walk(document, ast);
	return ast;
}

export default parse;
