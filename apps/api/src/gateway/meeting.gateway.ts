import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ParticipantStatus } from '@prisma/client';
import { getAllowedOrigins } from '../common/cors.util';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/meetings',
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
})
export class MeetingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly prisma: PrismaService) {}

  /** meetingId → host socket ids (Bold HOST role in room) */
  private hostSockets = new Map<string, Set<string>>();

  /** Host has joined the Jitsi/media conference — safe for guests to connect */
  private hostMediaReady = new Map<string, boolean>();

  handleConnection(client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (meetingId) {
      client.join(meetingId);
      client.emit('host:status', {
        present: this.isHostPresent(meetingId),
        mediaReady: this.isHostMediaReady(meetingId),
      });
    }
  }

  handleDisconnect(client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (meetingId) {
      client.to(meetingId).emit('participant:leave', { socketId: client.id });
      if (client.data.isHost) {
        this.removeHostSocket(meetingId, client.id);
      }
    }
  }

  private isHostPresent(meetingId: string): boolean {
    return (this.hostSockets.get(meetingId)?.size ?? 0) > 0;
  }

  private isHostMediaReady(meetingId: string): boolean {
    return this.hostMediaReady.get(meetingId) === true;
  }

  private clearHostState(meetingId: string) {
    this.hostMediaReady.delete(meetingId);
  }

  private addHostSocket(meetingId: string, socketId: string) {
    if (!this.hostSockets.has(meetingId)) {
      this.hostSockets.set(meetingId, new Set());
    }
    const wasEmpty = this.hostSockets.get(meetingId)!.size === 0;
    this.hostSockets.get(meetingId)!.add(socketId);
    if (wasEmpty) {
      this.server.to(meetingId).emit('host:present', { meetingId });
    }
  }

  private removeHostSocket(meetingId: string, socketId: string) {
    const set = this.hostSockets.get(meetingId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) {
      this.hostSockets.delete(meetingId);
      this.clearHostState(meetingId);
      this.server.to(meetingId).emit('host:absent', { meetingId });
      this.server.to(meetingId).emit('host:media-left', { meetingId });
    }
  }

  @SubscribeMessage('host:present')
  handleHostPresent(@ConnectedSocket() client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId) return { success: false };
    client.data.isHost = true;
    this.addHostSocket(meetingId, client.id);
    return { success: true, present: true };
  }

  @SubscribeMessage('host:absent')
  handleHostAbsent(@ConnectedSocket() client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId) return { success: false };
    client.data.isHost = false;
    this.removeHostSocket(meetingId, client.id);
    return {
      success: true,
      present: this.isHostPresent(meetingId),
      mediaReady: this.isHostMediaReady(meetingId),
    };
  }

  @SubscribeMessage('host:status:request')
  handleHostStatusRequest(@ConnectedSocket() client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId) return { success: false };
    const status = {
      present: this.isHostPresent(meetingId),
      mediaReady: this.isHostMediaReady(meetingId),
    };
    client.emit('host:status', status);
    return { success: true, ...status };
  }

  @SubscribeMessage('host:media-ready')
  handleHostMediaReady(@ConnectedSocket() client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId || !client.data.isHost) return { success: false };
    this.hostMediaReady.set(meetingId, true);
    this.server.to(meetingId).emit('host:media-ready', { meetingId });
    return { success: true };
  }

  @SubscribeMessage('host:media-left')
  handleHostMediaLeft(@ConnectedSocket() client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId || !client.data.isHost) return { success: false };
    this.hostMediaReady.delete(meetingId);
    this.server.to(meetingId).emit('host:media-left', { meetingId });
    return { success: true };
  }

  @SubscribeMessage('participant:join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string; displayName: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    client.to(meetingId).emit('participant:join', data);
    return { success: true };
  }

  @SubscribeMessage('chat:message')
  handleChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Record<string, unknown>,
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    this.server.to(meetingId).emit('chat:message', data);
  }

  @SubscribeMessage('reaction:send')
  handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string; reaction: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    this.server.to(meetingId).emit('reaction:send', data);
  }

  @SubscribeMessage('hand:raise')
  async handleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string; displayName: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId || !data.participantId) return { success: false };

    await this.prisma.participant.updateMany({
      where: {
        id: data.participantId,
        meetingId,
        status: ParticipantStatus.ADMITTED,
      },
      data: { handRaised: true, handRaisedAt: new Date() },
    });

    this.server.to(meetingId).emit('hand:raise', data);
    return { success: true };
  }

  @SubscribeMessage('hand:lower')
  async handleLowerHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    if (!meetingId || !data.participantId) return { success: false };

    await this.prisma.participant.updateMany({
      where: {
        id: data.participantId,
        meetingId,
        status: ParticipantStatus.ADMITTED,
      },
      data: { handRaised: false, handRaisedAt: null },
    });

    this.server.to(meetingId).emit('hand:lower', data);
    return { success: true };
  }

  @SubscribeMessage('settings:update')
  handleSettingsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: Record<string, unknown>,
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    this.server.to(meetingId).emit('settings:update', data);
  }

  @SubscribeMessage('waiting:admit')
  handleAdmit(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    this.server.to(meetingId).emit('waiting:admit', data);
  }

  broadcastRoomModeChanged(meetingId: string, roomMode: string) {
    this.server.to(meetingId).emit('room:mode-changed', { roomMode, meetingId });
  }

  broadcastParticipantStage(
    meetingId: string,
    participant: {
      id: string;
      isOnStage: boolean;
      micAllowed: boolean;
      cameraAllowed: boolean;
      isMuted: boolean;
      isVideoOff: boolean;
      role?: string;
    },
  ) {
    this.server.to(meetingId).emit('participant:stage', {
      participantId: participant.id,
      isOnStage: participant.isOnStage,
      micAllowed: participant.micAllowed,
      cameraAllowed: participant.cameraAllowed,
      isMuted: participant.isMuted,
      isVideoOff: participant.isVideoOff,
      role: participant.role,
    });
  }

  broadcastChatModeChanged(meetingId: string, chatMode: string, chatEnabled: boolean) {
    this.server.to(meetingId).emit('chat:mode-changed', { chatMode, chatEnabled });
  }

  broadcastSettingsUpdate(meetingId: string, patch: Record<string, unknown>) {
    this.server.to(meetingId).emit('settings:update', patch);
  }

  broadcastMeetingEnded(meetingId: string, message: string) {
    this.server.to(meetingId).emit('meeting:ended', { meetingId, message });
  }

  broadcastParticipantLeft(meetingId: string, participantId: string) {
    this.server.to(meetingId).emit('participant:left', { meetingId, participantId });
  }

  broadcastParticipantJoined(
    meetingId: string,
    participant: {
      id: string;
      displayName: string;
      role: string;
      userId?: string | null;
      isMuted?: boolean;
      isVideoOff?: boolean;
    },
  ) {
    this.server.to(meetingId).emit('participant:joined', {
      meetingId,
      participantId: participant.id,
      displayName: participant.displayName,
      role: participant.role,
      userId: participant.userId ?? null,
      isMuted: participant.isMuted ?? false,
      isVideoOff: participant.isVideoOff ?? false,
    });
  }

  broadcastParticipantRoleChanged(meetingId: string, participantId: string, role: string) {
    this.server.to(meetingId).emit('participant:role-changed', { meetingId, participantId, role });
  }

  broadcastWaitingAdmit(meetingId: string, participantId: string) {
    this.server.to(meetingId).emit('waiting:admit', { participantId });
  }

  broadcastStreamLive(
    meetingId: string,
    payload: {
      title?: string;
      watchUrl?: string;
      provider?: string;
      startedAt?: string;
      status?: string;
    },
  ) {
    this.server.to(meetingId).emit('stream:live', { meetingId, ...payload });
  }

  broadcastStreamStopped(meetingId: string) {
    this.server.to(meetingId).emit('stream:stopped', { meetingId });
  }

  broadcastStreamError(meetingId: string, message: string) {
    this.server.to(meetingId).emit('stream:error', { meetingId, message });
  }
}
