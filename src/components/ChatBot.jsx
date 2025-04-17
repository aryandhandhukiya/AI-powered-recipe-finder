import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './ChatBot.css';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('Missing Gemini API key');
  }

  // Initialize Gemini AI with error handling
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro", // Updated model name
    apiVersion: "v1", // Specify API version
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    }
  });

  // Update the test connection function
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing API connection...');
        // Add specific cooking context to initial prompt
        const prompt = "You are a cooking assistant. Reply with a brief greeting.";
        const result = await model.generateContent([prompt]);
        const response = await result.response;
        const text = response.text();
        console.log('API test response:', text);
        
        setMessages([{
          text: "Hello! I'm your Recipe Assistant. Ask me anything about cooking!",
          sender: 'bot'
        }]);
      } catch (error) {
        console.error('API Connection Error:', error);
        setMessages([{
          text: `Connection Error: Please make sure you have the correct API configuration and permissions.`,
          sender: 'bot'
        }]);
      }
    };

    testConnection();
  }, []);

  // Update the message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { text: inputMessage, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const prompt = [
        "You are a cooking assistant. Answer the following question about cooking or recipes:",
        inputMessage
      ];
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response from AI');
      }

      const botResponse = {
        text: text.trim(),
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('ChatBot Error:', error);
      const errorMessage = {
        text: "I'm having trouble connecting to the recipe service. Please try again in a moment.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="ri-message-3-line"></i>
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Recipe AI Assistant</h3>
            <button onClick={() => setIsOpen(false)}>
              <i className="ri-close-line"></i>
            </button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.sender}`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                Cooking up a response...
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about any recipe..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              <i className="ri-send-plane-fill"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;