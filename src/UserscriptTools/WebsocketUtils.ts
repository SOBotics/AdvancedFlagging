import { ProgressItemActions } from './Progress';
import { Store } from './Store';

export default class WebsocketUtils {
    public websocket: WebSocket | null = null;

    constructor(
        private readonly url: string,
        // id of the post to watch
        private readonly id: number,
        private readonly progress: ProgressItemActions | null,
        // message sent when the websocket opens
        // for authentication
        private readonly auth = '',
        private readonly timeout = 1e4
    ) {
        this.initWebsocket();
    }

    public async waitForReport(
        // called every time a new WS message is received
        // returns the ids of the posts reported to the bot
        callback: (event: MessageEvent<string>) => number[]
    ): Promise<void> {
        const connectProgress = this.progress?.addSubItem('Connecting to websocket...');

        if (!this.websocket || this.websocket.readyState > 1) {
            this.websocket = null;

            if (Store.dryRun) {
                console.log('Failed to connect to', this.url, 'WebSocket');
            }
            connectProgress?.failed();

            return;
        }

        connectProgress?.completed();

        const reportProgress = this.progress?.addSubItem('Waiting for the report to be received...');
        await this.withTimeout(
            this.timeout,
            reportProgress,
            new Promise<void>(resolve => {
                this.websocket?.addEventListener(
                    'message',
                    (event: MessageEvent<string>) => {
                        const ids = callback(event);

                        if (Store.dryRun) {
                            console.log('New message from', this.url, event.data);
                            console.log('Comparing', ids, 'to', this.id);
                        }

                        if (ids.includes(this.id)) {
                            reportProgress?.completed();
                            resolve();
                        }
                    });
            })
        );
    }

    public closeWebsocket(): void {
        // websocket already closed
        if (!this.websocket) return;

        this.websocket.close();
        this.websocket = null;

        if (Store.dryRun) {
            console.log('Closed connection to', this.url);
        }
    }

    private initWebsocket(): void {
        this.websocket = new WebSocket(this.url);

        if (this.auth) {
            this.websocket.addEventListener('open', () => {
                this.websocket?.send(this.auth);
            });
        }

        if (Store.dryRun) {
            console.log('WebSocket', this.url, 'initialised.');
        }
    }

    private async withTimeout<T>(
        millis: number,
        subItem: ProgressItemActions | undefined,
        promise: Promise<T>
    ): Promise<void> {
        let time: NodeJS.Timeout | undefined;

        const timeout = new Promise<void>(resolve => {
            time = setTimeout(() => {
                if (Store.dryRun) {
                    console.log('WebSocket connection timeouted after', millis, 'ms');
                }

                subItem?.failed('timeouted');

                resolve();
            }, millis);
        });

        await Promise
            .race([ promise, timeout ])
            .finally(() => {
                clearTimeout(time);
                this.closeWebsocket();
            });
    }
}
