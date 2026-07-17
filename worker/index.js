// Life app API — CRUD over D1. Auth is Cloudflare Access in front of the
// domain, not app code. ponytail: single-user, so no user_id column.

const json = (data, status = 200) => Response.json(data, { status })
const toTodo = (r) => ({ ...r, completed: !!r.completed })
const toMed = (r) => ({ ...r, active: !!r.active })
const toHabit = (r) => ({ ...r, active: !!r.active })

// Thrown for bad input → 400 rather than a 500 crash.
class ClientError extends Error {}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    try {
      if (/^\/api\/medications(\/|$)/.test(url.pathname))
        return await medications(request, env, url)
      if (/^\/api\/habits(\/|$)/.test(url.pathname))
        return await habits(request, env, url)
      return await todos(request, env, url)
    } catch (err) {
      if (err instanceof ClientError) return json({ error: err.message }, 400)
      return json({ error: String(err) }, 500)
    }
  },
}

async function todos(request, env, url) {
  const match = url.pathname.match(/^\/api\/todos(?:\/([\w-]+))?$/)
  if (!match) return json({ error: 'not found' }, 404)
  const id = match[1]

  {
    {
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
    }
  }
}

const PARTS = ['morning', 'afternoon', 'evening', 'anytime']

// Comma-separated weekday numbers 0-6; drops blanks, sorts, dedupes. "" → every day.
function normalizeDays(input) {
  if (typeof input !== 'string') return ''
  const days = [...new Set(input.split(',').map((d) => d.trim()).filter(Boolean))]
  if (days.some((d) => !/^[0-6]$/.test(d))) throw new ClientError('days must be 0-6')
  return days.sort().join(',')
}

