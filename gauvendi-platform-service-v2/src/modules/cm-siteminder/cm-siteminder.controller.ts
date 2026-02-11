import { Controller } from '@nestjs/common';
import { CmSiteminderService } from './cm-siteminder.service';

@Controller('cm-siteminder')
export class CmSiteminderController {
  constructor(private readonly cmSiteminderService: CmSiteminderService) {}
}
