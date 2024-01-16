import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-start-activity-wizard-step',
  templateUrl: './StartActivityWizardStep.html',
  styleUrls: ['./StartActivityWizardStep.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StartActivityWizardStep {

  @Input()
  step: string;
}
