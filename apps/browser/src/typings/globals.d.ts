interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

declare let vscode: VSCode;

interface VSCodeWorkspace {
    packageJson: import("../../../../libs/shared/src/index").PackageJson;
}

declare let workspaceState: VSCodeWorkspace;