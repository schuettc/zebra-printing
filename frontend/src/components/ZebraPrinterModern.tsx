import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  Upload,
  Wifi,
  AlertCircle,
  RefreshCw,
  FileText,
  WifiOff,
  AlertTriangle,
  ExternalLink,
  Minus,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { PrinterConfigService } from '../services/printerConfig';
import { BrowserPrintService } from '../services/browserPrintService';
import type { PrinterConfig } from '../types/printer';
import { cn } from '@/utils/cn';

interface ZPLFile {
  name: string;
  size: number;
  content: string;
}

export const ZebraPrinterModern: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<
    PrinterConfig | undefined
  >();
  const [zplFile, setZplFile] = useState<ZPLFile | null>(null);
  const [zplContent, setZplContent] = useState<string>('');
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [printQuantity, setPrintQuantity] = useState<number>(1);
  const [, setPrintStatus] = useState<{
    status: 'idle' | 'error' | 'success' | 'connecting' | 'printing';
    message?: string;
  }>({
    status: 'idle',
  });
  const [isBrowserPrintAvailable, setIsBrowserPrintAvailable] =
    useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [showConfiguredOnly, setShowConfiguredOnly] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load printers from configuration
    const configuredPrinters = PrinterConfigService.getPrinters();
    setPrinters(configuredPrinters);

    // Check Browser Print availability
    const checkBrowserPrint = () => {
      const available = BrowserPrintService.isAvailable();
      setIsBrowserPrintAvailable(available);

      if (!available) {
        toast.error(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span className="font-medium">Browser Print Not Detected</span>
            </div>
            <p className="text-sm">
              Browser Print is required to communicate with Zebra printers.
            </p>
            <a
              href="https://localhost:9101/ssl_support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              Accept SSL Certificate
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>,
          {
            duration: 0, // Don't auto-dismiss
            closeButton: true,
          }
        );
      }
    };

    // Check immediately and after a short delay (in case SDK loads async)
    checkBrowserPrint();
    setTimeout(checkBrowserPrint, 1000);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast(message);
        break;
    }
  };

  const handleDiscoverPrinters = async () => {
    setIsDiscovering(true);

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

      // Show appropriate message based on number of printers found
      if (discoveredPrinters.length === 0) {
        toast.warning(
          'No printers found. Please ensure your printers are connected and Browser Print can access them.'
        );
      } else {
        toast.success(`Found ${discoveredPrinters.length} printer(s)`);
      }
    } catch (error) {
      // Check if this is a Browser Print connection error
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to discover printers';

      if (
        errorMessage.includes('Failed to get local devices') ||
        errorMessage.includes('ERR_CONNECTION_REFUSED')
      ) {
        // Show a more helpful error message for Browser Print issues
        toast.error(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Browser Print Not Running</span>
            </div>
            <p className="text-sm">
              Please ensure Browser Print is installed and running:
            </p>
            <ol className="text-xs list-decimal list-inside space-y-1 ml-2">
              <li>Install Browser Print from Zebra</li>
              <li>Start the Browser Print service</li>
              <li>
                Accept the SSL certificate at{' '}
                <a
                  href="https://localhost:9101/ssl_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  https://localhost:9101/ssl_support
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ol>
          </div>,
          {
            duration: 10000, // Show for 10 seconds
            action: {
              label: 'Open SSL Page',
              onClick: () =>
                window.open('https://localhost:9101/ssl_support', '_blank'),
            },
          }
        );
      } else {
        showToast('error', errorMessage);
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.zpl')) {
      showToast('error', 'Please select a ZPL file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        const content = event.target.result;
        const newFile: ZPLFile = {
          name: file.name,
          size: file.size,
          content: content,
        };

        setZplFile(newFile);
        setZplContent(content);
        showToast('success', `File "${file.name}" loaded successfully`);
      }
    };

    reader.onerror = () => {
      showToast('error', 'Failed to read the file');
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.zpl')) {
        const reader = new FileReader();

        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            const content = event.target.result;
            const newFile: ZPLFile = {
              name: file.name,
              size: file.size,
              content: content,
            };

            setZplFile(newFile);
            setZplContent(content);
            showToast('success', `File "${file.name}" dropped successfully`);
          }
        };

        reader.onerror = () => {
          showToast('error', 'Failed to read the dropped file');
        };

        reader.readAsText(file);
      } else {
        showToast('error', 'Please drop a ZPL file (.zpl extension required)');
      }
    }
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
      showToast('error', 'Please select a printer');
      return;
    }

    if (!zplContent.trim()) {
      showToast('error', 'Please provide ZPL content to print');
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

      // Send ZPL to printer for each copy
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < printQuantity; i++) {
        try {
          const result = await BrowserPrintService.printZPL(device, zplContent);

          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }

          // Update progress
          if (printQuantity > 1) {
            setPrintStatus({
              status: 'printing',
              message: `Printing label ${i + 1} of ${printQuantity}...`,
            });
          }
        } catch {
          failedCount++;
        }
      }

      // Show final results
      if (failedCount === 0) {
        setPrintStatus({
          status: 'success',
          message: `Successfully printed ${successCount} label${successCount > 1 ? 's' : ''}`,
        });
        showToast(
          'success',
          `Successfully printed ${successCount} label${successCount > 1 ? 's' : ''}`
        );
      } else if (successCount === 0) {
        setPrintStatus({ status: 'error', message: 'All print jobs failed' });
        showToast('error', 'All print jobs failed');
      } else {
        setPrintStatus({
          status: 'error',
          message: `Printed ${successCount} of ${printQuantity} labels`,
        });
        toast.warning(
          `Printed ${successCount} of ${printQuantity} labels (${failedCount} failed)`
        );
      }
    } catch (error) {
      setPrintStatus({ status: 'error', message: 'Failed to print' });
      showToast('error', 'Failed to print: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPrintStatus({ status: 'idle' }), 3000);
    }
  };

  const handleTestConnection = async () => {
    if (!selectedPrinter) {
      showToast('error', 'Please select a printer to test');
      return;
    }

    setIsProcessing(true);

    try {
      const isConnected =
        await BrowserPrintService.testConnection(selectedPrinter);

      if (isConnected) {
        showToast(
          'success',
          `Successfully connected to ${selectedPrinter.name}`
        );
      } else {
        showToast('error', `Could not connect to ${selectedPrinter.name}`);
      }
    } catch (error) {
      showToast('error', 'Connection test failed: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (!isBrowserPrintAvailable) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Alert className="mb-6" variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Browser Print Not Detected</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Browser Print is required to communicate with Zebra printers.
                Please follow these steps:
              </p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Download Browser Print from the Zebra Developer Portal</li>
                <li>Install the application on your computer</li>
                <li>Make sure the Browser Print service is running</li>
                <li>
                  Accept the SSL certificate by visiting{' '}
                  <a
                    href="https://localhost:9101/ssl_support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    https://localhost:9101/ssl_support
                  </a>
                </li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Print Configuration</CardTitle>
            <CardDescription>
              Select a printer and upload your ZPL file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="printer-select">Printer</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscoverPrinters}
                    disabled={isProcessing || isDiscovering}
                  >
                    {isDiscovering ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4" />
                    )}
                    Discover
                  </Button>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showConfiguredOnly}
                      onChange={(e) => setShowConfiguredOnly(e.target.checked)}
                      disabled={isProcessing}
                      className="rounded border-input"
                    />
                    Configured only
                  </label>
                </div>
              </div>
              <Select
                value={selectedPrinter?.id}
                onValueChange={(value) => {
                  const printer = printers.find((p) => p.id === value);
                  if (printer) {
                    setSelectedPrinter(printer);
                  }
                }}
                disabled={isProcessing}
              >
                <SelectTrigger id="printer-select" className="w-full">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {printers
                    .filter(
                      (p) => !showConfiguredOnly || p.source !== 'discovered'
                    )
                    .map((printer) => (
                      <SelectItem key={printer.id} value={printer.id}>
                        <div className="flex items-center">
                          <span className="mr-2">
                            {printer.source === 'discovered' ? '🔍' : '📋'}
                          </span>
                          <span>
                            {printer.name} - {printer.location}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({printer.ip}:{printer.port})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedPrinter && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-200"
                >
                  <p className="text-sm">
                    <span className="font-medium">Model:</span>{' '}
                    {selectedPrinter.model || 'Unknown'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Description:</span>{' '}
                    {selectedPrinter.description || 'No description'}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="zpl-file">ZPL File</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="zpl-file"
                  type="file"
                  accept=".zpl"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {zplFile ? 'Change File' : 'Upload ZPL File'}
                </Button>
              </div>

              {zplFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-md mr-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {zplFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(zplFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setZplFile(null);
                      setZplContent('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Remove file</span>
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="zpl-content">ZPL Content</Label>
                <span className="text-xs text-gray-500">
                  {zplContent.length > 0 && `${zplContent.length} characters`}
                </span>
              </div>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  id="zpl-content"
                  value={zplContent}
                  onChange={(e) => {
                    setZplContent(e.target.value);
                    if (zplFile) {
                      setZplFile(null);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  placeholder="Paste your ZPL code here or drag and drop a ZPL file..."
                  className={cn(
                    'min-h-[200px] font-mono text-sm transition-all',
                    isDraggingOver &&
                      'ring-2 ring-blue-500 ring-offset-2 bg-blue-50'
                  )}
                  disabled={isProcessing}
                />
                {isDraggingOver && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 rounded-lg p-4 shadow-lg">
                      <p className="text-blue-600 font-medium">
                        Drop file here
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                You can type, paste, or drag and drop ZPL files (.zpl extension
                required).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="print-quantity">Print Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPrintQuantity(Math.max(1, printQuantity - 1))
                  }
                  disabled={printQuantity <= 1 || isProcessing}
                  className="h-9 w-9"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="print-quantity"
                  type="number"
                  min="1"
                  max="999"
                  value={printQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 999) {
                      setPrintQuantity(value);
                    }
                  }}
                  className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  disabled={isProcessing}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPrintQuantity(Math.min(999, printQuantity + 1))
                  }
                  disabled={printQuantity >= 999 || isProcessing}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-500">
                  {printQuantity === 1 ? 'label' : 'labels'}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleTestConnection}
                disabled={!selectedPrinter || isProcessing}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Test Connection
              </Button>
              <Button
                className="flex-1"
                onClick={handlePrint}
                disabled={!selectedPrinter || !zplContent || isProcessing}
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Print {printQuantity > 1 ? `${printQuantity} Labels` : 'Label'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
