166          className="btn btn-ghost btn-sm"
167        >
168          👤
169        </button>
170      </div>
171    </div>
172
173    {/* Desktop header */}
174    <div className="hidden md:flex items-center justify-between p-4 border-b">
175      <h1 className="text-xl font-semibold">{selected?.name || 'Inventory'}</h1>
176      <div className="flex items-center gap-2">
177        <input
178          type="file"
179          ref={importInputRef}
180          onChange={handleImport}
181          accept=".json"
182          className="hidden"
183        />
184        <button
185          onClick={() => importInputRef.current?.click()}
186          className="btn btn-outline btn-sm"
187        >
188          Import
189        </button>
190        <button
191          onClick={exportToFile}
192          className="btn btn-outline btn-sm"
193        >
194          Export
195        </button>
196        {(isAdmin || isManager) && (
197          <button onClick={addAction} className="btn btn-primary btn-sm">
198            <PlusIcon className="w-4 h-4" />
199            Add Object
200          </button>
201        )}
202        <ThemeToggle />
203        <button
204          onClick={() => setIsAccountModalOpen(true)}
205          className="btn btn-ghost btn-sm"
206        >
207          👤
208        </button>
209      </div>
210    </div>
211
212    {/* Content area */}
213    <div className="flex-1 p-4">
214      <InventoryTabs
215        activeTab={activeTab}
216        onTabChange={onTabChange}
217        selected={selected}
218        onUpdateSelected={onUpdateSelected}
219        user={user}
220        isAdmin={isAdmin}
221        isManager={isManager}
222        addAction={addAction}
223      />
224    </div>
225
226    {/* Modals */}
227    <Dialog open={isObjectModalOpen} onOpenChange={closeObjectModal}>
228      <DialogContent>
229        <DialogHeader>
230          <DialogTitle>
231            {editingObject ? 'Редактировать объект' : 'Добавить объект'}
232          </DialogTitle>
233        </DialogHeader>
234        <div className="space-y-4">
235          <input
236            type="text"
237            className="input input-bordered w-full"
238            placeholder="Название"
239            value={objectName}
240            onChange={(e) => setObjectName(e.target.value)}
241          />
242        </div>
243        <DialogFooter>
244          <button className="btn btn-primary" onClick={onSaveObject}>
245            Сохранить
246          </button>
247          <button className="btn btn-ghost" onClick={closeObjectModal}>
248            Отмена
249          </button>
250        </DialogFooter>
251      </DialogContent>
252    </Dialog>
253
254    <ConfirmModal
255      open={!!deleteCandidate}
256      title="Удалить объект?"
257      confirmLabel={
258        <>
259          <TrashIcon className="w-4 h-4" /> Удалить
260        </>
261      }
262      onConfirm={onConfirmDelete}
263      onCancel={() => setDeleteCandidate(null)}
264    />
265
266    {isAccountModalOpen && (
267      <AccountModal
268        user={user}
269        onClose={() => setIsAccountModalOpen(false)}
270        onUpdated={() => {}}
271      />
272    )}
273  </div>
274)