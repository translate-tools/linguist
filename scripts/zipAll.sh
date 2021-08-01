#! /usr/bin/sh

# Script make zip files for all directories from the current directory

# TODO: exclude dev directories
for buildDir in `find -maxdepth 1 -type d -not -name . -print`;
do
	zip "$(basename $buildDir).zip" "$buildDir"/*;
done;