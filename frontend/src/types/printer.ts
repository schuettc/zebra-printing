export interface PrinterConfig {
  id: string;
  name: string;
  ip: string;
  port: number;
  location: string;
  description?: string;
  model?: string;
  capabilities?: string[];
  source?: 'config' | 'discovered';
}

export interface PrintersConfig {
  printers: PrinterConfig[];
}

export interface DiscoveredPrinter {
  uid: string;
  name: string;
  connection: string;
  deviceType: string;
  manufacturer?: string;
  model?: string;
}
