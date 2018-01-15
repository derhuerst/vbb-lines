'use strict'

const test = require('tape')
const sinkStream = require('stream-sink')
const isStream = require('is-stream')
const isPromise = require('is-promise')

const lines = require('.')

test('filterById', (t) => {
	const predicate = lines.filterById(2)
	t.plan(6)
	t.strictEqual(predicate(),          false)
	t.strictEqual(predicate({}),        false)
	t.strictEqual(predicate([2]),       false)
	t.strictEqual(predicate({id:  1 }), false)
	t.strictEqual(predicate({id: '2'}), false)
	t.strictEqual(predicate({id:  2 }), true)
	t.end()
})

test('filterByKeys', (t) => {
	t.test('returns false for invalid data', (t) => {
		const predicate = lines.filterByKeys({a: 'foo'})
		t.plan(3)
		t.strictEqual(predicate(),    false)
		t.strictEqual(predicate([2]), false)
		t.strictEqual(predicate({}),  false)
		t.end()
	})

	t.test('compares strictly', (t) => {
		const predicate = lines.filterByKeys({a: '1'})
		t.plan(2)
		t.strictEqual(predicate({a:  1 }), false)
		t.strictEqual(predicate({a: '1'}), true)
		t.end()
	})

	t.test('compares only *own* properties', (t) => {
		const predicate = lines.filterByKeys({a: 'foo'})
		const x = Object.create({a: 'foo'})
		t.plan(1)
		t.strictEqual(predicate(x), false)
		t.end()
	})

	t.test('compares multiple keys', (t) => {
		const predicate = lines.filterByKeys({a: 'foo', b: 'bar'})
		t.plan(4)
		t.strictEqual(predicate({a:  'bar', b: 'bar'}), false)
		t.strictEqual(predicate({a:  'bar', b: 'foo'}), false)
		t.strictEqual(predicate({a:  'foo', b: 'foo'}), false)
		t.strictEqual(predicate({a:  'foo', b: 'bar'}), true)
		t.end()
	})
})

test('lines', (t) => {
	t.test('without `promised` flag', (t) => {
		t.test('returns a stream', (t) => {
			t.ok(isStream(lines({id: '16943_700'})))
			t.end()
		})

		t.test('filters correctly', (t) => {
			t.plan(2)
			lines({id: '16943_700'})
			.pipe(sinkStream('object'))
			.then((data) => {
				t.strictEqual(data.length, 1)
				t.strictEqual(data[0].id,  '16943_700')
				t.end()
			})
			.catch(t.ifError)
		})

		t.test('filters correctly', (t) => {
			t.plan(2)
			lines('16943_700')
			.pipe(sinkStream('object'))
			.then((data) => {
				t.strictEqual(data.length, 1)
				t.strictEqual(data[0].id,  '16943_700')
				t.end()
			})
			.catch(t.ifError)
		})

		t.test('all lines look valid', (t) => {
			const s = lines('all')
			s.on('error', t.ifError)
			s.on('end', t.end)
			s.on('data', (l) => {
				t.strictEqual(l.type, 'line')
				t.strictEqual(typeof l.id, 'string')
				t.ok(l.id)
				t.strictEqual(typeof l.name, 'string')
				t.ok(l.name)
				t.strictEqual(typeof l.operator, 'string')
				t.ok(l.operator)
				t.strictEqual(typeof l.mode, 'string')
				t.ok(l.mode)
				t.strictEqual(typeof l.product, 'string')
				t.ok(l.product)
				t.ok(Array.isArray(l.variants))
			})
		})
	})

	t.test('with `promised` flag', (t) => {
		t.test('returns a promise', (t) => {
			t.ok(isPromise(lines(true, {id: '16943_700'})))
			t.end()
		})

		t.test('filters correctly', (t) => {
			t.plan(2)
			lines(true, {id: '16943_700'})
			.then((data) => {
				t.strictEqual(data.length, 1)
				t.strictEqual(data[0].id,  '16943_700')
				t.end()
			})
			.catch(t.ifError)
		})

		t.test('filters correctly', (t) => {
			t.plan(2)
			lines(true, '16943_700')
			.then((data) => {
				t.strictEqual(data.length, 1)
				t.strictEqual(data[0].id,  '16943_700')
				t.end()
			})
			.catch(t.ifError)
		})
	})
})
