import { Cached, CachedCategory, CachedFlag, Store } from '../../UserscriptTools/Store';
import {
    getIconPath,
    displayStacksToast,
    getFlagTypeFromFlagId,
} from '../../shared';

import { submitChanges } from './submit';
import {
    getCommentInputs,
    getTextareas,
    getSelectRow,
    getRadioRow
} from './rows';

import { wrapInFlexItem, cacheFlags } from '../../Configuration';
import { getEmptyFlagType } from '../../FlagTypes';

import {
    Buttons,
    Modals,
    Toggle,
    Input,
} from '@userscripters/stacks-helpers';
import {
    IconEyeOff,
    IconPencil,
    IconPlus,
    IconTrash,
} from '@stackoverflow/stacks-icons/icons';

/* In this case, we are caching a FlagType, but removing unnecessary properties.
   Only the Id, FlagText, and Comments (both LowRep and HighRep) and the flag's name
   are cached if they exist.
   Sample cache (undefined values are empty strings):

       "FlagTypes": [
            {
                "id": 1,
                "displayName": "Spam",
                "reportType": "PostSpam",
                "feedbacks": {
                    "Smokey": "tpu-",
                    "Natty": "tp",
                    "Guttenberg": "",
                    "Generic Bot": "track"
                },
                "sendWhenFlagRaised": true,
                "belongsTo": "Red flags",
                "downvote": true,
                "enabled": true
            },
            {
                "id": 11,
                "displayName": "Comment",
                "reportType": "AnswerNotAnAnswer",
                "comments": {
                    "low": "low comment text",
                    "high": "This does not provide an answer to the question. Please write a comment instead."
                },
                "feedbacks": {
                    "Smokey": "naa-",
                    "Natty": "tp",
                    "Guttenberg": "",
                    "Generic Bot": "track"
                },
                "sendWhenFlagRaised": false,
                "belongsTo": "Answer-related",
                "downvote": true,
                "enabled": true
            },
        ]

    Notes:
    - The ReportType can't be changed to/from PostOther/PlagiarizedContent for default flags.
    - The Human field is retrieved on runtime when the flag is raised based on ReportType.
    - Each s-card div has a data-flag-id attribute based on which we can store the
      information on cache again.
    - Comments.Low is the low-rep comment ONLY if there is a high-rep comment.
      Otherwise it's the comment that will be used regardless of the OP's reputation.
      This appears to be the simplest approach
*/

export function toggleHideIfNeeded(parent: HTMLElement): void {
    const children = parent.firstElementChild?.children as HTMLCollection;

    const shouldHide = ([...children] as HTMLElement[])
        .every(element => element.style.display === 'none');

    parent.style.display = shouldHide ? 'none' : 'block';
}

function getExpandableContent(flagType: CachedFlag): HTMLElement[] {
    // four things:
    // - Leave comment toggle + include highrep checkbox
    // - Textareas
    // - Flag select + downvote + sendfeedback
    // - Bot feedback radios

    const content = [
        getCommentInputs(flagType),
        getTextareas(flagType),
        getSelectRow(flagType),
        getRadioRow(flagType)
    ].map(row => {
        const flexItem = wrapInFlexItem(row);
        toggleHideIfNeeded(flexItem);

        return flexItem;
    });

    return content;
}

// -----------------------------------------------------------------

function expandableToggled(edit: HTMLElement): void {
    const save = edit.previousElementSibling;
    const card = edit.closest<HTMLElement>('.s-card');
    const expandable = card?.querySelector('.s-expandable');

    if (!card || !save || !expandable) return;

    const isExpanded = expandable.classList.contains('is-expanded');

    // convert name to input (or input to name)
    const flagId = Number(card.dataset.flagId);
    card.firstElementChild?.classList.toggle('jc-space-between');

    if (isExpanded) {
        const name = card.querySelector('h3');
        const input = Input.makeStacksInput(
            `advanced-flagging-flag-name-${flagId}`,
            {
                classes: [ 's-input__md' ],
                value: name?.innerText ?? ''
            }
        );

        name?.replaceWith(input);
    } else {
        const input = card.querySelector<HTMLInputElement>(
            `#advanced-flagging-flag-name-${flagId}`
        );
        const h3 = getH3(input?.value ?? '');

        input
            ?.parentElement // input container
            ?.replaceWith(h3);
    }

    const [svg,, text] = [...edit.childNodes] as HTMLElement[];

    svg.insertAdjacentHTML('afterend', isExpanded ? IconEyeOff : IconPencil);
    svg.remove();
    text.textContent = isExpanded ? ' Hide' : 'Edit';

    isExpanded
        ? $(save).fadeIn('fast')
        : $(save).fadeOut('fast');
}

