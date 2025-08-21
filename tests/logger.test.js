/* eslint-env node */
/* globals process */
import logger from '../src/utils/logger.js'

describe('logger', () => {
  let infoSpy
  let warnSpy
  let errorSpy
  const originalEnv = { ...process.env }

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    process.env = { ...originalEnv }
  })

  test('по умолчанию логирует все уровни', () => {
    delete process.env.LOG_LEVEL
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('уровень warn отключает info', () => {
    process.env.LOG_LEVEL = 'warn'
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('уровень error отключает warn и info', () => {
    process.env.LOG_LEVEL = 'error'
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('уровень none отключает все', () => {
    process.env.LOG_LEVEL = 'none'
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
