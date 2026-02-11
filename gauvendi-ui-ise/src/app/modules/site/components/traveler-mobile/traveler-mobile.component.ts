import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { BookingTransactionService } from '@app/services/booking-transaction.service';
import { TrackingService } from '@app/services/tracking.service';
import { DropdownChildrenAgeComponent } from '@app/shared/form-controls/dropdown-children-age/dropdown-children-age.component';
import { NumericStepComponent } from '@app/shared/form-controls/numeric-step/numeric-step.component';
import { CalculateAgePipe } from '@app/shared/pipes/calculate-age.pipe';
import { ParseFormGroupPipe } from '@app/shared/pipes/parse-form-group.pipe';
import { ReplaceStrPipe } from '@app/shared/pipes/replace-str.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MixpanelKeys } from '@constants/mixpanel.keys';
import { RouteKeyQueryParams } from '@constants/RouteKey';
import { environment } from '@environment/environment';
import { select, Store } from '@ngrx/store';
import {
  selectorChildrenAllowedConfig,
  selectorHotelChildPolicy
} from '@store/hotel/hotel.selectors';
import { Observable } from 'rxjs';
import { map, shareReplay, skipWhile } from 'rxjs/operators';

@Component({
  selector: 'app-traveler-mobile',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatIconModule,
    CalculateAgePipe,
    DropdownChildrenAgeComponent,
    NumericStepComponent,
    ParseFormGroupPipe,
    ReactiveFormsModule,
    ReplaceStrPipe
  ],
  templateUrl: './traveler-mobile.component.html',
  styleUrls: ['./traveler-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TravelerMobileComponent implements OnChanges {
  @Input() defaultPax: number;
  @Output() onBack = new EventEmitter();
  @ViewChild('scrollContainer', { static: false }) scrollContainer: ElementRef;

  childPolicy$: Observable<{
    maxChildrenCapacity: number;
    minChildrenAge: number;
    maxChildrenAge: number;
    content: string;
  }> = this.store.pipe(
    select(selectorHotelChildPolicy),
    map((value) => this._createChildrenPolicyObj(value))
  );

  isAllowedChildren$ = this.store.pipe(
    select(selectorChildrenAllowedConfig),
    skipWhile((data) => !data),
    map((data) => data === 'true'),
    shareReplay()
  );

  rfNumberOfRoom: FormArray = this.fb.array([]);
  maxAdultInRoom = environment.defaultMaxAdultInRoom;
  minChildrenAge = 0;
  maxChildrenAge: number;
  isIOS = /iPhone|iPod|iPad/.test(navigator.userAgent);

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private bookingTransactionService: BookingTransactionService,
    private route: ActivatedRoute,
    private trackingService: TrackingService
  ) {}

  private _createChildrenPolicyObj(value: any): any {
    const childrenPolicy = {
      maxChildrenCapacity: value?.maxChildrenCapacity
        ? value?.maxChildrenCapacity
        : 5,
      minChildrenAge: value?.minChildrenAge ? value?.minChildrenAge : 0,
      maxChildrenAge: value?.maxChildrenAge ? value?.maxChildrenAge : 17,
      content: value?.content
        ? value?.content?.replace(' \n', '\n')?.replace('\n ', '\n')
        : ''
    };
    this.minChildrenAge = childrenPolicy?.minChildrenAge;
    this.maxChildrenAge = childrenPolicy?.maxChildrenAge;
    return childrenPolicy;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('defaultPax')) {
      const numberOfRoom =
        this.bookingTransactionService.travelerSelected$?.value;
      if (!numberOfRoom) {
        this.addRoom(this.defaultPax || 1);
      } else {
        const listRoom: string[] = numberOfRoom?.toString()?.split(',');
        listRoom.forEach((x) => {
          const person: string[] = x.split('-');

          const adult = person.shift();
          // const childrenAge = person
          //   .filter(item => !isNaN(parseInt(item, 10)))
          //   .map(item => parseInt(item, 10));
          // accept null
          const childrenAge = person.map((item) => JSON.parse(item));

          if (Boolean(+adult)) {
            this.addRoom(
              (+adult <= 10 && +adult) || 10,
              person.length,
              childrenAge
            );
          }
        });
      }
    }
  }

  addRoom(adult: number = 1, children: number = 0, childrenAge: number[] = []) {
    // @ts-ignore
    this.rfNumberOfRoom.push(
      this.fb.group({
        adult: this.fb.control(adult),
        children: this.fb.control(children),
        childrenAge: this.fb.array(childrenAge)
      })
    );
    this.updateRouteQueryParams();

    setTimeout(() => {
      this.scrollToBottom();
    }, 300);
  }

  updateRouteQueryParams(): void {
    // @ts-ignore
    const formValue: {
      adult: number;
      children: number;
      childrenAge: string[];
    }[] = this.rfNumberOfRoom.value;
    let result = '';

    formValue.forEach((x) => {
      const childrenAge: string = x.childrenAge.reduce(
        (a, b) => a + '-' + b,
        ''
      );
      result += Boolean(childrenAge)
        ? `${x.adult}${childrenAge},`
        : `${x.adult},`;
    });

    this.bookingTransactionService.travelerSelected$.next(result.slice(0, -1));
  }

  updateChildInRoom(type: string, item: FormArray | any) {
    type === 'add'
      ? item.push(this.fb.control(this.minChildrenAge, Validators.required))
      : item.removeAt(item?.controls?.length - 1);
    this.updateRouteQueryParams();
  }

  scrollToBottom(): void {
    this.scrollContainer?.nativeElement?.scrollTo({
      top: this.scrollContainer?.nativeElement?.scrollHeight,
      behavior: 'smooth'
    });
  }

  onApply(): void {
    this.onTrack();
    this.onBack.emit();
  }

  onBackClick(): void {
    this.bookingTransactionService.travelerSelected$.next(
      this.route.snapshot.queryParams[RouteKeyQueryParams.numberOfRoom]
    );
    this.onBack.emit();
  }

  removeRoom(i: number): void {
    this.rfNumberOfRoom.removeAt(i);
    this.updateRouteQueryParams();
  }

  onTrack(): void {
    const currentTraveler =
      this.bookingTransactionService.travelerSelected$?.value;
    if (currentTraveler) {
      const rooms =
        this.route.snapshot.queryParams[RouteKeyQueryParams.numberOfRoom];
      const roomListChange = this.getRoomList(currentTraveler);
      const currentRoomList = this.getRoomList(rooms);

      this.trackingService.track(MixpanelKeys.SelectTraveler, {
        name: 'Bedrooms & Travelers',
        room_list_origin: currentRoomList
          ? currentRoomList?.map((x) => {
              return {
                adult: x?.adult,
                children_age_list: x?.childrenAgeList?.join(',')
              };
            })
          : null,
        number_of_room_origin: currentRoomList?.length,
        room_list_change: roomListChange
          ? roomListChange?.map((x) => {
              return {
                adult: x?.adult,
                children_age_list: x?.childrenAgeList?.join(',')
              };
            })
          : null,
        number_of_rooms_change: roomListChange?.length
      });
    }
  }

  getRoomList(
    traveler: string
  ): { adult: number; childrenAgeList: number[] }[] {
    return traveler
      ?.toString()
      ?.split(',')
      ?.map((item) => {
        const person: string[] = item.split('-');
        return {
          adult: +person.shift(),
          childrenAgeList: person.map((x) => +x)
        };
      });
  }
}
