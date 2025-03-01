import { FlagCategory, FlagType } from '../FlagTypes';

interface ExpiryingCacheItem<T> {
    Data: T;
    Expires: Date;
}

export interface CachedFlag extends FlagType {
    downvote: boolean;
    enabled: boolean;
    belongsTo: string; // the Name of the category it belongs to
}

export type CachedCategory = Omit<FlagCategory, 'FlagTypes'>;

type Mutable<Type> = {
    -readonly [Key in keyof Type]: Type[Key];
};

export type Configuration = Mutable<{
    // so that cache keys aren't duplicated
    [key in keyof (Omit<typeof Cached.Configuration, 'key'>)]: boolean
}> & { // add bot values that don't exist in Cached
    default: {
        smokey: boolean;
        natty: boolean;
        genericbot: boolean;
        guttenberg: boolean;

        comment: boolean;
        flag: boolean;
        delete: boolean;
        downvote: boolean;
    };
};

// Cache keys
export const Cached = {
    Configuration: {
        key: 'Configuration',

        openOnHover: 'openOnHover',

        watchFlags: 'watchFlags',
        watchQueues: 'watchQueues',

        linkDisabled: 'linkDisabled',
        addAuthorName: 'addAuthorName',
        debug: 'debug',
    },
    Fkey: 'fkey',
    Metasmoke: {
        userKey: 'MetaSmoke.userKey',
        disabled: 'MetaSmoke.disabled'
    },

    FlagTypes: 'FlagTypes',
    FlagCategories: 'FlagCategories'
} as const;

export class Store {
    // cache-related helpers/values
    // Some information from cache is stored on the variables as objects to make editing easier and simpler
    // Each time something is changed in the variables, update* must also be called to save the changes to the cache
    public static config = Store.get<Configuration>(Cached.Configuration.key)
        ?? { default: {} } as Partial<Configuration> & { default: object };

    public static categories = Store.get<CachedCategory[]>(Cached.FlagCategories) ?? [] as (Partial<CachedCategory>)[];
    public static flagTypes = Store.get<CachedFlag[]>(Cached.FlagTypes) ?? [];

    public static updateConfiguration = (): void => Store.set(Cached.Configuration.key, this.config);
    public static updateFlagTypes = (): void => Store.set(Cached.FlagTypes, this.flagTypes);

    public static dryRun = this.config[Cached.Configuration.debug];

    // export const updateCategories = (): void => GreaseMonkeyCache.storeInCache(FlagCategoriesKey, cachedCategories);

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
