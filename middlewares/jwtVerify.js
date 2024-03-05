import jwt from 'jsonwebtoken';

// Middleware para verificar el token
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (authHeader) {
        var token = authHeader.split(' ')[1];
        token = token.replace(/^"|"$/g, '');
        // Verifica el token
        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;  // Adjunta el objeto del usuario al objeto req
            next();  // Pasa al siguiente middleware o ruta
        });
    } else {
        res.sendStatus(401);  // Sin encabezado de autorización, envía un estado 401 (no autorizado)
    }
};