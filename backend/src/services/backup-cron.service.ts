import cron, { ScheduledTask } from 'node-cron'
import { BackupConfig } from '../models/backup-config.model'
import { generarBackupAutomatico } from '../controllers/backup.controller'

let tarea: ScheduledTask | null = null

export const programarBackup = async () => {
  const config = await BackupConfig.findOne()

  if (!config || !config.activo) {
    return
  }

  if (tarea) {
    tarea.stop()
  }

  const [hora, minuto] = config.hora.split(':')

  let expresion = ''

  if (config.frecuencia.toLowerCase() === 'diario') {
    expresion = `${minuto} ${hora} * * *`
  }

  if (config.frecuencia.toLowerCase() === 'semanal') {
    expresion = `${minuto} ${hora} * * 0`
  }

  if (!expresion) {
    expresion = `${minuto} ${hora} * * *`
  }

  tarea = cron.schedule(expresion, async () => {
    console.log('Ejecutando respaldo automático...')
    await generarBackupAutomatico()
  })

  console.log('Respaldo automático programado:', expresion)
}

export const iniciarBackupCron = async () => {
  await programarBackup()
}