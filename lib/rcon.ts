import { Socket } from 'net';

export class RconClient {
    private socket: Socket;
    private host: string;
    private port: number;
    private password: string;
    private requestId: number = 1;
    public authenticated: boolean = false;

    constructor(host: string, port: number, password: string) {
        this.socket = new Socket();
        this.host = host;
        this.port = port;
        this.password = password;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.socket.destroy();
                this.socket.removeAllListeners();
                reject(new Error('RCON connection timed out'));
            }, 5000);

            this.socket.connect(this.port, this.host, () => {
                console.log(`[RCON] Connected to ${this.host}:${this.port}, sending auth...`);
                // Send Auth Packet
                this.sendPacket(3, this.password);
            });

            this.socket.on('data', (data) => {
                const length = data.readInt32LE(0);
                const id = data.readInt32LE(4);
                const type = data.readInt32LE(8);

                if (id === -1) {
                    clearTimeout(timeout);
                    this.socket.destroy();
                    reject(new Error('RCON authentication failed'));
                    return;
                }

                if (type === 2) { // Auth Response
                    this.authenticated = true;
                    clearTimeout(timeout);
                    this.socket.removeAllListeners('data'); // Clear auth listener
                    this.socket.removeAllListeners('error');
                    resolve();
                }
            });

            this.socket.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    sendCommand(command: string, timeoutMs: number = 5000): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.authenticated) {
                reject(new Error('Not authenticated'));
                return;
            }

            const id = ++this.requestId;
            const timeout = setTimeout(() => {
                this.socket.removeListener('data', onData);
                reject(new Error('RCON command timed out'));
            }, timeoutMs);

            this.sendPacket(2, command, id);

            const onData = (data: Buffer) => {
                const reqId = data.readInt32LE(4);
                const body = data.toString('utf8', 12, data.length - 2);

                if (reqId === id) {
                    clearTimeout(timeout);
                    this.socket.removeListener('data', onData);
                    resolve(body);
                }
            };

            this.socket.on('data', onData);
        });
    }

    disconnect() {
        this.socket.end();
        this.socket.destroy();
    }

    private sendPacket(type: number, body: string, id: number = this.requestId) {
        const bodyBuffer = Buffer.from(body, 'utf8');
        const length = bodyBuffer.length + 10; // 4 (id) + 4 (type) + body + 2 (null)
        const buffer = Buffer.alloc(length + 4);

        buffer.writeInt32LE(length, 0);
        buffer.writeInt32LE(id, 4);
        buffer.writeInt32LE(type, 8);
        bodyBuffer.copy(buffer, 12);
        buffer[buffer.length - 2] = 0x00;
        buffer[buffer.length - 1] = 0x00;

        this.socket.write(buffer);
    }
}

// Persistent client to avoid spamming logs with connect/disconnect
let globalClient: RconClient | null = null;
let lastHost: string = '';
let lastPort: number = 0;
let lastPassword: string = '';
let lastSuccessfulCommand: string | null = null;

export async function getTps(host: string, port: number, password: string): Promise<number | null> {
    // Check if configuration changed or client doesn't exist
    if (!globalClient || host !== lastHost || port !== lastPort || password !== lastPassword) {
        if (globalClient) {
            globalClient.disconnect();
        }
        globalClient = new RconClient(host, port, password);
        lastHost = host;
        lastPort = port;
        lastPassword = password;
        lastSuccessfulCommand = null; // Reset on config change
    }

    try {
        // Only connect if not authenticated/connected
        if (!globalClient.authenticated) {
            await globalClient.connect();
        }

        const commands = lastSuccessfulCommand
            ? [lastSuccessfulCommand]
            : ['spark tps', 'tps', 'neoforge tps', 'forge tps', 'tick query'];

        let response = '';

        for (const cmd of commands) {
            response = await globalClient.sendCommand(cmd);

            if (response.includes('Unknown') || response.includes('incomplete') || response.includes('not found') || response.includes('Usage:')) {
                lastSuccessfulCommand = null; // Mark invalid if it was cached
                continue;
            }
            lastSuccessfulCommand = cmd;
            break;
        }

        // Parsing logic remains the same
        const explicitMatch = response.match(/(?:TPS|Mean TPS):\s*(\d+\.\d+)/i);
        if (explicitMatch && explicitMatch[1]) {
            return Math.min(20, parseFloat(explicitMatch[1]));
        }

        const listMatch = response.match(/:\s*(\d+\.\d+),\s*(\d+\.\d+)/);
        if (listMatch && listMatch[1]) {
            return Math.min(20, parseFloat(listMatch[1]));
        }

        const matches = response.match(/(\d+\.\d+)/g);
        if (matches) {
            for (const m of matches) {
                const val = parseFloat(m);
                if (val > 0 && val <= 20) return val;
            }
        }

        if (response.includes('20.0') || response.includes(' 20 ')) return 20.0;

        return 0;
    } catch (e) {
        console.error("RCON TPS Error:", e);
        // On error, reset client to force reconnect next time
        if (globalClient) {
            globalClient.disconnect();
            globalClient = null;
        }
        return null;
    }
}
