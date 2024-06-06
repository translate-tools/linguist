#!/bin/sh

# Script to make zip files for all directories from the current directory

startDir=`pwd`
for buildDir in `find . -maxdepth 1 -type d -not -name . -not -name dev -not -name tests -print`;
do
	# Make archive
	cd "$startDir/$buildDir" && zip -r "../$(basename $buildDir).zip" *;
done;
