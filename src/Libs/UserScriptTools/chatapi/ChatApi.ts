import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';

declare const $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

export class ChatApi {
    private static GetExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return expiryDate;
    }

    private chatRoomUrl: string;

    public constructor(chatUrl: string = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = `${chatUrl}`;
    }

    public async GetChannelFKey(roomId: number): Promise<string> {
        const cachingKey = `StackExchange.ChatApi.FKey_${roomId}`;
        const getterPromise = new Promise<string>((resolve, reject) => {
            this.GetChannelPage(roomId).then(channelPage => {
                const fkeyElement = $(channelPage).filter('#fkey');
                if (fkeyElement.length > 0) {
                    const fkey = fkeyElement.val();
                    resolve(fkey);
                    return;
                }
                reject('Could not find fkey');
            });
        });

        const expiryDate = ChatApi.GetExpiryDate();
        return GreaseMonkeyCache.GetAndCache(cachingKey, () => getterPromise, expiryDate);
    }

    public async GetChatUserId(roomId: number): Promise<number> {
        const cachingKey = `StackExchange.ChatApi.UserId_${roomId}`;
        const getterPromise = new Promise<number>((resolve, reject) => {
            this.GetChannelPage(roomId).then(channelPage => {
                const activeUserDiv = $('#active-user', $(channelPage));
                const classAtr = activeUserDiv.attr('class');
                const match = classAtr.match(/user-(\d+)/);
                if (match && match.length) {
                    resolve(parseInt(match[1], 10));
                }
                reject('Could not find user id');
            });
        });

        const expiryDate = ChatApi.GetExpiryDate();
        return GreaseMonkeyCache.GetAndCache(cachingKey, () => getterPromise, expiryDate);
    }

    public SendMessage(roomId: number, message: string, providedFkey?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const requestFunc = () => {
                const fkeyPromise = providedFkey
                    ? Promise.resolve(providedFkey)
                    : this.GetChannelFKey(roomId);

                return fkeyPromise.then((fKey) => {
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                        onload: (response: any) => {
                            if (response.status !== 200) {
                                onFailure(response.statusText);
                            } else {
                                resolve();
                            }
                        },
                        onerror: (response: any) => {
                            onFailure(response);
                        },
                    });
                });
            };

            let numTries = 0;
            const onFailure = (errorMessage?: string) => {
                numTries++;
                if (numTries < 3) {
                    const fkeyCacheKey = `StackExchange.ChatApi.FKey_${roomId}`;
                    GreaseMonkeyCache.Unset(fkeyCacheKey);
                    requestFunc();
                } else {
                    reject(errorMessage);
                }
            };

            requestFunc();
        });
    }

    private GetChannelPage(roomId: number): Promise<string> {
        const getterPromise = new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest(
                {
                    method: 'GET',
                    url: `${this.chatRoomUrl}/rooms/${roomId}`,
                    onload: (response: any) => {
                        if (response.status !== 200) {
                            reject(response.statusText);
                        } else {
                            resolve(response.responseText);
                        }
                    },
                    onerror: (data: any) => reject(data)
                });
        });

        return getterPromise;
    }
}
