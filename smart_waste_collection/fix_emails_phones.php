<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$addition = '            "ali@waste.com": "علي@نفايات.كوم",
            "yahye@waste.com": "يحيى@نفايات.كوم",
            "malik@waste.com": "مالك@نفايات.كوم",
            "+252 614840501": "+٢٥٢ ٦١٤٨٤٠٥٠١",
            "615259394": "٦١٥٢٥٩٣٩٤",
';
$content = str_replace('"Dashboard": "لوحة القيادة",', "\"Dashboard\": \"لوحة القيادة\",\n" . $addition, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added emails and phones";
