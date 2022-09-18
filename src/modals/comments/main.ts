import { Store } from '../../UserscriptTools/Store';
import {
    getIconPath,
    cachedFlagTypes,
    updateFlagTypes,
    displayStacksToast,
    getFlagTypeFromFlagId,
    cachedCategories,
    Cached
} from '../../shared';

import { submitChanges } from './submit';
import {
    getCommentInputs,
    getTextareas,
    getSelectRow,
    getRadioRow
} from './rows';

import { CachedFlag } from '../../shared';
import { wrapInFlexItem, cacheFlags } from '../../Configuration';

import {
    Buttons,
    Modals,
    Toggle,
} from '@userscripters/stacks-helpers';

/* In this case, we are caching a FlagType, but removing unnecessary properties.
   Only the Id, FlagText, and Comments (both LowRep and HighRep) and the flag's name
   are cached if they exist.
   Sample cache (undefined values are empty strings):

       FlagTypes: [{
           Id: 1,
           DisplayName: 'Plagiarism',
           FlagText: 'This is some text',
           Comments: {
               Low: 'This is a LowRep comment',
               High: ''
           },
           ReportType: 'PostOther',
           Feedbacks: {
               Smokey: 'tp-',
               Natty: 'tp',
               Guttenberg: 'tp'
               'Generic Bot': 'track'
           },
           BelongsTo: 'Guttenberg mod-flags',
           IsDefault: true,
           SendWhenFlagRaised: false,
           Downvote: false,
           Enabled: false
       }, {
           Id: 2,
           DisplayName: 'Not an answer',
           FlagText: '',
           Comments: {
               Low: 'This is a LowRep comment',
               High: 'This is a HighRep comment'
           },
           ReportType: 'AnswerNotAnAnswer',
           Feedbacks: {
               Smokey: 'fp-',
               Natty: 'ne',
               Guttenberg: 'fp'
               'Generic Bot': ''
           },
           BelongsTo: 'Answer-related',
           IsDefault: false,
           SendWhenFlagRaised: true,
           Downvote: true,
           Enabled: true
       }]

    Notes:
    - The ReportType can't be changed to/from PostOther for default flags.
    - The Human field is retrieved on runtime when the flag is raised based on ReportType.
    - Each s-card div has a data-flag-id attribute based on which we can store the
      information on cache again.
    - Comments.Low is the low-rep comment ONLY if there is a high-rep comment.
      Otherwise it's the comment that will be used regardless of the OP's reputation.
      This appears to be the simplest approach
*/

export function toggleHideIfNeeded(parent: HTMLElement): void {
    const shouldHide = [...parent.firstElementChild?.children as HTMLCollection]
        .every(element => element.classList.contains('d-none'));

    parent.classList[shouldHide ? 'add' : 'remove']('d-none');
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
    const expandable = edit
        .closest('.s-card') // get the parent
        ?.querySelector('.s-expandable'); // then the expandable
    if (!save || !expandable) return;

    const isExpanded = expandable.classList.contains('is-expanded');

    const pencil = getIconPath('iconPencil');
    const eyeOff = getIconPath('iconEyeOff');

    const [svg,, text] = [...edit.childNodes] as HTMLElement[];

    svg.classList.toggle('iconPencil');
    svg.classList.toggle('iconEyeOff');
    svg.firstElementChild?.setAttribute('d', isExpanded ? eyeOff : pencil);
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
                path: getIconPath('iconPencil'),
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
                path: getIconPath('iconTrash'),
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
        const index = cachedFlagTypes.findIndex(item => item.Id === flagId);
        // remove the flag type from the list
        cachedFlagTypes.splice(index, 1);

        // update the storage
        updateFlagTypes();

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
    ).querySelector('.s-toggle-switch') as HTMLDivElement;

    const input = toggle.firstElementChild as HTMLInputElement;

    // toggle the flagtype on change
    input.addEventListener('change', () => {
        const wrapper = input.closest<HTMLElement>('.s-card');
        const flagId = Number(wrapper?.dataset.flagId);

        const current = getFlagTypeFromFlagId(flagId);

        if (!current) {
            displayStacksToast('Failed to toggle flag type', 'danger', true);

            return;
        }

        // update the Enabled property depending on the switch
        // and store the updated object in cache
        current.Enabled = input.checked;
        updateFlagTypes();

        // update the card's style
        wrapper?.classList.toggle('s-card__muted');

        displayStacksToast(
            `Successfully ${input.checked ? 'en' : 'dis'}abled flag type`,
            'success',
            true
        );
    });

    return [save, edit, remove, toggle];
}

function createFlagTypeDiv(
    flagType: CachedFlag
): HTMLDivElement {
    const {
        Id,
        DisplayName,
        Enabled,
    } = flagType;

    // concatenate all 4 rows
    // since they have a .d-flex class,
    // they should be wrapped in a div.flex--item first

    const card = document.createElement('div');
    card.dataset.flagId = Id.toString();
    card.classList.add('s-card', 'bs-sm', 'py4');

    if (!Enabled) {
        card.classList.add('s-card__muted');
    }

    const idedName = DisplayName.toLowerCase().replace(/\s/g, '');
    const expandableId = `advanced-flagging-${Id}-${idedName}`;

    // content visible without toggling the expandable
    const content = document.createElement('div');
    content.classList.add('d-flex', 'ai-center', 'sm:fd-column', 'sm:ai-start');

    const h3 = document.createElement('h3');
    h3.classList.add('mb0', 'mr-auto', 'fs-body3');
    h3.innerText = DisplayName;

    const actions = document.createElement('div');
    actions.classList.add('d-flex', 'gs8', 'ai-center');

    actions.append(...getActionItems(Id, Enabled, expandableId));

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

function createCategoryDiv(displayName: string): HTMLDivElement {
    const container = document.createElement('div');
    container.classList.add('flex--item');

    const header = document.createElement('h2');
    header.classList.add('ta-center', 'mb8', 'fs-title');
    header.innerHTML = displayName;

    container.append(header);

    return container;
}

function getCommentsModalBody(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gs16');

    const categories = cachedCategories
        .filter(({ Name }) => Name)
        .map(({ Name: name }) => {
            const div = createCategoryDiv(name || '');

            const flagTypes = cachedFlagTypes
                // only those belonging to "Name" category
                .filter(({ BelongsTo }) => BelongsTo === name)
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
                text: 'AdvancedFlagging: edit comments and flags',
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
