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
        'indent': ['error', 4, { 'SwitchCase': 1 }],
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
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-misused-promises': ['warn', { 'checksVoidReturn': false }],
        '@typescript-eslint/member-delimiter-style': 'warn',
        '@typescript-eslint/consistent-type-definitions': 'warn',
        '@typescript-eslint/method-signature-style': ['warn', 'method'],
        '@typescript-eslint/no-base-to-string': 'warn',
        '@typescript-eslint/no-require-imports': 'warn',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',
        '@typescript-eslint/no-unnecessary-condition': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/prefer-for-of': 'warn',
        '@typescript-eslint/prefer-includes': 'warn',
        '@typescript-eslint/prefer-optional-chain': 'warn',
        '@typescript-eslint/prefer-readonly': 'warn',
        '@typescript-eslint/prefer-reduce-type-parameter': 'warn',
        '@typescript-eslint/prefer-string-starts-ends-with': 'warn',
        '@typescript-eslint/type-annotation-spacing': ['warn', {
            'before': false,
            'after': true,
            'overrides': {
                'arrow': { 'before': true, 'after': true }}
            }]
    }
};
