import { Cached, Configuration, Store } from '../UserscriptTools/Store';
import { MetaSmokeAPI } from '../UserscriptTools/MetaSmokeAPI';

import { displayStacksToast, attachPopover, configBoxes } from '../shared';

import { Buttons, Modals, Checkbox } from '@userscripters/stacks-helpers';
import Reporter from '../UserscriptTools/Reporter';

type GeneralItems = Exclude<keyof Configuration, 'default'>;

function saveChanges(): void {
    // find the option id and store whether the box is checked or not
    document
        .querySelectorAll('#advanced-flagging-configuration-section-general input')
        .forEach(element => {
            const id = element.id;
            const key = id.split('-').pop();
            const checked = (element as HTMLInputElement).checked;

            if (id.startsWith('advanced-flagging-default')) {
                Store.config.default[key as keyof Configuration['default']] = checked;
            } else {
                Store.config[key as GeneralItems] = checked;
            }
        });

    Store.updateConfiguration();
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
     Configuration object and accept Boolean values.
   - Admin: doesn't use cache, but it interacts with it (deletes/amends values)
   Sample cache:

   Configuration: {
       openOnHover: true,
       anotherOption: false,
       doFooBar: true,
       checkByDefault: {
           natty: true,
           ...,
           comment: false,
           delete: true,
           ...
       },
       ...
   }

   Notes:
   - In General, the checkboxes and the corresponding labels are wrapped
     in a div that has a data-option-id attribute.
     This is the property of the option that will be used in cache.
   - The user is prompted to set up configuration settings
     if the Configuration value is not defined in Storage.
*/
export function buildConfigurationOverlay(): void {
    const modal = Modals.makeStacksModal(
        'advanced-flagging-configuration-modal',
        {
            title: {
                text: 'Advanced Flagging configuration',
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

    const resetButton = modal.querySelector('.s-btn__danger') as Element;

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
            description: 'Open the dropdown on hover and not on click'
        },
        {
            text: 'Watch for manual flags',
            configValue: Cached.Configuration.watchFlags,
            description: 'Send feedback when a flag is raised manually'
        },
        {
            text: 'Watch for queue responses',
            configValue: Cached.Configuration.watchQueues,
            description: 'Send feedback after a Looks OK or Recommend '
                       + 'Deletion review in the Low Quality Answers queue'
        },
        {
            text: 'Add author\'s name before comments',
            configValue: Cached.Configuration.addAuthorName,
            description: 'Add the author\'s name before every comment to make them friendlier'
        },
        {
            text: 'Disable Advanced Flagging link',
            configValue: Cached.Configuration.linkDisabled
        },
        {
            text: 'Enable dry-run mode',
            configValue: Cached.Configuration.debug
        }
    ].map(({ text, configValue, description }) => {
        const selected = Store.config[configValue as GeneralItems] as boolean;

        return {
            id: `advanced-flagging-${configValue}`,
            labelConfig: {
                text,
                description,
            },
            selected
        };
    });

    // Send feedback to <bot name> by default
    const botBoxes = (['Smokey', 'Natty', 'Generic Bot', 'Guttenberg'] as const)
        .map(name => {
            const reporter = new Reporter(name, 0);
            const sanitised = reporter.sanitisedName;
            const selected = Store.config.default[sanitised];

            return {
                id: `advanced-flagging-default-${sanitised}`,
                labelConfig: {
                    text: name
                },
                selected
            };
        });
    const [defaultFeedback] = Checkbox.makeStacksCheckboxes(
        botBoxes,
        {
            horizontal: true,
            classes: [ 'fs-body2' ]
        }
    );

    const botDescription = document.createElement('div');
    botDescription.classList.add('flex--item');
    botDescription.innerText = 'Send feedback by default to:';

    defaultFeedback.prepend(botDescription);

    // Check <option text> by default
    const optionBoxes = configBoxes
        .map(([ name, sanitised ]) => {
            const selected = Store.config.default[sanitised];

            return {
                id: `advanced-flagging-default-${sanitised}`,
                labelConfig: {
                    text: name
                },
                selected
            };
        });
    const [defaultCheck] = Checkbox.makeStacksCheckboxes(
        optionBoxes,
        {
            horizontal: true,
            classes: [ 'fs-body2' ]
        }
    );
    const optionDescription = document.createElement('div');
    optionDescription.classList.add('flex--item');
    optionDescription.innerText = 'Check the following by default:';

    defaultCheck.prepend(optionDescription);

    const [fieldset] = Checkbox.makeStacksCheckboxes(checkboxes);
    fieldset.id = 'advanced-flagging-configuration-section-general';
    fieldset.append(defaultFeedback, defaultCheck);

    return fieldset;
}

function getAdminConfigItems(): HTMLElement {
    const section = document.createElement('fieldset');
    section.id = 'advanced-flagging-configuration-section-admin';
    section.classList.add('d-flex', 'g8', 'fd-column', 'fs-body2');

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
