import { Store } from './UserscriptTools/Store';
import { Flags, FlagCategory, HumanFlags, FlagType } from './FlagTypes';
import { displayToaster } from './AdvancedFlagging';

export type StacksToastState = 'success' | 'danger' | 'info' | 'warning';
export type PostType = 'Question' | 'Answer';

export interface CachedFlag extends FlagType {
    /*Id: number;
    DisplayName: string;
    FlagText: string;
    Comments: {
        Low: string;
        High: string;
    };
    ReportType: Flags;
    Feedbacks: FlagTypeFeedbacks;
    SendWhenFlagRaised: boolean;*/
    Downvote: boolean;
    Enabled: boolean;
    BelongsTo: string; // the Name of the category it belongs to
    IsDefault: boolean;
}

export type CachedCategory = Omit<FlagCategory, 'FlagTypes'>;

type Mutable<Type> = {
    -readonly [Key in keyof Type]: Type[Key];
};

export type Configuration = Mutable<{
    // so that cache keys aren't duplicated
    [key in keyof (Omit<typeof Cached.Configuration, 'key'>)]: boolean
}> & { // add bot values that don't exist in Cached
    defaultNoSmokey: boolean;
    defaultNoNatty: boolean;
    defaultNoGuttenberg: boolean;
    defaultNoGenericBot: boolean;
}

export interface FlagTypeFeedbacks {
    Smokey: 'tpu-' | 'tp-' | 'fp-' | 'naa-' | '';
    Natty: 'tp' | 'fp' | 'ne' | '';
    Guttenberg: 'tp' | 'fp' | '';
    'Generic Bot': 'track' | ''; // 'track' => track the post, '' => don't
}

export type BotNames = keyof FlagTypeFeedbacks;
export type AllFeedbacks = FlagTypeFeedbacks[BotNames] | '(none)';

export const possibleFeedbacks: { [key in BotNames]: AllFeedbacks[] } = {
    Smokey: ['tpu-', 'tp-', 'fp-', 'naa-', ''],
    Natty: ['tp', 'fp', 'ne', ''],
    Guttenberg: ['tp', 'fp', ''],
    'Generic Bot' : ['track', '']
};

export enum FlagNames {
    Spam = 'PostSpam',
    Rude = 'PostOffensive',
    NAA = 'AnswerNotAnAnswer',
    VLQ = 'PostLowQuality',
    ModFlag = 'PostOther',
    NoFlag = 'NoFlag'
}

// Constants
export const soboticsRoomId = 111347;


export const username = document.querySelector<HTMLDivElement>(
    'a[href^="/users/"] div[title]'
)?.title || '';
export const popupDelay = 4 * 1000;

export const isStackOverflow = /^https:\/\/stackoverflow.com/.test(window.location.href);
export const isQuestionPage = /\/questions\/\d+.*/.test(window.location.href);
export const isNatoPage = window.location.href.includes('/tools/new-answers-old-questions');
export const isFlagsPage = /\/users\/flag-summary\/\d+/.test(window.location.href);
export const isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(window.location.href);

export const botImages = {
    Natty: 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1',
    Smokey: 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1',
    'Generic Bot': 'https://i.stack.imgur.com/6DsXG.png?s=32&g=1',
    Guttenberg: 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1'
};

// Cache keys
export const Cached = {
    Configuration: {
        key: 'Configuration',

        openOnHover: 'openOnHover',
        defaultNoFlag: 'defaultNoFlag',
        defaultNoComment: 'defaultNoComment',
        defaultNoDownvote: 'defaultNoDownvote',

        watchFlags: 'watchFlags',
        watchQueues: 'watchQueues',

        linkDisabled: 'linkDisabled',
        addAuthorName: 'addAuthorName',
        debug: 'debug',
    },
    Fkey: 'fkey',
    Metasmoke: {
        userKey: 'Metasmoke.userKey',
        disabled: 'Metasmoke.disabled'
    },

    FlagTypes: 'FlagTypes',
    FlagCategories: 'FlagCategories'
} as const;

export const getIconPath = (name: string): string => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, 'text/html');
    const path = parsed.body.querySelector('path') as SVGPathElement;

    return path.getAttribute('d') || '';
};

export const getSvg = (name: string): SVGElement => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, 'text/html');

    return parsed.body.firstElementChild as SVGElement;
};

export function displayStacksToast(
    message: string,
    type: StacksToastState,
    dismissable?: boolean
): void {
    /*const parent = document.querySelector(
        '.s-modal[aria-hidden="false"] > .s-modal--dialog'
    ) as HTMLElement;*/

    StackExchange.helpers.showToast(message, {
        type: type,
        transientTimeout: popupDelay,
        // disallow dismissing the popup if inside modal
        dismissable,
        // so that dismissing the toast won't close the modal
        //$parent: addParent ? $(parent) : $()
    });
}

export function attachPopover(
    element: Element,
    text: string,
    position: Stacks.TooltipOptions['placement'] = 'bottom-start'
): void {
    Stacks.setTooltipText(
        element,
        text,
        { placement: position }
    );
}

