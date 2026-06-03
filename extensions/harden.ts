import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function buildHardenPrompt(rawArgs: string, isQueued = false): string {
	const request = rawArgs.trim();
	const requestText = request
		? `Harden request: ${request}`
		: "Harden request: run the hardening workflow. If the target or criteria are missing, ask for the missing input before hardening.";
	const queuedText = isQueued
		? "This request was queued; evaluate state-sensitive targets against the current state when this message is processed and mention that in the report."
		: undefined;

	return [
		"Please load and follow the harden skill.",
		"Apply the request below as the hardening target or focus.",
		queuedText,
		"",
		requestText,
	]
		.filter((line) => line !== undefined)
		.join("\n");
}

export default function (pi: ExtensionAPI) {
	pi.registerCommand("harden", {
		description:
			"Run a bounded multi-angle hardening workflow using the harden skill.",
		handler: async (rawArgs, ctx) => {
			if (ctx.isIdle()) {
				pi.sendUserMessage(buildHardenPrompt(rawArgs ?? ""));
				return;
			}

			pi.sendUserMessage(buildHardenPrompt(rawArgs ?? "", true), {
				deliverAs: "followUp",
			});
			ctx.ui.notify(
				"Harden request queued; state-sensitive targets are evaluated when it runs.",
				"info",
			);
		},
	});
}
