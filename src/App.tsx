import { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import './App.css'

// Declare the interval variable
declare global {
  interface Window {
    faceDetectionInterval?: NodeJS.Timeout;
  }
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isModelLoaded, setIsModelLoaded] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [detectionEnabled, setDetectionEnabled] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    expression?: string,
    count: number
  }>({ count: 0 })
  const [detectedFaces, setDetectedFaces] = useState(0)
  const [faceExpressions, setFaceExpressions] = useState<faceapi.FaceExpressions | null>(null)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null)
        setLoadingProgress(0)
        
        // Load each model with progress tracking
        const models = [
          { name: 'Tiny Face Detector', load: () => faceapi.nets.tinyFaceDetector.loadFromUri('/models') },
          { name: 'Face Landmarks', load: () => faceapi.nets.faceLandmark68Net.loadFromUri('/models') },
          { name: 'Face Recognition', load: () => faceapi.nets.faceRecognitionNet.loadFromUri('/models') },
          { name: 'Face Expressions', load: () => faceapi.nets.faceExpressionNet.loadFromUri('/models') }
        ]

        for (let i = 0; i < models.length; i++) {
          try {
            console.log(`Loading ${models[i].name}...`)
            await models[i].load()
            console.log(`Successfully loaded ${models[i].name}`)
            setLoadingProgress(((i + 1) / models.length) * 100)
          } catch (err) {
            console.error(`Error loading ${models[i].name}:`, err)
            setError(`Failed to load ${models[i].name} model. Please check if all model files are present in the public/models directory.`)
            return
          }
        }

        setIsModelLoaded(true)
        console.log('All models loaded successfully')
      } catch (error) {
        console.error('Error loading models:', error)
        setError('Failed to load AI models. Please try refreshing the page.')
      }
    }

    loadModels()
  }, [])

  const startVideo = async () => {
    try {
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 720,
          height: 560,
          facingMode: 'user'
        } 
      })
      console.log('Camera access granted')
      
      if (videoRef.current) {
        console.log('Setting up video element')
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          videoRef.current?.play()
        }
        setIsCameraOn(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setError('Failed to access camera. Please make sure you have granted camera permissions.')
    }
  }

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraOn(false)
      setDetectionEnabled(false)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }

  const handleVideoOnPlay = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const displaySize = { width: video.width, height: video.height }
      
      // Set canvas size to match video
      canvas.width = displaySize.width
      canvas.height = displaySize.height

      // Create a new detection interval
      const detectionInterval = setInterval(async () => {
        try {
          if (!isModelLoaded) {
            console.log('Models not loaded yet, skipping detection')
            return
          }

          // Detect faces with more detailed options
          const detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 512,
              scoreThreshold: 0.5
            })
          )
          .withFaceLandmarks()
          .withFaceExpressions()
          .withFaceDescriptors()

          // Clear previous drawings
          const context = canvas.getContext('2d')
          if (!context) {
            console.error('Could not get canvas context')
            return
          }
          context.clearRect(0, 0, canvas.width, canvas.height)

          // Draw detections
          const resizedDetections = faceapi.resizeResults(detections, displaySize)
          faceapi.draw.drawDetections(canvas, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
          faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

          // Update state
          setDetectedFaces(detections.length)
          if (detections.length > 0) {
            setFaceExpressions(detections[0].expressions)
          } else {
            setFaceExpressions(null)
          }

        } catch (error) {
          console.error('Error during face detection:', error)
          // Don't set error state here to avoid UI flicker
        }
      }, 100) // Run detection every 100ms

      // Store interval ID for cleanup
      setIntervalId(detectionInterval)

    } catch (error) {
      console.error('Error setting up face detection:', error)
      setError('Failed to start face detection. Please try refreshing the page.')
    }
  }

  // Add cleanup for interval
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [intervalId])

  return (
    <div className="app-container">
      <div className="glass-container">
        <h1 className="title">✨ AI Face Detective ✨</h1>
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Try Again
            </button>
          </div>
        )}

        <div className="stats-container">
          {detectedFaces > 0 && (
            <>
              <div className="stat-item">
                <span className="stat-label">Mood:</span>
                <span className="stat-value">{faceExpressions ? Object.entries(faceExpressions).reduce((a, b) => a[1] > b[1] ? a : b)[0] : 'No expression detected'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Faces:</span>
                <span className="stat-value">{detectedFaces}</span>
              </div>
            </>
          )}
        </div>

        <div className="controls">
          <button
            onClick={startVideo}
            className="btn btn-primary"
            disabled={isCameraOn}
          >
            Start Camera
          </button>
          <button
            onClick={stopVideo}
            className="btn btn-danger"
            disabled={!isCameraOn}
          >
            Stop Camera
          </button>
          <button
            onClick={handleVideoOnPlay}
            className="btn btn-success"
            disabled={!isCameraOn || !isModelLoaded || detectionEnabled}
          >
            Detect Faces
          </button>
        </div>

        <div className="video-container" style={{ position: 'relative', width: '720px', height: '560px' }}>
          <video
            ref={videoRef}
            width="720"
            height="560"
            autoPlay
            muted
            playsInline
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <canvas
            ref={canvasRef}
            width="720"
            height="560"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }}
          />
        </div>

        {!isModelLoaded && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              Loading AI magic... ✨
              <div className="loading-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{Math.round(loadingProgress)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App 