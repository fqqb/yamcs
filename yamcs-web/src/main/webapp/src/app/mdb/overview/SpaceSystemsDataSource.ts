import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject } from 'rxjs';
import { GetSpaceSystemsOptions, SpaceSystem } from '../../client';
import { YamcsService } from '../../core/services/YamcsService';

export class SpaceSystemsDataSource extends DataSource<SpaceSystem> {

  spaceSystems$ = new BehaviorSubject<SpaceSystem[]>([]);
  totalSize$ = new BehaviorSubject<number>(0);
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(private yamcs: YamcsService) {
    super();
  }

  connect() {
    return this.spaceSystems$;
  }

  loadSpaceSystems(options: GetSpaceSystemsOptions) {
    this.loading$.next(true);
    this.yamcs.getInstanceClient()!.getSpaceSystems(options).then(page => {
      this.loading$.next(false);
      this.totalSize$.next(page.totalSize);
      this.spaceSystems$.next(page.spaceSystems || []);
    });
  }

  disconnect() {
    this.spaceSystems$.complete();
    this.totalSize$.complete();
    this.loading$.complete();
  }
}
