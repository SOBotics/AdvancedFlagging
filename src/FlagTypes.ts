import { FlagTypeFeedbacks, PostType, FlagNames } from './shared';

export type Flags = 'AnswerNotAnAnswer'
    | 'PostOffensive'
    | 'PostSpam'
    | 'NoFlag'
    | 'PostOther'
    | 'PostLowQuality'
    | 'PlagiarizedContent';

const deletedAnswers = '/help/deleted-answers';
const commentHelp = '/help/privileges/comment';
const reputationHelp = '/help/whats-reputation';
const voteUpHelp = '/help/privileges/vote-up';
const whyVote = '/help/why-vote';
const setBounties = '/help/privileges/set-bounties';
const flagPosts = '/help/privileges/flag-posts';

export interface FlagType {
    id: number;
    displayName: string;
    reportType: Flags;
    flagText?: string;
    comments?: {
        low: string;
        high?: string;
    };
    feedbacks: FlagTypeFeedbacks;
    sendWhenFlagRaised: boolean;
}

export interface FlagCategory {
    isDangerous: boolean; // whether each FlagType of the category should have a red colour
    name: string; // will appear on the edit comments & flags modal
    appliesTo: PostType[]; // where it'll appear (question, answer or both)
    FlagTypes: FlagType[];
}

export const flagCategories: FlagCategory[] = [
    {
        isDangerous: true,
        name: 'Red flags',
        appliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                id: 1,
                displayName: 'Spam',
                reportType: FlagNames.Spam,
                feedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            },
            {
                id: 2,
                displayName: 'Rude or Abusive',
                reportType: FlagNames.Rude,
                feedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            }
        ]
    },
    {
        isDangerous: true,
        name: 'Guttenberg mod flags',
        appliesTo: ['Answer'],
        FlagTypes: [
            {
                id: 3,
                displayName: 'Plagiarism',
                reportType: FlagNames.Plagiarism,
                flagText: 'Possible plagiarism of the linked answer, as can be seen here $COPYPASTOR$',
                // don't send feedback to Smokey despite https://charcoal-se.org/smokey/Feedback-Guidance.html#plagiarism
                feedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 4,
                displayName: 'Duplicate answer',
                reportType: FlagNames.ModFlag,
                flagText: 'The post is a repost of their other answer: $TARGET$, but as there are slight differences '
                               + '(see $COPYPASTOR$), an auto flag would not be raised.',
                comments: {
                    low: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227)."
                       + ' Answer the best one and flag the rest as duplicates, once you earn enough reputation. '
                       + 'If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                },
                feedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 5,
                displayName: 'Bad attribution',
                reportType: FlagNames.Plagiarism,
                flagText: 'This post is copied from $TARGET$, as can be seen here $COPYPASTOR$. The author '
                               + 'only added a link to the other answer, which is [not the proper way of attribution]'
                               + '(//stackoverflow.blog/2009/06/25/attribution-required).',
                feedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            }
        ]
    },
    {
        isDangerous: false,
        name: 'Answer-related',
        appliesTo: ['Answer'],
        FlagTypes: [
            {
                id: 6,
                displayName: 'Link Only',
                reportType: FlagNames.VLQ,
                comments: {
                    low: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
                       + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
                       + 'have some idea what it is and why it is there, then quote the most relevant part of the page '
                       + 'you are linking to in case the target page is unavailable. '
                       + `[Answers that are little more than a link may be deleted.](${deletedAnswers})`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            },
            {
                id: 7,
                displayName: 'Not an answer',
                reportType: FlagNames.NAA,
                comments: {
                    low: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
                       + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
                       + 'If you have a related but different question, [ask a new question](/questions/ask), and include a '
                       + 'link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
                    high: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to '
                        + 'be an explicit attempt to *answer* this question; if you have a critique or need a clarification '
                        + `of the question or another answer, you can [post a comment](${commentHelp}) (like this `
                        + 'one) directly below it. Please remove this answer and create either a comment or a new question. '
                        + 'See: [Ask questions, get answers, no distractions](/tour).',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: true
            },
            {
                id: 8,
                displayName: 'Thanks',
                reportType: FlagNames.NAA,
                comments: {
                    low: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, and '
                       + 'can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) '
                       + `enough [reputation](${reputationHelp}), you will gain privileges to `
                       + `[upvote answers](${voteUpHelp}) you like. This way future visitors of the question `
                       + 'will see a higher vote count on that answer, and the answerer will also be rewarded with '
                       + `reputation points. See [Why is voting important](${whyVote}).`,
                    high: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
                        + 'and can be perceived as noise by its future visitors. Instead, '
                        + `[upvote answers](${voteUpHelp}) you like. This way future visitors of the question `
                        + 'will see a higher vote count on that answer, and the answerer will also be rewarded '
                        + `with reputation points. See [Why is voting important](${whyVote}).`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 9,
                displayName: 'Me too',
                reportType: FlagNames.NAA,
                comments: {
                    low: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
                       + 'If you have a different but related question, then [ask](/questions/ask) it (reference this one '
                       + 'if it will help provide context). If you are interested in this specific question, you can '
                       + `[upvote](${voteUpHelp}) it, leave a [comment](${commentHelp}), or start a `
                       + `[bounty](${setBounties}) once you have enough [reputation](${reputationHelp}).`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 10,
                displayName: 'Library',
                reportType: FlagNames.VLQ,
                comments: {
                    low: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
                       + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 11,
                displayName: 'Comment',
                reportType: FlagNames.NAA,
                comments: {
                    low: 'This does not provide an answer to the question. Once you have sufficient '
                       + `[reputation](${reputationHelp}) you will be able to [comment on any post](${commentHelp}); instead, `
                       + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
                    high: 'This does not provide an answer to the question. Please write a comment instead.',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 12,
                displayName: 'Duplicate',
                reportType: FlagNames.NAA,
                comments: {
                    low: 'Instead of posting an answer which merely links to another answer, please instead '
                       + `[flag the question](${flagPosts}) as a duplicate.`,
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 13,
                displayName: 'Non English',
                reportType: FlagNames.VLQ,
                comments: {
                    low: 'Please write your answer in English, as Stack Overflow is an '
                       + '[English-only site](//meta.stackoverflow.com/a/297680).',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            },
            {
                id: 14,
                displayName: 'Should be an edit',
                reportType: FlagNames.NAA,
                comments: {
                    low: 'Please use the edit link on your question to add additional information. '
                       + 'The "Post Answer" button should be used only for complete answers to the question.',
                },
                feedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                sendWhenFlagRaised: false
            }
        ]
    },
    {
        isDangerous: false,
        name: 'General',
        appliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                id: 15,
                displayName: 'Looks Fine',
                reportType: FlagNames.NoFlag,
                feedbacks: { Smokey: 'fp-', Natty: 'fp', Guttenberg: 'fp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 16,
                displayName: 'Needs Editing',
                reportType: FlagNames.NoFlag,
                feedbacks: { Smokey: 'fp-', Natty: 'ne', Guttenberg: 'fp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            },
            {
                id: 17,
                displayName: 'Vandalism',
                reportType: FlagNames.NoFlag,
                feedbacks: { Smokey: 'tp-', Natty: '', Guttenberg: 'fp', 'Generic Bot': '' },
                sendWhenFlagRaised: false
            }
        ]
    }
];
