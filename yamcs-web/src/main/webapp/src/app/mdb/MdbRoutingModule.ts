import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthGuard } from '../core/guards/AuthGuard';
import { InstanceExistsGuard } from '../core/guards/InstanceExistsGuard';
import { MayGetMissionDatabaseGuard } from '../core/guards/MayGetMissionDatabaseGuard';
import { InstancePage } from '../shared/template/InstancePage';
import { AlgorithmPage } from './algorithms/AlgorithmPage';
import { AlgorithmsPage } from './algorithms/AlgorithmsPage';
import { CommandPage } from './commands/CommandPage';
import { CommandsPage } from './commands/CommandsPage';
import { ContainerPage } from './containers/ContainerPage';
import { ContainersPage } from './containers/ContainersPage';
import { ExportXtcePage } from './overview/ExportXtcePage';
import { OverviewPage } from './overview/OverviewPage';
import { ParameterPage } from './parameters/ParameterPage';
import { ParametersPage } from './parameters/ParametersPage';


const routes = [{
  path: '',
  canActivate: [AuthGuard, InstanceExistsGuard, MayGetMissionDatabaseGuard],
  canActivateChild: [AuthGuard, MayGetMissionDatabaseGuard],
  component: InstancePage,
  children: [{
    path: '',
    pathMatch: 'full',
    component: OverviewPage,
  }, {
    path: 'algorithms',
    pathMatch: 'full',
    component: AlgorithmsPage,
  }, {
    path: 'algorithms/:qualifiedName',
    component: AlgorithmPage,
  }, {
    path: 'commands',
    pathMatch: 'full',
    component: CommandsPage,
  }, {
    path: 'commands/:qualifiedName',
    component: CommandPage,
  }, {
    path: 'containers',
    pathMatch: 'full',
    component: ContainersPage,
  }, {
    path: 'containers/:qualifiedName',
    component: ContainerPage,
  }, {
    path: 'export-xtce',
    component: ExportXtcePage,
    pathMatch: 'full'
  }, {
    path: 'parameters',
    pathMatch: 'full',
    component: ParametersPage,
  }, {
    path: 'parameters/:qualifiedName',
    component: ParameterPage,
  }]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MdbRoutingModule { }

export const routingComponents = [
  AlgorithmsPage,
  AlgorithmPage,
  CommandsPage,
  CommandPage,
  ContainersPage,
  ContainerPage,
  ExportXtcePage,
  OverviewPage,
  ParametersPage,
  ParameterPage,
];
