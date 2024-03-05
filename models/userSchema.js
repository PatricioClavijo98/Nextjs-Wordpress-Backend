import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        default: ""
    },
    apellido: {
        type: String,
        default: ""
    },
    authorization: {
        type: String,
        default: ""
    },
    consumerKey: {
        type: String,
        default: ""
    },
    consumerSecret: {
        type: String,
        default: ""
    },
    url: {
        type: String,
        default: ""
    },
    empresa: {
        type: String,
        default: ""
    }

});

// Antes de guardar, cifrar la contraseña
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
