import Post from './Post';

type Pages = 'Question' | 'NATO' | 'Flags' | 'Search' | 'Review' | 'Staging Ground';

export default class Page {
    public static readonly isStackOverflow = /^https:\/\/stackoverflow.com/.test(location.href);
    public static readonly isQuestionPage = /\/questions\/\d+.*/.test(location.href);
    public static readonly isLqpReviewPage = /\/review\/low-quality-posts(?:\/\d+)?(?:\/)?$/.test(location.href);
    public static readonly isStagingGroundPage = /\/staging-ground\/\d+/.test(location.href);

    public readonly name: Pages | '';
    public readonly posts: Post[] = [];

    private readonly href: URL;
    private readonly selector: string;

    constructor(
        // whether to include posts AF has parsed
        // useful for review
        private readonly includeModified = false
    ) {
        this.href = new URL(location.href);
        this.name = this.getName();

        this.selector = this.getPostSelector();
        this.posts = this.getPosts();

        const question = document.querySelector<HTMLElement>('.question');
        if (Page.isLqpReviewPage && question) {
            // populate Post.qDate
            const post = new Post(question);

            Post.qDate = post.date;
        }
    }

    public getAllPostIds(
        includeQuestion: boolean,
        urlForm: boolean
    ): (number | string)[] {
        return this.posts
            .filter(post => {
                if (!includeQuestion) return post.type !== 'Question';
                else return true;
            })
            .map(({ id, type }) => {
                const urlType = type === 'Answer' ? 'a' : 'questions';

                return urlForm
                    ? `//${window.location.hostname}/${urlType}/${id}`
                    : id;
            });
    }

    private getName(): Pages | '' {
        const isNatoPage = this.href.pathname.startsWith('/tools/new-answers-old-questions');
        const isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);
        const isSearch = this.href.pathname.startsWith('/search');

        if (isFlagsPage) return 'Flags';
        else if (isNatoPage) return 'NATO';
        else if (Page.isQuestionPage) return 'Question';
        else if (isSearch) return 'Search';
        else if (Page.isLqpReviewPage) return 'Review';
        else if (Page.isStagingGroundPage) return 'Staging Ground';
        else return '';
    }

    private getPostSelector(): string {
        switch (this.name) {
            case 'NATO':
                return '.default-view-post-table > tbody > tr';
            case 'Flags':
                return '.flagged-post';
            case 'Question':
            case 'Staging Ground':
                return '.question, .answer';
            case 'Search':
                return '.js-search-results .s-post-summary';
            case 'Review':
                return '#answer .answer';
            default:
                return '';
        }
    }

    private getPosts(): Post[] {
        if (this.name === '') return [];

        return ([...document.querySelectorAll(this.selector)] as HTMLElement[])
            .filter(el => {
                return !el.querySelector('.advanced-flagging-link, .advanced-flagging-icon')
                    || this.includeModified;
            })
            .map(el => new Post(el));
    }
}
