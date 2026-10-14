import serverless from 'serverless-http';
import { createApp } from '../../art-api/src/app.js';

export const handler = serverless(createApp());
