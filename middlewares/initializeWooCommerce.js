import pkg from '@woocommerce/woocommerce-rest-api';
const WooCommerceRestApi = pkg.default;
import User from '../models/userSchema.js'; // Asegúrate de que la ruta sea correcta

export const initializeWooCommerce = async (req, res, next) => {
    const _id = req.user.userId; // Asumimos que este es el ID del usuario autenticado
    let usuario = await User.findOne({ _id });
    if (!usuario) {
        return res.status(400).send({ message: "Usuario no encontrado" });
    }
    
    const woocommerce = new WooCommerceRestApi({
        url: usuario.url,
        consumerKey: usuario.consumerKey,
        consumerSecret: usuario.consumerSecret,
        version: 'wc/v3'
    });

    req.woocommerce = woocommerce;
    next();
};
