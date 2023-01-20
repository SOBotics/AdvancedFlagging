import { getIconsFromReporters, ReporterInformation } from '../AdvancedFlagging';
import {
    isQuestionPage,
    getSvg,
    PostType,
    isStackOverflow
} from '../shared';
import { CopyPastorAPI } from './CopyPastorAPI';
import { GenericBotAPI } from './GenericBotAPI';
import { MetaSmokeAPI } from './MetaSmokeAPI';
import { NattyAPI } from './NattyApi';

type Pages = 'Question' | 'NATO' | 'Flags';

export interface PostInfo {
    postType: PostType;
    element: Element;
    iconLocation: Element;
    postId: number;
    questionTime: Date; // not interested in that value on the Flags page
    answerTime: Date;
    opReputation: number;
    opName: string;
    deleted: boolean;
    raiseVlq: boolean;

    // not really related to the post,
    // but are unique and easy to access this way :)
    done: HTMLElement;
    failed: HTMLElement;
    flagged: HTMLElement;
}

const currentUrl = new URL(location.href);
const isNatoPage = currentUrl.pathname.startsWith('/tools/new-answers-old-questions');
const isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);
const isSearch = currentUrl.pathname.startsWith('/search');

function getExistingElements(): HTMLElement[] | undefined {
    if (!isQuestionPage && !isNatoPage && !isFlagsPage && !isSearch) return;

    let elements: NodeListOf<Element> | HTMLElement[];

    if (isNatoPage) {
        elements = document.querySelectorAll('.default-view-post-table > tbody > tr');
    } else if (isFlagsPage) {
        elements = document.querySelectorAll('.flagged-post');
    } else if (isQuestionPage) {
        elements = document.querySelectorAll('.question, .answer');
    } else if (isSearch) {
        elements = document.querySelectorAll('.js-search-results [id^="answer-id-"]');
    } else {
        elements = [];
    }

    return ([...elements] as HTMLElement[])
        .filter(element => !element.querySelector('.advanced-flagging-link, .advanced-flagging-icon'));
}

export function getPage(): Pages | '' {
    if (isFlagsPage) return 'Flags';
    else if (isNatoPage) return 'NATO';
    else if (isQuestionPage) return 'Question';
    else return '';
}

function getPostType(element: HTMLElement): PostType {
    return element.classList.contains('question')
        || element.querySelector('.question-hyperlink')
        ? 'Question'
        : 'Answer';
}

function getPostId(postNode: HTMLElement, postType: PostType): number {
    const href = postNode.querySelector<HTMLAnchorElement>(
        '.answer-hyperlink, .question-hyperlink'
    )?.href;

    const postId =
        (
            // questions page: get value of data-questionid/data-answerid
            postNode.dataset.questionid
         || postNode.dataset.answerid
        ) || (
            postType === 'Answer'// flags/NATO/search page: parse the post URL
                ? new URL(href || '').pathname.split('/').pop()
                : href?.split('/')[4]
        );

    return Number(postId);
}

export function addIconToPost(
    element: HTMLElement,
    locationSelector: string,
    postType: PostType,
    postId: number,
    qDate?: Date,
    aDate?: Date,
): ReporterInformation {
    const iconLocation = element.querySelector(locationSelector);

    // we're setting up the icons for non-question pages
    // we don't care if the dates are correct or the posts are deleted
    // just if they have been reported by a bot
    const reporters: ReporterInformation = {
        Smokey: new MetaSmokeAPI(postId, postType, false)
    };

    const date = new Date();
    if (postType === 'Answer' && isStackOverflow) {
        reporters.Natty = new NattyAPI(postId, qDate || date, aDate || date, false);
        reporters.Guttenberg = new CopyPastorAPI(postId);
        // doesn't add an icon, should however be returned
        reporters['Generic Bot'] = new GenericBotAPI(postId);
    }

    const icons = getIconsFromReporters(reporters);
    iconLocation?.append(...icons);

    return reporters;
}

