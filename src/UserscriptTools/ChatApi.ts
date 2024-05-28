import { Store, Cached } from './Store';
import { withTimeout } from '../shared';

interface ChatWSAuthResponse {
    url: string;
}

interface ChatEventsResponse {
    time: number;
}

interface ChatMessageInfo {
    event_type: number;
    user_id: number;
    content: string;
}

interface ChatWsMessage {
    [key: string]: {
        e?: ChatMessageInfo[];
    };
}

export class ChatApi {
    private static getExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);

        return expiryDate;
    }

    private readonly chatRoomUrl: string;
    private readonly roomId: number;
    private readonly nattyId = 6817005;

    private websocket: WebSocket | null = null;

    public constructor(
        chatUrl = 'https://chat.stackoverflow.com',
        roomId = 111347
    ) {
        this.chatRoomUrl = chatUrl;
        this.roomId = roomId;
    }


    public getChatUserId(): number {
        // Because the script only sends messages to SO chat,
        // the SO chat id is the same as the SO id.
        // This is not the case for SE chat, so it needs to be changed when
        // https://github.com/SOBotics/AdvancedFlagging/issues/31 is implemented
        return StackExchange.options.user.userId as number;
    }

    public async sendMessage(message: string,): Promise<boolean> {
        let numTries = 0;

        const makeRequest = async (): Promise<boolean> => {
            return await this.sendRequestToChat(message);
        };

        const onFailure = async (): Promise<boolean> => {
            numTries++;

            if (numTries < 3) {
                Store.unset(Cached.Fkey);

                if (!await makeRequest()) {
                    return onFailure();
                }
            } else {
                throw new Error('Failed to send message to chat'); // retry limit exceeded
            }

            return true;
        };

        if (!await makeRequest()) {
            return onFailure();
        }

        return true;
    }

    private async sendRequestToChat(message: string): Promise<boolean> {
        const url = `${this.chatRoomUrl}/chats/${this.roomId}/messages/new`;

        if (Store.dryRun) {
            console.log('Send', message, `to ${this.roomId} via`, url);

            return Promise.resolve(true);
        }

        const fkey = await this.getChannelFKey();

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

    private getChannelPage(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${this.chatRoomUrl}/rooms/${this.roomId}`,
                onload: ({ status, responseText }) => {
                    status === 200
                        ? resolve(responseText)
                        : reject();
                },
                onerror: () => reject()
            });
        });
    }

    // see https://meta.stackexchange.com/a/218355
    private async getWsUrl(): Promise<string> {
        const fkey = await this.getChannelFKey();

        return new Promise<string>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${this.chatRoomUrl}/ws-auth`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `roomid=${this.roomId}&fkey=${fkey}`,
                onload: ({ status, responseText }) => {
                    if (status !== 200) reject();

                    const json = JSON.parse(responseText) as ChatWSAuthResponse;
                    resolve(json.url);
                },
                onerror: () => reject()
            });
        });
    }

    private async getLParam(): Promise<number> {
        const fkey = await this.getChannelFKey();

        return new Promise<number>((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: `${this.chatRoomUrl}/chats/${this.roomId}/events`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `fkey=${fkey}`,
                onload: ({ status, responseText }) => {
                    if (status !== 200) reject();

                    const json = JSON.parse(responseText) as ChatEventsResponse;
                    resolve(json.time);
                },
                onerror: () => reject()
            });
        });
    }

    public async initWS(): Promise<void> {
        const l = await this.getLParam();
        const url = await this.getWsUrl();

        const ws = `${url}?l=${l}`;
        this.websocket = new WebSocket(ws);

        if (Store.dryRun) {
            console.log('Initialised chat WebSocket at', ws, this.websocket);
        }
    }

    private closeWS(): void {
        // websocket already closed
        if (!this.websocket) return;

        this.websocket.close();
        this.websocket = null;

        if (Store.dryRun) {
            console.log('Chat WebSocket connection closed.');
        }
    }

    public async waitForReport(postId: number): Promise<void> {
        if (!this.websocket || this.websocket.readyState > 1) {
            this.websocket = null;

            if (Store.dryRun) {
                console.log('Failed to connect to chat WS.');
            }

            return;
        }

        await withTimeout<void>(
            10_000,
            new Promise<void>(resolve => {
                this.websocket?.addEventListener('message', (event: MessageEvent<string>) => {
                    const data = JSON.parse(event.data) as ChatWsMessage;

                    data[`r${this.roomId}`].e
                        ?.filter(({ event_type, user_id }) => {
                            // interested in new messages posted by Natty
                            return event_type === 1 && user_id === this.nattyId;
                        })
                        .forEach(item => {
                            const { content } = item;

                            if (Store.dryRun) {
                                console.log('New message posted by Natty on room', this.roomId, item);
                            }

                            const matchRegex = /stackoverflow\.com\/a\/(\d+)/;
                            const id = matchRegex.exec(content)?.[1];
                            if (Number(id) !== postId) return;

                            resolve();
                        });
                });
            })
        ).finally(() => this.closeWS());
    }

    private getChannelFKey(): Promise<string> {
        const expiryDate = ChatApi.getExpiryDate();

        return Store.getAndCache<string>(Cached.Fkey, async () => {
            try {
                const channelPage = await this.getChannelPage();
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
}
