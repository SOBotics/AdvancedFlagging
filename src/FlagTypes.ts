import { isStackOverflow, getFullFlag, getFullComment } from './GlobalVars';

export interface UserDetails {
    Reputation: number;
    AuthorName: string;
}

export interface FlagType {
    Id: number;
    DisplayName: string;
    ReportType: 'AnswerNotAnAnswer' | 'PostOffensive' | 'PostSpam' | 'NoFlag' | 'PostOther' | 'PostLowQuality';
    Human?: string;
    GetComment?(userDetails: UserDetails): string | null;
    Enabled(isRepost: boolean, copypastorId: number): boolean;
    GetCustomFlagText?(target: string, postId: number): string | undefined;
}

export interface FlagCategory {
    IsDangerous: boolean; // whether the category should have a red-ish background
    AppliesTo: ('Answer' | 'Question')[];
    FlagTypes: FlagType[];
}

const getRepLevel = (reputation: number, max: number): string => reputation > max ? 'High' : 'Low';
export const flagCategories: FlagCategory[] = [
    {
        IsDangerous: true,
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 1,
                DisplayName: 'Spam',
                ReportType: 'PostSpam',
                Human: 'as spam',
                Enabled: (): boolean => true
            },
            {
                Id: 2,
                DisplayName: 'Rude or Abusive',
                ReportType: 'PostOffensive',
                Human: 'as R/A',
                Enabled: (): boolean => true
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
                Enabled: (isRepost, copypastorId): boolean => !isRepost && Boolean(copypastorId),
                GetCustomFlagText: (target, postId): string | undefined => getFullFlag('Plagiarism', target, postId)
            },
            {
                Id: 4,
                DisplayName: 'Duplicate answer',
                ReportType: 'PostOther',
                Human: 'for moderator attention',
                Enabled: (isRepost, copypastorId): boolean => isRepost && Boolean(copypastorId),
                GetCustomFlagText: (target, postId): string | undefined => getFullFlag('DuplicateAnswer', target, postId)
            },
            {
                Id: 5,
                DisplayName: 'Bad attribution',
                ReportType: 'PostOther',
                Human: 'for moderator attention',
                Enabled: (isRepost, copypastorId): boolean => !isRepost && Boolean(copypastorId),
                GetCustomFlagText: (target, postId): string | undefined => getFullFlag('BadAttribution', target, postId)
            }
        ]
    },
    {
        IsDangerous: false,
        AppliesTo: ['Answer'],
        FlagTypes: [
            {
                Id: 6,
                DisplayName: 'Link Only',
                ReportType: 'PostLowQuality',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment('LinkOnly', userDetails.AuthorName)
            },
            {
                Id: 7,
                DisplayName: 'Not an answer',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment(`NAA${getRepLevel(userDetails.Reputation, 50)}Rep`, userDetails.AuthorName)
            },
            {
                Id: 8,
                DisplayName: 'Thanks',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment(`Thanks${getRepLevel(userDetails.Reputation, 50)}Rep`, userDetails.AuthorName)
            },
            {
                Id: 9,
                DisplayName: 'Me too',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment('MeToo', userDetails.AuthorName)
            },
            {
                Id: 10,
                DisplayName: 'Library',
                ReportType: 'PostLowQuality',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment('Library', userDetails.AuthorName)
            },
            {
                Id: 11,
                DisplayName: 'Comment',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment(`Comment${getRepLevel(userDetails.Reputation, 50)}Rep`, userDetails.AuthorName)
            },
            {
                Id: 12,
                DisplayName: 'Duplicate',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment('Duplicate', userDetails.AuthorName)
            },
            {
                Id: 13,
                DisplayName: 'Non English',
                ReportType: 'PostLowQuality',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment('NonEnglish', userDetails.AuthorName)
            },
            {
                Id: 14,
                DisplayName: 'Should be an edit',
                ReportType: 'AnswerNotAnAnswer',
                Human: 'as NAA',
                Enabled: (): boolean => isStackOverflow,
                GetComment: (userDetails): string | null => getFullComment('ShouldBeAnEdit', userDetails.AuthorName)
            }
        ]
    },
    {
        IsDangerous: false,
        AppliesTo: ['Answer', 'Question'],
        FlagTypes: [
            {
                Id: 15,
                DisplayName: 'Looks Fine',
                ReportType: 'NoFlag',
                Enabled: (): boolean => true
            },
            {
                Id: 16,
                DisplayName: 'Needs Editing',
                ReportType: 'NoFlag',
                Enabled: (): boolean => true
            },
            {
                Id: 17,
                DisplayName: 'Vandalism',
                ReportType: 'NoFlag',
                Enabled: (): boolean => true
            }
        ]
    }
];
