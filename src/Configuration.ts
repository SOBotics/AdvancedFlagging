import { MetaSmokeAPI} from '@userscriptTools/MetaSmokeAPI';
import { flagCategories } from 'FlagTypes';
import { GreaseMonkeyCache } from '@userscriptTools/GreaseMonkeyCache';
import * as globals from './GlobalVars';

declare const Svg: globals.Svg;
declare const Stacks: globals.Stacks;

const configurationEnabledFlags = GreaseMonkeyCache.GetFromCache<number[]>(globals.ConfigurationEnabledFlags);

export async function SetupConfiguration(): Promise<void> {
    while (typeof Svg === 'undefined') {
        // eslint-disable-next-line no-await-in-loop
        await globals.Delay(1000);
    }
    const bottomBox = $('.site-footer--copyright').children('.-list');
    const configurationDiv = globals.configurationDiv.clone();
    const commentsDiv = globals.commentsDiv.clone();

    SetupDefaults();
    BuildConfigurationOverlay();
    SetupCommentsAndFlagsModal();
    const configurationLink = globals.configurationLink.clone();
    const commentsLink = globals.commentsLink.clone();
    $(document).on('click', '#af-modal-button', () => Stacks.showModal(document.querySelector('#af-config')));
    $(document).on('click', '#af-comments-button', () => Stacks.showModal(document.querySelector('#af-comments')));
    configurationDiv.append(configurationLink);
    commentsDiv.append(commentsLink);
    configurationDiv.insertAfter(bottomBox);
    commentsDiv.insertAfter(bottomBox);
}

function getFlagTypes(): { Id: number, DisplayName: string }[] {
    const flagTypes: { Id: number, DisplayName: string }[] = [];
    flagCategories.forEach(flagCategory => {
        flagCategory.FlagTypes.forEach(flagType => {
            flagTypes.push({
                Id: flagType.Id,
                DisplayName: flagType.DisplayName
            });
        });
    });
    return flagTypes;
}

function SetupDefaults(): void {
    if (!configurationEnabledFlags) {
        const flagTypeIds = getFlagTypes().map(f => f.Id);
        GreaseMonkeyCache.StoreInCache(globals.ConfigurationEnabledFlags, flagTypeIds);
    }
}

