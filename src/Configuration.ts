import { MetaSmokeAPI} from './UserscriptTools/MetaSmokeAPI';
import { flagCategories, Flags } from './FlagTypes';
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import * as globals from './GlobalVars';

declare const Svg: globals.Svg;
declare const StackExchange: globals.StackExchange;
declare const Stacks: globals.Stacks;
type GeneralItems = Exclude<keyof globals.CachedConfiguration, 'EnabledFlags'>;

const getEnabledFlags = (): number[] => globals.cachedConfigurationInfo?.EnabledFlags;
const flagTypes = flagCategories.flatMap(category => category.FlagTypes);
const flagNames = [...new Set(flagTypes.map(flagType => flagType.DefaultReportType))];
const optionTypes = flagNames.filter(item => !/Post(?:Other|Offensive|Spam)/.exec(item));
const cacheFlags = (): void => GreaseMonkeyCache.StoreInCache(globals.FlagTypesKey, flagTypes.map(flagType => {
    return {
        Id: flagType.Id,
        FlagText: flagType.DefaultFlagText || '',
        Comments: {
            Low: flagType.DefaultComment || '',
            High: flagType.DefaultCommentHigh || ''
        },
        ReportType: flagType.DefaultReportType
    } as globals.CachedFlag;
}));
const getOption = (flag: Flags, name: string): string => `<option${flag === name ? ' selected' : ''}>${flag}</option>`;
const getFlagOptions = (name: string): string => optionTypes.map(flag => getOption(flag, name)).join('');

