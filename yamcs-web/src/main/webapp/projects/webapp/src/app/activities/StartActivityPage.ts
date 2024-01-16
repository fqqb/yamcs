import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { YamcsService } from '@yamcs/webapp-sdk';

@Component({
  templateUrl: './StartActivityPage.html',
  styleUrls: ['./StartActivityPage.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartActivityPage {

  constructor(
    title: Title,
    readonly yamcs: YamcsService,
  ) {
    title.setTitle('Start an activity');
  }
}
