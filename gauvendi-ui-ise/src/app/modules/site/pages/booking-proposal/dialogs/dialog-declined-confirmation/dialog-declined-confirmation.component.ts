import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SectionCodeEnum } from '@store/multi-lang/multi-lang.state';
import { PaymentService } from '@app/apis/payment.service';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-declined-confirmation',
  template: `
    <div class='bg-popover-background-color'>
      <div class='p-[24px]'>
        <div class='text-[17px] font-semibold leading-[140%] text-primary-color'>
          <span>{{'DECLINE_BOOKING' | translate | async}}</span>
        </div>
      </div>
      <div class='border border-b-border-color'></div>
      <div class='px-[24px] pb-[24px]'>
        <div class='text-[14px] font-normal leading-[140%] text-primary-color my-[12px]'>
          {{'MESSAGE_DECLINED_CONFIRMATION' | translate | async}}
        </div>
        <div class='flex items-center justify-between gap-[24px]'>
          <button
            class='h-[44px] flex-1 px-[24px] border border-button-fill text-button-fill rounded-[16px] text-[14px] font-medium leading-[140%] hover:!text-button-normal-color hover:!bg-button-normal-background-color'
            type='button'
            mat-dialog-close
          >
            {{'CANCEL' | translate | async}}
          </button>
          <button
            class='h-[44px] flex-1 px-[24px] text-button-normal-color bg-button-normal-background-color rounded-[16px] text-[14px] font-medium leading-[140%] hover:opacity-80'
            [disabled]='isLockSubmit$ | async'
            (click)='confirm()'
          >
            {{'DECLINE' | translate | async}}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./dialog-declined-confirmation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslatePipe,
    MatIconModule,
    MatDialogModule,
    CommonModule,
  ],
  standalone: true,
})
export class DialogDeclinedConfirmationComponent {

  isLockSubmit$ = new BehaviorSubject(false);

  constructor(
    private dialogRef: MatDialogRef<DialogDeclinedConfirmationComponent>,
    private paymentService: PaymentService,
    @Inject(MAT_DIALOG_DATA) public data: {
      bookingId: string,
      bookerEmail: string
    },
  ) {
  }

  confirm(): void {
    this.isLockSubmit$.next(true);
    this.paymentService.declineProposalBooking({
      input: {
        bookingId: this.data?.bookingId,
        cancelledBy: this.data?.bookerEmail,
      },
    }).pipe(
      finalize(() => this.isLockSubmit$.next(false)),
    ).subscribe({
      next: res => {
        if (res?.status === 'SUCCESS') {
          this.dialogRef.close('SUCCESS');
        } else {
          this.dialogRef.close('FAIL');
        }
      },
      error: () => this.dialogRef.close('FAIL')
    });
  }
}
