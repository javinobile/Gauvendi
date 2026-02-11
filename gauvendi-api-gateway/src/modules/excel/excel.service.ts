import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { PLATFORM_SERVICE } from "@src/core/clients/platform-client.module";
import { CMD } from "@src/core/constants/cmd.const";
import { ExportReservationDto } from "./dto/export-excel.dto";

@Injectable()
export class ExcelService {
  constructor(
    @Inject(PLATFORM_SERVICE) private readonly hotelClient: ClientProxy,
  ) {}

  exportReservations(body: ExportReservationDto) {
    return this.hotelClient.send({ cmd: CMD.EXCEL.EXPORT_RESERVATIONS }, body);
  }
}
