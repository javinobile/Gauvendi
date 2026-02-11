import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction } from 'express';
import { format } from 'date-fns';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('-----------------------------------');
    console.log(
      `Received 1 request at ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}`,
    );
    console.log(`Request URL: ${req.url}`);
    console.log(`Request Method: ${req.method}`);
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
    console.log('-----------------------------------');
    next();
  }
}
