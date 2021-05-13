/* eslint-disable @typescript-eslint/no-explicit-any */
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import { Flags, FlagCategory, HumanFlags } from './FlagTypes';
import { displayToaster } from './AdvancedFlagging';

declare const StackExchange: StackExchange;
declare const Stacks: Stacks;

export type StacksToastState = 'success' | 'danger' | 'info' | 'warning';
export type PostType = 'Question' | 'Answer';

export interface CachedFlag {
    Id: number;
    DisplayName: string;
    FlagText: string;
    Comments: {
        Low: string;
        High: string;
    };
    ReportType: Flags;
    Feedbacks: FlagTypeFeedbacks;
    BelongsTo: string; // the Name of the category it belongs to
    IsDefault: boolean;
    Enabled: boolean;
}

export type CachedCategory = Omit<FlagCategory, 'FlagTypes'>;

export interface CachedConfiguration {
    OpenOnHover: boolean;
    DefaultNoFlag: boolean;
    DefaultNoComment: boolean;
    DefaultNoDownvote: boolean;
    WatchFlags: boolean;
    WatchQueues: boolean;
    LinkDisabled: boolean;
    AddAuthorName: boolean;
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

interface UserDetails {
    authorReputation: number;
    authorName: string;
}

// StackExchange objects
// definitions from https://github.com/StackExchange/Stacks/blob/develop/lib/ts/controllers/s-tooltip.ts and
// https://github.com/StackExchange/Stacks/blob/develop/lib/ts/controllers/s-modal.ts slightly modified to make TS happy
export interface Stacks {
    setTooltipText(element: Element, title: string, options: { placement: string }): void;
    setTooltipHtml(element: Element, title: string, options: { placement: string }): void;
    showModal(popup: HTMLElement | null): void;
}

export interface StackExchange {
    helpers: {
        showConfirmModal(modal: ModalType): Promise<boolean>;
        showModal(popup: JQuery | Element | null): void;
        showToast(message: string, info: { type: string, transientTimeout: number }): void;
    };
    options: {
        user: {
            fkey: string;
            userId: number;
            isModerator: boolean;
        }
    };
    comments: {
        uiForPost(comments: JQuery): {
            addShow(value1: boolean, value2: boolean): void;
            showComments(value1: string, value2: string | null, value3: boolean, value4: boolean): void;
        };
    };
}

interface ModalType {
    title: string;
    bodyHtml: string;
    buttonLabel: string;
}

// Constants
export const soboticsRoomId = 111347;
export const metasmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
export const metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
export const copypastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
export const copypastorServer = 'https://copypastor.sobotics.org';
export const genericBotKey = 'Cm45BSrt51FR3ju';
const placeholderTarget = /\$TARGET\$/g;
const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
export const nattyFeedbackUrl = 'https://logs.sobotics.org/napi-1.1/api/feedback/';
export const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
export const dayMillis = 1000 * 60 * 60 * 24;
export const popupDelay = 4 * 1000;
export const settingUpTitle = 'Setting up MetaSmoke';
export const settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
                           + 'To reset configuration, see the footer of Stack Overflow.';
export const genericBotSuccess = 'Post tracked with Generic Bot';
export const genericBotFailure = 'Server refused to track the post';
export const metasmokeReportedMessage = 'Post reported to Smokey';
export const metasmokeFailureMessage = 'Failed to report post to Smokey';
export const nattyReportedMessage = 'Post reported to Natty';
export const chatFailureMessage = 'Failed to send message to chat';
const nattyImage = 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1';
const guttenbergImage = 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1';
const smokeyImage = 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1';
export const isStackOverflow = /^https:\/\/stackoverflow.com/.test(window.location.href);
export const isQuestionPage = /\/questions\/\d+.*/.test(window.location.href);
export const isNatoPage = /\/tools\/new-answers-old-questions/.test(window.location.href);
export const isFlagsPage = /\/users\/flag-summary\/\d+/.test(window.location.href);
export const isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(window.location.href);
export const gridCellDiv = $('<div>').addClass('grid--cell');
export const noneString = '<span class="o50">(none)</span>';

// Help center links used in FlagTypes for comments/flags
export const deletedAnswers = '/help/deleted-answers';
export const commentHelp = '/help/privileges/comment';
export const reputationHelp = '/help/whats-reputation';
export const voteUpHelp = '/help/privileges/vote-up';
export const whyVote = '/help/why-vote';
export const setBounties = '/help/privileges/set-bounties';
export const flagPosts = '/help/privileges/flag-posts';

// Cache keys
export const ConfigurationCacheKey = 'Configuration';
export const ConfigurationOpenOnHover = 'OpenOnHover';
export const ConfigurationDefaultNoFlag = 'DefaultNoFlag';
export const ConfigurationDefaultNoComment = 'DefaultNoComment';
export const ConfigurationDefaultNoDownvote = 'DefaultNoDownvote';
export const ConfigurationWatchFlags = 'WatchFlags';
export const ConfigurationWatchQueues = 'WatchQueues';
export const ConfigurationLinkDisabled = 'LinkDisabled';
export const ConfigurationAddAuthorName = 'AddAuthorName';
export const CacheChatApiFkey = 'fkey';
export const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
export const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
export const FlagTypesKey = 'FlagTypes';
export const FlagCategoriesKey = 'FlagCategories';

export const getStacksSvg = (svgName: string): JQuery => $(GM_getResourceText(svgName));

export const displayStacksToast = (message: string, type: StacksToastState): void => StackExchange.helpers.showToast(message, {
    type: type,
    transientTimeout: popupDelay
});
export const attachPopover = (element: Element, text: string, position = 'bottom-start'): void => {
    Stacks.setTooltipText(element, text, { placement: position });
};
export const attachHtmlPopover = (element: Element, text: string, position = 'bottom-start'): void => {
    Stacks.setTooltipHtml(element, text, { placement: position });
};

// regexes
export const isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
export const isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
export const flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
export const getFlagsUrlRegex = (postId: number): RegExp => new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther|PostLowQuality)`);

// helper functions
export const showElement = (element: JQuery): JQuery => element.addClass('d-block').removeClass('d-none');
export const showInlineElement = (element: JQuery): JQuery => element.addClass('d-inline-block').removeClass('d-none');
export const displaySuccess = (message: string): void => displayToaster(message, 'success');
export const displayError = (message: string): void => displayToaster(message, 'danger');
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getParamsFromObject = (object: any): string => Object.entries(object).map(item => item.join('=')).join('&');
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getFormDataFromObject = (object: any): FormData => Object.keys(object).reduce((formData, key) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    formData.append(key, object[key]);
    return formData;
}, new FormData());
const getCopypastorLink = (postId: number): string => `https://copypastor.sobotics.org/posts/${postId}`;
export const getPostIdFromReview = (): number => Number($('[id^="answer-"]').attr('id')?.split('-')[1]);
export function qualifiesForVlq(postScore: number, creationDate: Date): boolean {
    return postScore <= 0 && (new Date().valueOf() - creationDate.valueOf()) < dayMillis;
}
export const isPostDeleted = (postId: number): boolean => $(`#question-${postId}, #answer-${postId}`).hasClass('deleted-answer');

