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

  // Run on all currently open documents
  for (const doc of vscode.workspace.textDocuments) {
    runOnDoc(doc);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(runOnDoc),
    vscode.workspace.onDidChangeTextDocument(e => runOnDoc(e.document)),
    vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri)),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('envDoctor')) {
        for (const doc of vscode.workspace.textDocuments) {
          runOnDoc(doc);
        }
      }
    })
  );
}

export function deactivate(): void {}
