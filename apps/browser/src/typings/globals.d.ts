interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

declare let vscode: VSCode;

interface VSCodeWorkspace {
    packageJson: any;
}

declare let workspaceState: VSCodeWorkspace;