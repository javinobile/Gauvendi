import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { WS_EVENTS, WS_ROOMS } from '../constants/ws.const';
import { BehaviorSubject } from 'rxjs';

@WebSocketGateway({
  cors: {
    origin: '*', // Will be configured in afterInit
    credentials: true
  },
  transports: ['websocket', 'polling']
})
export class BookingGateway {
  private readonly logger = new Logger(BookingGateway.name);

  private joinRooms: Map<string, { event: string; data: any }[]> = new Map();
  paymentStatus: Map<string, BehaviorSubject<{ bookingId: string; paymentStatus: string } | null>> =
    new Map();

  constructor(private readonly configService: ConfigService) {}

  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    const allowOrigins =
      this.configService.get(ENVIRONMENT.ALLOW_ORIGINS)?.split(',').filter(Boolean) || [];
    this.logger.log(`WebSocketGateway afterInit CORS origins: ${allowOrigins.join(', ')}`);

    // Update CORS settings
    server.engine.opts.cors = {
      origin: allowOrigins,
      credentials: true
    };
  }

  @SubscribeMessage(WS_EVENTS.BOOKING.CLIENT.JOIN)
  handleJoin(@MessageBody() data: { bookingId: string }, @ConnectedSocket() client: Socket) {
    this.logger.log(`🚀 handleJoin bookingId: ${data.bookingId}`);
    const roomName = `${WS_ROOMS.BOOKING}:${data.bookingId}`;
    this.logger.log(`🚀 handleJoin roomName: ${roomName}`);
    client.join(roomName);
    if (!this.joinRooms.has(roomName)) {
      this.joinRooms.set(roomName, []);
    } else {
      const events = this.joinRooms.get(roomName);
      this.logger.log(`🚀 handleJoin emit events: ${JSON.stringify(events)}`);
      events?.forEach((event) => {
        client.emit(event.event, event.data);
      });
    }
    client.emit(WS_EVENTS.BOOKING.SERVER.JOINED, { bookingId: data.bookingId });
  }

  @SubscribeMessage(WS_EVENTS.BOOKING.CLIENT.DISCONNECT)
  handleClientDisconnect(@MessageBody() data: { bookingId: string }) {
    if (!data?.bookingId) {
      return;
    }
    this.logger.log(`🚀 handleClientDisconnect bookingId: ${data.bookingId}`);
    const roomName = `${WS_ROOMS.BOOKING}:${data.bookingId}`;
    this.leaveRoom(roomName);
    this.joinRooms.delete(roomName);
  }

  @SubscribeMessage(WS_EVENTS.BOOKING.CLIENT.PAYMENT_STATUS)
  handleClientPaymentStatus(@MessageBody() data: { bookingId: string; paymentStatus: string }) {
    if (!data?.bookingId || !data?.paymentStatus) {
      return;
    }
    this.logger.log(`🚀 handleClientPaymentStatus bookingId: ${data.bookingId}`);
    if (!this.paymentStatus.has(data.bookingId)) {
      this.logger.log(`🚀 handleClientPaymentStatus bookingId: ${data.bookingId} not found`);
      return;
    }

    this.paymentStatus.get(data.bookingId)?.next(data);
  }

  private leaveRoom(roomName: string) {
    this.logger.log(`🚀 leaveRoom roomName: ${roomName}`);
    const sockets = this.server.sockets;
    const room = sockets.adapter.rooms.get(roomName);
    this.joinRooms.delete(roomName);

    if (room) {
      room.forEach((socketId) => {
        const socket = sockets.sockets.get(socketId);
        socket?.leave(roomName);
        socket?.emit(WS_EVENTS.BOOKING.SERVER.DISCONNECTED);
      });
    }
  }

  // Emit and kick out of room
  notifyBookingPaymentStatus(bookingId: string, data: any, isLeaveRoom: boolean) {
    const roomName = `${WS_ROOMS.BOOKING}:${bookingId}`;
    if (this.joinRooms.has(roomName)) {
      this.logger.log(`🚀 notifyBookingPaymentStatus roomName: ${roomName}`);
      this.server.to(roomName).emit(WS_EVENTS.BOOKING.SERVER.PAYMENT_STATUS, data);
    } else {
      this.logger.log(`🚀 notifyBookingPaymentStatus add roomName: ${roomName}`);
      this.joinRooms.set(roomName, [{ event: WS_EVENTS.BOOKING.SERVER.PAYMENT_STATUS, data }]);
    }

    if (!isLeaveRoom) return;

    setTimeout(() => {
      this.leaveRoom(roomName);
    }, WS_EVENTS.COMMON.DISCONNECT_TIMEOUT);
  }
}
