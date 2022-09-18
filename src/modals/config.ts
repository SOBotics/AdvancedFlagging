import { Store } from '../UserscriptTools/Store';
import { MetaSmokeAPI } from '../UserscriptTools/MetaSmokeAPI';

import {
    Configuration,
    cachedConfiguration,
    updateConfiguration,
    displayStacksToast,
    attachPopover,
    Cached,
    getCachedConfigBotKey
} from '../shared';

import { Buttons, Modals, Checkbox } from '@userscripters/stacks-helpers';

type GeneralItems = Exclude<keyof Configuration, 'EnabledFlags'>;

function saveChanges(): void {
    // find the option id (it's the data-option-id attribute)
    // and store whether the box is checked or not
    document
        .querySelectorAll('#advanced-flagging-configuration-section-general > div > input')
        .forEach(element => {
            const id = element.id as GeneralItems;
            const checked = (element as HTMLInputElement).checked;

            cachedConfiguration[id] = checked;
        });

    updateConfiguration();
    displayStacksToast('Configuration saved', 'success');

    setTimeout(() => window.location.reload(), 500);
}

function resetConfig(): void {
    Store.unset(Cached.Configuration.key);

    displayStacksToast(
        'Configuration settings have been reset to defaults',
        'success'
    );

    setTimeout(() => window.location.reload(), 500);
}

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
                            {
                                primary: true,
                                click: {
                                    handler: event => {
                                        event.preventDefault();

                                        saveChanges();
                                    }
                                }
                            },
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
                            {
                                type: [ 'danger' ],
                                click: {
                                    handler: resetConfig
                                }
                            }
                        )
                    }
                ]
            },
            fullscreen: true
        }
    );
    modal.firstElementChild?.classList.add('w60');

    document.body.append(modal);

    const resetButton = document.querySelector('.s-btn__danger') as Element;

    attachPopover(
        resetButton,
        'Resets config values to defaults. You will be prompted to reconfigure the script.',
        'right'
    );
}

function getGeneralConfigItems(): HTMLElement {
    const checkboxes = [
        {
            text: 'Open dropdown on hover',
            configValue: Cached.Configuration.openOnHover,
            tooltipText: 'Open the dropdown on hover and not on click'
        },
        {
            text: 'Watch for manual flags',
            configValue: Cached.Configuration.watchFlags,
            tooltipText: 'Send feedback when a flag is raised manually'
        },
        {
            text: 'Watch for queue responses',
            configValue: Cached.Configuration.watchQueues,
            tooltipText: 'Send feedback after a Looks OK or Recommend '
                       + 'Deletion review in the Low Quality Answers queue'
        },
        {
            text: 'Disable AdvancedFlagging link',
            configValue: Cached.Configuration.linkDisabled
        },
        {
            text: 'Uncheck \'Leave comment\' by default',
            configValue: Cached.Configuration.defaultNoComment
        },
        {
            text: 'Uncheck \'Flag\' by default',
            configValue: Cached.Configuration.defaultNoFlag
        },
        {
            text: 'Uncheck \'Downvote\' by default',
            configValue: Cached.Configuration.defaultNoDownvote
        },
        {
            text: 'Add author\'s name before comments',
            configValue: Cached.Configuration.addAuthorName,
            tooltipText: 'Add the author\'s name before every comment to make them friendlier'
        },
        {
            text: 'Don\'t send feedback to Smokey by default',
            configValue: getCachedConfigBotKey('Smokey')
        },
        {
            text: 'Don\'t send feedback to Natty by default',
            configValue: getCachedConfigBotKey('Natty')
        },
        {
            text: 'Don\'t send feedback to Guttenberg by default',
            configValue: getCachedConfigBotKey('Guttenberg')
        },
        {
            text: 'Don\'t send feedback to Generic Bot by default',
            configValue: getCachedConfigBotKey('Generic Bot')
        },
        {
            text: 'Enable debug mode',
            configValue: Cached.Configuration.debug
        }
    ].map(({ text, configValue, tooltipText }) => {
        const selected = cachedConfiguration[configValue as GeneralItems];

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

    return fieldset;
}

function getAdminConfigItems(): HTMLElement {
    const section = document.createElement('fieldset');
    section.id = 'advanced-flagging-configuration-section-admin';
    section.classList.add('d-flex', 'gs8', 'gsy', 'fd-column', 'fs-body2');

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

        displayStacksToast(
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
        Store.unset(Cached.Fkey);

        displayStacksToast(
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
    const chatFkey = Store.get<string>(Cached.Fkey);
    const msAccessTokenText = MetaSmokeAPI.accessToken
        // truncate the string because it's too long
        ? `token: ${MetaSmokeAPI.accessToken.substring(0, 32)}...`
        : 'no access token found in storage';

    const metasmokeTooltip = `This will remove your metasmoke access token (${msAccessTokenText})`;
    const fkeyClearTooltip = 'This will clear the chat fkey. It will be regenerated '
                           + 'the next time feedback is sent to Natty '
                           + `(${chatFkey ? `fkey: ${chatFkey}` : 'fkey is not stored in cache'})`;

    attachPopover(clearMsInfo, metasmokeTooltip, 'right');
    attachPopover(clearChatFkey, fkeyClearTooltip, 'right');

    return section;
}

function getConfigModalBody(): HTMLDivElement {
    const div = document.createElement('div');

    const divider = document.createElement('hr');
    divider.classList.add('my16');

    const general = document.createElement('h2');
    general.innerText = 'General';

    const admin = document.createElement('h2');
    admin.innerText = 'Admin';

    div.append(
        general,
        getGeneralConfigItems(),
        divider,
        admin,
        getAdminConfigItems()
    );

    return div;
}