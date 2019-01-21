export interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
}
