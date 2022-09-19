import { Store } from './Store';
import { Cached, soboticsRoomId, getSentMessage, debugMode } from '../shared';

export class ChatApi {
    private static getExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);

        return expiryDate;
    }

    private readonly chatRoomUrl: string;

    public constructor(chatUrl = 'https://chat.stackoverflow.com') {
        this.chatRoomUrl = chatUrl;
    }

    public getChannelFKey(roomId: number): Promise<string> {
        const expiryDate = ChatApi.getExpiryDate();

        return Store.getAndCache<string>(Cached.Fkey, async () => {
            try {
                const channelPage = await this.getChannelPage(roomId);
                const parsed = new DOMParser().parseFromString(channelPage, 'text/html');

                const fkeyInput = parsed.querySelector<HTMLInputElement>('input[name="fkey"]');
                const fkey = fkeyInput?.value || '';

                return fkey;
            } catch (error) {
                console.error(error);
                throw new Error('Failed to get chat fkey');
            }
        }, expiryDate);
    }

    public getChatUserId(): number {
        // Because the script only sends messages to SO chat,
        // the SO chat id is the same as the SO id.
        // This is not the case for SE chat, so it needs to be changed when
        // https://github.com/SOBotics/AdvancedFlagging/issues/31 is implemented
        return StackExchange.options.user.userId as number;
    }

    public async sendMessage(
        message: string,
        bot: string,
        roomId = soboticsRoomId
    ): Promise<string> {
        let numTries = 0;
        const feedback = message.split(' ').pop() || '';

        const makeRequest = async (): Promise<boolean> => {
            return await this.sendRequestToChat(message, roomId);
        };

        const onFailure = async (): Promise<string> => {
            numTries++;

            if (numTries < 3) {
                Store.unset(Cached.Fkey);

                if (!await makeRequest()) {
                    return onFailure();
                }
            } else {
                throw new Error('Failed to send message to chat'); // retry limit exceeded
            }

            return getSentMessage(true, feedback, bot);
        };

        if (!await makeRequest()) {
            return onFailure();
        }

        return getSentMessage(true, feedback, bot);
    }

    private async sendRequestToChat(message: string, roomId: number): Promise<boolean> {
        const url = `${this.chatRoomUrl}/chats/${roomId}/messages/new`;

        if (debugMode) {
            console.log('Send', message, `to ${roomId} via`, url);

            return Promise.resolve(true);
        }

        const fkey = await this.getChannelFKey(roomId);

        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `text=${encodeURIComponent(message)}&fkey=${fkey}`,
                onload: ({ status }) => resolve(status === 200),
                onerror: () => resolve(false),
            });
        });
    }

    private getChannelPage(roomId: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.chatRoomUrl}/rooms/${roomId}`,
                onload: ({ status, responseText }) => {
                    status === 200
                        ? resolve(responseText)
                        : reject();
                },
                onerror: () => reject()
            });
        });
    }
}
