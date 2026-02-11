import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {FilterSvgDirective} from "@app/shared/directives/filter-svg.directive";

@Component({
  selector: 'app-image-hovering',
  standalone: true,
  imports: [
    FilterSvgDirective
  ],
  templateUrl: './image-hovering.component.html',
  styleUrl: './image-hovering.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageHoveringComponent {
  @Input({required: true}) src: string;
  @Input({required: true}) color: string;
  @Input({required: true}) colorHovering: string;
  @Input({required: true}) defaultClass: string;
  @Input({required: true}) hoveringClass: string;
}
