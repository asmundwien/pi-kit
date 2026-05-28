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
	if (quote)
		return { args, error: `Unclosed ${quote} quote in /open arguments.` };
	if (hasToken) args.push(current);

	return { args };
}

function getOpenCommand(): {
	command: string;
	argsPrefix: string[];
	label: string;
} {
	if (process.platform === "darwin") {
		return { command: "open", argsPrefix: [], label: "open" };
	}

	if (process.platform === "win32") {
		return { command: "cmd", argsPrefix: ["/c", "start", ""], label: "start" };
	}

	return { command: "xdg-open", argsPrefix: [], label: "xdg-open" };
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("open", {
		description:
			"Open files, directories, or URLs with the OS default opener. Arguments are forwarded to the platform opener.",
		handler: async (rawArgs, ctx) => {
			const { args, error } = parseCommandArgs(rawArgs ?? "");
			if (error) {
				ctx.ui.notify(error, "error");
				return;
			}

			const { command, argsPrefix, label } = getOpenCommand();
			const result = await pi.exec(command, [...argsPrefix, ...args], {
				signal: ctx.signal,
			});
			const output = (result.stdout || result.stderr).trim();
			if (result.code === 0) {
				ctx.ui.notify(
					output ||
						(args.length > 0
							? `Ran: ${label} ${args.join(" ")}`
							: `Ran: ${label}`),
					"info",
				);
				return;
			}

			const message = (
				output || `${label} exited with status ${result.code}`
			).trim();
			ctx.ui.notify(message, "error");
		},
	});
}
