import { MetaSmokeAPI} from './UserscriptTools/MetaSmokeAPI';
import { flagCategories, Flags } from './FlagTypes';
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import * as globals from './GlobalVars';

declare const StackExchange: globals.StackExchange;
declare const Stacks: globals.Stacks;
type GeneralItems = Exclude<keyof globals.CachedConfiguration, 'EnabledFlags'>;

const flagTypes = flagCategories.flatMap(category => category.FlagTypes);
const flagNames = [...new Set(flagTypes.map(flagType => flagType.DefaultReportType))];
const getOption = (flag: Flags, name: string): string => `<option${flag === name ? ' selected' : ''}>${flag}</option>`;
const getFlagOptions = (name: string): string => flagNames.map(flag => getOption(flag, name)).join('');

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
                Enabled: true // all flags should be enabled by default
            } as globals.CachedFlag;
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
    if (!Object.prototype.hasOwnProperty.call(globals.cachedConfigurationInfo, globals.ConfigurationAddAuthorName)) {
        globals.displayStacksToast('Please set up AdvancedFlagging before continuing.', 'info');
        StackExchange.helpers.showModal(document.querySelector('#af-config'));
    }
}

function setupDefaults(): void {
    if (!globals.cachedFlagTypes.length || !globals.cachedFlagTypes[0].Feedbacks) cacheFlags();
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
    overlayModal.find('.s-modal--close').append(globals.getStacksSvg('Clear'));
    $('body').append(overlayModal);

    overlayModal.find('#af-modal-description').append(getGeneralConfigItems(), $('<hr>').addClass('my16'), getAdminConfigItems());

    // event listener for "Save changes" button click
    overlayModal.find('.s-btn__primary').on('click', event => {
        event.preventDefault();
        // find the option id (it's the data-option-id attribute) and store whether the box is checked or not
        $('.af-section-general').find('input').each((_index, el) => {
            const optionId = $(el).parents().eq(2).data('option-id') as GeneralItems;
            globals.cachedConfigurationInfo[optionId] = Boolean($(el).prop('checked'));
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
    globals.attachPopover($('.af-configuration-reset')[0], resetConfigurationText, 'top');
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
        }
    ].map(item => {
        const storedValue = globals.cachedConfigurationInfo?.[item.configValue as GeneralItems];
        const configCheckbox = createCheckbox(item.text, Boolean(storedValue)).data('option-id', item.configValue);
        if (item.tooltipText) globals.attachPopover(configCheckbox.find('label')[0], item.tooltipText, 'top');
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
    ].map(item => item.wrap(globals.gridCellDiv.clone()).parent());
    [clearMetasmokeInfo, clearFkey].forEach(element => sectionWrapper.append(element));
    const chatFkey = GreaseMonkeyCache.getFromCache<string>(globals.CacheChatApiFkey);
    const msAccessTokenText = MetaSmokeAPI.accessToken
        ? `token: ${MetaSmokeAPI.accessToken.substring(0, 32)}...` // truncate the string because it's too long
        : 'access token is not stored in cache';
    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = 'This will clear the chat fkey. It will be regenerated the next time feedback is sent to Natty '
                           + `(${chatFkey ? `fkey: ${chatFkey}` : 'fkey is not stored in cache'})`;
    globals.attachPopover(clearMetasmokeInfo.find('a')[0], metasmokeTooltip, 'top');
    globals.attachPopover(clearFkey.find('a')[0], fkeyClearTooltip, 'top');

    return sectionWrapper;
}

function createCheckbox(text: string, checkCheckbox: boolean | null): JQuery {
    const optionId = text.toLowerCase().replace(/\s/g, '_');
    const configHtml = $(`
<div>
  <div class="grid gs4">
    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="${optionId}"/></div>
    <label class="grid--cell s-label fw-normal pt2" for="${optionId}">${text}</label>
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
           FlagText: 'This is some text',
           Comments: {
               Low: 'This is a LowRep comment',
               High: ''
           },
           ReportType: 'PostOther',
           DisplayName: 'Plagiarism',
           Feedbacks: {
               Smokey: 'tp-',
               Natty: 'tp',
               Guttenberg: 'tp'
               'Generic Bot': 'track'
           },
           IsDefault: true,
           Enabled: false
       }, {
           Id: 2,
           FlagText: '',
           Comments: {
               Low: 'This is a LowRep comment',
               High: 'This is a HighRep comment'
           },
           ReportType: 'AnswerNotAnAnswer',
           DisplayName: 'Not an answer'
           Feedbacks: {
               Smokey: 'fp-',
               Natty: 'ne',
               Guttenberg: 'fp'
               'Generic Bot': ''
           },
           IsDefault: false,
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
<div class="grid--cell">
    <div class="grid gs8 gsx">
        <div class="grid--cell">
            <input class="s-radio" data-feedback="${feedback}" type="radio"${isChecked ? ' checked' : ''}
                   name="${radioName}" id="${radioId}"/>
        </div>
        <label class="grid--cell s-label fw-normal" for="${radioId}">${feedback || globals.noneString.replace('o50', '')}</label>
    </div>
</div>`;
}

function getRadiosForBot(botName: globals.BotNames, currentFeedback: globals.AllFeedbacks, flagId: number): string {
    const feedbacks = globals.possibleFeedbacks[botName];
    const botFeedbacks = feedbacks
        .map(feedback => getFeedbackRadio(botName, feedback, feedback === currentFeedback, flagId))
        .join('\n');
    return `<div class="grid gs16"><div class="grid--cell fs-body2">Feedback to ${botName}:</div>${botFeedbacks}</div>`;
}

function createFlagTypeDiv(flagType: globals.CachedFlag): JQuery {
    const expandableId = `advanced-flagging-${flagType.Id}-${flagType.DisplayName}`.toLowerCase().replace(/\s/g, '');
    const isDisabled = flagType.ReportType === 'PostOther';
    const feedbackRadios = Object.keys(globals.possibleFeedbacks).map(item => {
        const botName = item as globals.BotNames;
        return getRadiosForBot(botName, flagType.Feedbacks[botName], flagType.Id);
    }).join('\n');
    const isFlagEnabled = flagType.Enabled;
    const categoryDiv = $(`
<div class="s-card${isFlagEnabled ? '' : ' s-card__muted'} bs-sm py4" data-flag-id=${flagType.Id}>
    <div class="grid ai-center sm:fd-column sm:ai-start">
        <h3 class="mb0 mr-auto fs-body3">${flagType.DisplayName}</h3>
        <div class="grid gs8">
            <button class="grid--cell s-btn s-btn__primary af-submit-content" type="button" style="display: none">Save</button>
            <button class="grid--cell s-btn s-btn__icon af-expandable-trigger"
                    data-controller="s-expandable-control" aria-controls="${expandableId}" type="button">Edit</button>
            <button class="grid--cell s-btn s-btn__danger s-btn__icon af-remove-expandable">Remove</button>
            <div class="grid--cell s-toggle-switch pt6">
                <input class="advanced-flagging-flag-enabled" type="checkbox"${isFlagEnabled ? ' checked' : ''}>
                <div class="s-toggle-switch--indicator"></div>
            </div>
        </div>
    </div>
    <div class="s-expandable" id="${expandableId}">
        <div class="s-expandable--content">
            <div class="advanced-flagging-flag-option py8 mln4">
                <label class="fw-bold ps-relative d-inline-block z-selected l12 fs-body1 ${isDisabled ? 'o50' : ''}">Flag as:</label>
                <div class="s-select d-inline-block r48">
                    <select class="pl64" ${isDisabled ? 'disabled' : ''}>${getFlagOptions(flagType.ReportType)}</select>
                </div>
            </div>
            <div class="advanced-flagging-feedbacks-radios py8 ml2">${feedbackRadios}</div>
        </div>
    </div>
</div>`);
    categoryDiv.find('.af-remove-expandable').prepend(globals.getStacksSvg('Trash'), ' '); // add the trash icon to the remove button
    categoryDiv.find('.af-expandable-trigger').prepend(globals.getStacksSvg('Pencil'), ' '); // add the pencil icon to the edit button
    return categoryDiv;
}

function createCategoryDiv(displayName: string): JQuery {
    const categoryHeader = $('<h2>').addClass('ta-center mb8 fs-title').html(displayName);
    return $('<div>').addClass(`af-${displayName.toLowerCase().replace(/\s/g, '')}-content grid--cell`).append(categoryHeader);
}

function getCommentFlagsDivs(flagId: number, comments: globals.CachedFlag['Comments'], flagText: string): JQuery {
    const contentWrapper = $('<div>').addClass('advanced-flagging-flag-comments-text grid gsy gs8 fd-column');
    const toggleSwitchId = `advanced-flagging-comments-${flagId}-toggle`;
    const enableSwitch = Boolean(comments.Low); // enable switch if lowrep comment exists
    const tickCheckbox = Boolean(comments.High); // tick checkbox if highrep comment exists
    const checkboxId = `advanced-flagging-highrep-${flagId}-checkbox`;

    const commentOptions = $(`
<div class="grid gsx gs12 ai-center">
    <label class="grid--cell s-label mx0" for="${toggleSwitchId}">Leave comment</label>
    <div class="grid--cell s-toggle-switch">
        <input id="${toggleSwitchId}"${enableSwitch ? ' checked' : ''} class="af-toggle-comment" type="checkbox">
        <div class="s-toggle-switch--indicator"></div>
    </div>
    <div class="grid gsx gs4 ai-center${enableSwitch ? '' : ' is-disabled'}">
        (<div class="grid--cell pb2">
            <input class="s-checkbox af-toggle-highrep" type="checkbox"${tickCheckbox ? ' checked' : ''}
            ${enableSwitch ? '' : ' disabled'} id="${checkboxId}">
        </div>
    <label class="grid--cell s-label fw-normal" for="${checkboxId}">Include comment for high rep users</label>
    </div>
    <span class="ps-relative r8">)</span>
</div>`);

    contentWrapper.append(commentOptions);
    const lowRepLabel = comments.High ? 'LowRep comment' : 'Comment text'; // if there are two comments, add label for LowRep
    contentWrapper.append(globals.getTextarea(flagText, 'Flag text', 'flag'));
    contentWrapper.append(globals.getTextarea(comments.Low, lowRepLabel, 'lowrep'));
    contentWrapper.append(globals.getTextarea(comments.High, 'HighRep comment', 'highrep'));
    return contentWrapper;
}

function setupCommentsAndFlagsModal(): void {
    const editCommentsPopup = globals.editCommentsPopup.clone();
    editCommentsPopup.find('.s-modal--close').append(globals.getStacksSvg('Clear'));

    const categoryElements = {} as { [key: string]: JQuery };
    globals.cachedCategories.forEach(category => categoryElements[category.Name] = createCategoryDiv(category.Name));

    globals.cachedFlagTypes.forEach(flagType => {
        const belongsToCategory = flagType.BelongsTo, comments = flagType.Comments, flagText = flagType.FlagText;
        const flagTypeDiv = createFlagTypeDiv(flagType);
        const expandable = flagTypeDiv.find('.s-expandable--content');
        const flagCategoryWrapper = categoryElements[belongsToCategory];

        expandable.prepend(getCommentFlagsDivs(flagType.Id, comments, flagText));
        flagCategoryWrapper?.append(flagTypeDiv);
    });
    // now append all categories to the modal
    Object.values(categoryElements)
        .filter(categoryWrapper => categoryWrapper.children().length > 1) // the header is a child so the count must be >1
        .forEach(element => editCommentsPopup.find('.s-modal--body').children().append(element));

    $(document).on('s-expandable-control:hide s-expandable-control:show', event => { // the expandable is triggered
        const editButton = $(event.target), saveButton = editButton.prev(), flagTypeWrapper = editButton.parents('.s-card');
        if (!editButton.length || !saveButton.length || !flagTypeWrapper.length) return; // another expandable triggered

        const pencilSvgHtml = globals.getStacksSvg('Pencil')[0].outerHTML;
        const eyeOffSvgHtml = globals.getStacksSvg('EyeOff')[0].outerHTML;
        const isExpanded = flagTypeWrapper.find('.s-expandable').hasClass('is-expanded');
        editButton.html(isExpanded ? `${eyeOffSvgHtml} Hide` : `${pencilSvgHtml} Edit`);
        isExpanded ? saveButton.fadeIn('fast') : saveButton.fadeOut('fast');
    }).on('click', '.af-submit-content', event => { // save changes
        const element = $(event.target), flagTypeWrapper = element.parents('.s-card');
        const expandable = flagTypeWrapper.find('.s-expandable');
        element.next().trigger('click'); // hide the textarea by clicking the 'Hide' button and not manually
        const flagId = Number(flagTypeWrapper.data('flag-id'));
        if (!flagId) return globals.displayStacksToast('Failed to save options', 'danger');

        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to save options', 'danger'); // somehow something went wrong

        // use || '' to avoid null/undefined values in cache
        // each textarea has one of those three classes: af-flag-content, af-lowrep-content and af-highrep-content
        // for the flag text, the low-rep comment text and the high-rep comment text respectively
        const flagElement = expandable.find('.af-flag-content');
        const commentLow = expandable.find('.af-lowrep-content');
        const commentHigh = expandable.find('.af-highrep-content');
        const [flagContent, commentLowRep, commentHighRep] = [flagElement.val(), commentLow.val(), commentHigh.val()] as string[];

        const getSelector = (flagId: number, botName: string): string => `[name^="af-${flagId}-feedback-to-${botName}"]:checked`;
        // Each radio button belongs to a group af-<flagId>-feedback-to-<bot> and has id af-<bot>-<flagId>-feedback-<feedback>
        // Additionally, it has a data-feedback attribute which holds the feedback that corresponds to the radio
        const botFeedbacks = {
            Smokey: $(getSelector(flagId, 'Smokey')).data('feedback') as globals.FlagTypeFeedbacks['Smokey'],
            Natty: $(getSelector(flagId, 'Natty')).data('feedback') as globals.FlagTypeFeedbacks['Natty'],
            Guttenberg: $(getSelector(flagId, 'Guttenberg')).data('feedback') as globals.FlagTypeFeedbacks['Guttenberg'],
            'Generic Bot': $(getSelector(flagId, 'Generic-Bot')).data('feedback') as globals.FlagTypeFeedbacks['Generic Bot'],
        };

        // the textarea may be hidden (because user has just disabled leave comment), but it still has text
        // in case the user has accidentally done so. We need to save the content in visible textareas!
        if (flagContent) currentFlagType.FlagText = flagElement.is(':visible') ? flagContent : '';
        if (commentLowRep) currentFlagType.Comments = {
            Low: commentLow.is(':visible') ? commentLowRep : '',
            High: commentHigh.is(':visible') ? commentHighRep : ''
        };
        currentFlagType.Feedbacks = botFeedbacks;
        globals.updateFlagTypes();

        globals.displayStacksToast('Content saved successfully', 'success');
    }).on('click', '.af-remove-expandable', event => {
        const removeButton = $(event.target), flagTypeWrapper = removeButton.parents('.s-card');
        const flagId = Number(flagTypeWrapper.data('flag-id'));
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
    }).on('change', '.advanced-flagging-flag-option select', event => { // save a new report type
        const selectElement = $(event.target), flagTypeWrapper = selectElement.parents('.s-card');
        const newReportType = selectElement.val() as Flags;
        const flagId = Number(flagTypeWrapper.data('flag-id'));
        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to change the report flag type', 'danger');
        if (newReportType === 'PostOther') return globals.displayStacksToast('Flag PostOther cannot be used with this option', 'danger');

        currentFlagType.ReportType = newReportType;
        globals.updateFlagTypes();
        globals.displayStacksToast('Successfully changed the flag type for this option', 'success');
    }).on('change', '.advanced-flagging-flag-enabled', event => { // enable/disable a flag
        const toggleSwitch = $(event.target), flagTypeWrapper = toggleSwitch.parents('.s-card');
        const flagId = Number(flagTypeWrapper.data('flag-id')), currentFlagType = globals.getFlagTypeFromFlagId(flagId);
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
            toggleHighRep.removeAttr('disabled');
            lowRepComment.fadeIn();
        } else {
            // disable the highrep comment option checkbox
            toggleHighRep.parent().parent().addClass('is-disabled');
            toggleHighRep.prop('disabled', true);
            lowRepComment.fadeOut(400, () => lowRepComment.hide());
            highRepComment.fadeOut(400, () => highRepComment.hide());
            return; // don't check for the high rep checkbox if leave comment is disabled
        }

        if (toggleHighRep.is(':checked')) {
            highRepComment.fadeIn();
            lowRepComment.find('label').text('LowRep comment'); // highrep comment exists => lowrep comment exists
        } else {
            highRepComment.fadeOut(400, () => highRepComment.hide());
            lowRepComment.find('label').text('Comment text'); // no highrep comment => no lowrep comment
        }
    });
    $('body').append(editCommentsPopup);
}
