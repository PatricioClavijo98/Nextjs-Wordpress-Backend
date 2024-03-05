import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads/'));  // Usamos path.join para crear una ruta absoluta.
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Genera un nombre de archivo único con una marca de tiempo.
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 },  // Establece un límite de tamaño de archivo (aquí es 1MB).
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('imagen', 10);  // .array permite subir múltiples archivos. 'image' es el nombre del campo y 10 es el número máximo de archivos que se pueden subir.

const uploadSingle = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('imagen');


function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

export {upload, uploadSingle};
