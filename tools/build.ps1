$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$u8 = New-Object Text.UTF8Encoding($false)
function ReadTxt($p) { [IO.File]::ReadAllText((Join-Path $root $p)) }
$site = 'https://mbaka-cmd.github.io/Engineer-Mercy-K.Mbaka/'
$json = ConvertFrom-Json (ReadTxt 'tools\pages.json')
$pages = @(); foreach ($x in $json) { $pages += $x }
$nav = @($pages | Where-Object { $_.nav })

$layout = @"
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
%%BASE%%<title>%%TITLE%%</title>
<meta name="description" content="%%DESC%%"><meta name="author" content="Mercy Mbaka"><meta name="theme-color" content="#351126">
%%ROBOTS%%%%CANON%%<link rel="icon" type="image/svg+xml" href="assets/img/favicon.svg">
<meta property="og:type" content="website"><meta property="og:site_name" content="Mercy Mbaka"><meta property="og:title" content="%%TITLE%%"><meta property="og:description" content="%%DESC%%"><meta property="og:url" content="%%URL%%"><meta property="og:image" content="${site}ginprofile.jpg"><meta name="twitter:card" content="summary_large_image">
%%LD%%<link rel="stylesheet" href="assets/css/site.css">
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" %%SOLID%%>
  <a class="wordmark" href="index.html" aria-label="Mercy Mbaka - home">MERCY MBAKA<span>.</span></a>
  <nav class="topnav" aria-label="Primary"><ul>%%TOPNAV%%</ul></nav>
  <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Open menu"><span>Menu</span><span class="bars" aria-hidden="true"><i></i><i></i></span></button>
</header>
<nav class="menu" id="site-menu" aria-label="Menu" aria-hidden="true">
  <div class="menu__top">
    <span class="wordmark">MERCY MBAKA<span>.</span></span>
    <button class="menu-toggle" id="menu-close" type="button" aria-label="Close menu"><span>Close</span><svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 3l20 20M23 3L3 23"/></svg></button>
  </div>
  <div class="menu__nav"><ol class="menu__list">
%%NAV%%  </ol></div>
  <div class="menu__foot">
    <ul class="menu__social">
      <li><a href="https://github.com/Mbaka-cmd" target="_blank" rel="noopener noreferrer">GitHub</a></li>
      <li><a href="https://www.linkedin.com/in/mercy-mbaka-4b4036354" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      <li><a href="https://wa.me/254748077609" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
      <li><a href="mailto:official.mercymbaka@gmail.com">Email</a></li>
    </ul><span>Kenya</span>
  </div>
</nav>
<div id="page"><main id="main">
%%BODY%%
<footer class="site-footer"><div class="wrap">
  <div><a class="wordmark" href="index.html">MERCY MBAKA<span>.</span></a><p>Founder and software engineer, Kenya.</p><p>Founder of Adalyn Technologies, an operating name rather than a registered company.</p></div>
  <div>
    <ul><li><a href="https://github.com/Mbaka-cmd" target="_blank" rel="noopener noreferrer">GitHub</a></li><li><a href="https://www.linkedin.com/in/mercy-mbaka-4b4036354" target="_blank" rel="noopener noreferrer">LinkedIn</a></li><li><a href="Mercy_Mbaka_CV.pdf" download>CV</a></li><li><a href="Mercy_Mbaka_Resume.pdf" download>Resume</a></li></ul>
    <p>Business software services: <a href="https://adalyntechnologies.co.ke/" target="_blank" rel="noopener noreferrer" style="color:var(--bronze)">adalyntechnologies.co.ke</a></p>
    <p>&copy; 2026 Mercy K. Mbaka</p>
  </div>
</div></footer>
</main></div>
<script src="assets/js/site.js" defer></script>
</body>
</html>
"@

