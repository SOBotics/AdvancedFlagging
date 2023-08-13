import {
    CachedFlag,
    getHumanFromDisplayName,
    BotNames,
    AllFeedbacks,
    possibleFeedbacks,
    FlagNames,
} from '../../shared';
import { flagCategories } from '../../FlagTypes';
import { wrapInFlexItem, isPlagiarismOrNoFlag } from '../../Configuration';
import { toggleHideIfNeeded } from './main';

import {
    Checkbox,
    Toggle,
    Textarea,
    Select,
    Radio
} from '@userscripters/stacks-helpers';

const flagTypes = flagCategories.flatMap(({ FlagTypes }) => FlagTypes);
const flagNames = [...new Set(flagTypes.map(({ reportType }) => reportType))];

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
    textarea.classList[isInvalid ? 'add' : 'remove']('is-invalid');

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
    const wrapper = element
        .closest('.s-card')
        ?.querySelector(`[id*="-comment-${comment}rep"]`)
        ?.closest('div.flex--item') as HTMLElement | undefined;

    if (!wrapper) return;

    const row = wrapper
        .parentElement
        ?.parentElement as HTMLDivElement;

    // in case we're asked to show a textarea,
    // make the row visible, so the fadeIn effect will be visible
    if (type === 'In') {
        row.style.display = 'block';
    }

    $(wrapper)[`fade${type}`](400, () => {
        toggleHideIfNeeded(row);
    });
}