export function SetupConfiguration(): void {
    SetupDefaults(); // stores default values if they haven't already been
    BuildConfigurationOverlay(); // the configuration modal
    SetupCommentsAndFlagsModal(); // the comments & flags modal

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

function SetupDefaults(): void {
    // store all flags if they don't exist
    if (!getEnabledFlags()) {
        const flagTypeIds = flagTypes.map(flag => flag.Id);
        globals.cachedConfigurationInfo[globals.ConfigurationEnabledFlags] = flagTypeIds;
        globals.updateConfiguration();
    }

    const cachedFlagTypes = GreaseMonkeyCache.GetFromCache<globals.CachedFlag[]>(globals.FlagTypesKey);
    // in case we add a new flag type, make sure it will be automatically be saved (compare types)
    if (cachedFlagTypes?.length !== flagTypes.length) cacheFlags();
}

/* The configuration modal has three sections:
   - General (uses cache): general options. They are properties of the main Configuration object and accept Boolean values
     All options are disabled by default
   - Flags (uses cache): the flag Ids are stored in an array. All are enabled by default
   - Admin doesn't use cache, but it interacts with it (deletes values)
   Sample cache:
   AdvancedFlagging.Configuration: {
       OpenOnHover: true,
       AnotherOption: false,
       DoFooBar: true,
       Flags: [1, 2, 4, 5, 6, 10, 14, 15]
   }

   Notes:
   - In General, the checkboxes and the corresponding labels are wrapped in a div that has a data-option-id attribute.
     This is the property of the option that will be used in cache.
   - In Flags, each checkbox has a flag-type-<FLAG_ID> id. This is used to determine the flag id
*/
function BuildConfigurationOverlay(): void {
    const overlayModal = globals.overlayModal.clone();
    overlayModal.find('.s-modal--close').append(Svg.ClearSm());

    const sections: ConfigSection[] = [
        {
            SectionName: 'General',
            Items: GetGeneralConfigItems(),
            onSave: (): void => {
                // find the option id (it's the data-option-id attribute) and store whether the box is checked or not
                $('.af-section-general').find('input').each((_index, el) => {
                    const optionId = $(el).parents().eq(2).data('option-id') as GeneralItems;
                    globals.cachedConfigurationInfo[optionId] = Boolean($(el).prop('checked'));
                });
            }
        },
        {
            SectionName: 'Flags',
            Items: GetFlagSettings(),
            onSave: (): void => {
                // collect all flag ids (flag-type-ID) and store them
                const flagOptions = $('.af-section-flags').find('input').get()
                    .filter(el => $(el).prop('checked')).map(el => Number(/\d+/.exec(el.id || '')) || 0)
                    .sort((a, b) => a - b); // sort the ids before storing them
                globals.cachedConfigurationInfo[globals.ConfigurationEnabledFlags] = flagOptions;
            }
        },
        {
            // nothing to do onSave here because there's nothing to save :)
            SectionName: 'Admin',
            Items: GetAdminConfigItems()
        }
    ];

    let firstSection = true;
    sections.forEach(section => {
        if (!firstSection) overlayModal.find('#af-modal-description').append('<hr>');
        firstSection = false;

        const sectionWrapper = globals.getSectionWrapper(section.SectionName);
        overlayModal.find('#af-modal-description').append(sectionWrapper);

        section.Items.forEach((element: JQuery) => sectionWrapper.append(element));
    });

    // event listener for "Save changes" button click
    overlayModal.find('.s-btn__primary').on('click', event => {
        event.preventDefault();
        sections.forEach(section => section.onSave?.());
        globals.updateConfiguration();
        globals.displayStacksToast('Configuration saved', 'success');
        setTimeout(() => window.location.reload(), 500);
    });

    $('body').append(overlayModal);
    const flagOptions = $('.af-section-flags').children('div');
    for (let i = 0; i < flagOptions.length; i += 5) {
        flagOptions.slice(i, i + 5).wrapAll(globals.inlineCheckboxesWrapper.clone());
    }
    // dynamically generate the width
    $('label[for="flag-type-16"]').parent().css('width', $('label[for="flag-type-11"]').parent().css('width')).removeClass('w25 lg:w25');
}

function GetGeneralConfigItems(): JQuery[] {
    return [
        {
            text: 'Open dropdown on hover',
            configValue: globals.ConfigurationOpenOnHover
        },
        {
            text: 'Watch for manual flags',
            configValue: globals.ConfigurationWatchFlags
        },
        {
            text: 'Watch for queue responses',
            configValue: globals.ConfigurationWatchQueues
        },
        {
            text: 'Disable AdvancedFlagging link',
            configValue: globals.ConfigurationLinkDisabled
        },
        {
            text: 'Uncheck \'Leave comment\' by default',
            configValue: globals.ConfigurationDefaultNoComment
        },
        {
            text: 'Uncheck \'Flag\' by default',
            configValue: globals.ConfigurationDefaultNoFlag
        },
        {
            text: 'Uncheck \'Downvote\' by default',
            configValue: globals.ConfigurationDefaultNoDownvote
        },
        {
            text: 'Add author\'s name before comments',
            configValue: globals.ConfigurationAddAuthorName
        }
    ].map(item => {
        const storedValue = globals.cachedConfigurationInfo?.[item.configValue as GeneralItems];
        return createCheckbox(item.text, Boolean(storedValue)).attr('data-option-id', item.configValue);
    });
}

function GetFlagSettings(): JQuery[] {
    const checkboxes: JQuery[] = [];
    const enabledFlags = getEnabledFlags();
    if (!enabledFlags) return checkboxes;

    flagTypes.forEach(flag => {
        const storedValue = enabledFlags.indexOf(flag.Id) > -1;
        const checkbox = createCheckbox(flag.DisplayName, storedValue, `flag-type-${flag.Id}`).children().eq(0);
        checkboxes.push(checkbox.addClass('w25 lg:w25 md:w100 sm:w100')); // responsiveness
    });
    return checkboxes;
}

function GetAdminConfigItems(): JQuery[] {
    return [
        $('<a>').text('Clear Metasmoke Configuration').on('click', () => {
            MetaSmokeAPI.Reset();
            globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
        }),
        $('<a>').text('Clear chat fkey').on('click', () => {
            GreaseMonkeyCache.Unset(globals.CacheChatApiFkey);
            globals.displayStacksToast('Successfully cleared chat fkey.', 'success');
        })
    ].map(item => item.wrap(globals.gridCellDiv.clone()).parent());
}

function createCheckbox(text: string, storedValue: boolean | null, optionId: string = text.toLowerCase().replace(/\s/g, '_')): JQuery {
    const configHTML = globals.getConfigHtml(optionId, text);
    const input = configHTML.find('input');
    if (storedValue) input.prop('checked', true);

    return configHTML;
}

interface ConfigSection {
    SectionName: string;
    Items: JQuery[];
    onSave?(): void;
}

function createFlagTypeDiv(type: 'flag' | 'comment', displayName: string, flagId: number, reportType?: string): JQuery {
    const displayStyle = reportType ? 'd-block' : 'd-none';
    const expandableId = `${type}-${displayName}`.toLowerCase().replace(/\s/g, '');
    return $(`
<div class="s-sidebarwidget" data-flag-id=${flagId}>
  <button class="s-sidebarwidget--action s-btn s-btn__danger t4 r6 af-remove-expandable">Remove</button>
  <button class="s-sidebarwidget--action s-btn t4 r4 af-expandable-trigger"
          data-controller="s-expandable-control" aria-controls="${expandableId}">Edit</button>
  <button class="s-sidebarwidget--action s-btn s-btn__primary t4 r6 af-submit-content d-none">Save</button>
  <div class="s-sidebarwidget--content d-block p12 fs-body3">${displayName}</div>
  <div class="s-expandable" id="${expandableId}">
    <div class="s-expandable--content px8">
      <div class="advanced-flagging-flag-option py8 mln6 ${displayStyle}">
        <label class="fw-bold ps-relative d-inline-block z-selected l16">Flag as:</label>'
        <div class="s-select d-inline-block r48"><select class="pl64">${getFlagOptions(reportType || '')}</select></div>
      </div>
    </div>
  </div>
</div>`);
}

/* In this case, we are caching a FlagType, but removing unnecessary properties.
   Only the Id, FlagText, and Comments (both LowRep and HighRep) are cached if they exist.
   Sample cache (undefined values are empty strings):
       AdvancedFlagging.FlagTypes: [{
           Id: 1,
           FlagText: 'This is some text',
           Comments: {
               Low: 'This is a LowRep comment',
               High: ''
           },
           ReportType: 'PostOther'
       }, {
           Id: 2,
           FlagText: '',
           Comments: {
               Low: 'This is a LowRep comment',
               High: 'This is a HighRep comment'
           },
           ReportType: 'AnswerNotAnAnswer'
       }]

    Notes:
    - The Spam, Rude or Abusive and the - by default - NoFlag FlagTypes won't be displayed.
    - The ReportType can't be changed to/from PostOther.
    - The Human field is retrieved when the flag is raised based on ReportType.
    - Each div has a data-flag-id attribute based on which we can store the information on cache again
*/
function SetupCommentsAndFlagsModal(): void {
    const editCommentsPopup = globals.editCommentsPopup.clone();
    editCommentsPopup.find('.s-modal--close').append(Svg.ClearSm());
    const commentsWrapper = globals.commentsWrapper.clone();
    const flagsWrapper = globals.flagsWrapper.clone();
    editCommentsPopup.find('.s-modal--body').append(globals.editContentWrapper.clone().append(commentsWrapper, flagsWrapper));

    flagTypes.filter(item => item.DefaultComment || item.DefaultFlagText).forEach(flagType => {
        const comments = flagType.Comments;
        const flagText = flagType.FlagText;

        if (flagText) {
            const mainWrapper = createFlagTypeDiv('flag', flagType.DisplayName, flagType.Id);
            mainWrapper.find('.s-expandable--content').prepend(globals.getTextarea(flagText, 'af-flag-content'));
            flagsWrapper.append(mainWrapper);
        }

        if (!comments?.Low) return;
        const mainWrapper = createFlagTypeDiv('comment', flagType.DisplayName, flagType.Id, flagType.ReportType);
        const expandable = mainWrapper.find('.s-expandable--content');
        const labelDisplay = comments.High ? 'd-block' : 'd-none';
        const getLabel = (type: string): JQuery => $('<label>').addClass(`grid--cell s-label ${labelDisplay}`).html(`${type} comment`);
        if (comments.High) expandable.prepend(getLabel('HighRep').addClass('pt4'), globals.getTextarea(comments.High, 'af-highrep'));
        expandable.prepend(getLabel('LowRep'), globals.getTextarea(comments.Low, 'af-lowrep'));

        commentsWrapper.append(mainWrapper);
    });

    $(document).on('click', '.af-expandable-trigger', event => { // trigger the expandable
        const button = $(event.target), saveButton = button.next();
        button.text(button.text() === 'Edit' ? 'Hide' : 'Edit');
        saveButton.hasClass('d-none') ? globals.showElement(saveButton) : globals.hideElement(saveButton);
    }).on('click', '.af-submit-content', event => { // save changes
        const element = $(event.target), expandable = element.next().next();
        const flagId = Number(element.parents('.s-sidebarwidget').attr('data-flag-id'));
        if (!flagId) {
            globals.displayStacksToast('Failed to save options', 'danger');
            return;
        }

        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        const flagContent = expandable.find('.af-flag-content').val() as string || '';
        const commentLowRep = expandable.find('.af-lowrep').val() as string || '';
        const commentHighRep = expandable.find('.af-highrep').val() as string || '';
        if (!currentFlagType) {
            globals.displayStacksToast('Failed to save options', 'danger');
            return;
        }

        if (flagContent) currentFlagType.FlagText = flagContent;
        else currentFlagType.Comments = { Low: commentLowRep, High: commentHighRep };
        globals.updateFlagTypes();

        globals.displayStacksToast('Content saved successfully', 'success');
        element.prev().trigger('click'); // hide the textarea
    }).on('click', '.af-remove-expandable', event => {
        const removeButton = $(event.target), flagId = Number(removeButton.parent().attr('data-flag-id'));
        const flagTypeIndex = globals.cachedFlagTypes.findIndex(item => item.Id === flagId);
        globals.cachedFlagTypes.splice(flagTypeIndex, 1);
        globals.updateFlagTypes();
        removeButton.parent().remove();
        globals.displayStacksToast('Successfully removed this flag type', 'success');
    }).on('change', '.advanced-flagging-flag-option select', event => { // save a new report type
        const selectElement = $(event.target), newReportType = selectElement.val() as string;
        const flagId = Number(selectElement.parents('.s-sidebarwidget').attr('data-flag-id'));
        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) {
            globals.displayStacksToast('Failed to change the report flag type', 'danger');
            return;
        }

        currentFlagType.ReportType = newReportType;
        globals.updateFlagTypes();
        globals.displayStacksToast('Successfully changed the report flag type', 'success');
    });
    $('body').append(editCommentsPopup);
}
