import * as globals from '../../GlobalVars';

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
}

export interface FlagPageInfo {
    type: 'Answer' | 'Question';
    element: JQuery;
    page: 'Flags';
    postId: number;
    postTime: Date;
    authorName: string;
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

        const answerTime = parseActionDate(node.find('.user-action-time'));
        const questionTime = parseActionDate(node.find('td .relativetime'));
        if (!answerTime || !questionTime) return;

        const authorReputation = parseReputation(node.find('.reputation-score'));
        const authorName = parseAuthorDetails(node.find('.user-details'));

        callback({
            type: 'Answer' as const,
            element: node,
            page: 'NATO' as const,
            postId,
            answerTime,
            questionTime,
            authorReputation,
            authorName
        });
    });
}

function getPostDetails(node: JQuery): { score: number, authorReputation?: number, authorName: string, authorId?: number, postTime: Date | null } {
    const score = Number(node.find('.js-vote-count').text());

    const authorReputation = parseReputation(node.find('.user-info .reputation-score').last());
    const authorName = parseAuthorDetails(node.find('.user-info .user-details').last());

    const postTime = parseActionDate(node.find('.user-info .relativetime').last());
    return { score, authorReputation, authorName, postTime };
}

function parseAnswerDetails(aNode: JQuery, callback: (post: QuestionPageInfo) => void, question: QuestionQuestion): void {
    const answerIdString = aNode.attr('data-answerid');
    if (!answerIdString) return;

    const answerId = Number(answerIdString);
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
        authorName: postDetails.authorName
    });
}

function parseQuestionPage(callback: (post: QuestionPageInfo) => void): void {
    let question: QuestionQuestion;
    const parseQuestionDetails = (qNode: JQuery): void => {
        const questionIdString = qNode.attr('data-questionid');
        if (!questionIdString) return;

        const postId = Number(questionIdString);
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
            authorName: postDetails.authorName
        };
        callback(question);
    };
    const questionNode = $('.question');
    parseQuestionDetails(questionNode);

    $('.answer').each((_index, element) => parseAnswerDetails($(element), callback, question));
}

function parseFlagsPage(callback: (post: FlagPageInfo) => void): void {
    $('.flagged-post').each((_index, nodeEl) => {
        const node = $(nodeEl);
        const type = node.find('.answer-hyperlink').length ? 'Answer' : 'Question';
        const elementHref = node.find(`.${type.toLowerCase()}-hyperlink`).attr('href');
        if (!elementHref) return;

        const postId = Number(type === 'Answer' ? elementHref.split('#')[1] : elementHref.split('/')[2]);
        const authorName = parseAuthorDetails(node.find('.post-user-info'));
        const postTime = parseActionDate(node.find('.post-user-info .relativetime'));
        if (!postTime) return;

        callback({
            type: type,
            element: node,
            page: 'Flags' as const,
            postId,
            postTime,
            authorName
        });
    });
}

function parseGenericPage(callback: (post: GenericPageInfo) => void): void {
    $('.question-hyperlink').each((_index, node) => {
        const questionNode = $(node);
        const questionHref = questionNode.attr('href');
        if (!questionHref) return;

        let fragment = questionHref.split('/')[2];
        if (fragment.indexOf('_') >= 0) {
            fragment = fragment.split('_')[1];
        }
        const postId = Number(fragment);

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
        const postId = Number(fragment);

        callback({
            type: 'Answer' as const,
            element: answerNode,
            page: 'Unknown' as const,
            postId
        });
    });
}

export function parseQuestionsAndAnswers(callback: (post: PostInfo) => void): void {
    if (globals.isNatoPage()) {
        parseNatoPage(callback);
    } else if (globals.isQuestionPage()) {
        parseQuestionPage(callback);
    } else if (globals.isFlagsPage()) {
        parseFlagsPage(callback);
    } else if (!globals.isModPage() && !globals.isUserPage() && !StackExchange.options.user.isModerator) {
        parseGenericPage(callback);
    }
}

function parseReputation(reputationDiv: JQuery): number {
    let reputationText = reputationDiv.text();
    const reputationDivTitle = reputationDiv.attr('title');
    if (!reputationDivTitle) return 0;

    if (reputationText.indexOf('k') !== -1) {
        reputationText = reputationDivTitle.substr('reputation score '.length);
    }
    reputationText = reputationText.replace(',', '');

    return Number(reputationText);
}

function parseAuthorDetails(authorDiv: JQuery): string {
    const userLink = authorDiv.find('a');
    const authorName = userLink.text();

    return authorName;
}

function parseActionDate(actionDiv: JQuery): Date | null {
    return parseDate((actionDiv.hasClass('relativetime') ? actionDiv : actionDiv.find('.relativeTime')).attr('title'));
}

export function parseDate(dateStr?: string): Date | null {
    // Fix for safari
    return dateStr ? new Date(dateStr.replace(' ', 'T')) : null;
}