export function addIcons(): void {
    getExistingElements()
        ?.forEach(element => {
            const postType = getPostType(element);

            addIconToPost(
                element,
                'a.question-hyperlink, a.answer-hyperlink',
                postType,
                getPostId(element, postType)
            );
        });
}

function parseAuthorReputation(reputationDiv?: HTMLElement): number {
    if (!reputationDiv) return 0;

    let reputationText = reputationDiv.innerText.replace(/,/g, '');
    if (!reputationText) return 0;

    if (reputationText.includes('k')) {
        reputationText = reputationText
            .replace(/\.\d/g, '') // 4.5k => 4k
            .replace(/k/, ''); // 4k => 4

        return Number(reputationText) * 1000; // 4 => 4000
    } else {
        return Number(reputationText);
    }
}

export function getPostCreationDate(postNode: Element, postType: PostType): Date {
    const post = postType === 'Question'
        ? document.querySelector('.question')
        : postNode;

    const dateElements = post?.querySelectorAll<HTMLElement>('.user-info .relativetime');
    const authorDateElement = Array.from(dateElements || []).pop();

    return new Date(authorDateElement?.title || '');
}

function qualifiesForVlq(score: number, created: Date): boolean {
    const dayMillis = 1000 * 60 * 60 * 24;

    // a post can't be flagged as VLQ if it has a positive score
    // or is more than 1 day old
    return (new Date().valueOf() - created.valueOf()) < dayMillis
        && score <= 0;
}

function getIcon(
    svg: SVGElement,
    classname: string,
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('flex--item');
    wrapper.style.display = 'none';

    svg.classList.add(classname);
    wrapper.append(svg);

    return wrapper;
}

function getActionIcons(): HTMLElement[] {
    return [
        ['Checkmark', 'fc-green-500'],
        ['Clear', 'fc-red-500'],
        ['Flag', 'fc-red-500']
    ]
        .map(([svg, classname]) => getIcon(getSvg(`icon${svg}`), classname));
}

export function parseQuestionsAndAnswers(callback: (post: PostInfo) => void): void {
    getExistingElements()
        ?.forEach(element => {
            const postType = getPostType(element);

            const page = getPage();
            if (!page) return;

            const iconLocation = element.querySelector('.js-post-menu')?.firstElementChild;

            const postId = getPostId(element, postType);
            const questionTime = getPostCreationDate(element, 'Question');
            const answerTime = getPostCreationDate(element, 'Answer');

            // won't work for Flags, but we don't need that there:
            const score = Number(element.dataset.score) || 0;

            // this won't work for community wiki posts,
            // and there's nothing that can be done about it:
            const reputationEl = [...element.querySelectorAll<HTMLElement>(
                '.user-info .reputation-score'
            )].pop();
            const opReputation = parseAuthorReputation(reputationEl);

            // in Flags page, authorName will be empty, but we aren't interested in it there anyways...
            const lastNameEl = [...element.querySelectorAll('.user-info .user-details a')].pop();
            const opName = lastNameEl?.textContent?.trim() || '';

            // (yes, even deleted questions have these class...)
            const deleted = element.classList.contains('deleted-answer');

            const raiseVlq = qualifiesForVlq(score, answerTime);

            const [done, failed, flagged] = getActionIcons();

            callback({
                postType,
                element,
                iconLocation: iconLocation as HTMLElement,
                postId,
                questionTime,
                answerTime,
                opReputation,
                opName,
                deleted,
                raiseVlq,

                // icons
                done,
                failed,
                flagged,
            });
        });
}

export function getAllPostIds(
    includeQuestion: boolean,
    urlForm: boolean
): (number | string)[] {
    const elementToUse = getExistingElements();
    if (!elementToUse) return [];

    return elementToUse.map(item => {
        const postType = getPostType(item);

        if (!includeQuestion && postType === 'Question') return '';

        const postId = getPostId(item, postType);
        const type = postType === 'Answer' ? 'a' : 'questions';

        return urlForm
            ? `//${window.location.hostname}/${type}/${postId}`
            : postId;
    }).filter(String); // remove null/empty values
}
