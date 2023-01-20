import {
    Cached,
    cachedConfiguration,
    addXHRListener,
    cachedFlagTypes,
    isLqpReviewPage,
} from './shared';

import {
    ReporterInformation,
    handleFlag,
    isDone,
} from './AdvancedFlagging';
import {
    addIconToPost,
    getPostCreationDate
} from './UserscriptTools/sotools';
import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';

interface ReviewQueueResponse {
    postId: number;
    isAudit: boolean; // detect audits & avoid sending feedback to bots
}

interface ReviewQueuePostInfo {
    postId: number;
    reporters: ReporterInformation;
}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];

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

    const cachedPost = reviewPostsInformation
        .find(item => item.postId === reviewResponse.postId);

    await new Promise<void>(resolve => {
        if (isDone) resolve();
    });

    // add icons:
    const question = document.querySelector('.question') as HTMLElement;
    const answer = document.querySelector('#answer') as HTMLElement;

    const postMenu = '.js-post-menu > div.d-flex';
    const qDate = getPostCreationDate(question, 'Question');
    const aDate = getPostCreationDate(answer, 'Answer');
    // in case the post isn't cached, use the id as given
    // in the /next-task or /task-reviewed call
    const postId = cachedPost?.postId || reviewResponse.postId;

    // update info on reporters
    const url = `//stackoverflow.com/a/${postId}`;
    await MetaSmokeAPI.queryMetaSmokeInternal([ url ]);
    await NattyAPI.getAllNattyIds([postId]);
    await CopyPastorAPI.storeReportedPosts([url]);

    const reporters = addIconToPost(answer, postMenu, 'Answer', postId, qDate, aDate);

    reviewPostsInformation.push({ postId, reporters });

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

            const cached = reviewPostsInformation
                .find(item => item.postId === postId);

            const flagType = cachedFlagTypes
                // send 'Looks Fine' feedback:
                // get the respective flagType, call handleFlag()
                .find(({ id }) => id === 15);

            // in case "looks fine" flagtype is deleted
            if (!cached || !flagType) return;

            void handleFlag(flagType, cached.reporters);
        });
}

export function setupReview(): void {
    const watchReview = cachedConfiguration[Cached.Configuration.watchQueues];
    if (!watchReview || !isLqpReviewPage) return;

    addXHRListener(runOnNewTask);

    addXHRListener(xhr => {
        const regex = /(\d+)\/vote\/10|(\d+)\/recommend-delete/;

        if (
            xhr.status !== 200 // request failed
            || !regex.test(xhr.responseURL) // didn't vote to delete
            || !document.querySelector('#answer') // not an answer
        ) return;

        const postId = getPostIdFromReview();
        const cached = reviewPostsInformation
            .find(item => item.postId === postId);

        if (!cached) return;

        const flagType = cachedFlagTypes
            .find(({ id }) => id === 7); // the "Not an answer" flag type
        if (!flagType) return; // something went wrong

        void handleFlag(flagType, cached.reporters);
    });
}