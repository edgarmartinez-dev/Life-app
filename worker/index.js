// Life app API — CRUD over D1. Auth is Cloudflare Access in front of the
// domain, not app code. ponytail: single-user, so no user_id column.

const json = (data, status = 200) => Response.json(data, { status })
const toTodo = (r) => ({ ...r, completed: !!r.completed })

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/api\/todos(?:\/([\w-]+))?$/)
    if (!match) return json({ error: 'not found' }, 404)
    const id = match[1]

    try {
      if (request.method === 'GET' && !id) {
        const { results } = await env.DB.prepare(
          'SELECT * FROM todos ORDER BY completed ASC, position ASC',
        ).all()
        return json(results.map(toTodo))
      }

      if (request.method === 'POST' && !id) {
        const { title, due_date, due_time } = await request.json()
        if (typeof title !== 'string' || !title.trim() || title.length > 500)
          return json({ error: 'title must be 1-500 characters' }, 400)
        // new tasks go to the top: position = current min - 1
        const row = await env.DB.prepare(
          `INSERT INTO todos (id, title, due_date, due_time, position)
           VALUES (?, ?, ?, ?, (SELECT COALESCE(MIN(position), 1) - 1 FROM todos)) RETURNING *`,
        )
          .bind(crypto.randomUUID(), title.trim(), due_date ?? null, due_time ?? null)
          .first()
        return json(toTodo(row), 201)
      }

      if (request.method === 'PATCH' && id) {
        const body = await request.json()
        const fields = []
        const values = []
        if (typeof body.title === 'string' && body.title.trim()) {
          fields.push('title = ?')
          values.push(body.title.trim())
        }
        if (typeof body.completed === 'boolean') {
          fields.push('completed = ?')
          values.push(body.completed ? 1 : 0)
        }
        if ('due_date' in body) {
          fields.push('due_date = ?')
          values.push(body.due_date)
        }
        if ('due_time' in body) {
          fields.push('due_time = ?')
          values.push(body.due_time)
        }
        if (typeof body.position === 'number' && Number.isFinite(body.position)) {
          fields.push('position = ?')
          values.push(body.position)
        }
        if (!fields.length) return json({ error: 'nothing to update' }, 400)
        const row = await env.DB.prepare(
          `UPDATE todos SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
        )
          .bind(...values, id)
          .first()
        return row ? json(toTodo(row)) : json({ error: 'not found' }, 404)
      }

      if (request.method === 'DELETE' && id) {
        await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run()
        return json({ ok: true })
      }

      return json({ error: 'method not allowed' }, 405)
    } catch (err) {
      return json({ error: String(err) }, 500)
    }
  },
}