// Row #1: Comment options
export function getCommentInputs(
    { id, comments }: CachedFlag,
): HTMLDivElement {
    // Consists of:
    // - Leave comment switch
    // - HighRep checkbox, disabled when the switch is off

    const container = document.createElement('div');
    container.classList.add('d-flex', 'ai-center', 'g16');

    const toggleContainer = document.createElement('div');
    toggleContainer.classList.add('flex--item');

    const toggle = Toggle.makeStacksToggle(
        `advanced-flagging-comments-toggle-${id}`,
        { text: 'Leave comment' },
        Boolean(comments?.low)
    );
    toggleContainer.append(toggle);

    const [, checkbox] = Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-toggle-highrep-${id}`,
            labelConfig: {
                text: 'Add a different comment for high reputation users'
            },
            selected: Boolean(comments?.high),
            disabled: !comments?.low,
        },
    ]);
    checkbox.classList.add('fs-body2', 'pt1');

    // event listener after checkbox has been defined, so we can use it
    const toggleInput = toggle.querySelector('input') as HTMLInputElement;
    const cbInput = checkbox.querySelector('input') as HTMLInputElement;

    toggleInput.addEventListener('change', () => {
        const cbInput = checkbox.querySelector('input') as HTMLInputElement;
        // leave comment checked => disabled = false
        cbInput.disabled = !toggleInput.checked;

        if (toggleInput.checked) {
            toggleTextarea(toggleInput, 'low', 'In');
            if (cbInput.checked) {
                toggleTextarea(toggleInput, 'high', 'In');
            }

            checkbox.classList.remove('is-disabled');
        } else {
            toggleTextarea(toggleInput, 'low', 'Out');
            toggleTextarea(toggleInput, 'high', 'Out');

            checkbox.classList.add('is-disabled');
        }
    });

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

    container.append(toggleContainer, wrapInFlexItem(checkbox));

    return container;
}

// Row #2: Textareas
export function getTextareas({
    id,
    flagText,
    comments
}: CachedFlag): HTMLElement {
    // Consists of the Low/High Rep comments + flag text
    // Only the relevant ones are shown (display: flex)
    // The others are hidden

    const flag = Textarea.makeStacksTextarea(
        `advanced-flagging-text-modflag-${id}`,
        { value: flagText },
        { text: 'Flag text' }
    );

    const lowRep = Textarea.makeStacksTextarea(
        `advanced-flagging-comment-lowrep-${id}`,
        { value: comments?.low },
        // if there is a high rep comment, change the wording of the label
        { text: 'Comment text' + (comments?.high ? ' for low reputation users' : '') },
    );

    const highRep = Textarea.makeStacksTextarea(
        `advanced-flagging-comment-highrep-${id}`,
        { value: comments?.high },
        { text: 'Comment text for high reputation users' },
    );

    const wrappers = [flag, lowRep, highRep].map(element => {
        const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
        textarea.classList.add('fs-body2'); // increase font size
        //textarea.style.height = `${textarea.scrollHeight + 2}px`; // fit to content
        textarea.rows = 4;

        const contentType = textarea.id.includes('comment')
            ? 'comment'
            : 'flag';

        // append chataracters string
        const charsLeft = getCharSpan(textarea, contentType);
        textarea.insertAdjacentElement('afterend', charsLeft);

        // change the string on keyup
        textarea.addEventListener('keyup', function() {
            const newCharsLeft = getCharSpan(this, contentType);

            this.nextElementSibling?.replaceWith(newCharsLeft);
        });

        const wrapper = wrapInFlexItem(element);

        wrapper.style.display = textarea.value
            ? 'block'
            : 'none';

        return wrapper;
    });

    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gsy', 'gs16');
    container.append(...wrappers);

    return container;
}

// Row #3: "Flag" select + extra options

function getFlagSelect(
    id: CachedFlag['id'],
    reportType: CachedFlag['reportType']
): HTMLElement[] {
    const options = flagNames.map(flagName => {
        return {
            value: flagName,
            text: getHumanFromDisplayName(flagName) || '(none)',
            selected: flagName === reportType
        };
    });

    const select = Select.makeStacksSelect(
        `advanced-flagging-select-flag-${id}`,
        options,
        { disabled: reportType === FlagNames.Plagiarism }
    );
    select.className = 'd-flex ai-center';

    // correctly position container & select
    const sSelect = select.querySelector('.s-select') as HTMLDivElement;
    sSelect.style.right = '35px';
    select.querySelector('select')?.classList.add('pl48');

    const flagLabel = document.createElement('label');
    flagLabel.classList.add('fw-bold', 'ps-relative', 'z-selected', 'l12', 'fs-body1', 'flex--item');
    flagLabel.innerText = 'Flag:';

    if (reportType === FlagNames.Plagiarism) {
        flagLabel.classList.add('o50');
    }

    return [flagLabel, select];
}

export function getSelectRow({
    id,
    sendWhenFlagRaised,
    downvote,
    reportType
}: CachedFlag): HTMLDivElement {
    // Consists of:
    // - The "Flag as" select
    // - The "Send feedback from this flagtype..." checkbox
    // - The "Downvote checkbox"

    const [label, select] = getFlagSelect(id, reportType);

    const [, feedback] = Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-send-when-flag-raised-${id}`,
            labelConfig: {
                text: 'Send feedback from this flag type when this flag is raised'
            },
            selected: sendWhenFlagRaised
        }
    ]);

    const [, downvoteBox] = Checkbox.makeStacksCheckboxes([
        {
            id: `advanced-flagging-downvote-post-${id}`,
            labelConfig: {
                text: 'Downvote post'
            },
            selected: downvote
        },
    ]);

    const container = document.createElement('div');
    container.classList.add('d-flex', 'ai-center', 'gsx', 'gs6');
    container.append(
        label,
        select,
        wrapInFlexItem(downvoteBox)
    );

    if (!isPlagiarismOrNoFlag(reportType)) {
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

    const [fieldset] = Radio.makeStacksRadios(config, name, {
        horizontal: true,
        classes: [ 'fs-body2' ]
    });
    // add data-feedback attribute
    fieldset.querySelectorAll('input').forEach(radio => {
        const label = radio.nextElementSibling as HTMLElement;
        const feedback = label.innerText || '';

        radio.dataset.feedback = feedback === '(none)' ? '' : feedback;
    });

    const description = document.createElement('div');
    description.classList.add('flex--item');
    description.innerText = `Feedback to ${botName}:`;

    fieldset.prepend(description);

    return fieldset;
}

export function getRadioRow({ id, feedbacks }: CachedFlag): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('d-flex', 'fd-column', 'gsy', 'gs4');

    const feedbackRadios = Object
        .keys(possibleFeedbacks)
        .map(item => {
            const botName = item as BotNames;

            return getRadiosForBot(botName, feedbacks[botName], id);
        })
        .map(checkbox => wrapInFlexItem(checkbox));

    container.append(...feedbackRadios);

    return container;
}