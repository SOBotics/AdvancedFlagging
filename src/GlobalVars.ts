/* eslint-disable @typescript-eslint/no-explicit-any */
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import { UserDetails, Flags, FlagCategory } from './FlagTypes';
import { displayToaster } from './AdvancedFlagging';

declare const StackExchange: StackExchange;
declare const Svg: Svg;
declare const Stacks: Stacks;

type StacksToastState = 'success' | 'danger' | 'info';
export interface CachedFlag {
    Id: number;
    DisplayName: string;
    FlagText: string;
    Comments: {
        Low: string;
        High: string;
    };
    ReportType: Flags;
    BelongsTo: string; // category Name where it belongs
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
    AddAuthorName: boolean
    EnabledFlags: number[];
}

// StackExchange objects
export interface Svg {
    Checkmark(): JQuery;
    Clear(): JQuery;
    ClearSm(): JQuery;
    EyeOff(): JQuery;
    Flag(): JQuery;
    Pencil(): JQuery;
    Trash(): JQuery;
}

export interface Stacks {
    setTooltipText(element: Element | null, title: string, options: { placement: string }): Promise<void>;
    setTooltipHtml(element: Element | null, title: string, options: { placement: string }): Promise<void>;
    showModal(popup: Element | null): void;
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
export const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
export const metasmokeApiFilter = 'GGJFNNKKJFHFKJFLJLGIJMFIHNNJNINJ';
export const copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
export const copyPastorServer = 'https://copypastor.sobotics.org';
export const genericBotKey = 'Cm45BSrt51FR3ju';
export const placeholderTarget = /\$TARGET\$/g;
export const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
export const nattyAllReportsUrl = 'https://logs.sobotics.org/napi/api/stored/all';
export const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
export const dayMillis = 1000 * 60 * 60 * 24;
export const popupDelay = 4 * 1000;
export const transitionDelay = 0.25 * 1000;
export const settingUpTitle = 'Setting up MetaSmoke';
export const settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
                           + 'To reset configuration, see the footer of Stack Overflow.';
export const genericBotFailure = 'Server refused to track the post';
export const metasmokeReportedMessage = 'Post reported to Smokey';
export const metasmokeFailureMessage = 'Failed to report post to Smokey';
export const chatFailureMessage = 'Failed to send message to chat';
const nattyImage = 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1';
const guttenbergImage = 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1';
const smokeyImage = 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1';
export const isStackOverflow = /^https:\/\/stackoverflow.com/.test(window.location.href);
export const isNatoPage = /\/tools\/new-answers-old-questions/.test(window.location.href);
export const isQuestionPage = /\/questions\/\d+.*/.test(window.location.href);
export const isFlagsPage = /\/users\/flag-summary\//.test(window.location.href);
export const isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(window.location.href);
export const plainDiv = $('<div>');
export const gridCellDiv = $('<div>').addClass('grid--cell');

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
export const ConfigurationEnabledFlags = 'EnabledFlags';
export const ConfigurationLinkDisabled = 'LinkDisabled';
export const ConfigurationAddAuthorName = 'AddAuthorName';
export const CacheChatApiFkey = 'fkey';
export const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
export const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
export const FlagTypesKey = 'FlagTypes';
export const FlagCategoriesKey = 'FlagCategories';

export const displayStacksToast = (message: string, type: StacksToastState): void => StackExchange.helpers.showToast(message, {
    type: type,
    transientTimeout: popupDelay
});
export const attachPopover = async (element: Element, text: string, position: string): Promise<void> => {
    await Stacks.setTooltipText(element, text, {
        placement: position
    });
};
export const attachHtmlPopover = async (element: Element, text: string, position: string): Promise<void> => {
    await Stacks.setTooltipHtml(element, text, {
        placement: position
    });
};

// regexes
export const isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
export const isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
export const flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
export const getFlagsUrlRegex = (postId: number): RegExp => new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther|PostLowQuality)`);

// helper functions
export const showElement = (element: JQuery): JQuery => element.addClass('d-block').removeClass('d-none');
export const hideElement = (element: JQuery): JQuery => element.addClass('d-none').removeClass('d-block');
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

export function parseDate(dateStr?: string): Date | null {
    // Fix for safari
    return dateStr ? new Date(dateStr.replace(' ', 'T')) : null;
}

export function getSentMessage(success: boolean, feedback: string, bot: string): string {
    return success ? `Feedback ${feedback} sent to ${bot}` : `Failed to send feedback ${feedback} to ${bot}`;
}

// jQuery icon elements
const sampleIcon = gridCellDiv.clone().addClass(`d-none ${isFlagsPage ? ' ml8' : ''}`)
    .append($('<a>').addClass('s-avatar s-avatar__16 s-user-card--avatar').append($('<img>').addClass('s-avatar--image')));
export const nattyIcon = sampleIcon.clone().find('img').attr('src', nattyImage).parent().parent();
export const guttenbergIcon = sampleIcon.clone().find('img').attr('src', guttenbergImage).parent().parent();
export const smokeyIcon = sampleIcon.clone().find('img').attr('src', smokeyImage).parent().parent();

// dynamically generated jQuery elements based on the parameters passed
export const getMessageDiv = (message: string, state: string): JQuery => $('<div>').addClass('p12 bg-' + state).text(message);
export const getSectionWrapper = (name: string): JQuery => $('<fieldset>').html(`<h2 class="grid--cell">${name}</h2>`)
    .addClass(`grid gs8 gsy fd-column af-section-${name.toLowerCase()}`);
export const getOptionBox = (name: string): JQuery => $('<input>').attr('type', 'checkbox').attr('name', name).attr('id', name).addClass('s-checkbox');
export const getCategoryDiv = (red: boolean): JQuery => $('<div>').addClass(`advanced-flagging-category bar-md${red ? ' bg-red-200' : ''}`);
export const getOptionLabel = (text: string, name: string): JQuery => $('<label>').text(text).attr('for', name)
    .addClass('s-label ml4 va-middle fs-body1 fw-normal');
export const getConfigHtml = (optionId: string, text: string): JQuery => $(`
<div>
  <div class="grid gs4">
    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="grid--cell s-label fw-normal pt2" for="${optionId}">${text}</label>
  </div>
