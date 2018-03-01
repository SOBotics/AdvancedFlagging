import { getFromCaches, storeInCaches, ConfigurationWatchFlags, ConfigurationWatchQueues, ConfigurationDetectAudits, displaySuccess, metaSmokeKey } from 'AdvancedFlagging';
import { MetaSmokeAPI, MetaSmokeDisabledConfig } from '@userscriptTools/metasmokeapi/MetaSmokeAPI';
import { CrossDomainCache } from '@userscriptTools/caching/CrossDomainCache';

export function SetupConfiguration() {
    const bottomBox = $('.-copyright, text-right').children('.g-column').children('.-list');

    const configurationDiv = $('<div>')
        .css('line-height', '18px')
        .css('text-align', 'right')
        .css('padding', '5px');

    const configurationLink = $('<a href="javascript:void(0);">AdvancedFlagging configuration</a>');
    configurationLink.click(() => BuildConfigurationOverlay());

    configurationDiv.append(configurationLink);
    bottomBox.append(configurationDiv);
}

async function BuildConfigurationOverlay() {
    const overlay = $('<div>')
        .css('position', 'fixed')
        .css('padding-top', '100px')
        .css('left', 0)
        .css('top', 0)
        .css('width', '100%')
        .css('height', '100%')
        .css('overflow', 'auto')
        .css('background-color', '#cccccc')
        .css('background-color', 'rgba(0,0,0,0.4)')
        ;

    const overlayContent = $('<div>')
        .css('background-color', '#fefefe')
        .css('margin', 'auto')
        .css('padding', '20px')
        .css('border', '1px solid #888')
        .css('width', '80%')
        ;

    const configElements: ConfigElement[] = [];

    overlayContent.append('<h1>AdvancedFlagging configuration</h1>');

    const sections: ConfigSection[] = [
        {
            SectionName: 'General',
            Items: await GetGeneralConfigItems()
        },
        {
            SectionName: 'Admin',
            Items: await GetAdminConfigItems()
        }
    ];
    let firstSection = true;
    sections.forEach(section => {
        if (!firstSection) {
            overlayContent.append('<hr />');
        }
        overlayContent.append(`<h2>${section.SectionName}</h2>`);
        firstSection = false;
        const sectionWrapper = $('<ul>').css('list-style', 'none');
        overlayContent.append(sectionWrapper);

        section.Items.forEach(item => {
            configElements.push(item);
            const listItem = $('<li>').css('line-height', '18px');
            listItem.append(item.element);
            sectionWrapper.append(listItem);
        });
    });

    const submitButtons = $('<div>')
        .css('text-align', 'right');

    const okayButton = $('<input type="button" value="Save changes">');
    const cancelButton = $('<a href="#">Cancel</a>')
        .css('margin-right', '15px');

    okayButton.click((event) => {
        event.preventDefault();
        configElements.forEach(configElement => {
            if (configElement.onSave) {
                configElement.onSave();
            }
        });
        overlay.remove();
        displaySuccess('Configuration saved');
    });
    cancelButton.click((event) => {
        event.preventDefault();
        overlay.remove();
    });

    submitButtons.append(cancelButton);
    submitButtons.append(okayButton);

    overlayContent.append(submitButtons);
    overlay.append(overlayContent);
    $(document.body).append(overlay);
}

async function GetGeneralConfigItems() {
    return Promise.all([
        createConfigCheckbox('Watch for manual flags', ConfigurationWatchFlags),
        createConfigCheckbox('Watch for queue responses', ConfigurationWatchQueues),
        createConfigCheckbox('Detect audits', ConfigurationDetectAudits),
    ]);
}

async function GetAdminConfigItems() {
    return [
        {
            element: $('<a />').text('Clear Metasmoke Configuration')
                .click(async () => {
                    await MetaSmokeAPI.Reset();
                })
        },
        {
            element: $('<a />').text('Get MetaSmoke key')
                .attr('href', `https://metasmoke.erwaysoftware.com/oauth/request?key=${metaSmokeKey}`)
        },
        {
            element: $('<a />').text('Manually register MetaSmoke key')
                .click(async () => {
                    const prompt = window.prompt('Enter metasmoke key');
                    if (prompt) {
                        CrossDomainCache.StoreInCache(MetaSmokeDisabledConfig, false);
                        localStorage.setItem('MetaSmoke.ManualKey', prompt);
                    }
                })
        }
    ];
}

async function createConfigCheckbox(text: string, configValue: string): Promise<ConfigElement> {
    const checkBox = $('<input type="checkbox">');
    const label = $('<label />')
        .append(checkBox)
        .append(text);
    const storedValue = await getFromCaches(configValue);
    if (storedValue) {
        checkBox.prop('checked', true);
    }
    return {
        element: label,
        onSave: async () => {
            const isChecked = !!checkBox.prop('checked');
            await storeInCaches(configValue, isChecked);
        }
    };
}

interface ConfigSection {
    SectionName: string;
    Items: ConfigElement[];
}

interface ConfigElement {
    element: JQuery;
    onSave?: () => Promise<void>;
}
