Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save("d:\SOVR_Development_Holdings_LLC\AntiGravity\val-core\desktop_screenshot.png")
$graphics.Dispose()
$bitmap.Dispose()
Write-Host "Screenshot saved to desktop_screenshot.png"
