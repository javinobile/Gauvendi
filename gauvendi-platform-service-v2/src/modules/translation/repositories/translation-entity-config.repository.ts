import { InjectRepository } from '@nestjs/typeorm';
import { DbName } from '@src/core/constants/db-name.constant';
import {
  EntityTranslationConfigCodeEnum,
  TranslationEntityConfig
} from '@src/core/entities/translation-entities/translation-entity-config.entity';
import { FindOptionsSelect, FindOptionsWhere, In, IsNull, Repository } from 'typeorm';

export class TranslationEntityConfigRepository {
  constructor(
    @InjectRepository(TranslationEntityConfig, DbName.Postgres)
    private readonly translationEntityConfigRepository: Repository<TranslationEntityConfig>
  ) {}

  findAll(
    filter: {
      codes?: string[];
      isStatic?: boolean;
      ids?: string[];
    },
    select?: FindOptionsSelect<TranslationEntityConfig>
  ): Promise<TranslationEntityConfig[]> {
    const { codes, isStatic, ids } = filter;

    const where: FindOptionsWhere<TranslationEntityConfig> = {
      deletedAt: IsNull()
    };
    if (codes?.length) {
      where.code = In(codes);
    }
    if (isStatic !== undefined) {
      where.isStatic = isStatic;
    }
    if (ids?.length) {
      where.id = In(ids);
    }

    return this.translationEntityConfigRepository.find({
      where: where,
      select: select
    });
  }

  findOneByCode(code: EntityTranslationConfigCodeEnum): Promise<TranslationEntityConfig | null> {
    return this.translationEntityConfigRepository.findOne({
      where: {
        code: code,
        deletedAt: IsNull()
      }
    });
  }
}
