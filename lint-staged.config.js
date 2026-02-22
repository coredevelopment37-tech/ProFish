// lint-staged.config.js — ProFish (#439)
// Run ESLint + Prettier on staged files before commit.

module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --max-warnings 0', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
