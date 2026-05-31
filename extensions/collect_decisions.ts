import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
	Editor,
	type EditorTheme,
	Key,
	matchesKey,
	Text,
	truncateToWidth,
} from "@mariozechner/pi-tui";
import { Type } from "typebox";

type Suggestion = {
	value: string;
	label: string;
	description?: string;
};

type RenderSuggestion = Suggestion & { isCustom?: boolean };

type DecisionTopic = {
	id: string;
	label: string;
	problem: string;
	suggestions: Suggestion[];
	allowCustom: boolean;
};

type DecisionAnswer = {
	id: string;
	value: string;
	label: string;
	wasCustom: boolean;
	index?: number;
};

type CollectDecisionsResult = {
	title?: string;
	decisions: DecisionTopic[];
	answers: DecisionAnswer[];
	pending: DecisionTopic[];
	cancelled: boolean;
	paused: boolean;
};

const SuggestionSchema = Type.Object({
	value: Type.String({ description: "Stable value returned when selected" }),
	label: Type.String({ description: "Short label shown to the user" }),
	description: Type.Optional(
		Type.String({ description: "Optional explanation shown below the label" }),
	),
});

const DecisionTopicSchema = Type.Object({
	id: Type.String({ description: "Stable unique identifier for this topic" }),
	label: Type.Optional(
		Type.String({ description: "Short navigation label, e.g. Scope or UX" }),
	),
	problem: Type.String({
		description: "The single problem or decision to present",
	}),
	suggestions: Type.Array(SuggestionSchema, {
		description: "Suggested answers or directions the user may choose from",
	}),
	allowCustom: Type.Optional(
		Type.Boolean({ description: "Allow the user to write a custom answer" }),
	),
});

const InitialAnswerSchema = Type.Object({
	id: Type.String({
		description: "Decision topic id this previous answer belongs to",
	}),
	value: Type.String({ description: "Previously selected or written value" }),
	label: Type.String({
		description: "Previously selected or written display label",
	}),
	wasCustom: Type.Boolean({ description: "Whether this was a custom answer" }),
	index: Type.Optional(
		Type.Number({ description: "One-based suggestion index" }),
	),
});

const CollectDecisionsParams = Type.Object({
	title: Type.Optional(
		Type.String({ description: "Short title for the decision collection" }),
	),
	decisions: Type.Array(DecisionTopicSchema, {
		description:
			"Full ordered decision list. When resuming, pass all original decisions, not only pending decisions.",
	}),
	initialAnswers: Type.Optional(
		Type.Array(InitialAnswerSchema, {
			description:
				"Previously collected answers when resuming a paused decision collection. These pre-fill answered topics and keep them navigable.",
		}),
	),
});

function buildResult(
	message: string,
	result: CollectDecisionsResult,
): {
	content: { type: "text"; text: string }[];
	details: CollectDecisionsResult;
} {
	return { content: [{ type: "text", text: message }], details: result };
}

function cancelledResult(message: string): {
	content: { type: "text"; text: string }[];
	details: CollectDecisionsResult;
} {
	return buildResult(message, {
		decisions: [],
		answers: [],
		pending: [],
		cancelled: true,
		paused: false,
	});
}

function normalizeDecisions(params: {
	title?: string;
	decisions: Array<{
		id: string;
		label?: string;
		problem: string;
		suggestions: Suggestion[];
		allowCustom?: boolean;
	}>;
	initialAnswers?: DecisionAnswer[];
}): DecisionTopic[] {
	return params.decisions.map((decision, index) => ({
		...decision,
		label: decision.label || `D${index + 1}`,
		allowCustom: decision.allowCustom !== false,
	}));
}

function summarizeResult(result: CollectDecisionsResult): string {
	const lines: string[] = [];
	if (result.title) lines.push(`Decision collection: ${result.title}`);

	if (result.answers.length > 0) {
		lines.push("Answers:");
		for (const answer of result.answers) {
			const topic = result.decisions.find(
				(decision) => decision.id === answer.id,
			);
			const label = topic?.label || answer.id;
			if (answer.wasCustom) {
				lines.push(`- ${label}: user wrote: ${answer.label}`);
			} else {
				lines.push(
					`- ${label}: user selected: ${answer.index}. ${answer.label}`,
				);
			}
		}
	}

	if (result.pending.length > 0) {
		lines.push("Pending decisions:");
		for (const topic of result.pending) {
			lines.push(`- ${topic.label}: ${topic.problem}`);
		}
	}

	if (result.paused) {
		lines.push(
			"User paused decision collection. Discuss the current topic, then resume with all original decisions and these answers as initialAnswers so answered topics remain navigable.",
		);
	}

	return lines.join("\n") || "Decision collection completed with no answers.";
}

