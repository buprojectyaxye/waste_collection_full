<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$addition = '            "Search by name, email, or phone...": "...البحث بالاسم أو البريد الإلكتروني أو الهاتف",
            "Active": "نشط",
            "Inactive": "غير نشط",
            "yahye abdi": "يحيى عبدي",
            "hodan": "هودان",
';
$content = str_replace('"Dashboard": "لوحة القيادة",', "\"Dashboard\": \"لوحة القيادة\",\n" . $addition, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added more names and active states";
