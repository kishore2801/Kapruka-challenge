import re

text1 = """
**1. Cake Turning Table**
   ID: `HOME0V23POD0022`
"""
text2 = """
## 1. Cake Turning Table
   ID: `HOME0V23POD0022`
"""
text3 = """
1. **Cake Turning Table**
   ID: `HOME0V23POD0022`
"""
text4 = """
**Cake Turning Table**
ID: `HOME0V23POD0022`
"""

def extract(search_text):
    ids = []
    # Find all chunks separated by ID: `...`
    # Better: find all IDs, and the text immediately preceding them
    # For each ID, we look at the 150 characters before it to find the name
    matches = re.finditer(r'ID:\s*`([^`]+)`', search_text, re.IGNORECASE)
    for m in matches:
        pid = m.group(1)
        start_idx = max(0, m.start() - 150)
        preceding = search_text[start_idx:m.start()]
        # find the last line that looks like a heading or list item
        lines = [line.strip() for line in preceding.split('\n') if line.strip()]
        name = ""
        if lines:
            # take the last non-empty line before the ID
            name_line = lines[-1]
            # clean up markdown
            name = re.sub(r'^(?:##|\*\*|\d+\.|\*|\-)\s*', '', name_line)
            name = re.sub(r'\*\*\s*$', '', name).strip()
        print(f"PID: {pid}, Extracted Name: {name}")

extract(text1)
extract(text2)
extract(text3)
extract(text4)
