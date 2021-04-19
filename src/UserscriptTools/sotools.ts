import { isFlagsPage, isQuestionPage, isNatoPage, parseDate, isLqpReviewPage, PostType } from '../GlobalVars';

export type QuestionPageInfo = QuestionQuestion | QuestionAnswer;
export type PostInfo = NatoAnswer | QuestionPageInfo | FlagPageInfo;

interface QuestionQuestion { // the question on a question page
    type: 'Question';
    element: JQuery;
    page: 'Question';
    postId: number;
    creationDate: Date;
    score: number;
    authorReputation: number;
    authorName: string;
    addListener: boolean; // in case a post is destroyed, then we don't want to add a click listener twice
}

interface QuestionAnswer { // an answer on a question page or in review
    type: 'Answer';
    element: JQuery;
    page: 'Question';
    postId: number;
    questionTime: Date;
    creationDate: Date;
    score: number;
    authorReputation: number;
    authorName: string;
    addListener: boolean;
}

interface NatoAnswer {
    type: 'Answer';
    element: JQuery;
    page: 'NATO';
    postId: number;
    creationDate: Date;
    questionTime: Date;
    authorReputation: number;
    authorName: string;
}

interface FlagPageInfo {
    type: PostType;
    element: JQuery;
    page: 'Flags';
    postId: number;
    creationDate: Date;
    authorName: string;
    questionTime: null;
}

interface PostDetails {
    score: number;
    authorReputation: number;
    authorName: string;
    authorId?: number;
    creationDate: Date | null;
}

$.event.special.destroyed = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: (o: any): void => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (o.handler) o.handler();
    }
};

function parseNatoPage(callback: (post: NatoAnswer) => void): void {
    $('.answer-hyperlink').parent().parent().each((_index, element) => {
        const node = $(element);
        const answerHref = node.find('.answer-hyperlink').attr('href');
        if (!answerHref) return;

        const postId = Number(answerHref.split('#')[1]);

        const creationDate = parseActionDate(node.find('.user-action-time'));
        const questionTime = parseActionDate(node.find('td .relativetime'));
        if (!creationDate || !questionTime) return;

        const authorReputation = parseReputation(node.find('.reputation-score'));
        const authorName = parseAuthorDetails(node.find('.user-details'));

        callback({
            type: 'Answer' as const,
            element: node,
            page: 'NATO' as const,
            postId,
            creationDate,
            questionTime,
            authorReputation,
            authorName
        });
    });
}

function getPostDetails(node: JQuery): PostDetails {
    const score = Number(node.find('.js-vote-count').text());

    const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
    const authorName = parseAuthorDetails(node.find('.user-info .user-details').last());

    const creationDate = parseActionDate(node.find('.user-info .relativetime').last());
    return { score, authorReputation, authorName, creationDate };
}

function parseAnswerDetails(aNode: JQuery, callback: (post: QuestionPageInfo) => void, questionTime: Date | null, addListener: boolean): void {
    const answerIdString = aNode.attr('data-answerid');
    if (!answerIdString || !questionTime) return;

    const answerId = Number(answerIdString);
    const postDetails = getPostDetails(aNode);
    if (!postDetails.creationDate) return;

    aNode.find('.answercell').on('destroyed', () => {
        setTimeout(() => parseAnswerDetails($(`#answer-${answerId}`), callback, questionTime, false));
    });

    callback({
        type: 'Answer' as const,
        element: aNode,
        page: 'Question' as const,
        postId: answerId,
        questionTime,
        creationDate: postDetails.creationDate,
        score: postDetails.score,
        authorReputation: postDetails.authorReputation,
        authorName: postDetails.authorName,
        addListener
    });
}

function parseQuestionPage(callback: (post: QuestionPageInfo) => void): void {
    let question: QuestionQuestion;
    const parseQuestionDetails = (qNode: JQuery, addListener: boolean): void => {
        const questionIdString = qNode.attr('data-questionid');
        if (!questionIdString) return;

        const postId = Number(questionIdString);
        const postDetails = getPostDetails(qNode);
        if (!postDetails.creationDate) return;

        qNode.find('.postcell').on('destroyed', () => {
            setTimeout(() => parseQuestionDetails($(`[data-questionid="${postId}"]`), false));
        });

        callback(question = {
            type: 'Question' as const,
            element: qNode,
            page: 'Question' as const,
            postId,
            creationDate: postDetails.creationDate,
            score: postDetails.score,
            authorReputation: postDetails.authorReputation,
            authorName: postDetails.authorName,
            addListener
        });
    };
    const questionNode = $('.question');
    parseQuestionDetails(questionNode, true);

    $('.answer').each((_index, element) => parseAnswerDetails($(element), callback, question.creationDate, true));
}

function parseFlagsPage(callback: (post: FlagPageInfo) => void): void {
    $('.flagged-post').each((_index, nodeEl) => {
        const node = $(nodeEl);
        const type: PostType = node.find('.answer-hyperlink').length ? 'Answer' : 'Question';
        const elementHref = node.find(`.${type.toLowerCase()}-hyperlink`).attr('href');
        if (!elementHref) return;

        const postId = Number(type === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
        const authorName = parseAuthorDetails(node.find('.post-user-info'));
        const creationDate = parseActionDate(node.find('.post-user-info .relativetime'));
        if (!creationDate) return;

        callback({
            type: type,
            element: node,
            page: 'Flags' as const,
            postId,
            creationDate,
            authorName,
            questionTime: null
        });
    });
}

export function parseQuestionsAndAnswers(callback: (post: PostInfo) => void): void {
    if (isNatoPage) {
        parseNatoPage(callback);
    } else if (isQuestionPage) {
        parseQuestionPage(callback);
    } else if (isFlagsPage) {
        parseFlagsPage(callback);
    } else if (isLqpReviewPage) {
        parseAnswerDetails($('.answer'), callback, parseDate($('.post-signature.owner .user-action-time span').attr('title')), true);
    }
}

function parseReputation(reputationDiv: JQuery): number {
    let reputationText = reputationDiv.text()?.replace(/,/g, '');
    if (!reputationText) return 0;

    if (reputationText.includes('k')) {
        reputationText = reputationText.replace(/\./g, '').replace(/k/, '');
        return Number(reputationText) * 1000;
    } else return Number(reputationText);
}

function parseAuthorDetails(authorDiv: JQuery): string {
    return authorDiv.find('a').text();
}

function parseActionDate(actionDiv: JQuery): Date | null {
    return parseDate((actionDiv.hasClass('relativetime') ? actionDiv : actionDiv.find('.relativeTime')).attr('title'));
}
