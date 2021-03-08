import { GreaseMonkeyCache } from '@userscriptTools/GreaseMonkeyCache';
import * as globals from '../../GlobalVars';

declare const StackExchange: globals.StackExchange;

export class ChatApi {
    private static GetExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return expiryDate;
    }

    private chatRoomUrl: string;

    public constructor(chatUrl = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = chatUrl;
    }

    public GetChannelFKey(roomId: number): Promise<string> {
        const expiryDate = ChatApi.GetExpiryDate();
        return GreaseMonkeyCache.GetAndCache(globals.CacheChatApiFkey, () => new Promise<string>((resolve, reject) => {
            this.GetChannelPage(roomId).then(channelPage => {
                const fkeyElement = $(channelPage).filter('#fkey');
                const fkey = fkeyElement.val();
                if (!fkey) return;
                resolve(fkey.toString());
            }).catch(() => reject());
        }), expiryDate);
    }

    public GetChatUserId(): number {
        return StackExchange.options.user.userId;
    }

    public SendMessage(message: string, roomId: number = globals.soboticsRoomId): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const requestFunc = async (): Promise<void> => {
                const fkey = await this.GetChannelFKey(roomId);
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                    onload: (chatResponse: { status: number }) => {
                        chatResponse.status === 200 ? resolve() : onFailure();
                    },
                    onerror: () => {
                        onFailure();
                    },
                });
            };

            let numTries = 0;
            const onFailure = (): void => {
                numTries++;
                if (numTries < 3) {
                    GreaseMonkeyCache.Unset(globals.CacheChatApiFkey);
                    void requestFunc();
                } else {
                    reject();
                }
            };

            void requestFunc();
        });
    }

    private GetChannelPage(roomId: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.chatRoomUrl}/rooms/${roomId}`,
                onload: (response: { status: number, responseText: string }) => {
                    response.status === 200 ? resolve(response.responseText) : reject();
                },
                onerror: () => reject()
            });
        });
    }
}
