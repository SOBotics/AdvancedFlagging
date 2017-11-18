# AdvancedFlagging

[![Build Status](https://travis-ci.org/SOBotics/AdvancedFlagging.svg?branch=master)](https://travis-ci.org/SOBotics/AdvancedFlagging)

AdvancedFlagging started as a set of modular typescript tools to aid with StackExchange UserScripts. It has support for:

- Natty
- MetaSmoke
- Sentinal
- Chat
- Stack Exchange API
- Cross domain caching

At the moment, these tools are bundled together within this repository. Going forward, these tools will ideally be independant npm packages to be used independantly.

# Credits

This code uses different bits and pieces from the following sources:

- [Natty Reporter](https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js)
- [Flag Dialog Smokey Controls](https://github.com/Charcoal-SE/userscripts/raw/master/fdsc/fdsc.user.js)
- [Generic Bot (Userscript)](https://stackapps.com/questions/7337/generic-bot-a-moderation-chatbot)

# Installation

Click one of the following links to install it via your favourite userscript tool:  

- [Minified](https://raw.githubusercontent.com/SOBotics/AdvancedFlagging/master/dist/AdvancedFlagging.min.user.js)  
- [Original](https://raw.githubusercontent.com/SOBotics/AdvancedFlagging/master/dist/AdvancedFlagging.user.js)

Currently, only TamperMonkey is officially supported

# What does it do?

AdvancedFlagging adds icons from Smokey and Natty to posts which have been reported. In addition, flags made through the AdvancedFlagging interface are reported to Natty, Smokey and GenericBot if required.

## Smokey reports
![Smokey reported and flagged](https://i.imgur.com/BIsyUue.png)  
Here, Smokey has reported a post (the smokey icon), and the post was flagged via AdvancedFlagging (the red flag)
Clicking the smokey icon takes the user to the reported post on MetaSmoke. Hovering the flag displays which flag was raised.
  
## Natty reports
![Natty reported and flagged](https://i.imgur.com/ahg4HTN.png)  
Here, Natty has reported a post (the dog icon), and the post was flagged via AdvancedFlagging (the red flag)
Clicking the natty icon takes the user to the reported post on Sentinel. Hovering the flag displays which flag was raised.

## Teamwork

![Smokey & Natty](https://i.imgur.com/LWW63j7.png)  
When both bots report a post, both icons appear

---

The interface looks like this:  
![Picture of the interface](https://i.imgur.com/YJViJh9.png)  

'Leave Comment' is ticked by default if there are no comments beneath the post to avoid comment spam.

'Looks Fine' reports a false positive to both Smokey and Natty if they reported the post. Needs editing reports to Natty if it was reported, and false positive to Smokey.

These options add an additional icon to the post:

![Picture of green tick](https://i.imgur.com/O4bHMEu.png)

To indicate that the feedback was sent. All feedback sent provides a banner notification (see above) to confirm it was successfully sent.

# Configuration

AdvancedFlagging has a configuration panel found at the bottom of StackExchange pages:

![Picture of configuration](https://i.imgur.com/kySHkns.png)

At present, it only handles clearing out the cache (queries to Smokey and Natty are only sent once), and clearing MetaSmoke configuration.

# Building

## Prerequisites

    npm install -g concat-cli
    npm install -g typescript
    
## Building

    npm run build
    
The distributable file is found under /dist/AdvancedFlagging.user.js and can be pasted directly into tamper monkey.

