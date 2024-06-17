#!/bin/sh

# Script to unpack build archives and test extensions

testDir=tests

# We check only firefox, because web-ext is not stable work with chromium manifest v3,
# it emit `MANIFEST_FIELD_UNSUPPORTED` for `service_worker` and `EXTENSION_ID_REQUIRED`
# See logs example in https://github.com/translate-tools/linguist/actions/runs/9546724264/job/26310185905?pr=465
for packageArchive in `find . -maxdepth 1 -type f -name 'firefox*.zip' -print`;
do
	unpackDir="$testDir/$(basename -s .zip "$packageArchive")"

	# Unpack
	echo "Unpack build \"$packageArchive\" to \"$unpackDir\"";
	mkdir -p "$unpackDir" && unzip -o "$packageArchive" -d "$unpackDir"

	echo;

	# Check builds on errors
	echo "Lint build \"$packageArchive\"";
	npx web-ext lint --source-dir "$unpackDir";
	if [ $? -ne 0 ];
	then
		exit 1;
	fi;

	echo;
done;
