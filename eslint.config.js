import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';

export default tseslint.config({
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
        ...tseslint.configs.recommendedTypeChecked,
        stylistic.configs.customize({
            quotes: 'single',
            indent: 4,
            semi: true,
        }),
        {
            languageOptions: {
                parserOptions: {
                    project: true,
                    tsconfigRootDir: import.meta.dirname,
                },
            },
        },
    ],
    rules: {
        'eqeqeq': 'error',
        'no-await-in-loop': 'warn',
        'no-implicit-coercion': 'warn',
        'no-param-reassign': 'error',
        'no-undefined': 'warn',
        'no-unneeded-ternary': 'warn',
        'no-useless-return': 'warn',
        'no-var': 'error',
        'prefer-arrow-callback': 'warn',
        'prefer-const': 'warn',

        '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/method-signature-style': 'warn',
        '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
        '@typescript-eslint/prefer-readonly': 'warn',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        '@typescript-eslint/prefer-promise-reject-errors': 'off',
        '@typescript-eslint/no-extraneous-class': 'off',
        '@typescript-eslint/non-nullable-type-assertion-style': 'off',
        '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignorePrimitives: { boolean: true } }],
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],

        '@stylistic/arrow-parens': ['warn', 'as-needed'],
        '@stylistic/quote-props': ['warn', 'as-needed'],
        '@stylistic/brace-style': ['error', '1tbs'],
        '@stylistic/comma-dangle': 'off',
        '@stylistic/indent-binary-ops': 'off',
        '@stylistic/space-before-function-paren': 'off',
        '@stylistic/type-annotation-spacing': ['warn', {
            'before': false,
            'after': true,
            'overrides': {
                'arrow': { 'before': true, 'after': true }}
            }
        ],
        '@stylistic/array-bracket-spacing': 'off'
    }
});