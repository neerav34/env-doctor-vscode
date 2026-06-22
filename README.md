# env-doctor for VS Code

The [env-doctor](https://github.com/neerav34/env-doctor) CLI, now as a VS Code extension.

Get inline squiggles on `process.env.VAR` references where `VAR` is not documented in your `.env.example`.

## Features

- **Real-time diagnostics** — warnings appear as you type, no save needed
- **Zero config** — reads `.env.example` from your workspace root automatically
- **JS/TS support** — works in `.js`, `.ts`, `.jsx`, `.tsx` files
- **Destructuring** — detects `const { API_KEY } = process.env` too

## Example

```ts
const url = process.env.DATABASE_URL; // ⚠ "DATABASE_URL" is not in .env.example
```

## Settings

| Setting | Default | Description |
|---|---|---|
| `envDoctor.exampleFile` | `.env.example` | Path to example file (relative to workspace root) |
| `envDoctor.enabled` | `true` | Enable/disable diagnostics |

## Links

- [npm package](https://www.npmjs.com/package/@neerav34/env-doctor) — CLI version
- [GitHub Action](https://github.com/neerav34/env-doctor-action) — PR comments
- [Landing page](https://env-doctor-web.vercel.app)