export function getSentMessage(success: boolean, feedback: string, bot: string): string {
    return success ? `Feedback ${feedback} sent to ${bot}` : `Failed to send feedback ${feedback} to ${bot}`;
}

// jQuery icon elements
const sampleIcon = gridCellDiv.clone().addClass(`d-none ${isQuestionPage || isLqpReviewPage ? '' : ' ml8'}`)
    .append($('<a>').addClass('s-avatar s-avatar__16 s-user-card--avatar').append($('<img>').addClass('s-avatar--image')));
export const nattyIcon = sampleIcon.clone().find('img').attr('src', nattyImage).parent().parent();
export const guttenbergIcon = sampleIcon.clone().find('img').attr('src', guttenbergImage).parent().parent();
export const smokeyIcon = sampleIcon.clone().find('img').attr('src', smokeyImage).parent().parent();

// dynamically generated jQuery elements based on the parameters passed
export const getMessageDiv = (text: string, state: string): JQuery => $('<div>').addClass(`p12 bg-${state}`).text(text).hide();
export const getSectionWrapper = (name: string): JQuery => $('<fieldset>').html(`<h2 class="grid--cell">${name}</h2>`)
    .addClass(`grid gs8 gsy fd-column af-section-${name.toLowerCase()}`);
export const getTextarea = (textareaContent: string, labelText: string, contentType: 'flag' | 'lowrep' | 'highrep'): JQuery => $(`
<div class="grid gs4 gsy fd-column" style="display: ${textareaContent ? 'flex' : 'none'};">
    <label class="grid--cell s-label">${labelText}</label>
    <textarea rows=4 class="grid--cell s-textarea fs-body2 af-${contentType}-content">${textareaContent}</textarea>
</div>`);

