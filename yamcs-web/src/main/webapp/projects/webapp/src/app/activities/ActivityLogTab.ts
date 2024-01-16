import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityLog, MessageService, YamcsService } from '@yamcs/webapp-sdk';
import { BehaviorSubject } from 'rxjs';

@Component({
  templateUrl: './ActivityLogTab.html',
  styleUrls: ['./ActivityLogTab.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTab {

  logs$ = new BehaviorSubject<ActivityLog[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    readonly yamcs: YamcsService,
    private messageService: MessageService,
  ) {
    const activityId = route.parent!.snapshot.paramMap.get('activityId')!;
    yamcs.yamcsClient.getActivityLog(yamcs.instance!, activityId).then(logs => {
      this.logs$.next(logs);
    }).catch(err => messageService.showError(err));
  }
}
