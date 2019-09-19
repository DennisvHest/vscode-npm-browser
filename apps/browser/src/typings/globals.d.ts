interface VSCode {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
}

declare let vscode: VSCode;