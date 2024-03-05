import express, { Router } from 'express';
import Stripe from 'stripe';
import { stripeSecretKey } from '../../config.js';
import bodyParser from 'body-parser';
import { verifyToken } from '../../middlewares/jwtVerify.js';
import User from '../../models/userSchema.js';
import UserPlan from '../../models/UserPlanSchema.js';

const router = express.Router();

//TODO CAMBIE LO DE CONFIG.JS POR EL .ENV DIRECTO
const stripe = new Stripe(stripeSecretKey);

router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const _id = req.user.userId;

    // Verifica si el usuario ya tiene un stripeCustomerId
    const userPlan = await UserPlan.findOne({ userId: _id });
    const stripeCustomerId = userPlan ? userPlan.stripeCustomerId : undefined;

    // Crear la sesión
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId, // Si es undefined, Stripe creará un nuevo cliente
      payment_method_types: ['card'],
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'https://www.meteoracommerce.com/admin/dashboard/plan-settings/payment-success',
      cancel_url: 'https://your-cancel-url.com',
      metadata: {
        userId: _id.toString(),
      },
    });

    console.log(session);

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/', verifyToken, async (req, res) => {
  try {
    // Acceder al objeto del usuario desde req.user
    const _id = req.user.userId;

    let rspUser = await User.findOne({ _id });
    if (!rspUser) {
      return res.status(400).send({ message: "Error al obtener el usuario con token" });
    }

    let rspUserPlan = await UserPlan.findOne({ userId: _id });
    if (!rspUserPlan) {
      return res.status(400).send({ message: "Error al obtener el plan del usuario" });
    }

    res.status(201).send(rspUserPlan);
  } catch (error) {
    // Si hay un error, elimina todas las imágenes subidas
    if (error.code === 11000) {
      return res.status(400).json({ message: "Ya tienes un producto con ese SKU" });
    } else {
      return res.status(400).send(error.message);
    }
  }
});



router.get('/:customerId', verifyToken, async (req, res) => {
  const customerId = req.params.customerId;

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    const facturaInfo = invoices.data.map((factura) => {
      return {
        fecha: new Date(factura.date * 1000).toLocaleDateString(),
        codigo: factura.number,
        monto: factura.total / 100,
        linkPDF: factura.invoice_pdf,
      };
    });

    console.log(facturaInfo);
    res.json(facturaInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error.message);
  }
});

router.post('/cancel-subscription', verifyToken, async (req, res) => {
  try {
    const _id = req.user.userId;

    // Buscar el UserPlan del usuario para obtener el ID de la suscripción de Stripe.
    const userPlan = await UserPlan.findOne({ userId: _id });

    // Si no se encuentra un UserPlan o no tiene un stripeSubscriptionId, retornar un error.
    if (!userPlan || !userPlan.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No se encontró una suscripción activa para este usuario' });
    }

    // Cancelar la suscripción usando la API de Stripe.
    const updatedSubscription = await stripe.subscriptions.update(userPlan.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });


    // reflejar que la cancelación es al final del período
    userPlan.endDate = new Date(updatedSubscription.current_period_end * 1000); // Convertir el timestamp de Stripe a un objeto Date
    await userPlan.save();

    res.status(200).json({ message: 'Suscripción cancelada exitosamente', data: updatedSubscription });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/reanude-subscription', verifyToken, async (req, res) => {
  try {
    const _id = req.user.userId;

    // Buscar el UserPlan del usuario para obtener el ID de la suscripción de Stripe.
    const userPlan = await UserPlan.findOne({ userId: _id });

    // Si no se encuentra un UserPlan o no tiene un stripeSubscriptionId, retornar un error.
    if (!userPlan || !userPlan.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No se encontró una suscripción activa para este usuario' });
    }

    // Cancelar la suscripción usando la API de Stripe.
    const updatedSubscription = await stripe.subscriptions.update(userPlan.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Actualizar el estado de la suscripción en tu base de datos.
    userPlan.status = 'active';  // reflejar que la reanudación es al final del período
    userPlan.endDate = null; // Convertir el timestamp de Stripe a un objeto Date
    await userPlan.save();

    res.status(200).json({ message: 'Suscripción reanudada exitosamente', data: updatedSubscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






export default router;