function renderStatus(
	answered: boolean,
	active: boolean,
	label: string,
	theme: Theme,
) {
	const box = answered ? "■" : "□";
	const text = ` ${box} ${label} `;
	if (active) return theme.bg("selectedBg", theme.fg("text", text));
	return theme.fg(answered ? "success" : "muted", text);
}

type Theme = Parameters<
	NonNullable<Parameters<ExtensionAPI["registerTool"]>[0]["renderCall"]>
>[1];

export default function collectDecisions(pi: ExtensionAPI) {
	pi.registerTool({
		name: "collect_decisions",
		label: "Collect decisions",
		description:
			"Collect multiple dependent human decisions one topic at a time. Use this instead of presenting a wall of questions. Provide concise problem statements, suggested answers, and allow custom answers when useful.",
		parameters: CollectDecisionsParams,

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			if (!ctx.hasUI) {
				return cancelledResult(
					"Error: collect_decisions requires interactive UI mode.",
				);
			}

			if (params.decisions.length === 0) {
				return cancelledResult(
					"Error: collect_decisions received no decisions.",
				);
			}

			const decisions = normalizeDecisions(params);
			const result = await ctx.ui.custom<CollectDecisionsResult>(
				(tui, theme, _kb, done) => {
					let currentIndex = 0;
					let suggestionIndex = 0;
					let customInputFor: string | undefined;
					let cachedLines: string[] | undefined;
					const decisionIds = new Set(decisions.map((decision) => decision.id));
					const answers = new Map<string, DecisionAnswer>(
						(params.initialAnswers || [])
							.filter((answer) => decisionIds.has(answer.id))
							.map((answer) => [answer.id, answer]),
					);
					const firstUnanswered = decisions.findIndex(
						(decision) => !answers.has(decision.id),
					);
					if (firstUnanswered !== -1) currentIndex = firstUnanswered;
					const editorTheme: EditorTheme = {
						borderColor: (text) => theme.fg("accent", text),
						selectList: {
							selectedPrefix: (text) => theme.fg("accent", text),
							selectedText: (text) => theme.fg("accent", text),
							description: (text) => theme.fg("muted", text),
							scrollInfo: (text) => theme.fg("dim", text),
							noMatch: (text) => theme.fg("warning", text),
						},
					};
					const editor = new Editor(tui, editorTheme);

					function pending() {
						return decisions.filter((decision) => !answers.has(decision.id));
					}

					function finish(cancelled: boolean, paused: boolean) {
						done({
							title: params.title,
							decisions,
							answers: Array.from(answers.values()),
							pending: pending(),
							cancelled,
							paused,
						});
					}

					function refresh() {
						cachedLines = undefined;
						tui.requestRender();
					}

					function currentDecision() {
						return decisions[currentIndex];
					}

					function suggestions(): RenderSuggestion[] {
						const decision = currentDecision();
						if (!decision) return [];
						const items: RenderSuggestion[] = [...decision.suggestions];
						if (decision.allowCustom) {
							items.push({
								value: "__custom__",
								label: "Write my own answer",
								isCustom: true,
							});
						}
						return items;
					}

					function isAnsweredSuggestion(
						decision: DecisionTopic,
						item: RenderSuggestion,
						index: number,
					) {
						const answer = answers.get(decision.id);
						if (!answer) return false;
						if (item.isCustom) return answer.wasCustom;
						return !answer.wasCustom && answer.index === index + 1;
					}

					function moveToNextUnanswered() {
						const next = decisions.findIndex(
							(decision) => !answers.has(decision.id),
						);
						if (next === -1) {
							finish(false, false);
							return;
						}
						currentIndex = next;
						suggestionIndex = 0;
						refresh();
					}

					function saveAnswer(
						decision: DecisionTopic,
						value: string,
						label: string,
						wasCustom: boolean,
						index?: number,
					) {
						answers.set(decision.id, {
							id: decision.id,
							value,
							label,
							wasCustom,
							index,
						});
					}

					editor.onSubmit = (value) => {
						const decision = decisions.find(
							(item) => item.id === customInputFor,
						);
						if (!decision) return;
						const trimmed = value.trim() || "(no response)";
						saveAnswer(decision, trimmed, trimmed, true);
						customInputFor = undefined;
						editor.setText("");
						moveToNextUnanswered();
					};

					function handleInput(data: string) {
						if (customInputFor) {
							if (matchesKey(data, Key.escape)) {
								customInputFor = undefined;
								editor.setText("");
								refresh();
								return;
							}
							editor.handleInput(data);
							refresh();
							return;
						}

						const decision = currentDecision();
						const items = suggestions();

						if (matchesKey(data, Key.right) || matchesKey(data, Key.tab)) {
							currentIndex = (currentIndex + 1) % decisions.length;
							suggestionIndex = 0;
							refresh();
							return;
						}

						if (
							matchesKey(data, Key.left) ||
							matchesKey(data, Key.shift("tab"))
						) {
							currentIndex =
								(currentIndex - 1 + decisions.length) % decisions.length;
							suggestionIndex = 0;
							refresh();
							return;
						}

						if (matchesKey(data, Key.up)) {
							suggestionIndex = Math.max(0, suggestionIndex - 1);
							refresh();
							return;
						}

						if (matchesKey(data, Key.down)) {
							suggestionIndex = Math.min(items.length - 1, suggestionIndex + 1);
							refresh();
							return;
						}

						if (matchesKey(data, Key.enter) && decision) {
							const item = items[suggestionIndex];
							if (!item) return;
							if (item.isCustom) {
								customInputFor = decision.id;
								editor.setText("");
								refresh();
								return;
							}
							saveAnswer(
								decision,
								item.value,
								item.label,
								false,
								suggestionIndex + 1,
							);
							moveToNextUnanswered();
							return;
						}

						if (matchesKey(data, Key.escape)) finish(true, true);
					}

					function render(width: number) {
						if (cachedLines) return cachedLines;
						const lines: string[] = [];
						const decision = currentDecision();
						const items = suggestions();
						const add = (line: string) =>
							lines.push(truncateToWidth(line, width));

						add(theme.fg("accent", "─".repeat(width)));
						if (params.title)
							add(theme.fg("accent", theme.bold(` ${params.title}`)));
						add(
							` ${decisions
								.map((item, index) =>
									renderStatus(
										answers.has(item.id),
										index === currentIndex,
										item.label,
										theme,
									),
								)
								.join(" ")}`,
						);
						lines.push("");

						if (decision) {
							add(
								theme.fg(
									"muted",
									` Topic ${currentIndex + 1} of ${decisions.length}`,
								),
							);
							add(theme.fg("text", ` ${decision.problem}`));
							lines.push("");

							for (let index = 0; index < items.length; index++) {
								const item = items[index];
								const selected = index === suggestionIndex;
								const answered = isAnsweredSuggestion(decision, item, index);
								const prefix = selected ? theme.fg("accent", "> ") : "  ";
								const marker = answered ? theme.fg("success", "✓ ") : "";
								const color = selected || answered ? "accent" : "text";
								const answer = answers.get(decision.id);
								const customAnswer =
									answered && item.isCustom ? answer?.label : undefined;
								const label = customAnswer
									? `${index + 1}. ${item.label}: ${customAnswer}`
									: `${index + 1}. ${item.label}`;
								add(`${prefix}${marker}${theme.fg(color, label)}`);
								if (item.description)
									add(`     ${theme.fg("muted", item.description)}`);
							}
						}

						if (customInputFor) {
							lines.push("");
							add(theme.fg("muted", " Your answer:"));
							for (const line of editor.render(Math.max(1, width - 2)))
								add(` ${line}`);
						}

						lines.push("");
						const help = customInputFor
							? " Enter submits custom answer • Esc returns to suggestions"
							: " ←/→ switch topic • ↑/↓ choose answer • Enter confirm • Esc pause and return pending decisions";
						add(theme.fg("dim", help));
						add(theme.fg("accent", "─".repeat(width)));
						cachedLines = lines;
						return lines;
					}

					return {
						render,
						invalidate: () => {
							cachedLines = undefined;
						},
						handleInput,
					};
				},
			);

			return buildResult(summarizeResult(result), result);
		},

		renderCall(args, theme) {
			const decisions = (args.decisions as DecisionTopic[]) || [];
			const labels = decisions
				.map((decision) => decision.label || decision.id)
				.join(", ");
			let text = theme.fg("toolTitle", theme.bold("collect_decisions "));
			text += theme.fg(
				"muted",
				`${decisions.length} topic${decisions.length === 1 ? "" : "s"}`,
			);
			if (labels) text += theme.fg("dim", ` (${truncateToWidth(labels, 40)})`);
			return new Text(text, 0, 0);
		},

		renderResult(result, _options, theme) {
			const details = result.details as CollectDecisionsResult | undefined;
			if (!details) {
				const first = result.content[0];
				return new Text(first?.type === "text" ? first.text : "", 0, 0);
			}

			const lines: string[] = [];
			for (const answer of details.answers) {
				const marker = answer.wasCustom ? "(wrote)" : `${answer.index}.`;
				lines.push(
					`${theme.fg("success", "✓ ")}${theme.fg("accent", answer.id)}: ${theme.fg("muted", marker)} ${answer.label}`,
				);
			}
			if (details.pending.length > 0) {
				lines.push(
					theme.fg(
						"warning",
						`${details.pending.length} pending decision${details.pending.length === 1 ? "" : "s"}`,
					),
				);
			}
			if (details.paused)
				lines.push(theme.fg("muted", "Paused for discussion"));
			return new Text(lines.join("\n") || "No answers", 0, 0);
		},
	});
}
