import * as globals from '../../../GlobalVars';

export type QuestionPageInfo = QuestionQuestion | QuestionAnswer;
declare let StackExchange: any;
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

($ as any).event.special.destroyed = {
    remove: (o: any) => {
        if (o.handler) {
            o.handler();
        }
    }
};

function parseNatoPage(callback: (post: NatoAnswer) => void) {
    $('.answer-hyperlink').parent().parent().each((_index, element) => {
        const node = $(element);
        const postId = parseInt(node.find('.answer-hyperlink').attr('href').split('#')[1], 10);

        const answerTime = parseActionDate(node.find('.user-action-time'));
        const questionTime = parseActionDate(node.find('td .relativetime'));

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
    const score = parseInt(node.find('.vote-count-post').text(), 10);

    const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
    const { authorName, authorId } = parseAuthorDetails(node.find('.user-info .user-details').last());

    const postTime = parseActionDate(node.find('.user-info .relativetime').last());
    return { score, authorReputation, authorName, authorId, postTime };
}

function parseAnswerDetails(aNode: JQuery, callback: (post: QuestionPageInfo) => void, question: QuestionQuestion) {
    const answerId = parseInt(aNode.attr('data-answerid'), 10);

    const postDetails = getPostDetails(aNode);

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
        const postId = parseInt(qNode.attr('data-questionid'), 10);

        const postDetails = getPostDetails(qNode);

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

        const postId =
            parseInt(
                type === 'Answer'
                    ? node.find('.answer-hyperlink').attr('href').split('#')[1]
                    : node.find('.question-hyperlink').attr('href').split('/')[2]
                , 10);
        const score = parseInt(node.find('.answer-votes').text(), 10);

        const { authorName, authorId } = parseAuthorDetails(node.find('.post-user-info'));
        const postTime = parseActionDate(node.find('.post-user-info .relativetime'));

        const handledTime = parseActionDate(node.find('.mod-flag .relativetime'));
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
    const questionNodes = $('.question-hyperlink');
    for (let i = 0; i < questionNodes.length; i++) {
        const questionNode = $(questionNodes[i]);
        let fragment = questionNode.attr('href').split('/')[2];
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
    }
    $('.answer-hyperlink').each((_index, element) => {
        const answerNode = $(element);
        let fragment = answerNode.attr('href').split('#')[1];
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

export function parseQuestionsAndAnswers(callback: (post: PostInfo) => Promise<void>) {
    if (globals.isNatoPage()) {
        parseNatoPage(callback);
    } else if (globals.isQuestionPage()) {
        parseQuestionPage(callback);
    } else if (globals.isFlagsPage()) {
        parseFlagsPage(callback);
    } else if (globals.isModPage() || globals.isUserPage() || (StackExchange as any).options.user.isModerator) {
        return;
    } else {
        parseGenericPage(callback);
    }
}

function parseReputation(reputationDiv: JQuery) {
    let reputationText = reputationDiv.text();
    if (reputationText.indexOf('k') !== -1) {
        reputationText = reputationDiv.attr('title').substr('reputation score '.length);
    }
    reputationText = reputationText.replace(',', '');
    if (reputationText.trim() !== '') {
        return parseInt(reputationText, 10);
    }
    return undefined;
}
function parseAuthorDetails(authorDiv: JQuery) {
    const userLink = authorDiv.find('a');
    const authorName = userLink.text();
    const userLinkRef = userLink.attr('href');
    let authorId: number | undefined;
    // Users can be deleted, and thus have no link to their profile.
    if (userLinkRef) {
        authorId = parseInt(userLinkRef.split('/')[2], 10);
    }
    return { authorName, authorId };
}
function parseActionDate(actionDiv: JQuery) {
    if (!actionDiv.hasClass('relativetime')) {
        actionDiv = actionDiv.find('.relativetime');
    }
    const answerTime = parseDate(actionDiv.attr('title'));
    return answerTime;
}

export function parseDate(dateStr: string) {
    // Fix for safari
    return new Date(dateStr.replace(' ', 'T'));
}
