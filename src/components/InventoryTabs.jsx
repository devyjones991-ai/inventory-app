      setDescription(selected.description || '')
    }
  }, [selected])

  const saveDescription = useCallback(async () => {
    if (!selected) return
    await updateObject(selected.id, { description })
    onUpdateSelected({ ...selected, description })
    setIsEditingDesc(false)
  }, [selected, description, updateObject, onUpdateSelected])

  useEffect(() => {
    onTabChange(tab)
  }, [tab, onTabChange])

  return (
    <div className="flex flex-col h-full w-full">
      <div className="tabs mb-4">
        <button
          className={`tab tab-bordered ${tab === 'desc' ? 'tab-active' : ''}`}
          onClick={showDesc}
        >
          Описание
        </button>
        <button
          className={`tab tab-bordered ${tab === 'hw' ? 'tab-active' : ''}`}
          onClick={showHW}
        >
          Железо
        </button>
        <button
          className={`tab tab-bordered ${tab === 'tasks' ? 'tab-active' : ''}`}
          onClick={showTasks}
        >
          Задачи
        </button>
        <button
          className={`tab tab-bordered ${tab === 'chat' ? 'tab-active' : ''}`}
          onClick={showChat}
        >
          Чат
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {tab === 'desc' && (
          <div className="space-y-2">
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={saveDescription}
                  >
                    Сохранить
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setIsEditingDesc(false)}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="whitespace-pre-wrap break-words">
                  {description ? linkifyText(description) : 'Нет описания'}
                </div>
                {user && (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsEditingDesc(true)}
                  >
                    Изменить
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {tab === 'hw' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Оборудование</h2>
              {user && (
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={openHWModal}
                >
                  <PlusIcon className="w-4 h-4" /> Добавить
                </button>
              )}
            </div>
            {isHWLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ) : hardware.length === 0 ? (
              <div className="text-center text-gray-500">
                Нет данных. Нажмите «Добавить».
              </div>
            ) : (
              <div className="space-y-2">
                {hardware.map((item) => (
                  <HardwareCard