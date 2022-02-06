import * as path from 'path';
import * as vscode from 'vscode';
import { TerminalCommand, Command, ValueCommand, VSCodeToastCommand } from '../../../../libs/shared/src/index';

export class BrowserWebView {

    private _context: vscode.ExtensionContext;
    private _panel: vscode.WebviewPanel;

    isOpen: boolean;

    onTerminalCommand: ((command: TerminalCommand) => void) | undefined;
    onValueCommand: ((command: ValueCommand) => void) | undefined;
    onVSCodeToastCommand: ((command: VSCodeToastCommand) => void) | undefined;

    private readonly commandListeners: { [key: string]: () => any } = {
        'npm-install': () => this.onTerminalCommand,
        'npm-uninstall': () => this.onTerminalCommand,
        'fetch-package': () => this.onTerminalCommand,
        'package-json-selected': () => this.onValueCommand,
        'vscode-toast-command': () => this.onVSCodeToastCommand
    };

    private readonly baseScripts = [
        'runtime.js',
        'polyfills.js',
        'scripts.js',
        'main.js',
    ];

    private readonly devScripts = [
        'styles.js',
        'vendor.js'
    ];

    constructor(context: vscode.ExtensionContext, production = false) {
        this._context = context;

        // Create and show a new webview
        this._panel = vscode.window.createWebviewPanel(
            'npmBrowser',
            'NPM Browser',
            vscode.ViewColumn.Active,
            {
                enableScripts: true,
                localResourceRoots: [this.getAssetUri()]
            }
        );

        this.isOpen = true;

        this._panel.onDidDispose(() => this.isOpen = false);

        this._panel.webview.html = this.getWebviewContent(production);

        this._panel.webview.onDidReceiveMessage(
            command => {
                // Process command from webview
                const commandListener = this.commandListeners[command.type];

                if (commandListener)
                    commandListener()(command);
            },
            undefined,
            context.subscriptions
        );
    }

    /**
     * Sends command to the web view.
     * @param command The command to send.
     */
    sendCommand(command: Command) {
        this._panel.webview.postMessage(command);
    }

    setActivePanel() {
        if (this._panel)
            this._panel.reveal(vscode.ViewColumn.Active);
    }

    private getAssetUri(...paths: string[]): vscode.Uri {
        return vscode.Uri.file(path.join(this._context.extensionPath, 'apps', 'extension', 'src', 'browser', ...paths));
    }

    private getAssetResourceUri(...paths: string[]): vscode.Uri {
        return this._panel.webview.asWebviewUri(this.getAssetUri(...paths));
    }

    /**
     * Gets the web view HTML containing the required Angular scripts.
     * @param production A boolean indicating if the Angular app should
     * be run in the production configuration.
     */
    private getWebviewContent(production: boolean): string {
        const nonce = this.getNonce();

        const contentSecurityPolicies = this.getContentSecurityPolicies(nonce);
        let scripts = this.baseScripts;

        if (!production)
            scripts = scripts.concat(this.devScripts);

        scripts = scripts.map(script => `<script nonce="${nonce}" src="${this.getAssetResourceUri(script)}" defer></script>`);

        return `<!doctype html>
                <html lang="en">
                <head>
                    <meta charset="utf-8">
                    <title>NpmBrowser</title>
                    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicies.join(';')}">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="icon" type="image/x-icon" href="favicon.ico">
                    ${production ? `<link rel="stylesheet" href="${this.getAssetResourceUri('styles.css')}">` : ''}
                </head>
                <body>
                    <npmb-root></npmb-root>
                    <script nonce="${nonce}">
                        const vscode = acquireVsCodeApi();
                        const workspaceState = ${JSON.stringify(BrowserWebView.escapePackageJsonHtml(this._context.workspaceState['_value']))};
                        const assetPath = "${this._panel.webview.asWebviewUri(vscode.Uri.file(this._context.extensionPath))}/apps/extension/src/browser/assets/";
                    </script>
                    ${scripts.join('')}
                </body>
                </html>`;
    }

    private getContentSecurityPolicies(nonce: string): string[] {
        return [
            `default-src ${this._panel.webview.cspSource}`,
            `script-src 'nonce-${nonce}'`,
            `style-src ${this._panel.webview.cspSource} \'unsafe-inline\'`,
            'font-src https:',
            `img-src ${this._panel.webview.cspSource} https: http:`,
            'connect-src https:'
        ];
    }

    private getNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private static tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    };
    
    private static replaceTag(tag) {
        return BrowserWebView.tagsToReplace[tag] || tag;
    }
    
    private static escapeHTML(str) {
        return str.replace(/[&<>]/g, this.replaceTag);
    }

    private static escapePackageJsonHtml(workspaceState) {
        const packageJsons = [ workspaceState.selectedPackageJson, ...workspaceState.packageJsons ];

        for (let packageJson of packageJsons) {
            if (packageJson.description)
                packageJson.description = BrowserWebView.escapeHTML(packageJson.readme);

            if (packageJson.readme)
                packageJson.readme = BrowserWebView.escapeHTML(packageJson.readme);
        }

        return workspaceState;
    }
}