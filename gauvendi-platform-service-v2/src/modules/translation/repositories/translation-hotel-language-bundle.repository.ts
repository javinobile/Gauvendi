import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import { TranslationHotelLanguageBundle } from '@src/core/entities/translation-entities/translation-hotel-language-bundle.entity';
import { FindOptionsRelations, FindOptionsSelect, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';

export class TranslationHotelLanguageBundleRepository {
  constructor(
    @InjectRepository(TranslationHotelLanguageBundle, DbName.Postgres)
    private readonly translationHotelLanguageBundleRepository: Repository<TranslationHotelLanguageBundle>
  ) {}

  findAll(
    filter: {
      hotelId?: string;
      localeCodes?: string[];
      relations?: FindOptionsRelations<TranslationHotelLanguageBundle>;
    },
    select?: FindOptionsSelect<TranslationHotelLanguageBundle>
  ): Promise<TranslationHotelLanguageBundle[]> {
    const { hotelId, localeCodes, relations } = filter;

    const where: FindOptionsWhere<TranslationHotelLanguageBundle> = {
      deletedAt: IsNull(),
    };

    if (localeCodes?.length) {
      where.i18nLocale = {
        code: In(localeCodes)
      };
    }
    if (hotelId) {
      where.hotelId = hotelId;
    }

    return this.translationHotelLanguageBundleRepository.find({
      where: where,
      select: select,
      relations: relations
    });
  }
}
