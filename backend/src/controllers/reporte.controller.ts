import { Request, Response } from 'express'
import { Venta } from '../models/venta.model'
import { Producto } from '../models/producto.model'
import DemandaInsatisfecha from '../models/demandaInsatisfecha'
import { HistorialInventario } from '../models/historialInventario.model'
import PDFDocument from 'pdfkit'
import path from 'path'


const NOMBRE_NEGOCIO = 'Comercio Minorista de Alimentos Balanceados para Animales "La Granja EIRL"'
const LOGO_PATH = path.join(__dirname, '../assets/logo-sivweb.jpeg')

const dibujarEncabezado = (doc: PDFKit.PDFDocument, titulo: string) => {
  try {
    doc.image(LOGO_PATH, 40, 30, { width: 90 })
  } catch {
    
  }

  doc.fontSize(13).font('Helvetica-Bold')
     .text(NOMBRE_NEGOCIO, 140, 35, { width: 380 })

  doc.fontSize(16).font('Helvetica-Bold')
     .text(titulo, 40, 90)

  doc.moveTo(40, 115).lineTo(555, 115).strokeColor('#cccccc').stroke()
  doc.moveDown(2)
}

const dibujarPie = (doc: PDFKit.PDFDocument) => {
  const fechaGeneracion = new Date().toLocaleString('es-PE')
  doc.fontSize(8).font('Helvetica').fillColor('#888888')
     .text(`Generado por SIVWEB · ${fechaGeneracion}`, 40, 770, { align: 'center', width: 515 })
}


export const obtenerRotacionProductos = async (
  req: Request,
  res: Response
) => {
  try {
    const { inicio, fin } = req.query

    let filtro: any = {
      estado: 'completada'
    }

    if (inicio && fin) {
      const desde = new Date(inicio as string)
      desde.setUTCHours(5, 0, 0, 0)
      const hasta = new Date(fin as string)
      hasta.setUTCHours(4, 59, 59, 999)
      hasta.setDate(hasta.getDate() + 1)
      filtro.fecha = { $gte: desde, $lte: hasta }
    }

    const ventas = await Venta.find(filtro)
    const productos = await Producto.find()

    const totalVentasPeriodo = ventas.reduce(
      (suma, v) => suma + v.total,
      0
    )

    const ranking = productos.map(producto => {
      let unidadesVendidas = 0
      let totalGenerado = 0

      ventas.forEach(venta => {
        venta.items.forEach(item => {
          if (item.producto.toString() === producto._id.toString()) {
            unidadesVendidas += item.cantidad
            totalGenerado += item.subtotal
          }
        })
      })

      let porcentaje = 0
      if (totalVentasPeriodo > 0) {
        porcentaje = (totalGenerado * 100) / totalVentasPeriodo
      }

      return {
        _id: producto._id,
        nombre: producto.nombre,
        marca: producto.marca,
        unidadesVendidas,
        totalGenerado,
        porcentaje,
        categoria:
          unidadesVendidas >= 20
            ? 'Alta rotacion'
            : unidadesVendidas >= 10
            ? 'Rotacion media'
            : unidadesVendidas > 0
            ? 'Baja rotacion'
            : 'Sin movimiento'
      }
    })

    ranking.sort((a, b) => b.unidadesVendidas - a.unidadesVendidas)

    return res.json(ranking)
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener rotacion' })
  }
}

export const obtenerDemandaInsatisfecha = async (
  req: Request,
  res: Response
) => {
  try {
    const { inicio, fin } = req.query

    let filtro: any = {}

    if (inicio && fin) {
      const desde = new Date(inicio as string)
      desde.setUTCHours(5, 0, 0, 0)
      const hasta = new Date(fin as string)
      hasta.setUTCHours(4, 59, 59, 999)
      hasta.setDate(hasta.getDate() + 1)
      filtro.createdAt = { $gte: desde, $lte: hasta }
    }

    const demandas = await DemandaInsatisfecha
      .find(filtro)
      .populate('registradoPor', 'nombre username')
      .sort({ vecessolicitado: -1 })

    const resultado = demandas.map((d: any) => ({
      producto: d.producto,
      categoria: d.categoria || 'Sin categoria',
      vecesSolicitado: d.vecessolicitado,
      fecha: d.createdAt,
      vendedor: d.registradoPor?.nombre || d.registradoPor?.username || 'No registrado'
    }))

    return res.json(resultado)
  } catch {
    return res.status(500).json({ mensaje: 'Error al obtener demanda' })
  }
}

