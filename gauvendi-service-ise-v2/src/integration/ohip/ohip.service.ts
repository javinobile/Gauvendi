import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from 'src/core/constants/environment.const';

@Injectable()
export class OhipService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}
  async getOhipToken(body: {
    gatewayUrl: string;
    username: string;
    password: string;
    clientId: string;
    clientSecret: string;
  }): Promise<any> {
    const { gatewayUrl, username, password, clientId, clientSecret } = body;
    const url = `${gatewayUrl}/oauth/v1/token`;
    const response = await firstValueFrom(
      this.httpService.post(
        url,
        {
          grant_type: 'password',
          username: username,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'x-app-key': this.configService.get(ENVIRONMENT.OHIP_APP_KEY),
            Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
          }
        }
      )
    );
    return response?.data?.access_token;
  }

  async getHouseAvailability(body: {
    gatewayUrl: string;
    token: string;
    mappingHotelCode: string;
  }): Promise<any> {
    const { gatewayUrl, token, mappingHotelCode } = body;
    const url = `${gatewayUrl}/inv/v1/hotels/${mappingHotelCode}/inventoryStatistics?inventoryCode=HOUSE_LEVEL`;
    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-app-key': this.configService.get(ENVIRONMENT.OHIP_APP_KEY),
          'x-hotelid': mappingHotelCode
        }
      })
    );
    return response?.data;
  }
}
