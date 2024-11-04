select 
	t.temperatura,
	h.humedad,
	v.direccion_del_viento,
	v.intensidad_del_viento,
	f.momento,
	je.provincia,
	je.comuna
	from temperatura t 
	join fecha f 
	on t.fk_fecha = f.id_fecha
	join estacion es
	on es.id_estacion = t.fk_estacion
	join humedad h
	on h.fk_fecha = f.id_fecha AND h.fk_estacion = es.id_estacion
	join vientos v
	on v.fk_fecha = f.id_fecha AND v.fk_estacion = es.id_estacion
	join jurisdiccion_estacion je 
	on je.id_jurisdiccion_estacion = es.fk_jurisdiccion_estacion
	where es.id_estacion = 1356 AND f.id_fecha = 12;

