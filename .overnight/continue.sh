#!/bin/bash
# Keep the overnight loop going until 08:00: wait for the running driver, then start the next batch
# (each batch ends with an Antigravity review that the next batch reads first).
W=/Users/ashan/Documents/Codex/ll-overnight
END=$(( $(date +%s) + ${TOTAL_HOURS:-6} * 3600 ))
cd "$W"
batch=${FIRST_BATCH:-20}
while [ "$(date +%s)" -lt $(( END - 1200 )) ]; do
  echo "$(date '+%F %T') batch $batch starts" >> .overnight/logs/driver.log
  HOURS=$(( (END - $(date +%s)) / 3600 )); [ "$HOURS" -ge 1 ] || break
  # own copy per batch: never edit a script bash is executing; unique artifact dirs per batch
  sed -e "s#\$L/round-\$i#\$L/b$batch-round-\$i#g" -e "s#\$L/test-\$1#\$L/b$batch-test-\$1#g" -e "s#\$L/review#\$L/b$batch-review#g" -e "s#overnight round \$i#overnight batch $batch round \$i#" .overnight/driver.sh > .overnight/logs/driver-b$batch.sh
  MODEL=composer-2.5 ROUNDS=10 HOURS=$HOURS bash .overnight/logs/driver-b$batch.sh || { echo "$(date '+%F %T') batch $batch stopped the loop" >> .overnight/logs/driver.log; break; }
  batch=$((batch + 1))
done
pkill -f "http.server 529[0-9]" 2>/dev/null
echo "$(date '+%F %T') overnight loop finished" >> .overnight/logs/driver.log
