'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Stack, Button, TextField, Typography, CircularProgress, 
  IconButton, Tooltip, useMediaQuery, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, Rating
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Brightness4, Brightness7, Send, Feedback, Delete } from '@mui/icons-material';
import { callFastAPI } from './api/fastApi';

const createCustomTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#00A3E0', // Techify Solutions blue
    },
    secondary: {
      main: '#FF6B6B', // Accent color
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#F0F4F8',
      paper: mode === 'dark' ? '#1E1E1E' : '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
            '& fieldset': {
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00A3E0',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
        },
      },
    },
  },
});

export default function CustomerSupport() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const messagesEndRef = useRef(null);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    setIsDarkTheme(prefersDarkMode);
  }, [prefersDarkMode]);

  const theme = React.useMemo(() => createCustomTheme(isDarkTheme ? 'dark' : 'light'), [isDarkTheme]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setResponse('');
    try {
      let apiResponse = '';
      await callFastAPI(query, (chunk) => {
        apiResponse += chunk;
        setResponse(prev => prev + chunk);
      });
      setMessages(prev => [...prev, { role: 'assistant', text: apiResponse }]);
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'I apologize, but I encountered an error while processing your request. Please try again or contact our support team if the issue persists.' }]);
    }
    setQuery(''); // This line clears the textbox after sending the message
    setResponse('');
    setIsLoading(false);
  };

  const toggleTheme = () => {
    setIsDarkTheme(prev => !prev);
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      setShowNameDialog(false);
    }
  };

  const handleFeedbackOpen = () => {
    setShowFeedbackDialog(true);
  };

  const handleFeedbackClose = () => {
    setShowFeedbackDialog(false);
  };

  const handleFeedbackSubmit = () => {
    // Here you would typically send the feedback to your server
    console.log('Feedback submitted:', { rating: feedbackRating, comment: feedbackComment });
    setShowFeedbackDialog(false);
    setFeedbackRating(0);
    setFeedbackComment('');
  };

  const handleClearChat = () => {
    setMessages([]);
    setResponse('');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default',
          overflow: 'hidden',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Stack
          spacing={2}
          sx={{
            width: '90%',
            maxWidth: '800px',
            height: '90vh',
            borderRadius: 4,
            boxShadow: 3,
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'background-color 0.3s ease',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Techify Solutions Support
            </Typography>
            <Box>
              <Tooltip title="Clear chat">
                <IconButton onClick={handleClearChat} color="primary">
                  <Delete />
                </IconButton>
              </Tooltip>
              <Tooltip title="Provide feedback">
                <IconButton onClick={handleFeedbackOpen} color="primary">
                  <Feedback />
                </IconButton>
              </Tooltip>
              <Tooltip title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}>
                <IconButton onClick={toggleTheme} color="primary">
                  {isDarkTheme ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Stack
            direction="column"
            spacing={1}
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              '&::-webkit-scrollbar': {
                width: '0.4em',
              },
              '&::-webkit-scrollbar-track': {
                boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
                webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(0,163,224,.3)',
                borderRadius: '4px',
              },
            }}
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                {message.role === 'assistant' && (
                  <Avatar
                    src="/techify-logo.png"
                    alt="Techify Support"
                    sx={{ mr: 1, width: 32, height: 32, alignSelf: 'center' }}
                  />
                )}
                <Box
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper',
                    color: message.role === 'user' ? 'common.white' : 'text.primary',
                    borderRadius: 3,
                    p: 2,
                    maxWidth: '75%',
                    boxShadow: 1,
                  }}
                >
                  {formatText(message.text)}
                </Box>
                {message.role === 'user' && (
                  <Avatar sx={{ ml: 1, bgcolor: 'secondary.main', width: 32, height: 32, alignSelf: 'center' }}>
                    {userName[0].toUpperCase()}
                  </Avatar>
                )}
              </Box>
            ))}
            {response && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                <Avatar
                  src="/techify-logo.png"
                  alt="Techify Support"
                  sx={{ mr: 1, width: 32, height: 32, alignSelf: 'center' }}
                />
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: 3,
                    p: 2,
                    maxWidth: '75%',
                    boxShadow: 1,
                  }}
                >
                  {formatText(response)}
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.default',
              transition: 'background-color 0.3s ease',
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={isLoading}
                    sx={{ ml: 1 }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : <Send />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onClose={handleNameSubmit} disableEscapeKeyDown>
        <DialogTitle>Welcome to Techify Solutions Support</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Enter your name"
            fullWidth
            variant="outlined"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNameSubmit} color="primary">
            Start Chat
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onClose={handleFeedbackClose}>
        <DialogTitle>We Value Your Feedback</DialogTitle>
        <DialogContent>
          <Rating
            name="feedback-rating"
            value={feedbackRating}
            onChange={(event, newValue) => setFeedbackRating(newValue)}
          />
          <TextField
            margin="dense"
            label="Comments"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleFeedbackSubmit} color="primary">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
