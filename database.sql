-- Tabla: Fecha
CREATE TABLE Fecha (
  id_fecha SERIAL PRIMARY KEY,
  momento TIMESTAMP
);

CREATE TABLE Momentos (
  id_momento SERIAL PRIMARY KEY,
  fk_estacion INT NOT NULL REFERENCES Estacion(id_estacion) ON DELETE CASCADE,
  fk_fecha INT NOT NULL REFERENCES Fecha(id_fecha) ON DELETE CASCADE,
  momento TIME NOT NULL
);

-- Tabla: Ubicacion_Estacion
CREATE TABLE Ubicacion_Estacion (
  id_ubicacion_estacion SERIAL PRIMARY KEY,
  latitud REAL,
  longitud REAL,
  altura INT
);

-- Tabla: Jurisdiccion_Estacion
CREATE TABLE Jurisdiccion_Estacion (
  id_jurisdiccion_estacion SERIAL PRIMARY KEY,
  provincia VARCHAR(50),
  comuna VARCHAR(50),
  region VARCHAR(50),
  numero_region INT
);

-- Tabla: Estacion
CREATE TABLE Estacion (
  id_estacion SERIAL PRIMARY KEY,
  fk_ubicacion_estacion INT REFERENCES Ubicacion_Estacion(id_ubicacion_estacion),
  fk_jurisdiccion_estacion INT REFERENCES Jurisdiccion_Estacion(id_jurisdiccion_estacion),
  codigo_nacional INT,
  nombre_estacion VARCHAR(50)
);

-- Tabla: Vientos
CREATE TABLE Vientos (
  id SERIAL PRIMARY KEY,
  fk_momento INT REFERENCES Momentos(id_momento),
  fk_fecha INT REFERENCES Fecha(id_fecha),
  fk_estacion INT REFERENCES Estacion(id_estacion),
  intensidad_viento_maximo_6h REAL,
  intensidad_viento_maximo_hoy REAL,
  intensidad_viento_maximo_manana REAL,
  direccion_del_viento VARCHAR(50),
  intensidad_del_viento REAL
);

-- Tabla: Humedad
CREATE TABLE Humedad (
  id SERIAL PRIMARY KEY,
  fk_momento INT REFERENCES Momentos(id_momento),
  fk_fecha INT REFERENCES Fecha(id_fecha),
  fk_estacion INT REFERENCES Estacion(id_estacion),
  humedad REAL,
  humedad_6h REAL,
  humedad_minima_hoy REAL,
  humedad_minima_manana REAL
);

-- Tabla: Temperatura
CREATE TABLE Temperatura (
  id SERIAL PRIMARY KEY,
  fk_momento INT REFERENCES Momentos(id_momento),
  fk_fecha INT REFERENCES Fecha(id_fecha),
  fk_estacion INT REFERENCES Estacion(id_estacion),
  temperatura REAL,
  temperatura_6h REAL,
  temperatura_maxima_hoy REAL,
  temperatura_maxima_manana REAL
);


DELETE FROM Vientos;
DELETE FROM Humedad;
DELETE FROM Temperatura;
DELETE FROM Momentos;
DELETE FROM Estacion;
DELETE FROM Fecha;
DELETE FROM jurisdiccion_estacion;
DELETE FROM ubicacion_estacion;