import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {AsyncPipe, NgIf} from "@angular/common";
import {FormErrorComponent} from "@app/shared/form-controls/form-error/form-error.component";
import {InputTextareaComponent} from "@app/shared/form-controls/input-textarea/input-textarea.component";
import {TranslatePipe} from "@app/shared/pipes/translate.pipe";

@Component({
  selector: 'app-booking-notes',
  standalone: true,
  imports: [
    AsyncPipe,
    FormErrorComponent,
    InputTextareaComponent,
    NgIf,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './booking-notes.component.html',
  styleUrl: './booking-notes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingNotesComponent implements OnChanges {
  @Input() bookingNotes: string;
  @Input() needValidation: boolean;

  bookingNotesCtl = new FormControl(null, Validators.maxLength(250));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('bookingNotes') && this.bookingNotes) {
      this.bookingNotesCtl.patchValue(this.bookingNotes);
    }

    if (changes.hasOwnProperty('needValidation') && this.needValidation) {
      this.bookingNotesCtl.markAllAsTouched();
      this.bookingNotesCtl.updateValueAndValidity();
    }
  }
}
