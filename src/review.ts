import { addXHRListener, delay, toggleLoading } from './shared';
import { isDone } from './AdvancedFlagging';

import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { Cached, Store } from './UserscriptTools/Store';

import Page from './UserscriptTools/Page';
import { Progress } from './UserscriptTools/Progress';

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

    const page = new Page();
    // page.posts should be an element with just one item:
    //   the answer the user is reviewing
    const post = page.posts[0];

    // eslint-disable-next-line no-await-in-loop
    while (!isDone) await delay(200);

    // update info on reporters
    const url = `//stackoverflow.com/a/${post.id}`;
    await Promise.all([
        MetaSmokeAPI.queryMetaSmokeInternal([ url ]),
        NattyAPI.getAllNattyIds([ post.id ]),
        CopyPastorAPI.storeReportedPosts([ url ])
    ]);

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

            event.preventDefault();
            event.stopPropagation();

            const target = event.target as HTMLButtonElement;
            toggleLoading(target);

            const page = new Page(true);
            await page.posts[0].sendFeedbacks(flagType);

            await delay(1000);
            toggleLoading(target);

            target.click();
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

        submit.addEventListener('click', async event => {
            // find the "Not an answer" flag type
            const flagType = Store.flagTypes.find(({ id }) => id === 7);
            if (!flagType) return; // something went wrong

            // don't recomment deletion immediately
            event.preventDefault();
            event.stopPropagation();

            const target = event.target as HTMLButtonElement;

            // indicate loading
            toggleLoading(target);

            try {
                const page = new Page(true);
                const post = page.posts[0];

                post.progress = new Progress(target);
                post.progress.attach();

                await post.sendFeedbacks(flagType);
            } finally {
                // remove previously added indicators
                await delay(1000);
                toggleLoading(target);

                // proceed with the vote
                target.click();
            }
        }, { once: true });
    });
}
