import { Store } from './UserscriptTools/Store';
import { Flags, FlagCategory, HumanFlags, FlagType } from './FlagTypes';

export type StacksToastState = 'success' | 'danger' | 'info' | 'warning';
export type PostType = 'Question' | 'Answer';

export interface CachedFlag extends FlagType {
    downvote: boolean;
    enabled: boolean;
    belongsTo: string; // the Name of the category it belongs to
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
export const username = document.querySelector<HTMLDivElement>(
    'a[href^="/users/"] div[title]'
)?.title || '';
export const popupDelay = 4 * 1000;

export const isStackOverflow = /^https:\/\/stackoverflow.com/.test(location.href);
export const isQuestionPage = /\/questions\/\d+.*/.test(location.href);
export const isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(location.href);

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
        userKey: 'MetaSmoke.userKey',
        disabled: 'MetaSmoke.disabled'
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

export async function delay(milliseconds: number): Promise<void> {
    return await new Promise<void>(resolve => setTimeout(resolve, milliseconds));
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

    const content = flagType.flagText;

    if (!content) return null;

    const copypastorLink = `https://copypastor.sobotics.org/posts/${postId}`;

    return content
        .replace(placeholderTarget, target)
        .replace(placeholderCopypastorLink, copypastorLink);
}

export function getFlagTypeFromFlagId(flagId: number): CachedFlag | null {
    return cachedFlagTypes.find(({ id }) => id === flagId) || null;
}

export function getHumanFromDisplayName(displayName: Flags): HumanFlags {
    const flags = {
        [FlagNames.Spam]: 'as spam',
        [FlagNames.Rude]: 'as R/A',
        [FlagNames.NAA]: 'as NAA',
        [FlagNames.VLQ]: 'as VLQ',
        [FlagNames.ModFlag]: 'for moderator attention',
        [FlagNames.NoFlag]: ''
    } as const;

    return flags[displayName] || '';
}
