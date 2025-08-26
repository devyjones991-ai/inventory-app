35        setFetchError('Недостаточно прав')
36        return
37      }
38      console.error('Ошибка загрузки объектов:', error)
39      toast.error('Ошибка загрузки объектов: ' + error.message)
40      await handleSupabaseError(error, navigate, 'Ошибка загрузки объектов')
41      setFetchError('Ошибка загрузки объектов: ' + error.message)
42      return
43    }
44    setObjects(data)
45    
46    if (data.length === 0) {
47      setIsEmpty(true)
48      setSelected(null)
49      if (typeof localStorage !== 'undefined') {
50        localStorage.removeItem(SELECTED_OBJECT_KEY)
51      }
52      return
53    }
54    
55    setIsEmpty(false)
56    const savedId =
57      typeof localStorage !== 'undefined'
58        ? localStorage.getItem(SELECTED_OBJECT_KEY)
59        : null
60    if (savedId) {
61      const saved = data.find((o) => o.id === Number(savedId))
62      if (saved) setSelected(saved)
63      else if (!selected && data.length) setSelected(data[0])
64    } else if (!selected && data.length) {
65      setSelected(data[0])
66    }
67  } catch (err) {
68    console.error('Ошибка загрузки объектов:', err)
69    toast.error('Ошибка загрузки объектов: ' + err.message)
70    setFetchError('Ошибка загрузки объектов: ' + err.message)
71  }
72}
73
74async function saveObject(name, editingObject) {
75  if (!name.trim()) return false