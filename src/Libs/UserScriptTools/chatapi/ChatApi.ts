import { GreaseMonkeyCache } from '@userscriptTools/caching/GreaseMonkeyCache';
import * as globals from '../../../GlobalVars';

declare const $: JQueryStatic;
declare const GM_xmlhttpRequest: any;
declare const StackExchange: any;

export class ChatApi {
    private static GetExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return expiryDate;
    }

    private chatRoomUrl: string;

    public constructor(chatUrl = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = `${chatUrl}`;
    }

    public async GetChannelFKey(roomId: number): Promise<string> {
        const getterPromise = new Promise<string>((resolve, reject) => {
            this.GetChannelPage(roomId).then(channelPage => {
                const fkeyElement = $(channelPage).filter('#fkey');
                if (!fkeyElement.length) reject('Could not find fkey');
                const fkey = fkeyElement.val();
                resolve(fkey);
            });
        });

        const expiryDate = ChatApi.GetExpiryDate();
        return GreaseMonkeyCache.GetAndCache(globals.CacheChatApiFkey, () => getterPromise, expiryDate);
    }

    public GetChatUserId(): number {
        return StackExchange.options.user.userId;
    }

    public SendMessage(roomId: number, message: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const requestFunc = async () => {
                const fkeyPromise = this.GetChannelFKey(roomId);
                const fKey = await fkeyPromise;

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                    onload: (response_1: any) => {
                        response_1.status === 200 ? resolve() : onFailure(response_1.statusText);
                    },
                    onerror: (response_3: any) => {
                        onFailure(response_3);
                    },
                });
            };

            let numTries = 0;
            const onFailure = (errorMessage?: string) => {
                numTries++;
                if (numTries < 3) {
                    const fkeyCacheKey = 'StackExchange.ChatApi.FKey';
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
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.chatRoomUrl}/rooms/${roomId}`,
                onload: (response: any) => {
                    response.status === 200 ? resolve(response.responseText) : reject(response.statusText);
                },
                onerror: (data: any) => reject(data)
            });
        });

        return getterPromise;
    }
}
