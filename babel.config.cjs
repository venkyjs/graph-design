/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: 'auto'
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true
    }]
  ]
};
