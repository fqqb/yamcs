import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { attachContextGuardFn } from '../core/guards/AttachContextGuard';
import { authGuardChildFn, authGuardFn } from '../core/guards/AuthGuard';
import { InstancePage } from '../shared/template/InstancePage';
import { ActivitiesPage } from './ActivitiesPage';
import { ActivityLogTab } from './ActivityLogTab';
import { ActivityPage } from './ActivityPage';
import { StartActivityPage } from './StartActivityPage';
import { StartManualActivityPage } from './StartManualActivityPage';
import { StartScriptActivityPage } from './StartScriptActivityPage';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuardFn, attachContextGuardFn],
    canActivateChild: [authGuardChildFn],
    runGuardsAndResolvers: 'always',
    component: InstancePage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: ActivitiesPage,
      }, {
        path: ':activityId',
        component: ActivityPage,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'log',
          }, {
            path: 'log',
            component: ActivityLogTab,
          }
        ]
      }, {
        path: 'create',
        pathMatch: 'full',
        component: StartActivityPage,
      }, {
        path: 'create/manual',
        pathMatch: 'full',
        component: StartManualActivityPage,
      }, {
        path: 'create/script',
        pathMatch: 'full',
        component: StartScriptActivityPage,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ActivitiesRoutingModule { }

export const routingComponents = [
  ActivitiesPage,
  ActivityLogTab,
  ActivityPage,
  StartActivityPage,
  StartManualActivityPage,
  StartScriptActivityPage,
];
