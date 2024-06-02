import { Store, Cached } from './Store';

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

type ChatWsMessage = Record<string, {
    e?: ChatMessageInfo[];
}>;

export class ChatApi {
    private readonly nattyId = 6817005;

    public constructor(
        private readonly chatUrl = 'https://chat.stackoverflow.com',
        private readonly roomId = 111347
    ) {}

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

    public async getFinalUrl(): Promise<string> {
        const url = await this.getWsUrl();
        const l = await this.getLParam();

        return `${url}?l=${l}`;
    }

    public reportReceived(event: MessageEvent<string>): number[] {
        const data = JSON.parse(event.data) as ChatWsMessage;

        return data[`r${this.roomId}`].e
            ?.filter(({ event_type, user_id }) => {
                // interested in new messages posted by Natty
                return event_type === 1 && user_id === this.nattyId;
            })
            .map(item => {
                const { content } = item;

                if (Store.dryRun) {
                    console.log('New message posted by Natty on room', this.roomId, item);
                }

                const matchRegex = /stackoverflow\.com\/a\/(\d+)/;
                const id = matchRegex.exec(content)?.[1];

                return Number(id);
            }) ?? [];
    }

    private static getExpiryDate(): Date {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 1);

        return expiryDate;
    }

    private async sendRequestToChat(message: string): Promise<boolean> {
        const url = `${this.chatUrl}/chats/${this.roomId}/messages/new`;

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
                url: `${this.chatUrl}/rooms/${this.roomId}`,
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
                url: `${this.chatUrl}/ws-auth`,
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
                url: `${this.chatUrl}/chats/${this.roomId}/events`,
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

    private getChannelFKey(): Promise<string> {
        const expiryDate = ChatApi.getExpiryDate();

        return Store.getAndCache<string>(Cached.Fkey, async () => {
            try {
                const channelPage = await this.getChannelPage();
                const parsed = new DOMParser().parseFromString(channelPage, 'text/html');

                const fkeyInput = parsed.querySelector<HTMLInputElement>('input[name="fkey"]');
                const fkey = fkeyInput?.value ?? '';

                return fkey;
            } catch (error) {
                console.error(error);
                throw new Error('Failed to get chat fkey');
            }
        }, expiryDate);
    }
}
