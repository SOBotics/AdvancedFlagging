import * as globals from '../../../GlobalVars';

declare const StackExchange: globals.StackExchange;

export type QuestionPageInfo = QuestionQuestion | QuestionAnswer;
export interface QuestionQuestion {
    type: 'Question';
    element: JQuery;
    page: 'Question';
    postId: number;
    postTime: Date;
    score: number;
    authorReputation?: number;
    authorName: string;
    authorId?: number;
}
export interface QuestionAnswer {
    type: 'Answer';
    element: JQuery;
    page: 'Question';
    postId: number;
    question: QuestionQuestion;
    postTime: Date;
    score: number;
    authorReputation?: number;
    authorName: string;
    authorId?: number;
}
export interface NatoAnswer {
    type: 'Answer';
    element: JQuery;
    page: 'NATO';
    postId: number;
    answerTime: Date;
    questionTime: Date;
    authorReputation?: number;
    authorName: string;
    authorId?: number;
}

export interface FlagPageInfo {
    type: 'Answer' | 'Question';
    element: JQuery;
    page: 'Flags';
    postId: number;
    score: number;
    postTime: Date;
    handledTime: Date;
    handledResult: string;
    handledComment: string;
    authorName: string;
    authorId?: number;
}

export interface GenericPageInfo {
    type: 'Question' | 'Answer';
    element: JQuery;
    page: 'Unknown';
    postId: number;
}

export type PostInfo = NatoAnswer | QuestionPageInfo | FlagPageInfo | GenericPageInfo;

$.event.special.destroyed = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: (o: any) => {
        if (o.handler) {
            o.handler();
        }
    }
};

function parseNatoPage(callback: (post: NatoAnswer) => void) {
    $('.answer-hyperlink').parent().parent().each((_index, element) => {
        const node = $(element);
        const answerHref = node.find('.answer-hyperlink').attr('href');
        if (!answerHref) return;

        const postId = parseInt(answerHref.split('#')[1], 10);

        const answerTime = parseActionDate(node.find('.user-action-time'));
        const questionTime = parseActionDate(node.find('td .relativetime'));
        if (!answerTime || !questionTime) return;

        const authorReputation = parseReputation(node.find('.reputation-score'));
        const { authorName, authorId } = parseAuthorDetails(node.find('.user-details'));

        callback({
            type: 'Answer' as const,
            element: node,
            page: 'NATO' as const,
            postId,
            answerTime,
            questionTime,
            authorReputation,
            authorName,
            authorId,
        });
    });
}

function getPostDetails(node: JQuery) {
    const score = parseInt(node.find('.js-vote-count').text(), 10);

    const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
    const { authorName, authorId } = parseAuthorDetails(node.find('.user-info .user-details').last());

    const postTime = parseActionDate(node.find('.user-info .relativetime').last());
    return { score, authorReputation, authorName, authorId, postTime };
}

function parseAnswerDetails(aNode: JQuery, callback: (post: QuestionPageInfo) => void, question: QuestionQuestion) {
    const answerIdString = aNode.attr('data-answerid');
    if (!answerIdString) return;

    const answerId = parseInt(answerIdString, 10);
    const postDetails = getPostDetails(aNode);
    if (!postDetails.postTime) return;

    aNode.find('.answercell').bind('destroyed', () => {
        setTimeout(() => {
            const updatedAnswerNode = $(`#answer-${answerId}`);
            parseAnswerDetails(updatedAnswerNode, callback, question);
        });
    });

    callback({
        type: 'Answer' as const,
        element: aNode,
        page: 'Question' as const,
        postId: answerId,
        question,
        postTime: postDetails.postTime,
        score: postDetails.score,
        authorReputation: postDetails.authorReputation,
        authorName: postDetails.authorName,
        authorId: postDetails.authorId
    });
}

function parseQuestionPage(callback: (post: QuestionPageInfo) => void) {
    let question: QuestionQuestion;
    const parseQuestionDetails = (qNode: JQuery) => {
        const questionIdString = qNode.attr('data-questionid');
        if (!questionIdString) return;

        const postId = parseInt(questionIdString, 10);
        const postDetails = getPostDetails(qNode);
        if (!postDetails.postTime) return;

        qNode.find('.postcell').bind('destroyed', () => {
            setTimeout(() => {
                const updatedQuestionNode = $(`[data-questionid="${postId}"]`);
                parseQuestionDetails(updatedQuestionNode);
            });
        });

        question = {
            type: 'Question' as const,
            element: qNode,
            page: 'Question' as const,
            postId,
            postTime: postDetails.postTime,
            score: postDetails.score,
            authorReputation: postDetails.authorReputation,
            authorName: postDetails.authorName,
            authorId: postDetails.authorId
        };
        callback(question);
    };
    const questionNode = $('.question');
    parseQuestionDetails(questionNode);

    $('.answer').each((_index, element) => parseAnswerDetails($(element), callback, question));
}

