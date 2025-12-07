import mongoose, { Schema } from 'mongoose';


export interface IUser {
    handle: string
    name: string
    email: string
    password: string

}

const userSchema = new Schema({
    handle: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    name: {
        type: String, // ¡Aquí usamos el Constructor de JS!
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
})

// 3. Creamos el Modelo
const User = mongoose.model<IUser>('User', userSchema);

export default User