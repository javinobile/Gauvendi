import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { DynamicContentTranslationFilterDto } from "./dtos/dynamic-content-translation-filter.dto";
import { UpdateDynamicContentTranslationInput } from "./dtos/update-dynamic-content-translation.input";
import { TranslationService } from "./translation.service";

@Controller("translation")
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  getTranslation(@Query() query: DynamicContentTranslationFilterDto) {
    return this.translationService.getTranslation(query);
  }

  @Put()
  updateTranslation(@Body() dto: UpdateDynamicContentTranslationInput) {
    return this.translationService.updateTranslation(dto);
  }
}
