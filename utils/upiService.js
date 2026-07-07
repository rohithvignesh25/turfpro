const QRCode = require('qrcode');

// Default UPI configurations from user specifications or environment variables
const DEFAULT_UPI_VPA = process.env.UPI_PAYEE_VPA || 'rohithvignesh2-1@oksbi';
const DEFAULT_UPI_NAME = process.env.UPI_PAYEE_NAME || 'turfpro';

/**
 * Generate standard UPI Deep Link URI
 * @param {Object} params
 * @param {number|string} [params.amount] - Transaction amount in INR
 * @param {string} [params.note] - Transaction note / purpose
 * @param {string} [params.transactionRef] - Unique transaction reference ID
 * @param {string} [params.payeeVpa] - Custom Payee VPA if overriding default
 * @param {string} [params.payeeName] - Custom Payee Name if overriding default
 * @returns {string} Standard UPI URI scheme string
 */
const generateUpiUri = ({
  amount,
  note = 'TurfPro Payment',
  transactionRef,
  payeeVpa = DEFAULT_UPI_VPA,
  payeeName = DEFAULT_UPI_NAME
} = {}) => {
  let uri = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

  if (amount !== undefined && amount !== null && amount !== '') {
    const formattedAmount = Number(amount).toFixed(2);
    if (!isNaN(formattedAmount) && Number(formattedAmount) > 0) {
      uri += `&am=${formattedAmount}`;
    }
  }

  if (note) {
    uri += `&tn=${encodeURIComponent(note)}`;
  }

  if (transactionRef) {
    uri += `&tr=${encodeURIComponent(transactionRef)}`;
  }

  return uri;
};

/**
 * Generate UPI QR Code as Base64 Data URL (data:image/png;base64,...)
 * @param {Object} params - Same params as generateUpiUri
 * @returns {Promise<Object>} Object containing { upiUri, qrCodeDataUrl }
 */
const generateUpiQrCode = async (params = {}) => {
  try {
    const upiUri = generateUpiUri(params);
    const qrCodeDataUrl = await QRCode.toDataURL(upiUri, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    return {
      success: true,
      upiUri,
      qrCodeDataUrl,
      payeeVpa: params.payeeVpa || DEFAULT_UPI_VPA,
      payeeName: params.payeeName || DEFAULT_UPI_NAME,
      amount: params.amount ? Number(params.amount).toFixed(2) : null
    };
  } catch (error) {
    console.error('Error generating UPI QR Code:', error);
    throw new Error('Failed to generate UPI QR Code image');
  }
};

module.exports = {
  generateUpiUri,
  generateUpiQrCode,
  DEFAULT_UPI_VPA,
  DEFAULT_UPI_NAME
};
