import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { map } from "rxjs";
import { ExportReservationDto } from "./dto/export-excel.dto";
import { ExcelService } from "./excel.service";

@Controller("excel")
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post("export/reservations")
  exportReservations(@Body() body: ExportReservationDto, @Res() res: Response) {
    return this.excelService.exportReservations(body).pipe(
      map((data) => {
        if (data) {
          const filename = `bookings_${Date.now()}.xlsx`;
          res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filename}`,
            "Content-Length": data.length,
          });

          const buffer = Buffer.from(data, "base64");
          return res.status(HttpStatus.OK).send(buffer);
        }
        return res.status(HttpStatus.NO_CONTENT).send();
      })
    );
  }
}
