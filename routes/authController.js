import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userSchema.js';
import mongoose from 'mongoose';

// IMPORTANTE: PARA REGISTRAR NUEVOS USUARIOS ES NECESARIO HACERLO DESDE POSTMAN.

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password, token } = req.body;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      return res.json(user);
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  }

  if (email && password) {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
    }

    // Compara la contraseña enviada con la contraseña almacenada (ya cifrada)
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos' });
    }

    const existingToken = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '30d' });
    return res.json({ token: existingToken });
  }

  res.status(400).json({ message: 'Datos insuficientes' });
});

router.post('/register', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(req.body);
    const { email, password, url } = req.body;
    // Verificar si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).send({ message: 'El usuario ya existe' });
    }

    // Crear un nuevo usuario
    user = new User({ email, password, url });
    await user.save({ session });  // Añadir session a la operación

    // Confirmar las operaciones
    await session.commitTransaction();

    // Generar JWT
    const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '30d' });

    res.status(201).send({ token });
  } catch (error) {
    // Revertir las operaciones en caso de error
    await session.abortTransaction();
    console.error("Error: ", error);
    res.status(500).send({ message: 'Error en el servidor' });
  } finally {
    session.endSession();
  }
});


export default router;