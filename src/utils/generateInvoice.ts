import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateInvoicePNG = async (element: HTMLElement, filename: string): Promise<void> => {
  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: '#0a0a0f',
    useCORS: true,
    logging: false,
    allowTaint: true,
    removeContainer: true,
  });
  
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const generateInvoicePDF = async (element: HTMLElement, filename: string): Promise<void> => {
  const canvas = await html2canvas(element, {
    scale: 3,
    backgroundColor: '#0a0a0f',
    useCORS: true,
    logging: false,
    allowTaint: true,
    removeContainer: true,
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  
  // A4 dimensions in mm
  const pdfWidth = 210;
  const pdfHeight = (imgHeight * pdfWidth) / imgWidth;
  
  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfWidth, pdfHeight],
  });
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
};
