# vbb-lines 🚏

A **collection of all lines (and their stations) of the [Berlin Brandenburg public transport service (VBB)](http://www.vbb.de/)**, computed from [open](http://daten.berlin.de/datensaetze/vbb-fahrplandaten-dezember-2016-bis-dezember-2017) [GTFS](https://developers.google.com/transit/gtfs/) [data](https://github.com/derhuerst/vbb-gtfs).

[![npm version](https://img.shields.io/npm/v/vbb-lines.svg)](https://www.npmjs.com/package/vbb-lines)
[![dependency status](https://img.shields.io/david/derhuerst/vbb-lines.svg)](https://david-dm.org/derhuerst/vbb-lines)
[![dev dependency status](https://img.shields.io/david/dev/derhuerst/vbb-lines.svg)](https://david-dm.org/derhuerst/vbb-lines#info=devDependencies)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/vbb-lines.svg)


## Installing

```shell
npm install vbb-lines
```


## Usage

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
