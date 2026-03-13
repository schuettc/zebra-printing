import printerConfig from '../config/printers.json';
import type { PrinterConfig, PrintersConfig } from '../types/printer';

export class PrinterConfigService {
  private static config: PrintersConfig = printerConfig;

  static getPrinters(): PrinterConfig[] {
    return this.config.printers;
  }

  static getPrinterById(id: string): PrinterConfig | undefined {
    return this.config.printers.find((printer) => printer.id === id);
  }

  static getPrinterByName(name: string): PrinterConfig | undefined {
    return this.config.printers.find((printer) => printer.name === name);
  }

  static getPrintersByLocation(location: string): PrinterConfig[] {
    return this.config.printers.filter(
      (printer) => printer.location === location
    );
  }

  static getDefaultPrinter(): PrinterConfig | undefined {
    return this.config.printers[0];
  }

  static formatPrinterAddress(printer: PrinterConfig): string {
    return `${printer.ip}:${printer.port}`;
  }
}
