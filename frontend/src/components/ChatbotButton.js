import React, { useState } from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import Chatbot from './Chatbot';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Solo mostrar si está autenticado
  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 gradient-primary rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white z-40 animate-float transition-all duration-300 hover:scale-110"
        title="Abrir asistente virtual"
      >
        <FiMessageCircle className="w-6 h-6" />
      </button>
      <Chatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default ChatbotButton;

