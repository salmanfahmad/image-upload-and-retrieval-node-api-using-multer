# Node.js File Upload API

This project is a Node.js API that allows users to upload images to the server and retrieve them. The API uses `express` for handling HTTP requests, `multer` for handling file uploads, and `path` and `fs` for managing file paths and file system operations.

## Features

- Upload images with a file size limit of 10MB.
- Retrieve uploaded images.
- Returns the full URL of the uploaded file.

## Requirements

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/node-file-upload-api.git
    ```

2. Navigate to the project directory:
    ```bash
    cd node-file-upload-api
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

## Usage

1. Start the server:
    ```bash
    npm start
    ```

    The server will start running on `http://localhost:8009`.

2. Upload an image:

    - Endpoint: `POST /upload`
    - Form data:
      - `image`: The image file to upload

    Example using `curl`:
    ```bash
    curl -F "image=@/path/to/your/image.png" http://localhost:8009/upload
    ```

    Example response:
    ```json
    {
      "success": true,
      "message": "File uploaded successfully",
      "filename": "image-1625648372176-123456789.png",
      "path": "http://localhost:8009/uploads/image-1625648372176-123456789.png"
    }
    ```

3. Retrieve an image:

    - Endpoint: `GET /uploads/:filename`

    Example:
    ```bash
    curl http://localhost:8009/uploads/image-1625648372176-123456789.png
    ```

    This will return the requested image file.

## File Structure

node-file-upload-api/

├── uploads/ # Directory where uploaded files are stored

├── aoo.js # Main server file

├── package.json # Project configuration and dependencies

├── README.md # This file

## API Endpoints

### POST /upload

Uploads an image to the server.

#### Request

- `Content-Type`: `multipart/form-data`
- Form data:
  - `image`: The image file to upload

#### Response

- `201 Created`: File uploaded successfully
  ```json
    {
      "success": true,
      "message": "File uploaded successfully",
      "filename": "image-1625648372176-123456789.png",
      "path": "http://localhost:8009/uploads/image-1625648372176-123456789.png"
    }
  ```
- `400 Bad Request`: No file uploaded
  ```json
   {
    "success": false,
    "message": "No file uploaded"
   }
  ```
- `500 Internal Server Error`: Error uploading file
  ```json
   {
      "success": false,
      "message": "Error uploading file"
    }
  ```

## GET /uploads/:filename
Retrieves an uploaded image.

### Response
- `200 OK`: Returns the requested image file.
- `404 Not Found`: File not found
```json
  {
    "success": false,
    "message": "File not found"
  }
```
- `500 Internal Server Error`: Error retrieving image
```json
  {
    "success": false,
    "message": "Error retrieving image"
  }
```
