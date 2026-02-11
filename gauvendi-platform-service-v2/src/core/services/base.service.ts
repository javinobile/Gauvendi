import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '../constants/environment.const';
import { PERFORMED_BY } from '../constants/common.const';

export abstract class BaseService {
  isProd: boolean;
  currentSystem: string;
  constructor(protected readonly configService: ConfigService) {
    this.isProd = this.configService.get(ENVIRONMENT.NODE_ENV) === 'production';
    this.currentSystem = this.isProd ? PERFORMED_BY.SYSTEM : PERFORMED_BY.SYSTEM_TEST;
  }
}
