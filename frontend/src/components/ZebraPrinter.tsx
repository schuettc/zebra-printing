import React, { useState, useEffect } from 'react';
import { PrinterConfigService } from '../services/printerConfig';
import { BrowserPrintService } from '../services/browserPrintService';
import { PrinterSelector } from './PrinterSelector';
import { ZPLUploader } from './ZPLUploader';
import { PrintStatus, type PrintStatusProps } from './PrintStatus';
import type { PrinterConfig } from '../types/printer';

export const ZebraPrinter: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<
    PrinterConfig | undefined
  >();
  const [zplContent, setZplContent] = useState<string>('');
  const [printStatus, setPrintStatus] = useState<PrintStatusProps>({
    status: 'idle',
  });
  const [isBrowserPrintAvailable, setIsBrowserPrintAvailable] =
    useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [showConfiguredOnly, setShowConfiguredOnly] = useState<boolean>(false);

  useEffect(() => {
    // Load printers from configuration
    const configuredPrinters = PrinterConfigService.getPrinters();
    setPrinters(configuredPrinters);

    // Check Browser Print availability
    const checkBrowserPrint = () => {
      const available = BrowserPrintService.isAvailable();
      setIsBrowserPrintAvailable(available);

      if (!available) {
        setPrintStatus({
          status: 'error',
          message:
            'Browser Print is not installed. Please install it to continue.',
        });
      }
    };

    // Check immediately and after a short delay (in case SDK loads async)
    checkBrowserPrint();
    setTimeout(checkBrowserPrint, 1000);
  }, []);

  const handleDiscoverPrinters = async () => {
    setIsDiscovering(true);
    setPrintStatus({
      status: 'connecting',
      message: 'Discovering printers...',
    });

    try {
      const discoveredPrinters = await BrowserPrintService.discoverPrinters();
      const configuredPrinters = PrinterConfigService.getPrinters();

      // Combine configured and discovered printers, avoiding duplicates
      const combinedPrinters = [...configuredPrinters];

      discoveredPrinters.forEach((discovered) => {
        const isDuplicate = configuredPrinters.some(
          (configured) =>
            configured.ip === discovered.ip &&
            configured.port === discovered.port
        );

        if (!isDuplicate) {
          combinedPrinters.push(discovered);
        }
      });

      setPrinters(combinedPrinters);
      setPrintStatus({
        status: 'success',
        message: `Found ${discoveredPrinters.length} printer(s)`,
      });
    } catch (error) {
      setPrintStatus({
        status: 'error',
        message: 'Failed to discover printers',
        error: error as Error,
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
      setPrintStatus({
        status: 'error',
        message: 'Please select a printer',
      });
      return;
    }

    if (!zplContent.trim()) {
      setPrintStatus({
        status: 'error',
        message: 'Please provide ZPL content to print',
      });
      return;
    }

    setIsProcessing(true);
    setPrintStatus({ status: 'connecting' });

    try {
      // Connect to printer
      const device =
        await BrowserPrintService.connectToPrinter(selectedPrinter);

      // Update status to printing
      setPrintStatus({ status: 'printing' });

      // Send ZPL to printer
      const result = await BrowserPrintService.printZPL(device, zplContent);

      if (result.success) {
        setPrintStatus({
          status: 'success',
          message: result.message,
        });
      } else {
        setPrintStatus({
          status: 'error',
          message: result.message,
          error: result.error,
        });
      }
    } catch (error) {
      setPrintStatus({
        status: 'error',
        message: 'Failed to print',
        error: error as Error,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedPrinter) {
      setPrintStatus({
        status: 'error',
        message: 'Please select a printer to test',
      });
      return;
    }

    setIsProcessing(true);
    setPrintStatus({ status: 'connecting', message: 'Testing connection...' });

    try {
      const isConnected =
        await BrowserPrintService.testConnection(selectedPrinter);

      if (isConnected) {
        setPrintStatus({
          status: 'success',
          message: 'Successfully connected to printer',
        });
      } else {
        setPrintStatus({
          status: 'error',
          message: 'Could not connect to printer',
        });
      }
    } catch (error) {
      setPrintStatus({
        status: 'error',
        message: 'Connection test failed',
        error: error as Error,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isBrowserPrintAvailable) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1>Zebra Printer</h1>
        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Browser Print Not Detected</h3>
          <p>
            Browser Print is required to communicate with Zebra printers. Please
            follow these steps:
          </p>
          <ol>
            <li>Download Browser Print from the Zebra Developer Portal</li>
            <li>Install the application on your computer</li>
            <li>Make sure the Browser Print service is running</li>
            <li>
              Accept the SSL certificate by visiting{' '}
              <a
                href="https://localhost:9101/ssl_support"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0066cc' }}
              >
                https://localhost:9101/ssl_support
              </a>
            </li>
            <li>Refresh this page</li>
          </ol>
        </div>
        <PrintStatus {...printStatus} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Zebra Printer</h1>

      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={handleDiscoverPrinters}
              disabled={isProcessing || isDiscovering}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  isProcessing || isDiscovering ? 'not-allowed' : 'pointer',
                opacity: isProcessing || isDiscovering ? 0.5 : 1,
              }}
            >
              {isDiscovering ? 'Discovering...' : 'Discover Printers'}
            </button>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
              }}
            >
              <input
                type="checkbox"
                checked={showConfiguredOnly}
                onChange={(e) => setShowConfiguredOnly(e.target.checked)}
                disabled={isProcessing}
              />
              Show configured only
            </label>
          </div>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {
              printers.filter(
                (p) => !showConfiguredOnly || p.source !== 'discovered'
              ).length
            }{' '}
            printer(s) available
          </span>
        </div>
        <PrinterSelector
          printers={printers.filter(
            (p) => !showConfiguredOnly || p.source !== 'discovered'
          )}
          selectedPrinter={selectedPrinter}
          onPrinterSelect={setSelectedPrinter}
          disabled={isProcessing}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <ZPLUploader onZPLChange={setZplContent} disabled={isProcessing} />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handlePrint}
          disabled={isProcessing || !selectedPrinter || !zplContent}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor:
              isProcessing || !selectedPrinter || !zplContent
                ? 'not-allowed'
                : 'pointer',
            opacity: isProcessing || !selectedPrinter || !zplContent ? 0.5 : 1,
          }}
        >
          {isProcessing ? 'Processing...' : 'Print Label'}
        </button>

        <button
          onClick={handleTestConnection}
          disabled={isProcessing || !selectedPrinter}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor:
              isProcessing || !selectedPrinter ? 'not-allowed' : 'pointer',
            opacity: isProcessing || !selectedPrinter ? 0.5 : 1,
          }}
        >
          Test Connection
        </button>
      </div>

      <PrintStatus {...printStatus} />
    </div>
  );
};
