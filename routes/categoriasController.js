import express from 'express';
import { initializeWooCommerce } from '../middlewares/initializeWooCommerce.js';
import { verifyToken } from '../middlewares/jwtVerify.js';
import { getUser } from '../middlewares/getUser.js';
import multer from 'multer';
import { subirImagenAWordPress } from '../functions/uploadImageWordpress.js';

const upload = multer();
const router = express.Router();

// GET: OBTENER CATEGORÍAS DE PRODUCTOS
router.get('/', verifyToken, initializeWooCommerce, async (req, res) => {
    try {
        const page = req.query.page || 1;
        // El parámetro 'search' se puede utilizar para filtrar categorías por nombre.
        const search = req.query.search || '';

        const params = {
            per_page: 100, // Ajusta según la cantidad de categorías que esperas obtener
            page: page,
        };

        if (search) {
            params.search = search; // Filtra las categorías por el término de búsqueda
        }

        const response = await req.woocommerce.get("products/categories", params);

        res.status(200).json({
            data: response.data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener las categorías de productos de WooCommerce', error });
    }
});

router.post('/', verifyToken, initializeWooCommerce, getUser, upload.single('image'), async (req, res) => {
    try {
        const usuario = req.usuario; // Información de autenticación y URL de WordPress
        let uploadedImage;

        // Intenta subir la imagen si existe en el request
        if (req.file) {
            uploadedImage = await subirImagenAWordPress(req.file, usuario);
        }

        // Construye los datos de la categoría basándote en si se subió una imagen
        const categoryData = {
            name: req.body.name,
            parent: req.body.parent ? parseInt(req.body.parent) : 0, // Asegúrate de que 'parent' sea un entero o 0 si no se proporciona
        };

        // Añade la propiedad de imagen solo si se ha subido una imagen
        if (uploadedImage) {
            categoryData.image = { id: uploadedImage.id };
        }

        const response = await req.woocommerce.post("products/categories", categoryData);

        res.json(response.data); // Envía la respuesta con los datos de la categoría creada
    } catch (error) {
        console.error('Error al crear la categoría en WooCommerce:', error);
        res.status(500).json({ message: 'Error al crear la categoría en WooCommerce', error });
    }
});

router.delete('/:id', verifyToken, initializeWooCommerce, getUser, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const usuario = req.usuario; // Información de autenticación y URL de WordPress

        const tieneProductos = await verificarProductos(categoryId, req.woocommerce);
        if (tieneProductos) {
            return res.status(400).json({ message: 'La categoría tiene productos asociados y no puede ser eliminada.' });
        }

        const tieneSubcategorias = await verificarSubcategorias(categoryId, req.woocommerce);
        if (tieneSubcategorias) {
            return res.status(400).json({ message: 'La categoría tiene subcategorías asociadas y no puede ser eliminada.' });
        }

        await eliminarImagenCategoria(categoryId, usuario, req.woocommerce);

        const response = await req.woocommerce.delete(`products/categories/${categoryId}`, {
            force: true
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error al eliminar la categoría:', error);
        res.status(500).json({ message: 'Error al eliminar la categoría', error });
    }
});

router.put('/:categoriaId', verifyToken, initializeWooCommerce, getUser, upload.single('image'), async (req, res) => {
    try {
        const { categoriaId } = req.params;
        const usuario = req.usuario; // Asegúrate de que este objeto contiene la información necesaria

        let uploadedImage = null;
        if (req.file) {
            await eliminarImagenCategoria(categoriaId, usuario, req.woocommerce);
            uploadedImage = await subirImagenAWordPress(req.file, usuario);
        }

        const categoryDataToUpdate = {
            name: req.body.name,
        };

        if (uploadedImage) {
            categoryDataToUpdate.image = { id: uploadedImage.id };
        }

        const response = await req.woocommerce.put(`products/categories/${categoriaId}`, categoryDataToUpdate);

        res.json(response.data); // Envía la respuesta con los datos de la categoría actualizada
    } catch (error) {
        console.error('Error al actualizar la categoría en meteora:', error);
        res.status(500).json({ message: 'Error al actualizar la categoría en WooCommerce', error });
    }
});


const eliminarImagenCategoria = async (categoryId, usuario, woocommerce) => {
    try {
        const categoriaData = await woocommerce.get(`products/categories/${categoryId}`);

        const imageId = categoriaData.data.image ? categoriaData.data.image.id : null;

        if (!imageId) {
            console.log('No hay imagen para eliminar en esta categoría.');
            return;
        }

        const response = await fetch(`${usuario.url}/wp-json/wp/v2/media/${imageId}?force=true`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${btoa(usuario.authorization)}`,
            },
        });

        if (!response.ok) {
            // Si la solicitud falla, lanzamos un error
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar la imagen de la categoría');
        }

        console.log('Imagen eliminada con éxito');
    } catch (error) {
        console.error('Error al eliminar la imagen de la categoría:', error);
        throw error; // Propagar el error para manejo adicional si es necesario
    }
}


async function verificarProductos(categoryId, woocommerce) {
    try {
        // Realiza una solicitud a la API de WooCommerce para obtener productos por categoría
        const response = await woocommerce.get("products", {
            category: categoryId
        });


        // Verifica si hay productos asociados
        if (response && response.data && response.data.length > 0) {
            return true; // Hay productos asociados
        } else {
            return false; // No hay productos asociados
        }
    } catch (error) {
        console.error('Error al verificar productos:', error);
        throw new Error('No se pudo verificar la presencia de productos para la categoría');
    }
}

async function verificarSubcategorias(categoryId, woocommerce) {
    try {
        // Realiza una solicitud a la API de WooCommerce para obtener subcategorías
        const response = await woocommerce.get("products/categories", {
            parent: categoryId
        });

        // Verifica si hay subcategorías asociadas
        if (response && response.data && response.data.length > 0) {
            return true; // Hay subcategorías asociadas
        } else {
            return false; // No hay subcategorías asociadas
        }
    } catch (error) {
        console.error('Error al verificar subcategorías:', error);
        throw new Error('No se pudo verificar la presencia de subcategorías para la categoría');
    }
}


export default router;
