const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Parse JSON bodies
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

// Check if file is APK
const isAPKFile = (file) => {
  return file.mimetype === 'application/vnd.android.package-archive' ||
    file.originalname.toLowerCase().endsWith('.apk');
};

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  const allowedDocumentTypes = ['application/pdf'];

  // Check if file is APK or other allowed type
  if (isAPKFile(file) ||
    allowedImageTypes.includes(file.mimetype) ||
    allowedVideoTypes.includes(file.mimetype) ||
    allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, MP4, MPEG, MOV, AVI, PDF, and APK files are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: Infinity }
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Size validation middleware
const validateFileSize = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // Get the uploaded file from either field
    const uploadedFile = req.files?.file?.[0] || req.files?.image?.[0];

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Skip size validation for APK files
    if (isAPKFile(uploadedFile)) {
      return next();
    }

    const fileSize = uploadedFile.size;
    const isImage = uploadedFile.mimetype.startsWith('image/');
    const maxImageSize = 10 * 1024 * 1024; // 10MB for images
    const maxOtherSize = 15 * 1024 * 1024; // 15MB for videos/PDFs

    // Check size limits
    if ((isImage && fileSize > maxImageSize) || (!isImage && fileSize > maxOtherSize)) {
      // Delete the file that exceeded the limit
      fs.unlinkSync(uploadedFile.path);

      const limit = isImage ? maxImageSize : maxOtherSize;
      return res.status(400).json({
        success: false,
        message: `File size (${formatFileSize(fileSize)}) exceeds the limit (${formatFileSize(limit)})`,
        actualSize: fileSize,
        formattedSize: formatFileSize(fileSize),
        maxSize: limit,
        formattedMaxSize: formatFileSize(limit)
      });
    }

    next();
  });
};

// API endpoint to handle file uploads
app.post('/upload', validateFileSize, (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');

  // Get the uploaded file from either field
  const uploadedFile = req.files?.file?.[0] || req.files?.image?.[0];
  const filename = uploadedFile.filename;
  const fileUrl = `${protocol}://${host}/uploads/${filename}`;

  let fileType = 'image';
  if (uploadedFile.mimetype.startsWith('video/')) fileType = 'video';
  if (uploadedFile.mimetype === 'application/pdf') fileType = 'pdf';
  if (isAPKFile(uploadedFile)) fileType = 'apk';

  return res.status(201).json({
    success: true,
    message: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} uploaded successfully`,
    filename: filename,
    path: fileUrl,
    size: uploadedFile.size,
    formattedSize: formatFileSize(uploadedFile.size),
    mimetype: uploadedFile.mimetype,
    type: fileType,
    field: req.files?.file ? 'file' : 'image'
  });
});

// API endpoint to serve uploaded files
app.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error retrieving file',
      error: error.message
    });
  }
});

// API endpoint to delete uploaded files
app.post('/delete', (req, res) => {
  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required in request body'
      });
    }

    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully',
      filename: filename
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something broke!',
    error: err.message
  });
});

// Start the server
const PORT = process.env.PORT || 8009;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});