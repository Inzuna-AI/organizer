// Bündelt notify/main.ts (inkl. src/lib/recurrence.ts und rrule) zu data-repo-template/scripts/notify.mjs.
// So nutzt der Workflow im Daten-Repo exakt dieselben Wiederholungsregeln wie die App.
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

await build({
  entryPoints: [`${root}notify/main.ts`],
  outfile: `${root}data-repo-template/scripts/notify.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['web-push'],
  alias: { '@': `${root}src` },
  legalComments: 'none',
  banner: {
    js: [
      '// Automatisch erzeugt aus dem Code-Repo „organizer“ (npm run build:notify). Nicht von Hand bearbeiten.',
      "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    ].join('\n'),
  },
  logLevel: 'info',
})
