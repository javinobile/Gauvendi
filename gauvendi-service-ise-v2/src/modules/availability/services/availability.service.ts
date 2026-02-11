import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { ENVIRONMENT } from 'src/core/constants/environment.const';
import { RoomAvailabilityDto } from '../../booking/dtos/request-booking.dto';
import {
  GetRelatedMrfcDto,
  GetRelatedMrfcResponseDto,
  GetRoomProductMappingPmsDto,
  ProcessRoomUnitAvailabilityUpdateDto,
  RoomProduct,
  RoomProductCheckAvailabilityDto,
  RoomProductReleaseAvailabilityDto
} from '../dtos/room-availability.dto';
import { ClientProxy } from '@nestjs/microservices';
import { PLATFORM_SERVICE } from 'src/core/clients/platform-client.module';
import { BadRequestException } from 'src/core/exceptions';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(PLATFORM_SERVICE) private readonly platformClient: ClientProxy
  ) {}

  async roomProductCheckAvailability(body: RoomProductCheckAvailabilityDto) {
    try {
      const availabilityResponse: RoomProduct[] = await lastValueFrom(
        this.platformClient.send({ cmd: 'room_product_check_availability' }, body)
      ).then((res) => res);

      const data: RoomAvailabilityDto[] = (availabilityResponse ?? []).map((response) => ({
        roomProductId: response.id,
        roomProductName: response.name,
        roomProductCode: response.code,
        isErfcDeduct: response.rfcAllocationSetting === 'DEDUCT',
        roomIds: response.roomProductAssignedUnits.map((unit) => unit.roomUnitId),
        roomIdsGroup: response.roomProductAssignedUnits.map((unit) => ({
          id: unit.roomUnitId,
          roomAvailabilityList: (
            unit.roomUnit.roomUnitAvailabilities.map((availability) => ({
              ...availability,
              totalAmount: Number(unit.totalAmount),
              date: availability.date,
              status: availability.status
            })) as any[]
          )?.sort((a, b) => a.totalAmount - b.totalAmount)
        }))
      }));

      return data;
    } catch (error) {
      throw new BadRequestException(error?.response?.data?.message || error?.message);
    }
  }

  async roomProductCheckAvailabilityProposal(body: RoomProductCheckAvailabilityDto) {
    try {
      const availabilityResponse: RoomProduct[] = await lastValueFrom(
        this.platformClient.send({ cmd: 'room_product_check_availability_proposal' }, body)
      ).then((res) => res);

      const data: RoomAvailabilityDto[] = (availabilityResponse ?? []).map((response) => ({
        roomProductId: response.id,
        roomProductName: response.name,
        roomProductCode: response.code,
        isErfcDeduct: response.rfcAllocationSetting === 'DEDUCT',
        roomIds: response.roomProductAssignedUnits.map((unit) => unit.roomUnitId),
        roomIdsGroup: response.roomProductAssignedUnits.map((unit) => ({
          id: unit.roomUnitId,
          roomAvailabilityList: (
            unit.roomUnit.roomUnitAvailabilities.map((availability) => ({
              ...availability,
              totalAmount: Number(unit.totalAmount),
              date: availability.date,
              status: availability.status
            })) as any[]
          )?.sort((a, b) => a.totalAmount - b.totalAmount)
        }))
      }));

      return data;
    } catch (error) {
      throw new BadRequestException(error?.response?.data?.message || error?.message);
    }
  }

  async processUnitAvailabilityUpdate(body: ProcessRoomUnitAvailabilityUpdateDto) {
    try {
      const response = await lastValueFrom(
        this.platformClient.send({ cmd: 'process_room_unit_availability_update' }, body)
      ).then((res) => res);

      return response;
    } catch (error) {
      throw new BadRequestException('Error processing room unit availability update', error);
    }
  }

  async processRoomProductReleaseAvailability(body: RoomProductReleaseAvailabilityDto) {
    try {
      const response = await lastValueFrom(
        this.platformClient.send({ cmd: 'room_product_release_availability' }, body)
      ).then((res) => res);

      return response;
    } catch (error) {
      const err = error.response?.data;
      throw new BadRequestException('Error processing room product release availability', err);
    }
  }

  async getRoomProductMappingPms(body: GetRoomProductMappingPmsDto) {
    try {
      const response = await lastValueFrom(
        this.platformClient.send({ cmd: 'get_room_product_mapping_pms' }, body)
      ).then((res) => res);

      return response;
    } catch (error) {
      throw new BadRequestException('Error getting room product mapping pms', error);
    }
  }

  async getRelatedMrfc(body: GetRelatedMrfcDto): Promise<GetRelatedMrfcResponseDto[]> {
    try {
      const params = {
        hotelId: body.hotelId,
        roomProductIds: body.roomProductIds || []
      };
      const response = await lastValueFrom(
        this.platformClient.send({ cmd: 'get_related_mrfc' }, params)
      ).then((res) => res);
      return response;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting related mrfc: ${JSON.stringify(err)}`);
      return [];
    }
  }

  async getLowestPriceRoom(body: any): Promise<any[]> {
    try {
      const params = {
        hotelId: body.hotelId,
        roomProductIds: body.roomProductIds || []
      };
      const response = await lastValueFrom(
        this.platformClient.send({ cmd: 'get_related_mrfc' }, params)
      ).then((res) => res);
      return response;
    } catch (error) {
      const err = error.response?.data;
      this.logger.error(`Error getting related mrfc: ${JSON.stringify(err)}`);
      return [];
    }
  }
}
