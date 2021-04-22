import { isQuestionPage, PostType } from '../GlobalVars';

type Pages = 'Question' | 'NATO' | 'Flags';

export interface PostInfo {
    postType: PostType;
    element: JQuery;
    iconLocation: JQuery;
    page: Pages;
    postId: number;
    questionTime: Date | null; // not interested in that value on the Flags page
    answerTime: Date | null;
    score: number | null;
    authorReputation: number | null; // null in the Flags page
    authorName: string;
}

$.event.special.destroyed = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: (o: any): void => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        o.handler?.();
    }
};

function getExistingElement(): JQuery | undefined {
    const natoElements = $('.answer-hyperlink').parents('tr'), flagElements = $('.flagged-post');
    const questionPageElements = $('.question, .answer');
    const elementToUse = [natoElements, flagElements, questionPageElements].find(item => item.length);
    return elementToUse;
}

function getPageFromElement(postNode: JQuery): Pages {
    if (postNode.hasClass('flagged-post')) return 'Flags';
    else if (postNode.is('tr')) return 'NATO';
    else return 'Question';
}

function getPostIdFromElement(postNode: JQuery, postType: PostType): number {
    const elementHref = postNode.find(`.${postType.toLowerCase()}-hyperlink`).attr('href');
    // in the question page, questions/answers have a data-questionid/data-answerid with the post id
    const postIdString = (postNode.attr('data-questionid') || postNode.attr('data-answerid'))
        // in the flags/NATO page, we find the postId by parsing the post URL
        || (postType === 'Answer' ? elementHref?.split('#')[1] : elementHref?.split('/')[2]);
    return Number(postIdString);
}

function parseAuthorReputation(reputationDiv: JQuery): number {
    let reputationText = reputationDiv.text()?.replace(/,/g, '');
    if (!reputationText) return 0;

    if (reputationText.includes('k')) {
        reputationText = reputationText.replace(/\./g, '').replace(/k/, '');
        return Number(reputationText) * 1000;
    } else return Number(reputationText);
}

function getPostCreationDate(postNode: JQuery, postType: PostType): Date | null {
    const dateString = (postType === 'Question' ? $('.question') : postNode).find('.user-info .relativetime').last();
    return new Date(dateString.attr('title') || '') || null;
}

export function parseQuestionsAndAnswers(callback: (post: PostInfo) => void): void {
    getExistingElement()?.each((_index, node) => {
        const element = $(node);
        const postType: PostType = element.hasClass('question') ? 'Question' : 'Answer';
        const page = getPageFromElement(element);
        const iconLocation = page === 'Question'
            ? element.find('.js-post-menu').children().first()
            : element.find(`a.${postType === 'Question' ? 'question' : 'answer'}-hyperlink`);
        const postId = getPostIdFromElement(element, postType);
        const questionTime = getPostCreationDate(element, 'Question');
        const answerTime = getPostCreationDate(element, 'Answer');
        const score = Number(element.attr('data-score')) ?? null; // won't work for Flags, but we don't need that there
        // this won't work for community wiki posts and there's nothing that can be done about it
        const authorReputation = parseAuthorReputation(element.find('.user-info .reputation-score').last());
        // in Flags page, authorName will be empty, but we aren't interested in it there anyways...
        const authorName = element.find('.user-info .user-details a').text().trim();

        callback({ postType, element, iconLocation, page, postId, questionTime, answerTime, score, authorReputation, authorName });
    });
}

export function getAllPostIds(includeQuestion: boolean, urlForm: boolean): (number | string)[] {
    const elementToUse = getExistingElement();
    if (!elementToUse) return [];

    return elementToUse.get().map(item => {
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
