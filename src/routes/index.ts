import { Router } from 'express';
import productRoutes from './product.routes';

const router = Router();

// Mount product routes
router.use('/products', productRoutes);

export default router;
