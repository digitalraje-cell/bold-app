import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { getAllowedOrigins } from '../common/cors.util';
import { StreamRelayService } from './stream-relay.service';

@WebSocketGateway({
  namespace: '/stream',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  maxHttpBufferSize: 10e6,
})
export class StreamIngestGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(StreamIngestGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly relay: StreamRelayService) {}

  handleConnection(client: Socket) {
    const streamId = client.handshake.query.streamId as string;
    const token = client.handshake.query.token as string;

    if (!streamId || !token || !this.relay.verifyIngestToken(streamId, token)) {
      this.logger.warn('[stream-ingest] rejected connection', { streamId: streamId || 'missing' });
      client.disconnect();
      return;
    }

    client.data.streamId = streamId;
    this.relay.setIngestConnected(streamId, true);
    this.logger.log(`[stream-ingest] connected ${streamId}`);
  }

  handleDisconnect(client: Socket) {
    const streamId = client.data.streamId as string | undefined;
    if (streamId) {
      this.relay.setIngestConnected(streamId, false);
      this.logger.log(`[stream-ingest] disconnected ${streamId}`);
    }
  }

  @SubscribeMessage('ingest-chunk')
  handleChunk(@ConnectedSocket() client: Socket, data: Buffer | ArrayBuffer) {
    const streamId = client.data.streamId as string | undefined;
    if (!streamId) return { ok: false };

    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (chunk.length === 0) return { ok: false };

    const ok = this.relay.writeChunk(streamId, chunk);
    return { ok };
  }
}
