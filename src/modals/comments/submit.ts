import {
    displayStacksToast,
    CachedFlag,
    cachedFlagTypes,
    FlagTypeFeedbacks,
    getFlagTypeFromFlagId,
    updateFlagTypes,
} from '../../shared';
import { Flags } from '../../FlagTypes';

function saveTextareaContent(
    expandable: Element,
    flagType: CachedFlag
): void {
    // use || '' to avoid null/undefined values in cache
    const [flag, low, high] =
        [
            'text-modflag',
            'comment-lowrep',
            'comment-highrep'
        ]
            .map(id => expandable.querySelector<HTMLTextAreaElement>(`[id*="${id}"]`))
            // while the user can hide the textarea, we still keep the text in it
            // in case this was an accident
            // therefore, we only need to search and save content in visible textareas
            .map(textarea => textarea?.offsetParent ? textarea.value || '' : '');

    flagType.FlagText = flag;
    if (low) {
        flagType.Comments = { Low: low, High: high };
    }
}

function saveReportType(
    expandable: Element,
    flagType: CachedFlag
): void {
    const select = expandable.querySelector('select');
    const newReportType = select?.value as Flags;

    // can't select to flag for mod attention
    if (newReportType === 'PostOther') {
        displayStacksToast(
            'This type of flag cannot be raised with this option',
            'danger',
            true
        );
    } else {
        flagType.ReportType = newReportType;
    }
}

function saveSwfr(
    expandable: Element,
    flagType: CachedFlag,
    flagId: number,
): void {
    // swfr = send when flag raised :)
    const swfrBox = expandable.querySelector<HTMLInputElement>('[id*="-send-when-flag-raised-"');
    const sendFeedback = swfrBox?.checked || false;

    flagType.SendWhenFlagRaised = sendFeedback;

    // if any other FlagType with the same ReportType has swfr to true, then we need to change that
    const similar = cachedFlagTypes.find(item => item.SendWhenFlagRaised
                                                 && item.ReportType === flagType.ReportType
                                                 && item.Id !== flagId); // not this FlagType

    // make sure the FlagType exists and that the checkbox is checked
    if (!similar || !sendFeedback) return;

    similar.SendWhenFlagRaised = false; // then turn off the option

    const similarEl = document.querySelector<HTMLInputElement>(
        `[id*="-send-when-flag-raised-${similar.Id}"]`
    );

    // uncheck it
    if (similarEl) {
        similarEl.checked = false;
    }
}

function saveDownvote(
    expandable: Element,
    flagType: CachedFlag
): void {
    const downvote = expandable.querySelector<HTMLInputElement>('[id*="-downvote-post-"');

    flagType.Downvote = downvote?.checked || false;
}

function saveFeedbacks(
    expandable: Element,
    flagType: CachedFlag
): void {
    const feedbacks = [
        'Smokey',
        'Natty',
        'Guttenberg',
        'Generic Bot'
    ]
        .map(name => {
            const selector = `[id*="-${name.replace(/\s/g, '-')}-$"][checked]`;
            const radio = expandable.querySelector<HTMLInputElement>(`.s-radio${selector}`);

            const feedback = radio?.dataset.feedack || '';

            return [name, feedback];
        });

    flagType.Feedbacks = Object.fromEntries(feedbacks) as FlagTypeFeedbacks;
}

export function submitChanges(element: HTMLElement): void {
    const wrapper = element.closest<HTMLElement>('.s-card');
    const expandable = wrapper?.querySelector('.s-expandable');

    const flagId = Number(wrapper?.dataset.flagId);
    if (!flagId || !wrapper || !expandable) {
        displayStacksToast('Failed to save options', 'danger', true);

        return;
    }

    // search for invalid forms in visible textareas only!
    const invalids = [...wrapper.querySelectorAll<HTMLElement>('textarea.is-invalid')]
        .filter(textarea => textarea.offsetParent !== null);

    if (invalids.length) {
        // similar to what happens when add comment is clicked but the form is invalid
        $(invalids).fadeOut(100).fadeIn(100);

        displayStacksToast('One or more of the textareas are invalid', 'danger', true);

        return;
    }

    const flagType = getFlagTypeFromFlagId(flagId);
    if (!flagType) {
        displayStacksToast('Failed to save options', 'danger', true);

        return;
    }

    // Row #2
    saveTextareaContent(expandable, flagType);

    // Row #3
    saveReportType(expandable, flagType);
    saveSwfr(expandable, flagType, flagId);
    saveDownvote(expandable, flagType);

    // Row #4
    saveFeedbacks(expandable, flagType);

    updateFlagTypes();

    // element is the save button
    // the next element is the hide button
    // click it in order to hide the expandable
    const hideButton = element.nextElementSibling as HTMLButtonElement;
    hideButton.click();

    displayStacksToast('Content saved successfully', 'success', true);
}