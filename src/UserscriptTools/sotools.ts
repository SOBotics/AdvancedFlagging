import { isQuestionPage, isNatoPage, isFlagsPage, PostType } from '../GlobalVars';

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
}

$.event.special.destroyed = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: (o: any): void => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        o.handler?.();
    }
};

function getExistingElement(): Element[] | undefined {
    if (!isQuestionPage && !isNatoPage && !isFlagsPage) return;

    const natoElements = document.querySelectorAll('.default-view-post-table > tbody > tr');
    const flagElements = document.querySelectorAll('.flagged-post');
    const questionPageElements = document.querySelectorAll('.question, .answer');

    const elementToUse = [
        natoElements,
        flagElements,
        questionPageElements
    ].find(item => item.length);

    return Array.from(elementToUse || []);
}

function getPage(): Pages | '' {
    if (isFlagsPage) return 'Flags';
    else if (isNatoPage) return 'NATO';
    else if (isQuestionPage) return 'Question';
    else return '';
}

function getPostIdFromElement(postNode: Element, postType: PostType): number {
    const postHyperlink = postNode.querySelector<HTMLAnchorElement>('.answer-hyperlink, .question-hyperlink');
    const elementHref = postHyperlink?.href;

    const postIdString =
        (
            // questions page: get value of data-questionid/data-answerid
            postNode.getAttribute('data-questionid')
         || postNode.getAttribute('data-answerid')
        ) || (
            postType === 'Answer'// flags/NATO page: parse the post URL
                ? elementHref?.split('#')[1]
                : elementHref?.split('/')[2]
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
    } else return Number(reputationText);
}

function getPostCreationDate(postNode: Element, postType: PostType): Date {
    const postElement = postType === 'Question'
        ? document.querySelector<HTMLElement>('.question')
        : postNode;

    const dateElements = postElement?.querySelectorAll<HTMLElement>('.user-info .relativetime');
    const authorDateElement = Array.from(dateElements || []).pop();

    return new Date(authorDateElement?.title || '');
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
            ? element.querySelector('.js-post-menu')?.firstElementChild as HTMLElement
            : element.querySelector('a.question-hyperlink, a.answer-hyperlink') as HTMLElement;

        const postId = getPostIdFromElement(element, postType);
        const questionTime = getPostCreationDate(element, 'Question');
        const answerTime = getPostCreationDate(element, 'Answer');

        // won't work for Flags, but we don't need that there:
        const score = Number(element.getAttribute('data-score')) || 0;

        // this won't work for community wiki posts and there's nothing that can be done about it:
        const reputationElement = [...element.querySelectorAll('.user-info .reputation-score')].pop();
        const opReputation = parseAuthorReputation(reputationElement as HTMLElement);

        // in Flags page, authorName will be empty, but we aren't interested in it there anyways...
        const opName = $(element).find('.user-info .user-details a').text()?.trim() || '';

        // (yes, even deleted questions have these class...)
        const deleted = element.classList.contains('deleted-answer');

        callback({
            postType,
            element,
            iconLocation,
            page,
            postId,
            questionTime,
            answerTime,
            score,
            opReputation,
            opName,
            deleted
        });
    });
}

export function getAllPostIds(includeQuestion: boolean, urlForm: boolean): (number | string)[] {
    const elementToUse = getExistingElement();
    if (!elementToUse) return [];

    return elementToUse.map(item => {
        const element = $(item);
        const isQuestionType = isQuestionPage ? element.attr('data-questionid') : element.find('.question-hyperlink').length;
        const postType: PostType = isQuestionType ? 'Question' : 'Answer';
        if (!includeQuestion && postType === 'Question') return '';

        const elementHref = element.find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
        let postId: number;
        if (elementHref) { // We're on flags page. We have to fetch the post id from the post URL
            postId = Number(postType === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
        } else { // instead, on the question page, the element has a data-questionid or data-answerid attribute with the post id
            postId = Number(element.attr('data-questionid') || element.attr('data-answerid'));
        }
        return urlForm ? `//${window.location.hostname}/${postType === 'Answer' ? 'a' : 'questions'}/${postId}` : postId;
    }).filter(String); // remove null/empty values
}
