<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

// 1. Add Vehicle and TRK translations
$addition = '            "Vehicle": "المركبة",
            "VEHICLE": "المركبة",
            "TRK-1": "شاحنة-1",
            "TRK-2": "شاحنة-2",
            "TRK-3": "شاحنة-3",
            "TRK-4": "شاحنة-4",
            "TRK-5": "شاحنة-5",
';
$content = str_replace('"Dashboard": "لوحة القيادة",', "\"Dashboard\": \"لوحة القيادة\",\n" . $addition, $content);

// 2. Add regex for #7 -> رقم 7
// The regex block for Arabic has this line we can use to locate:
// newText = newText.replace(/New request #(\d+) from resident #(\d+)/g, 'طلب جديد #$1 من المقيم #$2');
// Let's insert before it.

$regex_add = "                    newText = newText.replace(/^#(\\d+)$/g, 'رقم $1');\n";
$content = str_replace("let newText = text;", "let newText = text;\n" . $regex_add, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added Vehicle, TRK and Hash regex";
