import {
	Platform,
	Plugin,
	EditorSuggest,
	Editor,
	EditorPosition,
	TFile,
	EditorSuggestTriggerInfo,
	EditorSuggestContext,
	App
} from 'obsidian';
import { DEFAULT_SETTINGS, PluginSettings, ChatGptSettings } from './settings';


export default class ChatGPTHelper extends Plugin {
	settings: PluginSettings;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ChatGptSettings(this.app, this));
		this.registerEditorSuggest(new ChatGptHelper(this));

	}


	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}



}

class ChatGptHelper extends EditorSuggest<string> {
	plugin: ChatGPTHelper;
	app: App;



	constructor(plugin: ChatGPTHelper) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(cursor: EditorPosition, editor: Editor, _: TFile): EditorSuggestTriggerInfo | null {
		if (this.plugin.settings.suggester) {
			let title = this.app.workspace.getActiveFile()?.basename;
			let line = editor.getLine(cursor.line);
			try {
				line = editor.getLine(cursor.line - 1) + '\n' + line;
			}
			catch (error) {
			}
			try {
				line = editor.getLine(cursor.line - 2) + '\n' + line;
			}
			catch (error) {
			}
			line = "Title: " + title + "\n" + line;
			if (line.substring(line.length - this.plugin.settings.hotkey.length) === this.plugin.settings.hotkey) {
				//Remove the hotkey from the line and replace it with loading text
				line = line.substring(0, line.length - this.plugin.settings.hotkey.length);
				return {
					start: { line: cursor.line, ch: cursor.ch},
					end: { line: cursor.line, ch: cursor.ch },
					query: line,
				};

			}
		}
		return null;
	}


	async getSuggestions(context: EditorSuggestContext): Promise<string[]> {
		// Display loading in the status bar
		const status = this.plugin.addStatusBarItem();
		status.setText("Loading...");


		let suggestions: string[] = [];
		try {
			let search = context.query;
			console.log(search);
			// Use openAi to generate suggestions
			const requestOptions = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(this.plugin.settings.openAiKey)
				},
				body: JSON.stringify({
					'prompt': search,
					'temperature': 0.5,
					'max_tokens': 100,
					'top_p': 1,
					'frequency_penalty': 0.5,
					'presence_penalty': 0.5,
					'stop': ["\"\"\""],
				})
			};
			const response = await fetch('https://api.openai.com/v1/engines/text-curie-001/completions', requestOptions)
				.then(response => response.json())
				.then(data => {
					console.log(data);
					suggestions.push(data.choices[0].text)
				}).catch(err => {
					console.error(err + " " + this.plugin.settings.openAiKey + " " + search + " " + requestOptions.body + " " + requestOptions.headers.Authorization);
			});
		} catch (error) {
			console.log(`An error occurred in getSuggestions: ${error}`);
		}
		status.remove();
		return suggestions;

	}

	renderSuggestion(suggestion: string, el: HTMLElement): void {
		el.setText(suggestion);
	}

	selectSuggestion(suggestion: string): void {
		if (this.context) {
			(this.context.editor as Editor).replaceRange(suggestion, this.context.start, this.context.end);
			// Delete the hotkey from the end of the line
			(this.context.editor as Editor).replaceRange("", { line: this.context.start.line, ch: this.context.start.ch - this.plugin.settings.hotkey.length }, this.context.start);
			// Move the cursor to the end of the line
			(this.context.editor as Editor).setCursor({ line: this.context.start.line, ch: this.context.start.ch + suggestion.length - this.plugin.settings.hotkey.length });
		}
	}
}
