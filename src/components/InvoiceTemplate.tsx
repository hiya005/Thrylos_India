import { forwardRef } from 'react';

interface InvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  projectTitle: string;
  amount: number;
  status: string;
  transactionId?: string;
  paymentMethod?: string;
  paidAt?: string;
  paymentNote?: string;
  upiId?: string;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
  type: 'invoice' | 'receipt';
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data, type }, ref) => {
  const isReceipt = type === 'receipt';

  return (
    <div
      ref={ref}
      style={{
        width: '400px',
        minHeight: '580px',
        background: '#0a0a0f',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        color: '#e4e4e7',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Header - solid background for reliable rendering */}
      <div
        style={{
          background: '#1e3a5f',
          padding: '24px 28px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle accent stripe */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#f97316',
        }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
          height: '32px',
        }}>
          <img
            src="/thrylosindia.png"
            alt="Logo"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '4px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <span style={{
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '2px',
            color: '#fff',
            lineHeight: '32px',
          }}>
            THRYLOS INDIA
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: '2px 0 0' }}>
          Technology Solutions & Digital Services
        </p>
        <div style={{
          marginTop: '12px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'inline-block',
          lineHeight: '18px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px', color: '#fff', lineHeight: '18px' }}>
            {isReceipt ? '🧾 PAYMENT RECEIPT' : '📄 PAYMENT INVOICE'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '3px', background: '#3b82f6' }} />

      {/* Body */}
      <div style={{ padding: '24px 28px' }}>
        {/* Invoice info row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
              {isReceipt ? 'Receipt No' : 'Invoice No'}
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0', color: '#f4f4f5' }}>
              {data.invoiceNo}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
              Date
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, margin: '4px 0 0', color: '#f4f4f5' }}>
              {data.date}
            </p>
          </div>
        </div>

        {/* Customer */}
        <div style={{ marginBottom: '18px' }}>
          <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Customer
          </p>
          <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 2px', color: '#fff' }}>{data.customerName}</p>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 2px' }}>{data.customerEmail}</p>
          {data.customerPhone && <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>{data.customerPhone}</p>}
          {data.companyName && <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '2px 0 0' }}>{data.companyName}</p>}
        </div>

        {/* Project */}
        <div style={{ marginBottom: '18px' }}>
          <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Project
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#fbbf24' }}>{data.projectTitle}</p>
        </div>

        {/* Transaction ID */}
        {data.transactionId && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Transaction ID
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, fontFamily: 'monospace', color: '#a3e635' }}>
              {data.transactionId}
            </p>
          </div>
        )}

        {/* Payment Method */}
        {data.paymentMethod && (
          <div style={{ marginBottom: '18px' }}>
            <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>
              Payment Method
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#f4f4f5', textTransform: 'capitalize' }}>
              {data.paymentMethod}
            </p>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '2px', background: '#3b82f6', margin: '8px 0 18px' }} />

        {/* Items */}
        <div style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 10px' }}>
            Payment Details
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#e4e4e7', margin: 0 }}>Service Charges</p>
              {data.paymentNote && <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0 0' }}>{data.paymentNote}</p>}
            </div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', margin: 0 }}>₹{data.amount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '2px', background: '#3b82f6', margin: '4px 0 16px' }} />

        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '1px', color: '#06b6d4', margin: 0 }}>
            {isReceipt ? 'TOTAL PAID' : 'TOTAL DUE'}
          </p>
          <p style={{
            fontSize: '26px',
            fontWeight: 900,
            margin: 0,
            color: '#22c55e',
          }}>
            ₹{data.amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Status badge - fixed height, centered */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            display: 'inline-block',
            padding: '8px 24px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            lineHeight: '18px',
            background: data.status === 'paid' ? '#143d1e' : '#3d2e0a',
            color: data.status === 'paid' ? '#22c55e' : '#eab308',
            border: `1px solid ${data.status === 'paid' ? '#1a5c2a' : '#5c4a15'}`,
          }}>
            {data.status === 'paid' ? '✅ PAYMENT CONFIRMED' : '⏳ PAYMENT PENDING'}
          </div>
        </div>

        {/* Paid date */}
        {data.paidAt && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#71717a', margin: '0 0 12px' }}>
            {data.paidAt} • Status: {data.status === 'paid' ? 'Verified' : 'Pending Verification'}
          </p>
        )}
      </div>

      {/* Footer - solid background */}
      <div style={{
        background: '#1e3a5f',
        padding: '12px 28px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Bottom accent stripe */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: '#f97316',
        }} />
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#fff', margin: 0 }}>
          THANK YOU — THRYLOS INDIA 🚀
        </p>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', margin: '4px 0 0' }}>
          www.thrylosindia.in • support@thrylosindia.in
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
