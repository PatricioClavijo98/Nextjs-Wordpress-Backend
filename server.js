import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
//import helmet from 'helmet/index.cjs'
import helmet from 'helmet'
//rutas
import categoriesRoutes from './routes/categoriasController.js'
import authRoutes from './routes/authController.js'
import productosRoutes from './routes/productosController.js'
import ordersRoutes from './routes/ordersController.js'
import clientsRoutes from './routes/clientsController.js'
import slidesRoutes from './routes/slidesController.js'

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
// IMPORTANTE: DESACTIVAR HELMET IMPORT Y CORS PAR AQUE ANDE, EL PROBLEMA ESTA AHÍ
dotenv.config();
const app = express();

var whiteList = [
    /localhost:3000$/, // Esto permitirá cualquier subdominio en localhost:3000
    'http://localhost:3000',
    '^https?:\/\/([a-z0-9-]+\.)*meteoracommerce\.com$',
    'https://meteoracommerce.com',
    'https://www.meteoracommerce.com',
    /meteoracommerce\.com$/,
    'https://enelectronico.com',
    'https://www.enelectronico.com',
];


const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }
        const isAllowed = whiteList.some((allowed) => {
            if (typeof allowed === 'string') {
                return origin === allowed;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(error => console.log('Error al conectar a MongoDB Atlas:', error));

//Esto le indica a Express que sirva archivos estáticos desde la carpeta uploads cuando se acceda a la ruta
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static('uploads'));

// user data
app.use('/auth', authRoutes);

// store config
app.use('/api/categorias', categoriesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/slides', slidesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    //LoadDfb();
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

export default app;