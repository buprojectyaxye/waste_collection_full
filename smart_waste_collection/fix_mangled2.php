<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$content = preg_replace('/newText = newText\.replace\(\/New request #\(\\\\d\+\) from resident #\(\\\\d\+\)\/g, \'.*?\'\);/', "newText = newText.replace(/New request #(\$1) from resident #(\$2)/g, 'طلب جديد #$1 من المقيم #$2');", $content);
$content = preg_replace('/newText = newText\.replace\(\/Payment of \\\\\\$\(\[0-9\.\]\+\) received\/g, \'.*?\'\);/', "newText = newText.replace(/Payment of \\\$([0-9.]+) received/g, 'تم استلام دفعة بقيمة $$1');", $content);
$content = preg_replace('/newText = newText\.replace\(\/Driver #\(\\\\d\+\) assigned to request #\(\\\\d\+\)\/g, \'.*?\'\);/', "newText = newText.replace(/Driver #(\$1) assigned to request #(\$2)/g, 'تم تعيين السائق #$1 للطلب #$2');", $content);
$content = preg_replace('/newText = newText\.replace\(\/Admin \\\'\(\[\^\\\'\]\+\)\\\' logged into dashboard successfully\\\\\.\/g, ".*?"\);/', "newText = newText.replace(/Admin '([^']+)' logged into dashboard successfully\./g, \"سجل المسؤول '\$1' الدخول إلى لوحة القيادة بنجاح.\");", $content);
$content = preg_replace('/newText = newText\.replace\(\/Daily waste collection schedule generated automatically\\\\\.\/g, ".*?"\);/', "newText = newText.replace(/Daily waste collection schedule generated automatically\./g, \"تم إنشاء جدول جمع النفايات اليومي تلقائيًا.\");", $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Done";
