// tslint:disable-next-line:typeof-compare
const hasStorage = typeof (Storage) !== undefined;
declare const xdLocalStorage: any;

let xdLocalStorageInitializedResolver = () => { };
const xdLocalStorageInitialized = new Promise<void>((resolve, reject) => xdLocalStorageInitializedResolver = resolve)

xdLocalStorage.init({
    iframeUrl: "https://metasmoke.erwaysoftware.com/xdom_storage.html",
    initCallback: function () {
        xdLocalStorageInitializedResolver();
    }
})

export interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date
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

export function Delay(milliseconds: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}


export function GroupBy<T>(collection: T[], propertyGetter: (item: T) => any) {
    return collection.reduce(function (previousValue: any, currentItem: T) {
        (previousValue[propertyGetter(currentItem)] = previousValue[propertyGetter(currentItem)] || []).push(currentItem);
        return previousValue;
    }, {});
};

export function GetMembers(item: any): string[] {
    const members = [];
    for (const key in item) {
        if (item.hasOwnProperty(key)) {
            members.push(key);
        }
    }
    return members;
}
