-- Datos de producción de ORQELIS y catálogo inicial visible.
insert into public.settings (key, value) values
  ('store_name', 'ORQELIS'),
  ('whatsapp_number', '541155912747'),
  ('instagram_url', 'https://instagram.com/seba.r.z')
on conflict (key) do update set value = excluded.value;

insert into public.products (
  id, name, slug, short_description, description, price, previous_price,
  installments, installment_price, category_id, stock, status, featured, offer, is_new, tags,
  created_at, updated_at
) values
  (
    '20000000-0000-4000-8000-000000000001',
    'Termo simil STL 1.2L + Mate personalizado',
    'termo-simil-stl-1-2l-mate-personalizado',
    'Un set matero completo, resistente y personalizado para regalar o disfrutar todos los días.',
    E'Termo simil STL de 1.2 litros acompañado de mate personalizado.\n\nEstampa realizada en DTF UV resistente a altas temperaturas.\n\nIdeal para uso personal o regalo.',
    55000, 62000, 2, 30000,
    '10000000-0000-4000-8000-000000000005', 8, 'available', true, true, true,
    array['termo','mate','personalizado','regalo','dtf uv'],
    '2026-08-18T12:00:00.000Z', '2026-08-18T12:00:00.000Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Freidora de aire digital 6.5L',
    'freidora-de-aire-digital-6-5l',
    'Gran capacidad, panel digital y cocción práctica con menos aceite.',
    'Freidora de aire de gran capacidad con programas automáticos y canasto antiadherente.',
    128900, 149900, 3, 46900,
    '10000000-0000-4000-8000-000000000001', 3, 'last_units', true, true, false,
    array['freidora','cocina','electro','air fryer'],
    '2026-08-14T12:00:00.000Z', '2026-08-18T12:00:00.000Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Auriculares inalámbricos Pro',
    'auriculares-inalambricos-pro',
    'Sonido nítido, estuche de carga y conexión estable para todos los días.',
    'Auriculares Bluetooth compactos con estuche de carga y controles táctiles.',
    28900, null, 2, 16000,
    '10000000-0000-4000-8000-000000000002', 12, 'available', true, false, true,
    array['auriculares','bluetooth','audio'],
    '2026-08-11T12:00:00.000Z', '2026-08-18T12:00:00.000Z'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'Set de sartenes antiadherentes',
    'set-de-sartenes-antiadherentes',
    'Tres medidas esenciales con terminación antiadherente y mango soft touch.',
    'Set de sartenes versátil para renovar los básicos de tu cocina.',
    74900, 84900, 2, 41000,
    '10000000-0000-4000-8000-000000000003', 5, 'available', true, true, false,
    array['sartenes','cocina','bazar','antiadherente'],
    '2026-08-05T12:00:00.000Z', '2026-08-18T12:00:00.000Z'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'Velador nórdico touch',
    'velador-nordico-touch',
    'Luz cálida regulable y diseño limpio para mesa de luz o escritorio.',
    'Velador recargable con tres intensidades de luz y control táctil.',
    34500, null, 2, 19000,
    '10000000-0000-4000-8000-000000000004', null, 'available', false, false, true,
    array['velador','luz','decoración','hogar'],
    '2026-08-17T12:00:00.000Z', '2026-08-18T12:00:00.000Z'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    'Taza térmica personalizada',
    'taza-termica-personalizada',
    'Tu diseño, frase o foto en una taza térmica lista para regalar.',
    'Taza térmica personalizada con excelente definición y terminación duradera.',
    18900, 22000, null, null,
    '10000000-0000-4000-8000-000000000006', null, 'available', false, true, false,
    array['taza','personalizado','regalo'],
    '2026-07-30T12:00:00.000Z', '2026-08-18T12:00:00.000Z'
  )
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  previous_price = excluded.previous_price,
  installments = excluded.installments,
  installment_price = excluded.installment_price,
  category_id = excluded.category_id,
  stock = excluded.stock,
  status = excluded.status,
  featured = excluded.featured,
  offer = excluded.offer,
  is_new = excluded.is_new,
  tags = excluded.tags,
  updated_at = excluded.updated_at;

insert into public.product_images (id, product_id, image_url, position) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '/products/termo-mate.svg', 0),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '/products/termo-detalle.svg', 1),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', '/products/freidora.svg', 0),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', '/products/auriculares.svg', 0),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '/products/sartenes.svg', 0),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005', '/products/velador.svg', 0),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000006', '/products/taza.svg', 0)
on conflict (id) do update set
  product_id = excluded.product_id,
  image_url = excluded.image_url,
  position = excluded.position;

insert into public.product_features (id, product_id, feature) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Capacidad 1.2 litros'),
  ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Mate incluido'),
  ('40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Diferentes diseños disponibles'),
  ('40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'Estampa DTF UV'),
  ('40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'Resistente a altas temperaturas'),
  ('40000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'Entrega rápida'),
  ('40000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'Capacidad 6.5 litros'),
  ('40000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000002', 'Panel digital'),
  ('40000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000002', 'Canasto antiadherente'),
  ('40000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000002', 'Programas automáticos'),
  ('40000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000003', 'Conexión Bluetooth'),
  ('40000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000003', 'Estuche de carga'),
  ('40000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000003', 'Control táctil'),
  ('40000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000003', 'Micrófono integrado'),
  ('40000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000004', '3 tamaños'),
  ('40000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000004', 'Antiadherente'),
  ('40000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000004', 'Mangos soft touch'),
  ('40000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000004', 'Fácil limpieza'),
  ('40000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000005', '3 intensidades'),
  ('40000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000005', 'Control táctil'),
  ('40000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000005', 'Recargable'),
  ('40000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000005', 'Luz cálida'),
  ('40000000-0000-4000-8000-000000000023', '20000000-0000-4000-8000-000000000006', 'Diseño a elección'),
  ('40000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000006', 'Apta para bebidas calientes'),
  ('40000000-0000-4000-8000-000000000025', '20000000-0000-4000-8000-000000000006', 'Terminación duradera')
on conflict (id) do update set
  product_id = excluded.product_id,
  feature = excluded.feature;
