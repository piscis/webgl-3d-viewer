module.exports = {
  entry: "./src/viewer/Main.js",
  output: {
    path: __dirname+'/build/viewer',
    filename: "main.js"
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: "style!css" },
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