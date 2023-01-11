import {
    isQuestionPage,
    getSvg,
    PostType
} from '../shared';

type Pages = 'Question' | 'NATO' | 'Flags';

export interface PostInfo {
    postType: PostType;
    element: Element;
    iconLocation: Element;
    page: Pages;
    postId: number;
    questionTime: Date; // not interested in that value on the Flags page
    answerTime: Date;
    score: number | null;
    opReputation: number | null; // null in the Flags page
    opName: string;
    deleted: boolean;
    raiseVlq: boolean;

    // not really related to the post,
    // but are unique and easy to access this way :)
    done: HTMLElement;
    failed: HTMLElement;
    flagged: HTMLElement;
}

const isNatoPage = location.href.includes('/tools/new-answers-old-questions');
const isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);

function getExistingElement(): HTMLElement[] | undefined {
    if (!isQuestionPage && !isNatoPage && !isFlagsPage) return;

    let elements: NodeListOf<Element> | HTMLElement[];

    if (isNatoPage) {
        elements = document.querySelectorAll('.default-view-post-table > tbody > tr');
    } else if (isFlagsPage) {
        elements = document.querySelectorAll('.flagged-post');
    } else if (isQuestionPage) {
        elements = document.querySelectorAll('.question, .answer');
    } else {
        elements = [];
    }

    return ([...elements] as HTMLElement[])
        .filter(element => !element.querySelector('.advanced-flagging-link'));
}

function getPage(): Pages | '' {
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

    const postIdString =
        (
            // questions page: get value of data-questionid/data-answerid
            postNode.dataset.questionid
         || postNode.dataset.answerid
        ) || (
            postType === 'Answer'// flags/NATO page: parse the post URL
                ? href?.split('#')[1]
                : href?.split('/')[4]
        );

    return Number(postIdString);
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

function getPostCreationDate(postNode: Element, postType: PostType): Date {
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
    getExistingElement()
        ?.forEach(element => {
            const postType = getPostType(element);

            const page = getPage();
            if (!page) return;

            const iconLocation = page === 'Question'
                ? element.querySelector('.js-post-menu')?.firstElementChild
                : element.querySelector('a.question-hyperlink, a.answer-hyperlink');

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
                page,
                postId,
                questionTime,
                answerTime,
                score,
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
    const elementToUse = getExistingElement();
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
