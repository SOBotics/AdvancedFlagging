import {
    isQuestionPage,
    isNatoPage,
    isFlagsPage,
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

$.event.special.destroyed = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: (o: any): void => {
        /* eslint-disable-next-line
               @typescript-eslint/no-unsafe-member-access,
               @typescript-eslint/no-unsafe-call
        */
        o.handler?.();
    }
};

function getExistingElement(): HTMLElement[] | undefined {
    if (!isQuestionPage && !isNatoPage && !isFlagsPage) return;

    const nato = document.querySelectorAll('.default-view-post-table > tbody > tr');
    const flag = document.querySelectorAll('.flagged-post');
    const questionPage = document.querySelectorAll('.question, .answer');

    const elementToUse = [
        nato,
        flag,
        questionPage
    ].find(item => item.length) || [];

    return [...elementToUse] as HTMLElement[];
}

function getPage(): Pages | '' {
    if (isFlagsPage) return 'Flags';
    else if (isNatoPage) return 'NATO';
    else if (isQuestionPage) return 'Question';
    else return '';
}

function getPostIdFromElement(postNode: HTMLElement, postType: PostType): number {
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
                : href?.split('/')[2]
        );

    return Number(postIdString);
}

function parseAuthorReputation(reputationDiv: HTMLElement): number {
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
    getExistingElement()?.forEach(element => {
        const postType: PostType =
            element.classList.contains('question')
         || element.querySelector('.question-hyperlink')
                ? 'Question'
                : 'Answer';

        const page = getPage();
        if (!page) return;

        const iconLocation = page === 'Question'
            ? element.querySelector('.js-post-menu')?.firstElementChild
            : element.querySelector('a.question-hyperlink, a.answer-hyperlink');

        const postId = getPostIdFromElement(element, postType);
        const questionTime = getPostCreationDate(element, 'Question');
        const answerTime = getPostCreationDate(element, 'Answer');

        // won't work for Flags, but we don't need that there:
        const score = Number(element.dataset.score) || 0;

        // this won't work for community wiki posts and there's nothing that can be done about it:
        const reputationEl = [...element.querySelectorAll('.user-info .reputation-score')].pop();
        const opReputation = parseAuthorReputation(reputationEl as HTMLElement);

        // in Flags page, authorName will be empty, but we aren't interested in it there anyways...
        const lastNameEl = [...document.querySelectorAll('.user-info .user-details a')].pop();
        const opName = lastNameEl?.textContent?.trim() || '';

        // (yes, even deleted questions have these class...)
        const deleted = element.classList.contains('deleted-answer');

        const raiseVlq = qualifiesForVlq(score, answerTime);

        const [done, failed, flagged] = getActionIcons();
        iconLocation?.append(done, failed, flagged);

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
        const postType: PostType =
            item.dataset.questionid || item.querySelector('.question-hyperlink')
                ? 'Question'
                : 'Answer';

        if (!includeQuestion && postType === 'Question') return '';

        const href = item.querySelector<HTMLAnchorElement>(
            `.${postType.toLowerCase()}-hyperlink`
        )?.href;

        let postId: number;

        if (href) {
            // We're on flags page. We have to fetch the post id from the post URL
            postId = Number(
                postType === 'Answer'
                    ? href.split('#')[1]
                    : href.split('/')[2]
            );
        } else {
            // instead, on the question page, the element has a
            // data-questionid or data-answerid attribute with the post id
            postId = Number(item.dataset.questionid || item.dataset.answerid);
        }

        const type = postType === 'Answer' ? 'a' : 'questions';

        return urlForm
            ? `//${window.location.hostname}/${type}/${postId}`
            : postId;
    }).filter(String); // remove null/empty values
}
