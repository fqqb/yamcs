import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Instance, MissionDatabase } from '../../client';
import { YamcsService } from '../../core/services/YamcsService';

@Component({
  templateUrl: './OverviewPage.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewPage {

  mdb$: Promise<MissionDatabase>;

  instance: Instance;

  constructor(
    yamcs: YamcsService,
    title: Title,
  ) {
    title.setTitle('Mission Database');
    this.instance = yamcs.getInstance();
    this.mdb$ = yamcs.getInstanceClient()!.getMissionDatabase();
  }
}
