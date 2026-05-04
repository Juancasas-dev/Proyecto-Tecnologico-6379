export const RecentTransaction = () => {
  return (
    <div className="bg-card rounded-lg p-6 border border-border w-full">
      <h5 className="card-title mb-1">Últimos Ingresos</h5>
      <p className="text-muted-foreground text-sm mb-4">
        Movimientos recientes de mercadería
      </p>
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Sin movimientos registrados aún
      </div>
    </div>
  )
}