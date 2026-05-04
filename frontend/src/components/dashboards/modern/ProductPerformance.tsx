export const ProductPerformance = () => {
  return (
    <div className="bg-card rounded-lg p-6 border border-border w-full">
      <h5 className="card-title mb-1">Productos en Inventario</h5>
      <p className="text-muted-foreground text-sm mb-4">
        Estado actual del catálogo
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">#</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Producto</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Categoría</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Stock</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="text-center py-8 text-muted-foreground">
                Sin productos registrados aún
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}