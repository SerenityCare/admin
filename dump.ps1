$root = 'E:\gentelella'
$out = 'E:\gentelella\gentelella_framework.txt'

Remove-Item $out -ErrorAction SilentlyContinue

$files = Get-ChildItem $root -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\build\\|\\coverage\\|\\\.git\\' -and
    $_.Extension -match '\.(js|ts|jsx|tsx|json|html|htm|css|scss|less|php|py|rb|java|cs|go|rs|cpp|c|h|hpp|xml|yml|yaml|md|txt|env|ini|conf|sh|bat)$' -and
    $_.Name -notmatch '\.min\.(js|css)$|\.map$|package-lock\.json$|yarn\.lock$|pnpm-lock\.yaml$' -and
    $_.Length -lt 1048576
} | Sort-Object FullName

foreach ($f in $files) {
    $relative = $f.FullName.Replace($root, '').TrimStart('\')
    $depth = ($relative -split '\\').Length - 1
    $indent = ('│   ' * $depth)

    Add-Content $out ($indent + '├── ' + $f.Name)
    Add-Content $out ('=' * 60)
    Add-Content $out $f.FullName
    Get-Content $f.FullName -ErrorAction SilentlyContinue | Add-Content $out
    Add-Content $out "`n"
}