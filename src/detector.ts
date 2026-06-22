// Regex patterns for detecting process.env usage — mirrors the CLI detector

const PROCESS_ENV_RE =
  /process\.env(?:\.([A-Z_][A-Z0-9_]*)|\[['"]([A-Z_][A-Z0-9_]*)['"\]])/g;

const DESTRUCTURE_RE =
  /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*process\.env/g;

function extractDestructuredNames(body: string): string[] {
  return body
    .split(',')
    .map(part => (part.split(/[:=]/)[0] ?? '').trim())
    .filter(name => /^[A-Z_][A-Z0-9_]*$/.test(name));
}

export function detectVarsInText(text: string): string[] {
  const found = new Set<string>();

  let m: RegExpExecArray | null;
  PROCESS_ENV_RE.lastIndex = 0;
  while ((m = PROCESS_ENV_RE.exec(text)) !== null) {
    const name = m[1] ?? m[2];
    if (name) found.add(name);
  }

  DESTRUCTURE_RE.lastIndex = 0;
  while ((m = DESTRUCTURE_RE.exec(text)) !== null) {
    for (const name of extractDestructuredNames(m[1] ?? '')) {
      found.add(name);
    }
  }

  return Array.from(found);
}
