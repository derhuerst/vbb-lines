#!/bin/sh

set -eu

base_url='https://vbb-gtfs.jannisr.de/latest/'
# todo: use https://gist.github.com/derhuerst/745cf09fe5f3ea2569948dd215bbfe1a ?
download () {
	curl -fsSL --compressed -H 'User-Agent: derhuerst/vbb-lines build' \
		--etag-compare "$1.etag" --etag-save "$1.etag" \
		"$base_url$1" -o "$1"
}

download 'routes.csv'
download 'trips.csv'
download 'stop_times.csv'

ls -lh *.csv
