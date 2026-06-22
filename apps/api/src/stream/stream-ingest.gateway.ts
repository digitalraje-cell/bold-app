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
import { StreamService } from './stream.service';

type IngestSocketData = {
  streamId?: string;
};

function getStreamId(client: Socket): string | undefined {
  const data = client.data as IngestSocketData;
  return typeof data.streamId === 'string' ? data.streamId : undefined;
}

@WebSocketGateway({
  namespace: '/stream',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  maxHttpBufferSize: 10e6,
})
export class StreamIngestGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(StreamIngestGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly relay: StreamRelayService,
    private readonly streamService: StreamService,
  ) {}

  handleConnection(client: Socket) {
    const streamId = client.handshake.query.streamId as string;
    const token = client.handshake.query.token as string;

    if (!streamId || !token || !this.relay.verifyIngestToken(streamId, token)) {
      this.logger.warn('[youtube-live] stream-ingest rejected connection', {
        streamId: streamId || 'missing',
      });
      client.disconnect();
      return;
    }

    (client.data as IngestSocketData).streamId = streamId;
    this.relay.setIngestConnected(streamId, true);
    this.logger.log(
      `[youtube-live] stream-ingest websocket connected streamId=${streamId}`,
    );
    this.streamService.onYoutubeIngestSocketConnected(streamId);
  }

  handleDisconnect(client: Socket) {
    const streamId = getStreamId(client);
    if (streamId) {
      this.relay.setIngestConnected(streamId, false);
      this.logger.log(`[stream-ingest] disconnected ${streamId}`);
    }
  }

  @SubscribeMessage('ingest-chunk')
  handleChunk(@ConnectedSocket() client: Socket, data: Buffer | ArrayBuffer) {
    const streamId = getStreamId(client);
    if (!streamId) return { ok: false };

    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (chunk.length === 0) return { ok: false };

    const statsBefore = this.relay.getIngestStats(streamId);
    const ok = this.relay.writeChunk(streamId, chunk);
    if (ok && (statsBefore?.chunksReceived ?? 0) === 0) {
      this.streamService.scheduleYoutubeTransitionAfterIngest(streamId);
    }
    return { ok };
  }
}
