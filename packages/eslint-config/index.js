import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  // 1. 基础配置
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,

  // 2. 忽略文件
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**'],
  },

  // 3. 插件与全局规则
  {
    plugins: {
      turbo: turboPlugin,
      onlyWarn,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
    },
  },
]
