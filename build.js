import { build } from 'esbuild';
import info from './package.json' with { type: 'json' };

const userscriptHeader = `// ==UserScript==
// @name         Advanced Flagging
// @namespace    https://github.com/SOBotics
// @version      ${info.version}
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
// @exclude      *://area51.stackexchange.com/*
// @exclude      *://data.stackexchange.com/*
// @exclude      *://stackoverflow.com/c/*
// @exclude      *://winterbash*.stackexchange.com/*
// @exclude      *://api.stackexchange.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @downloadURL  https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
// @updateURL    https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js
// ==/UserScript==
/* globals StackExchange, Stacks, $ */\n`;


await build({
    entryPoints: [ 'src/AdvancedFlagging.ts' ],
    bundle: true,
    banner: {
        js: userscriptHeader
    },
    outfile: 'dist/AdvancedFlagging.user.js',
});