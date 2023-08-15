import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    {
        files: ['**/src/**/*.{js|jsx|ts|tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: { modules: true },
                ecmaVersion: 'latest',
                project: './tsconfig.json',
              },
        },
        plugins: {
            '@typescript-eslint': ts,
            ts,
        },
        rules: {
            /* "@typescript-eslint/no-explicit-any": 'false',*/
            ...ts.configs['eslint-recommended'].rules,
            ...ts.configs['recommended'].rules,
            'ts/no-floating-promises': 'error'
        }
}];
