import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectVarsInText } from './detector';

export const outputChannel = vscode.window.createOutputChannel('env-doctor');

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

// Walk up from dir until we find exampleFileName or hit the filesystem root
function findExampleFile(startDir: string, exampleFileName: string): string | null {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, exampleFileName);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
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

  const exampleFileName = cfg.get<string>('exampleFile', '.env.example');

  const workspaceRoot = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;
  const fileDir = path.dirname(document.uri.fsPath);

  // Always walk up from the file's directory — handles monorepos and multi-root workspaces
  const examplePath = findExampleFile(fileDir, exampleFileName);

  outputChannel.appendLine(`[env-doctor] file: ${document.uri.fsPath}`);
  outputChannel.appendLine(`[env-doctor] workspace root: ${workspaceRoot ?? '(none)'}`);
  outputChannel.appendLine(`[env-doctor] .env.example found: ${examplePath ?? '(not found)'}`);

  if (!examplePath) {
    collection.delete(document.uri);
    return;
  }

  const defined = parseExampleFile(examplePath);
  outputChannel.appendLine(`[env-doctor] defined vars: ${[...defined].join(', ')}`);

  const text = document.getText();
  const usedVars = detectVarsInText(text);
  outputChannel.appendLine(`[env-doctor] used vars in file: ${usedVars.join(', ')}`);

  const diagnostics: vscode.Diagnostic[] = [];

  for (const varName of usedVars) {
    if (defined.has(varName)) continue;

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

  outputChannel.appendLine(`[env-doctor] diagnostics: ${diagnostics.length}`);
  collection.set(document.uri, diagnostics);
}
