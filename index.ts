import type { Config as EslintConfig, ExtendsElement } from '@eslint/config-helpers'
import stylistic from '@stylistic/eslint-plugin'
import parser from '@typescript-eslint/parser'
import love from 'eslint-config-love'
import { importX } from 'eslint-plugin-import-x'
import jsdoc from 'eslint-plugin-jsdoc'
import fixUnusedImports from 'eslint-plugin-unused-imports'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

export interface Config extends EslintConfig {
  /**
   * Globs to add to the ignore list
   * Merged into {@link defaultIgnores}
   */
  ignores?: string[]
  /**
   * Root directory for tsconfig files.
   * If tsconfig is in the same directory as your eslint config,
   * this should be set to `dirname(fileURLToPath(import.meta.url))`
   */
  tsconfigRootDir: string
  /**
   * Rules to override.
   * Merged into {@link defaultRules}
   */
  rules?: EslintConfig['rules']
  /**
   * Globs of files to lint.
   * Defaults to '*.ts' and '*.tsx' recursively.
   * If provided, will override the default.
   */
  files?: string[]
  /**
   * Additional files that are not specified in tsconfig that should still be
   * included in type-aware linting.
   * Merged into {@link defaultAllowDefaultProject}
   */
  allowDefaultProject?: string[]
}

export const defaultAllowDefaultProject = ['eslint.config.ts', '*.config.ts', '*.config.mts']

/** Default global ignore patterns */
export const defaultIgnores = [
  '**/node_modules/**',
  '**/*.d.ts',
  '**/cdk.out/**',
  '**/dist/**',
  '**/.nx/**',
  '**/.yarn/**',
  '**/*.tsbuildinfo',
]

/** Default rules applied to all TS files */
export const defaultRules: EslintConfig['rules'] = {
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
  'no-plusplus': 'off',

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
  '@typescript-eslint/ban-ts-comment': 'off',

  // Stylistic rules (handled by other tools)
  '@stylistic/comma-dangle': 'warn', // Should be auto-fixed
  '@stylistic/arrow-parens': 'off',
  '@stylistic/space-before-function-paren': 'off', // Handled by Love
  '@stylistic/brace-style': 'off', // Handled by Love

  '@typescript-eslint/class-methods-use-this': 'off',

  ...stylistic.configs['disable-legacy'].rules,

  '@typescript-eslint/require-await': 'off',
  'import-x/no-nodejs-modules': 'off',
  'no-param-reassign': 'off',
}

/** Shared plugin configs to extend from */
export const extendables: ExtendsElement[] = [
  stylistic.configs.recommended,
  jsdoc.configs['flat/recommended-typescript'],
  love,
  { plugins: { fixUnusedImports } },
  stylistic.configs['disable-legacy'],
  {
    plugins: { 'import-x': importX },
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'import-x/no-dynamic-require': 'off',
      'import-x/no-nodejs-modules': 'off',
    },
  },
]

export default function (config?: Config): EslintConfig[] {
  return [
    {
      ignores: [...defaultIgnores, ...(config?.ignores ?? [])],
    },
    ...defineConfig({
      files: config?.files ?? ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parser,
        parserOptions: {
          sourceType: 'module',
          projectService: {
            allowDefaultProject: [...defaultAllowDefaultProject, ...(config?.allowDefaultProject ?? [])],
          },
          tsconfigRootDir: config?.tsconfigRootDir,
        },
        globals: {
          ...globals.node,
          // @ts-expect-error We're using this to check if we're running in Bun
          Bun: typeof Bun !== 'undefined',
        },
      },
      rules: {
        ...defaultRules,
        ...(config?.rules ?? {}),
      },
      extends: extendables,
    }),
  ]
}
