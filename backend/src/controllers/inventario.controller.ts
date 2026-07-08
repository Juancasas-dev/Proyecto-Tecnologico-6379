import { Request, Response } from 'express'
import { Mercaderia } from '../models/mercaderia.model'
import { Producto } from '../models/producto.model'
import { HistorialInventario } from '../models/historialInventario.model'
import { Alerta } from '../models/alerta.model'
import { Usuario } from '../models/usuario.model'

export const registrarIngreso = async (req: Request, res: Response) => {
  try {
    const { producto, cantidad, fechaIngreso, fechaVencimiento, proveedor, numeroDocumento } = req.body
    const usuario = (req as any).usuario

    if (!producto || !cantidad || !fechaVencimiento) {
      return res.status(400).json({
        mensaje: 'Producto, cantidad y fecha de vencimiento son obligatorios'
      })
    }

    if (new Date(fechaVencimiento) < new Date()) {
      return res.status(400).json({
        mensaje: 'La fecha de vencimiento ingresada ya pasó. Verifica la fecha antes de continuar.'
      })
    }

    if (cantidad <= 0) {
      return res.status(400).json({
        mensaje: 'La cantidad debe ser mayor a cero'
      })
    }

    const productoExiste = await Producto.findById(producto)

    if (!productoExiste) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado'
      })
    }

    const nuevaMercaderia = await Mercaderia.create({
      producto,
      cantidad,
      cantidadRestante: cantidad,
      fechaIngreso: fechaIngreso || new Date(),
      fechaVencimiento,
      creadoPor: usuario?.id || null,
      proveedor: proveedor || null,
      numeroDocumento: numeroDocumento || ''
    })

    productoExiste.stock = (productoExiste.stock || 0) + Number(cantidad)
    productoExiste.proveedor = proveedor || productoExiste.proveedor
    await productoExiste.save()

    if (productoExiste.stock > productoExiste.nivelMinimo) {
      await Alerta.updateOne(
        { producto: productoExiste._id, tipo: 'stock_bajo', activa: true },
        { activa: false }
      )
    }

    await HistorialInventario.create({
      productoId: producto,
      tipo: 'ingreso',
      cantidad: Number(cantidad),
      stockAnterior: productoExiste.stock - Number(cantidad),
      stockNuevo: productoExiste.stock,
      usuarioId: usuario?.id,
      fecha: new Date(),
      observaciones: `Ingreso de ${cantidad} unidades`
    })

    return res.status(201).json({
      mensaje: 'Ingreso registrado correctamente',
      mercaderia: nuevaMercaderia,
      nuevoStock: productoExiste.stock
    })
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar ingreso' })
  }
}


export const listarMercaderia = async (_req: Request, res: Response) => {
  try {
    const ingresos = await Mercaderia.find()
      .populate('producto', 'nombre marca stock')
      .populate('proveedor', 'nombre ruc')
      .sort({ createdAt: -1 })

    res.json(ingresos)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar ingresos' })
  }
}


export const obtenerIngresoPorId = async (req: Request, res: Response) => {
  try {
    const ingreso = await Mercaderia.findById(req.params.id)
      .populate('producto', 'nombre marca stock')

    if (!ingreso) {
      return res.status(404).json({ mensaje: 'Ingreso no encontrado' })
    }

    res.json(ingreso)
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener ingreso' })
  }
}


export const eliminarIngreso = async (req: Request, res: Response) => {
  try {
    const ingreso = await Mercaderia.findById(req.params.id)

    if (!ingreso) {
      return res.status(404).json({ mensaje: 'Ingreso no encontrado' })
    }

    const producto = await Producto.findById(ingreso.producto)

    if (producto) {
      producto.stock -= ingreso.cantidad
      if (producto.stock < 0) producto.stock = 0
      await producto.save()
    }

    await ingreso.deleteOne()

    res.json({ mensaje: 'Ingreso eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar ingreso' })
  }
}


