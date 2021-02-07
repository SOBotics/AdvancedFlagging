import { CopyPastorFindTargetResponseItem } from '@userscriptTools/copypastorapi/CopyPastorAPI';

export interface UserDetails {
    Reputation: number;
    AuthorName: string;
}

export interface FlagType {
    Id: number;
    DisplayName: string;
    ReportType: 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther';
    Human?: string;
    GetComment?(userDetails: UserDetails): string;
    Enabled?(hasDuplicatePostLinks: boolean): boolean;
    GetCustomFlagText?(copyPastorItem: CopyPastorFindTargetResponseItem): string;
}

export interface FlagCategory {
    IsDangerous: boolean; // whether the category should have a red-ish background
    AppliesTo: ('Answer' | 'Question')[];
    FlagTypes: FlagType[];
}

export const flagCategories: FlagCategory[] = [
    {
        IsDangerous: true,
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 1,
                DisplayName: 'Spam',
                ReportType: 'PostSpam',
                Human: 'as spam'
            },
            {
                Id: 2,
                DisplayName: 'Rude or Abusive',
                ReportType: 'PostOffensive',
                Human: 'as R/A'
            }
        ]
    },
    {
        IsDangerous: true,
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 3,
                DisplayName: 'Plagiarism',
                ReportType: 'PostOther',
                Human: 'for moderator attention',
                Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                GetCustomFlagText: (copyPastorItem) => `Possible plagiarism of another answer https:${copyPastorItem.target_url}, as can be seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}`
            },
            {
                Id: 4,
                DisplayName: 'Duplicate answer',
                ReportType: 'PostOther',
                Human: 'for moderator attention',
                Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                GetComment: () => 'Please don\'t add the [same answer to multiple questions](https://meta.stackexchange.com/questions/104227/is-it-acceptable-to-add-a-duplicate-answer-to-several-questions). Answer the best one and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                GetCustomFlagText: (copyPastorItem) => `The answer is a repost of their other answer https:${copyPastorItem.target_url}, but as there are slight differences as seen here https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}, an auto flag wouldn't be raised.`
            },
            {
                Id: 18,
                DisplayName: 'Bad attribution',
                ReportType: 'PostOther',
                Human: 'for moderator attention',
                Enabled: (hasDuplicatePostLinks) => hasDuplicatePostLinks,
                GetCustomFlagText: (copyPastorItem) => `This post is copied from [another answer](https:${copyPastorItem.target_url}), as can be seen [here](https://copypastor.sobotics.org/posts/${copyPastorItem.post_id}). The author only added a link to the other answer, which is [not the proper way of attribution](https://stackoverflow.blog/2009/06/25/attribution-required/).`
            }
        ]
    },
    {
        IsDangerous: false,
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 5,
                DisplayName: 'Link Only',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: () => 'A link to a solution is welcome, but please ensure your answer is useful without it: ' +
                    '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will ' +
                    'have some idea what it is and why it’s there, then quote the most relevant part of the ' +
                    'page you\'re linking to in case the target page is unavailable. ' +
                    '[Answers that are little more than a link may be deleted.](/help/deleted-answers)'
            },
            {
                Id: 6,
                DisplayName: 'Not an answer',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: (userDetails) => userDetails.Reputation < 50
                    ? 'This does not provide an answer to the question. You can [search for similar questions](/search), ' +
                    'or refer to the related and linked questions on the right-hand side of the page to find an answer. ' +
                    'If you have a related but different question, [ask a new question](/questions/ask), ' +
                    'and include a link to this one to help provide context. ' +
                    'See: [Ask questions, get answers, no distractions](/tour)'
                    : 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be ' +
                    'an explicit attempt to *answer* this question; if you have a critique or need a clarification of ' +
                    'the question or another answer, you can [post a comment](/help/privileges/comment) ' +
                    '(like this one) directly below it. Please remove this answer and create either a comment or a new question. ' +
                    'See: [Ask questions, get answers, no distractions](/tour)'
            },
            {
                Id: 7,
                DisplayName: 'Thanks',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: (userDetails) => userDetails.Reputation < 15
                    ? 'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                    'and can be perceived as noise by its future visitors. Once you [earn](https://meta.stackoverflow.com/q/146472) ' +
                    'enough [reputation](/help/whats-reputation), you will gain privileges to ' +
                    '[upvote answers](/help/privileges/vote-up) you like. This way future visitors of the question ' +
                    'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                    'See [Why is voting important](/help/why-vote).'
                    :
                    'Please don\'t add _"thanks"_ as answers. They don\'t actually provide an answer to the question, ' +
                    'and can be perceived as noise by its future visitors. ' +
                    'Instead, [upvote answers](/help/privileges/vote-up) you like. This way future visitors of the question ' +
                    'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. ' +
                    'See [Why is voting important](/help/why-vote).'
            },
            {
                Id: 8,
                DisplayName: 'Me too',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: () => 'Please don\'t add *"Me too"* as answers. It doesn\'t actually provide an answer to the question. ' +
                    'If you have a different but related question, then [ask](/questions/ask) it ' +
                    '(reference this one if it will help provide context). If you\'re interested in this specific question, ' +
                    'you can [upvote](/help/privileges/vote-up) it, leave a [comment](/help/privileges/comment), ' +
                    'or start a [bounty](/help/privileges/set-bounties) ' +
                    'once you have enough [reputation](/help/whats-reputation).',
            },
            {
                Id: 9,
                DisplayName: 'Library',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: () => 'Please don\'t just post some tool or library as an answer. At least demonstrate [how it solves the problem](https://meta.stackoverflow.com/a/251605) in the answer itself.'
            },
            {
                Id: 10,
                DisplayName: 'Comment',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: (userDetails) => userDetails.Reputation < 50
                    ? 'This does not provide an answer to the question. Once you have sufficient [reputation](/help/whats-reputation) ' +
                    'you will be able to [comment on any post](/help/privileges/comment); instead, ' +
                    '[provide answers that don\'t require clarification from the asker](https://meta.stackexchange.com/questions/214173/why-do-i-need-50-reputation-to-comment-what-can-i-do-instead).'
                    :
                    'This does not provide an answer to the question. Please write a comment instead.'
            },
            {
                Id: 14,
                DisplayName: 'Duplicate',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: () => 'Instead of posting an answer which merely links to another answer, please instead [flag the question](/help/privileges/flag-posts) as a duplicate.'
            },
            {
                Id: 17,
                DisplayName: 'Non English',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: () => 'Welcome to Stack Overflow. Please write your answer in English, as Stack Overflow is an [English only site](https://meta.stackoverflow.com/a/297680).'
            },
            {
                Id: 18,
                DisplayName: 'Should be an edit',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                GetComment: () => 'Please use the edit link on your question to add additional information. The Post Answer button should be used only for complete answers to the question.'
            }
        ]
    },
    {
        IsDangerous: false,
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
