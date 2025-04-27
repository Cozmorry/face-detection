# Face Detection WebApp

A modern web application for face detection and recognition using React, TypeScript, and TensorFlow.js.

## Features

- Real-time face detection using webcam
- Face landmark detection
- Face recognition and matching
- Modern UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or connection string)
- Webcam access

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/face-detection
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Download face-api.js models:
   - Create a `public/models` directory
   - Download the following models from [face-api.js models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights):
     - tiny_face_detector_model-weights_manifest.json
     - tiny_face_detector_model-shard1
     - face_landmark_68_model-weights_manifest.json
     - face_landmark_68_model-shard1
     - face_recognition_model-weights_manifest.json
     - face_recognition_model-shard1

## Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm install
   npm start
   ```

2. Start the frontend development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Click "Start Camera" to enable your webcam
2. Click "Detect Faces" to start face detection
3. The application will detect faces in real-time and draw landmarks
4. To stop, click "Stop Camera"

## License

MIT 