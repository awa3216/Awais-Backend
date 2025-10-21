export default {
  '*.js': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
  '*.{css,scss,less}': [
    'prettier --write',
  ],
};
