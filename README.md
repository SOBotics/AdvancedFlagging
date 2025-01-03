# Advanced Flagging

[![build](https://github.com/SOBotics/AdvancedFlagging/actions/workflows/nodejs.yml/badge.svg)](https://github.com/SOBotics/AdvancedFlagging/actions/workflows/nodejs.yml)

Advanced Flagging started as a set of modular TypeScript tools to aid with StackExchange Userscripts. It has support for:

- SmokeDetector/metasmoke
- Natty/Sentinel
- Generic Bot
- Guttenberg/CopyPastor
- Chat

# Credits

This code uses different bits and pieces from the following sources:

- [Natty Reporter](https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js)
- [Flag Dialog Smokey Controls](https://github.com/Charcoal-SE/userscripts/blob/master/fdsc/fdsc.user.js)
- [Generic Bot (Userscript)](https://stackapps.com/questions/7337)

# Installation

[Direct install link](https://github.com/SOBotics/AdvancedFlagging/raw/master/dist/AdvancedFlagging.user.js) | [View source](https://github.com/SOBotics/AdvancedFlagging/blob/master/dist/AdvancedFlagging.user.js). Currently, only Tampermonkey is official supported.

# What does it do?

Advanced Flagging adds icons from Smokey, Natty and Guttenberg to posts that have been reported. In addition, flags made through the Advanced Flagging interface are reported to Natty, Smokey, Guttenberg and Generic Bot if required.

# Interface

![Picture of the interface](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/fdf4bc24-0fce-40ea-8634-179b7b997cc3)

Hovering over each option will show a tooltip describing the actions that will be performed on click:

![tooltip showing actions](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/d2cade2e-16d4-4e03-8b74-29bc5f248603)

The script also monitors and reports the progress of each action the user decides to perform (e.g. flag, comment, send feedback):

![progress I](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/99b8f734-3ce0-460b-8e6e-d0eedf3f8378)

![progress II](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/f8799cc9-f7ba-4b2b-89bb-71ef990e6c53)

![progress III](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/2073b3fb-3a94-481f-8407-c917db5c6ef3)

![progress IV](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/60cf3e3f-3cbc-479f-82e4-0c33199f68b1)

There's also support:

- for flags manually raised through the flag dialog:

  ![screenshot of flag popup](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/008543b3-fe1b-49d5-ae39-4fc0d2a31f84)

  ![screenshot after flagging as spam](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/2555d065-251f-48eb-91c5-940a6cdde2f9)


- for the flags summary page:

  ![Screenshot from flags summary](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/a960269c-76ed-4cd3-bc08-7497b3ca1955)

- for the "New Answers To Old Questions" page:

  ![image from NATO page](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/bff8962e-f5f8-4cc8-971f-6531fbc2e0b4)

- the Low Quality Answers review queue on Stack Overflow:

  ![screenshot from review](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/c1590c09-5959-4050-9163-bbc6f02cbf3a)

  ![after recommending deletion](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/2ecb7597-dd5f-4338-9a15-96f7d6d8effe)

## Specialized reports

### Guttenberg reports

When Guttenberg has detected a post, additional options appear in the dropdown:

![Guttenberg report](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/98d13798-7185-45aa-9a25-6b2f93126c2f)

# Configuring Advanced Flagging

Advanced Flagging allows you to both edit any comments you choose to leave or flags you choose to raise and configure it so that the script is more convenient to use.

## Configuration

The link to configure AdvancedFlagging is at the footer of each StackExchange site.

![Picture of link to configuration](https://i.sstatic.net/kTim6.png)

Clicking it opens the following modal box:

![configuration modal](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/7e41c396-6486-4f44-ad41-a477279254d6)

## Comments and flags

The link to change the content of the comments and flags is in the footer of each StackExchange site as well:

[![Picture of the comments and flags link](https://i.sstatic.net/i1xpO.png)](https://i.sstatic.net/i1xpO.png)

It opens the following modal:

![comments and flags modal](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/d8b79064-406c-4046-b7c9-67e065256831)

Click ![new button](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/5d91c4ed-1cd5-44aa-b5e2-cee67b85d92f) to add a new flag type and ![edit button](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/5d18d32d-e488-4e9c-a2e4-a5a558407996) to edit an existing one:

![image](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/aa278d77-fe56-4be5-bb9a-a9044d523043)

You can reset all flag types to default by clicking the reset button at the footer of the modal:

![modal footer](https://github.com/SOBotics/AdvancedFlagging/assets/38133098/a130092e-3965-4656-8e4a-8a17e36bf570)

# Building

Install the dependencies with:

    npm install

Then compile the code with:

    npm run build
    
The distributable file is found under `/dist/AdvancedFlagging.user.js` and can be pasted directly into the userscript manager.

# Bugs/Feature requests

For bugs or feature requests, please open [an issue on GitHub](https://github.com/SOBotics/AdvancedFlagging/issues/new).
