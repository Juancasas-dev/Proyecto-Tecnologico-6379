import cron from 'node-cron'
import { Mercaderia } from '../models/mercaderia.model'
import { Alerta } from '../models/alerta.model'


const verificarVencimientos = async () => {
  console.log('Verificando alertas de vencimiento...')
  
  const hoy = new Date()
  const veinteDias = new Date(hoy.getTime() + 20 * 24 * 60 * 60 * 1000)

  const lotesProximos = await Mercaderia.find({
    cantidadRestante: { $gt: 0 },
    fechaVencimiento: { $gte: hoy, $lte: veinteDias }
  }).populate('producto')

  const lotesVencidos = await Mercaderia.find({
    cantidadRestante: { $gt: 0 },
    fechaVencimiento: { $lt: hoy }
  }).populate('producto')

  for (const lote of lotesProximos) {
    const existe = await Alerta.findOne({
      producto: lote.producto,
      activa: true,
      tipo: 'proximo_vencer'
    })
    if (!existe) {
      await Alerta.create({
        producto: lote.producto,
        stockActual: lote.cantidadRestante,
        nivelMinimo: 0,
        tipo: 'proximo_vencer'
      })
    }
  }

  for (const lote of lotesVencidos) {
    const existe = await Alerta.findOne({
      producto: lote.producto,
      activa: true,
      tipo: 'vencido'
    })
    if (!existe) {
      await Alerta.create({
        producto: lote.producto,
        stockActual: lote.cantidadRestante,
        nivelMinimo: 0,
        tipo: 'vencido'
      })
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