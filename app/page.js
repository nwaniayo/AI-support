'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from "./components/ui/input";
import { ScrollArea } from "./components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Card, CardContent, CardFooter } from "./components/ui/card";
import { Moon, Sun, Send, MessageSquare } from 'lucide-react';
import { callApi } from './api/callApi';

export default function CustomerSupport() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkTheme(savedTheme === 'dark');
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setIsDarkTheme(!isDarkTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, response]);

  const formatText = (text) => {
    return text.split('\n').map((line, index) => (
      <p key={index} className="mb-2">
        {line.split('**').map((part, i) => (
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        ))}
      </p>
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setResponse('');
    try {
      let apiResponse = '';
      await callApi(query, (chunk) => {
        apiResponse += chunk;
        setResponse(prev => prev + chunk);
      });
      setMessages(prev => [...prev, { role: 'assistant', text: apiResponse }]);
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'I apologize, but I encountered an error while processing your request. Please try again or contact our support team if the issue persists.' }]);
    }
    setQuery('');
    setResponse('');
    setIsLoading(false);
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setShowNameDialog(false);
    }
  };

  return (
      <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold text-primary">Techify Solutions Support</h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-4 pb-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className={`flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[80%]`}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{message.role === 'user' ? userName[0].toUpperCase() : 'T'}</AvatarFallback>
                    <AvatarImage src={message.role === 'user' ? "/placeholder-user.jpg" : "/techify-logo.png"} />
                  </Avatar>
                  <div className={`mx-2 p-3 rounded-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    {formatText(message.text)}
                  </div>
                </div>
              </div>
            ))}
            {response && (
              <div className="flex justify-start mb-4">
                <div className="flex flex-row items-start max-w-[80%]">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>T</AvatarFallback>
                    <AvatarImage src="/techify-logo.png" />
                  </Avatar>
                  <div className="mx-2 p-3 rounded-lg bg-secondary">
                    {formatText(response)}
                  </div>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex justify-center mt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </div>
        <div className="p-4 bg-background">
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
  
        {showNameDialog && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <Card className="w-[350px]">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Enter Your Name</h2>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mb-4"
                />
                <Button onClick={handleNameSubmit} className="w-full">
                  Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }