import type { PrinterConfig } from '../types/printer';

// Type for the devices data returned by BrowserPrint
interface DevicesData {
  [key: string]: unknown;
  printer?: BrowserPrint.Device[];
  0?: BrowserPrint.Device;
}

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: Error;
}

export interface PrinterStatus {
  isReady: boolean;
  isPaused: boolean;
  isHeadOpen: boolean;
  isPaperOut: boolean;
  isRibbonOut: boolean;
  errorMessage?: string;
}

export class BrowserPrintService {
  static isAvailable(): boolean {
    return typeof window !== 'undefined' && window.BrowserPrint !== undefined;
  }

  static async connectToPrinter(
    printerConfig: PrinterConfig
  ): Promise<BrowserPrint.Device | BrowserPrint.Zebra.Printer> {
    if (!this.isAvailable()) {
      throw new Error('Browser Print is not installed or not available');
    }

    return new Promise((resolve, reject) => {
      try {
        // Check if Zebra namespace exists
        if (window.BrowserPrint.Zebra && window.BrowserPrint.Zebra.Printer) {
          // For network printers, we can use the Zebra printer type
          const printer = new window.BrowserPrint.Zebra.Printer(
            `${printerConfig.ip}:${printerConfig.port}`
          );

          // Set printer properties
          printer.name = printerConfig.name;

          // Test connection by getting configuration
          printer.getConfiguration(
            () => {
              resolve(printer);
            },
            (error) => {
              reject(new Error(`Failed to connect to printer: ${error}`));
            }
          );
        } else {
          // Fallback: First try to find the device from discovered devices
          window.BrowserPrint.getLocalDevices(
            (devicesData: BrowserPrint.Device[] | DevicesData) => {
              // The response appears to be an array-like object, let's convert it
              let devices: BrowserPrint.Device[] = [];
              if (Array.isArray(devicesData)) {
                devices = devicesData;
              } else if (devicesData && typeof devicesData === 'object') {
                const data = devicesData as DevicesData;

                // Try to convert as array-like first
                try {
                  devices = Array.from(
                    devicesData as unknown as ArrayLike<BrowserPrint.Device>
                  );
                } catch {
                  // If that fails, it's not array-like
                  devices = [];
                }

                // Check for printer property
                if (devices.length === 0 && data.printer) {
                  devices = data.printer;
                }
              }

              // If we still have no devices but see them in the raw data, use the first item
              if (devices.length === 0 && devicesData) {
                const indexed = devicesData as DevicesData;
                if (indexed[0]) {
                  devices = [indexed[0]];
                }
              }

              // Try to find the device by IP
              const targetDevice = devices.find((d: BrowserPrint.Device) => {
                return (
                  d.uid === printerConfig.ip ||
                  d.uid === `${printerConfig.ip}:${printerConfig.port}` ||
                  d.name?.includes(printerConfig.ip)
                );
              });

              if (targetDevice) {
                resolve(targetDevice);
              } else if (devices.length > 0) {
                // Use the first discovered device
                resolve(devices[0]);
              } else {
                reject(new Error('No devices found'));
              }
            },
            (error) => {
              reject(new Error(`Failed to get devices: ${error}`));
            },
            'printer'
          );
        }
      } catch (error) {
        reject(new Error(`Failed to create printer device: ${error}`));
      }
    });
  }

  static async printZPL(
    device: BrowserPrint.Device | BrowserPrint.Zebra.Printer,
    zplContent: string
  ): Promise<PrintResult> {
    return new Promise((resolve) => {
      try {
        if (!device || typeof device.send !== 'function') {
          throw new Error('Device does not have a send method');
        }

        device.send(
          zplContent,
          () => {
            resolve({
              success: true,
              message: 'Print job sent successfully',
            });
          },
          (error) => {
            resolve({
              success: false,
              error: new Error(`Print failed: ${error}`),
              message: `Failed to print: ${error}`,
            });
          }
        );
      } catch (error) {
        resolve({
          success: false,
          error: error as Error,
          message: `Print error: ${(error as Error).message}`,
        });
      }
    });
  }

  static async checkPrinterStatus(
    device: BrowserPrint.Device | BrowserPrint.Zebra.Printer
  ): Promise<PrinterStatus> {
    return new Promise((resolve, reject) => {
      // For Zebra printers, we can use the getStatus method
      if ('getStatus' in device && typeof device.getStatus === 'function') {
        device.getStatus(
          (status) => {
            resolve({
              isReady: status.isReadyToPrint || false,
              isPaused: status.isPaused || false,
              isHeadOpen: status.isHeadOpen || false,
              isPaperOut: status.isPaperOut || false,
              isRibbonOut: status.isRibbonOut || false,
              errorMessage: this.getStatusMessage(status),
            });
          },
          (error) => {
            reject(new Error(`Failed to get printer status: ${error}`));
          }
        );
      } else {
        // Fallback to sending status query command
        device.sendThenRead('~HQES', (error, response) => {
          if (error) {
            reject(new Error(`Failed to get printer status: ${error}`));
            return;
          }

          // Parse the status response
          const status = this.parseStatusResponse(response || '');
          resolve(status);
        });
      }
    });
  }

