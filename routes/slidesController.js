import { subirImagenAWordPress } from "../functions/uploadImageWordpress.js";
import { getUser } from "../middlewares/getUser.js";
import { initializeWooCommerce } from "../middlewares/initializeWooCommerce.js";
import { verifyToken } from "../middlewares/jwtVerify.js";
import multer from 'multer';
import express from 'express';
import Slide from '../models/slidesSchema.js';

const upload = multer();
const router = express.Router();

router.get('/:domain', async (req, res) => {
    const domain = req.query.domain;

    try {
        // Recuperar todos los slides desde la base de datos
        const slides = await Slide.find({ dominio: domain });

        // Responder con los slides obtenidos
        res.status(200).json(slides);
    } catch (error) {
        console.error('Error al recuperar los slides:', error);
        res.status(500).json({
            message: 'Error al recuperar los slides',
        });
    }
});

router.post('/', verifyToken, initializeWooCommerce, getUser, upload.single('image'), async (req, res) => {
    try {
        const usuario = req.usuario;
        console.log(req.file);

        const uploadedImage = await subirImagenAWordPress(req.file, usuario);

        // Crear el slide en la base de datos de MongoDB
        const newSlide = new Slide({
            dominio: usuario.url, // Añadir el dominio de la tienda del usuario
            texto: req.body.texto,
            imagen: {
                id: uploadedImage.id,
                link: uploadedImage.source_url  // Asegúrate de que 'source_url' es devuelto por WordPress
            }
        });

        await newSlide.save();  // Guardar el nuevo slide en MongoDB

        res.status(200).json(newSlide);
    } catch (error) {
        console.error('Error al crear el slide:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el slide',
            error: error.message
        });
    }
});

export default router;