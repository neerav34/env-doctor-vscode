import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectVarsInText } from './detector';

function parseExampleFile(filePath: string): Set<string> {
  const defined = new Set<string>();
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return defined;
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    const key = eq === -1 ? trimmed : trimmed.slice(0, eq);
    const name = key.trim();
    if (name) defined.add(name);
  }
  return defined;
}

export function computeDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  const cfg = vscode.workspace.getConfiguration('envDoctor');
  if (!cfg.get<boolean>('enabled', true)) {
    collection.delete(document.uri);
    return;
  }

  const workspaceRoot =
    vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
  if (!workspaceRoot) return;

  const exampleFileName = cfg.get<string>('exampleFile', '.env.example');
  const examplePath = path.join(workspaceRoot, exampleFileName);
  const defined = parseExampleFile(examplePath);

  const text = document.getText();
  const usedVars = detectVarsInText(text);
  const diagnostics: vscode.Diagnostic[] = [];

  for (const varName of usedVars) {
    if (defined.has(varName)) continue;

    // Find all occurrences in the text and create a diagnostic for each
    const re = new RegExp(
      `process\\.env(?:\\.${varName}|\\[['"]${varName}['"]\\])`,
      'g'
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const startPos = document.positionAt(m.index);
      const endPos = document.positionAt(m.index + m[0].length);
      const range = new vscode.Range(startPos, endPos);
      const diag = new vscode.Diagnostic(
        range,
        `env-doctor: "${varName}" is not documented in ${exampleFileName}`,
        vscode.DiagnosticSeverity.Warning
      );
      diag.source = 'env-doctor';
      diag.code = 'missing-in-example';
      diagnostics.push(diag);
    }
  }

  collection.set(document.uri, diagnostics);
}
