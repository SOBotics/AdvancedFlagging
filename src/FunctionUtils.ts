const hasStorage = typeof (Storage) !== undefined;

export interface ExpiryingCacheItem<T> {
    Data: T;
    Expires?: Date
}

export function GetAndCache<T>(cacheKey: string, getterPromise: Promise<T>, expiresAt?: Date): Promise<T> {
    let cachedItem = GetFromCache<T>(cacheKey);
    if (cachedItem) {
        return Promise.resolve(cachedItem);
    }

    getterPromise.then(result => { StoreInCache(cacheKey, result, expiresAt); });
    return getterPromise;
}

export function GetFromCache<T>(cacheKey: string): T | undefined {
    if (hasStorage) {
        const cachedItem = localStorage.getItem(cacheKey);
        if (cachedItem) {
            try {
                const actualItem = <ExpiryingCacheItem<T>>JSON.parse(cachedItem);
                if (actualItem.Expires && actualItem.Expires < new Date()) {
                    // It expired, so return nothing
                    return;
                }
                return actualItem.Data;
            } catch (error) { }
        }
    }
}

export function StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
    if (hasStorage) {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        localStorage.setItem(cacheKey, jsonStr);
    }
}

export function GroupBy<T>(collection: T[], propertyGetter: (item: T) => any) {
    return collection.reduce(function (previousValue: any, currentItem: T) {
        (previousValue[propertyGetter(currentItem)] = previousValue[propertyGetter(currentItem)] || []).push(currentItem);
        return previousValue;
    }, {});
};

export function GetMembers(item: any): string[] {
    let members = [];
    for (let key in item) {
        if (item.hasOwnProperty(key)) {
            members.push(key);
        }
    }
    return members;
}