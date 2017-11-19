interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
}

export class SimpleCache {
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = SimpleCache.GetFromCache<T>(cacheKey);
        if (cachedItem !== null) {
            return cachedItem;
        }

        const result = await getterPromise();
        SimpleCache.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static ClearCache() {
        localStorage.clear();
    }

    public static GetFromCache<T>(cacheKey: string): T | null {
        const jsonItem = localStorage.getItem(cacheKey);
        if (jsonItem === null) {
            return null;
        }
        const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<T>;
        if ((dataItem.Expires && dataItem.Expires < new Date())) {
            // It doesn't exist or is expired, so return nothing
            return null;
        }
        return dataItem.Data;
    }

    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        localStorage.setItem(cacheKey, jsonStr);
    }
}
