const axios = require('axios');
const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'kosmokrator',
    password: 'Kosmo6245Krator1752',
    database: 'forestal_danger'
});

const apiUrl = 'https://climatologia.meteochile.gob.cl/application/geoservicios/getRiesgoIncendio?usuario=mario.torneria@virginiogomez.cl&token=e74fdf4378c2ac695ba7ef8c';

// Función para almacenar las estaciones una sola vez
async function storeStationsOnce() {
    try {
        await client.connect();
        console.log("Conexión a la Base de Datos Establecida.");

        const response = await axios.get(apiUrl);
        const data = response.data;

        for (const feature of data.features) {
            const properties = feature.properties;
            const geometry = feature.geometry.coordinates;

            // Insertar ubicacion
            const ubicacionEstacionResult = await client.query(
                `INSERT INTO Ubicacion_Estacion (latitud, longitud, altura) 
                VALUES ($1, $2, $3) RETURNING id_ubicacion_estacion`,
                [geometry[1], geometry[0], properties.altura]
            );

            if (ubicacionEstacionResult.rows.length === 0) {
                console.error("No se pudo obtener el ID de Ubicación.");
                continue; // Saltar a la siguiente iteración si no se insertó
            }

            const fk_ubicacion_estacion = ubicacionEstacionResult.rows[0].id_ubicacion_estacion;

            // Insertar jurisdicción
            const jurisdiccionEstacionResult = await client.query(
                `INSERT INTO Jurisdiccion_Estacion (provincia, comuna, region, numero_region)
                VALUES ($1, $2, $3, $4) RETURNING id_jurisdiccion_estacion`,
                [properties.provincia, properties.comuna, properties.region, properties.NumeroRegion]
            );

            if (jurisdiccionEstacionResult.rows.length === 0) {
                console.error("No se pudo obtener el ID de Jurisdicción.");
                continue; // Saltar a la siguiente iteración si no se insertó
            }

            const fk_jurisdiccion_estacion = jurisdiccionEstacionResult.rows[0].id_jurisdiccion_estacion;

            // Insertar estación
            await client.query(
                `INSERT INTO Estacion (fk_ubicacion_estacion, fk_jurisdiccion_estacion, codigo_nacional, nombre_estacion)
                VALUES ($1, $2, $3, $4)  `,
                [fk_ubicacion_estacion,fk_jurisdiccion_estacion, properties.CodigoNacional, properties.nombreEstacion]
            );
        }

        console.log("Estaciones almacenadas exitosamente.");
    } catch (error) {
        console.error("Error almacenando las estaciones:", error);
    } finally {
        await client.end();
    }
}


// Ejecutar ambas funciones
async function main() {
    await storeStationsOnce();
    //await fetchDataAndSave();
}

main();