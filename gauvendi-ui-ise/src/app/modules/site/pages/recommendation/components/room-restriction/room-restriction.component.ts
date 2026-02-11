import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  HotelRestrictionCodeEnum,
  RfcRestriction
} from '@app/core/graphql/generated/graphql';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { DisplayRestrictionPipe } from '../../pipes/display-restriction.pipe';
import { DisplayLstRestrictionPipe } from '@app/modules/site/pages/recommendation/pipes/display-lst-restriction.pipe';

@Component({
  selector: 'app-room-restriction',
  template: `
    <div class="line-clamp-2 text-primary-color">
      <ng-container *ngIf="restriction?.length > 0">
        <ng-container *ngFor="let item of restriction">
          <ng-container [ngSwitch]="item?.code">
            <ng-container
              *ngSwitchCase="HotelRestrictionCodeEnum.RstrAvailablePeriod"
            >
              <div>
                {{ 'RESTRICTION_AVAILABLE_FROM' | translate | async }} <br />
                {{ item?.fromDate | date: 'dd/MM/yyyy' }}
                {{ 'TO' | translate | async }}
                {{ item?.toDate | date: 'dd/MM/yyyy' }}
              </div>
            </ng-container>
            <ng-container *ngSwitchCase="HotelRestrictionCodeEnum.RstrLosMin">
              <div>
                {{ 'RESTRICTION_LENGTH_OF_STAY' | translate | async }}
                {{ +item?.value | displayRestriction | async }}
              </div>
            </ng-container>
            <ng-container
              *ngSwitchCase="HotelRestrictionCodeEnum.RstrCloseToArrival"
            >
              <div>
                {{ 'RESTRICTION_CLOSE_TO_ARRIVAL' | translate | async }}
              </div>
            </ng-container>
            <ng-container
              *ngSwitchCase="HotelRestrictionCodeEnum.RstrCloseToDeparture"
            >
              <div>
                {{ 'RESTRICTION_CLOSE_TO_DEPARTURE' | translate | async }}
              </div>
            </ng-container>
            <ng-container
              *ngSwitchCase="HotelRestrictionCodeEnum.RstrMinLosThrough"
            >
              <div>
                {{
                  'RESTRICTION_LENGTH_OF_STAY_THROUGH'
                    | translate
                    | async
                    | displayLstRestriction: +item?.value?.split('-')[0]
                }}
              </div>
            </ng-container>
            <ng-container *ngSwitchCase="HotelRestrictionCodeEnum.RstrLosMax">
              <div>
                {{ 'RESTRICTION_MAX_LENGTH_OF_STAY' | translate | async }}
                {{ +item?.value | displayRestriction | async }}
              </div>
            </ng-container>
          </ng-container>
        </ng-container>
      </ng-container>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DisplayRestrictionPipe,
    DisplayLstRestrictionPipe
  ]
})
export class RoomRestrictionComponent {
  @Input({ required: true }) restriction: RfcRestriction[];
  HotelRestrictionCodeEnum = HotelRestrictionCodeEnum;
}
