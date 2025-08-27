import logger, { setLogLevel } from '@/utils/logger.js'

describe('logger', () => {
  let infoSpy
  let warnSpy
  let errorSpy

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    infoSpy.mockRestore()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    setLogLevel(undefined)
  })

  test('по умолчанию логирует все уровни', () => {
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('уровень warn отключает info', () => {
    setLogLevel('warn')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('уровень error отключает warn и info', () => {
    setLogLevel('error')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('уровень none отключает все', () => {
    setLogLevel('none')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(infoSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
