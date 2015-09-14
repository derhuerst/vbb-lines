path =			require 'path'
vbbStatic =		require 'vbb-static'
fs =			require 'fs'





base = path.join __dirname, '../data'



console.log 'Storing the lines, their stations and exceptions in lines.ndjson.'

lines = vbbStatic.lines('all')

lines.on 'data', (data) ->
	console.log data

lines.on 'error', (err) ->
	console.error err.stack

lines.on 'finish', () ->
	console.info 'Done.'
