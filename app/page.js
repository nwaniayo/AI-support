'use client'
import React, { useState } from 'react';
import { Box, Stack } from '@mui/material';

export default function Home() {
  const [messages, setMessages] = useState([
    { role: 'assistant', parts: 'Hello, how can I help you today?' },
  ]);
  const [message, setMessage] = useState('');

  return (
    <Box
      width="100%"
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Stack
        spacing={2}
        p={2}
        width="600px"
        border="1px solid #ccc"
        height="700px"
        direction="column"
      >
        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          maxHeight="100%"
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === 'assistant' ? 'flex-start' : 'flex-end'}
            >
              <Box
                bgcolor={message.role === 'assistant' ? 'primary.main' : 'secondary.main'}
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.parts}
              </Box>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
