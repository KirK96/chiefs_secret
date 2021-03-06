const path = require('path');
const webpack = require('webpack');
const glob = require('glob');

// Подключаемые плагины
const CompressionPlugin = require('compression-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const __DEV__ = process.env.NODE_ENV !== 'production';
const DEBUG = JSON.stringify(process.env.DEBUG === 'true');
const root = process.cwd();

console.log(`process.env.NODE_ENV = ${JSON.stringify(process.env.NODE_ENV)}`);
console.log(`DEBUG = ${DEBUG}`);

/** @type {webpack.Configuration} */
const config = {
  mode: __DEV__ ? 'development' : 'production',
  bail: !__DEV__,

  entry: {
    app: path.join(root, 'app/init.tsx'),
    // sprites: glob.sync('assets/icon/*.svg'),
  },

  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    filename: __DEV__ ? 'assets/[name].js' : 'assets/[name]-[hash:8].js',
    chunkFilename: __DEV__ ? 'assets/[name].js' : 'assets/[name]-[chunkhash:8].js',
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.less'],
    modules: [root, path.resolve(root, 'app'), 'node_modules'],
  },

  plugins: [
    new HtmlWebpackPlugin({ title: 'Сhiefs secret' }),
    new MiniCssExtractPlugin(),
    new webpack.ContextReplacementPlugin(/node_modules\/moment\/locale/, /ru/),
    new webpack.DefinePlugin({ DEBUG }),
  ],

  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.tsx?$/,
        include: __DEV__
          ? [path.resolve(__dirname, 'app')]
          : [path.resolve(__dirname, 'app'), path.resolve(__dirname, 'node_modules')],
        use: [
          {
            loader: 'babel-loader',
          },
          'ts-loader?transpileOnly=true',
        ],
      },
      {
        test: /\.(jpe?g|png|gif|svg|eot|ttf|woff2?)$/,
        // exclude: path.resolve(__dirname, 'src/assets/icons'),
        use: {
          loader: 'url-loader',
          options: {
            limit: 8192,
            name: `assets/media/[name]${__DEV__ ? '' : '-[hash:8]'}.[ext]`,
          },
        },
      },
      {
        test: /\.svg$/,
        include: path.resolve(__dirname, 'src/assets/icons'),
        use: 'svg-sprite-loader',
      },
      {
        test: /\.less$/,
        use: [
          __DEV__ ? 'style-loader' : MiniCssExtractPlugin.loader,
          `css-loader`,
          {
            loader: 'less-loader',
            options: { javascriptEnabled: true },
          },
        ],
      },
      {
        test: /\.(css)$/,
        use: [__DEV__ ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/].*\.(jsx?|tsx?)/,
          name: 'vendor',
          chunks: 'all',
        },
        styles: {
          test: /\.(less|css)$/,
          name: 'styles',
          chunks: 'all',
        },
      },
    },
  },
};

if (__DEV__) {
  config.devServer = {
    host: process.env.WEBPACK_DEV_HOST,
    port: process.env.WEBPACK_DEV_PORT,
    contentBase: __dirname + '/public',
    proxy: {
      '/api': process.env.WEBPACK_DEV_API,
    },
    historyApiFallback: true,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    stats: {
      assets: true,
      children: false,
      chunks: false,
      cached: true,
      colors: true,
      errorDetails: false,
      errors: true,
      hash: false,
      modules: false,
      publicPath: false,
      reasons: false,
      source: false,
      timings: true,
      version: false,
      warnings: true,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
  };
  config.output.publicPath = `/`;
  config.plugins.push(new ForkTsCheckerWebpackPlugin({ tslint: './tslint.json' }));
  config.devtool = false;
} else {
  config.plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new CompressionPlugin({ test: /\.(js|css)$/i }),
    new webpack.optimize.OccurrenceOrderPlugin(),
  );
}

module.exports = config;
