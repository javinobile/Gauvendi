import { Body, Controller, Post } from '@nestjs/common';
import {
  RoomProductResponseDto,
  StayOptionRecommendationFilterDto
} from '../dtos/room-product.dto';
import { RoomProductService } from '../services/room-product.service';

@Controller('room-product')
export class RoomProductController {
  constructor(private readonly roomProductService: RoomProductService) {}

  @Post('stay-option-recommendation')
  getRoomProduct(
    @Body() filter: StayOptionRecommendationFilterDto
  ): Promise<RoomProductResponseDto> {
    return this.roomProductService.getRoomProduct(filter);
  }
}
