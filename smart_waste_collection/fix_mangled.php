<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

$search1 = "newText = newText.replace(/New request #(\\d+) from resident #(\\d+)/g, '??? ???? #\$1 ?? ?????? #\$2');";
$replace1 = "newText = newText.replace(/New request #(\\d+) from resident #(\\d+)/g, 'طلب جديد #\$1 من المقيم #\$2');";

$search2 = "newText = newText.replace(/Payment of \\\$([0-9.]+) received/g, '?? ?????? ???? ????? \$\$1');";
$replace2 = "newText = newText.replace(/Payment of \\\$([0-9.]+) received/g, 'تم استلام دفعة بقيمة \$\$$1');";

$search3 = "newText = newText.replace(/Driver #(\\d+) assigned to request #(\\d+)/g, '?? ????? ?????? #\$1 ????? #\$2');";
$replace3 = "newText = newText.replace(/Driver #(\\d+) assigned to request #(\\d+)/g, 'تم تعيين السائق #\$1 للطلب #\$2');";

$search4 = "newText = newText.replace(/Admin '([^']+)' logged into dashboard successfully\./g, \"??? ??????? '\$1' ?????? ??? ???? ??????? ?????.\");";
$replace4 = "newText = newText.replace(/Admin '([^']+)' logged into dashboard successfully\./g, \"سجل المسؤول '\$1' الدخول إلى لوحة القيادة بنجاح.\");";

$search5 = "newText = newText.replace(/Daily waste collection schedule generated automatically\./g, \"?? ????? ???? ??? ???????? ?????? ????????.\");";
$replace5 = "newText = newText.replace(/Daily waste collection schedule generated automatically\./g, \"تم إنشاء جدول جمع النفايات اليومي تلقائيًا.\");";

$content = str_replace($search1, $replace1, $content);
$content = str_replace($search2, $replace2, $content);
$content = str_replace($search3, $replace3, $content);
$content = str_replace($search4, $replace4, $content);
$content = str_replace($search5, $replace5, $content);

// In case the ?s were slightly different, let's use regex replace to be safe.
$content = preg_replace("/newText = newText.replace\(\/New request #\(\\\\d\+\) from resident #\(\\\\d\+\)\/g, '.*\?'\);/", $replace1, $content);
$content = preg_replace("/newText = newText.replace\(\/Payment of \\\\\\$\(\[0-9\.\]\+\) received\/g, '.*'\);/", $replace2, $content);
$content = preg_replace("/newText = newText.replace\(\/Driver #\(\\\\d\+\) assigned to request #\(\\\\d\+\)\/g, '.*'\);/", $replace3, $content);
$content = preg_replace("/newText = newText.replace\(\/Admin '\(\[\^'\]\+\)' logged into dashboard successfully\\\\.\/g, \\\".*\\\"\);/", $replace4, $content);
$content = preg_replace("/newText = newText.replace\(\/Daily waste collection schedule generated automatically\\\\.\/g, \\\".*\\\"\);/", $replace5, $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Fixed mangled arabic strings";
