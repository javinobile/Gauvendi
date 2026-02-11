import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CMD } from '@src/core/constants/cmd.const';
import { DynamicContentTranslationFilterDto } from './dtos/dynamic-content-translation-filter.dto';
import { UpdateDynamicContentTranslationInput } from './dtos/update-dynamic-content-translation.input';
import { TranslationService } from './services/translation.service';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @MessagePattern({ cmd: CMD.TRANSLATION.GET_DYNAMIC_CONTENT_TRANSLATION })
  async getDynamicContentTranslation(@Payload() filter: DynamicContentTranslationFilterDto) {
    return await this.translationService.getDynamicContentTranslation(filter);
  }

  @MessagePattern({ cmd: CMD.TRANSLATION.UPDATE_DYNAMIC_CONTENT_TRANSLATION })
  async updateDynamicContentTranslation(@Payload() input: UpdateDynamicContentTranslationInput) {
    return await this.translationService.updateDynamicContentTranslation(input);
  }
}
