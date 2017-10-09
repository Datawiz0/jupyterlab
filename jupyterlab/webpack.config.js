var webpack = require('webpack');
var path = require('path');
var fs = require('fs-extra');
var Handlebars = require('handlebars');
var crypto = require('crypto');
var package_data = require('./package.json');
var Build = require('@jupyterlab/buildutils').Build;

// Ensure a clear build directory.
var buildDir = './build';
fs.removeSync(buildDir);
fs.ensureDirSync(buildDir);

fs.copySync('./package.json', './build/package.json');

// Handle the extensions.
var extensions = package_data.jupyterlab.extensions;
var mimeExtensions = package_data.jupyterlab.mimeExtensions;
Build.ensureAssets({
  packageNames: Object.keys(mimeExtensions).concat(Object.keys(extensions)),
  output: package_data.jupyterlab.outputDir
});

// Create the entry point file.
var source = fs.readFileSync('index.js').toString();
var template = Handlebars.compile(source);
var data = {
  jupyterlab_extensions: extensions,
  jupyterlab_mime_extensions: mimeExtensions,
};
var result = template(data);

fs.writeFileSync(path.resolve(buildDir, 'index.out.js'), result);

// Create the hash
var hash = crypto.createHash('md5');
hash.update(fs.readFileSync('./package.json'));
var digest = hash.digest('hex');
fs.writeFileSync(path.resolve(buildDir, 'hash.md5'), digest);

module.exports = {
  entry:  path.resolve(buildDir, 'index.out.js'),
  output: {
    path: path.resolve(buildDir),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.json$/, use: 'json-loader' },
      { test: /\.html$/, use: 'file-loader' },
      { test: /\.md$/, use: 'raw-loader' },
      { test: /\.js$/, use: ['source-map-loader'], enforce: 'pre', exclude: /vega-lite/},
      { test: /\.(jpg|png|gif)$/, use: 'file-loader' },
      { test: /\.js.map$/, use: 'file-loader' },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, use: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, use: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, use: 'url-loader?limit=10000&mimetype=application/octet-stream' },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, use: 'file-loader' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, use: 'url-loader?limit=10000&mimetype=image/svg+xml' }
    ],
  },
  resolve: {
    alias: package_data.jupyterlab.linkedPackages
  },
  watchOptions: {
    ignored: /node_modules/
  },
  node: {
    fs: 'empty'
  },
  bail: true,
  devtool: 'cheap-source-map'
}
