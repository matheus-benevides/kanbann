import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

// Listar todas as tarefas do usuário logado
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.userId },
      include: {
        categories: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// Criar tarefa
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, dueDate, priority, status, categoryIds, color, tags } = req.body;
    
    if (!title) {
      res.status(400).json({ error: 'Título é obrigatório' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        color: color || null,
        userId: req.userId as string,
        categories: categoryIds && categoryIds.length > 0 ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined,
        tags: tags ? {
          connect: tags.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        categories: true,
        tags: true,
      }
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// Atualizar tarefa
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, description, dueDate, priority, status, categoryIds, color, tags } = req.body;

    const task = await prisma.task.update({
      where: { id, userId: req.userId },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status,
        color,
        categories: categoryIds ? {
          set: categoryIds.map((cId: string) => ({ id: cId }))
        } : undefined,
        tags: tags ? {
          set: tags.map((tId: string) => ({ id: tId }))
        } : undefined
      },
      include: {
        categories: true,
        tags: true,
      }
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// Deletar tarefa
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.task.delete({
      where: { id, userId: req.userId }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tarefa' });
  }
});

export default router;
