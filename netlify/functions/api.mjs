import express from 'express';
import serverless from 'serverless-http';
import { createApp } from '../../art-api/src/app.js';

const app = express();

// Rewrite Netlify function incoming paths so Express matches routes regardless of invocation path
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '/api');
  }
  next();
});

app.use(createApp());

export const handler = serverless(app);
