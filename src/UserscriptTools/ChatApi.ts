import { GreaseMonkeyCache } from './GreaseMonkeyCache';
import { StackExchange, CacheChatApiFkey, soboticsRoomId, getSentMessage, chatFailureMessage } from '../GlobalVars';

declare const StackExchange: StackExchange;

export class ChatApi {
    private static getExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);
        return expiryDate;
    }

    private chatRoomUrl: string;

    public constructor(chatUrl = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = chatUrl;
    }

    public getChannelFKey(roomId: number): Promise<string> {
        const expiryDate = ChatApi.getExpiryDate();
        return GreaseMonkeyCache.getAndCache(CacheChatApiFkey, async () => {
            try {
                const channelPage = await this.getChannelPage(roomId);
                const fkeyElement = $(channelPage).filter('#fkey');
                const fkey = fkeyElement.val();
                return fkey?.toString() || '';
            } catch (error) {
                console.error(error);
                throw new Error('Failed to get chat fkey');
            }
        }, expiryDate);
    }

    public getChatUserId(): number {
        return StackExchange.options.user.userId;
    }

    public async sendMessage(message: string, bot: string, roomId: number = soboticsRoomId): Promise<string> {
        const makeRequest = async (): Promise<boolean> => await this.sendRequestToChat(message, roomId);
        let numTries = 0;
        const onFailure = async (): Promise<string> => {
            numTries++;
            if (numTries < 3) {
                GreaseMonkeyCache.unset(CacheChatApiFkey);
                if (!await makeRequest()) return onFailure();
            } else {
                throw new Error(chatFailureMessage); // retry limit exceeded
            }
            return getSentMessage(true, message.split(' ').pop() || '', bot);
        };

        if (!await makeRequest()) return onFailure();
        return getSentMessage(true, message.split(' ').pop() || '', bot);
    }

    private async sendRequestToChat(message: string, roomId: number): Promise<boolean> {
        const fkey = await this.getChannelFKey(roomId);
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${this.chatRoomUrl}/chats/${roomId}/messages/new`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'text=' + encodeURIComponent(message) + '&fkey=' + fkey,
                onload: (chatResponse: { status: number }) => resolve(chatResponse.status === 200),
                onerror: () => resolve(false),
            });
        });
    }

    private getChannelPage(roomId: number): Promise<string> {
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
