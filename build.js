'use strict'

const so     = require('so')
const data   = require('vbb-static')
const equal  = require('shallow-equals')
const ndjson = require('ndjson')
const path   = require('path')
const fs     = require('fs')



so(function* () {

	const lines = yield new Promise((yay, nay) => {
		const lines = {}
		data.lines('all')
		.on('data', (line) => {
			lines[line.id] = Object.assign({}, line, {variants: []})
		})
		.on('error', nay)
		.on('end', () => yay(lines))
	})



	yield new Promise((yay, nay) => {
		data.trips('all')
		.on('data', (trip) => {
			if (!lines[trip.lineId]) return
			const line = lines[trip.lineId]

			const stations = trip.stations.map((x) => x.s)
			if (!line.variants.some((v) => equal(v, stations)))
				line.variants.push(stations)
		})
		.on('error', nay)
		.on('end', () => yay())
	})



	const convert = ndjson.stringify()
	const file = path.join(__dirname, 'data.ndjson')
	convert.pipe(fs.createWriteStream(file))

	for (let id in lines) {convert.write(lines[id])}
	convert.end()

})()
.catch((err) => {console.error(err.stack)})
