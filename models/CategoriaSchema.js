import mongoose from 'mongoose';

export const CategoriaSchema = new mongoose.Schema({
    tenant: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    imagen: {
        id: String,
        link: String
    },
    padre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        default: null
    }
});

const Categoria = mongoose.model('Categoria', CategoriaSchema);
export default Categoria;
