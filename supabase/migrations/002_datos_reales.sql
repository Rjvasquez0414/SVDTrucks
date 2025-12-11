-- =============================================
-- SVD Trucks - Datos Reales de la Flota
-- =============================================

-- =============================================
-- INSERTAR CONDUCTORES
-- =============================================

INSERT INTO public.conductores (nombre, cedula) VALUES
  ('Pedro José Corredor Vesga', '1095835275'),
  ('Mirto Ancizar Godoy Gutiérrez', '86041823'),
  ('Oscar Darío Rangel Castañeda', '13927609'),
  ('Darío Vesga Sánchez', '91495998'),
  ('Luis Gabriel Sánchez Jiménez', '13748516'),
  ('William Javier Corredor Bravo', '91536736');

-- =============================================
-- INSERTAR REMOLQUES
-- =============================================

INSERT INTO public.remolques (placa) VALUES
  ('R-60762'),
  ('R-56731'),
  ('S-67661'),
  ('S-51791'),
  ('R-60760'),
  ('R-60761');

-- =============================================
-- INSERTAR VEHICULOS
-- =============================================

-- SXS 870 - Pedro José Corredor Vesga - R-60762
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'SXS 870', 'Kenworth', 'T800', 2013, 'tractomula', 'Azul',
  101952, '79553892', '713270', 'activo', '2013-01-01',
  (SELECT id FROM public.conductores WHERE cedula = '1095835275'),
  (SELECT id FROM public.remolques WHERE placa = 'R-60762')
);

-- SXS 341 - Sin conductor - Sin remolque
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'SXS 341', 'Kenworth', 'T800B', 2012, 'tractomula', 'Morado',
  0, '79505733', '705048', 'inactivo', '2012-01-01',
  NULL, NULL
);

-- WOL 979 - Mirto Ancizar Godoy Gutiérrez - R-56731
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'WOL 979', 'Kenworth', 'T800', 2020, 'tractomula', 'Gris Carbon Metalico',
  497024, '80228449', '728691', 'activo', '2020-01-01',
  (SELECT id FROM public.conductores WHERE cedula = '86041823'),
  (SELECT id FROM public.remolques WHERE placa = 'R-56731')
);

-- LWY 504 - Oscar Darío Rangel Castañeda - S-67661
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'LWY 504', 'Kenworth', 'T880', 2024, 'tractomula', 'Rojo Coral Metalico',
  137999, '80498525', '208456', 'activo', '2024-01-01',
  (SELECT id FROM public.conductores WHERE cedula = '13927609'),
  (SELECT id FROM public.remolques WHERE placa = 'S-67661')
);

-- SXR 716 - Darío Vesga Sánchez - S-51791
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'SXR 716', 'Kenworth', 'T800', 2012, 'tractomula', 'Verde',
  1130125, '79479434', '702841', 'activo', '2012-01-01',
  (SELECT id FROM public.conductores WHERE cedula = '91495998'),
  (SELECT id FROM public.remolques WHERE placa = 'S-51791')
);

-- TTR 835 - Luis Gabriel Sánchez Jiménez - R-60760
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'TTR 835', 'Kenworth', 'T800', 2014, 'tractomula', 'Azul',
  1024818, '79663203', '718236', 'activo', '2014-01-01',
  (SELECT id FROM public.conductores WHERE cedula = '13748516'),
  (SELECT id FROM public.remolques WHERE placa = 'R-60760')
);

-- SXR 267 - William Javier Corredor Bravo - R-60761
INSERT INTO public.vehiculos (
  placa, marca, modelo, año, tipo, color,
  kilometraje, numero_motor, numero_chasis,
  estado, fecha_adquisicion, conductor_id, remolque_id
) VALUES (
  'SXR 267', 'Kenworth', 'T800', 2011, 'tractomula', 'Morado',
  1011260, '79449337', '3WKDD40X2BF700103', 'activo', '2011-01-01',
  (SELECT id FROM public.conductores WHERE cedula = '91536736'),
  (SELECT id FROM public.remolques WHERE placa = 'R-60761')
);
