import multer from "multer";

//takes the file from frontend and stores temporarily in disk and after uploads in cloudinary
const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

export default upload;
