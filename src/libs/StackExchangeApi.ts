import { GetFromCache, StoreInCache } from './Caching';
import { SEApiWrapper, SEApiComment } from './StackExchangeApi.Interfaces';
import { GetMembers, GroupBy } from './FunctionUtils';

declare const $: JQueryStatic;
declare const SE: any;

const stackExchangeApiURL = '//api.stackexchange.com/2.2'

export class StackExchangeAPI {
    private getAccessTokenPromise: () => Promise<string>;

    public constructor(accessToken?: string);
    public constructor(clientId: number, key: string);
    public constructor(clientId?: number | string, key?: string) {
        this.initializeAccessToken(clientId, key);
    }

    private initializeAccessToken(clientId?: number | string, key?: string) {
        if (typeof clientId === 'string') {
            this.getAccessTokenPromise = () => Promise.resolve(clientId);
            return;
        }

        if (!clientId || !key) {
            this.getAccessTokenPromise = () => { throw Error('Access token not available. StackExchangeAPI class must be passed either an access token, or a clientId and a key.') };
            return;
        }

        this.getAccessTokenPromise = () => new Promise<string>((resolve, reject) => {
            SE.init({
                clientId,
                key,
                channelUrl: window.location,
                complete: (data: any) => {
                    SE.authenticate({
                        success: (result: any) => {
                            resolve(result.accessToken);
                        },
                        error: (error: any) => {
                            reject(error);
                        },
                        networkUsers: true
                    });
                }
            });
        });
    }

    public Answers_GetComments(answerIds: number[], skipCache = false, site: string = 'stackoverflow', filter?: string): Promise<SEApiComment[]> {
        return this.MakeRequest<SEApiComment>(
            objectId => `StackExchange.Api.AnswerComments.${objectId}`,
            objectIds => `${stackExchangeApiURL}/answers/${objectIds.join(';')}/comments`,
            comment => comment.post_id,
            answerIds,
            skipCache,
            site,
            true,
            filter
        );
    }

    private MakeRequest<TResultType>(
        cacheKey: (objectId: number) => string,
        apiUrl: (objectIds: number[]) => string,
        uniqueIdentifier: (item: TResultType) => any,
        objectIds: number[],
        skipCache: boolean,
        site: string,
        multi: boolean,
        filter?: string): Promise<TResultType[]> {

        const cachedResultsPromise = this.GetCachedItems<TResultType>(objectIds.slice(), skipCache, cacheKey);

        return new Promise<TResultType[]>((resolve, reject) => {
            if (objectIds.length > 0) {
                let url = apiUrl(objectIds) + `?site=${site}`;
                if (filter) {
                    url += `?filter=${filter}`
                };
                $.ajax({
                    url,
                    type: 'GET',
                }).done((data: SEApiWrapper<TResultType>, textStatus: string, jqXHR: JQueryXHR) => {
                    const returnItems = <TResultType[]>(data.items || []);
                    const grouping = GroupBy(returnItems, uniqueIdentifier);
                    GetMembers(grouping).forEach(key => StoreInCache(cacheKey(parseInt(key, 10)), grouping[key]));

                    cachedResultsPromise.then(cachedResults => {
                        cachedResults.forEach(result => {
                            returnItems.push(result);
                        })
                        resolve(returnItems);
                    });
                }).fail((jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                    reject({ jqXHR, textStatus, errorThrown });
                })
            } else {
                cachedResultsPromise.then(cachedResults => resolve(cachedResults));
            }
        });
    }

    private GetCachedItems<TResultType>(objectIds: number[], skipCache: boolean, cacheKey: (objectId: number) => string): Promise<TResultType[]> {
        const cachedResults: TResultType[] = [];
        const promises: Promise<void>[] = [];
        if (!skipCache) {
            objectIds.forEach(objectId => {
                const cachedResultPromise = GetFromCache<TResultType[]>(cacheKey(objectId));
                const tempPromise = new Promise<void>(resolve => {
                    cachedResultPromise.then(cachedResult => {
                        if (cachedResult) {
                            const itemIndex = objectIds.indexOf(objectId);
                            if (itemIndex > -1) {
                                objectIds.splice(itemIndex, 1);
                            }
                            cachedResult.forEach(r => cachedResults.push(r));
                        }
                        resolve();
                    });
                });
                promises.push(tempPromise);
            });
        }
        return new Promise(resolve => {
            Promise.all(promises).then(() => {
                resolve(cachedResults)
            });
        })
    }
}
