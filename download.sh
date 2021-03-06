#!/bin/sh

set -e

base_url='https://vbb-gtfs.jannisr.de/latest/'
download () {
	curl -L --compressed --etag-compare "$1.etag" --etag-save "$1.etag" $base_url$1 -o $1
}

download 'routes.csv'
download 'trips.csv'
download 'stop_times.csv'

ls -lh *.csv