export const obtenerReportePerdidas = async (req: Request, res: Response) => {
  try {
    const { inicio, fin, causa } = req.query

    const filtro: any = {
      tipo: 'ajuste_salida',
      causa: { $ne: null }
    }

    if (inicio && fin) {
      const desde = new Date(inicio as string)
      desde.setUTCHours(5, 0, 0, 0)
      const hasta = new Date(fin as string)
      hasta.setUTCHours(4, 59, 59, 999)
      hasta.setDate(hasta.getDate() + 1)
      filtro.fecha = { $gte: desde, $lte: hasta }
    }

    if (causa && causa !== 'todos') {
      filtro.causa = causa
    }

    const ajustes = await HistorialInventario.find(filtro)
      .populate('productoId', 'nombre marca')
      .populate('usuarioId', 'nombre username')
      .sort({ fecha: -1 })

    const subtotales: Record<string, number> = {
      'Robo o hurto': 0,
      'Merma': 0,
      'Producto vencido': 0,
      'Error de conteo': 0
    }

    let totalGeneral = 0

    for (const a of ajustes) {
      const valor = a.valorEconomico || 0
      totalGeneral += valor

      const key = a.causa
      if (key && Object.prototype.hasOwnProperty.call(subtotales, key)) {
        subtotales[key] = (subtotales[key] ?? 0) + valor
      }
    }

    const detalle = ajustes.map((a: any) => ({
      producto: a.productoId?.nombre || 'Producto eliminado',
      marca: a.productoId?.marca || '',
      unidades: a.cantidad,
      causa: a.causa,
      valorEconomico: a.valorEconomico || 0,
      fecha: a.fecha,
      registradoPor: a.usuarioId?.nombre || a.usuarioId?.username || 'No registrado'
    }))

    return res.json({
      totalGeneral,
      subtotales,
      detalle
    })

  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener reporte de pérdidas' })
  }
}

export const exportarPerdidasPDF = async (req: Request, res: Response) => {
  try {
    const { inicio, fin, causa } = req.query

    const filtro: any = { tipo: 'ajuste_salida', causa: { $ne: null } }

    if (inicio && fin) {
      const desde = new Date(inicio as string)
      desde.setUTCHours(5, 0, 0, 0)
      const hasta = new Date(fin as string)
      hasta.setUTCHours(4, 59, 59, 999)
      hasta.setDate(hasta.getDate() + 1)
      filtro.fecha = { $gte: desde, $lte: hasta }
    }

    if (causa && causa !== 'todos') {
      filtro.causa = causa
    }

    const ajustes = await HistorialInventario.find(filtro)
      .populate('productoId', 'nombre marca')
      .populate('usuarioId', 'nombre username')
      .sort({ fecha: -1 })

    const subtotales: Record<string, number> = {
      'Robo o hurto': 0, 'Merma': 0, 'Producto vencido': 0, 'Error de conteo': 0
    }
    let totalGeneral = 0

    for (const a of ajustes) {
      const valor = a.valorEconomico || 0
      totalGeneral += valor
      const key = a.causa
      if (key && Object.prototype.hasOwnProperty.call(subtotales, key)) {
        subtotales[key] = (subtotales[key] ?? 0) + valor
      }
    }

    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-perdidas.pdf')
    doc.pipe(res)

    dibujarEncabezado(doc, 'Reporte de Pérdidas de Mercadería')

    doc.fontSize(10).font('Helvetica')
       .text(`Periodo: ${inicio || 'Todo el historial'} — ${fin || 'hasta hoy'}`)
    if (causa && causa !== 'todos') doc.text(`Filtro de causa: ${causa}`)
    doc.moveDown(1)

    doc.fontSize(12).font('Helvetica-Bold')
       .text(`Total general: S/ ${totalGeneral.toFixed(2)}`, { underline: true })
    doc.moveDown(0.5)

    doc.fontSize(10).font('Helvetica')
    Object.entries(subtotales).forEach(([c, v]) => {
      doc.text(`${c}: S/ ${v.toFixed(2)}`)
    })
    doc.moveDown(1.5)

    if (ajustes.length === 0) {
      doc.fontSize(11).fillColor('#444444')
         .text('No se registraron pérdidas en este periodo.', { align: 'center' })
    } else {
      const colX = { producto: 40, unidades: 220, causa: 270, valor: 380, fecha: 440 }
      doc.fontSize(9).font('Helvetica-Bold')
      doc.text('Producto', colX.producto, doc.y)
      doc.text('Unid.', colX.unidades, doc.y, { continued: false })
      doc.text('Causa', colX.causa, doc.y - 11)
      doc.text('Valor S/', colX.valor, doc.y - 11)
      doc.text('Fecha', colX.fecha, doc.y - 11)
      doc.moveDown(0.5)
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#dddddd').stroke()
      doc.moveDown(0.3)

      doc.font('Helvetica').fontSize(9)
      for (const a of ajustes as any[]) {
        const y = doc.y
        if (y > 740) { doc.addPage(); dibujarEncabezado(doc, 'Reporte de Pérdidas de Mercadería (cont.)') }
        doc.text(a.productoId?.nombre || 'Producto eliminado', colX.producto, doc.y, { width: 170 })
        doc.text(String(a.cantidad), colX.unidades, y)
        doc.text(a.causa, colX.causa, y, { width: 100 })
        doc.text(`S/ ${(a.valorEconomico || 0).toFixed(2)}`, colX.valor, y)
        doc.text(new Date(a.fecha).toLocaleDateString('es-PE'), colX.fecha, y)
        doc.moveDown(0.6)
      }
    }

    dibujarPie(doc)
    doc.end()

  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al generar PDF de pérdidas' })
  }
}

