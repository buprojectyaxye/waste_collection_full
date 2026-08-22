<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$additions = '            "I have submitted a new waste collection request at wabari for": "لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ",
            "I have submitted a new waste collection request at wabari for...": "لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ...",
            "... I have submitted a new waste collection request at wabari for": "... لقد قدمت طلبًا جديدًا لجمع النفايات في وابري لـ",
            "Hello, I need help with my waste collection schedule": "مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي",
            "Hello, I need help with my waste collection schedule.": "مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي.",
            ".Hello, I need help with my waste collection schedule": ".مرحبًا، أحتاج إلى مساعدة في جدول جمع النفايات الخاص بي",
            "My truck is broken, need a replacement": "شاحنتي معطلة، أحتاج إلى بديل",
            "My truck is broken, need a replacement.": "شاحنتي معطلة، أحتاج إلى بديل.",
            ".My truck is broken, need a replacement": ".شاحنتي معطلة، أحتاج إلى بديل",
';

$content = str_replace('"Abdi": "عبدي",', "\"Abdi\": \"عبدي\",\n" . $additions, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Added all variations of messages to dictionary";
