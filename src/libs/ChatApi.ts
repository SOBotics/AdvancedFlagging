import { SimpleCache } from './SimpleCache';

declare const $: JQueryStatic;
declare const GM_xmlhttpRequest: any;

export class ChatApi {
    private chatRoomUrl: string;
    public constructor(chatUrl: string = 'http://chat.stackoverflow.com') {
        this.chatRoomUrl = `${chatUrl}`;
    }

    public GetChannelFKey(roomId: number): Promise<string> {
        const cachingKey = `StackExchange.ChatApi.FKey_${roomId}`;
        const getterPromise = new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest(
                {
                    method: 'GET',
                    url: `${this.chatRoomUrl}/rooms/${roomId}`,
                    onload: (response: any) => {
                        const fkey = response.responseText.match(/hidden" value="([\dabcdef]{32})/)[1];
                        resolve(fkey);
                    },
                    onerror: (data: any) => reject(data)
                });
        });

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return SimpleCache.GetAndCache(cachingKey, () => getterPromise, expiryDate);
    }

    public SendMessage(roomId: number, message: string, providedFkey?: string): Promise<void> {
        const fkeyPromise = providedFkey
            ? Promise.resolve(providedFkey)
            : this.GetChannelFKey(roomId);

        return fkeyPromise.then((fKey) => {
            return new Promise<void>((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                    onload: () => resolve(),
                    onerror: (response: any) => {
                        reject(response);
                    },
                });
            });
        });
    }
}
