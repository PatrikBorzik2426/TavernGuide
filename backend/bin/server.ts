import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'
import { createServer } from 'https'
import fs from 'fs'

/**
 * URL to the application root. AdonisJS needs it to resolve
 * paths to file and directories for scaffolding commands
 */
const APP_ROOT = new URL('../', import.meta.url)

const certOptions = {
  key: fs.readFileSync('G:/Projekty/Tavern_Guide/TavernGuide/backend/cert.key'),
  cert: fs.readFileSync('G:/Projekty/Tavern_Guide/TavernGuide/backend/cert.crt')
}
/**
 * The importer is used to import files in the context of the
 * application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start((handle) => {
    return createServer(certOptions, handle)
  })
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })

