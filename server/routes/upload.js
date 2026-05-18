const express = require('express');
const multer = require('multer');
const path = require('path');
const { auth } = require('../middleware/auth');

const router = express.Router();

const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images, documents, and text files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // For text files, check extension since mimetype might be generic
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, document, and text files are allowed'));
    }
  }
});

const profilePhotoUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');

    if (extname && mimetype) {
      return cb(null, true);
    }

    cb(new Error('Only image files are allowed'));
  }
});

const handleMulterError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
<<<<<<< HEAD
    let message = err.message;
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Check which upload route was used to provide specific limit
      const isProfilePhoto = req.route.path === '/profile-photo';
      const maxSize = isProfilePhoto ? '2MB' : '5MB';
      message = `Uploaded file is too large. Maximum size allowed is ${maxSize}.`;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = `Too many files uploaded. Maximum allowed is 5 files.`;
    }
    
=======
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded file is too large'
      : err.message;
>>>>>>> 0a6fcf6b (changes made in the project on teacher's side)
    return res.status(400).json({ message });
  }

  return res.status(400).json({ message: err.message || 'Upload failed' });
};

// Upload single file
router.post('/single', auth, upload.single('file'), handleMulterError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: `/uploads/${req.file.filename}`,
        url: getFileUrl(req, req.file.filename)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'File upload failed' });
  }
});

router.post('/profile-photo', auth, profilePhotoUpload.single('photo'), handleMulterError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    res.json({
      message: 'Profile photo uploaded successfully',
      photo: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: `/uploads/${req.file.filename}`,
        url: getFileUrl(req, req.file.filename)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Profile photo upload failed' });
  }
});

// Upload multiple files
router.post('/multiple', auth, upload.array('files', 5), handleMulterError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/${file.filename}`,
      url: getFileUrl(req, file.filename)
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: files
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Files upload failed' });
  }
});

module.exports = router;
