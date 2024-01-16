import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MessageService, YamcsService } from '@yamcs/webapp-sdk';

@Component({
  templateUrl: './StartManualActivityPage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartManualActivityPage {

  form: UntypedFormGroup;

  constructor(
    title: Title,
    formBuilder: UntypedFormBuilder,
    readonly yamcs: YamcsService,
    private messageService: MessageService,
    private router: Router,
  ) {
    title.setTitle('Start Manual Activity');
    this.form = formBuilder.group({
      name: ['', [Validators.required]],
    });
  }

  onConfirm() {
    const formValue = this.form.value;
    this.yamcs.yamcsClient.startActivity(this.yamcs.instance!, {
      type: 'MANUAL',
      args: {
        name: formValue['name'],
      },
    }).then(() => this.router.navigateByUrl(`/activities?c=${this.yamcs.context}`))
      .catch(err => this.messageService.showError(err));
  }
}
