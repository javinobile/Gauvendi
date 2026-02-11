import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { DynamicContentTranslationFilterDto } from "./dtos/dynamic-content-translation-filter.dto";
import { UpdateDynamicContentTranslationInput } from "./dtos/update-dynamic-content-translation.input";

@Injectable()
export class TranslationService {
  constructor(@Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy) {}

  getTranslation(query: DynamicContentTranslationFilterDto) {
    return this.platformClient.send({ cmd: CMD.TRANSLATION.GET_DYNAMIC_CONTENT_TRANSLATION }, query);
  }

 
  updateTranslation(dto: UpdateDynamicContentTranslationInput) {
    return this.platformClient.send({ cmd: CMD.TRANSLATION.UPDATE_DYNAMIC_CONTENT_TRANSLATION }, dto);
  }

}
