export interface StackExchangePost {
    ParentQuestion?: StackExchangePost,

    PostId: number,
    CreationDate: Date,
    AuthorName: string;
    AuthorId: number;

    Element: JQuery;
}