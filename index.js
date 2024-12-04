const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;
const URL = process.env.URL || `http://localhost:${PORT}`; // without trailing slash
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"; // Set the admin username
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password"; // Set the admin password

// Set up the template engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

// File filter for allowed extensions
const filetypes =
  /jpeg|jpg|png|gif|bmp|webp|svg|ico|tiff|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|mp3|wav|aac|flac|ogg|m4a|mp4|avi|mkv|mov|wmv|webm|flv|zip|rar|7z|tar|gz|html|htm|css|js|json|xml|csv|yaml|yml|md/;

const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true); // Allow file upload
  } else {
    return cb(
      new Error(
        "Error: Invalid file type. Allowed types are: " + filetypes.source
      )
    ); // Error message for invalid file types
  }
};


const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize Multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: process.env.MAX_FILE_SIZE || 500000000 }, // default 500000000 bytes (500 MB)
  fileFilter: fileFilter, // Use the file filter
}).single("myFile"); // Note: "myFile" should match the name attribute in the HTML form

// Set static folder
app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Authentication
app.use((req, res, next) => {
  try {
    const auth = req.headers.authorization; // Check for the Authorization header

    if (!auth) {
      res.setHeader("WWW-Authenticate", "Basic realm='Secure Area'");
      return res.status(401).send("Authentication required");
    }

    // Decode Base64 credentials
    const credentials = Buffer.from(auth.split(" ")[1], "base64").toString();
    const [username, password] = credentials.split(":");

    // Check if the username and password are correct
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      next();
    } else {
      res.setHeader("WWW-Authenticate", "Basic realm='Secure Area'");
      return res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    console.log(error);
  }
});


// Upload route
app.get("/upload", (req, res) => {
  try {
    return res.sendFile(path.join(__dirname, "views", "upload.html"));
  } catch (error) {
    console.log(error);
  }
});

// POST route for file upload
app.post("/upload", (req, res) => {
  try {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ ok: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ ok: false, message: "Error: No File Selected!" });
      }

      const description = req.body.description || "No description provided";

      // Define the directory for storing descriptions
      const descriptionDir = path.join(__dirname, "public", "uploads", "descriptions");

      // Ensure the directory exists
      ensureDirectoryExists(descriptionDir);

      // Define the description file path
      const descriptionFilePath = path.join(
        descriptionDir,
        req.file.filename.replace(path.extname(req.file.filename), ".txt")
      );

      // Send response early to avoid duplicate responses
      res.status(200).json({
        ok: true,
        url: `${URL}/uploads/${req.file.filename}`,
      });

      // Write the description to the file
      fs.writeFile(descriptionFilePath, description, (writeErr) => {
        if (writeErr) {
          console.error("Error creating description file:", writeErr);
        }
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Server error occurred during file upload.",
    });
  }
});


// get files with table
app.get("/files", (req, res) => {
  try {
    return res.sendFile(path.join(__dirname, "views", "files.html"));
  } catch (error) {
    console.log(error);
  }
});

// REST API


// Get all files /api/files
app.get("/api/files", (req, res) => {
  try {
    fs.readdir("./public/uploads", (err, files) => {
      if (err) {
        return res
          .status(500)
          .json({ ok: false, message: "Error: Server error" });
      }

      const fileArray = [];

      files.forEach((file) => {
        if (file == "descriptions") return;
        // For each file, check if there's a corresponding description file
        const descriptionFilePath = path.join(
          __dirname,
          "public",
          "uploads",
          "descriptions",
          file.replace(path.extname(file), ".txt")
        );

        // Read the description file content if it exists
        let description = "No description available";
        if (fs.existsSync(descriptionFilePath)) {
          description = fs.readFileSync(descriptionFilePath, "utf-8");
        }

        fileArray.push({
          name: file,
          url: `${URL}/uploads/${file}`,
          description: description,
        });
      });

      res.status(200).json({ ok: true, files: fileArray });
    });
  } catch (error) {
    console.log(error);
  }
});

// delete file /api/files/:filename
app.delete("/api/files/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Paths to the file and description file
      const filePath = path.join(__dirname, "public", "uploads", filename);
      const descriptionFilePath = path.join(
        __dirname,
        "public",
        "uploads",
        "descriptions",
        filename.replace(path.extname(filename), ".txt")
      );
  
      // Delete the main file
      fs.unlink(filePath, (err) => {
        if (err) {
          return res.status(500).json({ ok: false, message: "Error: Server error" });
        }
  
        // Do not delete the description file, leave it as is
        fs.unlink(descriptionFilePath, (err) => {
          if (err) {
            console.error("Error deleting description file:", err);
          }
        });
  
        // Send the response after successfully deleting the main file
        res.status(200).json({ ok: true, message: "File deleted successfully" });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ ok: false, message: "Error: Server error" });
    }
  });
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server running inner port ${PORT}, URL: ${URL}`);
});