function getActionItems(
    flagId: number,
    enabled: boolean,
    expandableId: string
): HTMLElement[] {
    // action buttons in the card header:
    // - The save button (hidden if expanded = false)
    // - The edit button (or "hide button" if expanded = true)
    // - The remove button
    // - A toggle switch

    const save = Buttons.makeStacksButton(
        `advanced-flagging-save-flagtype-${flagId}`,
        'Save',
        {
            primary: true,
            classes: [ 'flex--item' ]
        }
    );
    save.style.display = 'none';
    save.addEventListener('click', () => submitChanges(save));

    const edit = Buttons.makeStacksButton(
        `advanced-flagging-edit-flagtype-${flagId}`,
        'Edit',
        {
            iconConfig: {
                name: 'iconPencil',
                path: getIconPath(IconPencil),
                height: 18,
                width: 18
            },
            classes: [ 'flex--item' ]
        }
    );
    edit.dataset.controller = 's-expandable-control';
    edit.setAttribute('aria-controls', expandableId);

    // listen to state change of expandables in our modal
    edit.addEventListener('s-expandable-control:hide', () => expandableToggled(edit));
    edit.addEventListener('s-expandable-control:show', () => expandableToggled(edit));

    const remove = Buttons.makeStacksButton(
        `advanced-flagging-remove-flagtype-${flagId}`,
        'Remove',
        {
            type: ['danger'],
            iconConfig: {
                name: 'iconTrash',
                path: getIconPath(IconTrash),
                width: 18,
                height: 18
            },
            classes: [ 'flex--item' ]
        }
    );

    remove.addEventListener('click', () => {
        const wrapper = remove.closest('.s-card') as HTMLElement;
        const flagId = Number(wrapper.dataset.flagId);

        // find index of current flag type
        const index = Store.flagTypes.findIndex(({ id }) => id === flagId);
        // remove the flag type from the list
        Store.flagTypes.splice(index, 1);

        // update the storage
        Store.updateFlagTypes();

        $(wrapper).fadeOut('fast', () => {
            const category = wrapper.parentElement;

            wrapper.remove();

            // if length is 1, then only the category header remains
            if (category?.childElementCount === 1) {
                $(category).fadeOut('fast', () => category.remove());
            }
        });

        displayStacksToast('Successfully removed flag type', 'success', true);
    });

    // (exclude label)
    const toggle = Toggle.makeStacksToggle(
        `advanced-flagging-toggle-flagtype-${flagId}`,
        { text: '' },
        enabled
    ).querySelector('.s-toggle-switch') as HTMLInputElement;

    // toggle the flagtype on change
    toggle.addEventListener('change', () => {
        const wrapper = toggle.closest<HTMLElement>('.s-card');
        const flagId = Number(wrapper?.dataset.flagId);

        const current = getFlagTypeFromFlagId(flagId);

        if (!current) {
            displayStacksToast('Failed to toggle flag type', 'danger', true);

            return;
        }

        // update the Enabled property depending on the switch
        // and store the updated object in cache
        current.enabled = toggle.checked;
        Store.updateFlagTypes();

        // update the card's style
        wrapper?.classList.toggle('s-card__muted');

        displayStacksToast(
            `Successfully ${toggle.checked ? 'en' : 'dis'}abled flag type`,
            'success',
            true
        );
    });

    return [save, edit, remove, toggle];
}

function getH3(displayName: string): HTMLHeadElement {
    const h3 = document.createElement('h3');
    h3.classList.add('mb0', 'mr-auto', 'fs-body3');
    h3.innerText = displayName;

    return h3;
}

function createFlagTypeDiv(flagType: CachedFlag): HTMLDivElement {
    const {
        id,
        displayName,
        enabled,
    } = flagType;

    // concatenate all 4 rows
    // since they have a .d-flex class,
    // they should be wrapped in a div.flex--item first

    const card = document.createElement('div');
    card.dataset.flagId = id.toString();
    card.classList.add('s-card', 'bs-sm', 'py4');

    if (!enabled) {
        card.classList.add('s-card__muted');
    }

    const idedName = displayName.toLowerCase().replace(/\s/g, '');
    const expandableId = `advanced-flagging-${id}-${idedName}`;

    // content visible without toggling the expandable
    const content = document.createElement('div');
    content.classList.add('d-flex', 'ai-center', 'sm:fd-column', 'sm:ai-start');

    const h3 = getH3(displayName);

    const actions = document.createElement('div');
    actions.classList.add('d-flex', 'g8', 'ai-center');

    actions.append(...getActionItems(id, enabled, expandableId));

    content.append(h3, actions);

    // expandable
    const expandableContent = getExpandableContent(flagType);

    const expandable = document.createElement('div');
    expandable.classList.add('s-expandable');
    expandable.id = expandableId;

    const expandableDiv = document.createElement('div');
    expandableDiv.classList.add(
        's-expandable--content',
        'd-flex',
        'fd-column',
        'g16',
        'py12'
    );
    expandableDiv.append(...expandableContent);

    expandable.append(expandableDiv);

    card.append(content, expandable);

    return card;
}

