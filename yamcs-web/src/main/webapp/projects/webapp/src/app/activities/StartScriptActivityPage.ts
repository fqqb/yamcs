import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MessageService, SelectOption, StartActivityOptions, YamcsService } from '@yamcs/webapp-sdk';
import { BehaviorSubject } from 'rxjs';

@Component({
  templateUrl: './StartScriptActivityPage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartScriptActivityPage {

  form: UntypedFormGroup;

  scriptOptions$ = new BehaviorSubject<SelectOption[]>([]);

  constructor(
    title: Title,
    formBuilder: UntypedFormBuilder,
    readonly yamcs: YamcsService,
    private messageService: MessageService,
    private router: Router,
  ) {
    title.setTitle('Start script activity');
    this.form = formBuilder.group({
      script: ['', [Validators.required]],
      args: [''],
    });

    yamcs.yamcsClient.getActivityScripts(this.yamcs.instance!)
      .then(page => {
        for (const script of page.scripts) {
          this.scriptOptions$.next([
            ...this.scriptOptions$.value,
            { id: script, label: script },
          ]);
        }
      })
      .catch(err => messageService.showError(err));
  }

  onConfirm() {
    const formValue = this.form.value;
    const options: StartActivityOptions = {
      type: 'SCRIPT',
      args: {
        script: formValue['script'],
      },
    };
    if (formValue['args']) {
      options.args['args'] = formValue['args'];
    }

    this.yamcs.yamcsClient.startActivity(this.yamcs.instance!, {
      type: 'SCRIPT',
      args: {
        script: formValue['script'],
        args: formValue['args'],
      },
    }).then(() => this.router.navigateByUrl(`/activities?c=${this.yamcs.context}`))
      .catch(err => this.messageService.showError(err));
  }
}
