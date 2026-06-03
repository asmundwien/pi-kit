import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import {
	CustomEditor,
	type ExtensionAPI,
	type ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import {
	Container,
	type SelectItem,
	SelectList,
	Text,
	truncateToWidth,
	visibleWidth,
} from "@mariozechner/pi-tui";

type PicockStyle = "minimal" | "heavy" | "double" | "block";

type PicockConfig = {
	color: string;
	style: PicockStyle;
};

type PicockPreview = {
	color: string | "rainbow";
	style: PicockStyle;
};

type FavoriteColor = {
	name: string;
	value: string;
};

type StylePreset = {
	name: string;
	value: PicockStyle;
	character: string;
	description: string;
};

const CONFIG_FILE = "picock.json";
const DEFAULT_STYLE: PicockStyle = "double";

const FAVORITE_COLORS: FavoriteColor[] = [
	{ name: "Picock Green", value: "#42b883" },
	{ name: "Azure Blue", value: "#007fff" },
	{ name: "Angular Red", value: "#dd0531" },
	{ name: "Svelte Orange", value: "#ff3d00" },
	{ name: "React Blue", value: "#61dafb" },
	{ name: "Purple", value: "#832561" },
	{ name: "JavaScript Yellow", value: "#f9e64f" },
	{ name: "Node Green", value: "#215732" },
];

const RAINBOW_COLORS = [
	"#dd0531",
	"#ff3d00",
	"#f9e64f",
	"#42b883",
	"#61dafb",
	"#007fff",
	"#832561",
];

const STYLE_PRESETS: StylePreset[] = [
	{
		name: "Minimal",
		value: "minimal",
		character: "─",
		description: "Thin border, closest to Pi's default editor line.",
	},
	{
		name: "Heavy",
		value: "heavy",
		character: "━",
		description: "Strong but clean full-width identity line.",
	},
	{
		name: "Double",
		value: "double",
		character: "═",
		description: "Distinct double-line identity border.",
	},
	{
		name: "Block",
		value: "block",
		character: "█",
		description: "Maximum visibility without background colors.",
	},
];

function isPicockStyle(value: unknown): value is PicockStyle {
	return STYLE_PRESETS.some((style) => style.value === value);
}

function isHexColor(value: unknown): value is string {
	return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function getConfigPath(cwd: string): string {
	return join(cwd, ".pi", CONFIG_FILE);
}

async function loadConfig(cwd: string): Promise<PicockConfig | undefined> {
	try {
		const raw = await readFile(getConfigPath(cwd), "utf8");
		const parsed = JSON.parse(raw) as Partial<PicockConfig>;
		if (!isHexColor(parsed.color)) return undefined;
		return {
			color: parsed.color,
			style: isPicockStyle(parsed.style) ? parsed.style : DEFAULT_STYLE,
		};
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		if (error instanceof SyntaxError) return undefined;
		throw error;
	}
}

async function saveConfig(cwd: string, config: PicockConfig): Promise<void> {
	const configPath = getConfigPath(cwd);
	const tempPath = `${configPath}.tmp`;
	await mkdir(join(cwd, ".pi"), { recursive: true });
	await writeFile(tempPath, `${JSON.stringify(config, null, "\t")}\n`, "utf8");
	await rename(tempPath, configPath);
}

async function removeConfig(cwd: string): Promise<void> {
	await rm(getConfigPath(cwd), { force: true });
}

function rgbFromHex(color: string): [number, number, number] {
	return [
		Number.parseInt(color.slice(1, 3), 16),
		Number.parseInt(color.slice(3, 5), 16),
		Number.parseInt(color.slice(5, 7), 16),
	];
}

function ansiRgb(
	[red, green, blue]: [number, number, number],
	text: string,
): string {
	return `\x1b[38;2;${red};${green};${blue}m${text}\x1b[0m`;
}

function ansiHex(color: string, text: string): string {
	return ansiRgb(rgbFromHex(color), text);
}

function interpolateColor(
	start: string,
	end: string,
	ratio: number,
): [number, number, number] {
	const startRgb = rgbFromHex(start);
	const endRgb = rgbFromHex(end);
	return startRgb.map((value, index) =>
		Math.round(value + ((endRgb[index] ?? value) - value) * ratio),
	) as [number, number, number];
}

function rainbowColorAt(
	index: number,
	length: number,
): [number, number, number] {
	if (length <= 1) return rgbFromHex(RAINBOW_COLORS[0] ?? "#42b883");
	const position = (index / (length - 1)) * (RAINBOW_COLORS.length - 1);
	const left = Math.floor(position);
	const right = Math.min(left + 1, RAINBOW_COLORS.length - 1);
	return interpolateColor(
		RAINBOW_COLORS[left] ?? "#42b883",
		RAINBOW_COLORS[right] ?? "#42b883",
		position - left,
	);
}

function colorizeLine(
	color: PicockPreview["color"],
	text: string,
	offset = 0,
	totalLength = Array.from(text).length,
): string {
	if (color !== "rainbow") return ansiHex(color, text);
	const characters = Array.from(text);
	return characters
		.map((character, index) =>
			ansiRgb(rainbowColorAt(offset + index, totalLength), character),
		)
		.join("");
}

function getStyleCharacter(style: PicockStyle): string {
	return (
		STYLE_PRESETS.find((preset) => preset.value === style)?.character ?? "━"
	);
}

function buildIdentityLabel(
	project: string,
	model: string,
	thinkingLevel: string,
): string {
	return [project, model, thinkingLevel].filter(Boolean).join(" · ");
}

function buildLine(options: {
	width: number;
	character: string;
	color: PicockPreview["color"];
	label?: string;
}): string {
	const { width, character, color } = options;
	if (width <= 0) return "";

	const plainLine = character.repeat(width);
	const label = options.label?.trim();
	if (!label || width < 12) return colorizeLine(color, plainLine);

	const maxLabelWidth = Math.max(0, width - 8);
	const trimmedLabel = truncateToWidth(label, maxLabelWidth);
	const labelSegment = ` ${trimmedLabel} `;
	const labelWidth = visibleWidth(labelSegment);
	if (labelWidth >= width) return labelSegment;

	const remaining = width - labelWidth;
	const leftWidth = Math.floor(remaining / 2);
	const rightWidth = remaining - leftWidth;

	return (
		colorizeLine(color, character.repeat(leftWidth), 0, width) +
		labelSegment +
		colorizeLine(
			color,
			character.repeat(rightWidth),
			leftWidth + labelWidth,
			width,
		)
	);
}

class PicockEditor extends CustomEditor {
	constructor(
		private readonly getConfig: () => PicockConfig | undefined,
		private readonly getLabel: () => string,
		...args: ConstructorParameters<typeof CustomEditor>
	) {
		super(...args);
	}

	override render(width: number): string[] {
		const lines = super.render(width);
		const config = this.getConfig();
		if (!config || lines.length < 2) return lines;

		const character = getStyleCharacter(config.style);
		lines[0] = buildLine({
			width,
			character,
			color: config.color,
			label: this.getLabel(),
		});
		lines[lines.length - 1] = buildLine({
			width,
			character,
			color: config.color,
		});
		return lines;
	}
}

export default function picockExtension(pi: ExtensionAPI) {
	let config: PicockConfig | undefined;
	let restoreEditor:
		| ReturnType<ExtensionContext["ui"]["getEditorComponent"]>
		| undefined;
	let editorApplied = false;
	let projectLabel = "";
	let modelLabel = "no-model";
	let thinkingLabel = "off";

	function applyEditor(ctx: ExtensionContext): void {
		if (!ctx.hasUI || !config) return;
		if (!editorApplied) restoreEditor = ctx.ui.getEditorComponent();
		ctx.ui.setEditorComponent(
			(tui, _theme, keybindings) =>
				new PicockEditor(
					() => config,
					() => buildIdentityLabel(projectLabel, modelLabel, thinkingLabel),
					tui,
					_theme,
					keybindings,
				),
		);
		editorApplied = true;
	}

	function restoreDefaultEditor(ctx: ExtensionContext): void {
		if (!ctx.hasUI) return;
		ctx.ui.setEditorComponent(restoreEditor);
		restoreEditor = undefined;
		editorApplied = false;
	}

	async function setConfig(
		nextConfig: PicockConfig,
		ctx: ExtensionContext,
	): Promise<void> {
		config = nextConfig;
		await saveConfig(ctx.cwd, nextConfig);
		applyEditor(ctx);
	}

	async function selectPicockItem(params: {
		ctx: ExtensionContext;
		title: string;
		items: SelectItem[];
		initialPreview: PicockPreview;
		previewFor: (item: SelectItem) => PicockPreview | undefined;
	}): Promise<SelectItem | undefined> {
		const { ctx, title, items, initialPreview, previewFor } = params;
		return ctx.ui.custom<SelectItem | undefined>((tui, theme, _kb, done) => {
			let preview = initialPreview;
			const container = new Container();
			container.addChild(new Text(theme.fg("accent", theme.bold(title)), 1, 0));

			const selectList = new SelectList(items, Math.min(items.length, 10), {
				selectedPrefix: (text) => theme.fg("accent", text),
				selectedText: (text) => theme.fg("accent", text),
				description: (text) => theme.fg("muted", text),
				scrollInfo: (text) => theme.fg("dim", text),
				noMatch: (text) => theme.fg("warning", text),
			});

			selectList.onSelect = (item) => done(item);
			selectList.onCancel = () => done(undefined);
			selectList.onSelectionChange = (item) => {
				preview = previewFor(item) ?? preview;
				tui.requestRender();
			};
			container.addChild(selectList);
			container.addChild(
				new Text(theme.fg("dim", "↑↓ preview • enter save • esc cancel"), 1, 0),
			);

			return {
				render(width: number) {
					const character = getStyleCharacter(preview.style);
					return [
						buildLine({
							width,
							character,
							color: preview.color,
							label: buildIdentityLabel(
								projectLabel,
								modelLabel,
								thinkingLabel,
							),
						}),
						...container.render(width),
						buildLine({ width, character, color: preview.color }),
					];
				},
				invalidate() {
					container.invalidate();
				},
				handleInput(data: string) {
					selectList.handleInput(data);
					tui.requestRender();
				},
			};
		});
	}

	async function selectColor(ctx: ExtensionContext): Promise<void> {
		const style = config?.style ?? DEFAULT_STYLE;
		const items = FAVORITE_COLORS.map((favorite) => ({
			value: favorite.value,
			label: favorite.name,
			description: favorite.value,
		}));
		const selected = await selectPicockItem({
			ctx,
			title: "Pick Picock color",
			items,
			initialPreview: config ?? {
				color: FAVORITE_COLORS[0]?.value ?? "#42b883",
				style,
			},
			previewFor: (item) => ({ color: item.value, style }),
		});

		if (!selected) return;

		await setConfig({ color: selected.value, style }, ctx);
		ctx.ui.notify("Picock color saved for this project", "info");
	}

	async function selectStyle(ctx: ExtensionContext): Promise<void> {
		if (!config) {
			ctx.ui.notify("Pick a Picock color before choosing a style", "warning");
			return;
		}

		const previousConfig = config;
		const items = STYLE_PRESETS.map((preset) => ({
			value: preset.value,
			label: preset.name,
			description: `${preset.character} ${preset.description}`,
		}));
		const selected = await selectPicockItem({
			ctx,
			title: "Pick Picock style",
			items,
			initialPreview: previousConfig,
			previewFor: (item) =>
				isPicockStyle(item.value)
					? { ...previousConfig, style: item.value }
					: undefined,
		});

		if (!selected || !isPicockStyle(selected.value)) return;

		await setConfig({ ...previousConfig, style: selected.value }, ctx);
		ctx.ui.notify("Picock style saved for this project", "info");
	}

	async function reset(ctx: ExtensionContext): Promise<void> {
		config = undefined;
		await removeConfig(ctx.cwd);
		restoreDefaultEditor(ctx);
		ctx.ui.notify("Picock reset for this project", "info");
	}

	async function selectAction(ctx: ExtensionContext): Promise<void> {
		const preview: PicockPreview = config ?? {
			color: "rainbow",
			style: DEFAULT_STYLE,
		};
		const selected = await selectPicockItem({
			ctx,
			title: "Picock",
			items: [
				{
					value: "color",
					label: "Color",
					description: "Choose and preview a project identity color.",
				},
				{
					value: "style",
					label: "Style",
					description: "Choose and preview the border character style.",
				},
				{
					value: "reset",
					label: "Reset",
					description: "Remove the project identity border.",
				},
			],
			initialPreview: preview,
			previewFor: () => preview,
		});

		if (selected?.value === "color") {
			await selectColor(ctx);
			return;
		}

		if (selected?.value === "style") {
			await selectStyle(ctx);
			return;
		}

		if (selected?.value === "reset") await reset(ctx);
	}

	pi.on("session_start", async (_event, ctx) => {
		projectLabel = basename(ctx.cwd) || ctx.cwd;
		modelLabel = ctx.model?.id || "no-model";
		thinkingLabel = pi.getThinkingLevel();
		config = await loadConfig(ctx.cwd);
		if (config) applyEditor(ctx);
	});

	pi.on("model_select", async (event, _ctx) => {
		modelLabel = event.model.id;
	});

	pi.on("thinking_level_select", async (event, _ctx) => {
		thinkingLabel = event.level;
	});

	pi.registerCommand("picock", {
		description: "Color the Pi input border for project identity.",
		handler: async (rawArgs, ctx) => {
			const command = (rawArgs ?? "").trim().toLowerCase();

			if (!ctx.hasUI) {
				ctx.ui.notify("Picock requires interactive UI mode", "error");
				return;
			}

			if (!command) {
				await selectAction(ctx);
				return;
			}

			if (command === "color") {
				await selectColor(ctx);
				return;
			}

			if (command === "style") {
				await selectStyle(ctx);
				return;
			}

			if (command === "reset") {
				await reset(ctx);
				return;
			}

			ctx.ui.notify("Usage: /picock [color|style|reset]", "warning");
		},
	});
}
