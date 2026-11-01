import '@testing-library/jest-dom';

// Mock html2canvas for tests
global.html2canvas = async () => ({
  toBlob: (cb) => {
    const blob = new Blob(['mock-image-data'], { type: 'image/png' });
    cb(blob);
  },
});

// Mock URL.createObjectURL and revokeObjectURL
if (!global.URL.createObjectURL) {
  global.URL.createObjectURL = () => 'blob:mock-preview-url';
}
if (!global.URL.revokeObjectURL) {
  global.URL.revokeObjectURL = () => {};
}

