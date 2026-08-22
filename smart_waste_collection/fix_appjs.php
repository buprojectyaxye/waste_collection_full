<?php
$file = 'C:/xampp/htdocs/smart_waste_collection/admin/app.js';
$content = file_get_contents($file);

// 1. Re-add missing dictionary keys
$missing_keys = '            "En Route": "في الطريق",
            "Assign Drivers (Pending)": "تعيين السائقين (قيد الانتظار)",
            "Resident Name": "اسم المقيم",
            "Request Time": "وقت الطلب",
            "Normal": "عادي",
            "Select a driver...": "اختر سائقًا...",
            "Smart Waste Collection Management System © 2026 | Version 1.1": "نظام إدارة جمع النفايات الذكي © 2026 | الإصدار 1.1",
            "Enterprise Edition": "إصدار المؤسسات",
            "System Health Status": "حالة صحة النظام",
            "Database Server": "خادم قاعدة البيانات",
            "Online & Healthy": "متصل وصحي",
            "API Gateway": "بوابة واجهة برمجة التطبيقات",
            "99.9% Uptime": "وقت تشغيل 99.9%",
            "Generate Custom Reports": "إنشاء تقارير مخصصة",
            "Waste Collection Summary": "ملخص جمع النفايات",
            "Financial Revenue Report": "تقرير الإيرادات المالية",
            "Driver Performance Report": "تقرير أداء السائق",
            "Admin Profile": "الملف الشخصي للمسؤول",
            "Personal Information": "المعلومات الشخصية",
            "Upload Photo": "رفع صورة",
            "Allowed formats: JPG, PNG. Max size: 2MB.": "التنسيقات المسموح بها: JPG، PNG. الحد الأقصى: 2 ميجابايت.",
            "Full Name": "الاسم الكامل",
            "Email Address": "عنوان البريد الإلكتروني",
            "Contact IT support to change your email.": "اتصل بدعم تكنولوجيا المعلومات لتغيير بريدك.",
            "Role / Position": "الدور / المنصب",
            "Super Administrator": "مدير متميز",
            "Security & Password": "الأمان وكلمة المرور",
            "It is highly recommended to change your password every 90 days.": "يوصى بشدة بتغيير كلمة المرور الخاصة بك كل 90 يومًا.",
            "Current Password": "كلمة المرور الحالية",
            "Enter current password": "أدخل كلمة المرور الحالية",
            "New Password": "كلمة المرور الجديدة",
            "Create new password": "إنشاء كلمة مرور جديدة",
            "Confirm New Password": "تأكيد كلمة المرور الجديدة",
            "Confirm new password": "تأكيد كلمة المرور الجديدة",
            "Update Password": "تحديث كلمة المرور",
            "Save Profile": "حفظ الملف الشخصي",
            "New passwords do not match": "كلمات المرور الجديدة غير متطابقة",
            "Password updated successfully": "تم تحديث كلمة المرور بنجاح",
            "Profile updated successfully": "تم تحديث الملف الشخصي بنجاح",
';
$content = str_replace('"Edit": "تعديل",', "\"Edit\": \"تعديل\",\n" . $missing_keys, $content);

// 2. Fix the broken regex block for Somali AND Arabic
$broken_somali = <<<'EOD'
                    newText = newText.replace(/^#(\d+)$/g, 'رقم $1');
                    newText = newText.replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1584));


                    newText = newText.replace(/New request #() from resident #()/g, 'طلب جديد # من المقيم #');
                    newText = newText.replace(/Payment of $([0-9.]+) received/g, 'تم استلام دفعة بقيمة $$');
                    newText = newText.replace(/Driver #() assigned to request #()/g, 'تم تعيين السائق # للطلب #');
                    newText = newText.replace(/Admin '([^']+)' logged into dashboard successfully\./g, "سجل المسؤول '' الدخول إلى لوحة القيادة بنجاح.");
                    newText = newText.replace(/Daily waste collection schedule generated automatically\./g, "تم إنشاء جدول جمع النفايات اليومي تلقائيًا.");
EOD;

$broken_arabic = <<<'EOD'
                    newText = newText.replace(/^#(\d+)$/g, 'رقم $1');
                    newText = newText.replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1584));


                    newText = newText.replace(/New request #() from resident #()/g, 'طلب جديد # من المقيم #');
                    newText = newText.replace(/Payment of $([0-9.]+) received/g, 'تم استلام دفعة بقيمة $$');
                    newText = newText.replace(/Driver #() assigned to request #()/g, 'تم تعيين السائق # للطلب #');
                    newText = newText.replace(/Admin '([^']+)' logged into dashboard successfully\./g, "سجل المسؤول '' الدخول إلى لوحة القيادة بنجاح.");
                    newText = newText.replace(/Daily waste collection schedule generated automatically\./g, "تم إنشاء جدول جمع النفايات اليومي تلقائيًا.");
EOD;

$fixed_regex = <<<'EOD'
                    newText = newText.replace(/^#(\d+)$/g, 'رقم $1');
                    
                    newText = newText.replace(/New request #(\d+) from resident #(\d+)/g, 'طلب جديد #$1 من المقيم #$2');
                    newText = newText.replace(/Payment of \$([0-9.]+) received/g, 'تم استلام دفعة بقيمة $$1');
                    newText = newText.replace(/Driver #(\d+) assigned to request #(\d+)/g, 'تم تعيين السائق #$1 للطلب #$2');
                    newText = newText.replace(/Admin '([^']+)' logged into dashboard successfully\./g, "سجل المسؤول '$1' الدخول إلى لوحة القيادة بنجاح.");
                    newText = newText.replace(/Daily waste collection schedule generated automatically\./g, "تم إنشاء جدول جمع النفايات اليومي تلقائيًا.");

                    // Convert digits
                    newText = newText.replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 1584));
EOD;

$content = str_replace($broken_somali, $fixed_regex, $content);

file_put_contents($file, $content);
echo "Fixed keys and regex";
