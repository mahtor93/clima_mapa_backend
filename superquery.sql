SELECT 
    e.nombre_estacion,
    ue.latitud,
    ue.longitud,
    v.direccion_del_viento,
    h.humedad,
    t.temperatura
FROM 
    Estacion e
JOIN 
    Ubicacion_Estacion ue ON e.fk_ubicacion_estacion = ue.id_ubicacion_estacion
LEFT JOIN 
    (SELECT 
         fk_momento,
         direccion_del_viento,
         ROW_NUMBER() OVER (PARTITION BY fk_momento ORDER BY momento DESC) AS rn
     FROM 
         Vientos v
     JOIN 
         Momentos m ON v.fk_momento = m.id_momento) v ON v.fk_momento = (
        SELECT id_momento
        FROM Momentos
        WHERE fk_estacion = e.id_estacion
        ORDER BY momento DESC
        LIMIT 1
    ) AND v.rn = 1
LEFT JOIN 
    (SELECT 
         fk_momento,
         humedad,
         ROW_NUMBER() OVER (PARTITION BY fk_momento ORDER BY momento DESC) AS rn
     FROM 
         Humedad h
     JOIN 
         Momentos m ON h.fk_momento = m.id_momento) h ON h.fk_momento = (
        SELECT id_momento
        FROM Momentos
        WHERE fk_estacion = e.id_estacion
        ORDER BY momento DESC
        LIMIT 1
    ) AND h.rn = 1
LEFT JOIN 
    (SELECT 
         fk_momento,
         temperatura,
         ROW_NUMBER() OVER (PARTITION BY fk_momento ORDER BY momento DESC) AS rn
     FROM 
         Temperatura t
     JOIN 
         Momentos m ON t.fk_momento = m.id_momento) t ON t.fk_momento = (
        SELECT id_momento
        FROM Momentos
        WHERE fk_estacion = e.id_estacion
        ORDER BY momento DESC
        LIMIT 1
    ) AND t.rn = 1
ORDER BY 
    e.nombre_estacion;



----------------------------
              SELECT 
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