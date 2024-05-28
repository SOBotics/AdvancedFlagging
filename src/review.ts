import { addXHRListener, delay } from './shared';
import { isDone } from './AdvancedFlagging';

import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { Cached, Store } from './UserscriptTools/Store';

import Post from './UserscriptTools/Post';
import Page from './UserscriptTools/Page';

interface ReviewQueueResponse {
    postId: number;
    isAudit: boolean; // detect audits & avoid sending feedback to bots
}

const allPosts: Post[] = [];

function getPostIdFromReview(): number {
    const answer = document.querySelector('[id^="answer-"]');
    const id = answer?.id.split('-')[1];

    return Number(id);
}

async function runOnNewTask(xhr: XMLHttpRequest): Promise<void> {
    const regex = /\/review\/(next-task|task-reviewed\/)/;

    if (
        xhr.status !== 200 // request failed
     || !regex.test(xhr.responseURL) // not a review request
     || !document.querySelector('#answer') // not an answer
    ) return;

    const reviewResponse = JSON.parse(xhr.responseText) as ReviewQueueResponse;
    if (reviewResponse.isAudit) return; // audit

    const cached = allPosts.find(({ id }) => id === reviewResponse.postId);
    const element = document.querySelector<HTMLElement>('#answer .answer');
    if (!element) return;

    const post = cached || new Post(element);

    // eslint-disable-next-line no-await-in-loop
    while (!isDone) await delay(200);

    // update info on reporters
    const url = `//stackoverflow.com/a/${post.id}`;
    await Promise.all([
        MetaSmokeAPI.queryMetaSmokeInternal([ url ]),
        NattyAPI.getAllNattyIds([ post.id ]),
        CopyPastorAPI.storeReportedPosts([ url ])
    ]);

    if (!cached) allPosts.push(post);

    // attach click event listener to the submit button
    // it's OK to do on every task load, as the HTML is re-added
    // thus all previous event listeners are removed
    document
        .querySelector('.js-review-submit')
        ?.addEventListener('click', () => {
            const looksGood = document.querySelector<HTMLInputElement>(
                '#review-action-LooksGood'
            );
            // must have selected 'Looks OK' and clicked submit
            if (!looksGood?.checked) return;

            const cached = allPosts.find(({ id }) => id === post.id);

            const flagType = Store.flagTypes
                // send 'Looks Fine' feedback:
                // get the respective flagType, call handleFlag()
                .find(({ id }) => id === 15);

            // in case "looks fine" flagtype is deleted
            if (!cached || !flagType) return;

            void cached.sendFeedbacks(flagType);
        });
}

export function setupReview(): void {
    const watchReview = Store.config[Cached.Configuration.watchQueues];
    if (!watchReview || !Page.isLqpReviewPage) return;

    addXHRListener(runOnNewTask);

    addXHRListener(xhr => {
        const regex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;

        if (
            xhr.status !== 200 // request failed
            || !regex.test(xhr.responseURL) // didn't vote to delete
            || !document.querySelector('#answer') // not an answer
        ) return;

        const postId = getPostIdFromReview();
        const cached = allPosts.find(({ id }) => id === postId);

        if (!cached) return;

        const flagType = Store.flagTypes
            .find(({ id }) => id === 7); // the "Not an answer" flag type
        if (!flagType) return; // something went wrong

        void cached.sendFeedbacks(flagType);
    });
}