export const actualizarIngreso = async (req: Request, res: Response) => {
  try {
    const { cantidad, fechaVencimiento, proveedor, numeroDocumento } = req.body

    const ingreso = await Mercaderia.findById(req.params.id)

    if (!ingreso) {
      return res.status(404).json({ mensaje: 'Ingreso no encontrado' })
    }

    const producto = await Producto.findById(ingreso.producto)

    if (producto) {

      producto.stock -= ingreso.cantidad


      producto.stock += Number(cantidad)

      await producto.save()
    }

    ingreso.cantidad = cantidad
    ingreso.cantidadRestante = cantidad
    ingreso.fechaVencimiento = fechaVencimiento
    if (proveedor !== undefined) ingreso.proveedor = proveedor
    if (numeroDocumento !== undefined) ingreso.numeroDocumento = numeroDocumento

    await ingreso.save()

    res.json({
      mensaje: 'Ingreso actualizado correctamente',
      ingreso
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar ingreso' })
  }
}

export const obtenerStock = async (req: Request, res: Response) => {
  try {
    const { productoId } = req.params

    const lotes = await Mercaderia.find({
      producto: productoId as any,
      cantidadRestante: { $gt: 0 }
    }).select('cantidadRestante fechaVencimiento')

    const stockTotal = lotes.reduce((sum, lote) => sum + lote.cantidadRestante, 0)

    res.json({
      productoId,
      stockTotal,
      lotes: lotes.map(l => ({
        cantidadRestante: l.cantidadRestante,
        fechaVencimiento: l.fechaVencimiento
      }))
    })
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular stock' })
  }
}

export const ajustarInventario = async (req: Request, res: Response) => {
  try {
    const { productoId, tipo, cantidad, causa } = req.body
    const usuario = (req as any).usuario

    if (!causa) {
      return res.status(400).json({
        mensaje: 'Debes seleccionar la causa del ajuste para continuar. Este campo es obligatorio.'
      })
    }

    const producto = await Producto.findById(productoId)
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' })
    }

    const stockAnterior = producto.stock
    const valorEconomico = Number(cantidad) * producto.precio  // 👈 agrega

    if (tipo === 'salida') {
      if (producto.stock < Number(cantidad)) {
        return res.status(400).json({
          mensaje: 'No hay stock suficiente para realizar el ajuste'
        })
      }
      producto.stock -= Number(cantidad)

    } else if (tipo === 'entrada') {
      producto.stock += Number(cantidad)

      await Mercaderia.create({
        producto: productoId,
        cantidad: Number(cantidad),
        cantidadRestante: Number(cantidad),
        fechaIngreso: new Date(),
        fechaVencimiento: null as any,
        creadoPor: usuario?.id || null
      })

    } else {
      return res.status(400).json({ mensaje: 'Tipo de ajuste inválido' })
    }

    await producto.save()
    if (tipo === 'entrada' && producto.stock > producto.nivelMinimo) {
      await Alerta.updateOne(
        { producto: producto._id, tipo: 'stock_bajo', activa: true },
        { activa: false }
      )
    }

    await HistorialInventario.create({
      productoId,
      tipo: tipo === 'entrada' ? 'ajuste_entrada' : 'ajuste_salida',
      cantidad: Number(cantidad),
      stockAnterior,
      stockNuevo: producto.stock,
      usuarioId: usuario?.id || usuario?._id,
      fecha: new Date(),
      causa,
      valorEconomico: tipo === 'salida' ? valorEconomico : 0,
      observaciones: `${tipo.toUpperCase()} - ${causa} - Impacto: S/ ${valorEconomico.toFixed(2)}`
    })

    return res.json({
      mensaje: 'Ajuste realizado correctamente',
      stockAnterior,
      stockNuevo: producto.stock,
      valorEconomico
    })

  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al realizar ajuste' })
  }
}

export const obtenerMovimientosTurno = async (req: Request, res: Response) => {
  try {
    const usuario = (req as any).usuario
    const usuarioData = await Usuario.findById(usuario.id || usuario._id)

    const desde = usuarioData?.ultimoLogout || new Date(0)

    const movimientos = await HistorialInventario.find({
      fecha: { $gte: desde }
    })
      .populate('productoId', 'nombre marca')
      .populate('usuarioId', 'nombre username')
      .sort({ fecha: 1 })

    res.json({
      desde,
      movimientos
    })
  } catch {
    res.status(500).json({ mensaje: 'Error al obtener movimientos' })
  }
}

export const listarHistorialAjustes = async (_req: Request, res: Response) => {
  try {
    const historial = await HistorialInventario.find({
      tipo: { $in: ['ajuste_entrada', 'ajuste_salida', 'ajuste'] }
    })
      .populate('productoId', 'nombre marca')
      .populate('usuarioId', 'nombre username')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(historial)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar historial' })
  }
}

export const registrarIngresoMasivo = async (req: Request, res: Response) => {
  try {
    const { proveedor, numeroDocumento, items } = req.body
    const usuario = (req as any).usuario

    if (!items || items.length === 0) {
      return res.status(400).json({ mensaje: 'Debes agregar al menos un producto' })
    }
    if (!proveedor) {
      return res.status(400).json({ mensaje: 'El proveedor es obligatorio' })
    }
    if (!numeroDocumento?.trim()) {
      return res.status(400).json({ mensaje: 'El número de documento es obligatorio' })
    }

    // ─── Validar fechas vencidas antes de procesar ────────────────────
    for (const item of items) {
      if (!item.producto || !item.cantidad || !item.fechaVencimiento) {
        return res.status(400).json({
          mensaje: 'Cada producto requiere cantidad y fecha de vencimiento'
        })
      }
      if (new Date(item.fechaVencimiento) < new Date()) {
        const prod = await Producto.findById(item.producto)
        return res.status(400).json({
          mensaje: `Fecha de vencimiento expirada para "${prod?.nombre || item.producto}"`
        })
      }
      if (Number(item.cantidad) <= 0) {
        return res.status(400).json({ mensaje: 'La cantidad debe ser mayor a cero' })
      }
    }

    // ─── Referencia única para agrupar todos los lotes del mismo ingreso
    const referenciaIngreso = `ING-${Date.now()}`
    const resultados = []

    for (const item of items) {
      const productoExiste = await Producto.findById(item.producto)
      if (!productoExiste) continue

      const nuevaMercaderia = await Mercaderia.create({
        producto: item.producto,
        cantidad: Number(item.cantidad),
        cantidadRestante: Number(item.cantidad),
        fechaIngreso: new Date(),
        fechaVencimiento: item.fechaVencimiento,
        creadoPor: usuario?.id || null,
        proveedor,
        numeroDocumento: numeroDocumento.trim(),
        referenciaIngreso
      })

      const stockAnterior = productoExiste.stock
      productoExiste.stock += Number(item.cantidad)
      productoExiste.proveedor = proveedor
      await productoExiste.save()

      // Desactivar alerta de stock bajo si corresponde
      if (productoExiste.stock > productoExiste.nivelMinimo) {
        await Alerta.updateOne(
          { producto: productoExiste._id, tipo: 'stock_bajo', activa: true },
          { activa: false }
        )
      }

      await HistorialInventario.create({
        productoId: item.producto,
        tipo: 'ingreso',
        cantidad: Number(item.cantidad),
        stockAnterior,
        stockNuevo: productoExiste.stock,
        usuarioId: usuario?.id,
        fecha: new Date(),
        observaciones: `Ingreso masivo - Doc: ${numeroDocumento} - Ref: ${referenciaIngreso}`
      })

      resultados.push({
        producto: productoExiste.nombre,
        cantidad: item.cantidad,
        nuevoStock: productoExiste.stock
      })
    }

    return res.status(201).json({
      mensaje: `Ingreso masivo completado — ${resultados.length} producto(s) procesado(s)`,
      referenciaIngreso,
      resultados
    })
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar ingreso masivo' })
  }
}