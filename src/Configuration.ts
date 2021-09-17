import { MetaSmokeAPI} from './UserscriptTools/MetaSmokeAPI';
import { flagCategories, Flags } from './FlagTypes';
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import * as globals from './GlobalVars';

type GeneralItems = Exclude<keyof globals.CachedConfiguration, 'EnabledFlags'>;

const { classSelectors, modalClasses, idSelectors, getDynamicAttributes } = globals;

const flagTypes = flagCategories.flatMap(category => category.FlagTypes);
const flagNames = [...new Set(flagTypes.map(flagType => flagType.DefaultReportType))];
// we'll be using a value here because the option text is not of type Flags and therefore can't be stored to cache
const getOption = (flagName: Flags, currentName: Flags): string =>
    `<option${flagName === currentName ? ' selected' : ''} value=${flagName}>
      ${globals.getHumanFromDisplayName(flagName) || '(none)'}
    </option>`;
const getFlagOptions = (currentName: Flags): string => flagNames.map(flagName => getOption(flagName, currentName)).join('');
const isModOrNoFlag = (flagName: Flags): boolean => [globals.FlagNames.NoFlag, globals.FlagNames.ModFlag]
    .some(reportType => reportType === flagName);

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

    const configModal = document.querySelector(idSelectors.configModal) as HTMLElement;
    const commentsModal = document.querySelector(idSelectors.commentsModal) as HTMLElement;
    $(document).on('click', idSelectors.configButton, () => Stacks.showModal(configModal));
    $(document).on('click', idSelectors.commentsButton, () => Stacks.showModal(commentsModal));

    commentsDiv.append(commentsLink).insertAfter(bottomBox);
    configurationDiv.append(configurationLink).insertAfter(bottomBox);
    if (!Object.prototype.hasOwnProperty.call(globals.cachedConfiguration, globals.ConfigurationAddAuthorName)) {
        globals.displayStacksToast('Please set up AdvancedFlagging before continuing.', 'info');
        setTimeout(() => Stacks.showModal(configModal));
    }
}

function setupDefaults(): void {
    if (!globals.cachedFlagTypes.length || !globals.cachedFlagTypes[0]?.Downvote) cacheFlags();
    if (!globals.cachedCategories.length) cacheCategories();
}

