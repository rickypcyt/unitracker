export function distributeItems(layout, columns) {
  // 1. Mantén las columnas visibles originales (hasta el límite de columnas visibles)
  const visible = layout.slice(0, columns).map(col => ({
    id: col.id,
    items: [...col.items],
  }));

  // 2. Junta los items de las columnas ocultas
  const hiddenItems = layout.slice(columns).flatMap(col => col.items);

  // 3. Añade los items ocultos al final de las columnas visibles (puedes repartirlos o simplemente agregarlos al final de la última columna visible)
  hiddenItems.forEach(item => {
    // Puedes cambiar esto si prefieres repartirlos
    visible[visible.length - 1].items.push(item);
  });

  // 4. Si faltan columnas (por ejemplo, layout tiene menos columnas que columns), crea columnas vacías
  while (visible.length < columns) {
    visible.push({ id: `column-${visible.length + 1}`, items: [] });
  }

  return visible;
}

