import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTriggerIsChangedForRoomUnit1769161386136 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION mark_room_unit_as_changed()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
          UPDATE public.room_unit
          SET is_changed = TRUE,
              updated_at = now()
          WHERE id = NEW.room_unit_id;
        ELSIF (TG_OP = 'DELETE') THEN
          UPDATE public.room_unit
          SET is_changed = TRUE,
              updated_at = now()
          WHERE id = OLD.room_unit_id;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_room_unit_availability_is_changed
      AFTER INSERT OR UPDATE OR DELETE ON public.room_unit_availability
      FOR EACH ROW
      EXECUTE FUNCTION mark_room_unit_as_changed();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_room_product_assigned_unit_is_changed
      AFTER INSERT OR UPDATE OR DELETE ON public.room_product_assigned_unit
      FOR EACH ROW
      EXECUTE FUNCTION mark_room_unit_as_changed();
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_room_unit_retail_feature_is_changed
      AFTER INSERT OR UPDATE OR DELETE ON public.room_unit_retail_feature
      FOR EACH ROW
      EXECUTE FUNCTION mark_room_unit_as_changed();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Xóa trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_room_unit_availability_is_changed ON public.room_unit_availability;
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_room_product_assigned_unit_is_changed ON public.room_product_assigned_unit;
    `);
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_room_unit_retail_feature_is_changed ON public.room_unit_retail_feature;
    `);

    // Xóa function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS mark_room_unit_as_changed;
    `);
  }
}