const iconWrapper = $('<div>').addClass('grid--cell').css('display', 'none'); // the element that will contain the bot icons
export const performedActionIcon = (): JQuery => iconWrapper.clone().append(getStacksSvg('Checkmark').addClass('fc-green-500'));
export const failedActionIcon = (): JQuery => iconWrapper.clone().append(getStacksSvg('Clear').addClass('fc-red-500'));
export const reportedIcon = (): JQuery => iconWrapper.clone().append(getStacksSvg('Flag').addClass('fc-red-500'));
export const popupWrapper = $('<div>').addClass('af-snackbar fc-white fs-body3 ta-center z-modal ps-fixed l50');

export const advancedFlaggingLink = $('<button>').attr('type', 'button').addClass('s-btn s-btn__link').text('Advanced Flagging');
export const popoverArrow = $('<div>').addClass('s-popover--arrow s-popover--arrow__tc');
export const dropdown = $('<div>').addClass('advanced-flagging-dialog s-popover s-anchors s-anchors__default mt2 c-default');
export const actionsMenu = $('<ul>').addClass('s-menu mxn12 myn8').attr('role', 'menu');
export const dropdownItem = $('<li>').attr('role', 'menuitem');
export const reportLink = $('<a>').addClass('s-block-link py4');
export const categoryDivider = $('<li>').addClass('s-menu--divider').attr('role', 'separator');
const getOptionCheckbox = (elId: string): JQuery => $(`<input type="checkbox" name="${elId}" id="${elId}" class="s-checkbox">`);
const getOptionLabel = (elId: string, text: string): JQuery => $(`<label for="${elId}" class="ml6 va-middle c-pointer">${text}</label>`);
export const getPopoverOption = (itemId: string, checked: boolean, text: string): JQuery => dropdownItem.clone().addClass('pl6')
    .append(getOptionCheckbox(itemId).prop('checked', checked), getOptionLabel(itemId, text));

export const configurationDiv = $('<div>').addClass('advanced-flagging-configuration-div ta-left pt6');
export const configurationLink = $('<a>').attr('id', 'af-modal-button').text('AdvancedFlagging configuration');
export const commentsDiv = configurationDiv.clone().removeClass('advanced-flagging-configuration-div').addClass('af-comments-div');
export const commentsLink = configurationLink.clone().attr('id', 'af-comments-button').text('AdvancedFlagging: edit comments and flags');

export const configurationModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
    <div class="s-modal--dialog s-modal__full w60 sm:w100 md:w75 lg:w75" role="document">
        <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>
        <div class="s-modal--body fs-body2" id="af-modal-description"></div>
        <div class="grid gs8 gsx s-modal--footer">
            <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>
            <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
            <button class="grid--cell s-btn s-btn__danger af-configuration-reset" type="button">Reset</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
    </div>
</aside>`);
const metasmokeTokenPopup = $(`
<aside class="s-modal" id="af-ms-token" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
    <div class="s-modal--dialog s-modal__full sm:w100 md:w100" role="document">
        <h1 class="s-modal--header fw-bold " id="af-modal-title">Authenticate MS with AF</h1>
        <div class="s-modal--body fs-body2" id="af-modal-description">
            <div class="grid gs4 gsy fd-column">
                <div class="grid--cell">
                    <label class="s-label" for="example-item1">
                        Metasmoke access token
                        <p class="s-description mt2">
                            Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:
                        </p>
                    </label>
                </div>
                <div class="grid ps-relative">
                    <input class="s-input" type="text" id="advanced-flagging-ms-token" placeholder="Enter the code here">
                </div>
            </div>
        </div>
        <div class="grid gs8 gsx s-modal--footer">
            <button class="grid--cell s-btn s-btn__primary" id="advanced-flagging-save-ms-token" type="button">Submit</button>
            <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
    </div>
