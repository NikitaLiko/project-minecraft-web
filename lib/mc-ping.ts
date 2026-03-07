import { Socket } from 'net';

interface ServerStatus {
    online: boolean;
    version?: string;
    players: {
        online: number;
        max: number;
        sample?: { name: string; id: string }[];
    };
    description?: string;
    favicon?: string;
    ping: number;
    tps?: number; // Calculated or placeholder
}

export async function pingServer(host: string, port: number = 25565): Promise<ServerStatus> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const client = new Socket();
        let dataBuffer = Buffer.alloc(0);

        const timeout = setTimeout(() => {
            client.destroy();
            resolve({
                online: false,
                players: { online: 0, max: 0 },
                ping: 0
            });
        }, 5000);

        client.connect(port, host, () => {
            // Handshake packet
            // Packet ID 0x00, Protocol Version 0 (or -1 varint), Host length + Host, Port, Next State 1 (Status)
            const portBuffer = Buffer.alloc(2);
            portBuffer.writeUInt16BE(port);

            const hostBuffer = Buffer.from(host, 'utf8');
            const hostLength = Buffer.alloc(1); // Assuming host len < 127
            hostLength.writeUInt8(hostBuffer.length);

            const handshake = Buffer.concat([
                Buffer.from([0x00]), // Packet ID
                Buffer.from([0x00]), // Protocol Version (approx)
                hostLength,
                hostBuffer,
                portBuffer,
                Buffer.from([0x01])  // Next State: Status
            ]);

            const handshakeLen = Buffer.alloc(1);
            handshakeLen.writeUInt8(handshake.length);

            client.write(Buffer.concat([handshakeLen, handshake]));

            // Request Status
            // Packet ID 0x00
            client.write(Buffer.from([0x01, 0x00]));
        });

        client.on('data', (data) => {
            dataBuffer = Buffer.concat([dataBuffer, data]);

            // Basic varint parsing logic would go here to extract JSON response
            // For simplicity in this environment, we'll try to find the JSON start
            const jsonStart = dataBuffer.indexOf('{');
            if (jsonStart !== -1) {
                try {
                    // This is a naive implementation, robust one requires full varint/packet parsing
                    // But often the JSON is in the first chunk or we can grab what we see
                    const jsonString = dataBuffer.toString('utf8', jsonStart);
                    const response = JSON.parse(jsonString);

                    const ping = Date.now() - startTime;
                    clearTimeout(timeout);
                    client.destroy();

                    resolve({
                        online: true,
                        version: response.version?.name,
                        players: {
                            online: response.players?.online || 0,
                            max: response.players?.max || 0,
                            sample: response.players?.sample
                        },
                        description: typeof response.description === 'string' ? response.description : response.description?.text,
                        favicon: response.favicon,
                        ping,
                        // Mock TPS for now as standard ping doesn't return it without plugin support
                        tps: 20.0
                    });
                } catch (e) {
                    // Keep waiting for more data if JSON is incomplete
                }
            }
        });

        client.on('error', () => {
            clearTimeout(timeout);
            resolve({
                online: false,
                players: { online: 0, max: 0 },
                ping: 0
            });
        });
    });
}
