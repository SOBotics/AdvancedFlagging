interface ExpiryingCacheItem<T> {
    Data: T;
    Expires: Date;
}

export class Store {
    public static async getAndCache<T>(
        cacheKey: string,
        getterPromise: () => Promise<T>,
        expiresAt?: Date
    ): Promise<T> {
        const cachedItem = Store.get<T>(cacheKey);
        if (cachedItem) return cachedItem;

        const result = await getterPromise();
        Store.set(cacheKey, result, expiresAt);

        return result;
    }

    // There are two kinds of objects that are stored in the cache:
    // - those that expire (only fkey currently)
    // - those that are not
    //
    // The type of those that are expirable is ExpiryingCacheItem.
    // The others are strings or objects.
    // To make TS happy and avoid runtime errors, we need to take into account both cases.
    public static get<T>(cacheKey: string): T | null {
        const cachedItem = GM_getValue<T | ExpiryingCacheItem<T>>(cacheKey);
        if (!cachedItem) return null;

        const isItemExpired = typeof cachedItem === 'object'
                          && 'Data' in cachedItem // is expirable
                          && new Date(cachedItem.Expires) < new Date(); // and has not expired

        if (isItemExpired) return null;

        return typeof cachedItem === 'object' && 'Data' in cachedItem
            ? cachedItem.Data
            : cachedItem;
    }

    public static set<T>(cacheKey: string, item: T, expiresAt?: Date): void {
        const jsonObject = expiresAt
            ? { Expires: expiresAt.getTime(), Data: item }
            : item;

        GM_setValue(cacheKey, jsonObject);
    }

    public static unset(cacheKey: string): void {
        GM_deleteValue(cacheKey);
    }
}
