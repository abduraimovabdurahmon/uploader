
---

# File Upload Service

This project provides a file upload service where users can upload files, get a static link for them, and associate a description with each file. It is designed to be run with Docker for easy deployment and configuration.

## 1. Quick Start with Docker

Alternatively, you can run the service using the following Docker `run` command without using Docker Compose.

```bash
docker run -it -p 4000:3000 \
-e ADMIN_USERNAME=admin \
-e ADMIN_PASSWORD=password \
-e URL=http://localhost:4000 \
-e MAX_FILE_SIZE=500000000 \
-v ./public/uploads:/app/public/uploads \
jomiy/uploader
```

Explanation:
- **-it**: Runs the container in interactive mode.
- **-p 4000:3000**: Maps the container's port 3000 to your local machine's port 4000.
- **-e ADMIN_USERNAME=admin**: Sets the admin username.
- **-e ADMIN_PASSWORD=password**: Sets the admin password.
- **-e URL=http://localhost:4000**: Specifies the service URL.
- **-e MAX_FILE_SIZE=500000000**: Sets the maximum file size (500 MB by default).
- **-v ./public/uploads:/app/public/uploads**: Maps the `uploads` directory on your local machine to the container, ensuring file persistence.

Once the container is running, the service will be available at `http://localhost:4000/upload`.



---


## 2. Installation and Running via Docker Compose

### Step 1: Clone the GitHub Repository

First, download the source code from the GitHub repository:

```bash
git clone https://github.com/abduraimovabdurahmon/uploader.git
cd uploader
```

### Step 2: Modify the `docker-compose.yml` File

Before running the service, you may need to modify the `docker-compose.yml` file to match your environment settings. Specifically:

- **ADMIN_USERNAME**: Set the admin username.
- **ADMIN_PASSWORD**: Set the admin password.
- **URL**: Specify the URL or IP address where the service will be accessible.
- **MAX_FILE_SIZE**: Set the maximum file upload size in bytes (default is 500 MB).

Example `docker-compose.yml` snippet:

```yaml
services:
  web:
    build: . # or image: jomiy/uploader
    ports:
      - "4000:3000"
    environment:
      - ADMIN_USERNAME=admin  # Set the admin username
      - ADMIN_PASSWORD=password # Set the admin password
      - URL=http://localhost:4000 # The URL for the service
      - MAX_FILE_SIZE=500000000  # The maximum file size allowed (in bytes)
    volumes:
      - ./public/uploads:/app/public/uploads  # Volume to persist uploaded files
```

### Step 3: Run Docker Compose

Once you have updated the `docker-compose.yml` file, you can start the service using Docker Compose:

```bash
docker-compose up -d
```

This will build the Docker image and start the container with the appropriate configuration. The application will be accessible at `http://localhost:4000/upload`.

---

## 3. Available Routes

### `/upload`

- **Method**: GET, POST
- **Description**: This route allows users to upload files.
- **POST Request**: Sends a file and its description.
  - Required fields:
    - `myFile`: The file to upload.
    - `description`: A description for the file (optional).
  - **Response**: Returns a JSON object with the file URL.
  
  Example response:
  ```json
  {
    "ok": true,
    "url": "http://localhost:4000/uploads/abc123.jpg"
  }
  ```

### Here is an example of sending a file to this service with nodejs and getting a static link for it:

---

Install dependencies
```
npm install axios form-data
```
Example Node.js code to send a POST request to /upload route
```js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Path to the file you want to upload
const filePath = './image.jpg';

// Description for the file
const description = 'This is an image file for upload';

// Create a FormData instance and append the file and description
const form = new FormData();
form.append('myFile', fs.createReadStream(filePath));  // Attach file
form.append('description', description);  // Attach description

// Basic Authentication credentials
const username = 'admin'; // Replace with your actual admin username
const password = 'password'; // Replace with your actual admin password

// Send POST request to /upload with authentication
axios
  .post('http://localhost:4000/upload', form, {
    headers: {
      ...form.getHeaders(), // Automatically set the correct Content-Type
      'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  })
  .then((response) => {
    console.log('File uploaded successfully:', response.data);
  })
  .catch((error) => {
    console.error('Error uploading file:', error.response ? error.response.data : error.message);
  });


```

## 4. How It Works

1. **Upload a File**: Send a POST request to the `/upload` route, either via the web form or API.
   - The form will require you to upload a file and provide an optional description.
   - After submitting, the file is stored in the `/public/uploads` directory, and a description file is created in the `/public/uploads/descriptions` directory.

2. **Get a Static Link**: After uploading, the system returns a URL for the uploaded file, which can be used to access it.

   Example:
   ```
   http://localhost:4000/uploads/abc123.jpg
   ```

3. **File Management**: Admin can view all uploaded files and their descriptions by sending a request to the `/files` endpoint.

---

## 5. Using Docker Volumes

Volumes are used to persist data between Docker container restarts. This project uses a volume to store uploaded files. By default, the volume is mounted at:

```
./public/uploads:/app/public/uploads
```

This means that the `./public/uploads` directory on your local machine will be mapped to the `/app/public/uploads` directory inside the container. This setup ensures that the uploaded files are stored outside the container and remain persistent even if the container is stopped or removed.

### Tips for Using Volumes:

- **Keep Files Persistent**: Always map the `./public/uploads` directory to a location on your local machine or a remote storage service to ensure files are not lost when the container is stopped.
- **Backup Your Files**: Regularly back up the contents of the `./public/uploads` directory to avoid data loss.

---



