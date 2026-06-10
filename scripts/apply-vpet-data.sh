#!/usr/bin/env bash

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' is required but not installed. Please install it first."
    exit 1
fi

# Define file paths
MAIN_DB="digimon.db.pretty.json"
VPET_DB="digimon-vpets.db.json"
OUTPUT_DB="digimon-new.db.json"

# Check if input files exist
if [ ! -f "$MAIN_DB" ] || [ ! -f "$VPET_DB" ]; then
    echo "Error: Make sure both '$MAIN_DB' and '$VPET_DB' exist in the current directory."
    exit 1
fi

echo "Merging V-Pet data into Digimon DB..."

jq --slurpfile vpet "$VPET_DB" '
  # 1. Define a helper function to merge devices
  def merge_devices($devices):
    if ($devices | length) == 0 then
      .
    else
      reduce $devices[] as $dev (.;
        (($dev | .[0:1] | ascii_upcase) + ($dev | .[1:])) as $titleDev |

        # Filter .evolvesTo to only include id, name, and url
        (.evolvesTo | map({id, name, url})) as $filteredEvolutions |

        . + {
          ($dev): true,
          "evolvesTo\($titleDev)": $filteredEvolutions
        }
      )
    end;

  # 2. Map out all device matches per Digimon name
  ($vpet[0] | to_entries | reduce .[] as $device ({};
    reduce $device.value[] as $digimon (.;
      ([$digimon.name] | flatten)[] as $name |
      .[$name] += [$device.key]
    )
  )) as $vpetMap |

  # 3. Update the main database by calling the helper function
  .digimons |= map(
    .name as $dName |
    merge_devices($vpetMap[$dName] // [])
  )
' "$MAIN_DB" > "$OUTPUT_DB"

echo "Done! Updated database saved to '$OUTPUT_DB'."