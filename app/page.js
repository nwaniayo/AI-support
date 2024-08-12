
'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Box, Stack, Button, TextField, Typography, CircularProgress } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { callFastAPI } from './api/fastApi';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6200EA',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6200EA',
            },
          },
        },
      },
    },
  },
});

export default function Home() {
  const [ragQuery, setRagQuery] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, response]);

  const formatText = (text) => {
    return text.split('\n').map((line, index) => (
      <Typography key={index} variant="body1" component="div">
        {line.split('**').map((part, i) => (
          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        ))}
      </Typography>
    ));
  };

  const handleRagSubmit = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: ragQuery }]);
    setResponse('');
    try {
      let apiResponse = '';
      await callFastAPI(ragQuery, (chunk) => {
        apiResponse += chunk;
        setResponse(prev => prev + chunk);
      });
      setMessages(prev => [...prev, { role: 'assistant', text: apiResponse }]);
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'An error occurred while processing your request.' }]);
    }
    setRagQuery('');
    setResponse('');
    setIsLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="background.default"
        p={2}
      >
        <Stack
          spacing={2}
          p={2}
          width="90%"
          maxWidth="800px"
          borderRadius={4}
          boxShadow={3}
          bgcolor="background.paper"
          height="90vh"
          direction="column"
          sx={{ backdropFilter: 'blur(10px)' }}
        >
          <Stack
            direction="column"
            spacing={1}
            flexGrow={1}
            overflow="auto"
            maxHeight="calc(100% - 70px)"
            p={1}
            sx={{
              '&::-webkit-scrollbar': {
                width: '0.4em',
              },
              '&::-webkit-scrollbar-track': {
                boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
                webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255,255,255,.1)',
                outline: '1px solid slategrey',
              },
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={message.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                <Box
                  bgcolor={message.role === 'user' ? 'primary.main' : 'background.paper'}
                  color={message.role === 'user' ? 'white' : 'text.primary'}
                  borderRadius={16}
                  p={2}
                  maxWidth="75%"
                  sx={{ position: 'relative', mb: 1 }}
                >
                  {formatText(message.text)}
                </Box>
              </Box>
            ))}
            {response && (
              <Box display="flex" justifyContent="flex-start">
                <Box
                  bgcolor="background.paper"
                  color="text.primary"
                  borderRadius={16}
                  p={2}
                  maxWidth="75%"
                  sx={{ position: 'relative', mb: 1 }}
                >
                  {formatText(response)}
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
          <form onSubmit={handleRagSubmit} style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Type your message..."
              variant="outlined"
              fullWidth
              sx={{
                mr: 1,
                borderRadius: 2,
                backgroundColor: 'background.paper',
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ borderRadius: 2, minWidth: '80px', height: '56px' }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Send'}
            </Button>
          </form>
        </Stack>
      </Box>
    </ThemeProvider>
  );
}
