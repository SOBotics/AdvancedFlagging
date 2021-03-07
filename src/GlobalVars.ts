/* eslint-disable @typescript-eslint/no-explicit-any */
import { displayToaster } from './AdvancedFlagging';
import { MetaSmokeAPI } from '@userscriptTools/MetaSmokeAPI';
import { GreaseMonkeyCache } from '@userscriptTools/GreaseMonkeyCache';

declare const StackExchange: StackExchange;
declare const Svg: Svg;

export interface Svg {
    CheckmarkSm(): JQuery;
    ClearSm(): JQuery;
    Flag(): JQuery;
}

export interface Stacks {
    showModal(modal: HTMLElement | null): void;
}

export interface StackExchange {
    helpers: StackExchangeHelpers;
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

export interface StackExchangeHelpers {
    showModal(popup: JQuery): void;
    showConfirmModal(modal: ModalType): Promise<boolean>;
    showToast(message: string, info: { type: string }): void;
}

interface ModalType {
    title: string;
    bodyHtml: string;
    buttonLabel: string;
}

interface AllFlags {
    flagName: string;
    content: string | null;
}

interface AllComments {
    commentName: string;
    content: string | null;
}

export const soboticsRoomId = 111347;
export const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
export const copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
export const copyPastorServer = 'https://copypastor.sobotics.org';
export const genericBotKey = 'Cm45BSrt51FR3ju';
export const placeholderTarget = /\$TARGET\$/g;
export const placeholderCopypastorLink = /\$COPYPASTOR\$/g;
export const nattyAllReportsUrl = 'https://logs.sobotics.org/napi/api/stored/all';
export const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');
export const dayMillis = 1000 * 60 * 60 * 24;
const nattyImage = 'https://i.stack.imgur.com/aMUMt.jpg?s=32&g=1';
const guttenbergImage = 'https://i.stack.imgur.com/tzKAI.png?s=32&g=1';
const smokeyImage = 'https://i.stack.imgur.com/7cmCt.png?s=32&g=1';

export const ConfigurationOpenOnHover = 'AdvancedFlagging.Configuration.OpenOnHover';
export const ConfigurationDefaultNoFlag = 'AdvancedFlagging.Configuration.DefaultNoFlag';
export const ConfigurationDefaultNoComment = 'AdvancedFlagging.Configuration.DefaultNoComment';
export const ConfigurationWatchFlags = 'AdvancedFlagging.Configuration.WatchFlags';
export const ConfigurationWatchQueues = 'AdvancedFlagging.Configuration.WatchQueues';
export const ConfigurationEnabledFlags = 'AdvancedFlagging.Configuration.EnabledFlags';
export const ConfigurationLinkDisabled = 'AdvancedFlagging.Configuration.LinkDisabled';
export const CacheChatApiFkey = 'StackExchange.ChatApi.FKey';
export const MetaSmokeUserKeyConfig = 'MetaSmoke.UserKey';
export const MetaSmokeDisabledConfig = 'MetaSmoke.Disabled';
export const CommentsAddAuthorName = 'AdvancedFlagging.Comments.AddAuthorName';

// Text for mod flags
export const flags = {
    Plagiarism: 'Possible plagiarism of another answer $TARGET$, as can be seen here $COPYPASTOR$',
    DuplicateAnswer: 'The answer is a repost of their other answer $TARGET$, but as there are slight differences '
                   + '(see $COPYPASTOR$), an auto flag would not be raised.',
    BadAttribution: 'This post is copied from [another answer]($TARGET$), as can be seen here $COPYPASTOR$. The author only added a link'
                  + ' to the other answer, which is [not the proper way of attribution](//stackoverflow.blog/2009/06/25/attribution-required).'
};

// Auto comments
export const comments = {
    DuplicateAnswer: "Please don't add the [same answer to multiple questions](//meta.stackexchange.com/q/104227). Answer the best one "
                   + 'and flag the rest as duplicates, once you earn enough reputation. If it is not a duplicate, [edit] the answer '
                   + 'and tailor the post to the question.',
    LinkOnly: 'A link to a solution is welcome, but please ensure your answer is useful without it: '
            + '[add context around the link](//meta.stackexchange.com/a/8259) so your fellow users will '
            + 'have some idea what it is and why it is there, then quote the most relevant part of the page you are linking to '
            + 'in case the target page is unavailable. [Answers that are little more than a link may be deleted.](/help/deleted-answers)',
    NAALowRep: 'This does not provide an answer to the question. You can [search for similar questions](/search), '
             + 'or refer to the related and linked questions on the right-hand side of the page to find an answer. '
             + 'If you have a related but different question, [ask a new question](/questions/ask), '
             + 'and include a link to this one to help provide context. See: [Ask questions, get answers, no distractions](/tour)',
    NAAHighRep: 'This post doesn\'t look like an attempt to answer this question. Every post here is expected to be '
              + 'an explicit attempt to *answer* this question; if you have a critique or need a clarification of '
              + 'the question or another answer, you can [post a comment](/help/privileges/comment) '
              + '(like this one) directly below it. Please remove this answer and create either a comment or a new question. '
              + 'See: [Ask questions, get answers, no distractions](/tour).',
    ThanksLowRep: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
                + 'and can be perceived as noise by its future visitors. Once you [earn](//meta.stackoverflow.com/q/146472) '
                + 'enough [reputation](/help/whats-reputation), you will gain privileges to '
                + '[upvote answers](/help/privileges/vote-up) you like. This way future visitors of the question '
                + 'will see a higher vote count on that answer, and the answerer will also be rewarded with reputation points. '
                + 'See [Why is voting important](/help/why-vote).',
    ThanksHighRep: 'Please don\'t add _thanks_ as answers. They don\'t actually provide an answer to the question, '
                 + 'and can be perceived as noise by its future visitors. Instead, [upvote answers](/help/privileges/vote-up) '
                 + 'you like. This way future visitors of the question will see a higher vote count on that answer, '
                 + 'and the answerer will also be rewarded with reputation points. See [Why is voting important](/help/why-vote).',
    MeToo: 'Please don\'t add *Me too* as answers. It doesn\'t actually provide an answer to the question. '
         + 'If you have a different but related question, then [ask](/questions/ask) it '
         + '(reference this one if it will help provide context). If you are interested in this specific question, '
         + 'you can [upvote](/help/privileges/vote-up) it, leave a [comment](/help/privileges/comment), '
         + 'or start a [bounty](/help/privileges/set-bounties) once you have enough [reputation](/help/whats-reputation).',
    Library: 'Please don\'t just post some tool or library as an answer. At least demonstrate '
           + '[how it solves the problem](//meta.stackoverflow.com/a/251605) in the answer itself.',
    CommentLowRep: 'This does not provide an answer to the question. Once you have sufficient [reputation](/help/whats-reputation) '
                  + 'you will be able to [comment on any post](/help/privileges/comment); instead, '
                  + '[provide answers that don\'t require clarification from the asker](//meta.stackexchange.com/q/214173).',
    CommentHighRep: 'This does not provide an answer to the question. Please write a comment instead.',
    Duplicate: 'Instead of posting an answer which merely links to another answer, please instead '
             + '[flag the question](/help/privileges/flag-posts) as a duplicate.',
    NonEnglish: 'Please write your answer in English, as Stack Overflow is an [English-only site](//meta.stackoverflow.com/a/297680).',
    ShouldBeAnEdit: 'Please use the edit link on your question to add additional information. '
                  + 'The "Post Answer" button should be used only for complete answers to the question.'
};
export const getCommentKey = (name: string): string => 'AdvancedFlagging.Configuration.Comments.' + name;
export const getFlagKey = (name: string): string => 'AdvancedFlagging.Configuration.Flags.' + name;
export const getCommentFromCache = (name: string): string | null => GreaseMonkeyCache.GetFromCache(getCommentKey(name));
export const getFlagFromCache = (name: string): string | null => GreaseMonkeyCache.GetFromCache(getFlagKey(name));
export const storeCommentInCache = (array: string[]): void => GreaseMonkeyCache.StoreInCache(getCommentKey(array[0]), array[1]);
export const storeFlagsInCache = (array: string[]): void => GreaseMonkeyCache.StoreInCache(getFlagKey(array[0]), array[1]);

export const getAllFlags = (): AllFlags[] => Object.keys(flags).map(item => ({ flagName: item, content: getFlagFromCache(item) }));
export const getAllComments = (): AllComments[] => Object.keys(comments).map(item => ({ commentName: item, content: getCommentFromCache(item) }));

export const settingUpTitle = 'Setting up MetaSmoke';
export const settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
                           + 'To reset configuration, see the footer of Stack Overflow.';

export const displayStacksToast = (message: string, type: string): void => StackExchange.helpers.showToast(message, { type: type });

export const popupDelay = 4000;
export const isReviewItemRegex = /\/review\/(next-task|task-reviewed\/)/;
export const isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
export const flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
export const getFlagsUrlRegex = (postId: number): RegExp => new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther|PostLowQuality)`);

export const showElement = (element: JQuery): JQuery => element.addClass('d-block').removeClass('d-none');
export const hideElement = (element: JQuery): JQuery => element.addClass('d-none').removeClass('d-block');
export const showInlineElement = (element: JQuery): JQuery => element.addClass('d-inline-block').removeClass('d-none');
export const displaySuccess = (message: string): void => displayToaster(message, 'success');
export const displayError = (message: string): void => displayToaster(message, 'danger');
export const isStackOverflow = (): boolean => Boolean(/^https:\/\/stackoverflow.com/.exec(window.location.href));
export const isNatoPage = (): boolean => Boolean(/\/tools\/new-answers-old-questions/.exec(window.location.href));
export const isModPage = (): boolean => Boolean(/\/admin/.exec(window.location.href));
export const isQuestionPage = (): boolean => Boolean(/\/questions\/\d+.*/.exec(window.location.href));
export const isFlagsPage = (): boolean => Boolean(/\/users\/flag-summary\//.exec(window.location.href));
export const isUserPage = (): boolean => Boolean(/\/users\/\d+.*/.exec(window.location.href));
const getCopypastorLink = (postId: number): string => `https://copypastor.sobotics.org/posts/${postId}`;

