#!/bin/bash
# Extract OSINT books to agent memory

BOOK_DIR="/mnt/storage/data_old/books"
AGENT_MEM="/home/shdwdev/projects/shdwnet.org/agent/memory"

mkdir -p "$AGENT_MEM/books"

echo "📚 Extracting OSINT books to agent memory..."

# OSINT Books from Temp2sort
OSINT_BOOKS=(
    "$BOOK_DIR/Temp2sort/OSINT Techniques - Resources for Uncovering Online Information, 10th Edition.pdf"
    "$BOOK_DIR/Temp2sort/Meredith D. The OSINT Handbook. A practical guide...online information 2024.pdf"
    "$BOOK_DIR/Temp2sort/DeGarmo A. The OSINT Codebook. Cracking Open Source Intelligence Strategies 2023.pdf"
    "$BOOK_DIR/Temp2sort/Khera V. Open Source Intelligence (OSINT) - A practical Introduction...2024.pdf"
    "$BOOK_DIR/Temp2sort/Python for OSINT. 21-day course for beginners 2023.pdf"
    "$BOOK_DIR/Temp2sort/Automating Open Source Intelligence - Algorithms for OSINT.pdf"
    "$BOOK_DIR/Temp2sort/osintbook.pdf"
    "$BOOK_DIR/Hacking&tech/Bhardwaj A. Practical Approach to Open Source Intelligence (OSINT). Vol. 1 2025.pdf"
    "$BOOK_DIR/Hacking&tech/Bhardwaj A. Practical Approach to Open Source Intelligence (OSINT). Vol. 2 2025.pdf"
)

for book in "${OSINT_BOOKS[@]}"; do
    if [ -f "$book" ]; then
        filename=$(basename "$book" .pdf)
        # Clean filename for output
        clean_name=$(echo "$filename" | sed 's/[^a-zA-Z0-9]/_/g' | sed 's/__*/_/g')
        output="$AGENT_MEM/books/${clean_name}.txt"
        
        if [ ! -f "$output" ]; then
            echo "  → Extracting: $filename"
            pdftotext -layout "$book" "$output" 2>/dev/null
            
            # Get word count
            wc=$(wc -w < "$output" 2>/dev/null || echo "0")
            echo "    ✓ Extracted ($wc words)"
        else
            echo "  → Already exists: $clean_name"
        fi
    else
        echo "  ⚠ Not found: $book"
    fi
done

echo ""
echo "📊 Creating index..."

# Create index of extracted books
cat > "$AGENT_MEM/BOOK_INDEX.md" << 'INDEXEOF'
# OSINT Book Index

## Extracted Sources

| File | Source | Focus |
|------|--------|-------|
INDEXEOF

for txt in "$AGENT_MEM/books"/*.txt; do
    if [ -f "$txt" ]; then
        name=$(basename "$txt" .txt)
        words=$(wc -w < "$txt" 2>/dev/null || echo "?")
        echo "| ${name}.txt | OSINT Library | ${words} words |" >> "$AGENT_MEM/BOOK_INDEX.md"
    fi
done

cat >> "$AGENT_MEM/BOOK_INDEX.md" << 'INDEXEOF'

## Usage

When researching OSINT topics, reference these extracted texts.
Use grep/search to find relevant sections:

```bash
grep -ri "social media" memory/books/
grep -ri "api" memory/books/ | head -50
```

## Key Topics by Book

- **OSINT Techniques (Bazzell)**: Comprehensive methodology, search techniques, social media
- **OSINT Handbook (Meredith)**: Practical workflows, tools overview
- **OSINT Codebook (DeGarmo)**: Strategy and planning
- **Python for OSINT**: Automation, scripting, API usage
- **Automating OSINT**: Algorithms, data processing pipelines
INDEXEOF

echo "✅ Extraction complete!"
echo ""
ls -la "$AGENT_MEM/books/" 2>/dev/null | head -20