function createCategoryDiv(category: Partial<CachedCategory>): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add('flex--item');

    const wrapper = document.createElement('div');
    wrapper.classList.add('d-flex', 'ai-center', 'mb8');

    const header = document.createElement('h2');
    header.classList.add('flex--item', 'fs-title', 'mb0', 'mr-auto', 'fw-normal');
    header.textContent = category.name ?? '';

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('d-flex', 'g8', 'ai-center');

    const addNew = Buttons.makeStacksButton(
        `advanced-flagging-add-new-${category.id}`,
        'New',
        {
            type: [ 'outlined' ],
            iconConfig: {
                name: 'iconPlus',
                path: getIconPath(IconPlus),
                height: 18,
                width: 18
            },
        }
    );

    addNew.addEventListener('click', () => {
        const id = Math.max(...Store.flagTypes.map(({ id }) => id));

        const flagType = getEmptyFlagType(id + 1, category.name ?? '');
        Store.flagTypes.push(flagType);
        Store.updateFlagTypes();

        const div = createFlagTypeDiv(flagType);

        // fade in
        div.style.display = 'none';
        container.append(div);
        $(div).fadeIn({
            complete: () => {
                // click edit & focus on name input
                div.querySelector<HTMLButtonElement>('[id^="advanced-flagging-edit-flagtype-"]')?.click();
                div.querySelector<HTMLInputElement>('[id^="advanced-flagging-flag-name-"]')?.focus();
            }
        });
    });

    const flagTypes = Store.flagTypes.filter(({ belongsTo }) => belongsTo === category.name);
    const enabled = flagTypes.some(({ enabled }) => enabled);

    const toggle = Toggle.makeStacksToggle(
        `advanced-flagging-toggle-category-${category.id}`,
        { text: '' },
        enabled
    ).querySelector('.s-toggle-switch') as HTMLInputElement;

    toggle.addEventListener('change', () => {
        container
            .querySelectorAll('input[id^="advanced-flagging-toggle-flagtype-"]')
            .forEach(box => {
                (box as HTMLInputElement).checked = toggle.checked;
            });

        Store.flagTypes
            .filter(({ belongsTo }) => belongsTo === category.name)
            .forEach(flag => {
                flag.enabled = toggle.checked;

                const card = document.querySelector(`[data-flag-id="${flag.id}"]`);
                if (!card) return;

                card.classList[toggle.checked ? 'remove' : 'add']('s-card__muted');
            });
        Store.updateFlagTypes();

        displayStacksToast(
            `Successfully ${toggle.checked ? 'en' : 'dis'}abled all flag types from this category`,
            'success',
            true
        );
    });

    buttonContainer.append(addNew, toggle);
    wrapper.append(header, buttonContainer);
    container.append(wrapper);

    return container;
}

function getCommentsModalBody(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'g16');

    const categories = Store.categories
        .filter(({ name }) => name)
        .map(category => {
            const { name } = category;
            const div = createCategoryDiv(category);

            const flagTypes = Store.flagTypes
                // only those belonging to "Name" category
                .filter(({ belongsTo: BelongsTo }) => BelongsTo === name)
                // create the s-card
                .map(flagType => createFlagTypeDiv(flagType));

            div.append(...flagTypes);

            return div;
        })
        // the header is a child so the count must be > 1
        .filter(element => element.childElementCount > 1);

    container.append(...categories);

    return container;
}

function resetFlagTypes(): void {
    Store.unset(Cached.FlagTypes);
    cacheFlags();

    displayStacksToast(
        'Comments and flags have been reset to defaults',
        'success'
    );

    setTimeout(() => window.location.reload(), 500);
}

export function setupCommentsAndFlagsModal(): void {
    const modal = Modals.makeStacksModal(
        'advanced-flagging-comments-modal',
        {
            title: {
                text: 'Advanced Flagging: edit comments and flags',
            },
            body: {
                bodyHtml: getCommentsModalBody()
            },
            footer: {
                buttons: [
                    {
                        element: Buttons.makeStacksButton(
                            'advanced-flagging-comments-modal-done',
                            'I\'m done!',
                            { primary: true }
                        ),
                        hideOnClick: true
                    },
                    {
                        element: Buttons.makeStacksButton(
                            'advanced-flagging-comments-modal-cancel',
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
                                    handler: resetFlagTypes
                                }
                            }
                        ),
                    }
                ]
            },
            fullscreen: true,
        }
    );
    modal.firstElementChild?.classList.add('w80', 'sm:w100', 'md:w100');

    document.body.append(modal);
}
