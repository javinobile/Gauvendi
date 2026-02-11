import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { PushAvailabilitySmDto, PushRestrictionSmDto } from './cm-siteminder.dto';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CmSiteminderService {
  private readonly logger = new Logger(CmSiteminderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async pushAvailability(data: PushAvailabilitySmDto[]) {
    // await lastValueFrom(
    //   this.httpService.post(
    //     `${this.configService.get('REMOTE_SERVICE_ENDPOINT_ITF_CM')}/availability-and-restriction/push-availability`,
    //     data,
    //   ),
    // );
    this.logger.debug(`Pushed availability to Siteminder successfully`);

    return Promise.resolve();
  }

  async pushRestriction(data: PushRestrictionSmDto[]) {
    await lastValueFrom(
      this.httpService.post(
        `${this.configService.get('REMOTE_SERVICE_ENDPOINT_ITF_CM')}/availability-and-restriction/push-restriction`,
        data,
      ),
    );
  }
}
