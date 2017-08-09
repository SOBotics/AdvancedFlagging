debugger;

interface LinkInfo {
    LinkName: string;
    ReportType: 'redflag' | 'naa';
    Comment?: string;
    Comments?: { ReputationLimit: number, Comment: string }[];
}

const redFlagLinks: LinkInfo[] = [
    {
        LinkName: 'Spam',
        ReportType: 'redflag'
    },
    {
        LinkName: 'Rude or Abusive',
        ReportType: 'redflag'
    }
];


const nattyLinks: LinkInfo[] = [
    {
        LinkName: 'Link Only',
        ReportType: 'naa',
        Comment: 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
        '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
        'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
        'page you\'re linking to in case the target page is unavailable. ' +
        '[Answers that are little more than a link may be deleted.](//stackoverflow.com/help/deleted-answers)'
    },
    {
        LinkName: 'Not an answer',
        ReportType: 'naa',
        Comments: [
            {
                ReputationLimit: 0,
                Comment: 'This does not provide an answer to the question. You can [search for similar questions](//stackoverflow.com/search), ' +
                'or refer to the related and linked questions on the right-hand side of the page to find an answer. ' +
                'If you have a related but different question, [ask a new question](//stackoverflow.com/questions/ask), ' +
                'and include a link to this one to help provide context. ' +
                'See: [Ask questions, get answers, no distractions](//stackoverflow.com/tour)',
            },
            {
                ReputationLimit: 50,
                Comment: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be ' +
                'an explicit attempt to *answer* this question; if you have a critique or need a clarification of ' +
                'the question or another answer, you can [post a comment](//stackoverflow.com/help/privileges/comment) ' +
                '(like this one) directly below it. Please remove this answer and create either a comment or a new question. ' +
                'See: [Ask questions, get answers, no distractions](//stackoverflow.com/tour)',
            }
        ]
    },
    {
        LinkName: 'Thanks',
        ReportType: 'naa',
        Comment: 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
        'and can be perceived as noise by its future visitors. Once you [earn](http://meta.stackoverflow.com/q/146472) ' +
        'enough [reputation](http://stackoverflow.com/help/whats-reputation), you will gain privileges to ' +
        '[upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
        'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
        'See [Why is voting important](http://stackoverflow.com/help/why-vote).',
    },
    {
        LinkName: 'Me too',
        ReportType: 'naa',
        Comment: 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
        'If you have a different but related question, then [ask](//$SITEURL$/questions/ask) it ' +
        '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
        'you can [upvote](//stackoverflow.com/help/privileges/vote-up) it, leave a [comment](//stackoverflow.com/help/privileges/comment), ' +
        'or start a [bounty](//stackoverflow.com/help/privileges/set-bounties) ' +
        'once you have enough [reputation](//stackoverflow.com/help/whats-reputation).',
    },
    {
        LinkName: 'Library',
        ReportType: 'naa',
        Comment: 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](http://meta.stackoverflow.com/a/251605) in the answer itself.'
    }

]

function handleClick(link: LinkInfo, commentRequired: boolean) {
    if (commentRequired) {
        let commentText: Promise<string> | null = null;
        if (link.Comment) {
            commentText = Promise.resolve(link.Comment);
        } else if (link.Comments) {
            const comments = link.Comments;
            commentText = new Promise((resolve, reject) => {
                let opReputation = 5//?;
                for (var i = 0; i < comments.length; i++) {
                    if (comments[i].ReputationLimit <= opReputation) {
                        resolve(comments[i].Comment);
                    }
                }
                resolve(undefined);
            });
        }

        if (commentText) {
            commentText.then(text => {
                if (!text) {
                    // Now we leave a comment.
                    return;
                }

            })
        }
    }
}

function SetupPostPage() {
    const postMenus = $('.answercell > .post-menu');
    postMenus.each((index, item) => {
        const jqueryItem = $(item);

        const answerId = parseInt(jqueryItem.find('.flag-post-link').attr('data-postid'));

        const nattyLink = $('<a />').text('Natty ' + answerId);

        const dropDown = $('<dl />').css({
            'margin': '0',
            'z-index': '1',
            'position': 'absolute',
            'white-space': 'nowrap',
            'background': '#FFF',
            'padding': '5px',
            'border': '1px solid #9fa6ad',
            'box-shadow': '0 2px 4px rgba(36,39,41,0.3)',
            'cursor': 'default'
        }).hide();

        const linkStyle = { 'display': 'inline-block', 'margin-top': '5px', 'width': 'auto' };

        const checkboxName = `comment_checkbox_${answerId}`;
        const leaveCommentBox = $('<input />')
            .attr('type', 'checkbox')
            .attr('name', checkboxName)
            .prop('checked', true);

        redFlagLinks.forEach(link => {
            const dropdownItem = $('<dd />').css({ 'padding-left': '5px', 'background-color': 'rgba(241, 148, 148, 0.6)' });

            const nattyLinkItem = $('<a />').css(linkStyle);
            nattyLinkItem.click(() => handleClick(link, leaveCommentBox.is(':checked')));

            nattyLinkItem.text(link.LinkName);
            dropdownItem.append(nattyLinkItem);

            dropDown.append(dropdownItem);
        });
        const getDivider = () => $('<hr />').css({ 'margin-bottom': '10px', 'margin-top': '10px' });

        dropDown.append(getDivider());

        nattyLinks.forEach(link => {
            const dropdownItem = $('<dd />').css({ 'padding-left': '5px' });

            const nattyLinkItem = $('<a />').css(linkStyle);
            nattyLinkItem.click(() => handleClick(link, leaveCommentBox.is(':checked')));

            nattyLinkItem.text(link.LinkName);
            dropdownItem.append(nattyLinkItem);

            dropDown.append(dropdownItem);
        });

        const commentBoxLabel =
            $('<label />').text('Leave comment')
                .attr('for', checkboxName)
                .css({
                    'margin-right': '5px',
                    'margin-left': '4px',
                });

        commentBoxLabel.click(() => leaveCommentBox.click());

        const commentingRow = $('<dd />');
        commentingRow.append(getDivider())
        commentingRow.append(commentBoxLabel);
        commentingRow.append(leaveCommentBox);

        dropDown.append(commentingRow);

        nattyLink.append(dropDown);
        nattyLink.hover(() => dropDown.toggle());

        jqueryItem.append(nattyLink);
    })

}

$(function () {
    SetupPostPage();
});