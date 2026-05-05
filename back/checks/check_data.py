import logging
from utils.file_reader import summarize_files

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")

summary = summarize_files("data/raw")

print(f"\nFiles found:   {summary['files']}")
print(f"Total events:  {summary['total_events']:,}")
print("\nBreakdown by event type:")
for event_type, count in summary['by_type'].items():
    pct = round(count * 100 / summary['total_events'], 1)
    print(f"  {event_type:<30} {count:>10,}  ({pct}%)")