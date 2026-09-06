import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Toast from './Toast'

export default function CRUDManager({ basePath, title, fields, listKey }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await api(`/api/admin/${basePath}`)
      setRows(data[listKey] || [])
    } catch (e) {
      setError(e.message)
    }
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function create(e) {
    e.preventDefault()
    try {
      await api(`/api/admin/${basePath}`, { method: 'POST', body: form })
      setToast(`${title} added`)
      setForm({})
      load()
    } catch (err) {
      setToast(err.message)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this record?')) return
    try {
      await api(`/api/admin/${basePath}/${id}`, { method: 'DELETE' })
      setToast('Deleted')
      load()
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>{title}</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Add {title.slice(0, -1)}</h3>
          <form className="form" onSubmit={create}>
            {fields.map((f) => (
              <div className="form-group" key={f.name}>
                <label>{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.name] || ''}
                    onChange={(e) => setField(f.name, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.name] || ''}
                    onChange={(e) => setField(f.name, e.target.value)}
                    placeholder={f.placeholder || f.label}
                    required={f.required}
                  />
                )}
              </div>
            ))}
            <button className="btn btn-primary">Add {title.slice(0, -1)}</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>All {title}</h3>
          <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>{fields.map((f) => <th key={f.name}>{f.label}</th>)}<th></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    {fields.map((f) => <td key={f.name}>{r[f.name] || '—'}</td>)}
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => remove(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.includes('added') ? 'success' : 'error'} message={toast} onClose={() => setToast('')} />}
    </div>
  )
}