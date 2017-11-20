export interface FlagType {
    DisplayName: string;
    ReportType: 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag';
    Comment?: string;
    Comments?: { ReputationLimit: number, Comment: string }[];
}

export interface FlagCategory {
    BoxStyle?: any;
    LinkStyle?: any;

    AppliesTo: ('Answer' | 'Question')[];
    RestrictTo?: ('answers' | 'nato')[];

    FlagTypes: FlagType[];
}

export const flagCategories: FlagCategory[] = [
    {
        BoxStyle: { 'padding-left': '5px', 'padding-right': '5px', 'background-color': 'rgba(241, 148, 148, 0.6)' },
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                DisplayName: 'Spam',
                ReportType: 'PostSpam'
            },
            {
                DisplayName: 'Rude or Abusive',
                ReportType: 'PostOffensive'
            }
        ]
    },
    {
        BoxStyle: { 'padding-left': '5px', 'padding-right': '5px' },
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                DisplayName: 'Link Only',
                ReportType: 'AnswerNotAnAnswer',
                Comment: 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
                    '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
                    'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
                    'page you\'re linking to in case the target page is unavailable. ' +
                    '[Answers that are little more than a link may be deleted.](//stackoverflow.com/help/deleted-answers)'
            },
            {
                DisplayName: 'Not an answer',
                ReportType: 'AnswerNotAnAnswer',
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
                DisplayName: 'Thanks',
                ReportType: 'AnswerNotAnAnswer',
                Comments: [
                    {
                        ReputationLimit: 0,
                        Comment: 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                            'and can be perceived as noise by its future visitors. Once you [earn](http://meta.stackoverflow.com/q/146472) ' +
                            'enough [reputation](http://stackoverflow.com/help/whats-reputation), you will gain privileges to ' +
                            '[upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                            'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                            'See [Why is voting important](http://stackoverflow.com/help/why-vote).'
                    },
                    {
                        ReputationLimit: 15,
                        Comment: 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                            'and can be perceived as noise by its future visitors. ' +
                            'Instead, [upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                            'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                            'See [Why is voting important](http://stackoverflow.com/help/why-vote).'
                    }
                ]

            },
            {
                DisplayName: 'Me too',
                ReportType: 'AnswerNotAnAnswer',
                Comment: 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
                    'If you have a different but related question, then [ask](//$SITEURL$/questions/ask) it ' +
                    '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
                    'you can [upvote](//stackoverflow.com/help/privileges/vote-up) it, leave a [comment](//stackoverflow.com/help/privileges/comment), ' +
                    'or start a [bounty](//stackoverflow.com/help/privileges/set-bounties) ' +
                    'once you have enough [reputation](//stackoverflow.com/help/whats-reputation).',
            },
            {
                DisplayName: 'Library',
                ReportType: 'AnswerNotAnAnswer',
                Comment: 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](http://meta.stackoverflow.com/a/251605) in the answer itself.'
            },
            {
                DisplayName: 'Comment',
                ReportType: 'AnswerNotAnAnswer',
                Comment: 'This does not provide an answer to the question. Once you have sufficient [reputation](https://stackoverflow.com/help/whats-reputation) you will be able to [comment on any post](https://stackoverflow.com/help/privileges/comment); instead, [provide answers that don\'t require clarification from the asker](https://meta.stackexchange.com/questions/214173/why-do-i-need-50-reputation-to-comment-what-can-i-do-instead).'
            }
        ]
    },
    {
        BoxStyle: { 'padding-left': '5px', 'padding-right': '5px' },
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                DisplayName: 'Looks Fine',
                ReportType: 'NoFlag'
            },
            {
                DisplayName: 'Needs Editing',
                ReportType: 'NoFlag'
            },
            {
                DisplayName: 'Vandalism',
                ReportType: 'NoFlag'
            }
        ]
    }
];
