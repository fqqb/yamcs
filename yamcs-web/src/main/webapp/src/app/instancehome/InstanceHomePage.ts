import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AlarmsDataSource } from '../alarms/AlarmsDataSource';
import { Instance, TmStatistics } from '../client';
import { AuthService } from '../core/services/AuthService';
import { ConfigService, WebsiteConfig } from '../core/services/ConfigService';
import { YamcsService } from '../core/services/YamcsService';
import { User } from '../shared/User';

@Component({
  templateUrl: './InstanceHomePage.html',
  styleUrls: ['./InstanceHomePage.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceHomePage implements OnDestroy {

  instance: Instance;

  private user: User;
  config: WebsiteConfig;

  tmstats$ = new BehaviorSubject<TmStatistics[]>([]);
  tmstatsSubscription: Subscription;

  alarmsDataSource: AlarmsDataSource;

  constructor(
    yamcs: YamcsService,
    private authService: AuthService,
    title: Title,
    configService: ConfigService,
  ) {
    this.config = configService.getConfig();

    const processor = yamcs.getProcessor();
    this.instance = yamcs.getInstance();
    this.user = authService.getUser()!;
    title.setTitle(this.instance.name);
    yamcs.getInstanceClient()!.getProcessorStatistics().then(response => {
      response.statistics$.pipe(
        filter(stats => stats.processor === processor.name),
        map(stats => stats.tmstats || []),
      ).subscribe(tmstats => {
        this.tmstats$.next(tmstats);
      });
    });

    this.alarmsDataSource = new AlarmsDataSource(yamcs);
    this.alarmsDataSource.loadAlarms('realtime');
  }

  showAlarms() {
    return this.user.hasSystemPrivilege('ReadAlarms');
  }

  showPackets() {
    return this.user.hasAnyObjectPrivilegeOfType('ReadPacket');
  }

  ngOnDestroy() {
    if (this.tmstatsSubscription) {
      this.tmstatsSubscription.unsubscribe();
    }
    if (this.alarmsDataSource) {
      this.alarmsDataSource.disconnect();
    }
  }
}
