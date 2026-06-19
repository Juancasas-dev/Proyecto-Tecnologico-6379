import cron from 'node-cron'
import { Mercaderia } from '../models/mercaderia.model'
import { Producto } from '../models/producto.model'
import { Alerta } from '../models/alerta.model'

const verificarVencimientos = async () => {
  console.log('Verificando alertas de vencimiento...')

  const hoy = new Date()
  const treintaDias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000) 


  const lotesVencidos = await Mercaderia.find({
    cantidadRestante: { $gt: 0 },
    bloqueado: false,                              
    $or: [
      { fechaVencimiento: { $lt: hoy } },
      { fechaVencimiento: { $ne: null, $lt: hoy } }
    ]
  }).populate('producto')

  for (const lote of lotesVencidos) {
  
    lote.bloqueado = true
    await lote.save()


    const producto = await Producto.findById(lote.producto)
    if (producto) {
      producto.stock = Math.max(0, producto.stock - lote.cantidadRestante)
      await producto.save()
    }

   
    const existe = await Alerta.findOne({
      mercaderia: lote._id,           
      activa: true,
      tipo: 'vencido'
    })

    if (!existe) {
      await Alerta.create({
        producto: lote.producto,
        mercaderia: lote._id,         
        stockActual: lote.cantidadRestante,
        nivelMinimo: 0,
        tipo: 'vencido'
      })
    }
  }


  const lotesProximos = await Mercaderia.find({
    cantidadRestante: { $gt: 0 },
    bloqueado: false,                              
    fechaVencimiento: { $gte: hoy, $lte: treintaDias }
  }).populate('producto')

  for (const lote of lotesProximos) {
    const existe = await Alerta.findOne({
      mercaderia: lote._id,           
      activa: true,
      tipo: 'proximo_vencer'
    })

    if (!existe) {
      await Alerta.create({
        producto: lote.producto,
        mercaderia: lote._id,
        stockActual: lote.cantidadRestante,
        nivelMinimo: 0,
        tipo: 'proximo_vencer'
      })
    }
  }


  const alertasProximo = await Alerta.find({ tipo: 'proximo_vencer', activa: true })
  for (const alerta of alertasProximo) {
    const loteAun = await Mercaderia.findOne({
      _id: alerta.mercaderia,
      cantidadRestante: { $gt: 0 },
      bloqueado: false,
      fechaVencimiento: { $gte: hoy, $lte: treintaDias }
    })
    if (!loteAun) {
      await Alerta.updateOne({ _id: alerta._id }, { activa: false })
    }
  }

  console.log('Alertas de vencimiento verificadas')
}

export const iniciarAlertasCron = () => {
  verificarVencimientos()
  cron.schedule('0 6 * * *', async () => {
    await verificarVencimientos()
  })
}