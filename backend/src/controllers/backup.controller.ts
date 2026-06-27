import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import { Backup } from '../models/backup.model'
import { BackupConfig } from '../models/backup-config.model'
import { iniciarBackupCron } from '../services/backup-cron.service'



export const generarBackup = async (
  req: Request,
  res: Response,
  tipoOverride?: 'manual' | 'automatico'  
) => {
  try {
    const usuario = (req as any).usuario
    const tipo = tipoOverride || 'manual'  
    const db = mongoose.connection.db

    if (!db) {
      return res.status(500).json({ mensaje: 'No hay conexión con la base de datos' })
    }

    const collections = await db.listCollections().toArray()
    const backupData: any = {}

    for (const collection of collections) {
      const nombre = collection.name
      const documentos = await db.collection(nombre).find({}).toArray()
      backupData[nombre] = documentos
    }

    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir)

    const fecha = new Date().toISOString().replace(/[:.]/g, '-')
    const nombreArchivo = `backup-${fecha}.json`
    const rutaArchivo = path.join(backupDir, nombreArchivo)

    fs.writeFileSync(rutaArchivo, JSON.stringify(backupData, null, 2), 'utf8')

    await Backup.create({
      estado: 'Exitoso',
      archivo: nombreArchivo,
      mensaje: 'Respaldo generado correctamente',
      creadoPor: usuario?._id || null,
      tipo  
    })

    res.download(rutaArchivo)
  } catch (error: any) {
    console.error(error)

    await Backup.create({
      estado: 'Error',
      archivo: '',
      mensaje: error.message || 'Error al generar respaldo',
      creadoPor: null,
      tipo: tipoOverride || 'manual'  
    })

    res.status(500).json({ mensaje: 'Error al generar respaldo' })
  }
}

export const listarBackups = async (_req: Request, res: Response) => {
  try {
    const backups = await Backup.find().sort({ createdAt: -1 })
    res.json(backups)
  } catch {
    res.status(500).json({ mensaje: 'Error al listar respaldos' })
  }
}

export const generarBackupAutomatico = async () => {
  const req: any = { usuario: { nombre: 'Sistema Automático' } }
  const res: any = {
    status: () => ({ json: () => {} }),
    json: () => {},
    setHeader: () => {},
    send: () => {},
    download: () => {}
  }
  await generarBackup(req, res, 'automatico')  // ← pasa el tipo
}

export const obtenerConfiguracionBackup = async (_req: Request, res: Response) => {
  try {
    let config = await BackupConfig.findOne()
    if (!config) config = await BackupConfig.create({})
    res.json(config)
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error al obtener la configuración de respaldo' })
  }
}

export const guardarConfiguracionBackup = async (req: Request, res: Response) => {
  try {
    const { frecuencia, hora, activo } = req.body
    const usuario = (req as any).usuario

    let config = await BackupConfig.findOne()
    if (!config) config = new BackupConfig()

    config.frecuencia = frecuencia
    config.hora = hora
    config.activo = activo
    config.actualizadoPor =
      usuario?.nombre || usuario?.email || usuario?.usuario || 'Sistema'

    await config.save()
    await iniciarBackupCron()

    res.json({ mensaje: 'Configuración guardada correctamente', config })
  } catch (error) {
    console.error(error)
    res.status(500).json({ mensaje: 'Error al guardar la configuración de respaldo' })
  }
}

// ─── HU-27: Resumen del último respaldo ──────────────────────────────────────
export const obtenerResumenBackup = async (req: Request, res: Response) => {
  try {
    const config = await BackupConfig.findOne()
    const ultimoExitoso = await Backup.findOne({ estado: 'Exitoso' }).sort({ fecha: -1 })
    const ultimoRegistro = await Backup.findOne().sort({ fecha: -1 })

    const ahora = new Date()
    let tiempoTranscurrido = 'Sin respaldos'
    let estaVencido = false
    let horasDesdeUltimo = 0

    if (ultimoExitoso) {
      const diff = ahora.getTime() - new Date(ultimoExitoso.fecha).getTime()
      const horas = Math.floor(diff / (1000 * 60 * 60))
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (horas < 1) tiempoTranscurrido = `Hace ${minutos} minutos`
      else if (horas < 24) tiempoTranscurrido = `Hace ${horas} hora${horas !== 1 ? 's' : ''}`
      else tiempoTranscurrido = `Hace ${Math.floor(horas / 24)} día${Math.floor(horas / 24) !== 1 ? 's' : ''}`

      horasDesdeUltimo = horas
      const limiteHoras = config?.frecuencia === 'semanal' ? 168 : 24
      estaVencido = horasDesdeUltimo > limiteHoras
    } else {
      estaVencido = true
    }

    const ultimoFallo = ultimoRegistro?.estado === 'Error'

    res.json({
      ultimoExitoso: ultimoExitoso?.fecha || null,
      tiempoTranscurrido,
      estaVencido,
      ultimoFallo,
      estadoGeneral: ultimoFallo
        ? 'Revisar — el último respaldo falló'
        : estaVencido
        ? 'Revisar — respaldo vencido'
        : 'Todo en orden',
      frecuenciaConfig: config?.frecuencia || 'diario'
    })
  } catch {
    res.status(500).json({ mensaje: 'Error al obtener resumen de respaldo' })
  }
}

export const generarBackupManual = (req: Request, res: Response) => {
  return generarBackup(req, res, 'manual')
}