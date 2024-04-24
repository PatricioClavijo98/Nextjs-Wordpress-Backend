import mongoose from 'mongoose';

const SlideSchema = new mongoose.Schema({
    dominio: {
        type: String,
        required: true
    },
    texto: {
        type: String,
        required: true
    },
    imagen: {
        id: {
            type: String,
            required: true  // Marcado como requerido siempre vas a asociar una imagen de WP
        },
        link: {
            type: String,
            required: true  // Asegúrate de que siempre se guarde una URL para la imagen
        }
    }
});

const Slide = mongoose.model('Slides', SlideSchema);
export default Slide;
