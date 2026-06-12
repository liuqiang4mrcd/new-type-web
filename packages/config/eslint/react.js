const base = require('./base.js');

module.exports = {
  ...base,
  extends: [
    ...base.extends,
    'plugin:react-hooks/recommended',
  ],
  plugins: [
    ...base.plugins,
    'react-hooks',
  ],
  rules: {
    ...base.rules,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: { version: 'detect' },
  },
};
