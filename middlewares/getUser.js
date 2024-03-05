import User from '../models/userSchema.js';

export const getUser = async (req, res, next) => {
    const _id = req.user.userId; // Asumimos que este es el ID del usuario autenticado
    let usuario = await User.findOne({ _id });
    if (!usuario) {
        return res.status(400).send({ message: "Usuario no encontrado" });
    }
    req.usuario = usuario;
    next();
};
