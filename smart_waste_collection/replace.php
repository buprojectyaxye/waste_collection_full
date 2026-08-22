<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');
$content = str_replace('toLocaleDateString()', "toLocaleDateString(window.currentLocale || 'en-US')", $content);
$content = str_replace('toLocaleString()', "toLocaleString(window.currentLocale || 'en-US')", $content);
$content = str_replace('toLocaleTimeString([],', "toLocaleTimeString(window.currentLocale || 'en-US',", $content);
$content = str_replace('toLocaleString([],', "toLocaleString(window.currentLocale || 'en-US',", $content);
file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Replaced";