export const getPerformedActionIcon = (): JQuery => $('<div>').attr('class', 'p2 d-none').append(Svg.CheckmarkSm().addClass('fc-green-500'));
export const getReportedIcon = (): JQuery => $('<div>').attr('class', 'p2 d-none').append(Svg.Flag().addClass('fc-red-500'));

const sampleIcon = $('<a>').attr('class', 's-avatar s-avatar__16 s-user-card--avatar d-none')
    .addClass(/\/users\/flag-summary/.exec(window.location.href) ? 'mx4' : 'm4')
    .append($('<img>').addClass('s-avatar--image'));
export const getNattyIcon = (): JQuery => sampleIcon.clone().attr('title', 'Reported by Natty').find('img').attr('src', nattyImage).parent();
export const getGuttenbergIcon = (): JQuery => sampleIcon.clone().attr('title', 'Reported by Guttenberg').find('img').attr('src', guttenbergImage).parent();
export const getSmokeyIcon = (): JQuery => sampleIcon.clone().attr('title', 'Reported by Smokey').find('img').attr('src', smokeyImage).parent();

export const getMessageDiv = (message: string, state: string): JQuery => $('<div>').attr('class', 'p12 bg-' + state).text(message);
export const getSectionWrapper = (name: string): JQuery => $('<fieldset>').attr('class', `grid gs8 gsy fd-column af-section-${name.toLowerCase()}`)
    .html(`<h2 class="grid--cell">${name}</h2>`);
