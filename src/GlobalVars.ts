import { displayToaster } from './AdvancedFlagging';
import { MetaSmokeAPI } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';

declare const Svg: any;
declare const StackExchange: any;

export const soboticsRoomId = 111347;
export const metaSmokeKey = '0a946b9419b5842f99b052d19c956302aa6c6dd5a420b043b20072ad2efc29e0';
export const copyPastorKey = 'wgixsmuiz8q8px9kyxgwf8l71h7a41uugfh5rkyj';
export const copyPastorServer = 'https://copypastor.sobotics.org';
export const genericBotKey = 'Cm45BSrt51FR3ju';
export const nattyFeedbackUrl = 'https://logs.sobotics.org/napi/api/feedback';
export const username = $('.top-bar .my-profile .gravatar-wrapper-24').attr('title');

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
// export const ConfigurationDetectAudits = 'AdvancedFlagging.Configuration.DetectAudits';
// export const MetaSmokeWasReportedConfig = 'MetaSmoke.WasReported';

export const settingUpTitle = 'Setting up MetaSmoke';
export const settingUpBody = 'If you do not wish to connect, press cancel and this popup won\'t show up again. '
                           + 'To reset configuration, see the footer of Stack Overflow.';

export const displayStacksToast = (message: string, type: string) => StackExchange.helpers.showToast(message, { type: type });

export const popupDelay = 4000;
export const isReviewItemRegex = /(\/review\/next-task)|(\/review\/task-reviewed\/)/;
export const isDeleteVoteRegex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;
export const flagsUrlRegex = /flags\/posts\/\d+\/add\/[a-zA-Z]+/;
export const getFlagsUrlRegex = (postId: number) => new RegExp(`/flags/posts/${postId}/add/(AnswerNotAnAnswer|PostOffensive|PostSpam|NoFlag|PostOther)`);

export const showElement = (element: JQuery) => element.addClass('d-block').removeClass('d-none');
export const hideElement = (element: JQuery) => element.addClass('d-none').removeClass('d-block');
export const showInlineElement = (element: JQuery) => element.addClass('d-inline-block').removeClass('d-none');
export const displaySuccess = (message: string) => displayToaster(message, 'success');
export const displayError = (message: string) => displayToaster(message, 'danger');
export const isStackOverflow = () => !!window.location.href.match(/^https:\/\/stackoverflow.com/);
export const isNatoPage = () => !!window.location.href.match(/\/tools\/new-answers-old-questions/);
export const isModPage = () => !!window.location.href.match(/\/admin/);
export const isQuestionPage = () => !!window.location.href.match(/\/questions\/\d+.*/);
export const isFlagsPage = () => !!window.location.href.match(/\/users\/flag-summary\//);
export const isUserPage = () => !!window.location.href.match(/\/users\/\d+.*/);

export const getPerformedActionIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.CheckmarkSm().addClass('fc-green-500'));
export const getReportedIcon = () => $('<div>').attr('class', 'p2 d-none').append(Svg.Flag().addClass('fc-red-500'));

const sampleIconClass = $('<div>').attr('class', 'advanced-flagging-icon bg-cover c-pointer w16 h16 d-none va-middle');
sampleIconClass.addClass(window.location.href.match(/\/users\/flag-summary/) ? 'mx4' : 'm4');
export const getNattyIcon = () => sampleIconClass.clone().attr('title', 'Reported by Natty').addClass('advanced-flagging-natty-icon');
export const getGuttenbergIcon = () => sampleIconClass.clone().attr('title', 'Reported by Guttenberg').addClass('advanced-flagging-gut-icon');
export const getSmokeyIcon = () => sampleIconClass.clone().attr('title', 'Reported by Smokey').addClass('advanced-flagging-smokey-icon');

export const getMessageDiv = (message: string, state: string) => $('<div>').attr('class', 'p12 bg-' + state).text(message);
export const getSectionWrapper = (name: string) => $('<fieldset>').attr('class', `grid gs8 gsy fd-column af-section-${name.toLowerCase()}`)
    .html(`<h2 class="grid--cell">${name}</h2>`);
export const getDivider = () => $('<hr>').attr('class', 'my8');
export const getOptionBox = (name: string) => $('<input>').attr('type', 'checkbox').attr('name', name).attr('id', name).attr('class', 's-checkbox');
export const getCategoryDiv = (red: boolean) => $('<div>').attr('class', `advanced-flagging-category bar-md${red ? ' bg-red-200' : ''}`);
export const getOptionLabel = (text: string, name: string) =>
    $('<label>').text(text).attr('for', name).attr('class', 's-label ml4 va-middle fs-body1 fw-normal');
export const getConfigHtml = (optionId: string, text: string) => $(`
<div>
  <div class="grid gs8">
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
export const overlayModal = $(`
<aside class="s-modal" id="af-config" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog s-modal__full w60" role="document">
    <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>
    <div class="s-modal--body fs-body2" id="af-modal-description"></div>
    <div class="grid gs8 gsx s-modal--footer">
      <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>
      <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>
    </div>
    <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide"></button>
  </div>
</aside>`);
const grid = $('<div>').attr('class', 'grid');
export const inlineCheckboxesWrapper = gridCellDiv.clone().append(grid.clone());
const metasmokeTokenPopup = $(`
<aside class="s-modal" id="af-ms-token" role="dialog" aria-hidden="true" data-controller="s-modal" data-target="s-modal.modal">
  <div class="s-modal--dialog" role="document">
    <h1 class="s-modal--header fw-bold c-movey" id="af-modal-title">Authenticate MS with AF</h1>
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

export function showMSTokenPopupAndGet() {
    return new Promise<string | undefined>(resolve => {
        StackExchange.helpers.showModal(metasmokeTokenPopup);
        $('#advanced-flagging-save-ms-token').on('click', () => {
            const token = $('#advanced-flagging-ms-token').val();
            $('#af-ms-token').remove(); // dismiss modal
            resolve(token);
        });
    });
}

export async function Delay(milliseconds: number) {
    return await new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export async function showConfirmModal(title: string, bodyHtml: string) {
    return await StackExchange.helpers.showConfirmModal({
        title: title,
        bodyHtml: bodyHtml,
        buttonLabel: 'Authenticate!'
    });
}

// Credits: https://github.com/SOBotics/Userscripts/blob/master/Natty/NattyReporter.user.js#L101
let initialized = false;
const callbacks: ((request: XMLHttpRequest) => void)[] = [];
export function addXHRListener(callback: (request: XMLHttpRequest) => void) {
    callbacks.push(callback);
    if (initialized) return;
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function () {
        this.addEventListener('load', () => {
            callbacks.forEach(cb => cb(this));
        }, false);
        open.apply(this, arguments);
    };
    initialized = true;
}

export function getPostUrlsFromQuestionPage() {
    return $('.question, .answer').map((_index, el) => {
        const postType = $(el).attr('data-questionid') ? 'Question' : 'Answer';
        const urlToReturn = MetaSmokeAPI.GetQueryUrl(Number($(el).attr('data-questionid') || $(el).attr('data-answerid')), postType);
        return urlToReturn;
    });
}

export function getPostUrlsFromFlagsPage() {
    return $('.flagged-post').map((_index, el) => {
        const postType = $(el).find('.answer-hyperlink').length ? 'Answer' : 'Question';
        const urlToReturn = MetaSmokeAPI.GetQueryUrl(Number(
            postType === 'Answer'
                ? $(el).find('.answer-hyperlink').attr('href').split('#')[1]
                : $(el).find('.question-hyperlink').attr('href').split('/')[2]
        ), postType);
        return urlToReturn;
    });
}