import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '@environment/environment';

export const MaintenanceGuard: CanActivateFn = async () => {
  const isMaintenance: boolean = !!environment.isMaintenance;
  return isMaintenance ? await inject(Router).navigate(['maintenance']) : true;
};
