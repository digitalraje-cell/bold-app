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
import { getAllowedOrigins } from '../common/cors.util';

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

  handleConnection(client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (meetingId) {
      client.join(meetingId);
    }
  }

  handleDisconnect(client: Socket) {
    const meetingId = client.handshake.query.meetingId as string;
    if (meetingId) {
      client.to(meetingId).emit('participant:leave', { socketId: client.id });
    }
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
  handleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string; displayName: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    this.server.to(meetingId).emit('hand:raise', data);
  }

  @SubscribeMessage('hand:lower')
  handleLowerHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { participantId: string },
  ) {
    const meetingId = client.handshake.query.meetingId as string;
    this.server.to(meetingId).emit('hand:lower', data);
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

  broadcastMeetingEnded(meetingId: string, message: string) {
    this.server.to(meetingId).emit('meeting:ended', { meetingId, message });
  }

  broadcastParticipantLeft(meetingId: string, participantId: string) {
    this.server.to(meetingId).emit('participant:left', { meetingId, participantId });
  }
}