function parseFlagsPage(callback: (post: FlagPageInfo) => void) {
    $('.flagged-post').each((_index, nodeEl) => {
        const node = $(nodeEl);
        const type = node.find('.answer-hyperlink').length ? 'Answer' : 'Question';
        const elementHref = node.find(`.${type.toLowerCase()}-hyperlink`).attr('href');
        if (!elementHref) return;

        const postId =
            parseInt(
                type === 'Answer'
                    ? elementHref.split('#')[1]
                    : elementHref.split('/')[2]
                , 10);
        const score = parseInt(node.find('.answer-votes').text(), 10);

        const { authorName, authorId } = parseAuthorDetails(node.find('.post-user-info'));
        const postTime = parseActionDate(node.find('.post-user-info .relativetime'));
        const handledTime = parseActionDate(node.find('.mod-flag .relativetime'));
        if (!postTime || !handledTime) return;

        const fullHandledResult = node.find('.flag-outcome').text().trim().split(' - ');
        const handledResult = fullHandledResult[0].trim();
        const handledComment = fullHandledResult.slice(1).join(' - ').trim();

        callback({
            type: type as 'Answer' | 'Question',
            element: node,
            page: 'Flags' as const,
            postId,
            score,
            postTime,
            handledTime,
            handledResult,
            handledComment,
            authorName,
            authorId
        });
    });
}

function parseGenericPage(callback: (post: GenericPageInfo) => void) {
    $('.question-hyperlink').each((_index, node) => {
        const questionNode = $(node);
        const questionHref = questionNode.attr('href');
        if (!questionHref) return;

        let fragment = questionHref.split('/')[2];
        if (fragment.indexOf('_') >= 0) {
            fragment = fragment.split('_')[1];
        }
        const postId = parseInt(fragment, 10);

        callback({
            type: 'Question' as const,
            element: questionNode,
            page: 'Unknown' as const,
            postId
        });
    });

    $('.answer-hyperlink').each((_index, element) => {
        const answerNode = $(element);
        const answerNodeHref = answerNode.attr('href');
        if (!answerNodeHref) return;

        let fragment = answerNodeHref.split('#')[1];
        if (fragment.indexOf('_') >= 0) {
            fragment = fragment.split('_')[1];
        }
        const postId = parseInt(fragment, 10);

        callback({
            type: 'Answer' as const,
            element: answerNode,
            page: 'Unknown' as const,
            postId
        });
    });
}

export function parseQuestionsAndAnswers(callback: (post: PostInfo) => Promise<void>): void {
    if (globals.isNatoPage()) {
        parseNatoPage(callback);
    } else if (globals.isQuestionPage()) {
        parseQuestionPage(callback);
    } else if (globals.isFlagsPage()) {
        parseFlagsPage(callback);
    } else if (globals.isModPage() || globals.isUserPage() || StackExchange.options.user.isModerator) {
        return;
    } else {
        parseGenericPage(callback);
    }
}

function parseReputation(reputationDiv: JQuery) {
    let reputationText = reputationDiv.text();
    const reputationDivTitle = reputationDiv.attr('title');
    if (!reputationDivTitle) return;

    if (reputationText.indexOf('k') !== -1) {
        reputationText = reputationDivTitle.substr('reputation score '.length);
    }
    reputationText = reputationText.replace(',', '');

    return parseInt(reputationText, 10) || undefined;
}

function parseAuthorDetails(authorDiv: JQuery) {
    const userLink = authorDiv.find('a');
    const authorName = userLink.text();
    const userLinkRef = userLink.attr('href');
    let authorId: number | undefined;
    // Users can be deleted, and thus have no link to their profile.
    if (userLinkRef) authorId = parseInt(userLinkRef.split('/')[2], 10);

    return { authorName, authorId };
}

function parseActionDate(actionDiv: JQuery) {
    return parseDate((actionDiv.hasClass('relativetime') ? actionDiv : actionDiv.find('.relativeTime')).attr('title'));
}

export function parseDate(dateStr?: string): Date | undefined {
    // Fix for safari
    return dateStr ? new Date(dateStr.replace(' ', 'T')) : undefined;
}

export function getAllAnswerIds(): number[] {
    return $('[id^="answer-"]').get().map(el => $(el).data('answerid'));
}