export const getDivider = (): JQuery => $('<hr>').attr('class', 'my8');
export const getOptionBox = (name: string): JQuery => $('<input>').attr('type', 'checkbox').attr('name', name).attr('id', name).attr('class', 's-checkbox');
export const getCategoryDiv = (red: boolean): JQuery => $('<div>').attr('class', `advanced-flagging-category bar-md${red ? ' bg-red-200' : ''}`);
export const getOptionLabel = (text: string, name: string): JQuery =>
    $('<label>').text(text).attr('for', name).attr('class', 's-label ml4 va-middle fs-body1 fw-normal');
export const getConfigHtml = (optionId: string, text: string): JQuery => $(`
<div>
  <div class="grid gs4">
    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="grid--cell s-label fw-normal" for="${optionId}">${text}</label>
  </div>
</div>`);

export const popupWrapper = $('<div>').attr('id', 'snackbar')
    .attr('class', 'hide fc-white p16 fs-body3 ps-fixed ta-center z-popover l50 t32 wmn2');
export const dropDown = $('<div>').attr('class', 'advanced-flagging-dialog s-popover s-anchors s-anchors__default p6 mt2 c-default d-none');
export const popoverArrow = $('<div>').attr('class', 's-popover--arrow s-popover--arrow__tc');
export const reportLink = $('<a>').attr('class', 'd-inline-block my4');
export const dropdownItem = $('<div>').attr('class', 'advanced-flagging-dropdown-item px4');
export const plainDiv = $('<div>');
export const gridCellDiv = $('<div>').attr('class', 'grid--cell');
export const advancedFlaggingLink = $('<button>').attr('type', 'button').attr('class', 's-btn s-btn__link').text('Advanced Flagging');
export const configurationDiv = $('<div>').attr('class', 'advanced-flagging-configuration-div ta-left pt6');
export const configurationLink = $('<a>').attr('id', 'af-modal-button').text('AdvancedFlagging configuration');
export const commentsDiv = configurationDiv.clone().removeClass('advanced-flagging-configuration-div').addClass('af-comments-div');
export const commentsLink = configurationLink.clone().attr('id', 'af-comments-button').text('AdvancedFlagging: edit comments and flags');
export const editContentWrapper = $('<div>').attr('class', 'grid grid__fl1 md:fd-column gs16');
const commentsHeader = $('<h2>').attr('class', 'ta-center mb8').text('Comments');
const flagsHeader = $('<h2>').attr('class', 'ta-center mb8').text('Flags');
export const commentsWrapper = $('<div>').attr('class', 'af-comments-content grid--cell').append(commentsHeader);
export const flagsWrapper = $('<div>').attr('class', 'af-flags-content grid--cell').append(flagsHeader);
export const overlayModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full w60 sm:w100" role="document">
    <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>
    <div class="s-modal--body fs-body2" id="af-modal-description"></div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>
      <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
  </div>
