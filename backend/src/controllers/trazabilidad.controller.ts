import { Request, Response } from 'express'
import { Venta } from '../models/venta.model'
import { Usuario } from '../models/usuario.model'

export const obtenerTrazabilidad = async (req: Request, res: Response) => {
    try {
        const { vendedor, estado, producto, inicio, fin } = req.query

        let filtro: any = {}

        if (vendedor) filtro.vendedor = vendedor

        if (estado) filtro.estado = { $regex: `^${estado}$`, $options: 'i' }

        // ─── Fix zona horaria UTC-5 ───────────────────────────────────────
        if (inicio && fin) {
            const desde = new Date(inicio as string)
            desde.setUTCHours(5, 0, 0, 0)
            const hasta = new Date(fin as string)
            hasta.setUTCHours(4, 59, 59, 999)
            hasta.setDate(hasta.getDate() + 1)
            filtro.fecha = { $gte: desde, $lte: hasta }
        }

        if (producto) filtro['items.nombre'] = { $regex: producto, $options: 'i' }

        const ventas = await Venta.find(filtro)
            .populate('vendedor', 'nombre username')
            .populate('usuarioAccion', 'nombre username')
            .sort({ fecha: -1 })

        const totalBruto = ventas.reduce((s, v) => s + v.total, 0)
        const ventasAnuladas = ventas.filter(v => v.estado === 'anulada')
        const totalAnulado = ventasAnuladas.reduce((s, v) => s + v.total, 0)
        const totalNeto = totalBruto - totalAnulado
        const ticketPromedio = ventas.length > 0 ? totalBruto / ventas.length : 0

        // ─── CA-4: desglose total anulado por motivo ──────────────────────
        const desgloseMotivoAnulado: Record<string, number> = {
            'Error de registro': 0,
            'Devolucion total': 0,
            'Producto defectuoso': 0,
            'Otro': 0
        }
        for (const v of ventasAnuladas) {
            const m = v.motivo || 'Otro'
            if (desgloseMotivoAnulado[m] !== undefined) {
                desgloseMotivoAnulado[m] = (desgloseMotivoAnulado[m] ?? 0) + v.total
            } else {
                desgloseMotivoAnulado['Otro'] = (desgloseMotivoAnulado['Otro'] ?? 0) + v.total
            }
        }
        // ──────────────────────────────────────────────────────────────────

        const detalle = ventas.map(v => ({
            _id: v._id,
            fecha: v.fecha,
            vendedor: (v.vendedor as any)?.nombre || (v.vendedor as any)?.username,
            productos: v.items,
            total: v.total,
            estado: v.estado,
            motivo: v.motivo || null,
            fechaAnulacion: v.fechaAnulacion || null,
            fechaModificacion: v.fechaModificacion || null,
            usuarioAccion: (v.usuarioAccion as any)?.nombre || (v.usuarioAccion as any)?.username || '-'
        }))

        return res.json({
            resumen: {
                totalBruto,
                totalAnulado,
                totalNeto,
                ticketPromedio,
                transacciones: ventas.length,
                desgloseMotivoAnulado   // ← CA-4
            },
            detalle
        })
    } catch {
        return res.status(500).json({ mensaje: 'Error al obtener trazabilidad' })
    }
}