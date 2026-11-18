const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['__tests__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        fdescribe: 'readonly',
        fit: 'readonly',
        it: 'readonly',
        jest: 'readonly',
        test: 'readonly',
        xdescribe: 'readonly',
        xit: 'readonly',
        xtest: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/**', '.expo/**'],
  },
]);
