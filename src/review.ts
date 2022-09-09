import {
    Cached,
    cachedConfiguration,
    addXHRListener,
    isReviewItemRegex,
    BotNames,
    cachedFlagTypes,
    isDeleteVoteRegex
} from './shared';

import * as AdvancedFlagging from './AdvancedFlagging';
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
    reporters: AdvancedFlagging.ReporterInformation;
}

const reviewPostsInformation: ReviewQueuePostInfo[] = [];

function getPostIdFromReview(): number {
    const answer = document.querySelector('[id^="answer-"]');
    const id = answer?.id.split('-')[1];

    return Number(id);
}

function getAllBotIcons(): HTMLDivElement[] {
    return [
        'Natty',
        'Guttenberg',
        'Smokey'
    ]
        .map(bot => AdvancedFlagging.createBotIcon(bot as BotNames));
}

function addBotIconsToReview(post: PostInfo): void {
    const {
        postType,
        element,
        postId,
        questionTime,
        answerTime
    } = post;

    if (postType !== 'Answer') return;

    // TODO create bot icons in the same file/class, not here!
    const botIconsToAppend = getAllBotIcons();
    const iconLocation = element
        .querySelector('.js-post-menu')
        ?.firstElementChild;

    iconLocation?.append(...botIconsToAppend);

    const reporters: AdvancedFlagging.ReporterInformation = {
        Natty: new NattyAPI(postId, questionTime, answerTime),
        Smokey: new MetaSmokeAPI(postId, postType),
        Guttenberg: new CopyPastorAPI(postId)
    };

    reviewPostsInformation.push({ postId, post, reporters });
}

export function setupReview(): void {
    const watchReview = cachedConfiguration[Cached.Configuration.watchQueues];
    if (!watchReview) return;

    addXHRListener(xhr => {
        if (
            xhr.status !== 200 // request failed
         || !isReviewItemRegex.test(xhr.responseURL) // not a review request
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
            .find(item => item.DisplayName === 'Looks Fine');

        if (!reviewCachedInfo || !flagType) return; // something went wrong

        void AdvancedFlagging.handleFlag(flagType, reviewCachedInfo.reporters);
    });

    addXHRListener(xhr => {
        if (
            xhr.status !== 200 // request failed
            || !isDeleteVoteRegex.test(xhr.responseURL) // didn't vote to delete
            || !document.querySelector('#answer') // not an answer
        ) return;

        const postId = getPostIdFromReview();
        const cached = reviewPostsInformation
            .find(item => item.postId === postId);

        if (!cached) return;

        const { postType, questionTime, answerTime } = cached.post;

        if (postType !== 'Answer') return;

        const reportersArray: AdvancedFlagging.ReporterInformation = {
            Natty: new NattyAPI(postId, questionTime, answerTime)
        };

        const flagType = cachedFlagTypes
            .find(item => item.DisplayName === 'Not an answer'); // the NAA cached flag type
        if (!flagType) return; // something went wrong

        void AdvancedFlagging.handleFlag(flagType, reportersArray);
    });
}