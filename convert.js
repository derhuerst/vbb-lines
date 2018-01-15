'use strict'

const fs = require('fs')
const path = require('path')
const stripBOM = require('strip-bom-stream')
const csv = require('csv-parser')
const moment = require('moment')
const equal = require('shallow-equals')
const ndjson = require('ndjson')



const writeNDJSON = (data, file) => new Promise((yay, nay) => {
	const out = ndjson.stringify().on('error', nay)
	out.pipe(fs.createWriteStream(path.join(__dirname, file))).on('error', nay)
	.on('finish', () => yay())
	for (let key in data) out.write(data[key])
})

const modes = {
	'0': 'train',
	'1': 'train',
	'2': 'train',
	'3': 'bus',
	'4': 'ferry',
	'100': 'train',
	'102': 'train',
	'109': 'train',
	'400': 'train',
	'700': 'bus',
	'900': 'tram',
	'1000': 'ferry'
}

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



const fetchLines = () => new Promise((yay, nay) => {
	const lines = {}

	fs.createReadStream(path.join(__dirname, 'routes.txt')).on('error', nay)
	.pipe(stripBOM()).on('error', nay)
	.pipe(csv()).on('error', nay)

	.on('data', (line) => {
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
			mode: modes[type],
			product: products[line.route_type] || null,
			variants: []
		}
	})
	.on('end', () => yay(lines))
})



const fetchTrips = () => new Promise((yay, nay) => {
	const trips = {}

	fs.createReadStream(path.join(__dirname, 'trips.txt')).on('error', nay)
	.pipe(stripBOM()).on('error', nay)
	.pipe(csv()).on('error', nay)

	.on('data', (trip) => {
		const id = trip.trip_id
		const lineId = trip.route_id
		trips[id + ''] = {id, lineId, stops: []}
	})

	.on('end', () => yay(trips))
})

const fetchArrivals = (trips) => new Promise((yay, nay) => {
	fs.createReadStream(path.join(__dirname, 'stop_times.txt')).on('error', nay)
	.pipe(stripBOM()).on('error', nay)
	.pipe(csv()).on('error', nay)

	.on('data', (arrival) => {
		const tripId = arrival.trip_id
		if (!trips[tripId]) return console.error('Unknown trip', tripId)
		const i = parseInt(arrival.stop_sequence)
		trips[tripId].stops[i] = arrival.stop_id
	})

	.on('end', () => yay(trips))
})



const computeVariants = (lines, trips) => {
	for (let tripId in trips) {
		const trip = trips[tripId]
		const line = lines[trip.lineId]
		if (!line) {
			console.error('Unknown line', trip.lineId)
			continue
		}

		const variant = line.variants.find((variant) => {
			return equal(variant.stops, trip.stops)
		})
		if (variant) variant.trips++
		else line.variants.push({trips: 1, stops: trip.stops})
	}
	return lines
}



Promise.all([
	fetchLines(),
	fetchTrips().then(fetchArrivals)
])
.then(([lines, trips]) => computeVariants(lines, trips))
.then((lines) => writeNDJSON(lines, 'data.ndjson'))
.catch((err) => {
	console.error(err)
	process.exit(1)
})
