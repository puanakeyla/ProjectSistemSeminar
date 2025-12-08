/**
 * Convert relative file path to full URL
 * @param {string} fileUrl - The file URL (can be relative or absolute)
 * @returns {string} - Full URL with protocol and domain
 */
export const getFullFileUrl = (fileUrl) => {
  if (!fileUrl) return '';

  // If already a full URL (starts with http/https), return as is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  // Otherwise, prepend the API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Ensure fileUrl starts with /
  const path = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;

  return `${API_BASE_URL}${path}`;
};

/**
 * Open file in new tab
 * @param {string} fileUrl - The file URL to open
 */
export const openFile = (fileUrl) => {
  if (fileUrl) {
    window.open(getFullFileUrl(fileUrl), '_blank', 'noopener,noreferrer');
  }
};

/**
 * Download file
 * @param {string} fileUrl - The file URL to download
 * @param {string} fileName - Optional filename for download
 */
export const downloadFile = (fileUrl, fileName = 'download.pdf') => {
  if (fileUrl) {
    const fullUrl = getFullFileUrl(fileUrl);
    const a = document.createElement('a');
    a.href = fullUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
