import * as vscode from 'vscode';
import { computeDiagnostics } from './diagnostics';

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

export function activate(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection('env-doctor');
  context.subscriptions.push(collection);

  function runOnDoc(doc: vscode.TextDocument): void {
    if (!SUPPORTED_LANGUAGES.includes(doc.languageId)) return;
    computeDiagnostics(doc, collection);
  }

  function runOnAllOpen(): void {
    for (const doc of vscode.workspace.textDocuments) {
      runOnDoc(doc);
    }
  }

  // Run on all currently open documents
  runOnAllOpen();

  // Watch .env.example (and any custom exampleFile) for changes — re-scan all open docs
  const cfg = vscode.workspace.getConfiguration('envDoctor');
  const exampleFileName = cfg.get<string>('exampleFile', '.env.example');
  const watcher = vscode.workspace.createFileSystemWatcher(`**/${exampleFileName}`);
  context.subscriptions.push(
    watcher.onDidChange(() => runOnAllOpen()),
    watcher.onDidCreate(() => runOnAllOpen()),
    watcher.onDidDelete(() => runOnAllOpen()),
    watcher
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(runOnDoc),
    vscode.workspace.onDidChangeTextDocument(e => runOnDoc(e.document)),
    vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri)),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('envDoctor')) {
        runOnAllOpen();
      }
    })
  );
}

export function deactivate(): void {}
