import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiSquare, FiSend } from 'react-icons/fi';

const WebSocketTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const wsRef = useRef(null);

  const connect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('🧪 Conectando a WebSocket de prueba...');
    const ws = new WebSocket('ws://localhost:8000/api/v1/ws/test');

    ws.onopen = () => {
      console.log('✅ WebSocket de prueba conectado');
      setIsConnected(true);
      addMessage('Sistema', 'Conectado al servidor WebSocket', 'success');
    };

    ws.onmessage = (event) => {
      console.log('📨 Mensaje recibido:', event.data);
      try {
        const data = JSON.parse(event.data);
        addMessage('Servidor', JSON.stringify(data, null, 2), 'received');
      } catch (e) {
        addMessage('Servidor', event.data, 'received');
      }
    };

    ws.onclose = (event) => {
      console.log('🔌 WebSocket cerrado:', event.code, event.reason);
      setIsConnected(false);
      addMessage('Sistema', `Desconectado (código: ${event.code})`, 'error');
    };

    ws.onerror = (error) => {
      console.error('❌ Error WebSocket:', error);
      addMessage('Sistema', 'Error de conexión', 'error');
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && inputMessage.trim()) {
      wsRef.current.send(inputMessage);
      addMessage('Cliente', inputMessage, 'sent');
      setInputMessage('');
    }
  };

  const addMessage = (from, content, type) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages(prev => [...prev, { from, content, type, timestamp }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Prueba WebSocket</h1>

        {/* Controles */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={connect}
            disabled={isConnected}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isConnected
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <FiPlay className="w-4 h-4" />
            <span>Conectar</span>
          </button>

          <button
            onClick={disconnect}
            disabled={!isConnected}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              !isConnected
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <FiSquare className="w-4 h-4" />
            <span>Desconectar</span>
          </button>

          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            isConnected
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>

        {/* Input de mensaje */}
        <div className="flex items-center space-x-2 mb-6">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un mensaje para enviar..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
              !isConnected || !inputMessage.trim()
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <FiSend className="w-4 h-4" />
            <span>Enviar</span>
          </button>
        </div>

        {/* Mensajes */}
        <div className="bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Mensajes</h2>
          {messages.length === 0 ? (
            <p className="text-gray-400">No hay mensajes aún. Conecta y envía un mensaje.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${
                  msg.type === 'sent'
                    ? 'bg-blue-600/20 border-l-4 border-blue-600'
                    : msg.type === 'received'
                    ? 'bg-green-600/20 border-l-4 border-green-600'
                    : msg.type === 'error'
                    ? 'bg-red-600/20 border-l-4 border-red-600'
                    : 'bg-gray-700/50'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{msg.from}</span>
                    <span className="text-xs text-gray-400">{msg.timestamp}</span>
                  </div>
                  <pre className="text-sm whitespace-pre-wrap font-mono">{msg.content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información de debug */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🔍 Información de Debug</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <p><strong>Endpoint:</strong> ws://localhost:8000/api/v1/ws/test</p>
            <p><strong>Estado:</strong> {isConnected ? 'Conectado' : 'Desconectado'}</p>
            <p><strong>Mensajes:</strong> {messages.length}</p>
            <p><strong>WebSocket ReadyState:</strong> {wsRef.current?.readyState ?? 'N/A'}</p>
          </div>
          <button
            onClick={() => console.log('🔍 Debug Info:', {
              isConnected,
              messages,
              wsState: wsRef.current?.readyState,
              wsUrl: wsRef.current?.url
            })}
            className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Mostrar en Consola
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebSocketTest;
