#! /usr/bin/sh

# Script unpack build archives and test extensions

testDir=tests

# At this time linting is disabled due to BUG https://github.com/mozilla/web-ext/issues/2245
# If it will not fixed, we have to replace test tool
# TODO: make this step optional and report about falls to TG/elsewhere by HTTP request with API key
exit 0;

for packageArchive in `find -maxdepth 1 -type f -name '*.zip' -print`;
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
