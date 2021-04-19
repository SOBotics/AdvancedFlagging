import { MetaSmokeAPI} from './UserscriptTools/MetaSmokeAPI';
import { flagCategories, Flags } from './FlagTypes';
import { GreaseMonkeyCache } from './UserscriptTools/GreaseMonkeyCache';
import * as globals from './GlobalVars';

declare const StackExchange: globals.StackExchange;
declare const Stacks: globals.Stacks;
type GeneralItems = Exclude<keyof globals.CachedConfiguration, 'EnabledFlags'>;

const getEnabledFlags = (): number[] => globals.cachedConfigurationInfo?.EnabledFlags;
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
                BelongsTo: category.Name
            } as globals.CachedFlag;
        });
    });
    GreaseMonkeyCache.StoreInCache<globals.CachedFlag[]>(globals.FlagTypesKey, flagTypesToCache);
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
    GreaseMonkeyCache.StoreInCache<globals.CachedCategory[]>(globals.FlagCategoriesKey, categoriesInfoToCache);
    globals.cachedCategories.push(...categoriesInfoToCache);
}

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

    if (!globals.cachedFlagTypes.length || !globals.cachedFlagTypes[0].Feedbacks) cacheFlags();
    if (!globals.cachedCategories.length) cacheCategories();
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
    overlayModal.find('.s-modal--close').append(globals.getStacksSvg('Clear'));

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
                    .filter(el => $(el).prop('checked') && !$(el).parent().parent().hasClass('v-hidden')) // filter out hidden checkboxes
                    .map(el => Number(/\d+/.exec(el.id || '')) || 0)
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
    // reset configuration to defaults
    overlayModal.find('.af-configuration-reset').on('click', () => {
        GreaseMonkeyCache.Unset(globals.ConfigurationCacheKey);
        globals.displayStacksToast('Configuration settings have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    });

    $('body').append(overlayModal);
    // keep the checkboxes aligned by filling flagOptions with invisible ones
    // on large screens, we should use visibility: hidden, on smaller, display: none
    let flagOptions = $('.af-section-flags').children('div');
    const itemsToAdd = Math.ceil(flagOptions.length / 5) * 5 - flagOptions.length;
    const checkboxClone = flagOptions.first().clone().addClass('v-hidden md:d-none sm:d-none');
    [...Array(itemsToAdd).keys()].forEach(() => flagOptions = flagOptions.add(checkboxClone.clone()));
    for (let i = 0; i < flagOptions.length; i += 5) {
        flagOptions.slice(i, i + 5).wrapAll(globals.inlineCheckboxesWrapper.clone());
    }
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

    globals.cachedFlagTypes.forEach(flag => {
        const storedValue = enabledFlags.includes(flag.Id);
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

function createFlagTypeDiv(displayName: string, flagId: number, reportType: Flags): JQuery {
    const expandableId = `advanced-flagging-${flagId}-${displayName}`.toLowerCase().replace(/\s/g, '');
    const shouldBeDisabled = reportType === 'PostOther';
    const categoryDiv = $(`
<div class="s-sidebarwidget" data-flag-id=${flagId}>
    <button class="s-sidebarwidget--action s-btn s-btn__danger s-btn__icon t4 r6 af-remove-expandable">Remove</button>
    <button class="s-sidebarwidget--action s-btn s-btn__icon t4 r4 af-expandable-trigger"
            data-controller="s-expandable-control" aria-controls="${expandableId}">Edit</button>
    <button class="s-sidebarwidget--action s-btn s-btn__primary t4 r6 af-submit-content d-none">Save</button>
    <div class="s-sidebarwidget--content d-block p12 fs-body3">${displayName}</div>
        <div class="s-expandable" id="${expandableId}">
            <div class="s-expandable--content px8">
                <div class="advanced-flagging-flag-option py8 mln6">
                <label class="fw-bold ps-relative d-inline-block z-selected l16 ${shouldBeDisabled ? 'o50' : ''}">Flag as:</label>
                <div class="s-select d-inline-block r48">
                    <select class="pl64" ${shouldBeDisabled ? 'disabled' : ''}>${getFlagOptions(reportType)}</select>
                </div>
            </div>
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
           }
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
           }
       }]

    Notes:
    - The ReportType can't be changed to/from PostOther.
    - The Human field is retrieved on runtime when the flag is raised based on ReportType.
    - Each div has a data-flag-id attribute based on which we can store the information on cache again
    - Comments.Low is the low-rep comment ONLY if there is a high-rep comment. Otherwise it's the comment
      that will be used regardless of the OP's reputation. This appears to be the simplest approach
*/
function SetupCommentsAndFlagsModal(): void {
    const editCommentsPopup = globals.editCommentsPopup.clone();
    editCommentsPopup.find('.s-modal--close').append(globals.getStacksSvg('Clear'));

    const categoryElements = {} as { [key: string]: JQuery };
    globals.cachedCategories.forEach(category => categoryElements[category.Name] = createCategoryDiv(category.Name));

    globals.cachedFlagTypes.forEach(flagType => {
        const belongsToCategory = flagType.BelongsTo;
        const comments = flagType.Comments;
        const flagText = flagType.FlagText;

        const flagTypeDiv = createFlagTypeDiv(flagType.DisplayName, flagType.Id, flagType.ReportType);
        const expandable = flagTypeDiv.find('.s-expandable--content');
        const flagCategoryWrapper = categoryElements[belongsToCategory];

        const labelDisplay = comments.High ? 'd-block' : 'd-none'; // if there are two comments we want to show a label
        const lowRepLabel = comments.High ? 'LowRep comment' : 'Comment text'; // if there are two comments, add label for LowRep
        if (flagText) expandable.prepend(globals.getTextarea(flagText, 'Flag text', 'flag'));
        if (comments.High) expandable.prepend(globals.getTextarea(comments.High, 'HighRep comment', 'highrep', labelDisplay));
        if (comments.Low) expandable.prepend(globals.getTextarea(comments.Low, lowRepLabel, 'lowrep'));

        flagCategoryWrapper?.append(flagTypeDiv);
    });
    // now append all categories to the modal
    Object.values(categoryElements)
        .filter(categoryWrapper => categoryWrapper.children().length > 1) // the header is a child so the count must be >1
        .forEach(element => editCommentsPopup.find('.s-modal--body').children().append(element));

    $(document).on('click', '.af-expandable-trigger', event => { // trigger the expandable
        const button = $(event.target), saveButton = button.next();
        const pencilSvgHtml = globals.getStacksSvg('Pencil')[0].outerHTML;
        const eyeOffSvgHtml = globals.getStacksSvg('EyeOff')[0].outerHTML;
        const isExpanded = button.parent().find('.s-expandable').hasClass('is-expanded');
        button.html(isExpanded ? `${eyeOffSvgHtml} Hide` : `${pencilSvgHtml} Edit`);
        isExpanded ? globals.showElement(saveButton) : globals.hideElement(saveButton);
    }).on('click', '.af-submit-content', event => { // save changes
        const element = $(event.target), expandable = element.next().next();
        const flagId = Number(element.parents('.s-sidebarwidget').attr('data-flag-id'));
        if (!flagId) return globals.displayStacksToast('Failed to save options', 'danger');

        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to save options', 'danger'); // somehow something went wrong

        // use || '' to avoid null/undefined values in cache
        // each textarea has one of those three classes: af-flag-content, af-lowrep-content and af-highrep-content
        // for the flag text, the low-rep comment text and the high-rep comment text respectively
        const flagContent = expandable.find('.af-flag-content').val() as string || '';
        const commentLowRep = expandable.find('.af-lowrep-content').val() as string || '';
        const commentHighRep = expandable.find('.af-highrep-content').val() as string || '';

        if (flagContent) currentFlagType.FlagText = flagContent;
        if (commentLowRep) currentFlagType.Comments = { Low: commentLowRep, High: commentHighRep };
        globals.updateFlagTypes();

        globals.displayStacksToast('Content saved successfully', 'success');
        element.prev().trigger('click'); // hide the textarea by clicking the 'Hide' button and not manually
    }).on('click', '.af-remove-expandable', event => {
        const removeButton = $(event.target), flagId = Number(removeButton.parent().attr('data-flag-id'));
        const flagTypeIndex = globals.cachedFlagTypes.findIndex(item => item.Id === flagId);
        const categoryWrapper = removeButton.parent().parent(); // the flag category element that includes the FlagTypes
        globals.cachedFlagTypes.splice(flagTypeIndex, 1);
        globals.updateFlagTypes();

        removeButton.parent().remove(); // the parent element is the sidebar widget
        if (categoryWrapper.children().length === 1) categoryWrapper.remove(); // length === 1 => only the category header remains
        globals.displayStacksToast('Successfully removed flag type', 'success');
    }).on('click', '.af-comments-reset', () => {
        GreaseMonkeyCache.Unset(globals.FlagTypesKey);
        cacheFlags();
        globals.displayStacksToast('Comments and flags have been reset to defaults', 'success');
        setTimeout(() => window.location.reload(), 500);
    }).on('change', '.advanced-flagging-flag-option select', event => { // save a new report type
        const selectElement = $(event.target), newReportType = selectElement.val() as Flags;
        const flagId = Number(selectElement.parents('.s-sidebarwidget').attr('data-flag-id'));
        const currentFlagType = globals.getFlagTypeFromFlagId(flagId);
        if (!currentFlagType) return globals.displayStacksToast('Failed to change the report flag type', 'danger');
        if (newReportType === 'PostOther') return globals.displayStacksToast('Flag PostOther cannot be used with this option', 'danger');

        currentFlagType.ReportType = newReportType;
        globals.updateFlagTypes();
        globals.displayStacksToast('Successfully changed the flag type for this option', 'success');
    });
    $('body').append(editCommentsPopup);
}