/* The configuration modal has two sections:
   - General (uses cache): general options. They are properties of the main Configuration object and accept Boolean values
     All options are disabled by default
   - Admin: doesn't use cache, but it interacts with it (deletes values)
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
    const modalTitle = 'AdvancedFlagging configuration';
    const modalBody = $(getGeneralConfigItems()).add($('<hr>').addClass('my16')).add(getAdminConfigItems());
    const resetButton = $('<button>')
        .addClass('flex--item s-btn s-btn__danger')
        .text('Reset')
        .attr('id', globals.modalIds.configReset)
        .attr('type', 'button');

    const configModal = globals.createModal(globals.modalIds.configModal, modalTitle, 'Save changes', modalBody, resetButton, 'w60');

    $('body').append(configModal);

    // event listener for "Save changes" button click
    configModal.find('.s-btn__primary').on('click', event => {
        event.preventDefault();
        // find the option id (it's the data-option-id attribute) and store whether the box is checked or not
        $(idSelectors.configGeneralSection).find('input').each((_index, el) => {
            const optionId = $(el).parent().parent().attr('data-option-id') as GeneralItems;
            globals.cachedConfiguration[optionId] = Boolean($(el).prop('checked'));
        });

        globals.updateConfiguration();
        globals.displayStacksToast('Configuration saved', 'success');
        setTimeout(() => window.location.reload(), 500);
    });
    // reset configuration to defaults
    resetButton.on('click', () => {
        GreaseMonkeyCache.unset(globals.ConfigurationCacheKey);
        globals.displayStacksToast('Configuration settings have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    });

    const resetConfigurationText = 'Reset configuration values to defaults. You will be asked to set them again.';
    globals.attachPopover(resetButton[0], resetConfigurationText, 'right');
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
        const configCheckbox = globals.createCheckbox(item.text, item.text, Boolean(storedValue), {
            label: 'pt2'
        });
        configCheckbox.attr('data-option-id', item.configValue);

        if (item.tooltipText) globals.attachPopover(configCheckbox.find('label')[0], item.tooltipText, 'right');
        return $('<div>').append(configCheckbox);
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
    const botNameToIdFormat = botName.replace(/\s/g, '-');
    const radioId = getDynamicAttributes.feedbackRadioId(botNameToIdFormat, flagId, feedback || 'none');
    const radioName = getDynamicAttributes.feedbackRadioName(flagId, botNameToIdFormat);
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

function getExpandableContent(
    flagId: number,
    reportType: Flags,
    flagFeedbacks: globals.FlagTypeFeedbacks,
    checkSendFeedback: boolean,
    checkDownvote: boolean
): JQuery {
    const isDisabled = reportType === 'PostOther';
    const feedbackRadios = Object.keys(globals.possibleFeedbacks).map(item => {
        const botName = item as globals.BotNames;
        return getRadiosForBot(botName, flagFeedbacks[botName], flagId);
    }).join('\n');
    const sendFeedbackId = getDynamicAttributes.sendWhenFlagRaised(flagId), sendFeedbackClass = modalClasses.commentsSendWhenFlagRaised;
    const sendFeedbackText = 'Send feedback from this flag type when this type of flag is raised';
    const downvoteId = getDynamicAttributes.downvoteOption(flagId), downvoteClass = modalClasses.commentsDownvoteOption;
    const downvoteText = 'Downvote post';

    const classesList = {
        flex: 'ai-center flex--item',
        inputParent: 'pb2 d-inline-block'
    };
    const sendFeedbackCheckbox = globals.createCheckbox(sendFeedbackId, sendFeedbackText, checkSendFeedback, Object.assign({
        input: sendFeedbackClass,
    }, classesList));
    const downvoteCheckbox = globals.createCheckbox(downvoteId, downvoteText, checkDownvote, Object.assign({
        input: downvoteClass,
    }, classesList));

    const content = $(`
<div class="${modalClasses.commentsFlagOptions} d-flex ai-center gsx gs6">
    <label class="fw-bold ps-relative z-selected l12 fs-body1 flex--item${isDisabled ? ' o50' : ''}">Flag:</label>
    <div class="s-select r32 flex--item">
        <select class="pl48" ${isDisabled ? 'disabled' : ''}>${getFlagOptions(reportType)}</select>
    </div>
</div>
<div class="${modalClasses.commentsSendFeedbackRadios} py8 ml2">${feedbackRadios}</div>`);

    if (!isModOrNoFlag(reportType)) content.eq(0).append(sendFeedbackCheckbox);
    content.eq(0).append(downvoteCheckbox);

    return content;
}

function createFlagTypeDiv(flagType: globals.CachedFlag): JQuery {
    const expandableId = getDynamicAttributes.expandableId(flagType.Id, flagType.DisplayName.toLowerCase().replace(/\s/g, ''));
    const isFlagEnabled = flagType.Enabled;
    const expandableContent =
        getExpandableContent(flagType.Id, flagType.ReportType, flagType.Feedbacks, flagType.SendWhenFlagRaised, flagType.Downvote);
    const categoryDiv = $(`
<div class="s-card${isFlagEnabled ? '' : ' s-card__muted'} bs-sm py4" data-flag-id=${flagType.Id}>
    <div class="d-flex ai-center sm:fd-column sm:ai-start">
        <h3 class="mb0 mr-auto fs-body3">${flagType.DisplayName}</h3>
        <div class="d-flex gs8">
            <button class="flex--item s-btn s-btn__primary ${modalClasses.commentsSubmit}" type="button" style="display: none">Save</button>
            <button class="flex--item s-btn s-btn__icon ${modalClasses.commentsExpandableTrigger}"
                    data-controller="s-expandable-control" aria-controls="${expandableId}" type="button">Edit</button>
            <button class="flex--item s-btn s-btn__danger s-btn__icon ${modalClasses.commentsRemoveExpandable}">Remove</button>
            <div class="flex--item s-toggle-switch pt6">
                <input class="${modalClasses.commentsToggleSwitch}" type="checkbox"${isFlagEnabled ? ' checked' : ''}>
                <div class="s-toggle-switch--indicator"></div>
            </div>
        </div>
    </div>
    <div class="s-expandable" id="${expandableId}">
        <div class="s-expandable--content"></div>
    </div>
</div>`);
    categoryDiv
        .find(classSelectors.commentsRemoveExpandable)
        .prepend(globals.getStacksSvg('Trash'), ' ') // trash icon to the remove button
        .end()
        .find(classSelectors.commentsExpandableTrigger)
        .prepend(globals.getStacksSvg('Pencil'), ' ') // pencil icon to edit button
        .end()
        .find('.s-expandable--content')
        .append(expandableContent); // insert the expandable content;
    return categoryDiv;
}

function createCategoryDiv(displayName: string): JQuery {
    const categoryHeader = $('<h2>').addClass('ta-center mb8 fs-title').html(displayName);
    const categoryDivClass = getDynamicAttributes.categoryContent(displayName.toLowerCase().replace(/\s/g, ''));
    return $('<div>').addClass(`${categoryDivClass} flex--item`).append(categoryHeader);
}

function getCharSpan(textareaContent: string, contentType: 'comment' | 'flag'): string {
    const minCharacters = contentType === 'flag' ? 10 : 15, maxCharacters = contentType === 'flag' ? 500 : 600;
    const charCount = textareaContent.length, pluralS = Math.abs(maxCharacters - charCount) !== 1 ? 's' : '';
    // behaves the same way as the comment/custom flag textarea
    // if there are zero characters => Enter at least x characters
    // if the min character limit isn't exceeded => x more to go...
    // if the min character limit is exceeded but the max isn't => x characters left
    // if the max character limit is exceeded => too long by x characters
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
    const invalidClass = isInvalid ? ` ${modalClasses.commentsInvalid}` : '';
    return `<span class="${modalClasses.commentsTextCounter} ml-auto ${classname + invalidClass}">${spanText}</span>`;
}

function getCommentFlagsDivs(flagId: number, comments: globals.CachedFlag['Comments'], flagText: string): JQuery {
    const { commentsTextsContainer, commentsToggleLeaveComment, commentsToggleHighRep } = modalClasses;
    const contentWrapper = $('<div>').addClass(`${commentsTextsContainer} d-flex gsy gs8 fd-column`);
    const toggleSwitchId = getDynamicAttributes.toggleSwitchId(flagId);

    const enableSwitch = Boolean(comments.Low); // enable switch if lowrep comment exists
    const tickCheckbox = Boolean(comments.High); // tick checkbox if highrep comment exists
    const checkboxId = getDynamicAttributes.highRepCheckbox(flagId);

    const labelText = 'Include comment for high rep users';
    const checkbox = globals.createCheckbox(checkboxId, labelText, tickCheckbox, {
        flex: `gsx ai-center${enableSwitch ? '' : ' is-disabled'}`,
        inputParent: 'pb2',
        input: commentsToggleHighRep
    });

    const commentOptions = $(`
<div class="d-flex gsx gs12 ai-center">
    <label class="flex--item s-label mx0" for="${toggleSwitchId}">Leave comment</label>
    <div class="flex--item s-toggle-switch">
        <input id="${toggleSwitchId}" class="${commentsToggleLeaveComment}" type="checkbox"${enableSwitch ? ' checked' : ''}>
        <div class="s-toggle-switch--indicator"></div>
    </div>
</div>`);
    commentOptions.append(checkbox);

    contentWrapper.append(commentOptions);
    const lowRepLabel = comments.High ? 'LowRep comment' : 'Comment text'; // if there are two comments, add label for LowRep
    const flagEl = globals.getTextarea(flagText, 'Flag text', 'flag').append(getCharSpan(flagText, 'flag'));
    const lowRepEl = globals.getTextarea(comments.Low, lowRepLabel, 'lowrep').append(getCharSpan(comments.Low, 'comment'));
    const highRepEl = globals.getTextarea(comments.High, 'HighRep comment', 'highrep').append(getCharSpan(comments.High, 'comment'));
    contentWrapper.append(flagEl, lowRepEl, highRepEl);
    // change the text counter information on keyup
    flagEl.add(lowRepEl).add(highRepEl).on('keyup', event => {
        const textarea = $(event.target), textareaContent = textarea.val() as string;
        const contentType = textarea.hasClass(modalClasses.commentsFlagContent) ? 'flag' : 'comment';
        textarea.next().replaceWith(getCharSpan(textareaContent, contentType));
    });
    return contentWrapper;
}

function setupEventListeners(): void {
    const {
        commentsExpandableTrigger,
        commentsRemoveExpandable,
        commentsReset,
        commentsSubmit,
        commentsInvalid,
        commentsFlagContent,
        commentsLowRepContent,
        commentsHighRepContent,
        commentsSendWhenFlagRaised,
        commentsDownvoteOption,
        commentsToggleSwitch,
        commentsToggleLeaveComment,
        commentsToggleHighRep
    } = classSelectors;

    // listen to state change of expandables in our modal
    $(document).on('s-expandable-control:hide s-expandable-control:show', commentsExpandableTrigger, event => {
        const editButton = $(event.target), saveButton = editButton.prev(), flagTypeWrapper = editButton.parents('.s-card');
        if (!editButton.length || !saveButton.length || !flagTypeWrapper.length) return;

        const pencilSvgHtml = globals.getStacksSvg('Pencil')[0].outerHTML;
        const eyeOffSvgHtml = globals.getStacksSvg('EyeOff')[0].outerHTML;
        const isExpanded = flagTypeWrapper.find('.s-expandable').hasClass('is-expanded');
        editButton.html(isExpanded ? `${eyeOffSvgHtml} Hide` : `${pencilSvgHtml} Edit`);
        isExpanded ? saveButton.fadeIn('fast') : saveButton.fadeOut('fast');
    });

    $(document).on('click', commentsRemoveExpandable, event => {
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
    }).on('click', commentsReset, () => {
        GreaseMonkeyCache.unset(globals.FlagTypesKey);
        cacheFlags();
        globals.displayStacksToast('Comments and flags have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    }).on('click', commentsSubmit, event => { // save changes
        const element = $(event.target), flagTypeWrapper = element.parents('.s-card');
        const expandable = flagTypeWrapper.find('.s-expandable');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id'));
        if (!flagId) return globals.displayStacksToast('Failed to save options', 'danger');

        // only find invalid forms in visible textareas!
        const invalidElement = flagTypeWrapper.find(commentsInvalid).filter(':visible');
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
        const flagElement = expandable.find(commentsFlagContent);
        const commentLow = expandable.find(commentsLowRepContent);
        const commentHigh = expandable.find(commentsHighRepContent);
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
        const getRadioName = (botName: string): string => getDynamicAttributes.feedbackRadioName(flagId, botName);
        const getSelector = (botName: string): string => `[name^="${getRadioName(botName)}"]:checked`;

        // The data-feedback attribute holds the feedback that corresponds to the radio
        const botFeedbacks = {
            Smokey: $(getSelector('Smokey')).attr('data-feedback'),
            Natty: $(getSelector('Natty')).attr('data-feedback'),
            Guttenberg: $(getSelector('Guttenberg')).attr('data-feedback'),
            'Generic Bot': $(getSelector('Generic-Bot')).attr('data-feedback'),
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
        const sendFeedbackWhenFlagRaisedBox = flagTypeWrapper.find(commentsSendWhenFlagRaised);
        currentFlagType.SendWhenFlagRaised = sendFeedbackWhenFlagRaisedBox.is(':checked');

        // if any other FlagType with the same ReportType has SendWhenFlagRaised to true, then we need to change that
        const similarFlagType = globals.cachedFlagTypes.find(item => item.SendWhenFlagRaised
                                                                  && item.ReportType === currentFlagType.ReportType
                                                                  && item.Id !== flagId); // not this FlagType
        // make sure the FlagType exists and that the checkbox is checked
        if (similarFlagType && sendFeedbackWhenFlagRaisedBox.is(':checked')) {
            similarFlagType.SendWhenFlagRaised = false; // then turn off the option
            $(`#${getDynamicAttributes.sendWhenFlagRaised(similarFlagType.Id)}`).prop('checked', false); // and uncheck the checkbox
        }
        /* --- end --- */

        /* --- save Downvote option --- */
        const downvoteOptionCheckbox = flagTypeWrapper.find(commentsDownvoteOption);
        currentFlagType.Downvote = downvoteOptionCheckbox.is(':checked');
        /* --- end --- */

        globals.updateFlagTypes();
        element.next().trigger('click'); // hide the textarea by clicking the 'Hide' button and not manually
        globals.displayStacksToast('Content saved successfully', 'success');
    }).on('change', commentsToggleSwitch, event => { // enable/disable a flag
        const toggleSwitch = $(event.target), flagTypeWrapper = toggleSwitch.parents('.s-card');
        const flagId = Number(flagTypeWrapper.attr('data-flag-id')), currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to toggle flag type', 'danger');

        const isEnabled = toggleSwitch.is(':checked');
        currentFlagType.Enabled = isEnabled;
        globals.updateFlagTypes();
        isEnabled ? flagTypeWrapper.removeClass('s-card__muted') : flagTypeWrapper.addClass('s-card__muted');
        globals.displayStacksToast(`Successfully ${isEnabled ? 'enabled' : 'disabled'} flag type`, 'success');
    }).on('change', `${commentsToggleLeaveComment}, ${commentsToggleHighRep}`, event => { // leave comment options
        const inputElement = $(event.target), flagTypeWrapper = inputElement.parents('.s-card');
        const lowRepComment = flagTypeWrapper.find(commentsLowRepContent).parent();
        const highRepComment = flagTypeWrapper.find(commentsHighRepContent).parent();
        const toggleComment = flagTypeWrapper.find(commentsToggleLeaveComment);
        const toggleHighRep = flagTypeWrapper.find(commentsToggleHighRep);

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
    const modalTitle = 'AdvancedFlagging: edit comments and flags';
    const modalBody = $('<div>').addClass('d-flex fd-column gs16');
    const resetButton = $('<button>')
        .addClass(`flex--item s-btn s-btn__danger ${modalClasses.commentsReset}`)
        .text('Reset')
        .attr('type', 'button');
    const commentsPopup = globals.createModal(globals.modalIds.commentsModal, modalTitle, 'I\'m done!', modalBody, resetButton, 'w80');

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
        .forEach(element => commentsPopup.find('.s-modal--body').children().append(element));

    setupEventListeners();
    $('body').append(commentsPopup);
}
