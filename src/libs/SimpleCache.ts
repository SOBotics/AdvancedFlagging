interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
}

export class SimpleCache {
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = SimpleCache.GetFromCache<T>(cacheKey);
        if (cachedItem !== undefined) {
            return cachedItem;
        }

        const result = await getterPromise();
        SimpleCache.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static ClearCache() {
        localStorage.clear();
    }

    public static GetFromCache<T>(cacheKey: string): T | undefined {
        const jsonItem = localStorage.getItem(cacheKey);
        if (!jsonItem) {
            return undefined;
        }
        const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<T>;
        if ((dataItem.Expires && dataItem.Expires < new Date())) {
            return undefined;
        }
        return dataItem.Data;
    }

    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        localStorage.setItem(cacheKey, jsonStr);
    }
}
