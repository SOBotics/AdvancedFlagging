import { CachedFlag, Configuration, Store } from './UserscriptTools/Store';
import { Flags } from './FlagTypes';
import Page from './UserscriptTools/Page';
import { Progress } from './UserscriptTools/Progress';

type BasicPlacement = 'auto' | 'top' | 'right' | 'bottom' | 'left';
// Minimum TypeScript Version: 4.1
type AllPlacements =
    | BasicPlacement
    | `${BasicPlacement}-start`
    | `${BasicPlacement}-end`;

export type StacksToastState = 'success' | 'danger' | 'info' | 'warning';
export type PostType = 'Question' | 'Answer';

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
    'Generic Bot': ['track', '']
};

export enum FlagNames {
    Spam = 'PostSpam',
    Rude = 'PostOffensive',
    NAA = 'AnswerNotAnAnswer',
    VLQ = 'PostLowQuality',
    NoFlag = 'NoFlag',
    Plagiarism = 'PlagiarizedContent',
    ModFlag = 'PostOther'
}

// Constants
export const username = document.querySelector<HTMLDivElement>(
    'a[href^="/users/"] div[title]'
)?.title ?? '';
export const popupDelay = 4 * 1000;

export const getIconPath = (name: string): string => {
    const element = GM_getResourceText(name);
    const parsed = new DOMParser().parseFromString(element, 'text/html');
    const path = parsed.body.querySelector('path') as SVGPathElement;

    return path.getAttribute('d') ?? '';
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
    /*
    const parent = document.querySelector(
        '.s-modal[aria-hidden="false"] > .s-modal--dialog'
    ) as HTMLElement;
    */

    StackExchange.helpers.showToast(message, {
        type: type,
        transientTimeout: popupDelay,
        // disallow dismissing the popup if inside modal
        dismissable,
        // so that dismissing the toast won't close the modal
        // $parent: addParent ? $(parent) : $()
    });
}

export function attachPopover(
    element: Element,
    text: string,
    position: AllPlacements = 'bottom-start'
): void {
    Stacks.setTooltipText(
        element,
        text,
        { placement: position }
    );
}

export function getFormDataFromObject<T extends Record<string, string>>(
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

export async function delay(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

// Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
const callbacks: ((request: XMLHttpRequest) => void)[] = [];

export function addXHRListener(callback: (request: XMLHttpRequest) => void): void {
    callbacks.push(callback);
}

export function interceptXhr(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(): void {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);

        // eslint-disable-next-line prefer-rest-params
        open.apply(this, arguments);
    };
}

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
        .replace(placeholderTarget, `https:${target}`)
        .replace(placeholderCopypastorLink, copypastorLink);
}

export function getFlagTypeFromFlagId(flagId: number): CachedFlag | null {
    return Store.flagTypes.find(({ id }) => id === flagId) ?? null;
}

export type HumanFlags = 'as NAA'
    | 'as R/A'
    | 'as spam'
    | 'for plagiarism'
    | 'as VLQ'
    | 'for moderator attention'
    | '';

export function getHumanFromDisplayName(displayName: Flags): HumanFlags {
    const flags = {
        [FlagNames.Spam]: 'as spam',
        [FlagNames.Rude]: 'as R/A',
        [FlagNames.NAA]: 'as NAA',
        [FlagNames.VLQ]: 'as VLQ',
        [FlagNames.NoFlag]: '',
        [FlagNames.Plagiarism]: 'for plagiarism',
        [FlagNames.ModFlag]: 'for moderator attention',
    } as const;

    return flags[displayName] || '';
}

export function toggleLoading(button: HTMLButtonElement): void {
    button.classList.toggle('is-loading');
    button.ariaDisabled = button.ariaDisabled === 'true' ? 'false' : 'true';
    button.disabled = !button.disabled;
}

export async function addProgress(
    event: Event,
    flagType: CachedFlag,
    post = new Page(true).posts[0]
): Promise<void> {
    if (!post.filterReporters(flagType.feedbacks).length) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLButtonElement;

    // indicate loading
    toggleLoading(target);

    post.progress = new Progress(target);
    post.progress.attach();

    const input = document.querySelector<HTMLInputElement>('#advanced-flagging-flag-post');
    if (input?.checked) {
        const flagProgress = post.progress.addItem('Flagging as NAA...');

        try {
            await post.flag(FlagNames.NAA, null);
            flagProgress.completed();
        } catch (error) {
            console.error(error);

            flagProgress.failed(
                error instanceof Error
                    ? error.message
                    : 'see console for more details'
            );
        }
    }

    try {
        await post.sendFeedbacks(flagType);
    } finally {
        // remove previously added indicators
        await delay(1000);
        toggleLoading(target);

        // proceed with the vote
        target.click();
    }
}
