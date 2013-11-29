cd "$(dirname "$0")"
karma start --single-run
sed -i 's/[0-9]\{13\}//g' report-target/*
diff report-reference/ report-target/
if [ $? -ne 0 ]
then
   echo "Reports doesn't match"
  exit 1
fi