import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiX, FiMessageCircle, FiLoader, FiMic, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { chatbotAPI } from '../services/chatbotAPI';
import toast from 'react-hot-toast';

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente virtual de Trebol Servicios Empresariales. ¿En qué puedo ayudarte hoy?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Verificar conexión al montar
  useEffect(() => {
    if (isOpen) {
      checkConnection();
      // Inicializar Web Speech API
      initSpeechRecognition();
      initSpeechSynthesis();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, [isOpen]);

  // Inicializar reconocimiento de voz (Speech-to-Text)
  const initSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Error en reconocimiento de voz:', event.error);
        setIsListening(false);
        toast.error('Error en reconocimiento de voz');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  // Inicializar síntesis de voz (Text-to-Speech)
  const initSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  };

  // Iniciar/Detener reconocimiento de voz
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Reconocimiento de voz no disponible en este navegador');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Leer mensaje en voz alta
  const speakText = (text) => {
    if (!synthRef.current || !textToSpeechEnabled) return;

    // Cancelar cualquier síntesis anterior
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Detener síntesis de voz
  const stopSpeaking = () => {
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  // Auto-scroll al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkConnection = async () => {
    try {
      const status = await chatbotAPI.getStatus();
      setIsConnected(status.data.connected);
      if (status.data.connected) {
        const models = await chatbotAPI.getModels();
        setAvailableModels(models.data.models || []);
        setSelectedModel(status.data.default_model || (models.data.models && models.data.models[0]));
        
        if (!models.data.models || models.data.models.length === 0) {
          toast.error('Ollama está conectado pero no hay modelos. Ejecuta: ollama pull llama3', {
            duration: 8000
          });
        }
      } else {
        toast.error('Ollama no está disponible. Verifica que esté instalado y corriendo.', {
          duration: 8000,
          action: {
            label: 'Ver guía',
            onClick: () => {
              window.open('https://ollama.ai', '_blank');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error verificando conexión:', error);
      setIsConnected(false);
      
      // Mensaje más específico según el error
      if (error.response?.status === 404) {
        toast.error('Backend no encontrado. Verifica que el servidor esté corriendo.', {
          duration: 6000
        });
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        toast.error('No se puede conectar al backend. Verifica que esté corriendo en http://localhost:8000', {
          duration: 6000
        });
      } else {
        toast.error('Error al conectar con el chatbot. Revisa la consola para más detalles.', {
          duration: 6000
        });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isConnected) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Agregar mensaje del usuario
    const newUserMessage = {
      role: 'user',
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Preparar contexto (últimos 5 mensajes)
    const context = messages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      // Usar WebSocket para streaming
      let fullResponse = '';
      
      wsRef.current = chatbotAPI.createStreamConnection(
        userMessage,
        selectedModel,
        context,
        // onChunk
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = fullResponse;
            } else {
              newMessages.push({
                role: 'assistant',
                content: fullResponse
              });
            }
            return newMessages;
          });
        },
        // onComplete
        (fullMessage) => {
          setIsLoading(false);
          const finalMessage = fullMessage || fullResponse;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = finalMessage;
            }
            return newMessages;
          });
          // Leer respuesta en voz alta si está habilitado
          if (textToSpeechEnabled && finalMessage) {
            speakText(finalMessage);
          }
        },
        // onError
        (error) => {
          setIsLoading(false);
          
          // Extraer el mensaje de error real
          let errorMessage = 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.';
          
          if (error) {
            // Extraer el mensaje de error
            if (typeof error === 'string') {
              // Si aún viene con "Error:", limpiarlo (por compatibilidad)
              errorMessage = error.replace(/^Error:\s*/i, '').trim() || errorMessage;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            // Mostrar toast con el error
            toast.error(errorMessage, { duration: 6000 });
            console.error('Error del chatbot:', error);
          }
          
          // Agregar mensaje de error al chat con el mensaje real
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `❌ ${errorMessage}`
          }]);
        }
      );
    } catch (error) {
      setIsLoading(false);
      toast.error('Error al enviar mensaje');
      console.error('Error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] glass-effect rounded-xl shadow-2xl border-gradient flex flex-col z-50 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <FiMessageCircle className="w-5 h-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-white">Asistente Virtual</h3>
          {isConnected ? (
            <span className="badge badge-success badge-xs">Conectado</span>
          ) : (
            <span className="badge badge-error badge-xs">Desconectado</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="btn btn-ghost btn-sm text-slate-400 hover:text-white"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Modelo selector */}
      {availableModels.length > 0 && (
        <div className="px-4 py-2 border-b border-slate-700">
          <select
            value={selectedModel || ''}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="select select-bordered select-sm w-full bg-slate-800 border-slate-600 text-white text-xs"
          >
            {availableModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg p-3">
              <FiLoader className="w-4 h-4 animate-spin text-primary-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        {!isConnected ? (
          <div className="text-center py-4 space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-slate-300 font-semibold">Ollama no está disponible</p>
              <p className="text-xs text-slate-400 px-4">
                Para solucionar esto:
              </p>
              <div className="text-xs text-slate-500 text-left px-6 space-y-1">
                <p>1. Instala Ollama desde <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">ollama.ai</a></p>
                <p>2. Inicia Ollama: <code className="bg-slate-800 px-1 rounded">ollama serve</code></p>
                <p>3. Descarga un modelo: <code className="bg-slate-800 px-1 rounded">ollama pull llama3</code></p>
                <p>4. Haz clic en "Reintentar"</p>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={checkConnection}
                className="btn btn-sm btn-primary"
              >
                Reintentar
              </button>
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-ghost"
              >
                Instalar Ollama
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje o usa el micrófono..."
                className="input input-bordered flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                disabled={isLoading}
              />
              <button
                onClick={toggleListening}
                disabled={isLoading}
                className={`btn ${isListening ? 'btn-error' : 'btn-ghost'}`}
                title={isListening ? 'Detener grabación' : 'Grabar voz'}
              >
                <FiMic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="btn btn-primary"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setTextToSpeechEnabled(!textToSpeechEnabled);
                  if (!textToSpeechEnabled && isSpeaking) {
                    stopSpeaking();
                  }
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                title={textToSpeechEnabled ? 'Desactivar lectura de voz' : 'Activar lectura de voz'}
              >
                {textToSpeechEnabled ? (
                  <FiVolume2 className="w-3 h-3" />
                ) : (
                  <FiVolumeX className="w-3 h-3" />
                )}
                <span>Voz {textToSpeechEnabled ? 'activada' : 'desactivada'}</span>
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Detener lectura
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;

