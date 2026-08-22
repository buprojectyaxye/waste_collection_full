<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$additions = '            "Read": "مقروء",
            "New": "جديد",
            "Reply": "رد",
            "shaqda daqso halako qabto": "إنجاز العمل بسرعة",
            "... I have submitted a new waste collection request at wabari for": "... لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ",
            "wali waxbo la iima qaban": "لم يتم إنجاز أي شيء لي بعد",
            ".Hello, I need help with my waste collection schedule": ".مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي",
            ".My truck is broken, need a replacement": ".شاحنتي معطلة، أحتاج إلى بديل",
';

$content = str_replace('"Abdi": "عبدي",', "\"Abdi\": \"عبدي\",\n" . $additions, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added new translations";
