const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Multer configuration with file size limit and destination
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');

    cb(null, uploadPath); // Uploads folder where images will be stored
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

    cb(null, `${file.fieldname}-${uniqueSuffix}`); // Unique filename
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// API endpoint to handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {
  try {


    if (!req.file) {

      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const filename = req.file.filename;
    const fileUrl = `${protocol}://${host}/uploads/${filename}`;


    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: fileUrl
    });
  } catch (error) {

    return res.status(500).json({ success: false, message: 'Error uploading file' });
  }
});

// API endpoint to serve uploaded images
app.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);


    if (!fs.existsSync(filePath)) {

      return res.status(404).json({ success: false, message: 'File not found' });
    }


    res.sendFile(filePath);
  } catch (error) {

    return res.status(500).json({ success: false, message: 'Error retrieving image' });
  }
});

// Start the server
const PORT = process.env.PORT || 8009;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
