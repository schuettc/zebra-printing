import React from 'react';

export interface PrintStatusProps {
  status: 'idle' | 'connecting' | 'printing' | 'success' | 'error';
  message?: string;
  error?: Error;
}

export const PrintStatus: React.FC<PrintStatusProps> = ({
  status,
  message,
  error,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'idle':
        return '#666';
      case 'connecting':
      case 'printing':
        return '#2196F3';
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return '⭘';
      case 'connecting':
        return '⟳';
      case 'printing':
        return '⟳';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '';
    }
  };

  const getStatusText = () => {
    if (message) return message;

    switch (status) {
      case 'idle':
        return 'Ready to print';
      case 'connecting':
        return 'Connecting to printer...';
      case 'printing':
        return 'Sending print job...';
      case 'success':
        return 'Print job sent successfully';
      case 'error':
        return error?.message || 'Print failed';
      default:
        return '';
    }
  };

  const isAnimating = status === 'connecting' || status === 'printing';

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '4px',
        backgroundColor: `${getStatusColor()}15`,
        border: `1px solid ${getStatusColor()}30`,
        color: getStatusColor(),
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '16px',
      }}
    >
      <span
        style={{
          fontSize: '20px',
          animation: isAnimating ? 'spin 1s linear infinite' : 'none',
        }}
      >
        {getStatusIcon()}
      </span>
      <span style={{ flex: 1 }}>{getStatusText()}</span>
    </div>
  );
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
