import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId as string;
    
    // Total de tarefas concluídas nos últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const completedLast7Days = await prisma.task.count({
      where: {
        userId,
        status: 'DONE',
        updatedAt: {
          gte: sevenDaysAgo
        }
      }
    });
    
    const upcomingTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          not: null
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5,
      include: { 
        categories: true
      }
    });

    const totalTasks = await prisma.task.count({ where: { userId } });
    const completedTasks = await prisma.task.count({ where: { userId, status: 'DONE' } });
    const overdueTasks = await prisma.task.count({
      where: { 
        userId, 
        status: 'PENDING',
        dueDate: {
          lt: new Date()
        }
      }
    });

    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId },
      _count: { priority: true }
    });

    res.json({
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completedLast7Days,
      upcomingTasks,
      priorityDistribution: tasksByPriority.map(p => ({
        priority: p.priority,
        count: p._count.priority
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

export default router;
