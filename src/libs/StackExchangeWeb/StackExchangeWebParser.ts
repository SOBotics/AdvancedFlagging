export function isNatoPage() {
    return !!window.location.href.match(/\/new-answers-old-questions/);
}
export function* parseNatoPage() {
    const nodes = $('.answer-hyperlink').parent().parent();
    for (var i = 0; i < nodes.length; i++) {
        const node = $(nodes[i]);

        const postId = parseInt(node.find('.answer-hyperlink').attr('href').split('#')[1], 10)

        const answerTime = parseActionDate(node.find('.user-action-time'));
        const questionTime = parseActionDate(node.find('td .relativetime'));

        const reputation = parseReputation(node.find('.reputation-score'));
        const { authorName, authorId } = parseAuthorDetails(node.find('.user-details'));

        yield {
            element: node,
            postId,
            answerTime,
            questionTime,
            reputation,
            authorName,
            authorId,
        }
    }
}

function parseReputation(reputationDiv: JQuery) {
    let reputationText = reputationDiv.text();
    if (reputationText.indexOf('k') !== -1) {
        reputationText = reputationDiv.attr('title').substr('reputation score '.length);
    }
    reputationText = reputationText.replace(',', '');
    return parseInt(reputationText, 10);
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
    const answerTime = new Date(actionDiv.attr('title'));
    return answerTime;
}