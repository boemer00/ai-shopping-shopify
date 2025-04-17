const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    // Define process.env so it's available in browser
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
      'process.browser': JSON.stringify(true)
    }),
    // Provide process globally
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ],
  resolve: {
    fallback: {
      "process": require.resolve("process/browser")
    }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 8082,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  },
};
