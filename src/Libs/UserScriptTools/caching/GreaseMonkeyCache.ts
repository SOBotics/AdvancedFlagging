import { ExpiryingCacheItem } from '@userscriptTools/caching/ExpiringCacheItem';

declare const GM_listValues: () => string[];
declare const GM_getValue: (key: string, defaultValue: any) => any;
declare const GM_setValue: (key: string, value: any) => void;
declare const GM_deleteValue: (key: string) => void;

export class GreaseMonkeyCache {
    public static async GetAndCache<T>(cacheKey: string, getterPromise: () => Promise<T>, expiresAt?: Date): Promise<T> {
        const cachedItem = GreaseMonkeyCache.GetFromCache<T>(cacheKey);
        if (cachedItem !== undefined) {
            return cachedItem;
        }

        const result = await getterPromise();
        GreaseMonkeyCache.StoreInCache(cacheKey, result, expiresAt);
        return result;
    }

    public static ClearExpiredKeys(regexes?: RegExp[]) {
        GM_listValues().forEach(key => {
            if (!regexes || regexes.filter(r => key.match(r)).length > 0) {
                const jsonItem = GM_getValue(key, undefined);
                if (jsonItem) {
                    try {
                        const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<any>;
                        if ((dataItem.Expires && new Date(dataItem.Expires) < new Date())) {
                            GreaseMonkeyCache.Unset(key);
                        }
                    } catch {
                        // Don't care
                    }
                }
            }
        });
    }

    public static ClearAll(regexes: RegExp[], condition?: (item: string | null) => boolean) {
        GM_listValues().forEach(key => {
            if (regexes.filter(r => key.match(r)).length > 0) {
                if (condition) {
                    const val = GM_getValue(key, undefined);
                    if (condition(val)) {
                        GreaseMonkeyCache.Unset(key);
                    }
                } else {
                    GreaseMonkeyCache.Unset(key);
                }
            }
        });
    }

    public static GetFromCache<T>(cacheKey: string): T | undefined {
        const jsonItem = GM_getValue(cacheKey, undefined);
        if (!jsonItem) {
            return undefined;
        }
        const dataItem = JSON.parse(jsonItem) as ExpiryingCacheItem<T>;
        if ((dataItem.Expires && new Date(dataItem.Expires) < new Date())) {
            return undefined;
        }
        return dataItem.Data;
    }

    public static StoreInCache<T>(cacheKey: string, item: T, expiresAt?: Date) {
        const jsonStr = JSON.stringify({ Expires: expiresAt, Data: item });
        GM_setValue(cacheKey, jsonStr);
    }

    public static Unset(cacheKey: string) {
        GM_deleteValue(cacheKey);
    }
}
