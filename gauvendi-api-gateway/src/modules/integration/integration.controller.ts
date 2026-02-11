import { Body, Controller, Delete, Get, HttpStatus, Post, Query, Res } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { Response } from "express";
import { IntegrationService } from "./integration.service";
import {
  CreateOrUpdateGoogleAnalyticsDto,
  CreateOrUpdateGoogleAdsDto,
  CreateOrUpdateGoogleTagManagerDto,
  CreateOrUpdateMetaConversionDto,
  CreateOrUpdatePropertyTrackingDto,
  DeleteGoogleAnalyticsDto,
  DeleteGoogleAdsDto,
  DeleteGoogleTagManagerDto,
  DeleteMetaConversionDto,
  DeletePropertyTrackingDto,
  GetIntegrationDto,
  PropertyTrackingListDto,
  RequestApaleoIntegrationDto,
} from "./dtos/integration.dto";

@Controller("integration")
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post("request-apaleo-integration")
  requestApaleoIntegration(@Body() payload: RequestApaleoIntegrationDto) {
    return this.integrationService.requestApaleoIntegration(payload);
  }

  @Get("marketing-list")
  getMarketingList(@Query() query: GetIntegrationDto) {
    return this.integrationService.getMarketingList(query);
  }

  @Post("google-analytics/create-or-update")
  createOrUpdateGoogleAnalytics(@Body() payload: CreateOrUpdateGoogleAnalyticsDto, @Res() res: Response): Observable<any> {
    return this.integrationService.createOrUpdateGoogleAnalytics(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("google-analytics/delete")
  deleteGoogleAnalytics(@Body() payload: DeleteGoogleAnalyticsDto, @Res() res: Response): Observable<any> {
    return this.integrationService.deleteGoogleAnalytics(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("google-tag-manager/create-or-update")
  createOrUpdateGoogleTagManager(@Body() payload: CreateOrUpdateGoogleTagManagerDto, @Res() res: Response): Observable<any> {
    return this.integrationService.createOrUpdateGoogleTagManager(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("google-tag-manager/delete")
  deleteGoogleTagManager(@Body() payload: DeleteGoogleTagManagerDto, @Res() res: Response): Observable<any> {
    return this.integrationService.deleteGoogleTagManager(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("google-ads/create-or-update")
  createOrUpdateGoogleAds(@Body() payload: CreateOrUpdateGoogleAdsDto, @Res() res: Response): Observable<any> {
    return this.integrationService.createOrUpdateGoogleAds(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("google-ads/delete")
  deleteGoogleAds(@Body() payload: DeleteGoogleAdsDto, @Res() res: Response): Observable<any> {
    return this.integrationService.deleteGoogleAds(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("meta-conversion/create-or-update")
  createOrUpdateMetaConversion(@Body() payload: CreateOrUpdateMetaConversionDto, @Res() res: Response): Observable<any> {
    return this.integrationService.createOrUpdateMetaConversion(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("meta-conversion/delete")
  deleteMetaConversion(@Body() payload: DeleteMetaConversionDto, @Res() res: Response): Observable<any> {
    return this.integrationService.deleteMetaConversion(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Get("hotel-tracking/list")
  getPropertyTrackingList(@Query() query: PropertyTrackingListDto) {
    return this.integrationService.getPropertyTrackingList(query);
  }

  @Post("hotel-tracking/create-or-update")
  createOrUpdatePropertyTracking(@Body() payload: CreateOrUpdatePropertyTrackingDto, @Res() res: Response): Observable<any> {
    return this.integrationService.createOrUpdatePropertyTracking(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }

  @Post("hotel-tracking/delete")
  deletePropertyTracking(@Body() payload: DeletePropertyTrackingDto, @Res() res: Response): Observable<any> {
    return this.integrationService.deletePropertyTracking(payload).pipe(
      tap((result) => {
        res.status(HttpStatus.OK).send(result);
      })
    );
  }
}
