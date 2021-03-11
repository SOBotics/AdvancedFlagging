import { GreaseMonkeyCache } from '@userscriptTools/GreaseMonkeyCache';
import { StackExchange, CacheChatApiFkey, soboticsRoomId } from 'GlobalVars';

declare const StackExchange: StackExchange;

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
        return GreaseMonkeyCache.GetAndCache(CacheChatApiFkey, async () => {
            try {
                const channelPage = await this.GetChannelPage(roomId);
                const fkeyElement = $(channelPage).filter('#fkey');
                const fkey = fkeyElement.val();
                return fkey?.toString() || '';
            } catch (error) {
                console.error(error);
                throw new Error('Failed to get chat fkey');
            }
        }, expiryDate);
    }

    public GetChatUserId(): number {
        return StackExchange.options.user.userId;
    }

    public async SendMessage(message: string, roomId: number = soboticsRoomId): Promise<boolean> {
        const makeRequest = async (): Promise<boolean> => await this.SendRequestToChat(message, roomId);
        let numTries = 0;
        const onFailure = async (): Promise<boolean> => {
            numTries++;
            if (numTries < 3) {
                GreaseMonkeyCache.Unset(CacheChatApiFkey);
                if (!await makeRequest()) return onFailure();
            } else {
                throw new Error(); // failed to send message to chat!
            }
            return true;
        };

        if (!await makeRequest()) return onFailure();
        return true;
    }

    private async SendRequestToChat(message: string, roomId: number): Promise<boolean> {
        const fkey = await this.GetChannelFKey(roomId);
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                onload: (chatResponse: { status: number }) => {
                    resolve(chatResponse.status === 200);
                },
                onerror: () => resolve(false),
            });
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
