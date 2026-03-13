// Type definitions for Zebra Browser Print SDK

declare global {
  interface Window {
    BrowserPrint: typeof BrowserPrint;
  }

  namespace BrowserPrint {
    class Device {
      uid: string;
      connection: string;
      name: string;
      deviceType: string;
      version: number;

      constructor();

      send(
        data: string,
        finishedCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;

      sendThenRead(
        data: string,
        callback?: (error: Error | null, response?: string) => void
      ): void;

      read(callback?: (error: Error | null, response?: string) => void): void;

      sendFile(
        url: string,
        finishedCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;

      convertAndSendFile(
        url: string,
        options: any,
        finishedCallback?: () => void,
        errorCallback?: (error: Error) => void
      ): void;
    }

    interface SelectedDevice {
      name: string;
      uid: string;
      connection: string;
      deviceType: string;
      version: number;
    }

    function getDefaultDevice(
      deviceType: string,
      callback: (device: Device | null) => void,
      errorCallback?: (error: Error) => void
    ): void;

    function getLocalDevices(
      callback: (devices: Device[]) => void,
      errorCallback?: (error: Error) => void,
      typeFilter?: string
    ): void;

    function getApplicationConfiguration(
      callback: (config: any) => void,
      errorCallback?: (error: Error) => void
    ): void;

    function readOnInterval(
      device: Device,
      callback: (data: string) => void,
      interval: number
    ): void;

    function stopReadOnInterval(): void;

    namespace Zebra {
      class Printer extends Device {
        constructor(uid: string);

        name: string;
        uid: string;
        connection: string;
        deviceType: string;
        version: number;

        send(
          data: string,
          finishedCallback?: () => void,
          errorCallback?: (error: Error) => void
        ): void;

        sendThenRead(
          data: string,
          callback?: (error: Error | null, response?: string) => void
        ): void;

        getConfiguration(
          callback: (config: any) => void,
          errorCallback?: (error: Error) => void
        ): void;

        getStatus(
          callback: (status: PrinterStatus) => void,
          errorCallback?: (error: Error) => void
        ): void;

        isPrinterReady(
          callback: (ready: boolean) => void,
          errorCallback?: (error: Error) => void
        ): void;

        query(
          command: string,
          callback: (response: string) => void,
          errorCallback?: (error: Error) => void
        ): void;
      }

      interface PrinterStatus {
        isReadyToPrint: boolean;
        isPaused: boolean;
        isHeadOpen: boolean;
        isPaperOut: boolean;
        isRibbonOut: boolean;
        labelLengthInDots: number;
        numberOfFormatsInReceiveBuffer: number;
        isClearingBuffer: boolean;
      }
    }
  }
}

export {};