</div>`);
type ContentType = 'flag' | 'lowrep' | 'highrep'
export const getTextarea = (textareaContent: string, labelText: string, contentType: ContentType, labelDisplay?: string): JQuery => $(`
<div class="grid gs4 gsy fd-column">
    <label class="grid--cell s-label ${labelDisplay || 'd-block'}">${labelText}</label>
    <div class="grid ps-relative">
        <textarea rows=4 class="grid--cell s-textarea fs-body2 af-${contentType}-content">${textareaContent}</textarea>
    </div> 
</div>`);

const iconWrapper = $('<div>').addClass('grid--cell d-none');
export const performedActionIcon = (): JQuery => iconWrapper.clone().append(Svg.Checkmark().addClass('fc-green-500'));
export const failedActionIcon = (): JQuery => iconWrapper.clone().append(Svg.Clear().addClass('fc-red-500'));
export const reportedIcon = (): JQuery => iconWrapper.clone().append(Svg.Flag().addClass('fc-red-500'));
export const divider = $('<hr>').addClass('my8');
export const popupWrapper = $('<div>').addClass('af-snackbar fc-white fs-body3 ps-fixed ta-center l50 mln128 t t-opacity t-slow o0');
export const dropDown = $('<div>').addClass('advanced-flagging-dialog s-popover s-anchors s-anchors__default p6 mt2 c-default d-none');
export const popoverArrow = $('<div>').addClass('s-popover--arrow s-popover--arrow__tc');
export const reportLink = $('<a>').addClass('d-inline-block my4');
export const dropdownItem = $('<div>').addClass('advanced-flagging-dropdown-item px4');
export const advancedFlaggingLink = $('<button>').attr('type', 'button').addClass('s-btn s-btn__link').text('Advanced Flagging');
export const configurationDiv = $('<div>').addClass('advanced-flagging-configuration-div ta-left pt6');
export const configurationLink = $('<a>').attr('id', 'af-modal-button').text('AdvancedFlagging configuration');
export const commentsDiv = configurationDiv.clone().removeClass('advanced-flagging-configuration-div').addClass('af-comments-div');
export const commentsLink = configurationLink.clone().attr('id', 'af-comments-button').text('AdvancedFlagging: edit comments and flags');

export const overlayModal = $(`
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
const grid = $('<div>').addClass('grid lg:grid md:fd-column sm:fd-column');
export const inlineCheckboxesWrapper = gridCellDiv.clone().addClass('grid--cell lg:grid--cell md:m0 sm:m0').append(grid.clone());
const metasmokeTokenPopup = $(`
<aside class="s-modal" id="af-ms-token" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full sm:w100 md:w100" role="document">
    <h1 class="s-modal--header fw-bold " id="af-modal-title">Authenticate MS with AF</h1>
    <div class="s-modal--body fs-body2" id="af-modal-description">
      <div class="grid gs4 gsy fd-column">
        <div class="grid--cell">
          <label class="d-block s-label" for="example-item1">Metasmoke access token
            <p class="s-description mt2">Once you've authenticated Advanced Flagging with metasmoke, you'll be given a code; enter it below:</p>
          </label>
        </div>
      <div class="grid ps-relative"><input class="s-input" type="text" id="advanced-flagging-ms-token" placeholder="Enter the code here"></div>
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
        <h1 class="s-modal--header fw-body c-movey" id="af-comments-title">AdvancedFlagging: edit comments and flags</h1>
        <div class="s-modal--body fs-body2" id="af-comments-description">
            <div class="grid grid__fl1 fd-column gs16"></div>
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

export function getAllPostIds(includeQuestion: boolean, urlForm: boolean): (number | string)[] {
    return $(isQuestionPage ? '.question, .answer' : '.flagged-post').get().map(item => {
        const el = $(item);
        const postType = (isQuestionPage ? el.attr('data-questionid') : el.find('.question-hyperlink').length) ? 'Question' : 'Answer';
        if (!includeQuestion && postType === 'Question') return 0;
        const elementHref = el.find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
        let postId: number;
        if (elementHref) { // We're on flags page. We have to fetch the post id from the post URL
            postId = Number(postType === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
        } else { // instead, on the question page, the element has a data-questionid or data-answerid attribute with the post id
            postId = Number(el.attr('data-questionid') || el.attr('data-answerid'));
        }
        return urlForm ? `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}` : postId;
    }).filter(String); // remove null/empty values
}

// cache-related helpers
export const cachedConfigurationInfo = GreaseMonkeyCache.GetFromCache<CachedConfiguration>(ConfigurationCacheKey) || {} as CachedConfiguration;
export const updateConfiguration = (): void => GreaseMonkeyCache.StoreInCache(ConfigurationCacheKey, cachedConfigurationInfo);
export const cachedFlagTypes = GreaseMonkeyCache.GetFromCache<CachedFlag[]>(FlagTypesKey) || [];
export const updateFlagTypes = (): void => GreaseMonkeyCache.StoreInCache(FlagTypesKey, cachedFlagTypes);
export const cachedCategories = GreaseMonkeyCache.GetFromCache<CachedCategory[]>(FlagCategoriesKey) || [];
export const updateCategories = (): void => GreaseMonkeyCache.StoreInCache(FlagCategoriesKey, cachedCategories);

// For GetComment() on FlagTypes. Adds the author name before the comment if the option is enabled
export function getFullComment(flagId: number, { AuthorName }: UserDetails, level?: 'Low' | 'High'): string {
    const shouldAddAuthorName = cachedConfigurationInfo?.AddAuthorName;
    const flagType = getFlagTypeFromFlagId(flagId);
    const comment = flagType?.Comments[level || 'Low'];
    return (comment && shouldAddAuthorName ? `${AuthorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment) || '';
}

// For GetCustomFlagText() on FlagTypes. Replaces the placeholders with actual values
export function getFullFlag(flagId: number, target: string, postId: number): string {
    const flagType = getFlagTypeFromFlagId(flagId);
    const flagContent = flagType?.FlagText;
    if (!flagContent) return '';
    return flagContent.replace(placeholderTarget, target).replace(placeholderCopypastorLink, getCopypastorLink(postId));
}

export function getFlagTypeFromFlagId(flagId: number): CachedFlag | null {
    return cachedFlagTypes?.find(flagType => flagType.Id === flagId) || null;
}

export function getReportType(flagId: number): Flags {
    return cachedFlagTypes?.find(flagType => flagType.Id === flagId)?.ReportType as Flags || '';
}

export function getFlagText(flagId: number): string {
    return cachedFlagTypes?.find(flagType => flagType.Id === flagId)?.FlagText || '';
}

export function getComments(flagId: number): CachedFlag['Comments'] {
    return cachedFlagTypes?.find(flagType => flagType.Id === flagId)?.Comments as CachedFlag['Comments'] || '';
}

export async function waitForSvg(): Promise<void> {
    while (typeof Svg === 'undefined') {
        // eslint-disable-next-line no-await-in-loop
        await Delay(1000);
    }
}
