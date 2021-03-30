# AdvancedFlagging

![build](https://github.com/SOBotics/AdvancedFlagging/workflows/build/badge.svg?branch=master)

AdvancedFlagging started as a set of modular TypeScript tools to aid with StackExchange Userscripts. It has support for:

- SmokeDetector/MetaSmoke
- Natty/Sentinel
- GenericBot
- Guttenberg/CopyPastor
- Chat
- Stack Exchange API

# Credits

This code uses different bits and pieces from the following sources:

- [Natty Reporter](https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js)
- [Flag Dialog Smokey Controls](https://github.com/Charcoal-SE/userscripts/blob/master/fdsc/fdsc.user.js)
- [Generic Bot (Userscript)](https://stackapps.com/questions/7337)

# Installation

Click [this](https://raw.githubusercontent.com/SOBotics/AdvancedFlagging/master/dist/AdvancedFlagging.user.js) link to install the userscript via your favourite userscript manager. Currently, only TamperMonkey is officially supported

# What does it do?

AdvancedFlagging adds icons from Smokey, Natty and Guttenberg to posts which have been reported. In addition, flags made through the AdvancedFlagging interface are reported to Natty, Smokey, Guttenberg and GenericBot if required.

# Interface

![Picture of the interface](https://i.stack.imgur.com/4x1eQ.png)

- 'Leave Comment' is ticked by default if there are no comments beneath the post to avoid comment spam or if you have chosen otherwise. This is only available on Stack Overflow.

- 'Flag' is always ticked by default unless you choose otherwise. Unticking this box will *not* flag the post. Feedback to all sources will, however, still be sent.

- 'Downvote' is always ticked by default unless you choose otherwise. It downvotes a post if you've also selected an option that by default flags the post

For every feedback that is sent to a bot a banner informs the user if it was sent successfully or if there was an error. A tick, check or flag is appended to the post menu, too. For example:

[![Post flagged](https://i.stack.imgur.com/Pk2QJ.png)](https://i.stack.imgur.com/Pk2QJ.png)

[![Feedback sent, but post not flagged](https://i.stack.imgur.com/FdFmc.png)](https://i.stack.imgur.com/FdFmc.png)

[![Oops, failed to send feedback](https://i.stack.imgur.com/5lIVS.png)](https://i.stack.imgur.com/5lIVS.png)

There's also support for the flags summary page:

[![AdvancedFlagging in flags summary](https://i.stack.imgur.com/9AioH.png)](https://i.stack.imgur.com/9AioH.png)

The userscript is (should) be dark mode compatible and fully responsive.

## Bot icons

### Smokey
![Smokey Icon](https://i.stack.imgur.com/7cmCt.png?s=128&g=1)

### Natty

![Natty Icon](https://i.stack.imgur.com/aMUMt.jpg?s=128&g=1)

### Guttenberg

![Guttenberg Icon](https://i.stack.imgur.com/A0JRA.png?s=128&g=1)

## Specialized reports

### Guttenberg reports

When Guttenberg has detected a post, two of the three additional options below appear in the dropdown:

![Dropdown with Guttenberg](https://i.stack.imgur.com/I4953.png)

These links will raise the following custom flags:

- Plagiarism 

  > Possible plagiarism of another answer [first linked question], as can be seen here [link to CopyPastor report]

  No comment will be left.

- Duplicate answer

  > The answer is a repost of their other answer [first linked question], but as there are slight differences as seen here [first Guttenberg report], an auto flag wouldn't be raised.

  The following comment will also be left:

  > Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.

- Bad attribution

  > This post is copied from [another answer](link_to_other_answer), as can be seen here [link to CopyPastor]. The author only added a link to the other answer, which is [not the proper way of attribution](//stackoverflow.blog/2009/06/25/attribution-required).

  No comment will be left.

'Looks fine', 'Needs editing', 'Vandalism' and any NAA response will register as a false positive to Guttenberg.

# Changing AdvancedFlagging defaults

AdvancedFlagging allows you to both edit any comments you choose to leave or flags you choose to raise and configure it so that it's more convenient to use.

## Configuration

The link to configure AdvancedFlagging is at the footer of each StackExchange site.

![Picture of link to configuration](https://i.stack.imgur.com/kTim6.png)

Clicking it opens the following modal box:

[![Picture of configuration box](https://i.stack.imgur.com/i6N6L.png)](https://i.stack.imgur.com/0ns5M.png)

### General

- Open dropdown on hover: open the dropdown when you hover over the 'AdvancedFlagging' link.
- Watch for manual flags: send feedback to bots when you manually flag the post.
- Watch for queue responses: send feedback to bots when you choose the 'Recommend Deletion' option in the Low Quality Posts Queue.
- Disable AdvancedFlagging link: stops displaying the AdvancedFlagging button in the post menu.
- Uncheck Leave comment/Flag/Downvote by default: don't check the respective checkbox by default

### Flags

Choose which options should appear in the AdvancedFlagging dropdown.

### Admin

- Clear Metasmoke configuration: removes your metasmoke's access token from AdvancedFlagging
- Clear chat fkey: removes the chat fkey. It will be re-retrieved the next time you send feedback to Natty.

## Comments and flags

The link to change the content of the comments and flags is in the footer of each StackExchange site as well:

[![Picture of the comments and flags link](https://i.stack.imgur.com/i1xpO.png)](https://i.stack.imgur.com/i1xpO.png)

It opens the following modal:

[![](https://i.stack.imgur.com/5sdgM.png)](https://i.stack.imgur.com/5sdgM.png)

Click 'Edit' to start editing a flag type, 'Hide' if you did not make any changes or 'Save' when you're done.

- The textarea is the content of the comment/flag.
- The `<select>` right below is the type of flag that should be raised when this comment is left (if you've ticked the 'Flag' checkbox).
  - `PostLowQuality` is the VLQ flag.
  - `AnswerNotAnAnswer` is the NAA flag.
  - `NoFlag` doesn't raise a flag.

# Building

Install the dependencies with:

    npm install

Then compile the code with:

    npm run build
    
The distributable file is found under `/dist/AdvancedFlagging.user.js` and can be pasted directly into the userscript manager.

# Bugs/Feature requests

For bugs or feature requests, please open [an issue on GitHub](https://github.com/SOBotics/AdvancedFlagging/issues/new).
