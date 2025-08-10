import nx from '@nx/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'
import parser from '@typescript-eslint/parser'
import love from 'eslint-config-love'
import jsdoc from 'eslint-plugin-jsdoc'
import jsoncPlugin from 'eslint-plugin-jsonc'
import fixUnusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import jsoncParser from 'jsonc-eslint-parser'
import type * as tseslint from 'typescript-eslint'

export enum Extras {
  /**
   * Enable Nx from @nx/eslint-plugin
   */
  Nx,
}

export interface Config extends tseslint.ConfigWithExtends {
  /**
   * Additional plugins or confiigs to include
   */
  extras?: Extras[]
}

const tsCommon: tseslint.ConfigWithExtends = {
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['**/node_modules', '**/*.d.ts', '**/cdk.out', '**/dist', '**/.nx'],
  languageOptions: {
    parser,
    parserOptions: {
      sourceType: 'module',
    },
    globals: {
      ...globals.node,
      // @ts-expect-error We're using this to check if we're running in Bun
      Bun: typeof Bun !== 'undefined',
    },
  },
}

/**
 *
 * @param config
 */
export default function (config?: Config): tseslint.ConfigWithExtends[] {
  return [
    // stylistic
    stylistic.configs['disable-legacy'],
    {
      rules: {
        '@stylistic/consistent-type-assertions': 'off', // Sometimes they look better
        '@stylistic/no-non-null-assertion': 'off', // Required sometimes
        '@stylistic/strict-boolean-expressions': 'off', // If you know how JS type coercion works, this is fine
        '@stylistic/ban-ts-comment': 'off', // Sometimes you don't have time to fix it
        // '@stylistic/explicit-function-return-type': 'warn',
        '@stylistic/no-unused-vars': 'off', // This is handled by the fixUnusedImports plugin
        '@stylistic/comma-dangle': 'warn', // Should be auto-fixed
        '@stylistic/no-explicit-any': 'off', // Occasionally I have to be terrible
        '@stylistic/no-unsafe-type-assertion': 'off', // Basically the only reason to use type assertions
        '@stylistic/no-magic-numbers': 'off', // Let me put 0 in my code if I want to
        '@stylistic/no-new': 'off',
        // '@stylistic/no-redeclare': 'off', // Not relevant in TypeScript
        '@stylistic/prefer-destructuring': 'off',
        '@stylistic/no-console': 'off',
        '@stylistic/complexity': 'off',
        '@stylistic/max-params': 'off',
        '@stylistic/no-empty-object-type': 'off', // Sometimes this is useful if you intend to extend it later
      },
      plugins: {
        '@stylistic': stylistic,
      },
      ...tsCommon,
    },
    stylistic.configs.recommended,
    // jsdoc
    jsdoc.configs['flat/recommended-typescript'],
    // love
    love,
    // fix unused imports
    {
      plugins: {
        fixUnusedImports,
      },
      rules: {
        'fixUnusedImports/no-unused-imports': 'warn',
        'fixUnusedImports/no-unused-vars': 'warn',
      },
      ...tsCommon,
    },
    {
      rules: {
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
      },
    },
    // nx
    (config?.extras?.includes(Extras.Nx)
      ? {
          languageOptions: {
            parser: jsoncParser,
          },
          plugins: {
            jsonc: jsoncPlugin,
            nx,
          },
        }
      : {}),
    config ?? {},
  ]
}
