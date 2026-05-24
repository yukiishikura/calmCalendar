$logPath = "C:\Users\yukii\.gemini\antigravity\brain\7fde6c83-d7a1-4063-994b-b1071616568b\.system_generated\logs\transcript.jsonl"
$lines = [System.IO.File]::ReadAllLines($logPath, [System.Text.Encoding]::UTF8)

Write-Host "Searching steps for app.js writes..."
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line.Contains("app.js") -and $line.Contains("CodeContent") -and $line.Contains("write_to_file")) {
        try {
            $json = ConvertFrom-Json $line
            foreach ($tool in $json.tool_calls) {
                if ($tool.name -eq "write_to_file" -and $tool.args.TargetFile -like "*app.js*") {
                    $snippet = $tool.args.CodeContent.Substring(0, [Math]::Min(120, $tool.args.CodeContent.Length))
                    # Remove line breaks for nice output
                    $snippet = $snippet -replace "`r", "" -replace "`n", " "
                    Write-Host "Step $($json.step_index): $snippet"
                }
            }
        } catch {}
    }
}
