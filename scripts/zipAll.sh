#! /usr/bin/sh

for buildDir in `find -maxdepth 1 -type d -not -name . -print`;
do
	zip "$(basename $buildDir).zip" "$buildDir"/*;
done;