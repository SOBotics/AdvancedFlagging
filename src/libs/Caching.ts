declare const xdLocalStorage: any;

let xdLocalStorageInitializedResolver = () => { };
const xdLocalStorageInitialized = new Promise<void>((resolve, reject) => xdLocalStorageInitializedResolver = resolve)

interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date
}
export function InitializeCache(iframeUrl: string) {
    xdLocalStorage.init({
        iframeUrl: iframeUrl,
        initCallback: function () {
            xdLocalStorageInitializedResolver();
        }
    })
}

export async function GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
    const cachedItem = await GetFromCache<T>(cacheKey);
    if (cachedItem !== undefined) {
        return cachedItem;
    }

    const result = await getterPromise();
    StoreInCache(cacheKey, result, expiresAt);
    return result;
}

export async function GetFromCache<T>(cacheKey: string): Promise<T | undefined> {
    await xdLocalStorageInitialized;
    return new Promise<T | undefined>((resolve, reject) => {
        xdLocalStorageInitialized.then(() => {
            xdLocalStorage.getItem(cacheKey, (data: any) => {
                const actualItem = <ExpiryingCacheItem<T>>JSON.parse(data.value);
                if (!actualItem || (actualItem.Expires && actualItem.Expires < new Date())) {
                    // It doesn't exist or is expired, so return nothing
                    resolve();
                    return;
                }
                return resolve(actualItem.Data);
            })
        })
    });
}

export async function StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
    await xdLocalStorageInitialized;
    const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
    xdLocalStorage.setItem(cacheKey, jsonStr);
}
