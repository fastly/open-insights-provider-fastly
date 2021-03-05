//  Classifiers
// ---------------------------------------------------------------------------
export type CountryCode = string;
export type ASN = number;
export type ConnectionType = string;
export type DeviceType = string;

//  Server response
// ---------------------------------------------------------------------------

export interface Test {
  id: string;
}

export interface Client {
  country_code: CountryCode;
  connection_type: ConnectionType;
  asn: ASN;
  device_type: DeviceType;
  [key: string]: string | number;
}

export interface Host {
  host: string;
  lookup: string;
}

export interface Settings {
  max_tasks: number;
  report_errors: boolean;
  sample_rate: number;
  token: string;
  config_url: string;
  library_version?: string;
}

export interface Server {
  datacenter: string;
}

export interface TaskClassification {
  country_code?: CountryCode[];
  asn?: ASN[];
  connection_type?: ConnectionType[];
  device_type?: DeviceType[];
  [key: string]: string[] | number[] | undefined;
}

export interface TaskData {
  id: string;
  req_header: string;
  resource: string;
  resp_header: string;
  type: string;
  weight: number;
  classification: TaskClassification;
}

export interface Config {
  client: Client;
  hosts: Host;
  server: Server;
  session: string;
  settings: Settings;
  tasks: TaskData[];
  test: Test;
}

export interface ClientInfo {
  client_asn: number;
  client_conn_speed: string;
  client_continent_code: string;
  client_country_code: string;
  client_gmt_offset: string;
  client_ip: string;
  client_latitude: string;
  client_longitude: string;
  client_metro_code: string;
  client_postal_code: string;
  client_region: string;
  client_user_agent: string;
  resolver_asn: number;
  resolver_conn_speed: string;
  resolver_continent_code: string;
  resolver_country_code: string;
  resolver_ip: string;
  resolver_region: string;
  resolver_latitude: string;
  resolver_longitude: string;
}
