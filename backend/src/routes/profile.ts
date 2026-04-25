import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens (JPEG, PNG, WebP, GIF) são permitidas.'));
    }
  },
});

// GET /api/profile — Get user profile
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, avatarUrl: true, bannerUrl: true, createdAt: true }
    });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no servidor.' });
  }
});

// GET /api/profile/stats — Get user statistics
router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    
    const [total, done, pending, priorities] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'DONE' } }),
      prisma.task.count({ where: { userId, status: 'PENDING' } }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { userId },
        _count: true
      })
    ]);

    // Tasks completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await prisma.task.count({
      where: {
        userId,
        status: 'DONE',
        updatedAt: { gte: today }
      }
    });

    const priorityMap = priorities.reduce((acc: any, p) => {
      acc[p.priority] = p._count;
      return acc;
    }, { HIGH: 0, MEDIUM: 0, LOW: 0 });

    res.json({
      total,
      done,
      pending,
      completedToday,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      priorityMap
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

// PUT /api/profile — Update user profile (name, avatar, banner, password)
router.put('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { avatarUrl, bannerUrl, name, password } = req.body;
    
    const updateData: any = {};
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl;
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    
    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: { id: true, name: true, email: true, avatarUrl: true, bannerUrl: true, createdAt: true }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

// POST /api/profile/upload-avatar — Upload custom avatar image
router.post('/upload-avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const avatarUrl = `/uploads/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl },
      select: { id: true, name: true, email: true, avatarUrl: true, bannerUrl: true, createdAt: true }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer upload.' });
  }
});

// POST /api/profile/upload-banner — Upload custom banner image
router.post('/upload-banner', authenticate, upload.single('banner'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const bannerUrl = `/uploads/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { bannerUrl },
      select: { id: true, name: true, email: true, avatarUrl: true, bannerUrl: true, createdAt: true }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer upload.' });
  }
});

export default router;
