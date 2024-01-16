import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/SharedModule';
import { ActivitiesRoutingModule, routingComponents } from './ActivitiesRoutingModule';
import { ActivityDuration } from './ActivityDuration';
import { ActivityStatus } from './ActivityStatus';
import { SetFailedDialog } from './SetFailedDialog';
import { StartActivityWizardStep } from './StartActivityWizardStep';

@NgModule({
  imports: [
    SharedModule,
    ActivitiesRoutingModule,
  ],
  declarations: [
    routingComponents,
    ActivityDuration,
    ActivityStatus,
    SetFailedDialog,
    StartActivityWizardStep,
  ],
})
export class ActivitiesModule {
}
