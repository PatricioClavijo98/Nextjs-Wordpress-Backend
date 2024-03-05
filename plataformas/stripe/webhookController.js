// routes/subscriptionRoutes.js
import UserPlan from '../../models/UserPlanSchema.js';
import express from 'express';
import Stripe from 'stripe';
import { stripeSecretKey } from '../../config.js';
import bodyParser from 'body-parser';
import User from '../../models/userSchema.js';

const router = express.Router();

const stripe = new Stripe(stripeSecretKey, {});


router.post(
  '/',
  bodyParser.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    // Imprimir el cuerpo de la solicitud y los encabezados para depuración

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_SECRET_WEBHOOK);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'customer.subscription.created':
        const createdSubscription = event.data.object;
        const createdCustomerId = createdSubscription.customer;

        try {
          const userIdFromMetadata = createdSubscription.metadata.userId;
          const user = await User.findOne(userIdFromMetadata);

          // Busca si ya existe un UserPlan para ese usuario
          const existingUserPlan = await UserPlan.findOne({ userId: user._id });

          if (existingUserPlan) {
            // Actualiza el UserPlan existente
            existingUserPlan.stripeSubscriptionId = createdSubscription.id;
            existingUserPlan.planId = createdSubscription.plan.id;
            existingUserPlan.status = createdSubscription.status;
            existingUserPlan.startDate = new Date(createdSubscription.created * 1000);
            await existingUserPlan.save();
          } else {
            // Crea un nuevo UserPlan
            await UserPlan.create({
              tenant: user.tenant,
              userId: user._id,
              stripeCustomerId: createdCustomerId,
              stripeSubscriptionId: createdSubscription.id,
              planId: createdSubscription.plan.id,
              status: createdSubscription.status,
              startDate: new Date(createdSubscription.created * 1000),
            });
          }
        } catch (err) {
          console.log('Error al manejar customer.subscription.created:', err);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        const updatedCustomerId = updatedSubscription.customer;
        console.log(updatedSubscription);
        let newStatus = updatedSubscription.status; // Estado predeterminado

        if (updatedSubscription.status === 'active' && updatedSubscription.cancel_at_period_end) {
          newStatus = 'pending_cancellation';
        }

        try {
          await UserPlan.findOneAndUpdate(
            { stripeCustomerId: updatedCustomerId },
            {
              stripeSubscriptionId: updatedSubscription.id,
              status: newStatus,
              endDate: new Date()
              // Otros campos que quieras actualizar
            }
          );
        } catch (err) {
          console.log('Error al actualizar UserPlan:', err);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer;

        try {
          await UserPlan.findOneAndUpdate(
            { stripeCustomerId: deletedCustomerId },
            {
              status: 'cancelled',
              // Otros campos que quieras actualizar
            }
          );
        } catch (err) {
          console.log('Error al cancelar UserPlan:', err);
        }
        break;

      case 'checkout.session.completed':
        const session = event.data.object;

        try {
          // Actualiza el estado en tu base de datos (ejemplo)
          const rsp = await UserPlan.findOneAndUpdate(
            { stripeCustomerId: session.customer },
            {
              status: 'active',
              // Otros campos que quieras actualizar
            }
          );
          console.log("Sub created rsp: " + rsp);
        } catch (err) {
          console.log('Error al actualizar UserPlan:', err);
        }
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  }
);


export default router;
