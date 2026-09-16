import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isConnectingRef = useRef(false); // Flag para evitar conexiones múltiples

  // Función para obtener la URL del WebSocket
  const getWebSocketUrl = useCallback((userId) => {
    const wsUrl = 'localhost:8000';
    return `ws://${wsUrl}/api/v1/ws/notifications/${userId}`;
  }, []);

  // Función para procesar mensajes recibidos
  const processMessage = useCallback((message) => {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      
      setMessages(prev => [...prev, data]);

      // Procesar diferentes tipos de mensajes
      switch (data.type) {
        case 'quotation_notification':
        case 'quotation_update':
        case 'quotation_created':
          toast.success(`Cotización ${data.data?.numero_cotizacion || 'actualizada'}`, {
            icon: '📄',
          });
          break;
        
        case 'alert_notification':
        case 'alert':
          toast.error(data.data?.message || 'Nueva alerta', {
            icon: '⚠️',
          });
          break;
        
        case 'analytics':
          // Actualizar analytics sin mostrar toast
          break;
        
        case 'subscription_confirmed':
          console.log('✅ Suscrito a:', data.subscription_type);
          break;

        case 'pong':
          // Respuesta de ping, mantener conexión viva
          break;

        case 'welcome':
          console.log('✅ WebSocket conectado:', data.message);
          break;
        
        default:
          console.log('📨 Mensaje WebSocket recibido:', data);
      }
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error);
    }
  }, []);

  // Función para conectar WebSocket
  const connect = useCallback(() => {
    if (!user?.id || !isAuthenticated || isConnectingRef.current) {
      return;
    }

    // Evitar conexiones múltiples
    if (isConnected && socket && socket.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket ya está conectado');
      return;
    }

    isConnectingRef.current = true;

    // Cerrar conexión existente si hay
    if (socket) {
      socket.close();
    }

    const wsUrl = getWebSocketUrl(user.id);
    console.log('🔌 Conectando WebSocket a:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket conectado - actualizando estado');
        setIsConnected(true);
        setSocket(ws);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
        console.log('🔄 Estado actualizado: isConnected = true');

        // Por ahora solo mantener la conexión viva, sin suscripciones adicionales
        // Las suscripciones se pueden agregar más tarde cuando se implemente correctamente

        // Iniciar ping para mantener conexión viva
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping cada 30 segundos
      };
      
      ws.onmessage = (event) => {
        console.log('📨 Mensaje WebSocket recibido - procesando');
        processMessage(event.data);
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Intentar reconectar si el usuario sigue autenticado
        if (isAuthenticated && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

    } catch (error) {
      console.error('❌ Error al conectar WebSocket:', error);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [user?.id, isAuthenticated, getWebSocketUrl, processMessage]);

  // Función para desconectar
  const disconnect = useCallback(() => {
    isConnectingRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Conectar cuando el usuario esté autenticado
  useEffect(() => {
    console.log('🔍 WebSocket useEffect:', {
      isAuthenticated,
      userId: user?.id,
      isConnected,
      hasSocket: !!socket,
      isConnecting: isConnectingRef.current
    });

    if (isAuthenticated && user?.id) {
      // Solo conectar si no hay una conexión activa
      if (!isConnected && !socket && !isConnectingRef.current) {
        console.log('🚀 Iniciando conexión WebSocket...');
        connect();
      } else {
        console.log('🔄 WebSocket ya conectado, conectándose o socket existe');
      }
    } else {
      console.log('🔌 Desconectando WebSocket (usuario no autenticado o sin ID)');
      disconnect();
    }

    return () => {
      console.log('🧹 Cleanup WebSocket');
      disconnect();
    };
  }, [isAuthenticated, user?.id, connect, disconnect]); // eslint-disable-line react-hooks/exhaustive-deps

  // Función para enviar mensajes
  const sendMessage = useCallback((message) => {
    if (socket && isConnected && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }, [socket, isConnected]);

  // Función para suscribirse a un tipo de notificación
  const subscribe = useCallback((subscriptionType) => {
    sendMessage({
      type: 'subscribe',
      subscription_type: subscriptionType
    });
  }, [sendMessage]);

  // Función para desuscribirse
  const unsubscribe = useCallback((subscriptionType) => {
    sendMessage({
      type: 'unsubscribe',
      subscription_type: subscriptionType
    });
  }, [sendMessage]);

  const value = {
    socket,
    isConnected,
    messages,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
