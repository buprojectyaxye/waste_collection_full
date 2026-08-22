<?php
$content = file_get_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js');

// Fix the mangled keys in app.js
$content = str_replace('"... I have submitted a new waste collection request at wabari for"', '"I have submitted a new waste collection request at wabari for..."', $content);
$content = str_replace('".Hello, I need help with my waste collection schedule"', '"Hello, I need help with my waste collection schedule."', $content);
$content = str_replace('".My truck is broken, need a replacement"', '"My truck is broken, need a replacement."', $content);

file_put_contents('C:/xampp/htdocs/smart_waste_collection/admin/app.js', $content);
echo "Fixed dictionary keys";
