
const path = require('path')
const webpack = require('webpack');

module.exports = 
{
    mode: "development",
    entry: 
    {
        index: './demo/demo.js',
        polyfills: './demo/polyfills.js'
    },
    output: 
    {
        filename: '[name].js',
        path: path.join(__dirname, '/dist'),
    },
    resolve: 
    {
        modules: [ 'node_modules' ],
        fallback: 
        { 
            "Buffer": require.resolve("buffer"),
            "zlib": require.resolve("browserify-zlib"),
            "util": require.resolve("util/"),
            "assert": require.resolve("assert/"),
            "stream": require.resolve("stream-browserify")
        }
    },
    plugins: [
        // fix "process is not defined" error:
        new webpack.ProvidePlugin({
          process: 'process/browser'
        }),
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer']
        })
      ],
    node: 
    {
        global: true,
        __filename: true,
        __dirname: true,
    }
}