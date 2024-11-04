const express = require('express');
require('dotenv').config();
const { ApolloServer, gql } = require('apollo-server-express');
const { Client } = require('pg');


const startServer = async () => {
    const app = express();

    // Configura tu cliente de PostgreSQL
    const client = new Client({
        host: process.env.ENV_HOST,
        port: process.env.ENV_PORT,
        user: process.env.ENV_DB_USR,
        password: process.env.ENV_DB_PSW,
        database: process.env.ENV_DB_NAME
    });

    // Conéctate a la base de datos
    await client.connect();

    // Define tu esquema GraphQL
    const typeDefs = gql`
      type Estacion {
        id_estacion: Int
        nombre_estacion: String
        latitud: Float
        longitud: Float
        direccion_del_viento: String
        intensidad_del_viento: Float
        humedad: Float
        temperatura: Float
      }

      type LecturaHumedad {
        momento: String
        humedad: Float
        humedad_6h: Float
        humedad_minima_hoy: Float
        humedad_minima_manana: Float
      }
      
      type LecturaTemperatura {
        momento: String
        temperatura: Float
        temperatura_6h: Float
        temperatura_maxima_hoy: Float
        temperatura_maxima_manana: Float
      }
      
      type UltimasLecturas {
        humedad: [LecturaHumedad]
        temperatura: [LecturaTemperatura]
      }

    
      type Query {
        estaciones: [Estacion]
        ultimasLecturas(id_estacion: Int!, id_fecha: Int!, limite: Int!): UltimasLecturas
      }
    `;

    // Define tus resolvers
    const resolvers = {
      Query: {
        estaciones: async () => {
          try {
            const result = await client.query(`
              SELECT 
                  e.id_estacion,
                  e.nombre_estacion,
                  ue.latitud,
                  ue.longitud,
                  COALESCE(v.direccion_del_viento, '') AS direccion_del_viento,
                  COALESCE(v.intensidad_del_viento, 0) AS intensidad_del_viento,
                  COALESCE(h.humedad, 0) AS humedad,
                  COALESCE(t.temperatura, 0) AS temperatura
              FROM 
                  Estacion e
              JOIN 
                  Ubicacion_Estacion ue ON e.fk_ubicacion_estacion = ue.id_ubicacion_estacion
              LEFT JOIN LATERAL (
                  SELECT direccion_del_viento, intensidad_del_viento
                  FROM Vientos v
                  WHERE v.fk_estacion = e.id_estacion
                  ORDER BY v.fk_fecha DESC, v.fk_momento DESC
                  LIMIT 1
              ) v ON true
              LEFT JOIN LATERAL (
                  SELECT humedad
                  FROM Humedad h
                  WHERE h.fk_estacion = e.id_estacion
                  ORDER BY h.fk_fecha DESC, h.fk_momento DESC
                  LIMIT 1
              ) h ON true
              LEFT JOIN LATERAL (
                  SELECT temperatura
                  FROM Temperatura t
                  WHERE t.fk_estacion = e.id_estacion
                  ORDER BY t.fk_fecha DESC, t.fk_momento DESC
                  LIMIT 1
              ) t ON true
              ORDER BY 
                  e.nombre_estacion;
            `);
            
            return result.rows; // Devuelve los resultados de la consulta
          } catch (error) {
            console.error("Error al consultar estaciones:", error);
            throw new Error("No se pudieron obtener las estaciones");
          }
        },
        ultimasLecturas: async (_,{id_estacion,id_fecha,limite}) => {
          try {
            const humedadResult = await client.query(`
              SELECT
                m.momento, h.humedad, h.humedad_6h, h.humedad_minima_hoy, h.humedad_minima_manana
              FROM 
                Humedad h
              JOIN
                momentos m ON h.fk_momento = m.id_momento
              WHERE 
                h.fk_estacion = $1 AND h.fk_fecha = $2
              ORDER BY 
                h.fk_momento DESC
              LIMIT $3
            `, [id_estacion, id_fecha, limite]);
    
            const temperaturaResult = await client.query(`
              SELECT
                m.momento, t.temperatura, t.temperatura_6h, t.temperatura_maxima_hoy, t.temperatura_maxima_manana
              FROM 
                Temperatura t
              JOIN
                momentos m ON t.fk_momento = m.id_momento
              WHERE 
                t.fk_estacion = $1 AND t.fk_fecha = $2
              ORDER BY 
                t.fk_momento DESC
              LIMIT $3
            `, [id_estacion, id_fecha, limite]);
    
            return {
              humedad: humedadResult.rows,
              temperatura: temperaturaResult.rows
            };
          } catch (error) {
            console.error("Error al consultar lecturas:", error);
            throw new Error("No se pudieron obtener las lecturas");
          }
        }
      },
    };

    const server = new ApolloServer({ typeDefs, resolvers });

    await server.start();
    server.applyMiddleware({ app });
    
    // Configura el puerto y comienza el servidor
    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer().catch((error) => {
    console.error("Error starting the server:", error);
});
