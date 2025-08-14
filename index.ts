import stylistic from '@stylistic/eslint-plugin'
import parser from '@typescript-eslint/parser'
import love from 'eslint-config-love'
import jsdoc from 'eslint-plugin-jsdoc'
import jsoncPlugin from 'eslint-plugin-jsonc'
import fixUnusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import jsoncParser from 'jsonc-eslint-parser'
import * as tseslint from 'typescript-eslint'

export enum Extras {
  /**
   * Enable Nx from @nx/eslint-plugin
   */
  Nx,
}

export interface Config extends tseslint.ConfigWithExtends {
  /**
   * Additional plugins or configs to include
   */
  extras?: Extras[]
}

const tsCommon: tseslint.ConfigWithExtends = {
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['**/node_modules/**', '**/*.d.ts', '**/cdk.out', '**/dist', '**/.nx'],
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
  rules: {
    '@typescript-eslint/max-params': 'off',
    '@typescript-eslint/init-declarations': 'off',

    // Import and unused variable handling
    'fixUnusedImports/no-unused-imports': 'warn',
    'fixUnusedImports/no-unused-vars': 'warn',
    '@stylistic/no-unused-vars': 'off', // This is handled by the fixUnusedImports plugin
    '@typescript-eslint/no-unused-vars': 'off', // Handled by fixUnusedImports

    // Code complexity and structure
    'complexity': 'off',
    '@stylistic/complexity': 'off',
    '@stylistic/max-params': 'off',
    'max-lines': 'off',

    // Magic numbers - can be re-enabled with allowlist
    '@stylistic/no-magic-numbers': 'off', // Let me put 0 in my code if I want to
    '@typescript-eslint/no-magic-numbers': 'off',
    // Console and debugging
    'no-console': 'off',

    // Type safety rules
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'off', // TODO: Conflicts with ts-toolbelt types
    '@typescript-eslint/no-unsafe-assignment': 'off', // TODO: Conflicts with ts-toolbelt types
    '@typescript-eslint/no-unsafe-member-access': 'off', // TODO: Conflicts with ts-toolbelt types
    '@typescript-eslint/no-unsafe-type-assertion': 'off', // I mean, why else would you use a type assertion?

    // Boolean expressions and conditions
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@stylistic/strict-boolean-expressions': 'off', // If you know how JS type coercion works, this is fine
    '@typescript-eslint/no-unnecessary-condition': ['warn', { allowConstantLoopConditions: true }],

    // Object and type definitions
    '@typescript-eslint/no-empty-object-type': ['warn', { allowInterfaces: 'with-single-extends' }], // Allow when extending
    '@stylistic/no-empty-object-type': 'off', // Sometimes this is useful if you intend to extend it later

    // Function definitions
    '@typescript-eslint/explicit-function-return-type': ['warn', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
      allowHigherOrderFunctions: true,
      allowDirectConstAssertionInArrowFunctions: true,
      allowConciseArrowFunctionExpressionsStartingWithVoid: true,
    }],
    '@typescript-eslint/promise-function-async': 'off', // pulumi.Output is considered a promise

    // Destructuring preferences
    '@stylistic/prefer-destructuring': 'off',
    '@typescript-eslint/prefer-destructuring': ['warn', {
      array: false,
      object: true,
    }, {
      enforceForRenamedProperties: false,
    }],

    // Assertions and non-null
    '@stylistic/consistent-type-assertions': 'off', // Sometimes they look better
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@stylistic/no-non-null-assertion': 'off', // Required sometimes
    '@typescript-eslint/no-non-null-assertion': 'off',

    // Constructor and instantiation
    '@stylistic/no-new': 'off',
    'no-new': 'off', // used quite often in Pulumi code

    // String conversion (Pulumi specific)
    '@typescript-eslint/no-base-to-string': 'off', // used quite often in Pulumi code

    // Comments and documentation
    'eslint-comments/require-description': ['warn', { ignore: ['eslint-enable'] }],
    '@typescript-eslint/ban-ts-comment': 'off',

    // Stylistic rules (handled by other tools)
    '@stylistic/comma-dangle': 'warn', // Should be auto-fixed
    '@stylistic/arrow-parens': 'off',
    '@stylistic/space-before-function-paren': 'off', // Handled by Love
    '@stylistic/brace-style': 'off', // Handled by Love

    '@typescript-eslint/class-methods-use-this': 'off',

    ...stylistic.configs['disable-legacy'].rules,
  },
}

/**
 *
 * @param config
 */
export default async function (config?: Config) {
  return tseslint.config({
    ...tsCommon,
    extends: [
      {
        plugins: {
          '@stylistic': stylistic,
        },
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
      },
      // nx
      (config?.extras?.includes(Extras.Nx)
        ? {
            languageOptions: {
              parser: jsoncParser,
            },
            plugins: {
              jsonc: jsoncPlugin,
              nx: await import('@nx/eslint-plugin'),
            },
          }
        : {}),
      config ?? {},
      // stylistic
      stylistic.configs['disable-legacy'],
    ],
  })
}
