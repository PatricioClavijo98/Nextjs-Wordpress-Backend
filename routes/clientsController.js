import { initializeWooCommerce } from '../middlewares/initializeWooCommerce.js';
import { verifyToken } from '../middlewares/jwtVerify.js'
import express from 'express';

const router = express.Router();

router.get('/', verifyToken, initializeWooCommerce, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const search = req.query.search || '';

        const params = {
            per_page: 100, // Ajusta este valor según la cantidad de clientes que esperas obtener por página
            page: page,
        };

        if (search) {
            params.search = search; // Filtra los clientes por término de búsqueda, como nombre o email
        }

        const response = await req.woocommerce.get("customers", params); // Cambiado de 'products/categories' a 'customers'

        res.status(200).json(
            response.data,
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los clientes de WooCommerce', error });
    }
});

export default router;