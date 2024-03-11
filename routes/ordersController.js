import express from 'express';
import { initializeWooCommerce } from '../middlewares/initializeWooCommerce.js';
import { verifyToken } from '../middlewares/jwtVerify.js';
//import { getUser } from '../middlewares/getUser.js';

const router = express.Router();

router.get('/', verifyToken, initializeWooCommerce, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const status = req.query.status || ''; // Opcional: añade filtrado por estado de la orden

        const params = {
            per_page: 15,
            page: page,
        };

        // Filtrado opcional por estado de la orden
        if (status) {
            params.status = status;
        }

        // Realiza la solicitud a WooCommerce para obtener las órdenes
        const response = await req.woocommerce.get("orders", params);

        // WooCommerce devuelve en los headers el total de productos y el total de páginas
        const totalOrders = response.headers['x-wp-total'];
        const totalPages = response.headers['x-wp-totalpages'];

        // Envía los datos de las órdenes en la respuesta
        res.status(200).json({
            data: response.data,
            page: parseInt(page, 10),
            totalOrders: parseInt(totalOrders, 10),
            totalPages: parseInt(totalPages, 10),
        });
    } catch (error) {
        console.error('Error al obtener las órdenes de WooCommerce:', error);
        res.status(500).json({ message: 'Error al obtener las órdenes de WooCommerce', error });
    }
});

router.put('/:orderId', verifyToken, initializeWooCommerce, async (req, res) => {
    const orderId = req.params.orderId;
    const updatedOrderData = req.body;

    try {
        // Realiza la solicitud a WooCommerce para actualizar la orden
        const response = await req.woocommerce.put(`orders/${orderId}`, updatedOrderData);

        // Si la actualización es exitosa, envía la respuesta
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Error al actualizar la orden ${orderId} en WooCommerce:`, error);
        res.status(500).json({ message: `Error al actualizar la orden en WooCommerce`, error });
    }
});


export default router;