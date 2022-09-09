import { GreaseMonkeyCache } from '../UserscriptTools/GreaseMonkeyCache';
import { MetaSmokeAPI } from '../UserscriptTools/MetaSmokeAPI';
import * as globals from '../shared';
import { Buttons, Modals, Checkbox } from '@userscripters/stacks-helpers';

type GeneralItems = Exclude<keyof globals.CachedConfiguration, 'EnabledFlags'>;

/* The configuration modal has two sections:
   - General (uses cache): general options. They are properties of the main
     Configuration object and accept Boolean values
     All options are disabled by default
   - Admin: doesn't use cache, but it interacts with it (deletes/amends values)
   Sample cache:

   Configuration: {
       OpenOnHover: true,
       AnotherOption: false,
       DoFooBar: true,
       ...
   }

   Notes:
   - In General, the checkboxes and the corresponding labels are wrapped
     in a div that has a data-option-id attribute.
     This is the property of the option that will be used in cache.
*/
export function buildConfigurationOverlay(): void {
    const modal = Modals.makeStacksModal(
        'advanced-flagging-configuration-modal',
        {
            title: {
                text: 'AdvancedFlagging configuration',
            },
            body: {
                bodyHtml: getConfigModalBody()
            },
            footer: {
                buttons: [
                    {
                        element: Buttons.makeStacksButton(
                            'advanced-flagging-configuration-modal-save',
                            'Save changes',
                            { primary: true }
                        ),
                    },
                    {
                        element: Buttons.makeStacksButton(
                            'advanced-flagging-configuration-modal-cancel',
                            'Cancel'
                        ),
                        hideOnClick: true
                    },
                    {
                        element: Buttons.makeStacksButton(
                            'advanced-flagging-configuration-modal-reset',
                            'Reset',
                            { type: ['danger'] }
                        )
                    }
                ]
            }
        }
    );

    document.body.append(modal);

    // event listener for "Save changes" button click
    modal
        .querySelector('.s-btn__primary')
        ?.addEventListener('click', event => {
            event.preventDefault();

            // find the option id (it's the data-option-id attribute)
            // and store whether the box is checked or not
            document
                .querySelectorAll('#advanced-flagging-configuration-section-general')
                .forEach(element => {
                    const container = element.closest<HTMLElement>('.d-flex');
                    const optionId = container?.dataset.optionId as GeneralItems;

                    const isChecked = (element as HTMLInputElement).checked;
                    globals.cachedConfiguration[optionId] = isChecked;
                });

            globals.updateConfiguration();
            globals.displayStacksToast('Configuration saved', 'success');

            setTimeout(() => window.location.reload(), 500);
        });

    const resetButton = document.querySelector('.s-btn__danger') as HTMLButtonElement;

    // reset configuration to defaults
    resetButton.addEventListener('click', () => {
        GreaseMonkeyCache.unset(globals.ConfigurationCacheKey);

        globals.displayStacksToast(
            'Configuration settings have been reset to defaults',
            'success'
        );

        setTimeout(() => window.location.reload(), 500);
    });

    globals.attachPopover(
        resetButton,
        'Resets config values to defaults. You will be prompted to reconfigure the script.',
        'right'
    );
}

function getGeneralConfigItems(): HTMLElement {
    const checkboxes = [
        {
            text: 'Open dropdown on hover',
            configValue: globals.ConfigurationOpenOnHover,
            tooltipText: 'Open the dropdown on hover and not on click'
        },
        {
            text: 'Watch for manual flags',
            configValue: globals.ConfigurationWatchFlags,
            tooltipText: 'Send feedback when a flag is raised manually'
        },
        {
            text: 'Watch for queue responses',
            configValue: globals.ConfigurationWatchQueues,
            tooltipText: 'Send feedback after a Looks OK or Recommend '
                       + 'Deletion review in the Low Quality Answers queue'
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
            configValue: globals.ConfigurationAddAuthorName,
            tooltipText: 'Add the author\'s name before every comment to make them friendlier'
        },
        {
            text: 'Don\'t send feedback to Smokey by default',
            configValue: globals.getCachedConfigBotKey('Smokey')
        },
        {
            text: 'Don\'t send feedback to Natty by default',
            configValue: globals.getCachedConfigBotKey('Natty')
        },
        {
            text: 'Don\'t send feedback to Guttenberg by default',
            configValue: globals.getCachedConfigBotKey('Guttenberg')
        },
        {
            text: 'Don\'t send feedback to Generic Bot by default',
            configValue: globals.getCachedConfigBotKey('Generic Bot')
        },
    ].map(({ text, configValue, tooltipText }) => {
        const selected = globals.cachedConfiguration[configValue as GeneralItems];

        return {
            id: configValue,
            labelConfig: {
                text,
                description: tooltipText,
            },
            selected
        };
    });

    const [fieldset] = Checkbox.makeStacksCheckboxes(checkboxes);
    fieldset.id = 'advanced-flagging-configuration-section-general';

    const header = document.createElement('h2');
    header.innerText = 'General';
    header.classList.add('flex--item');

    fieldset.prepend(header);

    return fieldset;
}

function getAdminConfigItems(): HTMLElement {
    const section = document.createElement('fieldset');
    section.id = 'advanced-flagging-configuration-section-admin';
    section.classList.add('d-flex', 'gs8', 'gsy', 'fd-column');

    const header = document.createElement('h2');
    header.innerText = 'Admin';
    header.classList.add('flex--item');

    const msInfoDiv = document.createElement('div');
    msInfoDiv.classList.add('flex--item');

    const clearMsInfo = document.createElement('a');
    clearMsInfo.innerText = 'Clear metasmoke configuration';
    clearMsInfo.addEventListener('click', () => {
        // reset metasmoke config
        MetaSmokeAPI.reset();

        globals.displayStacksToast(
            'Successfully cleared MS configuration.',
            'success',
            true
        );
    });

    const clearFkeyDiv = document.createElement('div');
    clearFkeyDiv.classList.add('flex--item');

    const clearChatFkey = document.createElement('a');
    clearChatFkey.innerText = 'Clear chat fkey';
    clearChatFkey.addEventListener('click', () => {
        // remove chat fkey
        GreaseMonkeyCache.unset(globals.CacheChatApiFkey);

        globals.displayStacksToast(
            'Successfully cleared chat fkey.',
            'success',
            true
        );
    });

    msInfoDiv.append(clearMsInfo);
    clearFkeyDiv.append(clearChatFkey);

    section.append(msInfoDiv, clearFkeyDiv);

    // show chat fkey and MS access token in the tooltip shown when hovering
    // over the reset options
    const chatFkey = GreaseMonkeyCache.getFromCache<string>(globals.CacheChatApiFkey);
    const msAccessTokenText = MetaSmokeAPI.accessToken
        // truncate the string because it's too long
        ? `token: ${MetaSmokeAPI.accessToken.substring(0, 32)}...`
        : 'access token is not stored in cache';

    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = 'This will clear the chat fkey. It will be regenerated '
                           + 'the next time feedback is sent to Natty '
                           + `(${chatFkey ? `fkey: ${chatFkey}` : 'fkey is not stored in cache'})`;

    globals.attachPopover(clearMsInfo, metasmokeTooltip, 'right');
    globals.attachPopover(clearChatFkey, fkeyClearTooltip, 'right');

    return section;
}

function getConfigModalBody(): HTMLDivElement {
    const div = document.createElement('div');

    const divider = document.createElement('hr');
    divider.classList.add('my16');

    div.append(
        getGeneralConfigItems(),
        divider,
        getAdminConfigItems()
    );

    return div;
}