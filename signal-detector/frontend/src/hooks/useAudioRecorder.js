import { useState, useRef } from 'react';

export const useAudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        audioChunks.current = [];
        return audioBlob;
      };

      mediaRecorder.current.start();
      setRecording(true);
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  };

  const stopRecording = () => {
    return new Promise((resolve) => {
      if (mediaRecorder.current && recording) {
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);
          audioChunks.current = [];
          setRecording(false);
          resolve(audioBlob);
        };
        mediaRecorder.current.stop();
      } else {
        resolve(null);
      }
    });
  };

  const resetRecording = () => {
    setRecording(false);
    setAudioURL('');
    audioChunks.current = [];
  };

  return {
    recording,
    audioURL,
    startRecording,
    stopRecording,
    resetRecording
  };
};

export default useAudioRecorder;