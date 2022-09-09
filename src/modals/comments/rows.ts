import {
    CachedFlag,
    getHumanFromDisplayName,
    BotNames,
    AllFeedbacks,
    possibleFeedbacks,
} from '../../shared';
import { flagCategories } from '../../FlagTypes';
import { wrapInFlexItem, isModOrNoFlag } from '../../Configuration';

import {
    Checkbox,
    Toggle,
    Textarea,
    Select,
    Radio
} from '@userscripters/stacks-helpers';

const flagTypes = flagCategories.flatMap(category => category.FlagTypes);
const flagNames = [...new Set(flagTypes.map(flagType => flagType.ReportType))];

function getCharSpan(
    textarea: HTMLTextAreaElement,
    contentType: 'comment' | 'flag'
): HTMLSpanElement {
    const content = textarea.value;

    // different char limits for mod flags and comments
    const minCharacters = contentType === 'flag' ? 10 : 15;
    const maxCharacters = contentType === 'flag' ? 500 : 600;

    const charCount = content.length;
    const diff = Math.abs(charCount - maxCharacters);

    const pluralS = diff !== 1 ? 's' : '';

    // behaves the same way as the comment/custom flag textarea
    // if there are zero characters => Enter at least x characters
    // if the min character limit isn't exceeded => x more to go...
    // if the min character limit is exceeded but the max isn't => x characters left
    // if the max character limit is exceeded => too long by x characters
    let spanText: string;

    // decide the validation text
    if (charCount === 0) spanText = `Enter at least ${minCharacters} characters`;
    else if (charCount < minCharacters) spanText = `${minCharacters - charCount} more to go...`;
    else if (charCount > maxCharacters) spanText = `Too long by ${diff} character${pluralS}`;
    else spanText = `${diff} character${pluralS} left`;

    // find the class name based on the characters remaining, not the characters already entered!!
    let classname: 'cool' | 'warm' | 'hot' | 'supernova' | 'fc-red-400';

    // decide the class to add on the validation text
    if (charCount > maxCharacters) classname = 'fc-red-400';
    else if (diff >= maxCharacters * 3 / 5) classname = 'cool';
    else if (diff >= maxCharacters * 2 / 5) classname = 'warm';
    else if (diff >= maxCharacters / 5) classname = 'hot';
    else classname = 'supernova';

    // the form is invalid if there are more or less characters than the limit
    const isInvalid = classname === 'fc-red-400' || /more|at least/.test(spanText);
    if (isInvalid) {
        textarea.classList.add('is-invalid');
    }

    const span = document.createElement('span');
    span.classList.add('ml-auto', classname);
    span.innerText = spanText;

    return span;
}

function toggleTextarea(
    element: Element,
    comment: 'low' | 'high',
    type: 'In' | 'Out'
): void {
    const wrapper = element.closest('.s-card');
    const textarea = wrapper
        ?.querySelector(`[id*="-comment-${comment}rep"]`);

    if (!textarea) return;

    $(textarea)[`fade${type}`](400, () => {
        textarea.classList.toggle('d-none');
        textarea.classList.toggle('d-flex');
    });
}

