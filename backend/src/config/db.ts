import mongoose from 'mongoose';
import colors from 'colors';

export const connectDB = async () => {
    // 1. OBTENER la URI de la variable de entorno
    const MONGO_URI = process.env.MONGO_URI;

    // 2. VERIFICAR si existe
    if (!MONGO_URI) {
        // Si es 'undefined', lanza un error legible y sal.
        console.error(colors.bgRed.white.bold("❌ ERROR: La variable de entorno MONGO_URI no está definida."));
        process.exit(1);
    }

    try {
        // 3. Ahora sabemos que MONGO_URI es definitivamente una string,
        // por lo que no hay error de tipo.
        const { connection } = await mongoose.connect(MONGO_URI);
        const url = `${connection.host}:${connection.port}`;

        console.log(colors.cyan.bold(`✅ MongoDB Conectado en ${url}`));
    } catch (error) {
        console.error(colors.bgRed.white.bold(`❌ Falló la conexión a MongoDB: ${(error as any).message}`));
        process.exit(1);
    }
};