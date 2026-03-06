-- =============================================
-- AZUTRANS - Usuarios de Produccion
-- =============================================
-- INSTRUCCIONES:
-- 1. Primero, crear cada usuario desde el dashboard de Supabase (Authentication > Users > Add User)
--    o desde la pagina de registro de la aplicacion.
-- 2. Luego ejecutar este script para asignar los roles correctos.
--
-- USUARIOS:
--   - Carlos Alberto Rueda Sanchez (CC 91.495.789) - Cava411@hotmail.com - operador
--   - Flor Alba Rueda Sanchez (CC 63.315.096) - Flor.alba.rueda@gmail.com - administrador
--   - Maria Cristina Rueda Sanchez (CC 63.367.696) - mariacristinaruedasanchez@gmail.com - administrador
--   - Paula Andrea Gomez Rueda (CC 1.098.756.163) - Paulagomezr_94@gmail.com - administrador
-- =============================================

-- Actualizar roles a administrador para las 3 super administradoras
UPDATE public.usuarios
SET rol = 'administrador'
WHERE email IN (
  'Flor.alba.rueda@gmail.com',
  'flor.alba.rueda@gmail.com',
  'mariacristinaruedasanchez@gmail.com',
  'Paulagomezr_94@gmail.com',
  'paulagomezr_94@gmail.com'
);

-- Actualizar nombres completos (en caso de que se hayan registrado con nombre incompleto)
UPDATE public.usuarios SET nombre = 'Carlos Alberto Rueda Sanchez'
WHERE LOWER(email) = 'cava411@hotmail.com';

UPDATE public.usuarios SET nombre = 'Flor Alba Rueda Sanchez'
WHERE LOWER(email) = 'flor.alba.rueda@gmail.com';

UPDATE public.usuarios SET nombre = 'Maria Cristina Rueda Sanchez'
WHERE LOWER(email) = 'mariacristinaruedasanchez@gmail.com';

UPDATE public.usuarios SET nombre = 'Paula Andrea Gomez Rueda'
WHERE LOWER(email) = 'paulagomezr_94@gmail.com';
