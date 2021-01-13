import { ConfigurationWatchFlags, ConfigurationWatchQueues, ConfigurationDetectAudits, displaySuccess, metaSmokeKey, ConfigurationEnabledFlags, ConfigurationOpenOnHover, ConfigurationLinkDisabled, ConfigurationDefaultNoFlag, ConfigurationDefaultNoComment } from 'AdvancedFlagging';
import { MetaSmokeAPI, MetaSmokeDisabledConfig } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';
import { flagCategories } from 'FlagTypes';
import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';

declare const Stacks: any;

export async function SetupConfiguration() {
    const bottomBox = $('.site-footer--copyright').children('.-list');
    const configurationDiv = $('<div>')
        .css('line-height', '18px')
        .css('text-align', 'left')
        .css('padding', '5px');

    await SetupDefaults();
    await BuildConfigurationOverlay();
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

async function SetupDefaults() {
    const configurationEnabledFlags = GreaseMonkeyCache.GetFromCache<number[]>(ConfigurationEnabledFlags);
    if (!configurationEnabledFlags) {
        const flagTypeIds = getFlagTypes().map(f => f.Id);
        GreaseMonkeyCache.StoreInCache(ConfigurationEnabledFlags, flagTypeIds);
    }
}

async function BuildConfigurationOverlay() {
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

    const configElements: ConfigElement[] = [];
    const sections: ConfigSection[] = [
        {
            SectionName: 'General',
            Items: await GetGeneralConfigItems()
        },
        {
            SectionName: 'Flags',
            Items: await GetFlagSettings()
        },
        {
            SectionName: 'Admin',
            Items: await GetAdminConfigItems()
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
        section.Items.forEach(item => {
            configElements.push(item);
            if (item.element) {
                sectionWrapper.append(item.element);
            }
        });
    });

    const okayButton = overlayModal.find('.s-btn__primary');
    okayButton.click((event) => {
        event.preventDefault();
        let requiresReload = false;
        configElements.forEach(configElement => {
            if (configElement.onSave) {
                configElement.onSave();
            }
            requiresReload = !!configElement.requiresReload;
        });
        displaySuccess('Configuration saved');
        if (requiresReload) {
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    });

    $('body').append(overlayModal);
    $('label[for="flag-type-12"]').parent().removeClass('w25').css('width', '18.3%'); // because without it, the CSS breaks
    const flagOptions = $('.af-section-flags').children('div');
    for (let i = 0; i < flagOptions.length; i += 5) {
        flagOptions.slice(i, i + 5).wrapAll('<div class="grid--cell"><div class="grid gs16"></div></div>');
    }
}

async function GetGeneralConfigItems() {
    return Promise.all([
        createConfigCheckbox('Open dropdown on hover', ConfigurationOpenOnHover),
        createConfigCheckbox('Watch for manual flags', ConfigurationWatchFlags),
        createConfigCheckbox('Watch for queue responses', ConfigurationWatchQueues),
        createConfigCheckbox('Disable AdvancedFlagging link', ConfigurationLinkDisabled),
        createConfigCheckbox('Uncheck \'Comment\' by default', ConfigurationDefaultNoComment),
        createConfigCheckbox('Uncheck \'flag\' by default', ConfigurationDefaultNoFlag)
    ]);
}

async function GetFlagSettings() {
    const checkBoxes: { configHTML: JQuery, checkBox: JQuery, Id: number }[] = [];
    const flagTypeIds = GreaseMonkeyCache.GetFromCache<number[]>(ConfigurationEnabledFlags) || [];
    const flagHTML = (id: string, name: string) =>
        $('<div class="grid gs8 gsx w25">'
        + '  <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="' + id + '"></div>'
        + '  <label class="grid--cell s-label fw-normal" for="' + id + '">' + name + '</label>'
        + '</div>');

    getFlagTypes().forEach(f => {
        const configHTML = flagHTML('flag-type-' + f.Id, f.DisplayName);
        const storedValue = flagTypeIds.indexOf(f.Id) > -1;
        const checkBox = configHTML.find('input');
        if (storedValue) {
            checkBox.prop('checked', true);
        }
        checkBoxes.push({
            configHTML,
            checkBox,
            Id: f.Id
        });
    });

    const returnArr: ConfigElement[] = checkBoxes.map(f => ({ element: f.configHTML }));
    returnArr.push({
        onSave: async () => {
            // Something here
            const updatedFlagTypes = checkBoxes.filter(cb => !!cb.checkBox.prop('checked')).map(cb => cb.Id);
            GreaseMonkeyCache.StoreInCache(ConfigurationEnabledFlags, updatedFlagTypes);
        },
        requiresReload: true
    });
    return returnArr;
}

async function GetAdminConfigItems() {
    return [
        {
            element: $('<a>').text('Clear expired items from cache').click(() => GreaseMonkeyCache.ClearExpiredKeys())
                             .wrap('<div class="grid--cell">').parent(),
            requiresReload: true
        },
        {
            element: $('<a>').text('Clear Metasmoke Configuration').click(async () => { await MetaSmokeAPI.Reset(); })
                             .wrap('<div class="grid--cell">').parent(),
            requiresReload: true
        },
        {
            element: $('<a>').text('Get MetaSmoke key')
                             .attr('href', `https://metasmoke.erwaysoftware.com/oauth/request?key=${metaSmokeKey}`)
                             .wrap('<div class="grid--cell">').parent()
        },
        {
            element: $('<a>').text('Manually register MetaSmoke key')
                .click(async () => {
                    const prompt = window.prompt('Enter metasmoke key');
                    if (prompt) {
                        GreaseMonkeyCache.StoreInCache(MetaSmokeDisabledConfig, false);
                        localStorage.setItem('MetaSmoke.ManualKey', prompt);
                    }
                })
                .wrap('<div class="grid--cell">').parent(),
            requiresReload: true
        }, {
            element: $('<a>').text('Clear chat FKey')
                .click(async () => {
                    // Hard-code SOBotics for now
                    const roomId = 111347;
                    const fkeyCacheKey = `StackExchange.ChatApi.FKey_${roomId}`;
                    GreaseMonkeyCache.Unset(fkeyCacheKey);
                })
                .wrap('<div class="grid--cell">').parent(),
            requiresReload: true
        }
    ];
}

async function createConfigCheckbox(text: string, configValue: string): Promise<ConfigElement> {
    const optionId = text.toLowerCase().replace(/\s/g, '_');
    const configHTML = $('<div>'
                       + '  <div class="grid gs8 gsx">'
                       + '    <div class="grid--cell"><input class="s-checkbox" type="checkbox" id="' + optionId + '"/></div>'
                       + '    <label class="grid--cell s-label fw-normal" for="' + optionId + '">' + text + '</label>'
                       + '  </div>'
                       + '</div>');
    const input = configHTML.find('input');
    const storedValue = GreaseMonkeyCache.GetFromCache(configValue);
    if (storedValue) {
        input.prop('checked', true);
    }

    return {
        element: configHTML,
        onSave: async () => {
            const isChecked = !!input.prop('checked');
            GreaseMonkeyCache.StoreInCache(configValue, isChecked);
        }
    };
}

interface ConfigSection {
    SectionName: string;
    Items: ConfigElement[];
}

interface ConfigElement {
    element?: JQuery;
    onSave?: () => Promise<void>;
    requiresReload?: boolean;
}