// Row #1: Comment options
export function getCommentInputs(
    { Id, Comments }: CachedFlag,
): HTMLDivElement {
    // Consists of:
    // - Leave comment switch
    // - HighRep checkbox, disabled when the switch is off

    const container = document.createElement('div');
    container.classList.add('d-flex', 'ai-center', 'gs12');

    const toggleContainer = document.createElement('div');
    toggleContainer.classList.add('flex--item');

    const toggle = Toggle.makeStacksToggle(
        `advanced-flagging-comments-toggle-${Id}`,
        { text: 'Leave comment' },
        Boolean(Comments?.Low)
    );
    toggleContainer.append(toggle);

    const [, checkbox] = Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-toggle-highrep-${Id}`,
            labelConfig: {
                text: 'Add a different comment for high reputation users'
            },
            selected: Boolean(Comments?.High),
            disabled: !Comments?.Low
        },
    ]);

    // event listener after checkbox has been defined, so we can use it
    const input = toggle.querySelector('input') as HTMLInputElement;

    input.addEventListener('change', () => {
        // toggle disabled class
        checkbox.classList.toggle('is-disabled');

        const cbInput = checkbox.querySelector('input') as HTMLInputElement;
        // leave comment checked => disabled = false
        cbInput.disabled = !input.checked;

        if (input.checked) {
            toggleTextarea(input, 'low', 'In');
        } else {
            toggleTextarea(input, 'low', 'Out');
            toggleTextarea(input, 'high', 'Out');
        }
    });

    const cbInput = checkbox.querySelector('input') as HTMLInputElement;
    cbInput.addEventListener('change', () => {
        toggleTextarea(
            cbInput,
            'high',
            cbInput.checked ? 'In' : 'Out'
        );

        const lowLabel = cbInput
            .closest('.s-card')
            ?.querySelector('label[for*="-comment-lowrep-"]') as HTMLLabelElement;

        lowLabel.innerText = cbInput.checked
            ? 'Comment text for low reputation users'
            : 'Comment text';
    });

    container.append(toggleContainer, checkbox);

    return container;
}

// Row #2: Textareas
export function getTextareas({
    Id,
    FlagText,
    Comments
}: CachedFlag): HTMLElement {
    // Consists of the Low/High Rep comments + flag text
    // Only the relevant ones are shown (display: flex)
    // The others are hidden

    const flag = Textarea.makeStacksTextarea(
        `advanced-flagging-text-modflag-${Id}`,
        { value: FlagText },
        { text: 'Flag text' }
    );

    const lowRep = Textarea.makeStacksTextarea(
        `advanced-flagging-comment-lowrep-${Id}`,
        { value: Comments?.Low },
        // if there is a high rep comment, change the wording of the label
        { text: 'Comment text' + (Comments?.High ? ' for low reputation users' : '') },
    );

    const highRep = Textarea.makeStacksTextarea(
        `advanced-flagging-comment-highrep-${Id}`,
        { value: Comments?.High },
        { text: 'Comment text for high reputation users' },
    );

    const wrappers = [flag, lowRep, highRep].map(element => {
        const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
        textarea.classList.add('fs-body2'); // increase font size
        textarea.style.height = `${textarea.scrollHeight + 2}px`; // fit to content

        const contentType = textarea.id.includes('flag') ? 'flag' : 'comment';

        // append chataracters string
        const charsLeft = getCharSpan(textarea, contentType);
        textarea.insertAdjacentElement('afterend', charsLeft);

        // change the string on keyup
        textarea.addEventListener('keyup', function() {
            const newCharsLeft = getCharSpan(this, contentType);

            this.nextElementSibling?.replaceWith(newCharsLeft);
        });

        return wrapInFlexItem(element);
    });

    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gsy', 'gs16');
    container.append(...wrappers);

    return container;
}

// Row #3: "Flag" select + extra options

function getFlagSelect(
    Id: CachedFlag['Id'],
    ReportType: CachedFlag['ReportType']
): HTMLElement[] {
    const options = flagNames.map(flagName => {
        return {
            value: flagName,
            text: getHumanFromDisplayName(flagName) || '(none)',
            selected: flagName === ReportType
        };
    });

    const select = Select.makeStacksSelect(
        `advanced-flagging-select-flag-${Id}`,
        options,
        { text: 'test' }, // TODO replace functionality, check stacks-helpers
        { disabled: ReportType === 'PostOther' }
    );
    select.className = 'd-flex ai-center';

    // correctly position container & select
    const sSelect = select.children[1] as HTMLDivElement;
    sSelect.style.right = '28px';
    select.querySelector('select')?.classList.add('pl48');

    const flagLabel = document.createElement('label');
    flagLabel.classList.add('fw-bold', 'ps-relative', 'z-selected', 'l12', 'fs-body1', 'flex--item');
    flagLabel.innerText = 'Flag:';

    return [flagLabel, select];
}

export function getSelectRow({
    Id,
    SendWhenFlagRaised,
    Downvote,
    ReportType
}: CachedFlag): HTMLDivElement {
    // Consists of:
    // - The "Flag as" select
    // - The "Send feedback from this flagtype..." checkbox
    // - The "Downvote checkbox"

    const [label, select] = getFlagSelect(Id, ReportType);

    const [, feedback] = Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-send-when-flag-raised-${Id}`,
            labelConfig: {
                text: 'Send feedback from this flag type when this flag is raised'
            },
            selected: SendWhenFlagRaised
        }
    ]);

    const [, downvote] = Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-downvote-post-${Id}`,
            labelConfig: {
                text: 'Downvote post'
            },
            selected: Downvote
        },
    ]);

    const container = document.createElement('div');
    container.classList.add('d-flex', 'ai-center', 'gsx', 'gs6');
    container.append(
        label,
        select,
        wrapInFlexItem(downvote)
    );

    if (!isModOrNoFlag(ReportType)) {
        container.append(wrapInFlexItem(feedback));
    }

    return container;
}

// Row #4: Bot feedback radios
function getRadiosForBot(
    botName: BotNames,
    currentFeedback: AllFeedbacks,
    flagId: number
): HTMLElement {
    // loop through the bot names and respective feedbacks,
    // then generate the HTML

    const feedbacks = possibleFeedbacks[botName];

    const idedName = botName.replace(/\s/g, '-');
    const name = `advanced-flagging-${flagId}-feedback-to-${idedName}`;

    const config = feedbacks.map(feedback => {
        return {
            id: `advanced-flagging-${idedName}-feedback-${feedback}-${flagId}`,
            labelConfig: {
                text: feedback || '(none)',
            },
            selected: feedback === currentFeedback
        };
    });

    const [fieldset] = Radio.makeStacksRadios(config, name, { horizontal: true });
    // add data-feedback attribute
    fieldset.querySelectorAll('input').forEach(radio => {
        const feedback = radio.id.split('-').pop();

        radio.dataset.feedback = feedback;
    });

    const description = document.createElement('div');
    description.classList.add('flex--item');
    description.innerText = `Feedback to ${botName}:`;

    fieldset.prepend(description);

    return fieldset;
}

export function getRadioRow({ Id, Feedbacks }: CachedFlag): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gsy', 'gs8');

    const feedbackRadios = Object
        .keys(possibleFeedbacks)
        .map(item => {
            const botName = item as BotNames;

            return getRadiosForBot(botName, Feedbacks[botName], Id);
        })
        .map(checkbox => wrapInFlexItem(checkbox));

    container.append(...feedbackRadios);

    return container;
}