import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Activity, MessageService, YamcsService } from '@yamcs/webapp-sdk';
import { BehaviorSubject } from 'rxjs';

@Component({
  templateUrl: './ActivityPage.html',
  styleUrls: ['./ActivityPage.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage {

  activity$ = new BehaviorSubject<Activity | null>(null);

  constructor(
    route: ActivatedRoute,
    readonly yamcs: YamcsService,
    messageService: MessageService,
  ) {
    const id = route.snapshot.paramMap.get('activityId')!;
    yamcs.yamcsClient.getActivity(yamcs.instance!, id).then(activity => {
      console.log('received', activity);
      this.activity$.next(activity);
    }).catch(err => messageService.showError(err));
  }
}
