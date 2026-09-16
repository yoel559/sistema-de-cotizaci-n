import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  return format(dateObj, formatStr, { locale: es });
};

export const formatDateTime = (date, formatStr = 'dd/MM/yyyy HH:mm') => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  return format(dateObj, formatStr, { locale: es });
};

export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: es 
  });
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPhoneNumber = (phone) => {
  if (!phone) return '-';
  
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const formatPercentage = (value, total) => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

export const formatStatus = (status) => {
  const statusMap = {
    draft: 'Borrador',
    sent: 'Enviada',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
    expired: 'Expirada',
  };
  
  return statusMap[status] || status;
};

export const formatPriority = (priority) => {
  const priorityMap = {
    low: 'Baja',
    normal: 'Normal',
    high: 'Alta',
    critical: 'Crítica',
  };
  
  return priorityMap[priority] || priority;
};
