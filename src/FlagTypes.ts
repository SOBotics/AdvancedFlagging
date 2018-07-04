import { CopyPastorFindTargetResponseItem } from '@userscriptTools/copypastorapi/CopyPastorAPI';

export interface UserDetails {
    Reputation: number;
    AuthorName: string;
}

export interface FlagType {
    Id: number;
    DisplayName: string;
    ReportType: 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther';
    GetComment?(userDetails: UserDetails): string;
    Enabled?(hasDuplicatePostLinks: boolean): boolean;
    GetCustomFlagText?(copyPastorItem: CopyPastorFindTargetResponseItem): string;
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
                Id: 1,
                DisplayName: 'Spam',
                ReportType: 'PostSpam'
            },
            {
                Id: 2,
                DisplayName: 'Rude or Abusive',
                ReportType: 'PostOffensive'
            }
        ]
    },
    {
        BoxStyle: { 'padding-left': '5px', 'padding-right': '5px', 'background-color': 'rgba(241, 148, 148, 0.6)' },
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 3,
                DisplayName: 'Plagiarism',
                ReportType: 'PostOther',
                Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                GetCustomFlagText: (copyPastorItem) => `Possible plagiarism of another answer https:${copyPastorItem.target_url}, as can be seen here http://copypastor.sobotics.org/posts/${copyPastorItem.post_id}`
            },
            {
                Id: 4,
                DisplayName: 'Duplicate answer',
                ReportType: 'PostOther',
                Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                GetComment: () => 'Please don\'t add the [same answer to multiple questions](http://meta.stackexchange.com/questions/104227/is-it-acceptable-to-add-a-duplicate-answer-to-several-questions). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                GetCustomFlagText: (copyPastorItem) => `The answer is a repost of their other answer https:${copyPastorItem.target_url}, but as there are slight differences as seen here http://copypastor.sobotics.org/posts/${copyPastorItem.post_id}, an auto flag wouldn't be raised.`
            },
            {
                Id: 18,
                DisplayName: 'Bad attribution',
                ReportType: 'PostOther',
                Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                GetCustomFlagText: (copyPastorItem) => `This post is copied from [another answer](https:${copyPastorItem.target_url}), as can be seen [here](http://copypastor.sobotics.org/posts/${copyPastorItem.post_id}). The author only added a link to the other answer, which is [not the proper way of attribution](https://stackoverflow.blog/2009/06/25/attribution-required/).`
            }
        ]
    },
    {
        BoxStyle: { 'padding-left': '5px', 'padding-right': '5px' },
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 5,
                DisplayName: 'Link Only',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: () => 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
                    '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
                    'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
                    'page you\'re linking to in case the target page is unavailable. ' +
                    '[Answers that are little more than a link may be deleted.](//stackoverflow.com/help/deleted-answers)'
            },
            {
                Id: 6,
                DisplayName: 'Not an answer',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: (userDetails) => userDetails.Reputation < 50
                    ? 'This does not provide an answer to the question. You can [search for similar questions](//stackoverflow.com/search), ' +
                    'or refer to the related and linked questions on the right-hand side of the page to find an answer. ' +
                    'If you have a related but different question, [ask a new question](//stackoverflow.com/questions/ask), ' +
                    'and include a link to this one to help provide context. ' +
                    'See: [Ask questions, get answers, no distractions](//stackoverflow.com/tour)'
                    : 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be ' +
                    'an explicit attempt to *answer* this question; if you have a critique or need a clarification of ' +
                    'the question or another answer, you can [post a comment](//stackoverflow.com/help/privileges/comment) ' +
                    '(like this one) directly below it. Please remove this answer and create either a comment or a new question. ' +
                    'See: [Ask questions, get answers, no distractions](//stackoverflow.com/tour)'
            },
            {
                Id: 7,
                DisplayName: 'Thanks',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: (userDetails) => userDetails.Reputation < 15
                    ? 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                    'and can be perceived as noise by its future visitors. Once you [earn](http://meta.stackoverflow.com/q/146472) ' +
                    'enough [reputation](http://stackoverflow.com/help/whats-reputation), you will gain privileges to ' +
                    '[upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                    'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                    'See [Why is voting important](http://stackoverflow.com/help/why-vote).'
                    :
                    'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                    'and can be perceived as noise by its future visitors. ' +
                    'Instead, [upvote answers](http://stackoverflow.com/help/privileges/vote-up) you like. This way future visitors of the question ' +
                    'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                    'See [Why is voting important](http://stackoverflow.com/help/why-vote).'
            },
            {
                Id: 8,
                DisplayName: 'Me too',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: () => 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
                    `If you have a different but related question, then [ask](//stackoverflow.com/questions/ask) it ` +
                    '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
                    'you can [upvote](//stackoverflow.com/help/privileges/vote-up) it, leave a [comment](//stackoverflow.com/help/privileges/comment), ' +
                    'or start a [bounty](//stackoverflow.com/help/privileges/set-bounties) ' +
                    'once you have enough [reputation](//stackoverflow.com/help/whats-reputation).',
            },
            {
                Id: 9,
                DisplayName: 'Library',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: () => 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](http://meta.stackoverflow.com/a/251605) in the answer itself.'
            },
            {
                Id: 10,
                DisplayName: 'Comment',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: (userDetails) => userDetails.Reputation < 50
                    ? 'This does not provide an answer to the question. Once you have sufficient [reputation](https://stackoverflow.com/help/whats-reputation) ' +
                    'you will be able to [comment on any post](https://stackoverflow.com/help/privileges/comment); instead, ' +
                    '[provide answers that don\'t require clarification from the asker](https://meta.stackexchange.com/questions/214173/why-do-i-need-50-reputation-to-comment-what-can-i-do-instead).'
                    : 
                    'This does not provide an answer to the question. A comment should be written instead.'
            },
            {
                Id: 14,
                DisplayName: 'Duplicate',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: () => 'Instead of posting an answer which merely links to another answer, please instead [flag the question](https://stackoverflow.com/help/privileges/flag-posts) as a duplicate.'
            },
            {
                Id: 17,
                DisplayName: 'Non English',
                ReportType: 'AnswerNotAnAnswer',
                GetComment: () => 'Welcome to Stack Overflow. Please write your answer in English, as Stack Overflow is an [English only site](https://meta.stackoverflow.com/a/297680).'
            }
        ]
    },
    {
        BoxStyle: { 'padding-left': '5px', 'padding-right': '5px' },
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 11,
                DisplayName: 'Looks Fine',
                ReportType: 'NoFlag'
            },
            {
                Id: 12,
                DisplayName: 'Needs Editing',
                ReportType: 'NoFlag'
            },
            {
                Id: 13,
                DisplayName: 'Vandalism',
                ReportType: 'NoFlag'
            }
        ]
    }
];
