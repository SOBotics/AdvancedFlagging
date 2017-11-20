import { SimpleCache } from './SimpleCache';

export class SimpleCacheWrapper {
    public async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        return SimpleCache.GetAndCache(cacheKey, getterPromise, expiresAt);
    }
    public ClearCache() {
        SimpleCache.ClearCache();
    }
    public GetFromCache<T>(cacheKey: string): T | undefined {
        return SimpleCache.GetFromCache(cacheKey);
    }

    public StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        SimpleCache.StoreInCache(cacheKey, item, expiresAt);
    }
}
