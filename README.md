# AdvancedFlagging

![build](https://github.com/SOBotics/AdvancedFlagging/workflows/build/badge.svg?branch=master)

AdvancedFlagging started as a set of modular typescript tools to aid with StackExchange UserScripts. It has support for:

- Smokey / MetaSmoke
- Natty / Sentinel
- GenericBot
- Guttenberg / CopyPastor
- Chat
- Stack Exchange API
- Cross domain caching

# Credits

This code uses different bits and pieces from the following sources:

- [Natty Reporter](https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js)
- [Flag Dialog Smokey Controls](https://github.com/Charcoal-SE/userscripts/blob/master/fdsc/fdsc.user.js)
- [Generic Bot (Userscript)](https://stackapps.com/questions/7337/generic-bot-a-moderation-chatbot)

# Installation

Click one of the following links to install it via your favourite userscript tool:  

- [Minified](https://raw.githubusercontent.com/SOBotics/AdvancedFlagging/master/dist/AdvancedFlagging.min.user.js)  
- [Original](https://raw.githubusercontent.com/SOBotics/AdvancedFlagging/master/dist/AdvancedFlagging.user.js)

Currently, only TamperMonkey is officially supported

# What does it do?

AdvancedFlagging adds icons from Smokey, Natty and Guttenberg to posts which have been reported. In addition, flags made through the AdvancedFlagging interface are reported to Natty, Smokey, Guttenberg and GenericBot if required.

# Interface

The interface looks like this:  
![Picture of the interface](https://i.stack.imgur.com/Vb86O.png)

'Leave Comment' is ticked by default if there are no comments beneath the post to avoid comment spam. This is only available on Stack Overflow.

'Flag' is always ticked by default. Unticking this box will *not* flag the post. Feedback to all sources will, however, still be sent.

'Looks Fine' reports a false positive to both Smokey, Natty and Guttenberg if they reported the post. 'Needs editing' reports to Natty if it was reported, and false positive to Smokey.

These options add an additional icon to the post:

![Picture of green tick](https://i.stack.imgur.com/atJZd.png)

To indicate that the feedback was sent. All feedback sent provides a banner notification (see above) to confirm it was successfully sent.

## Report icons
Posts reported by each source will have an icon appended to the post. For example, here, Natty reported a post, and we've flagged it.  

![Natty reported and flagged](https://i.stack.imgur.com/oVSWZ.png)

### Smokey
![Smokey Icon](https://i.stack.imgur.com/7cmCt.png?s=128&g=1)

### Natty

![Natty Icon](https://i.stack.imgur.com/aMUMt.jpg?s=128&g=1)

### Guttenberg

![Guttenberg Icon](https://i.stack.imgur.com/A0JRA.png?s=128&g=1)

## Specialized reports

### Guttenberg reports

When Guttenberg has detected a post, two additional options appear in the dropdown:

![Dropdown with Guttenberg](https://i.stack.imgur.com/I4953.png)

These links will raise the following custom flags:

- Plagiarism 

  > Possible plagiarism of another answer [first linked question], as can be seen here [first Guttenberg report]

  No comment will be left for the OP

- Duplicate answer

  > The answer is a repost of their other answer [first linked question], but as there are slight differences as seen here [first Guttenberg report], an auto flag wouldn't be raised.

  The following comment will also be left:

  > Please don't add the [same answer to multiple questions](http://meta.stackexchange.com/questions/104227/is-it-acceptable-to-add-a-duplicate-answer-to-several-questions). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.

'Looks fine', 'Needs editing', 'Vandalism' and any NAA response will register as a false positive to Guttenberg.

# Configuration

AdvancedFlagging has a link to its configuration panel found at the bottom of StackExchange pages:

![Picture of link to configuration](https://i.stack.imgur.com/kTim6.png)

Clicking it opens the following modal box:

![Picture of configuration box](https://i.stack.imgur.com/i6N6L.png)

## General

### Watch for manual flags

Manual flags will be watched, and feedback will be sent (where applicable).

### Watch for queue responses

Responses in the Low Quality Posts queue will be watched, and feedback will be sent (where applicable)

## Flags

Here, you can choose which flag options are present in the dropdown. This allows us to create far more options for flagging, without cluttering up the page for users who aren't interested in using them.

## Admin

### Clear MetaSmoke Configuration

Resets all MetaSmoke configuration, including tokens

### Clear chat FKey

Removes the chat fkey token from cache. It will be regenerated next time feedback is sent in chat.

# Building

## Prerequisites

    npm install -g concat-cli
    npm install -g typescript
    
## Building

    npm run build
    
The distributable file is found under `/dist/AdvancedFlagging.user.js` or `/dist/AdvancedFlagging.min.user.js` and can be pasted directly into tamper monkey.

