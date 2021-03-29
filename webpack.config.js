const path = require('path');
const webpack = require('webpack'); // for the banner plugin
const userscriptInfo = require('./package.json');

module.exports = {
    entry: './src/AdvancedFlagging.ts',
    mode: 'none',
    target: 'node',
    output: {
        filename: './AdvancedFlagging.user.js'
    },
    resolve: {
        // Add '.ts' and '.tsx' as a resolvable extension.
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
    },
    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: `// ==UserScript==
                     // @name         Advanced Flagging
                     // @namespace    https://github.com/SOBotics
                     // @version      ${userscriptInfo.version}
                     // @author       Robert Rudman
                     // @contributor  double-beep
                     // @match        *://*.stackexchange.com/*
                     // @match        *://*.stackoverflow.com/*
                     // @match        *://*.superuser.com/*
                     // @match        *://*.serverfault.com/*
                     // @match        *://*.askubuntu.com/*
                     // @match        *://*.stackapps.com/*
                     // @match        *://*.mathoverflow.net/*
                     // @exclude      *://chat.stackexchange.com/*
                     // @exclude      *://chat.meta.stackexchange.com/*
                     // @exclude      *://chat.stackoverflow.com/*
                     // @exclude      *://*.area51.stackexchange.com/*
                     // @exclude      *://data.stackexchange.com/*
                     // @exclude      *://stackoverflow.com/c/*
                     // @exclude      *://winterbash*.stackexchange.com/*
                     // @exclude      *://api.stackexchange.com/*
                     // @grant        GM_xmlhttpRequest
                     // @grant        GM_listValues
                     // @grant        GM_getValue
                     // @grant        GM_setValue
                     // @grant        GM_deleteValue
                     // @grant        GM_addStyle
                     // @downloadURL  https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
                     // @updateURL    https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
                     // ==/UserScript==
                     /* globals StackExchange, Stacks, $ */\n`.replace(/^\s+/mg, '')
        })
    ],
    module: {
        rules: [
            // all files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'
            {
                test: /\.tsx?$/,
                include: path.resolve(__dirname, 'src'),
                loader: 'ts-loader'
            }
        ]
    }
}