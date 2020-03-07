import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alarm, AlarmSeverity } from '../client';
import { YamcsService } from '../core/services/YamcsService';

export class AlarmsDataSource extends DataSource<Alarm> {

  alarms$ = new BehaviorSubject<Alarm[]>([]);
  filteredAlarms$ = new BehaviorSubject<Alarm[]>([]);

  unacknowledgedAlarms$: Observable<Alarm[]>;
  acknowledgedAlarms$: Observable<Alarm[]>;
  shelvedAlarms$: Observable<Alarm[]>;

  loading$ = new BehaviorSubject<boolean>(false);

  alarmSubscription: Subscription;

  private alarmsByName: { [key: string]: Alarm; } = {};

  private filter: string | null = null;

  constructor(private yamcs: YamcsService) {
    super();
    this.unacknowledgedAlarms$ = this.alarms$.pipe(
      map(alarms => {
        return alarms.filter(alarm => !alarm.shelveInfo && !alarm.acknowledged);
      }),
    );
    this.acknowledgedAlarms$ = this.alarms$.pipe(
      map(alarms => {
        return alarms.filter(alarm => !alarm.shelveInfo && alarm.acknowledged);
      }),
    );
    this.shelvedAlarms$ = this.alarms$.pipe(
      map(alarms => {
        return alarms.filter(alarm => !!alarm.shelveInfo);
      }),
    );
  }

  connect() {
    return this.filteredAlarms$;
  }

  setFilter(filter: string | null) {
    this.filter = filter || null;
  }

  loadAlarms(processorName: string) {
    this.loading$.next(true);
    this.yamcs.yamcsClient.getActiveAlarms(this.yamcs.getInstance().name, processorName)
      .then(alarms => {
        this.loading$.next(false);
        for (const alarm of alarms) {
          this.processAlarm(alarm);
        }
        this.updateSubject();
      });

    this.yamcs.getInstanceClient()!.getAlarmUpdates().then(response => {
      this.alarmSubscription = response.alarm$.subscribe(alarm => {
        this.processAlarm(alarm);
        this.updateSubject();
      });
    });
  }

  private updateSubject() {
    const alarms = Object.values(this.alarmsByName).sort((a1, a2) => {
      let rc = a1.acknowledged === a2.acknowledged ? 0 : a1.acknowledged ? 1 : -1;
      if (rc === 0) {
        const m1 = this.getNumericSeverity(a1.severity);
        const m2 = this.getNumericSeverity(a2.severity);
        rc = (m1 === m2) ? 0 : (m1 < m2) ? 1 : -1;
      }
      if (rc === 0) {
        const id1 = a1.id.namespace + '/' + a1.id.name;
        const id2 = a2.id.namespace + '/' + a2.id.name;
        rc = id1.localeCompare(id2);
      }
      return rc;
    });

    const allAlarms = [...alarms];

    this.alarms$.next(allAlarms);

    if (this.filter) {
      const filteredAlarms = allAlarms.filter(alarm => {
        const fullName = alarm.id.namespace + '/' + alarm.id.name;
        return fullName.toLowerCase().indexOf(this.filter!) !== -1;
      });
      this.filteredAlarms$.next(filteredAlarms);
    } else {
      this.filteredAlarms$.next(allAlarms);
    }
  }

  private getNumericSeverity(severity: AlarmSeverity) {
    switch (severity) {
      case 'WATCH': return 0;
      case 'WARNING': return 1;
      case 'DISTRESS': return 2;
      case 'CRITICAL': return 3;
      case 'SEVERE': return 4;
      default: return 5;
    }
  }

  disconnect() {
    this.alarms$.complete();
    this.filteredAlarms$.complete();
    this.loading$.complete();
    if (this.alarmSubscription) {
      this.alarmSubscription.unsubscribe();
    }
  }

  isEmpty() {
    return !this.filteredAlarms$.getValue().length;
  }

  private processAlarm(alarm: Alarm) {
    const alarmId = alarm.id.namespace + '/' + alarm.id.name;
    if (alarm.processOK && !alarm.triggered && alarm.acknowledged) {
      delete this.alarmsByName[alarmId];
    } else {
      this.alarmsByName[alarmId] = alarm;
    }
  }
}
