import { IsUUID } from "class-validator";

export class MigrationFeatureAdjustmentDto {
  @IsUUID()
  hotelId: string;
}
