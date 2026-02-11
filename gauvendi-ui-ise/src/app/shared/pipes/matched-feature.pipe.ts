import { Pipe, PipeTransform } from "@angular/core";
import { IFeature } from "@app/models/option-item.model";

@Pipe({
  name: "matchedFeature",
  standalone: true,
})
export class MatchedFeaturePipe implements PipeTransform {
  transform(arr: IFeature[], bool: boolean): unknown {
    return arr?.filter((i) => i.matched === bool);
  }
}
