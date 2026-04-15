$file = "c:\Users\syamk\Downloads\Aquagrow\src\pages\tools\SmartFarmHub.tsx"

# Read raw bytes to handle encoding properly
$bytes = [System.IO.File]::ReadAllBytes($file)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Replace all corrupted non-ASCII sequences that start with U+01BD (ǽ) followed by garbage
# These are broken rupee signs, dashes, arrows, etc.
$content = $content -replace [regex]'[^\x00-\x7E\u20B9\u2013\u2014\u2022\u00B7\u2019\u2018\u201C\u201D\u2026\u00B0\u00BD\u00BC\u00BE\u00D7\u00F7\u2192\u2190\u2193\u2191\u2665\u2764\u2714\u2718\u2612\u2610\u2611\u25CF\u25CB\u25A0\u25A1\u2764\uFE0F\u{1F40F}\u{1F4A7}\u{1F4A6}\u{1F30A}\u{1F33F}\u{1F4B0}\u{1F527}\u{1F6D1}\u{2705}\u{274C}\u{26A0}\u{1F44D}\u{1F4CC}\u{1F4DD}\u{1F4B5}\u{1F4B4}\u{1F3AF}\u{1F4CA}\u{1F4C8}\u{1F4C9}\u{1F527}\u{1F4E1}]+', ''

# Now fix specific known corruptions
# Rupee symbol that got garbled
$content = $content -replace '\?s\?', [char]0x20B9  # ₹

# Save back
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Encoding fix complete. Lines with non-ASCII:" (Select-String -Path $file -Pattern '[^\x00-\x7F]' | Measure-Object).Count
