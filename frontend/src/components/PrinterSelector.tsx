import React from 'react';
import type { PrinterConfig } from '../types/printer';

export interface PrinterSelectorProps {
  printers: PrinterConfig[];
  selectedPrinter?: PrinterConfig;
  onPrinterSelect: (printer: PrinterConfig) => void;
  disabled?: boolean;
}

export const PrinterSelector: React.FC<PrinterSelectorProps> = ({
  printers,
  selectedPrinter,
  onPrinterSelect,
  disabled = false,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const printer = printers.find((p) => p.id === event.target.value);
    if (printer) {
      onPrinterSelect(printer);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor="printer-select"
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 500,
          color: '#333',
        }}
      >
        Select Printer
      </label>
      <select
        id="printer-select"
        value={selectedPrinter?.id || ''}
        onChange={handleChange}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: '16px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="">-- Select a printer --</option>
        {printers.map((printer) => (
          <option key={printer.id} value={printer.id}>
            {printer.source === 'discovered' ? '🔍 ' : '📋 '}
            {printer.name} - {printer.location} ({printer.ip}:{printer.port})
          </option>
        ))}
      </select>
      {selectedPrinter && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <div>
            <strong>Model:</strong> {selectedPrinter.model || 'Unknown'}
          </div>
          <div>
            <strong>Description:</strong>{' '}
            {selectedPrinter.description || 'No description'}
          </div>
        </div>
      )}
    </div>
  );
};
