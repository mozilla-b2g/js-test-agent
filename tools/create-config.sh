#/usr/bin/env sh

TEST_CONFIG=$1
TEST_DIR=$2
TEST_SUFFIX=$3
BASE_URL=$4

DIR_LEN=(${#TEST_DIR}+1)

rm -f $TEST_CONFIG
touch $TEST_CONFIG


TEST_FILE_ARR=()
TEST_FILE_INDEX=0

echo "Creating config file $TEST_CONFIG\n from $TEST_DIR matching any file with: $TEST_SUFFIX"

echo "{\n  \"test-suffix\": \"$TEST_SUFFIX\",\n  \"tests\": [" >> $TEST_CONFIG;

for FILE in `find $TEST_DIR -name $TEST_SUFFIX -type f`
do
  URL=$BASE_URL/${FILE:$DIR_LEN}

  TEST_FILE_ARR[$APP_ARR_LEN]="\n    \"$URL\""
  APP_ARR_LEN=$(($APP_ARR_LEN+1))
done;

SAVE_IFS=$IFS
IFS=","
echo "${TEST_FILE_ARR[*]}" >> $TEST_CONFIG
IFS=$SAVE_IFS

echo "  ]\n}" >> $TEST_CONFIG;
