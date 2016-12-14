'use strict'

const path         = require('path')
const fs           = require('fs')
const ndjson       = require('ndjson')
const filterStream = require('stream-filter')
const sink         = require('stream-sink')



const file = path.join(__dirname, 'data.ndjson')

const filterById = (id) => (data) =>
	!!(data && ('object' === typeof data) && data.id === id)
const filterByKeys = (pattern) => (data) => {
	if (!data || 'object' !== typeof data) return false
	for (let key in pattern) {
		if (!data.hasOwnProperty(key)) return false
		if (data[key] !== pattern[key]) return false
	}
	return true
}



const lines = function (/* promised, filter */) {
	const args = Array.prototype.slice.call(arguments)
	let   pattern = args.pop()
	let   promised = !!args.shift()

	const reader = fs.createReadStream(file)
	const parser = reader.pipe(ndjson.parse())
	let   filter

	if (pattern === 'all' || pattern === undefined) filter = parser // no filter
	else if ('string' === typeof pattern)
		filter = parser.pipe(filterStream.obj(filterById(pattern)))
	else filter = parser.pipe(filterStream.obj(filterByKeys(pattern)))

	if (promised === true) return new Promise((resolve, reject) => {
		reader.on('error', reject)
		parser.on('error', reject)
		filter.on('error', reject)

		const results = filter.pipe(sink('object'))
		results.catch(reject)
		results.then(resolve)
	})
	else return filter
}



module.exports = Object.assign(lines, {filterById, filterByKeys})
