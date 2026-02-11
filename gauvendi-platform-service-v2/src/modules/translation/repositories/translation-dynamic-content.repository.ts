import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { TranslationDynamicContent } from '@src/core/entities/translation-entities/translation-dynamic-content.entity';
import { TranslationEntityConfig } from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { TranslationHotelLanguageBundle } from '@src/core/entities/translation-entities/translation-hotel-language-bundle.entity';
import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';

export class TranslationDynamicContentRepository {
  constructor(
    @InjectRepository(TranslationDynamicContent, DbName.Postgres)
    private readonly translationDynamicContentRepository: Repository<TranslationDynamicContent>,
    @InjectRepository(TranslationEntityConfig, DbName.Postgres)
    private readonly translationEntityConfigRepository: Repository<TranslationEntityConfig>,
    @InjectRepository(TranslationHotelLanguageBundle, DbName.Postgres)
    private readonly translationHotelLanguageBundleRepository: Repository<TranslationHotelLanguageBundle>
  ) {}

  findAll(
    filter: {
      translationHotelLanguageBundleIds?: string[];
      translationEntityConfigIds?: string[];
      entityIds?: string[];
      relations?: FindOptionsRelations<TranslationDynamicContent>;
    },
    select?: FindOptionsSelect<TranslationDynamicContent>
  ): Promise<TranslationDynamicContent[]> {
    const { translationHotelLanguageBundleIds, translationEntityConfigIds, entityIds, relations } = filter;

    const where: FindOptionsWhere<TranslationDynamicContent> = {
      deletedAt: IsNull()
    };

    if (translationHotelLanguageBundleIds?.length) {
      where.hlbId = In(translationHotelLanguageBundleIds);
    }
    if (translationEntityConfigIds?.length) {
      where.etcId = In(translationEntityConfigIds);
    }
    if (entityIds?.length) {
      where.entityId = In(entityIds);
    }

    return this.translationDynamicContentRepository.find({
      where: where,
      select: select,
      relations: relations
    });
  }

  saveAll(translationDynamicContents: TranslationDynamicContent[]): Promise<TranslationDynamicContent[]> {
    return this.translationDynamicContentRepository.save(translationDynamicContents);
  }
}
