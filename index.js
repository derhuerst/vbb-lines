'use strict'

const path         = require('path')
const fs           = require('fs')
const ndjson       = require('ndjson')
const filterStream = require('stream-filter')
const sink         = require('stream-sink')
const pump = require('pump')

const file = path.join(__dirname, 'data.ndjson')

const filterById = (id) => (data) =>
	!!(data && ('object' === typeof data) && data.id === id)

const hasProp = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const filterByKeys = (pattern) => (data) => {
	if (!data || 'object' !== typeof data) return false
	for (const key of Object.keys(pattern)) {
		if (!hasProp(data, key)) return false
		if (data[key] !== pattern[key]) return false
	}
	return true
}

const lines = (...args) => {
	const pattern = args.pop()
	const promised = !!args.shift()

	const chain = [
		fs.createReadStream(file),
		ndjson.parse()
	]
	if ('string' === typeof pattern) {
		if (pattern !== 'all') {
			const filter = filterStream.obj(filterById(pattern))
			chain.push(filter)
		}
	} else if (pattern !== undefined) {
		const filter = filterStream.obj(filterByKeys(pattern))
		chain.push(filter)
	}

	if (promised === true) {
		const out = sink('object')
		pump(...chain, out, () => {})
		return out
	}
	return pump(...chain, () => {})
}

lines.filterById = filterById
lines.filterByKeys = filterByKeys
module.exports = lines
