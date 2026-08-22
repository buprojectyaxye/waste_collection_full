<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$additions = '            "EVC Plus": "إي في سي بلس",
            "Credit Card": "بطاقة ائتمان",
            "Bank Transfer": "تحويل بنكي",
            "Cash": "نقدًا",
            "Ahmed Ali": "أحمد علي",
            "Sarah Jones": "سارة جونز",
            "Omar H.": "عمر ح.",
            "Hassan M.": "حسن م.",
            "Fatima Noor": "فاطمة نور",
';

$content = str_replace('"Abdi": "عبدي",', "\"Abdi\": \"عبدي\",\n" . $additions, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added new translations";
