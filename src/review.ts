import {
    Cached,
    cachedConfiguration,
    addXHRListener,
    cachedFlagTypes,
} from './shared';

import {
    ReporterInformation,
    ValueOfReporters,
    handleFlag,
} from './AdvancedFlagging';
import {
    PostInfo,
    parseQuestionsAndAnswers
} from './UserscriptTools/sotools';

import { MetaSmokeAPI } from './UserscriptTools/MetaSmokeAPI';
import { CopyPastorAPI } from './UserscriptTools/CopyPastorAPI';
import { NattyAPI } from './UserscriptTools/NattyApi';

interface ReviewQueueResponse {
    postId: number;
    postTypeId: number; // see: StackOverflow.Models.PostTypeId
    isAudit: boolean; // detect audits & avoid sending feedback to bots
}

interface ReviewQueuePostInfo {
    postId: number;
    post: PostInfo;
    reporters: ReporterInformation;
}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];

function getPostIdFromReview(): number {
    const answer = document.querySelector('[id^="answer-"]');
    const id = answer?.id.split('-')[1];

    return Number(id);
}

function addBotIconsToReview(post: PostInfo): void {
    const {
        postType,
        element,
        postId,
        questionTime,
        answerTime,
        deleted
    } = post;

    if (postType !== 'Answer') return;

    const reporters: ReporterInformation = {
        Natty: new NattyAPI(postId, questionTime, answerTime, deleted),
        Smokey: new MetaSmokeAPI(postId, postType, deleted),
        Guttenberg: new CopyPastorAPI(postId)
    };

    const iconLocation = element
        .querySelector('.js-post-menu')
        ?.firstElementChild;

    const icons = (Object.values(reporters) as ValueOfReporters[])
        .map(reporter => reporter.icon)
        .filter(Boolean) as HTMLElement[];

    iconLocation?.append(...icons);

    reviewPostsInformation.push({ postId, post, reporters });
}

export function setupReview(): void {
    const watchReview = cachedConfiguration[Cached.Configuration.watchQueues];
    if (!watchReview) return;

    const regex = /\/review\/(next-task|task-reviewed\/)/;

    addXHRListener(xhr => {
        if (
            xhr.status !== 200 // request failed
         || !regex.test(xhr.responseURL) // not a review request
         || !document.querySelector('#answer') // not an answer
        ) return;

        const reviewResponse = JSON.parse(xhr.responseText) as ReviewQueueResponse;
        if (
            reviewResponse.isAudit // an audit
            || reviewResponse.postTypeId !== 2 // not an answer
        ) return;

        const cachedPost = reviewPostsInformation
            .find(item => item.postId === reviewResponse.postId)?.post;

        cachedPost
            ? addBotIconsToReview(cachedPost) // post already stored, don't fetch again
            : parseQuestionsAndAnswers(addBotIconsToReview);
    });

    $(document).on('click', '.js-review-submit', () => {
        const looksGood = document.querySelector<HTMLInputElement>(
            '#review-action-LooksGood'
        );

        // must have selected 'Looks OK' and clicked submit
        if (!looksGood?.checked) return;

        const postId = getPostIdFromReview();

        const reviewCachedInfo = reviewPostsInformation
            .find(item => item.postId === postId);

        const flagType = cachedFlagTypes
            // send 'Looks Fine' feedback:
            // get the respective flagType, call handleFlag()
            .find(({ displayName }) => displayName === 'Looks Fine');

        if (!reviewCachedInfo || !flagType) return; // something went wrong

        void handleFlag(flagType, reviewCachedInfo.reporters);
    });

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

        const {
            postType,
            questionTime,
            answerTime,
            deleted
        } = cached.post;

        if (postType !== 'Answer') return;

        const reportersArray: ReporterInformation = {
            Natty: new NattyAPI(postId, questionTime, answerTime, deleted)
        };

        const flagType = cachedFlagTypes
            .find(({ displayName }) => displayName === 'Not an answer'); // the NAA cached flag type
        if (!flagType) return; // something went wrong

        void handleFlag(flagType, reportersArray);
    });
}