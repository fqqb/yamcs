import { Alarm } from './alarms';
import { Event } from './events';
import { Link } from './management';
import { SpaceSystem } from './mdb';
import { IndexGroup, Range, Sample } from './monitoring';
import { CommandQueue } from './queue';
import { Bucket, ClientConnectionInfo, GroupInfo, Instance, InstanceTemplate, Processor, RocksDbDatabase, RoleInfo, Service, UserInfo } from './system';
import { Record, Stream, Table } from './table';

export type WebSocketClientMessage = [
  number, // Protocol
  number, // Message Type
  number, // Request Sequence
  { [key: string]: string; } // payload
];

export type WebSocketServerMessage = [
  number, // Protocol
  number, // Message Type
  number, // Response Sequence
  {
    dt?: string;
    data?: { [key: string]: any; };

    et?: string;
    msg?: string;
  }
];

export interface EventsWrapper {
  event: Event[];
}

export interface InstancesWrapper {
  instances: Instance[];
}

export interface InstanceTemplatesWrapper {
  templates: InstanceTemplate[];
}

export interface LinksWrapper {
  links: Link[];
}

export interface ServicesWrapper {
  services: Service[];
}

export interface SpaceSystemsWrapper {
  spaceSystems: SpaceSystem[];
}

export interface AlarmsWrapper {
  alarms: Alarm[];
}

export interface UsersWrapper {
  users: UserInfo[];
}

export interface GroupsWrapper {
  groups: GroupInfo[];
}

export interface RolesWrapper {
  roles: RoleInfo[];
}

export interface ClientConnectionsWrapper {
  connections: ClientConnectionInfo[];
}

export interface CommandQueuesWrapper {
  queues: CommandQueue[];
}

export interface ProcessorsWrapper {
  processor: Processor[];
}

export interface StreamsWrapper {
  streams: Stream[];
}

export interface TablesWrapper {
  tables: Table[];
}

export interface RecordsWrapper {
  record: Record[];
}

export interface SamplesWrapper {
  sample: Sample[];
}

export interface RangesWrapper {
  range: Range[];
}

export interface SourcesWrapper {
  source: string[];
}

export interface IndexResult {
  group: IndexGroup[];
}

export interface PacketNameWrapper {
  name: string[];
}

export interface BucketsWrapper {
  buckets: Bucket[];
}

export interface RocksDbDatabasesWrapper {
  databases: RocksDbDatabase[];
}
