<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');
$addition = '            "Yahye Abdi": "يحيى عبدي",
            "abdi": "عبدي",
            "malik": "مالك",
            "ali": "علي",
            "Yahye": "يحيى",
            "wabari": "وابري",
            "wadajir": "وداجر",
            "deyniile": "دينيل",
            "madiino": "مدينة",
            "albaraka": "البركة",
            "Trabunka": "ترابونكا",
';
$content = str_replace('"Dashboard": "لوحة القيادة",', "\"Dashboard\": \"لوحة القيادة\",\n" . $addition, $content);
file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added names";
