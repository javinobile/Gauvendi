import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { AdminResponseDto, MasterTemplateResponse } from './admin.dto';
import { ConfigService } from '@nestjs/config';
import { ENVIRONMENT } from '../constants/environment.const';
import { map } from 'rxjs/operators';

@Injectable()
export class AdminService {
  apiKey: string = '';
  adminUrl: string = '';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.apiKey = this.configService.get<string>(ENVIRONMENT.ADMIN_API_KEY) || '';
    this.adminUrl = this.configService.get<string>(ENVIRONMENT.REMOTE_SERVICE_ADMIN) || '';
  }

  async getTemplateFeature(type: 'STANDARD' | 'RETAIL'): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.post(
        `${this.adminUrl}/template-feature/getAll`,
        {}, // should not filter by feature type, old API design is get all and don't filter by feature type to ensure FE code work correctly
        { headers: { 'gvd-admin-key': this.apiKey } }
      )
    );

    return response.data?.data?.map((i) => ({
      ...i,
      iconImageUrl: i.imageUrl,
      templateRetailCategory: i.templateRetailCategory && !i.code?.startsWith('ST_') ? i.templateRetailCategory : {
        id: '',
        name: 'Standard Feature',
        code: 'ST', // this one is hardcoded cause small effort to change the existing FE code. GVD-7287 Platform - Unable to add standard features
        iconImageId: '',
        displaySequence: 999,
        categoryType: ''
      }
    }));
  }

  async getTemplateCategory() {
    const response = await lastValueFrom(
      this.httpService.post(
        `${this.adminUrl}/template-category/getAll`,
        {
          sort: ['displaySequence:asc']
        },
        {
          headers: { 'gvd-admin-key': this.apiKey }
        }
      )
    );

    return response.data?.data;
  }
}
