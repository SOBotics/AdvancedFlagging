module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'arrow-parens': ['warn', 'as-needed'],
    'prefer-arrow-callback': 'warn',
    'no-trailing-spaces': 'error',
    'indent': [ 'error', 4 ],
    'semi': [ 1, 'always' ],
    'quotes': [ 2, 'single', { 'avoidEscape': true } ],
    'prefer-const': 'warn',
    'keyword-spacing': ['error', { before: true, after: true }],
  }
};
