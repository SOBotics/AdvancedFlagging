const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
    entry: "./src/AdvancedFlagging.ts",
    target: "node",
    output: {
        filename: "./out.js"
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        plugins: [
            new TsconfigPathsPlugin()
        ]
    },
    module: {
        rules: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                loader: "ts-loader"
            }
        ]
    }
}