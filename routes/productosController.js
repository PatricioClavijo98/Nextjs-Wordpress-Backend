import express from 'express';
import { initializeWooCommerce } from '../middlewares/initializeWooCommerce.js';
import { verifyToken } from '../middlewares/jwtVerify.js';
import { getUser } from '../middlewares/getUser.js';
import multer from 'multer';
import { subirImagenAWordPress } from '../functions/uploadImageWordpress.js';


const upload = multer();
const router = express.Router();


// GET: OBTENER PRODUCTOS
router.get('/', verifyToken, initializeWooCommerce, async (req, res) => {
    try {
        const page = req.query.page || 1;
        const search = req.query.search || '';

        const params = {
            per_page: 15,
            page: page,
        };

        // Ahora puedes usar req.woocommerce directamente
        if (search) {
            params.search = search; // WooCommerce acepta un parámetro 'search' para filtrar los productos
        }

        const response = await req.woocommerce.get("products", params);

        const totalProducts = response.headers['x-wp-total'];
        const totalPages = response.headers['x-wp-totalpages'];

        res.status(200).json({
            data: response.data,
            page: parseInt(page, 10),
            totalProducts: parseInt(totalProducts, 10),
            totalPages: parseInt(totalPages, 10),
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos de WooCommerce', error });
    }
});

router.post('/', verifyToken, initializeWooCommerce, getUser, upload.array('images'), async (req, res) => {
    try {

        const usuario = req.usuario; // Información de autenticación y URL de WordPress
        const promises = req.files.map(file => subirImagenAWordPress(file, usuario));

        // Espera a que todas las imágenes se hayan subido
        const uploadedImages = await Promise.all(promises);

        // Procesa los datos del formulario para crear el producto en WooCommerce
        const productData = {
            name: req.body.name,
            regular_price: req.body.regular_price,
            description: req.body.description,
            sku: req.body.sku,
            status: req.body.status,
            categories: JSON.parse(req.body.categories), // Asumiendo que `categories` es un JSON stringificado
            images: uploadedImages.map(image => ({
                id: image.id // Cambia aquí para usar el ID de la imagen
            })),
        };

        const response = await req.woocommerce.post("products", productData);

        res.json(response.data); // Respuesta temporal
    } catch (error) {
        console.error('Error al crear el producto en WooCommerce:', error);
        res.status(500).json({ message: 'Error al crear el producto en WooCommerce', error });
    }
});


router.delete('/:productoId', verifyToken, initializeWooCommerce, getUser, async (req, res) => {
    try {
        const { productoId } = req.params;
        const usuario = req.usuario;

        // Paso 2: Obtener información del producto (incluyendo las imágenes asociadas)
        const productInfoResponse = await req.woocommerce.get(`products/${productoId}`);
        const productInfo = productInfoResponse.data;

        // Identificar las imágenes asociadas para eliminarlas
        const imageIds = productInfo.images.map(image => image.id);

        // Paso 3: Eliminar las imágenes asociadas (si es necesario)
        // Esto dependerá de tu lógica específica y de cómo estás manejando las imágenes en WordPress
        for (const imageId of imageIds) {
            await fetch(`${usuario.url}/wp-json/wp/v2/media/${imageId}?force=true`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Basic ${btoa(usuario.authorization)}`,
                },
            });
        }

        // Paso 4: Eliminar el producto
        const deleteResponse = await req.woocommerce.delete(`products/${productoId}`, { force: true }); // force: true para eliminar permanentemente

        if (deleteResponse.data) {
            res.status(200).json(deleteResponse.data);
        } else {
            throw new Error('No se pudo eliminar el producto');
        }
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: 'Error al eliminar el producto en WooCommerce', error });
    }
});

router.put('/:productoId', verifyToken, initializeWooCommerce, getUser, upload.array('images'), async (req, res) => {
    try {
        const { productoId } = req.params;

        let uploadedImages = [];
        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(file => subirImagenAWordPress(file, usuario));
            uploadedImages = await Promise.all(imagePromises);
        }

        // Asume que req.body.categories ya es un array de objetos {id: XX}
        const productDataToUpdate = {
            name: req.body.name,
            regular_price: req.body.regular_price,
            description: req.body.description,
            sku: req.body.sku,
            status: req.body.status,
            categories: req.body.categories, // Sin necesidad de mapear si ya está en el formato correcto
            // Omitir o manejar las imágenes según sea necesario
        };

        const response = await req.woocommerce.put(`products/${productoId}`, productDataToUpdate);

        res.json(response.data);
    } catch (error) {
        console.error('Error al actualizar el producto en WooCommerce:', error);
        res.status(500).json({ message: 'Error al actualizar el producto en WooCommerce', error });
    }
});


export default router;