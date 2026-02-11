import { Pipe, PipeTransform } from "@angular/core";
import { DeviceType, EDeviceType } from "@app/models/device.model";

@Pipe({
  name: "combinationOptionCarouselItemStyle",
  standalone: true,
})
export class CombinationOptionCarouselItemStylePipe implements PipeTransform {
  WIDTH_ACTIVE = 872;
  HEIGHT_ACTIVE = 300;
  WIDTH_DEFAULT = 320;
  HEIGHT_DEFAULT = 230;

  transform(activeIndex: number, index: number, length: number, device: DeviceType = EDeviceType.Desktop, dir: "ltr" | "rtl" = 'ltr'): unknown {
    if (device === EDeviceType.Mobile) {
      this.WIDTH_ACTIVE = 180;
      this.HEIGHT_ACTIVE = 160;
      this.WIDTH_DEFAULT = 160;
      this.HEIGHT_DEFAULT = 140;
      // }
    }

    if (device === EDeviceType.Tablet) {
      this.HEIGHT_ACTIVE = 200;
      // this.WIDTH_DEFAULT = 300;
      this.WIDTH_DEFAULT = 160 + (5 - length) * 80;
      this.HEIGHT_DEFAULT = 170;
      // this.WIDTH_ACTIVE = length <= 2 ? 450 : 400;
      this.WIDTH_ACTIVE = 180 + (5 - length) * 110;
    }

    const baseStyle = {
      zIndex: this.getZindex(activeIndex, index, length),
      height: this.getHeight(activeIndex, index, length, device),
      width: activeIndex === index ? `${this.WIDTH_ACTIVE}px` : `${this.WIDTH_DEFAULT}px`,
    };
    if (dir === "rtl") {
      return { ...baseStyle, left: this.getRight(activeIndex, index, length, device) };
    }
    return { ...baseStyle, right: this.getRight(activeIndex, index, length, device) };
  }

  getHeight(activeIndex: number, index: number, length: number, device: DeviceType) {
    if (device === EDeviceType.Desktop) {
      return activeIndex === index ? `${this.HEIGHT_ACTIVE}px` : `${this.HEIGHT_ACTIVE - 32 * Math.abs(activeIndex - index)}px`;
    }
    return activeIndex === index ? `${this.HEIGHT_ACTIVE}px` : `${this.HEIGHT_DEFAULT}px`;
  }

  getRight(activeIndex: number, index: number, length: number, device: DeviceType) {
    // SPACING
    let SPACING = 60 - Math.abs(activeIndex - index) * 2;
    if (device === EDeviceType.Mobile) {
      SPACING = 57;
    }
    if (device === EDeviceType.Tablet) {
      SPACING = 100 + (5 - length) * 48;
    }

    if (activeIndex >= length / 2 && index === activeIndex) {
      return `calc(${SPACING}px * ${length - 1 - activeIndex} + ${this.WIDTH_ACTIVE / 2}px)`;
    }
    if (index > activeIndex) {
      return `calc(${SPACING}px * ${length - 1 - index})`;
    }
    return `calc(100% - ${SPACING}px * ${index} - ${index !== activeIndex ? `${this.WIDTH_DEFAULT}px` : `${this.WIDTH_ACTIVE / 2}px`})`;
  }

  getZindex(activeIndex: number, index: number, length: number) {
    if (index === activeIndex) {
      return 20;
    }
    if (index > activeIndex) {
      return 10 + (length - index);
    }
    return 10 + index;
  }
}