export function attachHtmlPopover(
    element: Element,
    text: string,
    position: Stacks.TooltipOptions['placement'] = 'bottom-start'
): void {
    Stacks.setTooltipHtml(
        element,
        text, { placement: position }
    );
}

// regexes
export const isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
export const isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
export const flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;

export function getFlagsUrlRegex(postId: number): RegExp {
    const flagNames = Object.values(FlagNames).join('|');
    const regex = new RegExp(
        `/flags/posts/${postId}/add/(${flagNames})`
    );

    return regex;
}

// various helper functions
export const showInlineElement = (element: HTMLElement): void => {
    element.classList.add('d-inline-block');
    element.classList.remove('d-none');
};

export const displaySuccess = (message: string): void => displayToaster(message, 'success');
export const displayError = (message: string): void => displayToaster(message, 'danger');

export function isPostDeleted(postId: number): boolean {
    const post = document.querySelector(
        `#question-${postId}, #answer-${postId}`
    );

    // yes, deleted questions do contain this class!
    return post?.classList.contains('deleted-answer') || false;
}

export function getFormDataFromObject<T extends { [key: string]: string }>(
    object: T
): FormData {
    return Object
        .keys(object)
        .reduce((formData, key) => {
            formData.append(key, object[key]);
            return formData;
        }, new FormData());
}

export const getCachedConfigBotKey = (
    botName: BotNames
): keyof Configuration => {
    type Sanitised = 'Smokey' | 'Natty' | 'GenericBot' | 'Guttenberg';

    const sanitised = botName.replace(/\s/g, '') as Sanitised;

    return `defaultNo${sanitised}`;
};

export function getSentMessage(
    success: boolean,
    feedback: string,
    bot: string
): string {
    return success
        ? `Feedback ${feedback} sent to ${bot}`
        : `Failed to send feedback ${feedback} to ${bot}`;
}

//export const popoverArrow = $('<div>').addClass('s-popover--arrow s-popover--arrow__tc');
//export const categoryDivider = $('<li>').addClass('s-menu--divider').attr('role', 'separator');

export async function delay(milliseconds: number): Promise<void> {
    return await new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export async function showConfirmModal(
    title: string,
    bodyHtml: string
): Promise<boolean> {
    return await StackExchange.helpers.showConfirmModal({
        title,
        bodyHtml,
        buttonLabel: 'Authenticate!'
    });
}

// Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
let initialized = false;
const callbacks: ((request: XMLHttpRequest) => void)[] = [];
export function addXHRListener(callback: (request: XMLHttpRequest) => void): void {
    callbacks.push(callback);
    if (initialized) return;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(): void {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);
        // eslint-disable-next-line prefer-rest-params
        open.apply(this, arguments);
    };
    initialized = true;
}

// cache-related helpers/values
// Some information from cache is stored on the variables as objects to make editing easier and simpler
// Each time something is changed in the variables, update* must also be called to save the changes to the cache
export const cachedConfiguration = Store.get<Configuration>(Cached.Configuration.key)
    || {} as Partial<Configuration>;
export const updateConfiguration = (): void => Store.set(Cached.Configuration.key, cachedConfiguration);
export const debugMode = cachedConfiguration[Cached.Configuration.debug];

export const cachedFlagTypes = Store.get<CachedFlag[]>(Cached.FlagTypes) || [];
export const updateFlagTypes = (): void => Store.set(Cached.FlagTypes, cachedFlagTypes);

export const cachedCategories = Store.get<CachedCategory[]>(Cached.FlagCategories)
    || [] as (Partial<CachedCategory>)[];
// export const updateCategories = (): void => GreaseMonkeyCache.storeInCache(FlagCategoriesKey, cachedCategories);

// Replaces the placeholders with actual values in the cached flag text
export function getFullFlag(
    flagType: CachedFlag,
    target: string,
    postId: number
): string | null {
    const placeholderTarget = /\$TARGET\$/g;
    const placeholderCopypastorLink = /\$COPYPASTOR\$/g;

    const content = flagType.FlagText;

    if (!content) return null;

    const copypastorLink = `https://copypastor.sobotics.org/posts/${postId}`;

    return content
        .replace(placeholderTarget, target)
        .replace(placeholderCopypastorLink, copypastorLink);
}

export function getFlagTypeFromFlagId(flagId: number): CachedFlag | null {
    return cachedFlagTypes.find(flagType => flagType.Id === flagId) || null;
}

export function getHumanFromDisplayName(displayName: Flags): HumanFlags {
    switch (displayName) {
        case FlagNames.NAA:
            return 'as NAA';
        case FlagNames.Rude:
            return 'as R/A';
        case FlagNames.Spam:
            return 'as spam';
        case FlagNames.ModFlag:
            return 'for moderator attention';
        case FlagNames.VLQ:
            return 'as VLQ';
        case FlagNames.NoFlag:
        default:
            return '';
    }
}
