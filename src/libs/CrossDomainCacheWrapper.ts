import { CrossDomainCache } from './CrossDomainCache';

export class CrossDomainCachingWrapper {
    public async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        return CrossDomainCache.GetAndCache<T>(cacheKey, getterPromise, expiresAt);
    }
    public ClearCache() {
        CrossDomainCache.ClearCache();
    }

    public async GetFromCache<T>(cacheKey: string): Promise<T | undefined> {
        return CrossDomainCache.GetFromCache<T>(cacheKey);
    }

    public StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        CrossDomainCache.StoreInCache<T>(cacheKey, item, expiresAt);
    }
}
