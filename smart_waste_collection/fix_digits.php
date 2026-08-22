<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

// 1. Add translations
$addition = '            "South Zone": "المنطقة الجنوبية",
            "North Zone": "المنطقة الشمالية",
            "Tarabunka": "ترابونكا",
            "Abdi": "عبدي",
            "Malik": "مالك",
';
$content = str_replace('"Dashboard": "لوحة القيادة",', "\"Dashboard\": \"لوحة القيادة\",\n" . $addition, $content);

// 2. Add digit replacement to Arabic regex block
$regex_add = "                    newText = newText.replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1584));\n";
// Wait, 0x0660 (1632) - 0x0030 (48) = 1584
$content = str_replace("newText = newText.replace(/^#(\\d+)$/g, 'رقم $1');", "newText = newText.replace(/^#(\\d+)$/g, 'رقم $1');\n" . $regex_add, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added area names, names, and global digit conversion";
