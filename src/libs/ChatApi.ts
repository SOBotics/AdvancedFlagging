declare var $: JQueryStatic;
import { GetAndCache } from './FunctionUtils';

export class ChatApi {
    private chatRoomUrl: string;
    public constructor(chatUrl: string = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = `${chatUrl}`;
    }

    public GetChannelFKey(roomId: number): Promise<string> {
        const cachingKey = `StackExchange.ChatApi.FKey_${roomId}`;
        const getterPromise = new Promise<string>((resolve, reject) => {
            $.ajax(
                {
                    url: `${this.chatRoomUrl}/rooms/${roomId}`,
                    type: 'GET'
                }).done((data: any, textStatus: string, jqXHR: JQueryXHR) => {
                    var fkey = data.match(/hidden" value="([\dabcdef]{32})/)[1];
                    resolve(fkey);
                }).fail((jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                    reject({ jqXHR, textStatus, errorThrown });
                })
        });

        return GetAndCache(cachingKey, getterPromise);
    }

    public SendMessage(roomId: number, message: string, providedFkey?: string): Promise<void> {
        let fkeyPromise: Promise<string>;
        if (!providedFkey) {
            fkeyPromise = this.GetChannelFKey(roomId);
        } else {
            fkeyPromise = Promise.resolve(providedFkey);
        }

        return fkeyPromise.then((fKey) => {
            return new Promise<void>((resolve, reject) => {
                $.ajax({
                    url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                    type: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: 'text=' + encodeURIComponent(message) + '&fkey=' + fKey,
                })
                    .done(() => resolve())
                    .fail((jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                        reject({ jqXHR, textStatus, errorThrown });
                    })
            });
        })
    }
}
