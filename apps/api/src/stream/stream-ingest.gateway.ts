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
  chunksReceived?: number;
  bytesReceived?: number;
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
    const query = client.handshake.query;
    const auth = client.handshake.auth as { streamId?: string; token?: string } | undefined;
    const streamId = (query.streamId as string) || auth?.streamId;
    const token = (query.token as string) || auth?.token;
    const relayRunning = streamId ? this.relay.isRunning(streamId) : false;

    if (!streamId || !token || !this.relay.verifyIngestToken(streamId, token)) {
      this.logger.warn(
        `[youtube-live-pipeline] STAGE-3-GATEWAY websocket:connection-rejected ${JSON.stringify({
          streamId: streamId || 'missing',
          hasToken: Boolean(token),
          relayRunning,
          clientId: client.id,
          origin: client.handshake.headers.origin ?? null,
        })}`,
      );
      client.disconnect();
      return;
    }

    (client.data as IngestSocketData).streamId = streamId;
    (client.data as IngestSocketData).chunksReceived = 0;
    (client.data as IngestSocketData).bytesReceived = 0;
    this.relay.setIngestConnected(streamId, true);
    this.logger.log(
      `[youtube-live-pipeline] STAGE-3-GATEWAY websocket:connected streamId=${streamId} clientId=${client.id} relayRunning=${relayRunning} origin=${client.handshake.headers.origin ?? 'unknown'}`,
    );
    this.logger.log(
      `[youtube-live-pipeline] STAGE-3-GATEWAY ingest-session:started streamId=${streamId}`,
    );
    this.streamService.onYoutubeIngestSocketConnected(streamId);
  }

  handleDisconnect(client: Socket) {
    const streamId = getStreamId(client);
    if (streamId) {
      this.relay.setIngestConnected(streamId, false);
      const stats = this.relay.getIngestStats(streamId);
      this.logger.log(
        `[youtube-live-pipeline] STAGE-3-GATEWAY websocket:disconnected streamId=${streamId} chunksReceived=${stats?.chunksReceived ?? 0} bytesReceived=${stats?.bytesReceived ?? 0}`,
      );
    }
  }

  @SubscribeMessage('ingest-chunk')
  handleChunk(@ConnectedSocket() client: Socket, data: Buffer | ArrayBuffer) {
    const streamId = getStreamId(client);
    if (!streamId) {
      this.logger.warn('[youtube-live-pipeline] STAGE-3-GATEWAY chunk:no-stream-id');
      return { ok: false };
    }

    const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (chunk.length === 0) {
      this.logger.warn(
        `[youtube-live-pipeline] STAGE-3-GATEWAY chunk:empty streamId=${streamId}`,
      );
      return { ok: false };
    }

    const socketData = client.data as IngestSocketData;
    const gatewayChunksBefore = socketData.chunksReceived ?? 0;
    const statsBefore = this.relay.getIngestStats(streamId);

    if (gatewayChunksBefore === 0) {
      this.logger.log(
        `[youtube-live-pipeline] STAGE-3-GATEWAY chunk:first-received streamId=${streamId} bytes=${chunk.length} relayChunksBefore=${statsBefore?.chunksReceived ?? 0}`,
      );
    }

    const ok = this.relay.writeChunk(streamId, chunk);
    if (!ok) {
      this.logger.error(
        `[youtube-live-pipeline] STAGE-3-GATEWAY chunk:relay-write-failed streamId=${streamId} bytes=${chunk.length}`,
      );
      return { ok: false };
    }

    socketData.chunksReceived = gatewayChunksBefore + 1;
    socketData.bytesReceived = (socketData.bytesReceived ?? 0) + chunk.length;

    if (socketData.chunksReceived % 10 === 0) {
      this.logger.log(
        `[youtube-live-pipeline] STAGE-3-GATEWAY chunk:progress streamId=${streamId} chunkCount=${socketData.chunksReceived} totalBytes=${socketData.bytesReceived}`,
      );
    }

    if ((statsBefore?.chunksReceived ?? 0) === 0) {
      this.streamService.scheduleYoutubeTransitionAfterIngest(streamId);
    }
    return { ok: true };
  }
}
