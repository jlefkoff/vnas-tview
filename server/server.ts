import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import request from 'request';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Utility to get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware to handle CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Proxy route for VATSIM API
app.get('/api/artccs', (req: Request, res: Response) => {
  request(
    { url: 'https://data-api.vnas.vatsim.net/api/artccs/' },
    (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return res.status(500).json({ type: 'error', message: error ? error.message : 'Failed to fetch data' });
      }
      res.json(JSON.parse(body));
    }
  );
});

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