</aside>`);
export const editCommentsPopup = $(`
<aside class="s-modal" id="af-comments" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
    <div class="s-modal--dialog s-modal__full md:w100 sm:w100 w80" role="document">
        <h1 class="s-modal--header fw-body" id="af-comments-title">AdvancedFlagging: edit comments and flags</h1>
        <div class="s-modal--body fs-body2" id="af-comments-description">
            <div class="grid fd-column gs16"></div>
        </div>
        <div class="grid gs8 gsx s-modal--footer">
            <button class="grid--cell s-btn s-btn__primary" type="button" data-action="s-modal#hide">I'm done!</button>
            <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
            <button class="grid--cell s-btn s-btn__danger af-comments-reset" type="button">Reset</button>
        </div>
        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
    </div>
</aside>`);

export function showMSTokenPopupAndGet(): Promise<string | undefined> {
    return new Promise<string | undefined>(resolve => {
        StackExchange.helpers.showModal(metasmokeTokenPopup);
        $('#advanced-flagging-save-ms-token').on('click', () => {
            const token = $('#advanced-flagging-ms-token').val();
            $('#af-ms-token').remove(); // dismiss modal
            if (!token) return;
            resolve(token.toString());
        });
    });
}

export async function Delay(milliseconds: number): Promise<void> {
    return await new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export async function showConfirmModal(title: string, bodyHtml: string): Promise<boolean> {
    return await StackExchange.helpers.showConfirmModal({
        title: title,
        bodyHtml: bodyHtml,
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
    XMLHttpRequest.prototype.open = function(...args: any[]): void {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);
        open.apply(this, args);
    };
    initialized = true;
}

// cache-related helpers/values
// Some information from cache is stored on the variables as objects to make editing easier and simpler
// Each time something is changed in the variables, update* must also be called to save the changes to the cache
export const cachedConfigurationInfo = GreaseMonkeyCache.getFromCache<CachedConfiguration>(ConfigurationCacheKey) || {} as CachedConfiguration;
export const updateConfiguration = (): void => GreaseMonkeyCache.storeInCache(ConfigurationCacheKey, cachedConfigurationInfo);
export const cachedFlagTypes = GreaseMonkeyCache.getFromCache<CachedFlag[]>(FlagTypesKey) || [];
export const updateFlagTypes = (): void => GreaseMonkeyCache.storeInCache(FlagTypesKey, cachedFlagTypes);
export const cachedCategories = GreaseMonkeyCache.getFromCache<CachedCategory[]>(FlagCategoriesKey) || [];
// export const updateCategories = (): void => GreaseMonkeyCache.storeInCache(FlagCategoriesKey, cachedCategories);

// Adds the author name before the comment if the option is enabled and determines if the comment should be low/high rep
export function getFullComment(flagId: number, { authorReputation, authorName }: UserDetails): string | null {
    const shouldAddAuthorName = cachedConfigurationInfo?.AddAuthorName;
    const flagType = getFlagTypeFromFlagId(flagId);
    const comment = flagType?.Comments[authorReputation > 50 ? 'High' : 'Low'] || flagType?.Comments.Low;
    return (comment && shouldAddAuthorName ? `${authorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || null;
}

// Replaces the placeholders with actual values in the cached flag text
export function getFullFlag(flagId: number, target: string, postId: number): string {
    const flagType = getFlagTypeFromFlagId(flagId);
    const flagContent = flagType?.FlagText;
    if (!flagContent) return '';
    return flagContent.replace(placeholderTarget, target).replace(placeholderCopypastorLink, getCopypastorLink(postId));
}

export function getFlagTypeFromFlagId(flagId: number): CachedFlag | null {
    return cachedFlagTypes?.find(flagType => flagType.Id === flagId) || null;
}

export function getHumanFromDisplayName(displayName: Flags): HumanFlags {
    switch (displayName) {
        case 'AnswerNotAnAnswer': return 'as NAA';
        case 'PostOffensive': return 'as R/A';
        case 'PostSpam': return 'as spam';
        case 'PostOther': return 'for moderator attention';
        case 'PostLowQuality': return 'as VLQ';
        case 'NoFlag':
        default: return '';
    }
}
