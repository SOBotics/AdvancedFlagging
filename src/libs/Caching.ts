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

export function GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
    const cachedItemPromise = GetFromCache<T>(cacheKey);
    return new Promise(resolve => {
        cachedItemPromise.then(cachedItem => {
            if (cachedItem !== undefined) {
                resolve(cachedItem);
                return;
            }

            const promise = getterPromise();
            promise.then(result => { StoreInCache(cacheKey, result, expiresAt); });
            promise.then(result => resolve(result));
        });
    });
}

export function GetFromCache<T>(cacheKey: string): Promise<T | undefined> {
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

export function StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
    xdLocalStorageInitialized.then(() => {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        xdLocalStorage.setItem(cacheKey, jsonStr);
    });
}
