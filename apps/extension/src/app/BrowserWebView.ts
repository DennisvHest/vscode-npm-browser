import * as path from 'path';
import * as vscode from 'vscode';
import { TerminalCommand, Command } from '../../../../libs/shared/src/index';

export class BrowserWebView {

    private _context: vscode.ExtensionContext;
    private _panel: vscode.WebviewPanel;

    private readonly commandListeners: { [key: string]: any } = {
        'npm-install': this.onTerminalCommand
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

    constructor(context: vscode.ExtensionContext, private onTerminalCommand: ((command: TerminalCommand) => void), production = false) {
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

        this._panel.webview.html = this.getWebviewContent(production);

        this._panel.webview.onDidReceiveMessage(
            command => {
                // Process command from webview
                const commandListener = this.commandListeners[command.type];

                if (commandListener)
                    commandListener(command);
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

    private getAssetUri(...paths: string[]): vscode.Uri {
        return vscode.Uri.file(path.join(this._context.extensionPath, 'browser', ...paths));
    }

    private getAssetResourceUri(...paths: string[]): vscode.Uri {
        return this.getAssetUri(...paths).with({ scheme: 'vscode-resource' });
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
                    <base href="${this.getAssetResourceUri()}/">
                    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicies.join(';')}">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="icon" type="image/x-icon" href="favicon.ico">
                    ${production ? '<link rel="stylesheet" href="styles.css">' : ''}
                </head>
                <body>
                    <npmb-root></npmb-root>
                    <script nonce="${nonce}">
                        const vscode = acquireVsCodeApi();
                    </script>
                    ${scripts.join('')}
                </body>
                </html>`;
    }

    private getContentSecurityPolicies(nonce: string): string[] {
        return [
            'default-src vscode-resource:',
            `script-src 'nonce-${nonce}'`,
            'style-src vscode-resource: \'unsafe-inline\'',
            'font-src https:',
            'img-src vscode-resource: https: http:',
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
}