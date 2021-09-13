import { FlagTypeFeedbacks, PostType, FlagNames } from './GlobalVars';

export type Flags = 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther' | 'PostLowQuality';
export type HumanFlags = 'as NAA' | 'as R/A' | 'as spam' | 'for moderator attention' | 'as VLQ' | '';

const deletedAnswers = '/help/deleted-answers';
const commentHelp = '/help/privileges/comment';
const reputationHelp = '/help/whats-reputation';
const voteUpHelp = '/help/privileges/vote-up';
const whyVote = '/help/why-vote';
const setBounties = '/help/privileges/set-bounties';
const flagPosts = '/help/privileges/flag-posts';

interface FlagType {
    Id: number;
    DisplayName: string;
    DefaultReportType: Flags;
    DefaultFlagText?: string;
    DefaultComment?: string; // if a type has two comments, then this one is for LowRep
    DefaultCommentHigh?: string; // this is for HighRep instead
    DefaultFeedbacks: FlagTypeFeedbacks;
    DefaultSendWhenFlagRaised: boolean;
}

export interface FlagCategory {
    IsDangerous: boolean; // whether each FlagType of the category should have a red colour
    Name: string; // will appear on the edit comments & flags modal
    AppliesTo: PostType[]; // where it'll appear (question, answer or both)
    FlagTypes: FlagType[];
}

