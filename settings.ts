import { PluginSettingTab, App, Setting } from "obsidian";
import EmojiShortcodesPlugin from "./main";
export interface PluginSettings {
	suggester: boolean;
	openAiKey: string;
	hotkey: string;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	suggester: true,
	openAiKey: "",
	hotkey: ":",
}

export class ChatGptSettings extends PluginSettingTab {
	plugin: EmojiShortcodesPlugin;

	constructor(app: App, plugin: EmojiShortcodesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings'});
		new Setting(containerEl)
			.setName('Chat Assistant')
			.setDesc('Enable the plugin.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.suggester)
				.onChange(async (value) => {
						this.plugin.settings.suggester = value;
						await this.plugin.saveSettings();
					}
				));
		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('Enter your OpenAI API Key')
			.addText(text => text
				.setPlaceholder('OpenAI API Key')
				.setValue(this.plugin.settings.openAiKey)
				.onChange(async (value) => {
						this.plugin.settings.openAiKey = value;
						await this.plugin.saveSettings();
					}
				));
		new Setting(containerEl)
			.setName('Hotkey')
			.setDesc('Enter the hotkey to trigger the plugin')
			// Make sure the key is a single character
			.addText(text => text
				.setPlaceholder('Hotkey')
				.setValue(this.plugin.settings.hotkey)
				.onChange(async (value) => {
						this.plugin.settings.hotkey = value;
						await this.plugin.saveSettings();
					}
				));
		new Setting(containerEl)
			.setName('Donate')
			.setDesc('If you like this plugin, please consider donating to support its development. I am a broke college student and every little bit helps!')
			.addExtraButton(button => button
				.onClick(() => {
					window.open("https://paypal.me/Okruse1?country.x=US&locale.x=en_US", "_blank");
				}
			)
			.setIcon('dollar-sign'));
	}
}
