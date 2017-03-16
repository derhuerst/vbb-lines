sinkStream = require 'stream-sink'
isStream  = require 'is-stream'
isPromise = require 'is-promise'

lines  = require './index.js'



module.exports =

	'filterById': (t) ->
		predicate = lines.filterById 2
		t.expect 6
		t.strictEqual predicate(),          false
		t.strictEqual predicate({}),        false
		t.strictEqual predicate([2]),       false
		t.strictEqual predicate({id:  1 }), false
		t.strictEqual predicate({id: '2'}), false
		t.strictEqual predicate({id:  2 }), true
		t.done()

	'filterByKeys':

		'returns false for invalid data': (t) ->
			predicate = lines.filterByKeys a: 'foo'
			t.expect 3
			t.strictEqual predicate(),    false
			t.strictEqual predicate([2]), false
			t.strictEqual predicate({}),  false
			t.done()

		'compares strictly': (t) ->
			predicate = lines.filterByKeys a: '1'
			t.expect 2
			t.strictEqual predicate({a:  1 }), false
			t.strictEqual predicate({a: '1'}), true
			t.done()

		'compares only *own* properties': (t) ->
			predicate = lines.filterByKeys a: 'foo'
			x = Object.create a: 'foo'
			t.expect 1
			t.strictEqual predicate(x), false
			t.done()

		'compares multiple keys': (t) ->
			predicate = lines.filterByKeys a: 'foo', b: 'bar'
			t.expect 4
			t.strictEqual predicate({a:  'bar', b: 'bar'}), false
			t.strictEqual predicate({a:  'bar', b: 'foo'}), false
			t.strictEqual predicate({a:  'foo', b: 'foo'}), false
			t.strictEqual predicate({a:  'foo', b: 'bar'}), true
			t.done()



	'lines':

		'without `promised` flag':

			'returns a stream': (t) ->
				t.ok isStream lines id: '16943_700'
				t.done()

			'filters correctly': (t) ->
				t.expect 2
				sink = lines(id: '16943_700').pipe sinkStream 'object'
				sink.then (data) ->
					t.strictEqual data.length, 1
					t.strictEqual data[0].id,  '16943_700'
					t.done()

			'filters correctly': (t) ->
				t.expect 2
				sink = lines('16943_700').pipe sinkStream 'object'
				sink.then (data) ->
					t.strictEqual data.length, 1
					t.strictEqual data[0].id,  '16943_700'
					t.done()

		'with `promised` flag':

			'returns a promise': (t) ->
				t.ok isPromise lines true, id: '16943_700'
				t.done()

			'filters correctly': (t) ->
				t.expect 2
				lines(true, id: '16943_700').then (data) ->
					t.strictEqual data.length, 1
					t.strictEqual data[0].id,  '16943_700'
					t.done()

			'filters correctly': (t) ->
				t.expect 2
				lines(true, '16943_700').then (data) ->
					t.strictEqual data.length, 1
					t.strictEqual data[0].id,  '16943_700'
					t.done()
