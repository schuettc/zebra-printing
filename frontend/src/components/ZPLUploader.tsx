import React, { useState, useRef } from 'react';

export interface ZPLUploaderProps {
  onZPLChange: (zpl: string) => void;
  disabled?: boolean;
}

export const ZPLUploader: React.FC<ZPLUploaderProps> = ({
  onZPLChange,
  disabled = false,
}) => {
  const [zplContent, setZplContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zpl') && !file.name.endsWith('.txt')) {
      alert('Please select a .zpl or .txt file');
      return;
    }

    try {
      const content = await file.text();
      setZplContent(content);
      setFileName(file.name);
      onZPLChange(content);
    } catch (error) {
      alert('Failed to read file: ' + (error as Error).message);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = event.target.value;
    setZplContent(content);
    onZPLChange(content);
    setFileName('');
  };

  const handleClear = () => {
    setZplContent('');
    setFileName('');
    onZPLChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sampleZPL = `^XA
^FO50,50^ADN,36,20^FDHello World^FS
^FO50,150^GB700,3,3^FS
^FO50,200^ADN,18,10^FDSample Label^FS
^FO50,250^BY3^BCN,100,Y,N,N^FD123456789^FS
^XZ`;

  const loadSample = () => {
    setZplContent(sampleZPL);
    setFileName('sample.zpl');
    onZPLChange(sampleZPL);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <label
          htmlFor="zpl-content"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 500,
            color: '#333',
          }}
        >
          ZPL Content
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zpl,.txt"
            onChange={handleFileChange}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={loadSample}
            disabled={disabled}
            style={{
              padding: '4px 12px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            Load Sample
          </button>
          <button
            onClick={handleClear}
            disabled={disabled || !zplContent}
            style={{
              padding: '4px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled || !zplContent ? 'not-allowed' : 'pointer',
              opacity: disabled || !zplContent ? 0.5 : 1,
            }}
          >
            Clear
          </button>
        </div>
        {fileName && (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            Loaded: {fileName}
          </div>
        )}
      </div>
      <textarea
        id="zpl-content"
        value={zplContent}
        onChange={handleTextChange}
        disabled={disabled}
        placeholder="Paste ZPL content here or upload a file..."
        style={{
          width: '100%',
          minHeight: '200px',
          padding: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          resize: 'vertical',
        }}
      />
      <div style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
        {zplContent.length} characters
      </div>
    </div>
  );
};
