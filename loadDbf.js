import {DBFFile} from 'dbffile';
import schedule from 'node-schedule';

export const LoadDfb = () => {


    const DATABASE_PATH = 'linstock.dbf';

    function updateDatabase(records) {
        // Esta función debería actualizar tu base de datos con los registros proporcionados
        // Puedes usar cualquier biblioteca de base de datos o ORM que estés utilizando
        // Por ejemplo, si estás usando Sequelize o Mongoose, aquí es donde insertarías/actualizarías los registros
    }

    async function readDBFAndUpdate() {
        try {
            const dbf = await DBFFile.open(DATABASE_PATH);
            const records = await dbf.readRecords(dbf.recordCount); // Lee todos los registros

            updateDatabase(records);
        } catch (err) {
            console.error('Error al leer el archivo DBF:', err);
            // En caso de error, simplemente se registra el error y no se actualiza la base de datos
        }
    }

    // Programar la tarea para que se ejecute cada 6 horas
    schedule.scheduleJob('0 */6 * * *', readDBFAndUpdate);

    // También puedes iniciar la lectura al arrancar el servidor, si lo deseas
    readDBFAndUpdate();

    // Tu servidor y otras partes de tu código irían aquí

}