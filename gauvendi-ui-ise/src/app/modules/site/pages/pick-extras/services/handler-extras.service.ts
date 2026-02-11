import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HandlerExtrasService {
  roomService(queryAllRoomService: string, idx: number): string[] {
    if (queryAllRoomService?.length > 0) {
      const paramsRoomServices: string[] = queryAllRoomService?.split('~');
      return paramsRoomServices[idx]?.split(',');
    }
    return [];
  }

  roomServiceAmount(service): string[] {
    return service?.length > 0 ? service?.split('-') : [];
  }

  generateChainAllRoomService(queryAllRoomService: string, currentRoomService: string[], idx: number): string {
    let paramsRoomServices: string[] = queryAllRoomService?.split('~');
    if (paramsRoomServices) {
      paramsRoomServices[idx] = currentRoomService.length && currentRoomService?.reduce((a, b) => a?.length ? (a + ',' + b) : b) || '';

    } else {
      paramsRoomServices = [];
      for (let i = 0; i < idx; i++) {
        paramsRoomServices.push('');
      }
      if (currentRoomService?.length > 0) {
        paramsRoomServices.push(currentRoomService?.reduce((a, b) => a?.length ? (a + ',' + b) : b));
      }
    }
    return paramsRoomServices.reduce((a, b) => (a + '~' + b));
  }
}
