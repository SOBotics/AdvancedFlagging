module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    env: {
        'browser': true,
        'greasemonkey': true
    },
    parserOptions: {
        'project': './tsconfig.json'
    },
    rules: {
        'arrow-parens': ['warn','as-needed'],
        'arrow-spacing': ['error', { 'before': true, 'after': true }],
        'brace-style': 'warn',
        //'camelcase': ['warn', { 'properties': 'never', 'ignoreGlobals': true }],
        'dot-notation': 'warn',
        'eqeqeq': 'warn',
        'func-call-spacing': 'warn',
        'indent': ['error', 4],
        'keyword-spacing': ['error', { 'before': true, 'after': true }],
        'no-alert': 'error',
        'no-await-in-loop': 'warn',
        'no-implicit-coercion': 'warn',
        'no-loop-func': 'warn',
        'no-multi-spaces': 'warn',
        'no-multi-str': 'warn',
        'no-multiple-empty-lines': 'warn',
        'no-param-reassign': 'warn',
        'no-tabs': 'warn',
        'no-trailing-spaces': 'error',
        'no-undefined': 'warn',
        'no-unneeded-ternary': 'warn',
        'no-unused-expressions': ['warn', { 'allowTernary': true }],
        'no-useless-return': 'warn',
        'no-var': 'error',
        'prefer-arrow-callback': 'warn',
        'prefer-const': 'warn',
        'quotes': [2, 'single', { 'avoidEscape': true }],
        'require-await': 'warn',
        'semi': [1, 'always'],
        'space-in-parens': 'off',
        '@typescript-eslint/explicit-function-return-type': 'warn'
    }
};