  static async getLocalPrinters(): Promise<BrowserPrint.Device[]> {
    if (!this.isAvailable()) {
      return [];
    }

    return new Promise((resolve, reject) => {
      window.BrowserPrint.getLocalDevices(
        (devicesData: BrowserPrint.Device[] | DevicesData) => {
          // Handle array-like objects
          let devices: BrowserPrint.Device[] = [];
          if (Array.isArray(devicesData)) {
            devices = devicesData;
          } else if (devicesData && typeof devicesData === 'object') {
            const data = devicesData as DevicesData;

            // Try to convert as array-like first
            try {
              devices = Array.from(
                devicesData as unknown as ArrayLike<BrowserPrint.Device>
              );
            } catch {
              // If that fails, it's not array-like
              devices = [];
            }

            // Check for printer property
            if (devices.length === 0 && data.printer) {
              devices = data.printer;
            }
          }
          resolve(devices);
        },
        (error) => {
          reject(new Error(`Failed to get local devices: ${error}`));
        },
        'printer'
      );
    });
  }

  static async discoverPrinters(): Promise<PrinterConfig[]> {
    try {
      const devices = await this.getLocalPrinters();

      return devices.map((device, index) => {
        // For discovered devices, the UID is often just the IP address
        let ip = device.uid;
        let port = 9100; // Default Zebra port

        // Check if UID contains port
        if (device.uid.includes(':')) {
          const uidParts = device.uid.split(':');
          ip = uidParts[0];
          port = parseInt(uidParts[1]) || 9100;
        }

        return {
          id: `discovered-${index}`,
          name: device.name || `Printer ${index + 1}`,
          ip: ip,
          port: port,
          location: 'Discovered',
          description: `${device.connection} connection`,
          model: device.deviceType,
          source: 'discovered' as const,
        };
      });
    } catch {
      return [];
    }
  }

  static async testConnection(printerConfig: PrinterConfig): Promise<boolean> {
    try {
      const device = await this.connectToPrinter(printerConfig);

      // Try to get printer status as a connection test
      try {
        const status = await this.checkPrinterStatus(device);
        return status.isReady;
      } catch {
        // If status check fails, try a simple command
        try {
          return new Promise((resolve) => {
            if (
              'sendThenRead' in device &&
              typeof device.sendThenRead === 'function'
            ) {
              device.sendThenRead('~HI', (error) => {
                resolve(!error);
              });
            } else if ('send' in device && typeof device.send === 'function') {
              device.send(
                '~HI',
                () => resolve(true),
                () => resolve(false)
              );
            } else {
              resolve(false);
            }
          });
        } catch {
          // Connection was established, so return true
          return true;
        }
      }
    } catch {
      return false;
    }
  }

  private static getStatusMessage(
    status: BrowserPrint.Zebra.PrinterStatus
  ): string | undefined {
    if (!status.isReadyToPrint) {
      if (status.isPaused) return 'Printer is paused';
      if (status.isHeadOpen) return 'Printer head is open';
      if (status.isPaperOut) return 'Paper out';
      if (status.isRibbonOut) return 'Ribbon out';
      return 'Printer not ready';
    }
    return undefined;
  }

  private static parseStatusResponse(response: string): PrinterStatus {
    const status: PrinterStatus = {
      isReady: true,
      isPaused: false,
      isHeadOpen: false,
      isPaperOut: false,
      isRibbonOut: false,
    };

    const upperResponse = response.toUpperCase();

    if (upperResponse.includes('PAUSED')) {
      status.isPaused = true;
      status.isReady = false;
      status.errorMessage = 'Printer is paused';
    }

    if (upperResponse.includes('HEAD') && upperResponse.includes('OPEN')) {
      status.isHeadOpen = true;
      status.isReady = false;
      status.errorMessage = 'Printer head is open';
    }

    if (
      upperResponse.includes('PAPER OUT') ||
      upperResponse.includes('MEDIA OUT')
    ) {
      status.isPaperOut = true;
      status.isReady = false;
      status.errorMessage = 'Paper out';
    }

    if (upperResponse.includes('RIBBON OUT')) {
      status.isRibbonOut = true;
      status.isReady = false;
      status.errorMessage = 'Ribbon out';
    }

    return status;
  }
}
