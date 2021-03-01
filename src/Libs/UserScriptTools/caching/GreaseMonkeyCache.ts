interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
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
        const jsonItem = GM_getValue(cacheKey, null);
        if (!jsonItem) return null;

        const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<T>;
        if (dataItem.Expires && new Date(dataItem.Expires) < new Date()) return null;

        return dataItem.Data;
    }

    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date): void {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        GM_setValue(cacheKey, jsonStr);
    }

    public static Unset(cacheKey: string): void {
        GM_deleteValue(cacheKey);
    }
}
