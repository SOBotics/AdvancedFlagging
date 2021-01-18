import { ConfigurationWatchFlags, ConfigurationWatchQueues, displaySuccess, metaSmokeKey, ConfigurationEnabledFlags, ConfigurationOpenOnHover, ConfigurationLinkDisabled, ConfigurationDefaultNoFlag, ConfigurationDefaultNoComment } from 'AdvancedFlagging';
import { MetaSmokeAPI, MetaSmokeDisabledConfig } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';
import { flagCategories } from 'FlagTypes';
import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';

declare const Stacks: any;

export async function SetupConfiguration() {
    const bottomBox = $('.site-footer--copyright').children('.-list');
    const configurationDiv = $('<div>').attr('id', 'advanced-flagging-configuration-div');

    SetupDefaults();
    BuildConfigurationOverlay();
    const configurationLink = $('<a id="af-modal-button">AdvancedFlagging configuration</a>');
    $(document).on('click', '#af-modal-button', () => Stacks.showModal(document.querySelector('#af-config')));
    configurationDiv.append(configurationLink);
    configurationDiv.insertAfter(bottomBox);
}

function getFlagTypes() {
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

function SetupDefaults() {
    const configurationEnabledFlags = GreaseMonkeyCache.GetFromCache<number[]>(ConfigurationEnabledFlags);
    if (!configurationEnabledFlags) {
        const flagTypeIds = getFlagTypes().map(f => f.Id);
        GreaseMonkeyCache.StoreInCache(ConfigurationEnabledFlags, flagTypeIds);
    }
}

function BuildConfigurationOverlay() {
    const overlayModal = $(
        '<aside class="s-modal" id="af-config" role="dialog" aria-labelledby="af-modal-title"'
        + '       aria-describedby="af-modal-description" aria-hidden="true"'
        + '    data-controller="s-modal" data-target="s-modal.modal">'
        + '    <div class="s-modal--dialog s-modal__full w60" role="document">'
        + '        <h1 class="s-modal--header fw-body c-movey" id="af-modal-title">AdvancedFlagging configuration</h1>'
        + '        <div class="s-modal--body fs-body2" id="af-modal-description"></div>'
        + '        <div class="grid gs8 gsx s-modal--footer">'
        + '            <button class="grid--cell s-btn s-btn__primary" type="button">Save changes</button>'
        + '            <button class="grid--cell s-btn" type="button" data-action="s-modal#hide">Cancel</button>'
        + '        </div>'
        + '        <button class="s-modal--close s-btn s-btn__muted" href="#" aria-label="Close" data-action="s-modal#hide">'
        + '            <svg aria-hidden="true" class="svg-icon iconClearSm" width="14" height="14" viewBox="0 0 14 14"><path d="M12 3.41L10.59 2 7 5.59 3.41 2 2 3.41 5.59 7 2 10.59 3.41 12 7 8.41 10.59 12 12 10.59 8.41 7 12 3.41z"></path></svg>'
        + '        </button>'
        + '    </div>'
        + '</aside>');

    const sections: ConfigSection[] = [
        {
            SectionName: 'General',
            Items: GetGeneralConfigItems(),
            onSave: () => {
                $('.af-section-general').find('input').each((_index, el) => {
                    GreaseMonkeyCache.StoreInCache($(el).parents().eq(2).data('option-id'), $(el).prop('checked'));
                });
            }
        },
        {
            SectionName: 'Flags',
            Items: GetFlagSettings(),
            onSave: () => {
                const flagOptions = $('.af-section-flags').find('input').get().filter(el => $(el).prop('checked')).map(el => Number($(el).attr('id').match(/\d+/)));
                GreaseMonkeyCache.StoreInCache(ConfigurationEnabledFlags, flagOptions);
            }
        },
        {
            SectionName: 'Admin',
            Items: GetAdminConfigItems()
        }
    ];

    let firstSection = true;
    sections.forEach(section => {
        if (!firstSection) {
            overlayModal.find('#af-modal-description').append('<hr>');
        }
        firstSection = false;

        const sectionWrapper = $('<fieldset>').attr('class', 'grid gs8 gsy fd-column af-section-' + section.SectionName.toLowerCase())
            .html(`<h2 class="grid--cell">${section.SectionName}</h2>`);
        overlayModal.find('#af-modal-description').append(sectionWrapper);

        section.Items.forEach((element: JQuery) => sectionWrapper.append(element));
    });

    const okayButton = overlayModal.find('.s-btn__primary');
    okayButton.click((event) => {
        event.preventDefault();
        sections.forEach(section => {
            if (section.onSave) section.onSave();
        });
        displaySuccess('Configuration saved');
        setTimeout(window.location.reload.bind(window.location), 500)
    });

    $('body').append(overlayModal);
    $('label[for="flag-type-12"]').parent().removeClass('w25').css('width', '18.3%'); // because without it, the CSS breaks
    const flagOptions = $('.af-section-flags').children('div');
    for (let i = 0; i < flagOptions.length; i += 5) {
        flagOptions.slice(i, i + 5).wrapAll('<div class="grid--cell"><div class="grid gs16"></div></div>');
    }
}

function GetGeneralConfigItems() {
    const checkboxArray: JQuery[] = [];
    const options = [
        {
            text: 'Open dropdown on hover',
            configValue: ConfigurationOpenOnHover
        },
        {
            text: 'Watch for manual flags',
            configValue: ConfigurationWatchFlags
        },
        {
            text: 'Watch for queue responses',
            configValue: ConfigurationWatchQueues
        },
        {
            text: 'Disable AdvancedFlagging link',
            configValue: ConfigurationLinkDisabled
        },
        {
            text: 'Uncheck \'Comment\' by default',
            configValue: ConfigurationDefaultNoComment
        },
        {
            text: 'Uncheck \'flag\' by default',
            configValue: ConfigurationDefaultNoFlag
        },
    ];
    options.forEach(el => {
        const storedValue: boolean | undefined =  GreaseMonkeyCache.GetFromCache(el.configValue);
        checkboxArray.push(createCheckbox(el.text, storedValue).attr('data-option-id', el.configValue))
    });
    return checkboxArray;
}

function GetFlagSettings() {
    const checkboxes: JQuery[] = [];
    const flagTypeIds = GreaseMonkeyCache.GetFromCache<number[]>(ConfigurationEnabledFlags) || [];

    getFlagTypes().forEach(f => {
        const storedValue = flagTypeIds.indexOf(f.Id) > -1;
        checkboxes.push(createCheckbox(f.DisplayName, storedValue, 'flag-type-' + f.Id).children().eq(0).addClass('w25'));
    });
    return checkboxes;
}

function GetAdminConfigItems() {
    return [
        $('<a>').text('Clear expired items from cache').click(() => GreaseMonkeyCache.ClearExpiredKeys()),
        $('<a>').text('Clear Metasmoke Configuration').click(async () => { await MetaSmokeAPI.Reset(); }),
        $('<a>').text('Get MetaSmoke key').attr('href', `https://metasmoke.erwaysoftware.com/oauth/request?key=${metaSmokeKey}`),
        $('<a>').text('Manually register MetaSmoke key')
            .click(() => {
                const prompt = window.prompt('Enter metasmoke key');
                if (prompt) {
                    GreaseMonkeyCache.StoreInCache(MetaSmokeDisabledConfig, false);
                    localStorage.setItem('MetaSmoke.ManualKey', prompt);
                }
            }),
        $('<a>').text('Clear chat FKey')
            .click(() => {
                // Hard-code SOBotics for now
                const roomId = 111347;
                const fkeyCacheKey = `StackExchange.ChatApi.FKey_${roomId}`;
                GreaseMonkeyCache.Unset(fkeyCacheKey);
            })
    ].map(item => item.wrap('<div class="grid--cell">').parent())
}

function createCheckbox(text: string, storedValue: boolean | undefined, optionId: string = text.toLowerCase().replace(/\s/g, '_')): JQuery {
    const configHTML = $('<div>'
                       + '  <div class="grid gs8 gsx">'
                       + '    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="' + optionId + '"/></div>'
                       + '    <label class="grid--cell s-label fw-normal" for="' + optionId + '">' + text + '</label>'
                       + '  </div>'
                       + '</div>');
    const input = configHTML.find('input');
    if (storedValue) {
        input.prop('checked', true);
    }

    return configHTML;
}

interface ConfigSection {
    SectionName: string;
    Items: JQuery[];
    onSave?: any;
}
