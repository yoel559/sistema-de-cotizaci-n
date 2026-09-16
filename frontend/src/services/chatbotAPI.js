import api from './api';

export const chatbotAPI = {
  /**
   * Verifica el estado de la conexión con Ollama
   */
  getStatus: async () => {
    return await api.get('/api/v1/chatbot/status');
  },

  /**
   * Obtiene la lista de modelos disponibles
   */
  getModels: async () => {
    return await api.get('/api/v1/chatbot/models');
  },

  /**
   * Envía un mensaje al chatbot (respuesta completa)
   */
  sendMessage: async (message, model = null, context = null) => {
    return await api.post('/api/v1/chatbot/chat', {
      message,
      model,
      context
    });
  },

  /**
   * Crea una conexión WebSocket para streaming
   */
  createStreamConnection: (message, model = null, context = null, onChunk, onComplete, onError) => {
    // Determinar la URL del WebSocket
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Obtener la URL base de la API
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    const wsHost = apiBaseUrl.replace('http://', '').replace('https://', '');
    const wsUrl = `${wsProtocol}//${wsHost}/api/v1/chatbot/chat/stream`;
    
    const ws = new WebSocket(wsUrl);
    const token = localStorage.getItem('token');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        token, // Enviar token para autenticación
        message,
        model,
        context
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          onError?.(data.error);
        } else if (data.done) {
          onComplete?.(data.full_message || '');
          ws.close();
        } else {
          onChunk?.(data.chunk || '');
        }
      } catch (error) {
        onError?.(error.message);
      }
    };

    ws.onerror = (error) => {
      onError?.('Error de conexión WebSocket');
      ws.close();
    };

    ws.onclose = () => {
      // Conexión cerrada
    };

    return ws;
  }
};

export default chatbotAPI;

