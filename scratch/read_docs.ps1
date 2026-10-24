$docFiles = Get-ChildItem -Path . -Filter "*.doc"
$word = New-Object -ComObject Word.Application
$word.Visible = $false

$out = @()

foreach ($file in $docFiles) {
    $out += "================== FILE: $($file.Name) =================="
    try {
        $doc = $word.Documents.Open($file.FullName)
        $out += $doc.Content.Text
        $doc.Close([ref]$false)
    } catch {
        $out += "Error reading $($file.Name): $_"
    }
}

$word.Quit()
$out | Out-File -FilePath "scratch/doc_contents.txt" -Encoding utf8
Write-Host "Done reading all docs"
