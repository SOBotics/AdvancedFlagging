import Post from './Post';

type Pages = 'Question' | 'NATO' | 'Flags' | 'Search';

export default class Page {
    public readonly name: Pages | '';
    public readonly posts: Post[] = [];

    public static readonly isStackOverflow = /^https:\/\/stackoverflow.com/.test(location.href);
    public static readonly isQuestionPage = /\/questions\/\d+.*/.test(location.href);
    public static readonly isLqpReviewPage = /\/review\/low-quality-posts\/\d+/.test(location.href);

    private readonly href: URL;
    private readonly selector: string;

    constructor(href: URL) {
        this.href = href;
        this.name = this.getName();

        this.selector = this.getPostSelector();
        this.posts = this.getPosts();
    }

    public getAllPostIds(
        includeQuestion: boolean,
        urlForm: boolean
    ): (number | string)[] {
        return this.posts
            .filter(post => {
                if (!includeQuestion) return post.type !== 'Question';
            })
            .map(({ id, type }) => {
                const urlType = type === 'Answer' ? 'a' : 'questions';

                return urlForm
                    ? `//${window.location.hostname}/${urlType}/${id}`
                    : id;
            });
    }

    private getName(): Pages | '' {
        const isQuestionPage = /\/questions\/\d+.*/.test(location.href);
        const isNatoPage = this.href.pathname.startsWith('/tools/new-answers-old-questions');
        const isFlagsPage = /\/users\/flag-summary\/\d+/.test(location.href);
        const isSearch = this.href.pathname.startsWith('/search');

        if (isFlagsPage) return 'Flags';
        else if (isNatoPage) return 'NATO';
        else if (isQuestionPage) return 'Question';
        else if (isSearch) return 'Search';
        else return '';
    }

    private getPostSelector(): string {
        switch (this.name) {
            case 'NATO':
                return '.default-view-post-table > tbody > tr';
            case 'Flags':
                return '.flagged-post';
            case 'Question':
                return '.question, .answer';
            case 'Search':
                return '.js-search-results .s-post-summary';
        }

        return '';
    }

    private getPosts(): Post[] {
        if (this.name === '') return [];

        return ([...document.querySelectorAll(this.selector)] as HTMLElement[])
            .filter(el => !el.querySelector('.advanced-flagging-link, .advanced-flagging-icon'))
            .map(el => new Post(el));
    }
}