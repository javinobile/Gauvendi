import { Controller, Logger } from '@nestjs/common';
import { BlockService } from '../services/block.service';
import { CMD, CRON_JOB_CMD } from '@src/core/constants/cmd.const';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

@Controller('block')
export class BlockController {
  private readonly logger = new Logger(BlockController.name);
  constructor(private readonly blockService: BlockService) {}

  @MessagePattern({ cmd: CMD.CRON_JOB.JOB_PULL_BLOCK_PMS })
  async jobPullBlockPms() {
    return await this.blockService.jobPullBlockPms();
  }

  @EventPattern({ cmd: CRON_JOB_CMD.JOB_PULL_BLOCK_PMS })
  async jobPullBlockPmsEvent() {
    this.logger.debug('Cron job: pull block pms event');
    return await this.blockService.jobPullBlockPms();
  }
}
