var config = {
  entry: './src/example/main.js',
  output: {
    path: `${__dirname}/build/example`,
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
  },
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    watchOptions: {
      aggregateTimeout: 1000,
      poll: 2000
    }
  }
};

module.exports = config;
