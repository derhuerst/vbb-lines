'use strict'

const fs = require('fs')
const path = require('path')
const pump = require('pump')
const stripBOM = require('strip-bom-stream')
const csv = require('csv-parser')
const {Writable} = require('stream')
const moment = require('moment')
const equal = require('shallow-equals')
const ndjson = require('ndjson')
const {gtfsToFptf} = require('gtfs-utils/route-types')

const writeNDJSON = (data, file) => new Promise((resolve, reject) => {
	const toJSON = ndjson.stringify()
	pump(
		toJSON,
		fs.createWriteStream(path.join(__dirname, file)),
		(err) => {
			if (err) reject(err)
			else resolve()
		}
	)
	for (let key in data) toJSON.write(data[key])
	toJSON.end()
})

const writeJSON = (data, file) => new Promise((resolve, reject) => {
	data = Object.keys(data).map(k => data[k])
	fs.writeFile(path.join(__dirname, file), JSON.stringify(data), (err) => {
		if (err) reject(err)
		else resolve()
	})
})

// see https://developers.google.com/transit/gtfs/reference/routes-file
const isAmbiguous = {
	'0': true, // `0` can be suburban or tram
	'2': true // `2` can be regional or express train
}

// see https://developers.google.com/transit/gtfs/reference/routes-file
const products = {
	'0': 'suburban',
	'1': 'subway',
	'2': 'regional',
	'3': 'bus',
	'4': 'ferry',
	'100': 'regional',
	'102': 'regional',
	'109': 'suburban',
	'400': 'subway',
	'700': 'bus',
	'900': 'tram',
	'1000': 'ferry'
}

const fetchLines = () => new Promise((resolve, reject) => {
	const lines = Object.create(null)
	const writeLine = (line, _, cb) => {
		const id = line.route_id
		const type = line.route_type
		const name = line.route_short_name || line.route_long_name
		if (isAmbiguous[type]) {
			console.error(`route_type ${type} of line ${name} (${id}) is ambiguous.`)
		}

		lines[id + ''] = {
			type: 'line',
			id,
			name,
			operator: line.agency_id,
			mode: gtfsToFptf(+type),
			product: products[line.route_type] || null,
			variants: []
		}
		cb()
	}

	pump(
		fs.createReadStream(path.join(__dirname, 'routes.csv')),
		stripBOM(),
		csv(),
		new Writable({objectMode: true, write: writeLine}),
		(err) => {
			if (err) reject(err)
			else resolve(lines)
		}
	)
})

const fetchTrips = () => new Promise((resolve, reject) => {
	const trips = Object.create(null)
	const writeTrip = (trip, _, cb) => {
		const id = trip.trip_id
		const lineId = trip.route_id
		trips[id + ''] = {id, lineId, stops: []}
		cb()
	}

	pump(
		fs.createReadStream(path.join(__dirname, 'trips.csv')),
		stripBOM(),
		csv(),
		new Writable({objectMode: true, write: writeTrip}),
		(err) => {
			if (err) reject(err)
			else resolve(trips)
		}
	)
})

const fetchArrivals = (trips) => new Promise((resolve, reject) => {
	const writeArrival = (arrival, _, cb) => {
		const tripId = arrival.trip_id
		if (!trips[tripId]) {
			console.error('Unknown trip', tripId)
			return cb()
		}
		const i = parseInt(arrival.stop_sequence)
		trips[tripId].stops[i] = arrival.stop_id
		cb()
	}

	pump(
		fs.createReadStream(path.join(__dirname, 'stop_times.csv')),
		stripBOM(),
		csv(),
		new Writable({objectMode: true, write: writeArrival}),
		(err) => {
			if (err) reject(err)
			else resolve(trips)
		}
	)
})

const computeVariants = (lines, trips) => {
	for (let tripId in trips) {
		const trip = trips[tripId]
		const line = lines[trip.lineId]
		if (!line) {
			console.error('Unknown line', trip.lineId)
			continue
		}
		const variant = line.variants.find(v => equal(v.stops, trip.stops))
		if (variant) variant.trips++
		else {
			line.variants.push({
				stops: trip.stops,
				trips: 1
			})
		}
	}
	return lines
}

Promise.all([
	fetchLines(),
	fetchTrips().then(fetchArrivals)
])
.then(([lines, trips]) => {
	lines = computeVariants(lines, trips)
	return writeNDJSON(lines, 'data.ndjson')
	.then(() => writeJSON(lines, 'data.json'))
})
.catch((err) => {
	console.error(err)
	process.exit(1)
})
