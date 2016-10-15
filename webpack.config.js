var webpack = require('webpack')
var path = require('path')

console.log(path.join(__dirname, 'modules'))

var config = {
  entry: [
    'webpack-dev-server/client?http://localhost:5050',
    'webpack/hot/dev-server',
    path.join(__dirname, 'modules/index.js')
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist/'
  },
  resolve: {
    root: [
      path.resolve(__dirname, 'modules')
    ],
    extensions: ['', '.js']
  },
  devtool: 'eval-source-map',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: 'babel',
        include: path.join(__dirname, 'modules'),
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.json/,
        loader: 'json'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file?hash=sha512&digest=hex&name=[hash].[ext]',
          'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
        ]
      }
    ]
  }
}

module.exports = config
