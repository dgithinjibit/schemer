import requests
import re
import json

# The KICD portal URL where curriculum designs are listed
KICD_URL = "https://kicd.ac.ke/cbc-curriculum-designs/"

def harvest_drive_ids():
    print(f"Scanning KICD portal: {KICD_URL}")
    try:
        response = requests.get(KICD_URL, timeout=15)
        response.raise_for_status()
        
        # Look for Google Drive preview links in the HTML
        # Pattern: drive.google.com/file/d/ID/preview
        pattern = r'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)/preview'
        ids = re.findall(pattern, response.text)
        
        # Remove duplicates
        unique_ids = list(set(ids))
        print(f"Found {len(unique_ids)} potential curriculum IDs.")
        
        return unique_ids
    except Exception as e:
        print(f"Error harvesting IDs: {e}")
        return []

if __name__ == "__main__":
    # This is a basic harvester. In a real scenario, we would also 
    # parse the text around the link to identify the Grade and Subject.
    found_ids = harvest_drive_ids()
    with open("harvested_ids.json", "w") as f:
        json.dump(found_ids, f, indent=2)
    print("Saved IDs to harvested_ids.json")
