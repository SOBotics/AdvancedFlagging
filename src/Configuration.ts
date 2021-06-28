import { MetaSmokeAPI} from './UserscriptTools/MetaSmokeAPI';
import { flagCategories, Flags } from './FlagTypes';
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import * as globals from './GlobalVars';

declare const StackExchange: globals.StackExchange;
declare const Stacks: globals.Stacks;
type GeneralItems = Exclude<keyof globals.CachedConfiguration, 'EnabledFlags'>;

const flagTypes = flagCategories.flatMap(category => category.FlagTypes);
const flagNames = [...new Set(flagTypes.map(flagType => flagType.DefaultReportType))];
// we'll be using a value here because the option text is not of type Flags and therefore can't be stored to cache
const getOption = (flagName: Flags, currentName: Flags): string =>
    `<option${flagName === currentName ? ' selected' : ''} value=${flagName}>
      ${globals.getHumanFromDisplayName(flagName) || '(none)'}
    </option>`;
const getFlagOptions = (currentName: Flags): string => flagNames.map(flagName => getOption(flagName, currentName)).join('');
const isModOrNoFlag = (flagName: Flags): boolean => ['PostOther', 'NoFlag'].some(reportType => reportType === flagName);

function cacheFlags(): void {
    const flagTypesToCache = flagCategories.flatMap(category => {
        return category.FlagTypes.map(flagType => {
            return {
                Id: flagType.Id,
                DisplayName: flagType.DisplayName,
                FlagText: flagType.DefaultFlagText || '',
                Comments: {
                    Low: flagType.DefaultComment || '',
                    High: flagType.DefaultCommentHigh || ''
                },
                ReportType: flagType.DefaultReportType,
                Feedbacks: flagType.DefaultFeedbacks,
                BelongsTo: category.Name,
                IsDefault: true,
                // whether to send feedback from Feedbacks if ReportType is raised
                SendWhenFlagRaised: flagType.DefaultSendWhenFlagRaised,
                Downvote: !isModOrNoFlag(flagType.DefaultReportType),
                Enabled: true // all flags should be enabled by default
            };
        });
    });
    GreaseMonkeyCache.storeInCache<globals.CachedFlag[]>(globals.FlagTypesKey, flagTypesToCache);
    globals.cachedFlagTypes.push(...flagTypesToCache); // also update the variable to prevent breaking config modal
}

function cacheCategories(): void {
    const categoriesInfoToCache = flagCategories.map(category => (
        {
            IsDangerous: category.IsDangerous,
            Name: category.Name,
            AppliesTo: category.AppliesTo
        } as globals.CachedCategory
    ));
    GreaseMonkeyCache.storeInCache<globals.CachedCategory[]>(globals.FlagCategoriesKey, categoriesInfoToCache);
    globals.cachedCategories.push(...categoriesInfoToCache);
}

export function setupConfiguration(): void {
    setupDefaults(); // stores default values if they haven't already been
    buildConfigurationOverlay(); // the configuration modal
    setupCommentsAndFlagsModal(); // the comments & flags modal

    const bottomBox = $('.site-footer--copyright').children('.-list');
    const configurationDiv = globals.configurationDiv.clone(), commentsDiv = globals.commentsDiv.clone();
    const configurationLink = globals.configurationLink.clone(), commentsLink = globals.commentsLink.clone();
    $(document).on('click', '#af-modal-button', () => Stacks.showModal(document.querySelector('#af-config')));
    $(document).on('click', '#af-comments-button', () => Stacks.showModal(document.querySelector('#af-comments')));

    commentsDiv.append(commentsLink).insertAfter(bottomBox);
    configurationDiv.append(configurationLink).insertAfter(bottomBox);
    if (!Object.prototype.hasOwnProperty.call(globals.cachedConfiguration, globals.ConfigurationAddAuthorName)) {
        globals.displayStacksToast('Please set up AdvancedFlagging before continuing.', 'info');
        StackExchange.helpers.showModal(document.querySelector('#af-config'));
    }
}