export const flagCategories: FlagCategory[] = [
    {
        IsDangerous: true,
        Name: 'Red flags',
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 1,
                DisplayName: 'Spam',
                DefaultReportType: FlagNames.Spam,
                DefaultFeedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: true
            },
            {
                Id: 2,
                DisplayName: 'Rude or Abusive',
                DefaultReportType: FlagNames.Rude,
                DefaultFeedbacks: { Smokey: 'tpu-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: true
            }
        ]
    },
    {
        IsDangerous: true,
        Name: 'Guttenberg mod flags',
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 3,
                DisplayName: 'Plagiarism',
                DefaultReportType: FlagNames.ModFlag,
                DefaultFlagText: 'Possible plagiarism of another answer $TARGET$, as can be seen here $COPYPASTOR$',
                // don't send feedback to Smokey despite https://charcoal-se.org/smokey/Feedback-Guidance.html#plagiarism
                DefaultFeedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 4,
                DisplayName: 'Duplicate answer',
                DefaultReportType: FlagNames.ModFlag,
                DefaultFlagText: 'The answer is a repost of their other answer $TARGET$, but as there are slight differences '
                               + '(see $COPYPASTOR$), an auto flag would not be raised.',
                DefaultComment: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227)."
                              + ' Answer the best one and flag the rest as duplicates, once you earn enough reputation. '
                              + 'If it is not a duplicate, [edit] the answer and tailor the post to the question.',
                DefaultFeedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 5,
                DisplayName: 'Bad attribution',
                DefaultReportType: FlagNames.ModFlag,
                DefaultFlagText: 'This post is copied from [another answer]($TARGET$), as can be seen here $COPYPASTOR$. The author '
                               + 'only added a link to the other answer, which is [not the proper way of attribution]'
                               + '(//stackoverflow.blog/2009/06/25/attribution-required).',
                DefaultFeedbacks: { Smokey: '', Natty: '', Guttenberg: 'tp', 'Generic Bot': '' },
                DefaultSendWhenFlagRaised: false
            }
        ]
    },
    {
        IsDangerous: false,
        Name: 'Answer-related',
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 6,
                DisplayName: 'Link Only',
                DefaultReportType: FlagNames.VLQ,
                DefaultComment: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
                              + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
                              + 'have some idea what it is and why it is there, then quote the most relevant part of the page '
                              + 'you are linking to in case the target page is unavailable. '
                              + `[Answers that are little more than a link may be deleted.](${deletedAnswers})`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: true
            },
            {
                Id: 7,
                DisplayName: 'Not an answer',
                DefaultReportType: FlagNames.NAA,
                DefaultComment: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
                              + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
                              + 'If you have a related but different question, [ask a new question](/questions/ask), and include a '
                              + 'link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
                DefaultCommentHigh: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to '
                                  + 'be an explicit attempt to *answer* this question; if you have a critique or need a clarification '
                                  + `of the question or another answer, you can [post a comment](${commentHelp}) (like this `
                                  + 'one) directly below it. Please remove this answer and create either a comment or a new question. '
                                  + 'See: [Ask questions, get answers, no distractions](/tour).',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: true
            },
            {
                Id: 8,
                DisplayName: 'Thanks',
                DefaultReportType: FlagNames.NAA,
                DefaultComment: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, and '
                              + 'can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) '
                              + `enough [reputation](${reputationHelp}), you will gain privileges to `
                              + `[upvote answers](${voteUpHelp}) you like. This way future visitors of the question `
                              + 'will see a higher vote count on that answer, and the answerer will also be rewarded with '
                              + `reputation points. See [Why is voting important](${whyVote}).`,
                DefaultCommentHigh: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
                                  + 'and can be perceived as noise by its future visitors. Instead, '
                                  + `[upvote answers](${voteUpHelp}) you like. This way future visitors of the question `
                                  + 'will see a higher vote count on that answer, and the answerer will also be rewarded '
                                  + `with reputation points. See [Why is voting important](${whyVote}).`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 9,
                DisplayName: 'Me too',
                DefaultReportType: FlagNames.NAA,
                DefaultComment: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
                              + 'If you have a different but related question, then [ask](/questions/ask) it (reference this one '
                              + 'if it will help provide context). If you are interested in this specific question, you can '
                              + `[upvote](${voteUpHelp}) it, leave a [comment](${commentHelp}), or start a `
                              + `[bounty](${setBounties}) once you have enough [reputation](${reputationHelp}).`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 10,
                DisplayName: 'Library',
                DefaultReportType: FlagNames.VLQ,
                DefaultComment: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
                              + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 11,
                DisplayName: 'Comment',
                DefaultReportType: FlagNames.NAA,
                DefaultComment: 'This does not provide an answer to the question. Once you have sufficient '
                              + `[reputation](${reputationHelp}) you will be able to [comment on any post](${commentHelp}); instead, `
                              + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
                DefaultCommentHigh: 'This does not provide an answer to the question. Please write a comment instead.',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 12,
                DisplayName: 'Duplicate',
                DefaultReportType: FlagNames.NAA,
                DefaultComment: 'Instead of posting an answer which merely links to another answer, please instead '
                              + `[flag the question](${flagPosts}) as a duplicate.`,
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 13,
                DisplayName: 'Non English',
                DefaultReportType: FlagNames.VLQ,
                DefaultComment: 'Please write your answer in English, as Stack Overflow is an '
                              + '[English-only site](//meta.stackoverflow.com/a/297680).',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 14,
                DisplayName: 'Should be an edit',
                DefaultReportType: FlagNames.NAA,
                DefaultComment: 'Please use the edit link on your question to add additional information. '
                              + 'The "Post Answer" button should be used only for complete answers to the question.',
                DefaultFeedbacks: { Smokey: 'naa-', Natty: 'tp', Guttenberg: '', 'Generic Bot': 'track' },
                DefaultSendWhenFlagRaised: false
            }
        ]
    },
    {
        IsDangerous: false,
        Name: 'General',
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 15,
                DisplayName: 'Looks Fine',
                DefaultReportType: FlagNames.NoFlag,
                DefaultFeedbacks: { Smokey: 'fp-', Natty: 'fp', Guttenberg: 'fp', 'Generic Bot': '' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 16,
                DisplayName: 'Needs Editing',
                DefaultReportType: FlagNames.NoFlag,
                DefaultFeedbacks: { Smokey: 'fp-', Natty: 'ne', Guttenberg: 'fp', 'Generic Bot': '' },
                DefaultSendWhenFlagRaised: false
            },
            {
                Id: 17,
                DisplayName: 'Vandalism',
                DefaultReportType: FlagNames.NoFlag,
                DefaultFeedbacks: { Smokey: 'tp-', Natty: '', Guttenberg: 'fp', 'Generic Bot': '' },
                DefaultSendWhenFlagRaised: false
            }
        ]
    }
];