export const obtenerReposicion = async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query

    const filtroProducto: any = {
      activo: true,
      $expr: { $lt: ['$stock', '$nivelMinimo'] }
    }

    if (categoria && categoria !== 'todos') {
      filtroProducto.tipoProducto = categoria   // ← corregido
    }

    const productos = await Producto.find(filtroProducto)
      .populate('categoria', 'nombre')
      .lean()

    const lista = productos
      .map((p: any) => ({
        _id: p._id,
        nombre: p.nombre,
        categoria: p.categoria?.nombre || 'Sin categoría',
        presentacion: p.presentacion,
        stockActual: p.stock,
        nivelMinimo: p.nivelMinimo,
        cantidadSugerida: Math.max(p.nivelMinimo - p.stock, 0),
        critico: p.stock === 0
      }))
      .sort((a, b) => {
        if (a.critico && !b.critico) return -1
        if (!a.critico && b.critico) return 1
        return (a.stockActual / Math.max(a.nivelMinimo, 1)) -
               (b.stockActual / Math.max(b.nivelMinimo, 1))
      })

    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const demandaAgregada = await DemandaInsatisfecha.aggregate([
      { $match: { createdAt: { $gte: hace30Dias } } },
      {
        $group: {
          _id: '$producto',
          totalSolicitudes: { $sum: '$vecessolicitado' }
        }
      },
      { $sort: { totalSolicitudes: -1 } }
    ])

    return res.json({
      productos: lista,
      demandaNoAtendida: demandaAgregada.map(d => ({
        producto: d._id,
        vecesSolicitado: d.totalSolicitudes
      }))
    })

  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener listado de reposición' })
  }
}

export const exportarReposicionPDF = async (req: Request, res: Response) => {
  try {
    const { categoria } = req.query

    const filtroProducto: any = {
      activo: true,
      $expr: { $lt: ['$stock', '$nivelMinimo'] }
    }
    if (categoria && categoria !== 'todos') {
      filtroProducto.tipoProducto = categoria   // ← corregido
    }

    const productos = await Producto.find(filtroProducto)
      .populate('categoria', 'nombre')
      .lean()

    const lista = productos
      .map((p: any) => ({
        nombre: p.nombre,
        presentacion: p.presentacion,
        stockActual: p.stock,
        nivelMinimo: p.nivelMinimo,
        cantidadSugerida: Math.max(p.nivelMinimo - p.stock, 0)
      }))
      .sort((a, b) => a.stockActual - b.stockActual)

    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=lista-reposicion.pdf')
    doc.pipe(res)

    const colX = { producto: 40, presentacion: 230, stock: 340, minimo: 410, sugerido: 480 }
    const ANCHO_PRODUCTO = 180
    const LIMITE_INFERIOR = 760

    const dibujarColumnas = () => {
      doc.fontSize(9).font('Helvetica-Bold')
      doc.text('Producto', colX.producto, doc.y, { width: ANCHO_PRODUCTO, lineBreak: false })
      doc.text('Presentación', colX.presentacion, doc.y, { lineBreak: false })
      doc.text('Stock', colX.stock, doc.y, { lineBreak: false })
      doc.text('Mínimo', colX.minimo, doc.y, { lineBreak: false })
      doc.text('Sugerido', colX.sugerido, doc.y, { lineBreak: false })
      doc.moveDown(1)
      doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#dddddd').stroke()
      doc.moveDown(0.5)
      doc.font('Helvetica').fontSize(9)
    }

    dibujarEncabezado(doc, 'Lista de Productos para Reposición')

    if (lista.length === 0) {
      doc.fontSize(11).fillColor('#444444')
         .text('No hay productos bajo el nivel mínimo en este momento.', { align: 'center' })
    } else {
      dibujarColumnas()

      for (const p of lista) {
        const alturaNombre = doc.heightOfString(p.nombre, { width: ANCHO_PRODUCTO })
        const alturaFila = Math.max(alturaNombre, 12) + 8

        if (doc.y + alturaFila > LIMITE_INFERIOR) {
          doc.addPage()
          dibujarEncabezado(doc, 'Lista de Productos para Reposición (cont.)')
          dibujarColumnas()
        }

        const y = doc.y
        doc.text(p.nombre, colX.producto, y, { width: ANCHO_PRODUCTO })
        doc.text(p.presentacion, colX.presentacion, y, { width: 100 })
        doc.text(String(p.stockActual), colX.stock, y)
        doc.text(String(p.nivelMinimo), colX.minimo, y)
        doc.text(String(p.cantidadSugerida), colX.sugerido, y)

        doc.y = y + alturaFila
      }
    }

    dibujarPie(doc)
    doc.end()

  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al generar PDF de reposición' })
  }
}