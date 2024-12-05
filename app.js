const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

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

// Multer configuration with file size limit and destination
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

// File filter to validate file types and size limits
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];

  // Check if the file type is allowed
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, MP4, MPEG, MOV, and AVI files are allowed.'), false);
  }
};

// Custom file size checker middleware
const fileSizeChecker = (req, res, next) => {
  return (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          const actualSize = parseInt(req.headers['content-length']) || 0;
          return res.status(400).json({
            success: false,
            message: `File size (${formatFileSize(actualSize)}) exceeds the limit (10MB for images, 15MB for videos)`,
            actualSize: actualSize,
            formattedSize: formatFileSize(actualSize),
            maxSize: 15 * 1024 * 1024,
            formattedMaxSize: formatFileSize(15 * 1024 * 1024)
          });
        }
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
      next();
    });
  };
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // Setting max limit to 15MB (for videos)
  },
  fileFilter: fileFilter
});

// Size validation middleware
const validateFileSize = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const isImage = req.file.mimetype.startsWith('image/');
  const fileSize = req.file.size;
  const maxImageSize = 10 * 1024 * 1024; // 10MB for images

  if (isImage && fileSize > maxImageSize) {
    // Delete the file that exceeded the limit
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: `Image size (${formatFileSize(fileSize)}) exceeds the 10MB limit`,
      actualSize: fileSize,
      formattedSize: formatFileSize(fileSize),
      maxSize: maxImageSize,
      formattedMaxSize: formatFileSize(maxImageSize)
    });
  }

  next();
};

// API endpoint to handle file uploads
app.post('/upload', fileSizeChecker(), validateFileSize, (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const filename = req.file.filename;
  const fileUrl = `${protocol}://${host}/uploads/${filename}`;
  const isVideo = req.file.mimetype.startsWith('video/');

  return res.status(201).json({
    success: true,
    message: `${isVideo ? 'Video' : 'Image'} uploaded successfully`,
    filename: filename,
    path: fileUrl,
    size: req.file.size,
    formattedSize: formatFileSize(req.file.size),
    mimetype: req.file.mimetype,
    type: isVideo ? 'video' : 'image'
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

// Start the server
const PORT = process.env.PORT || 8009;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // console.log(`Image size limit: ${formatFileSize(10 * 1024 * 1024)}`);
  // console.log(`Video size limit: ${formatFileSize(15 * 1024 * 1024)}`);
  // console.log(`Uploads directory: ${uploadPath}`);
});