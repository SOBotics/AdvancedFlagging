import Post from './UserscriptTools/Post';
import Page from './UserscriptTools/Page';

import { Flags } from './FlagTypes';
import { setupConfiguration } from './Configuration';
import { Popover } from './popover';

import { setupReview } from './review';
import { FlagNames, interceptXhr, popupDelay } from './shared';

import { NattyAPI } from './UserscriptTools/NattyApi';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';

import { Buttons } from '@userscripters/stacks-helpers';
import { Store, Cached } from './UserscriptTools/Store';

// <TODO>
// What's left for 2.0.0:
// - Manipulate the flag & recommend deletion popups:
//   - choose the bots to which to send feedback
//   - choose the feedback to send
//   - also the recommend deletion/Delete popup
// - Flag post from recommend deletion popup
// </TODO>

function setupStyles(): void {
    GM_addStyle(`
.advanced-flagging-popover {
    min-width: 10rem !important;
}

#advanced-flagging-comments-modal textarea {
    resize: vertical;
}

#advanced-flagging-snackbar {
    transform: translate(-50%, 0); /* correctly centre the element */
    min-width: 19rem;
}

.advanced-flagging-link:focus {
    outline: none;
}

.advanced-flagging-link {
    outline-style: none !important;
    outline: none !important;
}

.advanced-flagging-link li > a {
    padding-block: 4px;
}

.advanced-flagging-link li > .s-check-control {
    padding-inline: 6px;
    gap: 4px;
}

#advanced-flagging-comments-modal > .s-modal--dialog,
#advanced-flagging-configuration-modal > .s-modal--dialog {
    max-width: 90% !important;
    max-height: 95% !important;
}`);
}

const popupWrapper = document.createElement('div');
popupWrapper.classList.add(
    'fc-white',
    'fs-body3',
    'ta-center',
    'z-modal',
    'ps-fixed',
    'l50'
);
popupWrapper.id = 'advanced-flagging-snackbar';

document.body.append(popupWrapper);

export function getFlagToRaise(
    flagName: Flags,
    qualifiesForVlq: boolean
): Flags {
    const vlqFlag = FlagNames.VLQ;
    const naaFlag = FlagNames.NAA;

    // If the flag name is VLQ, check if the criteria are met.
    // If not, switch to NAA
    return flagName === vlqFlag
        ? (qualifiesForVlq ? vlqFlag : naaFlag)
        : flagName;
}

export function displayToaster(
    text: string,
    state: 'success' | 'danger'
): void {
    const element = document.createElement('div');
    element.classList.add('p12', `bg-${state}`);
    element.innerText = text;
    element.style.display = 'none';

    popupWrapper.append(element);

    $(element).fadeIn();

    window.setTimeout(() => {
        $(element).fadeOut('slow', () => element.remove());
    }, popupDelay);
}

function buildFlaggingDialog(post: Post): HTMLElement {
    const dropdown = document.createElement('div');
    dropdown.classList.add(
        's-popover',
        's-anchors',
        's-anchors__default',
        'mt2',
        'c-default',
        'px0',
        'py4',
        'advanced-flagging-popover'
    );

    const actionsMenu = new Popover(post).popover;
    dropdown.append(actionsMenu);

    return dropdown;
}

function setPopoverOpening(
    advancedFlaggingLink: HTMLElement,
    dropdown: HTMLElement
): void {
    // Determine if the dropdown should be opened on hover
    // or on click based on what the user has chosen
    const openOnHover = Store.config[Cached.Configuration.openOnHover];

    // how the popup opens
    advancedFlaggingLink
        .addEventListener(openOnHover ? 'mouseover' : 'click', event => {
            event.stopPropagation();

            if (advancedFlaggingLink.isSameNode(event.target as Node)) {
                $(dropdown).fadeIn('fast');
            }
        });

    // how/when the popup closes
    if (openOnHover) {
        advancedFlaggingLink.addEventListener('mouseleave', event => {
            event.stopPropagation();

            // avoid immediate closing of the popover
            setTimeout(() => $(dropdown).fadeOut('fast'), 200);
        });
    } else {
        window.addEventListener('click', () => $(dropdown).fadeOut('fast'));
    }
}

export let page = new Page();

function setupPostPage(): void {
    // check if the link + popover should be set up
    const linkDisabled = Store.config[Cached.Configuration.linkDisabled];
    if (linkDisabled || Page.isLqpReviewPage) return; // do not add the buttons on review

    // split setup into two parts:
    // i)  append the icons to iconLocation
    // ii) add link & set up reporters on

    page = new Page();

    if (page.name && page.name !== 'Question') {
        page.posts.forEach(post => post.addIcons());

        return;
    }

    page.posts.forEach(post => {
        const { id, done, failed, flagged, element } = post;

        post.watchForFlags();

        // Now append the advanced flagging dropdown
        const advancedFlaggingLink = Buttons.makeStacksButton(
            `advanced-flagging-link-${id}`,
            'Advanced Flagging',
            {
                type: [ 'link' ],
                classes: [ 'advanced-flagging-link' ]
            }
        );

        const iconLocation = element.querySelector('.js-post-menu')?.firstElementChild;

        const flexItem = document.createElement('div');
        flexItem.classList.add('flex--item');

        flexItem.append(advancedFlaggingLink);
        iconLocation?.append(flexItem);

        const dropDown = buildFlaggingDialog(post);
        advancedFlaggingLink.append(dropDown);

        iconLocation?.append(done, failed, flagged);
        post.addIcons();

        setPopoverOpening(advancedFlaggingLink, dropDown);
    });
}

// used in review.ts to determine if bots have been set up
// the XHR callback must be added, but the script should wait
// for Setup() to complete before appending the icons to the DOM
export let isDone = false;

function Setup(): void {
    // Collect all ids
    void Promise.all([
        MetaSmokeAPI.setup(),
        MetaSmokeAPI.queryMetaSmokeInternal(),
        CopyPastorAPI.getAllCopyPastorIds(),
        NattyAPI.getAllNattyIds()
    ]).then(() => {
        setupPostPage();
        setupStyles();
        setupConfiguration();

        // TODO make more specific & remove jQuery
        // appends advanced flagging link to new/edited posts
        $(document).ajaxComplete(() => setupPostPage());

        isDone = true;
    });
}

setupReview();
interceptXhr();
// run Setup() if/when the document has focus
// to prevent load on MS
if (document.hasFocus()) {
    Setup();
} else {
    window.addEventListener('focus', () => Setup(), { once: true });
}
