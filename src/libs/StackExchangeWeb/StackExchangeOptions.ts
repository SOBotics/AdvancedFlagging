export interface StackExchangeGlobal {
    options: StackExchangeOptions;
    comments: StackExchangeComments;
}

export interface StackExchangeComments {
    uiForPost(element: JQuery): StackExchangeCommentUI;
}

export interface StackExchangeCommentUI {
    jCommentsLinkContainer: JQuery;
    jCommentsList: JQuery;
    jDiv: JQuery;
    jPost: JQuery;
    postId: number;
    addShow(noFocus: boolean, ensureInput: boolean): void;
    showComments(html: string, submittedEditCommentId: number | null, noHighlighting: boolean, noScrolling: boolean): void;
}

export interface StackExchangeOptions {
    enableLogging?: boolean;
    events: StackExchangeOptionsEvents;
    jobPreferences: StackExchangeOptionsJobPreferences;
    locale: string;
    networkMetaHostname: string;
    realtime: StackExchangeOptionsRealTime;
    routeName: string;
    serverTime: number;
    serverTimeOffsetSec: number;
    site: StackExchangeOptionsSite;
    stackAuthUrl: string;
    story: StackExchangeOptionsStory;
    user: StackExchangeOptionsUser;
}

export interface StackExchangeOptionsEvents {
    postEditionSection: { body: number, tags: number, title: number };
    postType: { question: number };
}

export interface StackExchangeOptionsJobPreferences {
    maxNumDeveloperRoles: number;
    maxNumIndustries: number;
}

export interface StackExchangeOptionsRealTime {
    active: boolean;
    newest: boolean;
    staleDisconnectIntervalInHours: number;
    tagged: boolean;
    workerIframeDomain: string;
}

export interface StackExchangeOptionsSite {
    description: string;
    enableNewTagCreationWarning: boolean;
    enableSocialMediaInSharePopup: boolean;
    id: number;
    insertSpaceAfterNameTabCompletion: boolean;
    isChildMeta: boolean;
    isMetaSite: boolean;
    isNoticesTabEnabled: boolean;
    name: string;
    parentUrl: string;
    protocol: string;
    recaptchaAudioLang: string;
    recaptchaPublicKey: string;
}

export interface StackExchangeOptionsStory {
    dislikedTagsMaxLength: number;
    likedTagsMaxLength: number;
    minCompleteBodyLength: number;
}

export interface StackExchangeOptionsUser {
    accountId: number;
    canSeeDeletedPosts: boolean;
    canSeeNewHeaderDesign: boolean;
    fkey: string;
    gravatar: string;
    isRegistered: boolean;
    keyboardShortcuts: boolean;
    profileUrl: string;
    rep: number;
    tid: string;
    userId: number;
    userType: number;
}
