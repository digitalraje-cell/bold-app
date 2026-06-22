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
    const relayRunning = streamId ? this.relay.isRunning(streamId) : false;

    if (!streamId || !token || !this.relay.verifyIngestToken(streamId, token)) {
      this.logger.warn(
        `[youtube-live-pipeline] ingest:connection-rejected ${JSON.stringify({
          streamId: streamId || 'missing',
          hasToken: Boolean(token),
          relayRunning,
          clientId: client.id,
        })}`,
      );
      client.disconnect();
      return;
    }

    (client.data as IngestSocketData).streamId = streamId;
    this.relay.setIngestConnected(streamId, true);
    this.logger.log(
      `[youtube-live-pipeline] ingest:websocket-connected streamId=${streamId} clientId=${client.id} relayRunning=${relayRunning}`,
    );
    this.streamService.onYoutubeIngestSocketConnected(streamId);
  }

  handleDisconnect(client: Socket) {
    const streamId = getStreamId(client);
    if (streamId) {
      this.relay.setIngestConnected(streamId, false);
      const stats = this.relay.getIngestStats(streamId);
      this.logger.log(
        `[youtube-live-pipeline] ingest:websocket-disconnected streamId=${streamId} chunksReceived=${stats?.chunksReceived ?? 0} bytesReceived=${stats?.bytesReceived ?? 0}`,
      );
    }
  }

  @SubscribeMessage('ingest-chunk')
  handleChunk(@ConnectedSocket() client: Socket, data: Buffer | ArrayBuffer) {
    const streamId = getStreamId(client);
    if (!streamId) {
      this.logger.warn('[youtube-live-pipeline] ingest:chunk-no-stream-id');
      return { ok: false };
    }

    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (chunk.length === 0) {
      this.logger.warn(
        `[youtube-live-pipeline] ingest:empty-chunk streamId=${streamId}`,
      );
      return { ok: false };
    }

    const statsBefore = this.relay.getIngestStats(streamId);
    if ((statsBefore?.chunksReceived ?? 0) === 0) {
      this.logger.log(
        `[youtube-live-pipeline] ingest:first-chunk-received streamId=${streamId} bytes=${chunk.length} ingestConnected=${statsBefore?.ingestConnected ?? false}`,
      );
    }

    const ok = this.relay.writeChunk(streamId, chunk);
    if (!ok) {
      this.logger.error(
        `[youtube-live-pipeline] ingest:chunk-write-failed streamId=${streamId} bytes=${chunk.length}`,
      );
      return { ok: false };
    }

    if ((statsBefore?.chunksReceived ?? 0) === 0) {
      this.streamService.scheduleYoutubeTransitionAfterIngest(streamId);
    }
    return { ok: true };
  }
}
