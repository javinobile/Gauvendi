// import { Module, OnModuleInit } from '@nestjs/common';
// import { Queue, QueueEvents, Worker } from 'bullmq';
// import { BookingConsumer } from './booking-consumer';
// import Redis from 'ioredis';
// import { QUEUE_NAMES } from 'src/core/modules/queue/queue.constant';

// @Module({
//   providers: [
//     BookingConsumer // Worker
//   ],
//   exports: ['BOOKING_QUEUE', 'BOOKING_EVENTS']
// })
// export class BookingQueueModule implements OnModuleInit {
//   public bookingQueue: Queue;
//   public bookingEvents: QueueEvents;

//   onModuleInit() {
//     this.bookingQueue = new Queue(QUEUE_NAMES.BOOKING, {
//       connection: new Redis({
//         host: process.env.REDIS_HOST,
//         port: process.env.REDIS_PORT,
//         username: process.env.REDIS_USERNAME,
//         password: process.env.REDIS_PASSWORD
//       })
//     });

//     this.bookingEvents = new QueueEvents(QUEUE_NAMES.BOOKING, {
//       connection: new Redis({
//         host: process.env.REDIS_HOST,
//         port: process.env.REDIS_PORT,
//         username: process.env.REDIS_USERNAME,
//         password: process.env.REDIS_PASSWORD
//       })
//     });

//     this.bookingEvents.waitUntilReady();
//   }
// }
