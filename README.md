# vbb-lines 🚏

A **collection of all lines (and their stations) of the [Berlin Brandenburg public transport service (VBB)](http://www.vbb.de/)**, computed from [open](https://daten.berlin.de/datensaetze/vbb-fahrplandaten-gtfs) [GTFS](https://developers.google.com/transit/gtfs/) [data](https://vbb-gtfs.jannisr.de/).

[![npm version](https://img.shields.io/npm/v/vbb-lines.svg)](https://www.npmjs.com/package/vbb-lines)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/vbb-lines.svg)
![minimum Node.js version](https://img.shields.io/node/v/vbb-lines.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me via Matrix](https://img.shields.io/badge/chat%20with%20me-via%20Matrix-000000.svg)](https://matrix.to/#/@derhuerst:matrix.org)


## Installing

```shell
npm install vbb-lines
```


## Usage

The [npm package](https://npmjs.com/vbb-lines) contains data in the [*Friendly Public Transport Format*](https://github.com/public-transport/friendly-public-transport-format).

```js
{
	type: 'line',
	id: '17519_400',
	name: 'U55',
	operator: '796',
	mode: 'train',
	product: 'subway',
	variants: [
		['070201054601', '070201054501', '070201054401'], // station ids
		['070201054401', '070201054501', '070201054601']
	]
}
```

```js
const lines = require('vbb-lines')

lines(true, '15296_700').then(console.log) // query a single line
lines({mode: 'bus'}).on('data', console.log) // filter lines
lines('all').on('data', console.log)
```

If you want the data as JSON, use `require('vbb-lines/data.json')`.


## API

`lines([promised], [pattern])`

If `promised` is `true`, a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) will be returned, resolving with an array of results.

Otherwise, a [stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in [object mode](https://nodejs.org/api/stream.html#stream_object_mode) will be returned, emitting one line at a time.

`pattern` can be one of the following:

- a line ID, like `'15296_700'`
- `'all'`
- an object like `{mode: 'bus', agencyId: '47'}`, with each property being mandatory


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/vbb-lines/issues).
