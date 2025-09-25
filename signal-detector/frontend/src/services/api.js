// services/api.js
const API_BASE_URL = '/api';

export const api = {
  // Transcribe audio
  transcribeAudio: async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Classify activity by text
  classifyActivity: async (activity) => {
    const response = await fetch(`${API_BASE_URL}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activity),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Get insights for a user
  getUserInsights: async (userId, goalIds = null) => {
    const requestBody = { userId };
    if (goalIds && goalIds.length > 0) {
      requestBody.goalIds = goalIds;
    }
    
    const response = await fetch(`${API_BASE_URL}/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Get top goals by signal count
  getTopGoals: async (userId, timeframe = 'week') => {
    const response = await fetch(`${API_BASE_URL}/top-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, timeframe }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Suggest related goals
  suggestRelatedGoals: async (activityDescription, selectedGoalIds, userId) => {
    const response = await fetch(`${API_BASE_URL}/suggest-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activityDescription, selectedGoalIds, userId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

export default api;