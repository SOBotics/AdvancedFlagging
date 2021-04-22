interface ExpiryingCacheItem<T> {
    Data: T;
    Expires: Date;
}

export class GreaseMonkeyCache {
    public static async getAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = GreaseMonkeyCache.getFromCache<T>(cacheKey);
        if (cachedItem) return cachedItem;

        const result = await getterPromise();
        GreaseMonkeyCache.storeInCache(cacheKey, result, expiresAt);
        return result;
    }

    // There are two kinds of objects that are stored in the cache: those that expire (only fkey currently) and those that are not
    // The type of those that are expirable is ExpiryingCacheItem. The others are strings or objects
    // To make TS happy and avoid runtime errors, we need to take into account both cases
    public static getFromCache<T>(cacheKey: string): T | null {
        const cachedItem = GM_getValue<T | ExpiryingCacheItem<T>>(cacheKey);
        // first check if the item is actually expirable, then check if it's expired
        const isItemExpired = typeof cachedItem === 'object' && 'Data' in cachedItem && new Date(cachedItem.Expires) < new Date();
        if (!cachedItem || isItemExpired) return null;

        return typeof cachedItem === 'object' && 'Data' in cachedItem ? cachedItem.Data : cachedItem;
    }

    public static storeInCache<T>(cacheKey: string, item: T, expiresAt?: Date): void {
        const jsonObject = expiresAt ? { Expires: expiresAt, Data: item } : item;
        GM_setValue(cacheKey, jsonObject);
    }

    public static unset(cacheKey: string): void {
        GM_deleteValue(cacheKey);
    }
}
