import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

// Listar categorias
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: req.userId },
          { isDefault: true, userId: null }
        ]
      }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Criar categoria
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      res.status(400).json({ error: 'Nome e cor são obrigatórios' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name,
        color,
        userId: req.userId as string,
        isDefault: false
      }
    });
    
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

export default router;