async function habits(request, env, url) {
  // /api/habits, /api/habits/<id>, /api/habits/logs
  const rest = url.pathname.replace(/^\/api\/habits\/?/, '')
  const method = request.method

  // --- done logs: /api/habits/logs ---
  if (rest === 'logs') {
    if (method === 'GET') {
      const date = url.searchParams.get('date')
      if (!date) return json({ error: 'date required' }, 400)
      const { results } = await env.DB.prepare('SELECT * FROM habit_logs WHERE date = ?')
        .bind(date)
        .all()
      return json(results)
    }
    if (method === 'POST') {
      const { habit_id, date } = await request.json()
      if (!habit_id || typeof date !== 'string')
        return json({ error: 'habit_id, date required' }, 400)
      const row = await env.DB.prepare(
        `INSERT INTO habit_logs (id, habit_id, date) VALUES (?, ?, ?)
         ON CONFLICT (habit_id, date) DO UPDATE SET habit_id = habit_id RETURNING *`,
      )
        .bind(crypto.randomUUID(), habit_id, date)
        .first()
      return json(row, 201)
    }
    if (method === 'DELETE') {
      const { habit_id, date } = await request.json()
      await env.DB.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?')
        .bind(habit_id, date)
        .run()
      return json({ ok: true })
    }
    return json({ error: 'method not allowed' }, 405)
  }

  // --- habit definitions ---
  const id = rest || null
  if (id && !/^[\w-]+$/.test(id)) return json({ error: 'not found' }, 404)

  if (method === 'GET' && !id) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM habits ORDER BY active DESC, position ASC',
    ).all()
    return json(results.map(toHabit))
  }

  if (method === 'POST' && !id) {
    const { name, part, days, notes } = await request.json()
    if (typeof name !== 'string' || !name.trim() || name.length > 200)
      return json({ error: 'name must be 1-200 characters' }, 400)
    if (part != null && !PARTS.includes(part)) return json({ error: 'bad part' }, 400)
    const row = await env.DB.prepare(
      `INSERT INTO habits (id, name, part, days, notes, position)
       VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM habits))
       RETURNING *`,
    )
      .bind(crypto.randomUUID(), name.trim(), part ?? 'anytime', normalizeDays(days), notes?.trim() || null)
      .first()
    return json(toHabit(row), 201)
  }

  if (method === 'PATCH' && id) {
    const body = await request.json()
    const fields = []
    const values = []
    if (typeof body.name === 'string' && body.name.trim()) {
      fields.push('name = ?')
      values.push(body.name.trim())
    }
    if ('part' in body) {
      if (!PARTS.includes(body.part)) return json({ error: 'bad part' }, 400)
      fields.push('part = ?')
      values.push(body.part)
    }
    if ('days' in body) {
      fields.push('days = ?')
      values.push(normalizeDays(body.days))
    }
    if ('notes' in body) {
      fields.push('notes = ?')
      values.push(body.notes?.trim() || null)
    }
    if (typeof body.active === 'boolean') {
      fields.push('active = ?')
      values.push(body.active ? 1 : 0)
    }
    if (!fields.length) return json({ error: 'nothing to update' }, 400)
    const row = await env.DB.prepare(
      `UPDATE habits SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
    )
      .bind(...values, id)
      .first()
    return row ? json(toHabit(row)) : json({ error: 'not found' }, 404)
  }

  if (method === 'DELETE' && id) {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM habit_logs WHERE habit_id = ?').bind(id),
      env.DB.prepare('DELETE FROM habits WHERE id = ?').bind(id),
    ])
    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, 405)
}

// Comma-separated HH:MM string; drops blanks, sorts, dedupes. "" → "".
function normalizeTimes(input) {
  if (typeof input !== 'string') return ''
  const times = [...new Set(input.split(',').map((t) => t.trim()).filter(Boolean))]
  if (times.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))
    throw new ClientError('times must be HH:MM')
  return times.sort().join(',')
}

async function medications(request, env, url) {
  // /api/medications, /api/medications/<id>, /api/medications/logs
  const rest = url.pathname.replace(/^\/api\/medications\/?/, '')
  const method = request.method

  // --- dose logs: /api/medications/logs ---
  if (rest === 'logs') {
    if (method === 'GET') {
      const date = url.searchParams.get('date')
      if (!date) return json({ error: 'date required' }, 400)
      const { results } = await env.DB.prepare(
        'SELECT * FROM medication_logs WHERE date = ?',
      )
        .bind(date)
        .all()
      return json(results)
    }
    if (method === 'POST') {
      const { medication_id, date, slot } = await request.json()
      if (!medication_id || typeof date !== 'string' || !Number.isInteger(slot))
        return json({ error: 'medication_id, date, slot required' }, 400)
      // idempotent: re-taking an already-logged dose is a no-op, returns the row
      const row = await env.DB.prepare(
        `INSERT INTO medication_logs (id, medication_id, date, slot) VALUES (?, ?, ?, ?)
         ON CONFLICT (medication_id, date, slot) DO UPDATE SET medication_id = medication_id
         RETURNING *`,
      )
        .bind(crypto.randomUUID(), medication_id, date, slot)
        .first()
      return json(row, 201)
    }
    if (method === 'DELETE') {
      const { medication_id, date, slot } = await request.json()
      await env.DB.prepare(
        'DELETE FROM medication_logs WHERE medication_id = ? AND date = ? AND slot = ?',
      )
        .bind(medication_id, date, slot)
        .run()
      return json({ ok: true })
    }
    return json({ error: 'method not allowed' }, 405)
  }

  // --- medication definitions ---
  const id = rest || null
  if (id && !/^[\w-]+$/.test(id)) return json({ error: 'not found' }, 404)

  if (method === 'GET' && !id) {
    const { results } = await env.DB.prepare(
      'SELECT * FROM medications ORDER BY active DESC, position ASC',
    ).all()
    return json(results.map(toMed))
  }

  if (method === 'POST' && !id) {
    const { name, dose, times, notes } = await request.json()
    if (typeof name !== 'string' || !name.trim() || name.length > 200)
      return json({ error: 'name must be 1-200 characters' }, 400)
    const row = await env.DB.prepare(
      `INSERT INTO medications (id, name, dose, times, notes, position)
       VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM medications))
       RETURNING *`,
    )
      .bind(crypto.randomUUID(), name.trim(), dose?.trim() || null, normalizeTimes(times), notes?.trim() || null)
      .first()
    return json(toMed(row), 201)
  }

  if (method === 'PATCH' && id) {
    const body = await request.json()
    const fields = []
    const values = []
    if (typeof body.name === 'string' && body.name.trim()) {
      fields.push('name = ?')
      values.push(body.name.trim())
    }
    if ('dose' in body) {
      fields.push('dose = ?')
      values.push(body.dose?.trim() || null)
    }
    if ('times' in body) {
      fields.push('times = ?')
      values.push(normalizeTimes(body.times))
    }
    if ('notes' in body) {
      fields.push('notes = ?')
      values.push(body.notes?.trim() || null)
    }
    if (typeof body.active === 'boolean') {
      fields.push('active = ?')
      values.push(body.active ? 1 : 0)
    }
    if (!fields.length) return json({ error: 'nothing to update' }, 400)
    const row = await env.DB.prepare(
      `UPDATE medications SET ${fields.join(', ')} WHERE id = ? RETURNING *`,
    )
      .bind(...values, id)
      .first()
    return row ? json(toMed(row)) : json({ error: 'not found' }, 404)
  }

  if (method === 'DELETE' && id) {
    // D1 doesn't enforce ON DELETE CASCADE by default — drop logs explicitly
    await env.DB.batch([
      env.DB.prepare('DELETE FROM medication_logs WHERE medication_id = ?').bind(id),
      env.DB.prepare('DELETE FROM medications WHERE id = ?').bind(id),
    ])
    return json({ ok: true })
  }

  return json({ error: 'method not allowed' }, 405)
}
