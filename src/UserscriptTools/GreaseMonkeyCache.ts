interface ExpiryingCacheItem<T> {
    Data: T;
    Expires: Date;
}

export class GreaseMonkeyCache {
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = GreaseMonkeyCache.GetFromCache<T>(cacheKey);
        if (cachedItem) return cachedItem;

        const result = await getterPromise();
        GreaseMonkeyCache.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static GetFromCache<T>(cacheKey: string): T | null {
        const cachedItem = GM_getValue<T | ExpiryingCacheItem<T>>(cacheKey);
        const isItemExpired = typeof cachedItem === 'object' && 'Data' in cachedItem && new Date(cachedItem.Expires) < new Date();
        if (!cachedItem || isItemExpired) return null;

        return typeof cachedItem === 'object' && 'Data' in cachedItem ? cachedItem.Data : cachedItem;
    }

    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date): void {
        const jsonObject = expiresAt ? { Expires: expiresAt, Data: item } : item;
        GM_setValue(cacheKey, jsonObject);
    }

    public static Unset(cacheKey: string): void {
        GM_deleteValue(cacheKey);
    }
}
