import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type ParsedArgs = {
	args: string[];
	error?: string;
};

function parseCommandArgs(input: string): ParsedArgs {
	const args: string[] = [];
	let current = "";
	let quote: '"' | "'" | undefined;
	let escaped = false;
	let hasToken = false;

	for (const char of input) {
		if (escaped) {
			current += char;
			escaped = false;
			hasToken = true;
			continue;
		}

		if (char === "\\" && quote !== "'") {
			escaped = true;
			hasToken = true;
			continue;
		}

		if (quote) {
			if (char === quote) {
				quote = undefined;
			} else {
				current += char;
			}
			hasToken = true;
			continue;
		}

		if (char === '"' || char === "'") {
			quote = char;
			hasToken = true;
			continue;
		}

		if (/\s/.test(char)) {
			if (hasToken) {
				args.push(current);
				current = "";
				hasToken = false;
			}
			continue;
		}

		current += char;
		hasToken = true;
	}

	if (escaped) current += "\\";
	if (quote) return { args, error: `Unclosed ${quote} quote in /code arguments.` };
	if (hasToken) args.push(current);

	return { args };
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("code", {
		description: "Open VS Code via the code CLI. Arguments are forwarded to code.",
		handler: async (rawArgs, ctx) => {
			const { args, error } = parseCommandArgs(rawArgs ?? "");
			if (error) {
				ctx.ui.notify(error, "error");
				return;
			}

			const result = await pi.exec("code", args, { signal: ctx.signal });
			const output = (result.stdout || result.stderr).trim();
			if (result.code === 0) {
				ctx.ui.notify(output || (args.length > 0 ? `Ran: code ${args.join(" ")}` : "Ran: code"), "success");
				return;
			}

			const message = (output || `code exited with status ${result.code}`).trim();
			ctx.ui.notify(message, "error");
		},
	});
}
