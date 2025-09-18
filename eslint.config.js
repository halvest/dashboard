import nextPlugin from '@next/eslint-plugin-next'
import securityPlugin from 'eslint-plugin-security'

export default [
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      security: securityPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...securityPlugin.configs.recommended.rules,
      'no-console': 'warn',
      '@next/next/no-img-element': 'off',
    },
  },
]