function setupDefaults(): void {
    if (!globals.cachedFlagTypes.length || !globals.cachedFlagTypes[0]?.Downvote) cacheFlags();
    if (!globals.cachedCategories.length) cacheCategories();
}

/* The configuration modal has two sections:
   - General (uses cache): general options. They are properties of the main Configuration object and accept Boolean values
     All options are disabled by default
   - Admin doesn't use cache, but it interacts with it (deletes values)
   Sample cache:

   Configuration: {
       OpenOnHover: true,
       AnotherOption: false,
       DoFooBar: true,
   }

   Notes:
   - In General, the checkboxes and the corresponding labels are wrapped in a div that has a data-option-id attribute.
     This is the property of the option that will be used in cache.
*/
function buildConfigurationOverlay(): void {
    const overlayModal = globals.configurationModal.clone();
    $('body').append(overlayModal);

    overlayModal.find('#af-config-description').append(getGeneralConfigItems(), $('<hr>').addClass('my16'), getAdminConfigItems());

    // event listener for "Save changes" button click
    overlayModal.find('.s-btn__primary').on('click', event => {
        event.preventDefault();
        // find the option id (it's the data-option-id attribute) and store whether the box is checked or not
        $('.af-section-general').find('input').each((_index, el) => {
            const optionId = $(el).parents().eq(2).attr('data-option-id') as GeneralItems;
            globals.cachedConfiguration[optionId] = Boolean($(el).prop('checked'));
        });

        globals.updateConfiguration();
        globals.displayStacksToast('Configuration saved', 'success');
        setTimeout(() => window.location.reload(), 500);
    });
    // reset configuration to defaults
    overlayModal.find('.af-configuration-reset').on('click', () => {
        GreaseMonkeyCache.unset(globals.ConfigurationCacheKey);
        globals.displayStacksToast('Configuration settings have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    });

    const resetConfigurationText = 'Reset configuration values to defaults. You will be asked to set them again.';
    globals.attachPopover($('.af-configuration-reset')[0], resetConfigurationText, 'right');
}

function getGeneralConfigItems(): JQuery {
    const sectionWrapper = globals.getSectionWrapper('General');

    [
        {
            text: 'Open dropdown on hover',
            configValue: globals.ConfigurationOpenOnHover,
            tooltipText: 'Open the dropdown on hover and not on click'
        }, {
            text: 'Watch for manual flags',
            configValue: globals.ConfigurationWatchFlags,
            tooltipText: 'Send feedback when you raise a flag manually'
        }, {
            text: 'Watch for queue responses',
            configValue: globals.ConfigurationWatchQueues,
            tooltipText: 'Send feedback after choosing Looks OK or Recommend Deletion in the Low Quality Posts queue'
        }, {
            text: 'Disable AdvancedFlagging link',
            configValue: globals.ConfigurationLinkDisabled
        }, {
            text: 'Uncheck \'Leave comment\' by default',
            configValue: globals.ConfigurationDefaultNoComment
        }, {
            text: 'Uncheck \'Flag\' by default',
            configValue: globals.ConfigurationDefaultNoFlag
        }, {
            text: 'Uncheck \'Downvote\' by default',
            configValue: globals.ConfigurationDefaultNoDownvote
        }, {
            text: 'Add author\'s name before comments',
            configValue: globals.ConfigurationAddAuthorName,
            tooltipText: 'Add the author\'s name before every comment to make them friendlier'
        }, {
            text: 'Don\'t send feedback to Smokey by default',
            configValue: globals.getCachedConfigBotKey('Smokey')
        }, {
            text: 'Don\'t send feedback to Natty by default',
            configValue: globals.getCachedConfigBotKey('Natty')
        }, {
            text: 'Don\'t send feedback to Guttenberg by default',
            configValue: globals.getCachedConfigBotKey('Guttenberg')
        }, {
            text: 'Don\'t send feedback to Generic Bot by default',
            configValue: globals.getCachedConfigBotKey('Generic Bot')
        }
    ].map(item => {
        const storedValue = globals.cachedConfiguration[item.configValue as GeneralItems];
        const configCheckbox = createCheckbox(item.text, Boolean(storedValue)).attr('data-option-id', item.configValue);
        if (item.tooltipText) globals.attachPopover(configCheckbox.find('label')[0], item.tooltipText, 'right');
        return configCheckbox;
    }).forEach(element => sectionWrapper.append(element));

    return sectionWrapper;
}

function getAdminConfigItems(): JQuery {
    const sectionWrapper = globals.getSectionWrapper('Admin');

    const [clearMetasmokeInfo, clearFkey] = [
        $('<a>').text('Clear metasmoke configuration').on('click', () => {
            MetaSmokeAPI.reset();
            globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
        }),
        $('<a>').text('Clear chat fkey').on('click', () => {
            GreaseMonkeyCache.unset(globals.CacheChatApiFkey);
            globals.displayStacksToast('Successfully cleared chat fkey.', 'success');
        })
    ].map(item => item.wrap(globals.flexItemDiv.clone()).parent());
    [clearMetasmokeInfo, clearFkey].forEach(element => sectionWrapper.append(element));
    const chatFkey = GreaseMonkeyCache.getFromCache<string>(globals.CacheChatApiFkey);
    const msAccessTokenText = MetaSmokeAPI.accessToken
        ? `token: ${MetaSmokeAPI.accessToken.substring(0, 32)}...` // truncate the string because it's too long
        : 'access token is not stored in cache';
    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = 'This will clear the chat fkey. It will be regenerated the next time feedback is sent to Natty '
                           + `(${chatFkey ? `fkey: ${chatFkey}` : 'fkey is not stored in cache'})`;
    globals.attachPopover(clearMetasmokeInfo.find('a')[0], metasmokeTooltip, 'right');
    globals.attachPopover(clearFkey.find('a')[0], fkeyClearTooltip, 'right');

    return sectionWrapper;
}

function createCheckbox(text: string, checkCheckbox: boolean | null): JQuery {
    const optionId = text.toLowerCase().replace(/\s/g, '_');
    const configHtml = $(`
<div>
  <div class="d-flex gs4">
    <div class="flex--item"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="flex--item s-label fw-normal pt2" for="${optionId}">${text}</label>
  </div>
</div>`);
    if (checkCheckbox) configHtml.find('input').prop('checked', true);

    return configHtml;
}

/* In this case, we are caching a FlagType, but removing unnecessary properties.
   Only the Id, FlagText, and Comments (both LowRep and HighRep) and the flag's name are cached if they exist.
   Sample cache (undefined values are empty strings):
       FlagTypes: [{
           Id: 1,
           DisplayName: 'Plagiarism',
           FlagText: 'This is some text',
           Comments: {
               Low: 'This is a LowRep comment',
               High: ''
           },
           ReportType: 'PostOther',
           Feedbacks: {
               Smokey: 'tp-',
               Natty: 'tp',
               Guttenberg: 'tp'
               'Generic Bot': 'track'
           },
           BelongsTo: 'Guttenberg mod-flags',
           IsDefault: true,
           SendWhenFlagRaised: false,
           Downvote: false,
           Enabled: false
       }, {
           Id: 2,
           DisplayName: 'Not an answer',
           FlagText: '',
           Comments: {
               Low: 'This is a LowRep comment',
               High: 'This is a HighRep comment'
           },
           ReportType: 'AnswerNotAnAnswer',
           Feedbacks: {
               Smokey: 'fp-',
               Natty: 'ne',
               Guttenberg: 'fp'
               'Generic Bot': ''
           },
           BelongsTo: 'Answer-related',
           IsDefault: false,
           SendWhenFlagRaised: true,
           Downvote: true,
           Enabled: true
       }]

    Notes:
    - The ReportType can't be changed to/from PostOther for default flags.
    - The Human field is retrieved on runtime when the flag is raised based on ReportType.
    - Each s-card div has a data-flag-id attribute based on which we can store the information on cache again
    - Comments.Low is the low-rep comment ONLY if there is a high-rep comment. Otherwise it's the comment
      that will be used regardless of the OP's reputation. This appears to be the simplest approach
*/

function getFeedbackRadio(botName: string, feedback: globals.AllFeedbacks, isChecked: boolean, flagId: number): string {
    const radioId = `af-${botName.replace(/\s/g, '-')}-${flagId}-feedback-${feedback || 'none'}`;
    const radioName = `af-${flagId}-feedback-to-${botName.replace(/\s/g, '-')}`;
    return `
<div class="flex--item">
    <div class="d-flex gs8 gsx">
        <div class="flex--item">
            <input class="s-radio" data-feedback="${feedback}" type="radio"${isChecked ? ' checked' : ''}
                   name="${radioName}" id="${radioId}"/>
        </div>
        <label class="flex--item s-label fw-normal" for="${radioId}">${feedback || globals.noneString.replace('o50', '')}</label>
    </div>
</div>`;
}

function getRadiosForBot(botName: globals.BotNames, currentFeedback: globals.AllFeedbacks, flagId: number): string {
    const feedbacks = globals.possibleFeedbacks[botName];
    const botFeedbacks = feedbacks
        .map(feedback => getFeedbackRadio(botName, feedback, feedback === currentFeedback, flagId))
        .join('\n');
    return `<div class="d-flex gs16"><div class="flex--item fs-body2">Feedback to ${botName}:</div>${botFeedbacks}</div>`;
}

function createModalOptionCheckbox(checkboxId: string, shouldCheck: boolean, labelText: string, checkboxClass: string): string {
    return `
<div class="d-flex gsx gs4 ai-center flex--item">
    <div class="flex--item pb2 d-inline-block">
        <input class="s-checkbox ${checkboxClass}" id="${checkboxId}" type="checkbox"${shouldCheck ? ' checked' : ''}>
    </div>
    <label class="flex--item s-label fw-normal" for="${checkboxId}">${labelText}</label>
</div>`;
}

function getExpandableContent(
    flagId: number, reportType: Flags, flagFeedbacks: globals.FlagTypeFeedbacks, checkSendFeedback: boolean, checkDownvote: boolean
): string {
    const isDisabled = reportType === 'PostOther';
    const feedbackRadios = Object.keys(globals.possibleFeedbacks).map(item => {
        const botName = item as globals.BotNames;
        return getRadiosForBot(botName, flagFeedbacks[botName], flagId);
    }).join('\n');
    const sendFeedbackId = `af-flagtype-send-feedback-${flagId}`, sendFeedbackClass = 'af-flagtype-send-feedback';
    const sendFeedbackText = 'Send feedback from this flag type when this type of flag is raised';
    const downvoteId = `af-downvote-option-${flagId}`, downvoteClass = 'af-downvote-option';
    const downvoteText = 'Downvote post';

    const sendFeedbackCheckbox = createModalOptionCheckbox(sendFeedbackId, checkSendFeedback, sendFeedbackText, sendFeedbackClass);
    const downvoteCheckbox = createModalOptionCheckbox(downvoteId, checkDownvote, downvoteText, downvoteClass);

    return `
<div class="advanced-flagging-flag-option d-flex ai-center gsx gs6">
    <label class="fw-bold ps-relative z-selected l12 fs-body1 flex--item${isDisabled ? ' o50' : ''}">Flag:</label>
    <div class="s-select r32 flex--item">
        <select class="pl48" ${isDisabled ? 'disabled' : ''}>${getFlagOptions(reportType)}</select>
    </div>

    ${isModOrNoFlag(reportType) ? '' : sendFeedbackCheckbox /* no point in adding the box */}
    ${downvoteCheckbox}
</div>
<div class="advanced-flagging-feedbacks-radios py8 ml2">${feedbackRadios}</div>`;
}

function createFlagTypeDiv(flagType: globals.CachedFlag): JQuery {
    const expandableId = `advanced-flagging-${flagType.Id}-${flagType.DisplayName}`.toLowerCase().replace(/\s/g, '');
    const isFlagEnabled = flagType.Enabled;
    const expandableContent =
        getExpandableContent(flagType.Id, flagType.ReportType, flagType.Feedbacks, flagType.SendWhenFlagRaised, flagType.Downvote);
    const categoryDiv = $(`
<div class="s-card${isFlagEnabled ? '' : ' s-card__muted'} bs-sm py4" data-flag-id=${flagType.Id}>
    <div class="d-flex ai-center sm:fd-column sm:ai-start">
        <h3 class="mb0 mr-auto fs-body3">${flagType.DisplayName}</h3>
        <div class="d-flex gs8">
            <button class="flex--item s-btn s-btn__primary af-submit-content" type="button" style="display: none">Save</button>
            <button class="flex--item s-btn s-btn__icon af-expandable-trigger"
                    data-controller="s-expandable-control" aria-controls="${expandableId}" type="button">Edit</button>
            <button class="flex--item s-btn s-btn__danger s-btn__icon af-remove-expandable">Remove</button>
            <div class="flex--item s-toggle-switch pt6">
                <input class="advanced-flagging-flag-enabled" type="checkbox"${isFlagEnabled ? ' checked' : ''}>
                <div class="s-toggle-switch--indicator"></div>
            </div>
        </div>
    </div>
    <div class="s-expandable" id="${expandableId}">
        <div class="s-expandable--content">${expandableContent}</div>
    </div>
</div>`);
    categoryDiv.find('.af-remove-expandable').prepend(globals.getStacksSvg('Trash'), ' '); // add the trash icon to the remove button
    categoryDiv.find('.af-expandable-trigger').prepend(globals.getStacksSvg('Pencil'), ' '); // add the pencil icon to the edit button
    return categoryDiv;
}

function createCategoryDiv(displayName: string): JQuery {
    const categoryHeader = $('<h2>').addClass('ta-center mb8 fs-title').html(displayName);
    return $('<div>').addClass(`af-${displayName.toLowerCase().replace(/\s/g, '')}-content flex--item`).append(categoryHeader);
}

function getCharSpan(textareaContent: string, contentType: 'comment' | 'flag'): string {
    const minCharacters = contentType === 'flag' ? 10 : 15, maxCharacters = contentType === 'flag' ? 500 : 600;
    const charCount = textareaContent.length, pluralS = Math.abs(maxCharacters - charCount) !== 1 ? 's' : '';
    // behaves the same way as the comment/custom flag textarea
    // if there are zero characters => Enter at least x characters
    // if the min character limit isn't reached => x more to go...
    // if the min character limit is reached but the max isn't => x characters left
    // if the max character limit is reached => too long by x characters
    let spanText: string;
    if (charCount === 0) spanText = `Enter at least ${minCharacters} characters`;
    else if (charCount < minCharacters) spanText = `${minCharacters - charCount} more to go...`;
    else if (charCount > maxCharacters) spanText = `Too long by ${charCount - maxCharacters} character${pluralS}`;
    else spanText = `${maxCharacters - charCount} character${pluralS} left`;

    // find the class name based on the characters remaining, not the characters already entered!!
    const charactersLeft = maxCharacters - charCount;
    let classname: 'cool' | 'warm' | 'hot' | 'supernova' | 'fc-red-400';
    if (charCount > maxCharacters) classname = 'fc-red-400';
    else if (charactersLeft >= maxCharacters * 3 / 5) classname = 'cool';
    else if (charactersLeft >= maxCharacters * 2 / 5) classname = 'warm';
    else if (charactersLeft >= maxCharacters / 5) classname = 'hot';
    else classname = 'supernova';

    // the form is invalid if there are more or less characters than the limit
    const isInvalid = classname === 'fc-red-400' || spanText.includes('more') || spanText.includes('at least');
    const invalidClass = isInvalid ? ' af-invalid-content' : '';
    return `<span class="af-text-counter ml-auto ${classname}${invalidClass}">${spanText}</span>`;
}

function getCommentFlagsDivs(flagId: number, comments: globals.CachedFlag['Comments'], flagText: string): JQuery {
    const contentWrapper = $('<div>').addClass('advanced-flagging-flag-comments-text d-flex gsy gs8 fd-column');
    const toggleSwitchId = `advanced-flagging-comments-${flagId}-toggle`;
    const enableSwitch = Boolean(comments.Low); // enable switch if lowrep comment exists
    const tickCheckbox = Boolean(comments.High); // tick checkbox if highrep comment exists
    const checkboxId = `advanced-flagging-highrep-${flagId}-checkbox`;

    const commentOptions = $(`
<div class="d-flex gsx gs12 ai-center">
    <label class="flex--item s-label mx0" for="${toggleSwitchId}">Leave comment</label>
    <div class="flex--item s-toggle-switch">
        <input id="${toggleSwitchId}"${enableSwitch ? ' checked' : ''} class="af-toggle-comment" type="checkbox">
        <div class="s-toggle-switch--indicator"></div>
    </div>
    <div class="d-flex gsx gs4 ai-center${enableSwitch ? '' : ' is-disabled'}">
        (<div class="flex--item pb2">
            <input class="s-checkbox af-toggle-highrep" type="checkbox"${tickCheckbox ? ' checked' : ''}
            ${enableSwitch ? '' : ' disabled'} id="${checkboxId}">
        </div>
    <label class="flex--item s-label fw-normal" for="${checkboxId}">Include comment for high rep users</label>
    </div>
    <span class="ps-relative r8">)</span>
</div>`);

    contentWrapper.append(commentOptions);
    const lowRepLabel = comments.High ? 'LowRep comment' : 'Comment text'; // if there are two comments, add label for LowRep
    const flagEl = globals.getTextarea(flagText, 'Flag text', 'flag').append(getCharSpan(flagText, 'flag'));
    const lowRepEl = globals.getTextarea(comments.Low, lowRepLabel, 'lowrep').append(getCharSpan(comments.Low, 'comment'));
    const highRepEl = globals.getTextarea(comments.High, 'HighRep comment', 'highrep').append(getCharSpan(comments.High, 'comment'));
    contentWrapper.append(flagEl, lowRepEl, highRepEl);
    // change the text counter information on keyup
    flagEl.add(lowRepEl).add(highRepEl).on('keyup', event => {
        const textarea = $(event.target), textareaContent = textarea.val() as string;
        const contentType = textarea.hasClass('af-flag-content') ? 'flag' : 'comment';
        textarea.next().replaceWith(getCharSpan(textareaContent, contentType));
    });
    return contentWrapper;
}

function setupEventListeners(): void {
    // listen to state change of expandables in our modal
    $(document).on('s-expandable-control:hide s-expandable-control:show', '.af-expandable-trigger', event => {
        const editButton = $(event.target), saveButton = editButton.prev(), flagTypeWrapper = editButton.parents('.s-card');
        if (!editButton.length || !saveButton.length || !flagTypeWrapper.length) return;

        const pencilSvgHtml = globals.getStacksSvg('Pencil')[0].outerHTML;
        const eyeOffSvgHtml = globals.getStacksSvg('EyeOff')[0].outerHTML;
        const isExpanded = flagTypeWrapper.find('.s-expandable').hasClass('is-expanded');
        editButton.html(isExpanded ? `${eyeOffSvgHtml} Hide` : `${pencilSvgHtml} Edit`);
        isExpanded ? saveButton.fadeIn('fast') : saveButton.fadeOut('fast');
    });
    $(document).on('click', '.af-remove-expandable', event => {
        const removeButton = $(event.target), flagTypeWrapper = removeButton.parents('.s-card');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id'));
        const flagTypeIndex = globals.cachedFlagTypes.findIndex(item => item.Id === flagId);
        globals.cachedFlagTypes.splice(flagTypeIndex, 1);
        globals.updateFlagTypes();

        flagTypeWrapper.fadeOut('fast', () => {
            flagTypeWrapper.remove();
            const categoryWrapper = flagTypeWrapper.parent();
            // if length is 1, then only the category header remains, which should be removed
            if (categoryWrapper.children().length === 1) flagTypeWrapper.fadeOut('fast', () => categoryWrapper.remove());
        });
        globals.displayStacksToast('Successfully removed flag type', 'success');
    }).on('click', '.af-comments-reset', () => {
        GreaseMonkeyCache.unset(globals.FlagTypesKey);
        cacheFlags();
        globals.displayStacksToast('Comments and flags have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    }).on('click', '.af-submit-content', event => { // save changes
        const element = $(event.target), flagTypeWrapper = element.parents('.s-card');
        const expandable = flagTypeWrapper.find('.s-expandable');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id'));
        if (!flagId) return globals.displayStacksToast('Failed to save options', 'danger');

        // only find invalid forms in visible textareas!
        const invalidElement = flagTypeWrapper.find('.af-invalid-content').filter(':visible');
        if (invalidElement.length) {
            // similar to what happens when add comment is clicked but the form is invalid
            invalidElement.fadeOut(100).fadeIn(100);
            globals.displayStacksToast('One or more of the comment textareas are invalid', 'danger');
            return;
        }

        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to save options', 'danger'); // somehow something went wrong

        /* --- store comments of a comment and/or flag --- */
        // use || '' to avoid null/undefined values in cache
        // each textarea has one of those three classes: af-flag-content, af-lowrep-content and af-highrep-content
        // for the flag text, the low-rep comment text and the high-rep comment text respectively
        const flagElement = expandable.find('.af-flag-content');
        const commentLow = expandable.find('.af-lowrep-content');
        const commentHigh = expandable.find('.af-highrep-content');
        const [flagContent, commentLowRep, commentHighRep] = [flagElement.val(), commentLow.val(), commentHigh.val()] as string[];

        // while the user can hide the textarea, we still keep the text in it, in case this was an accident
        // therefore, we only need to search and save content in visible textareas
        if (flagContent) currentFlagType.FlagText = flagElement.is(':visible') ? flagContent : '';
        if (commentLowRep) currentFlagType.Comments = {
            Low: commentLow.is(':visible') ? commentLowRep : '',
            High: commentHigh.is(':visible') ? commentHighRep : ''
        };
        /* --- end --- */

        /* --- save feedbacks --- */
        const getSelector = (flagId: number, botName: string): string => `[name^="af-${flagId}-feedback-to-${botName}"]:checked`;
        // Each radio button belongs to a group af-<flagId>-feedback-to-<bot> and has id af-<bot>-<flagId>-feedback-<feedback>
        // Additionally, it has a data-feedback attribute which holds the feedback that corresponds to the radio
        const botFeedbacks = {
            Smokey: $(getSelector(flagId, 'Smokey')).attr('data-feedback'),
            Natty: $(getSelector(flagId, 'Natty')).attr('data-feedback'),
            Guttenberg: $(getSelector(flagId, 'Guttenberg')).attr('data-feedback'),
            'Generic Bot': $(getSelector(flagId, 'Generic-Bot')).attr('data-feedback'),
        } as globals.FlagTypeFeedbacks;
        currentFlagType.Feedbacks = botFeedbacks;
        /* --- end --- */

        /* --- save ReportType --- */
        const selectElement = flagTypeWrapper.find('select');
        const newReportType = selectElement.val() as Flags;
        if (newReportType === 'PostOther') globals.displayStacksToast('Flag PostOther cannot be used with this option', 'danger');
        else currentFlagType.ReportType = newReportType;
        /* --- end --- */

        /* --- save SendWhenFlagRaised --- */
        const sendFeedbackWhenFlagRaisedBox = flagTypeWrapper.find('.af-flagtype-send-feedback');
        currentFlagType.SendWhenFlagRaised = sendFeedbackWhenFlagRaisedBox.is(':checked');

        // if any other FlagType with the same ReportType has SendWhenFlagRaised to true, then we need to change that
        const similarFlagType = globals.cachedFlagTypes.find(item => item.SendWhenFlagRaised
                                                                  && item.ReportType === currentFlagType.ReportType
                                                                  && item.Id !== flagId); // not this FlagType
        // make sure the FlagType exists and that the checkbox is checked
        if (similarFlagType && sendFeedbackWhenFlagRaisedBox.is(':checked')) {
            similarFlagType.SendWhenFlagRaised = false; // then turn off the option
            $(`#af-flagtype-send-feedback-${similarFlagType.Id}`).prop('checked', false); // and uncheck the checkbox
        }
        /* --- end --- */

        /* --- save Downvote option --- */
        const downvoteOptionCheckbox = flagTypeWrapper.find('.af-downvote-option');
        currentFlagType.Downvote = downvoteOptionCheckbox.is(':checked');
        /* --- end --- */

        globals.updateFlagTypes();
        element.next().trigger('click'); // hide the textarea by clicking the 'Hide' button and not manually
        globals.displayStacksToast('Content saved successfully', 'success');
    }).on('change', '.advanced-flagging-flag-enabled', event => { // enable/disable a flag
        const toggleSwitch = $(event.target), flagTypeWrapper = toggleSwitch.parents('.s-card');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id')), currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to toggle flag type', 'danger');

        const isEnabled = toggleSwitch.is(':checked');
        currentFlagType.Enabled = isEnabled;
        globals.updateFlagTypes();
        isEnabled ? flagTypeWrapper.removeClass('s-card__muted') : flagTypeWrapper.addClass('s-card__muted');
        globals.displayStacksToast(`Successfully ${isEnabled ? 'enabled' : 'disabled'} flag type`, 'success');
    }).on('change', '.af-toggle-comment, .af-toggle-highrep', event => { // leave comment options
        const inputElement = $(event.target), flagTypeWrapper = inputElement.parents('.s-card');
        const lowRepComment = flagTypeWrapper.find('.af-lowrep-content').parent();
        const highRepComment = flagTypeWrapper.find('.af-highrep-content').parent();
        const toggleComment = flagTypeWrapper.find('.af-toggle-comment'), toggleHighRep = flagTypeWrapper.find('.af-toggle-highrep');
        if (toggleComment.is(':checked')) { // leave comment toggle has been enabled
            // re-enable the highrep comment option checkbox
            toggleHighRep.parent().parent().removeClass('is-disabled');
            toggleHighRep.prop('disabled', false);
            lowRepComment.fadeIn(400, () => lowRepComment.removeClass('d-none').addClass('d-flex'));
        } else {
            // disable the highrep comment option checkbox
            toggleHighRep.parent().parent().addClass('is-disabled');
            toggleHighRep.prop('disabled', true);
            // due to d-flex using !important, we also need display: none; to use it as well
            lowRepComment.fadeOut(400, () => lowRepComment.addClass('d-none').removeClass('d-flex'));
            highRepComment.fadeOut(400, () => highRepComment.addClass('d-none').removeClass('d-flex'));
            return; // don't check for the high rep checkbox if leave comment is disabled
        }

        if (toggleHighRep.is(':checked')) {
            highRepComment.fadeIn(400, () => highRepComment.removeClass('d-none').addClass('d-flex'));
            lowRepComment.find('label').text('LowRep comment'); // highrep comment exists => lowrep comment exists
        } else {
            highRepComment.fadeOut(400, () => highRepComment.addClass('d-none').removeClass('d-flex'));
            lowRepComment.find('label').text('Comment text'); // no highrep comment => no lowrep comment
        }
    });
}

function setupCommentsAndFlagsModal(): void {
    const editCommentsPopup = globals.editCommentsPopup.clone();

    const categoryElements = {} as { [key: string]: JQuery };
    globals.cachedCategories
        .filter(category => category.Name)
        .forEach(category => categoryElements[category.Name || ''] = createCategoryDiv(category.Name || ''));

    globals.cachedFlagTypes.forEach(flagType => {
        const belongsToCategory = flagType.BelongsTo, comments = flagType.Comments, flagText = flagType.FlagText;
        const flagTypeDiv = createFlagTypeDiv(flagType);
        const expandable = flagTypeDiv.find('.s-expandable--content');
        const flagCategoryWrapper = categoryElements[belongsToCategory];

        expandable.prepend(getCommentFlagsDivs(flagType.Id, comments, flagText));
        flagCategoryWrapper.append(flagTypeDiv);
    });
    // now append all categories to the modal
    Object.values(categoryElements)
        .filter(categoryWrapper => categoryWrapper.children().length > 1) // the header is a child so the count must be >1
        .forEach(element => editCommentsPopup.find('.s-modal--body').children().append(element));

    setupEventListeners();
    $('body').append(editCommentsPopup);
}