$ld = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Person","name":"Mercy Kathomi Mbaka","jobTitle":"Founder & Software Engineer","url":"' + $site + '","image":"' + $site + 'ginprofile.jpg","email":"official.mercymbaka@gmail.com","address":{"@type":"PostalAddress","addressCountry":"KE"},"sameAs":["https://github.com/Mbaka-cmd","https://www.linkedin.com/in/mercy-mbaka-4b4036354","https://adalyntechnologies.co.ke/"],"knowsAbout":["Python","Django","PostgreSQL","REST APIs","M-Pesa Daraja API"]}</script>' + "`n"

foreach ($p in $pages) {
  $bodyFile = 'src\' + [IO.Path]::GetFileNameWithoutExtension($p.file) + '.body.html'
  if (-not (Test-Path (Join-Path $root $bodyFile))) { Write-Warning "no source for $($p.file) - skipped"; continue }
  $items = ''; $i = 0
  foreach ($n in $nav) {
    $i++; $num = '{0:00}' -f $i; $cur = ''
    if ($n.file -eq $p.file) { $cur = ' aria-current="page"' }
    $items += '    <li style="--i:' + $i + '"><a href="' + $n.file + '"' + $cur + '><small>' + $num + '</small>' + $n.nav + '</a></li>' + "`n"
  }
  $topnav = ''
  foreach ($n in $nav) { $cur2 = ''; if ($n.file -eq $p.file) { $cur2 = ' aria-current="page"' }; $topnav += '<li><a href="' + $n.file + '"' + $cur2 + '>' + $n.nav + '</a></li>' }
  $url = $site + $p.file; if ($p.file -eq 'index.html') { $url = $site }
  $canon = ''; $robots = ''; $base = ''; $ldOut = ''; $solid = 'data-solid'
  if ($p.noindex) { $robots = '<meta name="robots" content="noindex">' + "`n" } else { $canon = '<link rel="canonical" href="' + $url + '">' + "`n" }
  if ($p.base) { $base = '<base href="' + $p.base + '">' + "`n" }
  if ($p.file -eq 'index.html') { $ldOut = $ld; $solid = '' }
  $html = $layout.Replace('%%BASE%%',$base).Replace('%%TITLE%%',$p.title).Replace('%%DESC%%',$p.desc).Replace('%%ROBOTS%%',$robots).Replace('%%CANON%%',$canon).Replace('%%URL%%',$url).Replace('%%LD%%',$ldOut).Replace('%%SOLID%%',$solid).Replace('%%NAV%%',$items).Replace('%%TOPNAV%%',$topnav).Replace('%%BODY%%',(ReadTxt $bodyFile))
  [IO.File]::WriteAllText((Join-Path $root $p.file), $html, $u8)
  Write-Output ("built {0,-14} {1,7} bytes" -f $p.file, $html.Length)
}

# ---- link check (reads only)
$planned = 'about.html','engineering.html','design.html','founder.html','creator.html','services.html','interests.html','chuka-girls.html','idempotency.html'
$missing = @(); $pending = @()
foreach ($p in $pages) {
  $f = Join-Path $root $p.file; if (-not (Test-Path $f)) { continue }
  $t = [IO.File]::ReadAllText($f)
  foreach ($m in [regex]::Matches($t, '(?<![\w-])(?:src|href)="([^"#?:]+)(?:[#?][^"]*)?"')) {
    $x = [uri]::UnescapeDataString($m.Groups[1].Value)
    if ($x -match '^(https?|mailto)') { continue }
    if (Test-Path (Join-Path $root $x)) { continue }
    if ($planned -contains $x) { $pending += "$($p.file) -> $x" } else { $missing += "$($p.file) -> $x" }
  }
}
if ($missing.Count) { Write-Output 'MISSING FILES:'; $missing | Sort-Object -Unique } else { Write-Output 'No missing assets or broken links.' }
if ($pending.Count) { Write-Output 'Links to pages planned for the next steps:'; $pending | Sort-Object -Unique }