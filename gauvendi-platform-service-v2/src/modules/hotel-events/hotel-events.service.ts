import { DbName } from '@constants/db-name.constant';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { EventCategory } from '@src/core/entities/hotel-entities/event-category.entity';
import { EventFeature } from '@src/core/entities/hotel-entities/event-feature.entity';
import { EventLabel } from '@src/core/entities/hotel-entities/event-label.entity';
import { Event } from '@src/core/entities/hotel-entities/event.entity';
import { BadRequestException, NotFoundException } from '@src/core/exceptions';
import { Helper } from '@src/core/helper/utils';
import { DataSource, In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { GetHotelEventsDto, UpsertHotelEventDto } from './hotel-events.dto';

@Injectable()
export class HotelEventsService {
  private readonly logger = new Logger(HotelEventsService.name);

  constructor(
    @InjectRepository(Event, DbName.Postgres)
    private readonly hotelEventsRepository: Repository<Event>,

    @InjectRepository(EventCategory, DbName.Postgres)
    private readonly hotelEventsCategoriesRepository: Repository<EventCategory>,

    @InjectRepository(EventLabel, DbName.Postgres)
    private readonly hotelEventsLabelsRepository: Repository<EventLabel>,

    @InjectRepository(EventFeature, DbName.Postgres)
    private readonly eventsFeaturesRepository: Repository<EventFeature>,

    @InjectDataSource(DbName.Postgres)
    private readonly dataSource: DataSource
  ) {}

  async onModuleInit() {
    // const categories = await this.hotelEventsLabelsRepository.find();
    // console.log(categories);
  }

  async upsertHotelEvent(payload: UpsertHotelEventDto) {
    try {
      const {
        id,
        categoryId,
        hotelId,
        endDate,
        eventFeatureInputList,
        isVisible,
        labels,
        location,
        name,
        note,
        startDate,
        translations
      } = payload;

      return await this.dataSource.transaction(async (manager) => {
        let eventId: string;

        if (id) {
          // UPDATE: Check if event exists
          const event = await manager.findOne(Event, { where: { id } });

          if (!event) {
            throw new NotFoundException('Event not found');
          }

          // Build update query with proper handling for text array
          const queryBuilder = manager.createQueryBuilder().update(Event).where('id = :id', { id });

          // Build update data with all fields including labels
          const updateData: any = {
            ...(categoryId !== undefined && { categoryId }),
            ...(hotelId !== undefined && { hotelId }),
            ...(endDate !== undefined && { endDate: Helper.parseDateToUTC(endDate) }),
            ...(isVisible !== undefined && { isVisible }),
            ...(location !== undefined && { location }),
            ...(name !== undefined && { name }),
            ...(note !== undefined && { note }),
            ...(startDate !== undefined && { startDate: Helper.parseDateToUTC(startDate) }),
            ...(translations !== undefined && { translations })
          };

          // Handle labels as PostgreSQL JSONB with parameterized query
          if (labels !== undefined && labels?.length > 0) {
            updateData.labels = () => `:labels::jsonb`;
            queryBuilder.setParameter('labels', JSON.stringify(labels));
          }

          // Set all fields at once
          queryBuilder.set(updateData);

          await queryBuilder.execute();

          eventId = id;
        } else {
          // CREATE: Insert new event
          const insertQueryBuilder = manager.createQueryBuilder().insert().into(Event);

          const insertValues: any = {
            categoryId,
            hotelId,
            endDate: endDate ? Helper.parseDateToUTC(endDate) : undefined,
            isVisible: isVisible ?? false,
            location,
            name,
            note,
            startDate: startDate ? Helper.parseDateToUTC(startDate) : undefined,
            translations: translations ?? []
          };

          // Handle labels as PostgreSQL JSONB (same as UPDATE)
          if (labels !== undefined && labels?.length > 0) {
            insertValues.labels = () => `:labels::jsonb`;
            insertQueryBuilder.setParameter('labels', JSON.stringify(labels));
          } else {
            insertValues.labels = null; // Use null instead of empty array for JSONB
          }

          const insertResult = await insertQueryBuilder.values(insertValues).execute();

          eventId = insertResult.identifiers[0].id;
        }

        // Handle event features if provided
        if (eventFeatureInputList && eventFeatureInputList.length > 0) {
          // Separate features to update, insert, and delete
          const featuresToUpdate = eventFeatureInputList.filter((f) => f.id);
          const featuresToInsert = eventFeatureInputList.filter(
            (f) => !f.id && f.propertyRetailFeatureId
          );

          // Get existing feature IDs for this event
          const existingFeatureIds = await manager
            .createQueryBuilder(EventFeature, 'ef')
            .select('ef.id')
            .where('ef.eventId = :eventId', { eventId })
            .getMany()
            .then((features) => features.map((f) => f.id));

          const keepFeatureIds = featuresToUpdate.map((f) => f.id);
          const featureIdsToDelete = existingFeatureIds.filter(
            (id) => !keepFeatureIds.includes(id)
          );

          // Delete features that are not in the update list (bulk delete)
          if (featureIdsToDelete.length > 0) {
            await manager
              .createQueryBuilder()
              .delete()
              .from(EventFeature)
              .where('id IN (:...ids)', { ids: featureIdsToDelete })
              .execute();
          }

          // Bulk update existing features
          if (featuresToUpdate.length > 0) {
            // Use CASE WHEN for bulk update in a single query
            const ids = featuresToUpdate.map((f) => f.id);

            // Build the CASE statements
            const caseRetailFeatureId = featuresToUpdate
              .map((f) => `WHEN id = '${f.id}' THEN '${f.propertyRetailFeatureId}'`)
              .join(' ');

            await manager.query(
              `
              UPDATE event_feature
              SET 
                hotel_retail_feature_id = CASE ${caseRetailFeatureId} END,
                updated_at = NOW()
              WHERE id IN (${ids.map((id) => `'${id}'`).join(', ')})
              `
            );
          }

          // Bulk insert new features
          if (featuresToInsert.length > 0) {
            const insertValues = featuresToInsert
              .map((f) => `('${eventId}', '${f.propertyRetailFeatureId}', NOW(), NOW())`)
              .join(', ');

            await manager.query(
              `
              INSERT INTO event_feature (event_id, hotel_retail_feature_id, created_at, updated_at)
              VALUES ${insertValues}
              `
            );
          }
        }

        // Return created/updated event with relations
        return await manager.findOne(Event, {
          where: { id: eventId },
          relations: ['category', 'eventFeatures', 'eventFeatures.hotelRetailFeature']
        });
      });
    } catch (error) {
      this.logger.error('Error upserting hotel event:', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
  }

  async deleteHotelEvent(payload: { id: string }) {
    try {
      const deleteResult = await this.hotelEventsRepository.delete(payload.id);

      return deleteResult;
    } catch (error) {
      this.logger.error('Error updating hotel event:', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
  }

  async migrateHotelEventsTranslation() {
    try {
      // Get all translation data in a single optimized query
      const allTranslationData = await this.hotelEventsRepository.manager
        .createQueryBuilder()
        .select([
          'e.id as event_id',
          'e.name as event_name',
          'tdc.attribute as attribute',
          'til.code as locale_code'
        ])
        .from('event', 'e')
        .innerJoin('translation_dynamic_content', 'tdc', 'tdc.entity_id = e.id')
        .leftJoin('translation_hotel_language_bundle', 'thlb', 'tdc.hlb_id = thlb.id')
        .leftJoin('translation_i18n_locale', 'til', 'thlb.i18n_locale_id = til.id')
        .where('e.translations = :emptyArray', { emptyArray: '[]' })
        .andWhere('tdc.deleted_at IS NULL')
        .andWhere('thlb.deleted_at IS NULL')
        .andWhere('til.deleted_at IS NULL')
        .getRawMany();

      const mappedTranslationKey = new Map<string, string>([['NAME', 'name']]);

      this.logger.log(`Found ${allTranslationData.length} translation records to process`);

      // Group translation data by event ID
      const translationsByEvent = new Map<
        string,
        {
          eventName: string;
          translationData: any[];
        }
      >();

      for (const data of allTranslationData) {
        if (!data.event_id) {
          continue;
        }

        if (!translationsByEvent.has(data.event_id)) {
          translationsByEvent.set(data.event_id, {
            eventName: data.event_name,
            translationData: []
          });
        }

        translationsByEvent.get(data.event_id)!.translationData.push(data);
      }

      this.logger.log(`Found ${translationsByEvent.size} events to migrate translations`);

      // Process each event with the same logic as hotel payment term
      for (const [eventId, { eventName, translationData }] of translationsByEvent) {
        if (translationData.length === 0) {
          continue;
        }

        // Build translations array
        const translations: any[] = [];

        for (const data of translationData) {
          if (!data.attribute || !data.locale_code) {
            continue;
          }

          // Convert locale code (e.g., "es-ES") to language code (e.g., "ES")
          const languageCode = this.extractLanguageCode(data.locale_code);

          if (!languageCode) {
            continue;
          }

          // Parse the attribute JSON and build translation object
          const translationObj: any = {
            languageCode: languageCode
          };

          // Parse available attribute keys to know what fields to extract
          const availableKeys = ['name'];

          // Extract translation data from attribute JSON
          const attributeObject = JSON.parse(data.attribute);
          if (Array.isArray(attributeObject)) {
            for (const attr of attributeObject) {
              if (attr && typeof attr === 'object') {
                for (const key of availableKeys) {
                  if (attr[key] || attr[`${key}`.toLowerCase()] || attr[key.toUpperCase()]) {
                    const value =
                      attr[key] || attr[`${key}`.toLowerCase()] || attr[key.toUpperCase()];
                    translationObj[`${key}`.toLowerCase()] = value;
                  } else if (attr['key']) {
                    const mappedKey =
                      mappedTranslationKey.get(attr['key']) || `${attr['key']}`.toLowerCase();
                    translationObj[mappedKey] = attr['value'] || '';
                  }
                }
              }
            }
          } else if (attributeObject && typeof attributeObject === 'object') {
            for (const key of availableKeys) {
              if (
                attributeObject[key] ||
                attributeObject[`${key}`.toLowerCase()] ||
                attributeObject[key.toUpperCase()]
              ) {
                translationObj[`${key}`.toLowerCase()] = attributeObject[`${key}`.toLowerCase()];
              }
            }
          }

          // Only add translation if it has content beyond just languageCode
          if (Object.keys(translationObj).length > 1) {
            translations.push(translationObj);
          }
        }

        // Update event with translations
        if (translations.length > 0) {
          await this.hotelEventsRepository.manager
            .createQueryBuilder()
            .update(Event)
            .set({ translations: translations })
            .where('id = :id', { id: eventId })
            .execute();

          this.logger.log(`Migrated ${translations.length} translations for event ${eventName}`);
        }
      }

      this.logger.log('Hotel events translation migration completed successfully');
      return {
        message: 'Hotel events translations migrated successfully',
        migratedCount: translationsByEvent.size,
        totalTranslationRecords: allTranslationData.length
      };
    } catch (error) {
      this.logger.error('Error migrating hotel events translation:', JSON.stringify(error));
      throw new BadRequestException(error.message);
    }
  }

  private extractLanguageCode(localeCode: string): string | null {
    if (!localeCode) return null;

    // Convert locale codes like "es-ES", "en-US", "fr-FR" to language codes like "ES", "EN", "FR"
    const parts = localeCode.split('-');
    if (parts.length >= 2) {
      const languageCode = parts[1].toUpperCase();

      // Validate against LanguageCodeEnum
      const validLanguageCodes = ['EN', 'FR', 'DE', 'IT', 'ES', 'NL', 'AR'];
      if (validLanguageCodes.includes(languageCode)) {
        return languageCode;
      }
    }

    // Fallback: try first part if it matches valid language codes
    const firstPart = parts[0].toUpperCase();
    const validLanguageCodes = ['EN', 'FR', 'DE', 'IT', 'ES', 'NL', 'AR'];
    if (validLanguageCodes.includes(firstPart)) {
      return firstPart;
    }

    return null;
  }

  async getHotelEvents(payload: GetHotelEventsDto) {
    let { hotelId, expand, isVisible, startDate, endDate, idList } = payload;

    if (!hotelId) {
      throw new BadRequestException('Hotel ID is required');
    }

    if (expand && expand.includes('translation')) {
      expand = expand.filter((item) => item !== 'translation');
    }

    try {
      const res = await this.hotelEventsRepository.find({
        where: {
          hotelId,
          ...(isVisible !== undefined && { isVisible }),
          startDate: startDate ? MoreThanOrEqual(Helper.parseDateToUTC(startDate)) : undefined,
          endDate: endDate ? LessThanOrEqual(Helper.parseDateToUTC(endDate)) : undefined,
          id: idList ? In(idList) : undefined
        },
        select: {
          translations: true,
          categoryId: true,
          endDate: true,
          startDate: true,
          isVisible: true,
          name: true,
          location: true,
          id: true,
          note: true,
          labels: true,
          category: {
            id: true,
            name: true,
            imageUrl: true
          },
          hotelId: true
        },
        relations: ['category', ...(expand ? expand : [])]
      });

      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelEventsCategories() {
    try {
      const res = await this.hotelEventsCategoriesRepository.find({
        select: {
          id: true,
          name: true,
          imageId: true,
          imageUrl: true
        }
      });

      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getHotelEventsLabels() {
    try {
      const res = await this.hotelEventsLabelsRepository.find({
        select: {
          id: true,
          name: true
        }
      });

      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async refreshImageEventCategories() {
    // TODO: call from admin service
//     update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/academic.png' where name = 'Academic';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/airport_delays.png' where name = 'Airport delays';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/community.png' where name = 'Community';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/concerts.png' where name = 'Concerts';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/conferences.png' where name = 'Conferences';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/daylight_savings.png' where name = 'Daylight savings';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/disasters.png' where name = 'Disasters';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/expos.png' where name = 'Expos';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/festival.png' where name = 'Festivals';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/health_warning.png' where name = 'Health warnings';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/observances.png' where name = 'Observances';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/performing_arts.png' where name = 'Performing arts';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/politics.png' where name = 'Politics';    
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/public_holidays.png' where name = 'Public holidays';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/school_holidays.png' where name = 'School holidays';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/severe_weather.png' where name = 'Severe weather';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/sports.png' where name = 'Sports';
// update public.event_category set image_url = 'https://assets-cdn.gauvendi.com/template/event_category/terror.png' where name = 'Terror';
  }
}
