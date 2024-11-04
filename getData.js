const axios = require("axios");
const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "kosmokrator",
  password: "Kosmo6245Krator1752",
  database: "forestal_danger",
});

const apiUrl = "https://climatologia.meteochile.gob.cl/application/geoservicios/getRiesgoIncendio?usuario=mario.torneria@virginiogomez.cl&token=e74fdf4378c2ac695ba7ef8c";

async function connectDb() {
  await client.connect();
  console.log("Conexión a la Base de Datos Establecida.");
}

async function disconnectDb() {
  await client.end();
}

async function compareDate(savedDate){ 
  const currentDate = new Date().toISOString().slice(0, 10);
  console.log(`Comparando ${savedDate} con ${ currentDate}`)
  return savedDate === currentDate;
}

async function evaluateDate() {
  let lastIdFecha = null;

  try {
    // Obtener la última fecha almacenada
    const result = await client.query(`SELECT momento, id_fecha FROM Fecha ORDER BY id_fecha DESC LIMIT 1;`);

    const lastSavedDate = result.rows.length > 0 
      ? result.rows[0].momento.toISOString().slice(0, 10) 
      : null;

    lastIdFecha = result.rows.length > 0 ? result.rows[0].id_fecha : null;

    // Comparar la última fecha almacenada con la fecha actual
    const isSameDate = lastSavedDate && await compareDate(lastSavedDate);

    // Si la fecha no es la misma, insertamos la nueva fecha
    if (!isSameDate) {
      const toSaveDate = new Date().toISOString().slice(0, 10);
      const fechaResult = await client.query(
        `INSERT INTO Fecha (momento) VALUES ($1) ON CONFLICT DO NOTHING RETURNING id_fecha`,
        [toSaveDate]
      );

      // Si se ha insertado una nueva fecha, actualizamos el ID
      if (fechaResult.rows.length > 0) {
        lastIdFecha = fechaResult.rows[0].id_fecha; // Obtener el ID de la nueva fecha
        console.log("Nueva fecha almacenada en la base de datos bajo el ID: "+ lastIdFecha);
      } else {
        console.log("No se almacenó una nueva fecha, probablemente ya existía.");
      }
    } else {
      console.log("La fecha actual ya está almacenada bajo el ID: "+lastIdFecha);
    }
    
    return lastIdFecha; // Retornar el ID de la última fecha
  } catch (error) {
    console.error("Error almacenando las estaciones: ", error);
    throw error; // Lanza el error para ser manejado más arriba si es necesario
  }
}


async function getLastData() {
  let dateId = await evaluateDate();
  let idMomento = null;
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;

    for (const feature of data.features) {
      const properties = feature.properties;

      // Conseguir el ID de la estación basado en su codigo nacional (identificador único);
      const estacionResult = await client.query(
        `SELECT id_estacion FROM Estacion WHERE codigo_nacional = $1`,
        [properties.CodigoNacional]
      );

      const idEstacion = estacionResult.rows.length ? estacionResult.rows[0].id_estacion : null;
      if (!idEstacion) {
        console.error(`Estación no encontrada para código nacional: ${properties.CodigoNacional}`);
        continue; // Saltar a la siguiente iteración del bucle si no hay estación
      }
      
      // Transformamos "momento" en un dato de sólo tiempo HH:MM:SS
      const fullDate = new Date(properties.momento);
      const localFullDate = new Date(fullDate.getTime() - fullDate.getTimezoneOffset() * 60 *1000);


      const momentoTimeOnly = localFullDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const verifyMoment = await client.query(
        'SELECT id_momento FROM momentos WHERE momento = $1 AND fk_fecha = $2',
        [momentoTimeOnly,dateId]
      );

      if(verifyMoment && verifyMoment.rows && verifyMoment.rows.length === 0){
        const momentoResult = await client.query(
          `INSERT INTO Momentos (fk_estacion, fk_fecha, momento) VALUES ($1, $2, $3) RETURNING id_momento`,
          [idEstacion, dateId, momentoTimeOnly]
        );
        idMomento = momentoResult.rows[0].id_momento;
      } else {
        idMomento = verifyMoment.rows[0].id_momento;        
      }

      // Insertar o actualizar datos de viento
      await client.query(
        `INSERT INTO Vientos (fk_momento, fk_estacion, fk_fecha, intensidad_viento_maximo_6h, intensidad_viento_maximo_hoy, intensidad_viento_maximo_manana, direccion_del_viento, intensidad_del_viento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          idMomento,
          idEstacion,
          dateId,
          properties.intensidadVientoMaximo6h || null,
          properties.intensidadVientoMaximoHoy || null,
          properties.intensidadVientoMaximoManana || null,
          properties.direccionDelViento || null,
          properties.intensidadDelViento || null,
        ]
      );

      await client.query(
        `INSERT INTO Humedad (fk_momento, fk_estacion, fk_fecha, humedad, humedad_6h, humedad_minima_hoy, humedad_minima_manana)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          idMomento,
          idEstacion,
          dateId,
          properties.humedad || null,
          properties.humedad6h || null,
          properties.humedadMinimaHoy || null,
          properties.humedadMinimaManana || null
        ]
      );

      await client.query(
        `INSERT INTO Temperatura (fk_momento, fk_estacion, fk_fecha, temperatura, temperatura_6h, temperatura_maxima_hoy, temperatura_maxima_manana)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          idMomento,
          idEstacion,
          dateId,
          properties.temperatura || null,
          properties.temperatura6h || null,
          properties.temperaturaMaximaHoy || null,
          properties.temperaturaMaximaManana || null
        ]
      );
    }

    console.log("Datos actualizados exitosamente.");
  } catch (error) {
    console.error("Error almacenando la nueva data: ", error);
  }
}

async function main() {
  try {
    await connectDb();
    await getLastData();
  } finally {
    await disconnectDb();
  }
}

main();
