import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  TemplateRef
} from '@angular/core';
import { MEASURE_METRIC_KEY } from '@app/constants/localStorage.const';
import { SpaceTypeCategoryCode } from '@app/constants/space-type.const';
import { AbstractSpaceTypeComponent } from '@app/modules/site/components/abstracts/abstract-space-type.component';
import { ISPTFeature } from '@app/modules/site/components/abstracts/interfaces/abstract-space-type.interface';
import { HotelConfigService } from '@app/services/hotel-config.service';
import { CustomTooltipModule } from '@app/shared/directives/custom-tooltip/custom-tooltip.module';
import { GetSpaceTypeUrlPipe } from '@app/shared/pipes/get-space-type-url.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  IOptionUnitsInfo,
  IUnitConfigItem
} from './interfaces/option-units-info.interface';
@Component({
  selector: 'app-option-units-info',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CustomTooltipModule],
  templateUrl: './option-units-info.component.html',
  styleUrls: ['./option-units-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptionUnitsInfoComponent extends AbstractSpaceTypeComponent {
  showText = input<boolean>(true);
  full = input<boolean>(false);
  noFeatures = input<boolean>(false);
  item = input.required<IOptionUnitsInfo>();
  showSpace = input<boolean>(true);
  customClass = input<string>('');
  textClass = input<string>('text-12 font-normal');
  iconClass = input<string>('w-[15px] h-[15px]');
  showTotalRoom = input<boolean>(false);
  prefixTemplate = input<TemplateRef<any>>();

  measureMetrics = localStorage.getItem(MEASURE_METRIC_KEY) || 'sqm';
  colorText$ = this.hotelConfigService.colorText$;

  data = computed(() => this.setData());

  constructor(private hotelConfigService: HotelConfigService) {
    super();
  }

  override setSpaceTypeFeatures(): ISPTFeature[] {
    const features = this.item()?.features;
    if (!features?.length) return [];

    return features
      .filter(
        (feature) =>
          feature.metadata.hotelRetailCategory?.code ===
            SpaceTypeCategoryCode ||
          feature.metadata.code.startsWith(`${SpaceTypeCategoryCode}_`)
      )
      .map((item) => ({
        name: item.name,
        code: item.metadata.code,
        measurementUnit: item.metadata.measurementUnit
      }));
  }

  setData(): IUnitConfigItem[] {
    const item = this.item();
    if (!item) return [];

    const allowShowMoreInfo = !this.noFeatures() && this.full();
    const measurementUnit =
      item.measurementUnit ||
      this.spaceTypeFeatures()?.[0]?.measurementUnit ||
      'UNIT';
    return [
      ...(this.showTotalRoom()
        ? [
            {
              icon: 'assets/icons/key.svg',
              label: 'UNIT',
              pluralLabel: 'UNITS',
              value: item.totalRoom,
              isPluralLabel: item.totalRoom > 1
            }
          ]
        : []),
      {
        icon: 'assets/icons/adults.svg',
        label: 'ADULT',
        pluralLabel: 'ADULTS',
        value: item.adults,
        isPluralLabel: item.adults > 1
      },
      {
        icon: 'assets/icons/kid.svg',
        label: 'CHILD',
        pluralLabel: 'CHILDREN',
        value: item.children,
        isPluralLabel: item.children > 1
      },
      {
        icon: 'assets/icons/pet.svg',
        label: 'PET',
        pluralLabel: 'PETS',
        value: item.pets,
        isPluralLabel: item.pets > 1
      },
      {
        label: measurementUnit,
        pluralLabel: measurementUnit,
        icon: new GetSpaceTypeUrlPipe().transform(
          item.featureCode || this.spaceTypeFeatures()?.[0]?.code
        ),
        value: allowShowMoreInfo ? item.bedRooms : 0,
        isPluralLabel: item.bedRooms > 1
      },
      {
        label: 'EXTRA_BED',
        pluralLabel: 'EXTRA_BEDS',
        icon: 'assets/icons/extra-bed.svg',
        value: allowShowMoreInfo ? item.extraBeds : 0,
        isPluralLabel: item.extraBeds > 1
      },
      {
        label: '',
        pluralLabel: '',
        toolTipMsg: 'ROOM_SPACE',
        icon: 'assets/icons/space.svg',
        value: allowShowMoreInfo && this.showSpace() ? item?.roomSpace : 0,
        isPluralLabel: false,
        isUsingMeasureMetrics: true
      }
    ];
  }
}
