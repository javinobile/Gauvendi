import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AutomateLosRequestDto,
  TriggerLosRestrictionDto
} from './room-product-restriction.dto';
import { RoomProductRestrictionService } from './room-product-restriction.service';

@Controller('room-products')
export class RoomProductRestrictionController {
  constructor(private readonly roomProductRestrictionService: RoomProductRestrictionService) {}

  @MessagePattern({ cmd: 'process_automate_los' })
  processAutomateLos(@Payload() body: AutomateLosRequestDto) {
    return this.roomProductRestrictionService.processAutomateLos(body);
  }

  @MessagePattern({ cmd: 'trigger_los_restriction' })
  triggerLosRestriction(@Payload() body: TriggerLosRestrictionDto) {
    return this.roomProductRestrictionService.triggerLosRestriction(body);
  }
}
