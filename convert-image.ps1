Add-Type -AssemblyName System.Drawing

$imagePath = "public/favicon.jpg"
$outputPath = "public/favicon.png"

$image = [System.Drawing.Image]::FromFile($imagePath)
$bitmap = New-Object System.Drawing.Bitmap $image
$bitmap.MakeTransparent([System.Drawing.Color]::White)
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
$image.Dispose()
