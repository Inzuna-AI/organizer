import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'coverage', 'data-repo-template'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Features importieren voneinander nur über index.ts
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message: 'Andere Features nur über ihre index.ts importieren (@/features/<bereich>).',
            },
          ],
        },
      ],
    },
  },
  {
    // lib und components hängen nie von features ab
    files: ['src/lib/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/*', '@/features/**', '**/features/**'],
              message: 'src/lib und src/components dürfen nicht aus src/features importieren.',
            },
          ],
        },
      ],
    },
  },
  {
    // Benachrichtigungslogik läuft in Node (GitHub Actions): nur lib und types, kein Store, keine Features
    files: ['src/notify/**/*.ts', 'notify/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features', '@/features/**', '**/features/**', '@/store', '@/store/**', '@/components/**'],
              message: 'src/notify läuft in Node und darf nur @/lib und @/types verwenden.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
)
