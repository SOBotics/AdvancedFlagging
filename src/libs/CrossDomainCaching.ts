declare const xdLocalStorage: any;
interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date;
}

export class CrossDomainCaching {
    public static InitializeCache(iframeUrl: string) {
        xdLocalStorage.init({
            iframeUrl,
            initCallback: () => {
                CrossDomainCaching.xdLocalStorageInitializedResolver();
            }
        });
    }
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = await this.GetFromCache<T>(cacheKey);
        if (cachedItem !== undefined) {
            return cachedItem;
        }

        const result = await getterPromise();
        this.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static async ClearCache() {
        await CrossDomainCaching.xdLocalStorageInitialized;
        xdLocalStorage.clear();
    }

    public static async GetFromCache<T>(cacheKey: string): Promise<T | undefined> {
        await CrossDomainCaching.xdLocalStorageInitialized;
        return new Promise<T | undefined>((resolve, reject) => {
            CrossDomainCaching.xdLocalStorageInitialized.then(() => {
                xdLocalStorage.getItem(cacheKey, (data: any) => {
                    if (!data.value) {
                        resolve();
                    }
                    const actualItem = JSON.parse(data.value) as ExpiryingCacheItem<T>;
                    if (actualItem.Expires && actualItem.Expires < new Date()) {
                        resolve();
                        return;
                    }
                    return resolve(actualItem.Data);
                });
            });
        });
    }

    public static async StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        await CrossDomainCaching.xdLocalStorageInitialized;
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        xdLocalStorage.setItem(cacheKey, jsonStr);
    }

    private static xdLocalStorageInitialized = new Promise<void>((resolve, reject) => CrossDomainCaching.xdLocalStorageInitializedResolver = resolve);
    // tslint:disable-next-line:no-empty
    private static xdLocalStorageInitializedResolver = () => { };
}
