import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Instance, MissionDatabase } from '../../client';
import { YamcsService } from '../../core/services/YamcsService';

@Component({
    templateUrl: './ExportXtcePage.html',
    styleUrls: ['./ExportXtcePage.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportXtcePage {

    instance: Instance;
    form: FormGroup;
    mdb$: Promise<MissionDatabase>;

    downloadURL$ = new BehaviorSubject<string | null>(null);

    constructor(yamcs: YamcsService, title: Title, formBuilder: FormBuilder, private router: Router) {
        title.setTitle('Export XTCE');
        this.instance = yamcs.getInstance();
        this.form = formBuilder.group({
            'spaceSystem': new FormControl(null, [Validators.required]),
        });
        this.mdb$ = yamcs.getInstanceClient()!.getMissionDatabase();

        this.form.valueChanges.subscribe(value => {
            if (this.form.valid) {
                const url = yamcs.getInstanceClient()!.getXtceDownloadURL({
                    spaceSystem: value.spaceSystem,
                });
                this.downloadURL$.next(url);
            } else {
                this.downloadURL$.next(null);
            }
        });
    }

    goToOverview() {
        this.router.navigateByUrl(`/mdb?instance=${this.instance.name}`);
    }
}
