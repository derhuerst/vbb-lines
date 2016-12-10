'use strict'

const fs = require('fs')
const path = require('path')
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

const lineTypes = {
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
	.pipe(csv()).on('error', nay)

	.on('data', (line) => {
		const id = line.route_id
		lines[id + ''] = {
			id, name: line.route_short_name,
			agencyId: line.agency_id,
			type: lineTypes[line.route_type] || 'unknown',
			variants: []
		}
	})
	.on('end', () => yay(lines))
})



const fetchTrips = () => new Promise((yay, nay) => {
	const trips = {}

	fs.createReadStream(path.join(__dirname, 'trips.txt')).on('error', nay)
	.pipe(csv()).on('error', nay)

	.on('data', (trip) => {
		const id = trip.trip_id
		const lineId = trip.route_id
		trips[id + ''] = {id, lineId, stations: []}
	})

	.on('end', () => yay(trips))
})

const fetchArrivals = (trips) => new Promise((yay, nay) => {
	fs.createReadStream(path.join(__dirname, 'stop_times.txt')).on('error', nay)
	.pipe(csv()).on('error', nay)

	.on('data', (arrival) => {
		const tripId = arrival.trip_id
		if (!trips[tripId]) return console.error('Unknown trip', tripId)
		const i = parseInt(arrival.stop_sequence)
		trips[tripId].stations[i] = arrival.stop_id
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
		if (!line.variants.some((v) => equal(v, trip.stations)))
			line.variants.push(trip.stations)
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
