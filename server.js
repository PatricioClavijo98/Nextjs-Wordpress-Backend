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

export async function loadWhiteList() {
    const domains = await CustomDomain.find({ verified: true });
    const additionalDomains = domains.map(domain => {
        if (domain.verified) {
            return `www.${domain.domain}`;
        }
    });
    whiteList = [...whiteList, ...additionalDomains];
}



//loadWhiteList(); //TODO: añadir este método cuando se agregue un dominio al servidor



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

const ignoreSecurityForStripe = (req, res, next) => {
    if (req.path.startsWith('/store/webhook')) {
        console.log('Entra a webhookc');
        next();
    } else {
        
        cors(corsOptions)(req, res, () => {
            helmet()(req, res, next);
        });
    }
};

app.use(cors());
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    //LoadDfb();
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

export default app;