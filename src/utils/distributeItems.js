export function distributeItems(layout, columns) {
  // Junta todos los items de todas las columnas
  const allItems = layout.flatMap(col => col.items);

  // Crea nuevas columnas vacías
  const newLayout = Array.from({ length: columns }, (_, i) => ({
    id: `column-${i + 1}`,
    items: [],
  }));

  // Distribuye los items equitativamente
  allItems.forEach((item, i) => {
    newLayout[i % columns].items.push(item);
  });

  return newLayout;
}
