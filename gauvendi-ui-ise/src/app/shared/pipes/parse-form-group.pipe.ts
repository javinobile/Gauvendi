import {Pipe, PipeTransform} from '@angular/core';
import {FormGroup} from "@angular/forms";

@Pipe({
  name: 'parseFormGroup',
  standalone: true
})
export class ParseFormGroupPipe implements PipeTransform {

  transform(value: any): FormGroup {
    return value as FormGroup;
  }

}