function BuildConfigurationOverlay(): void {
    const overlayModal = globals.overlayModal.clone();
    overlayModal.find('.s-modal--close').append(Svg.ClearSm());

    const sections: ConfigSection[] = [
        {
            SectionName: 'General',
            Items: GetGeneralConfigItems(),
            onSave: (): void => {
                $('.af-section-general').find('input').each((_index, el) => {
                    GreaseMonkeyCache.StoreInCache($(el).parents().eq(2).data('option-id'), $(el).prop('checked'));
                });
            }
        },
        {
            SectionName: 'Flags',
            Items: GetFlagSettings(),
            onSave: (): void => {
                const flagOptions = $('.af-section-flags').find('input').get()
                    .filter(el => $(el).prop('checked'))
                    .map(el => {
                        const postId = $(el).attr('id');
                        return postId ? Number(/\d+/.exec(postId)) : 0;
                    }).sort((a, b) => a - b);
                GreaseMonkeyCache.StoreInCache(globals.ConfigurationEnabledFlags, flagOptions);
            }
        },
        {
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

    const okayButton = overlayModal.find('.s-btn__primary');
    okayButton.click(event => {
        event.preventDefault();
        sections.forEach(section => {
            if (section.onSave) section.onSave();
        });
        globals.displayStacksToast('Configuration saved', 'success');
        setTimeout(() => window.location.reload(), 500);
    });

    $('body').append(overlayModal);
    $('label[for="flag-type-16"]').parent().removeClass('w25').css('width', '20.8%'); // because without it, the CSS breaks
    const flagOptions = $('.af-section-flags').children('div');
    for (let i = 0; i < flagOptions.length; i += 5) {
        flagOptions.slice(i, i + 5).wrapAll(globals.inlineCheckboxesWrapper.clone());
    }
}

function GetGeneralConfigItems(): JQuery[] {
    const checkboxArray: JQuery[] = [];
    const options = [
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
            text: 'Uncheck \'Comment\' by default',
            configValue: globals.ConfigurationDefaultNoComment
        },
        {
            text: 'Uncheck \'flag\' by default',
            configValue: globals.ConfigurationDefaultNoFlag
        },
    ];
    options.forEach(el => {
        const storedValue: boolean | null = GreaseMonkeyCache.GetFromCache(el.configValue);
        checkboxArray.push(createCheckbox(el.text, storedValue).attr('data-option-id', el.configValue));
    });
    return checkboxArray;
}

function GetFlagSettings(): JQuery[] {
    const checkboxes: JQuery[] = [];
    if (!configurationEnabledFlags) return checkboxes;

    getFlagTypes().forEach(f => {
        const storedValue = configurationEnabledFlags.indexOf(f.Id) > -1;
        const checkbox = createCheckbox(f.DisplayName, storedValue, `flag-type-${f.Id}`).children().eq(0);
        checkboxes.push(checkbox.addClass('w25 lg:w25 md:w100 sm:w100'));
    });
    return checkboxes;
}

function GetAdminConfigItems(): JQuery[] {
    return [
        $('<a>').text('Clear Metasmoke Configuration').click(() => {
            MetaSmokeAPI.Reset();
            globals.displayStacksToast('Successfully cleared MS configuration.', 'success');
        }),
        $('<a>').text('Clear chat fkey').click(() => {
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

function createEditTextarea(type: 'flag' | 'comment', displayName: string, cacheKey: string, content: string | null): JQuery {
    return $(`
<div class="s-sidebarwidget">
  <button class="s-sidebarwidget--action s-btn t4 r4 af-expandable-trigger"
          data-controller="s-expandable-control" aria-controls="${type}-${displayName}">Edit</button>
  <button class="s-sidebarwidget--action s-btn s-btn__primary t4 r6 af-submit-content d-none">Save</button>
  <div class="s-sidebarwidget--content d-block p12 fs-body2">${displayName}</div>
  <div class="s-expandable" id="${type}-${displayName}">
    <div class="s-expandable--content">
      <textarea class="grid--cell s-textarea ml8 mb8 fs-body2" rows="4" data-cache-key=${cacheKey}>${content || ''}</textarea>
    </div>
  </div>
</div>`);
}

function SetupCommentsAndFlagsModal(): void {
    const editCommentsPopup = globals.editCommentsPopup.clone();
    editCommentsPopup.find('.s-modal--close').append(Svg.ClearSm());
    const commentsWrapper = globals.commentsWrapper.clone();
    const flagsWrapper = globals.flagsWrapper.clone();
    const shouldAddAuthorName = GreaseMonkeyCache.GetFromCache(globals.CommentsAddAuthorName);
    editCommentsPopup.find('.s-modal--body')
        .append(globals.editContentWrapper.clone().append(commentsWrapper).append(flagsWrapper))
        .append(createCheckbox('Add OP\'s name before comments', Boolean(shouldAddAuthorName)).attr('class', 'af-author-name mt8'));

    const allFlags = globals.getAllFlags();
    const allComments = globals.getAllComments();
    allFlags.forEach(flag => {
        const textarea = createEditTextarea('flag', flag.flagName, globals.getFlagKey(flag.flagName), flag.content);
        flagsWrapper.append(textarea);
    });
    allComments.forEach(comment => {
        const textarea = createEditTextarea('comment', comment.commentName, globals.getCommentKey(comment.commentName), comment.content);
        commentsWrapper.append(textarea);
    });

    $(document).on('change', '.af-author-name', event => {
        GreaseMonkeyCache.StoreInCache(globals.CommentsAddAuthorName, $(event.target).is(':checked'));
        globals.displayStacksToast('Preference updated', 'success');
    }).on('click', '.af-expandable-trigger', event => {
        const button = $(event.target);
        button.text(button.text() === 'Edit' ? 'Hide' : 'Edit');
        const element = button.next();
        element.hasClass('d-none') ? globals.showElement(element) : globals.hideElement(element);
    }).on('click', '.af-submit-content', event => {
        const element = $(event.target);
        const contentTextarea = element.next().next().find('textarea');
        const newContent = contentTextarea.val();
        const cacheKey = contentTextarea.attr('data-cache-key');
        if (!cacheKey) return;
        const displayName = element.next().text();
        GreaseMonkeyCache.StoreInCache(cacheKey, newContent);
        globals.displayStacksToast(displayName + ': content saved successfully', 'success');
        element.prev().click(); // hide the textarea
    });
    $('body').append(editCommentsPopup);
}
