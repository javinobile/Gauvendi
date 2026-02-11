import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {delay, first, fromEvent} from "rxjs";

@Component({
  selector: 'app-image-custom',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-custom.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageCustomComponent implements AfterViewInit{
  @Input({required: true}) src: string;
  @Input() customClass: string;
  @Input() ngClass: any;
  @Input() alt: string;
  @ViewChild('image') image: ElementRef;
  loaded: boolean;
  constructor(private cd: ChangeDetectorRef) {
  }

  ngAfterViewInit() {
    if (this.image) {
      fromEvent(this.image.nativeElement, 'load')
        .pipe(first())
        .subscribe(() => {
          this.loaded = true;
          this.cd.detectChanges();
        })
    }
  }
}
