var config = {
  entry: './src/example/main.js',
  output: {
    path: __dirname+'/build/example',
    filename: 'main.js'
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          optional: ['runtime'],
          stage: 0
        }
      }
    ]
  }
};

module.exports = config;