</aside>`);
const grid = $('<div>').attr('class', 'grid lg:grid md:fd-column sm:fd-column');
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
  <div class="s-modal--dialog s-modal__full lg:w75 md:w75 sm:w100 w75" role="document">
    <h1 class="s-modal--header fw-body c-movey" id="af-comments-title">AdvancedFlagging: edit comments and flags</h1>
    <div class="s-modal--body fs-body2" id="af-comments-description"></div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" type="button" data-action="s-modal#hide">I'm done!</button>
      <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
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

export function getPostUrlsFromQuestionPage(): string[] {
    return $('.question, .answer').get().map(el => {
        const postType = $(el).attr('data-questionid') ? 'Question' : 'Answer';
        const urlToReturn = MetaSmokeAPI.GetQueryUrl(Number($(el).attr('data-questionid') || $(el).attr('data-answerid')), postType);
        return urlToReturn;
    });
}

export function getPostUrlsFromFlagsPage(): (string | undefined)[] {
    return $('.flagged-post').get().map(el => {
        const postType = $(el).find('.answer-hyperlink').length ? 'Answer' : 'Question';
        const elementHref = $(el).find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
        if (!elementHref) return;

        const urlToReturn = MetaSmokeAPI.GetQueryUrl(Number(
            postType === 'Answer'
                ? elementHref.split('#')[1]
                : elementHref.split('/')[2]
        ), postType);
        return urlToReturn;
    });
}

// For GetComment() on FlagTypes. Adds the author name before the comment if the option is enabled
export function getFullComment(name: string, authorName: string): string | null {
    const shouldAddAuthorName = GreaseMonkeyCache.GetFromCache(CommentsAddAuthorName);
    const comment = getCommentFromCache(name);
    return comment && shouldAddAuthorName ? `${authorName}, ${comment[0].toLowerCase()}${comment.slice(1)}` : comment;
}

// For GetCustomFlagText() on FlagTypes. Replaces the placeholders with actual values
export function getFullFlag(name: string, target: string, postId: number): string | undefined {
    const flagContent = getFlagFromCache(name);
    if (!flagContent) return;
    return flagContent.replace(placeholderTarget, target).replace(placeholderCopypastorLink, getCopypastorLink(postId));
}

export function qualifiesForVlq(postScore: number, creationDate: Date): boolean {
    return postScore <= 0 && (new Date().valueOf() - creationDate.valueOf()) < dayMillis;
}
