import { addProgress, addXHRListener, appendLabelAndBoxes, delay, getFlagTypeFromFlagId } from './shared';
import { isDone } from './AdvancedFlagging';

import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { Cached, Store } from './UserscriptTools/Store';

import Page from './UserscriptTools/Page';
import { Checkbox } from '@userscripters/stacks-helpers';

interface ReviewQueueResponse {
    postId: number;
    isAudit: boolean; // detect audits & avoid sending feedback to bots
}

let audit = false;

async function runOnNewTask(xhr: XMLHttpRequest): Promise<void> {
    const regex = /\/review\/(next-task|task-reviewed\/)/;

    if (
        xhr.status !== 200 // request failed
     || !regex.test(xhr.responseURL) // not a review request
     || !document.querySelector('#answer') // not an answer
    ) return;

    const response = JSON.parse(xhr.responseText) as ReviewQueueResponse;
    audit = response.isAudit;
    if (response.isAudit) return; // audit

    // Update reporters info *before* a new page is created,
    // (otherwise the Post constructor will call initReporters()
    // before metasmoke info is updated)
    const url = `//stackoverflow.com/a/${response.postId}`;
    await Promise.all([
        MetaSmokeAPI.queryMetaSmokeInternal([ url ]),
        NattyAPI.getAllNattyIds([ response.postId ]),
        CopyPastorAPI.storeReportedPosts([ url ])
    ]);

    const page = new Page();
    // page.posts should be an element with just one item:
    //   the answer the user is reviewing
    const post = page.posts[0];

    // eslint-disable-next-line no-await-in-loop
    while (!isDone) await delay(200);

    post.addIcons();

    // attach click event listener to the submit button
    // it's OK to do on every task load, as the HTML is re-added
    // thus all previous event listeners are removed
    document
        .querySelector('.js-review-submit')
        ?.addEventListener('click', async event => {
            const looksGood = document.querySelector<HTMLInputElement>(
                '#review-action-LooksGood'
            );
            // must have selected 'Looks OK' and clicked submit
            if (!looksGood?.checked) return;

            const flagType = Store.flagTypes
                // send 'Looks Fine' feedback: get the respective flagType
                .find(({ id }) => id === 15);

            // in case "looks fine" flagtype is deleted
            if (!flagType) return;

            await addProgress(event, flagType);
        }, { once: true });
}

export function setupReview(): void {
    const watchReview = Store.config[Cached.Configuration.watchQueues];
    if (!watchReview || !Page.isLqpReviewPage) return;

    addXHRListener(runOnNewTask);

    // The "Add a comment for the author?" modal opens
    // when the GET request to /posts/modal/delete/<post id> is finished.
    // We detect when the modal opens and attach a click event listener
    // to the submit button in order to prevent immediate sending of the
    // "Recommend Deletion" vote. This is required in case the post is 1 vote
    // away from being deleted and it needs to be reported to a bot.
    addXHRListener(xhr => {
        const regex = /\/posts\/modal\/delete\/\d+/;

        if (
            xhr.status !== 200 // request failed
            || !regex.test(xhr.responseURL) // didn't vote to delete
            || !document.querySelector('#answer') // answer element not found
            || audit // don't run on review audits
        ) return;

        // the submit button
        const submit = document.querySelector('form .js-modal-submit');
        if (!submit) return;

        const [, checkbox] = Checkbox.makeStacksCheckboxes(
            [
                {
                    id: 'advanced-flagging-flag-post',
                    labelConfig: {
                        text: 'Flag post',
                        classes: [ 'mt2' ]
                    },
                    selected: true
                }
            ]
        );
        checkbox.classList.add('flex--item');

        // feedback boxes
        const post = new Page(true).posts[0];

        submit.parentElement?.append(checkbox);
        appendLabelAndBoxes(submit, post);

        submit.addEventListener('click', async event => {
            // find the "Not an answer" flag type
            const flagType = getFlagTypeFromFlagId(7);
            if (!flagType) return; // something went wrong

            await addProgress(event, flagType);
        }, { once: true });
    });
}
