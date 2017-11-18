export interface SEApiComment {
    body?: string;
    body_markdown?: string;
    can_flag?: boolean;
    comment_id?: number;
    creation_date?: Date;
    edited?: boolean;
    link?: string;

    owner?: SEApiShallowUser;
    post_id?: number;
    post_type?: string;
    reply_to_user?: SEApiShallowUser;

    score?: number;
    upvoted?: boolean;
}

export interface SEApiShallowUser {
    accept_rate?: number;

    /**
     * Not yet implemented
     */
    badge_counts?: any;

    link?: string;
    profile_image?: string;
    reputation?: number;
    user_id?: number;
    user_type?: 'unregistered' | 'registered' | 'moderator' | 'does_not_exist';
}

// Everything is optional, as it's possible to turn off fields via filters.
export interface SEApiWrapper<TResultType> {
    items?: TResultType[];
    has_more?: boolean;
    quota_max?: number;
    quota_remaining?: number;

    backoff?: number;
    error_id?: number;
    error_message?: string;
    error_name?: string;

    page?: number;
    page_size?: number;

    total?: number;
    type?: string;
}
