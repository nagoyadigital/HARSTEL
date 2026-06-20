/**
 * LocalDB - localStorage-based CRUD engine
 * Drop-in replacement for Base44 entity SDK
 */

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getStore(entityName) {
  const raw = localStorage.getItem(`autogarage_${entityName}`)
  return raw ? JSON.parse(raw) : []
}

function setStore(entityName, data) {
  localStorage.setItem(`autogarage_${entityName}`, JSON.stringify(data))
}

function sortRecords(records, sortField) {
  if (!sortField) return records
  const desc = sortField.startsWith('-')
  const field = desc ? sortField.slice(1) : sortField
  return [...records].sort((a, b) => {
    const aVal = a[field] ?? ''
    const bVal = b[field] ?? ''
    if (aVal < bVal) return desc ? 1 : -1
    if (aVal > bVal) return desc ? -1 : 1
    return 0
  })
}

function matchesFilter(record, filterObj) {
  return Object.entries(filterObj).every(([key, value]) => {
    if (value === undefined || value === null) return true
    return record[key] === value
  })
}

export function createEntityApi(entityName) {
  return {
    async list(sortField, limit) {
      let records = getStore(entityName)
      if (sortField) records = sortRecords(records, sortField)
      if (limit) records = records.slice(0, limit)
      return records
    },

    async filter(filterObj, sortField, limit) {
      let records = getStore(entityName).filter(r => matchesFilter(r, filterObj))
      if (sortField) records = sortRecords(records, sortField)
      if (limit) records = records.slice(0, limit)
      return records
    },

    async get(id) {
      const records = getStore(entityName)
      const record = records.find(r => r.id === id)
      if (!record) throw new Error(`${entityName} with id ${id} not found`)
      return record
    },

    async create(data) {
      const records = getStore(entityName)
      const newRecord = {
        ...data,
        id: generateId(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      }
      records.push(newRecord)
      setStore(entityName, records)
      return newRecord
    },

    async update(id, data) {
      const records = getStore(entityName)
      const index = records.findIndex(r => r.id === id)
      if (index === -1) throw new Error(`${entityName} with id ${id} not found`)
      records[index] = {
        ...records[index],
        ...data,
        updated_date: new Date().toISOString(),
      }
      setStore(entityName, records)
      return records[index]
    },

    async delete(id) {
      const records = getStore(entityName)
      const filtered = records.filter(r => r.id !== id)
      if (filtered.length === records.length) {
        throw new Error(`${entityName} with id ${id} not found`)
      }
      setStore(entityName, filtered)
      return { success: true }
    },
  }
}
