'use strict'

const readCsv = require('gtfs-utils/read-csv')
const fs = require('fs')
const {writeFile} = require('fs/promises')
const path = require('path')
const {pipeline} = require('stream')
const equal = require('shallow-equals')
const ndjson = require('ndjson')
const {gtfsToFptf} = require('gtfs-utils/route-types')

const readGtfsFile = file => readCsv(path.join(__dirname, file + '.csv'))

const writeNDJSON = (data, file) => new Promise((resolve, reject) => {
	const toJSON = ndjson.stringify()
	pipeline(
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

const writeJSON = async (data, file) => {
	data = Object.values(data)
	await writeFile(path.join(__dirname, file), JSON.stringify(data))
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

const fetchLines = async () => {
	const lines = Object.create(null)

	for await (const line of await readGtfsFile('routes')) {
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
	}

	return lines
}

const fetchTrips = async () => {
	const trips = Object.create(null)

	for await (const trip of await readGtfsFile('trips')) {
		const id = trip.trip_id
		const lineId = trip.route_id
		trips[id + ''] = {id, lineId, stops: []}
	}

	return trips
}

const addStopoversToTrips = async (trips) => {
	for await (const arrival of await readGtfsFile('stop_times')) {
		const tripId = arrival.trip_id
		if (!trips[tripId]) {
			console.error('Unknown trip', tripId)
			continue
		}

		const i = parseInt(arrival.stop_sequence)
		trips[tripId].stops[i] = arrival.stop_id
	}

	return trips
}

const computeLineVariants = (lines, trips) => {
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
}

;(async () => {
	const [
		lines, trips,
	] = await Promise.all([
		fetchLines(),
		fetchTrips(),
	])
	await addStopoversToTrips(trips)
	computeLineVariants(lines, trips)

	await Promise.all([
		writeNDJSON(lines, 'data.ndjson'),
		writeJSON(lines, 'data.json'),
	])
})()
.catch((err) => {
	console.error(err)
	process.exit(1)
})
