declare module 'obsidian' {
	interface App {
		commands: {
			commands: { [commandId: string]: { id: string, name: string, callback: () => void } }
			executeCommandById(commandId: string): boolean
		}
	}
}
import { Notice, Plugin } from 'obsidian';
const { remote } = require("electron");

export default class QuitAfterSync extends Plugin {
	// settings: MyPluginSettings;
	hadError = false;
	quitRequested = false;
	originalConsoleError: (...args: any[]) => void;

	async onload() {
		console.log("SyncQuit plugin loaded");


		// Hook RS SYNC_DONE event
		const rs = (this.app as any).plugins.plugins["remotely-save"];
		if (rs) {
			rs.syncEvent.on("SYNC_DONE", () => this.handleSyncDone());
		}

		this.addCommand({
		  id: "sync-and-quit",
		  name: "Sync with Remotely Save, then Quit",
		  callback: async () => {
			if (!rs) {
				new Notice ("⚠️ Remotely Save not loaded.");
			} 
				this.quitRequested = true;
				this.hadError = false;
				this.originalConsoleError = console.error;
				console.error = (...args: any[]) => {
					this.hadError = true;
					this.originalConsoleError.apply(console,args);
				}
				new Notice ("🔄 Starting sync before quit.");
				this.app.commands.executeCommandById("remotely-save:start-sync")
		  },
		});
	}
	onunload() {
		console.log("SyncQuit plugin unloaded.");
	}

	handleSyncDone() {
		if(!this.quitRequested) return;
		
		if (this.originalConsoleError) {
			console.error = this.originalConsoleError;
		}
		if (this.hadError) {
			new Notice("❌ Sync failed. Not quitting.");
			this.hadError = false;
		} else {
			new Notice("✅ Sync succeeded. Quitting.");
			remote.app.quit()	
		}
	}
}
