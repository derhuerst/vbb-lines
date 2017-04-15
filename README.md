# vbb-lines 🚏

A **collection of all lines (and their stations) of the [Berlin Brandenburg public transport service (VBB)](http://www.vbb.de/)**, computed from [open](http://daten.berlin.de/datensaetze/vbb-fahrplandaten-januar-2017-bis-dezember-2017) [GTFS](https://developers.google.com/transit/gtfs/) [data](https://vbb-gtfs.jannisr.de/).

[![npm version](https://img.shields.io/npm/v/vbb-lines.svg)](https://www.npmjs.com/package/vbb-lines)
[![build status](https://img.shields.io/travis/derhuerst/vbb-lines.svg)](https://travis-ci.org/derhuerst/vbb-lines)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/vbb-lines.svg)
[![gitter channel](https://badges.gitter.im/derhuerst/vbb-rest.svg)](https://gitter.im/derhuerst/vbb-rest)


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
lines({type: 'bus'}).on('data', console.log) // filter lines
lines('all').on('data', console.log)
```


## API

`lines([promised], [pattern])`

If `promised` is `true`, a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) will be returned, resolving with an array of results.

Otherwise, a [stream](https://nodejs.org/api/stream.html#stream_class_stream_readable) in [object mode](https://nodejs.org/api/stream.html#stream_object_mode) will be returned, emitting one line at a time.

`pattern` can be one of the following:

- a line ID, like `'15296_700'`
- `'all'`
- an object like `{type: 'bus', agencyId: '47'}`, with each property being mandatory


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/vbb-lines/issues).
