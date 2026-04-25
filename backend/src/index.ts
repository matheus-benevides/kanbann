import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import "dotenv/config";

import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import categoryRoutes from './routes/categories';
import dashboardRoutes from './routes/dashboard';
import profileRoutes from './routes/profile';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Kanban API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
