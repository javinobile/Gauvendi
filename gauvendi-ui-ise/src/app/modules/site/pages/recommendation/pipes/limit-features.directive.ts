import { AfterViewInit, ChangeDetectorRef, Directive, ElementRef } from "@angular/core";
import { FeatureIncludedComponent } from "../components/feature-included/feature-included.component";

@Directive({
  selector: "[appLimitFeatures]",
  standalone: true,
})
export class LimitFeaturesDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef<HTMLElement>, private featureIncludedComponent: FeatureIncludedComponent, private cd: ChangeDetectorRef) {
  }

  ngAfterViewInit(): void {
    let count = 0;
    const navMoreEl = this.elementRef.nativeElement.querySelector(".more");
    const baseItems = this.elementRef.nativeElement.querySelectorAll(".featureItem");
    const clonedDiv = this.elementRef.nativeElement.cloneNode() as HTMLElement;
    this.elementRef.nativeElement.parentElement.appendChild(clonedDiv);
    clonedDiv.textContent = "";
    baseItems.forEach((item) => {
      clonedDiv.appendChild(item);
      clonedDiv.appendChild(navMoreEl);
      if (checkScrollBar(clonedDiv, "vertical")) {
        item.remove();
        count++;
      }
    });

    if (count) {
      this.featureIncludedComponent.increase(count)
    } else {
      navMoreEl.remove();
    }

    this.elementRef.nativeElement.appendChild(clonedDiv);
  }
}

function checkScrollBar(element, dir) {
  dir = dir === "vertical" ? "Height" : "Width";
  let hasScrollBar = element[`scroll${dir}`] - 3 > element[`client${dir}`];
  return hasScrollBar;
}
