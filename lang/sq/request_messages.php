<?php

return [

    'service' => [
        'resource_quantity' => 'Sasia nuk mund të kalojë kapacitetin e burimit.',
        'resource_duplicate' => 'Çdo burim mund të shtohet vetëm një herë.',
        'delete_blocked_future_appointments' => 'Ky shërbim ka ende termine të ardhshëm në pritje ose të konfirmuara. Rivendosi ose anulo ato së pari, pastaj provo përsëri. Deri atëherë, mund ta shënojsh shërbimin si joaktiv që klientët të mos e rezervojnë.',
    ],

    'employee' => [
        'delete_blocked_future_appointments' => 'Ky punonjës ka ende termine të ardhshëm në pritje ose të konfirmuara. Ose fshi të gjitha terminet e tij, ose rivendosi ose anulo ato rezervime së pari. Mund ta çaktivizosh punonjësin derisa orari të jetë i lirë.',
    ],

    'booking' => [
        'client_first_name_regex' => 'Emri mund të përmbajë vetëm shkronja, numra, hapësira dhe shenja të thjeshta interpunkcie.',
        'client_last_name_regex' => 'Mbiemri mund të përmbajë vetëm shkronja, numra, hapësira dhe shenja të thjeshta interpunkcie.',
        'client_phone_regex' => 'Futni një numër telefoni të vlefshëm: opsionalisht + dhe 6–20 shifra.',
        'client_phone_country_code' => 'Numri i telefonit duhet të nisë me kodin e shtetit, p.sh. +383.',
        'client_email_invalid' => 'Ju lutemi futni një adresë email të vlefshme.',
        'client_notes_regex' => 'Shënimet nuk mund të përmbajnë kllapa trekëndëshe ose HTML.',
        'date_past' => 'Data duhet të jetë sot ose më vonë.',
        'date_window' => 'Data është jashtë intervalit të lejuar për rezervim.',
        'start_time_notice' => 'Ky orar nuk është më i disponueshëm ose nuk plotëson kërkesën minimale për paralajmërim.',
        'employee_invalid' => 'Punonjësi i zgjedhur nuk është i disponueshëm për këtë biznes.',
        'services_invalid' => 'Një ose më shumë shërbime të zgjedhura nuk janë të disponueshme për këtë biznes.',
        'services_mismatch' => 'Punonjësi i zgjedhur nuk ofron të gjitha shërbimet e zgjedhura.',
    ],

    'employee_appointment' => [
        'service_change_disabled' => 'Ndryshimi i shërbimit është çaktivizuar nga administratori juaj.',
        'service_invalid_business' => 'Shërbim i pavlefshëm për këtë biznes.',
        'service_not_offered' => 'Ju nuk ofroni këtë shërbim.',
    ],

    'settings' => [
        'slug_unique' => 'Kjo adresë rezervimi përdoret tashmë nga një biznes tjetër i regjistruar.',
    ],

    'schedule' => [
        'end_time_after_start' => 'Ora e mbarimit duhet të jetë pas orës së fillimit.',
        'break_end_after_start' => 'Ora e mbarimit të pushimit duhet të jetë pas orës së fillimit të pushimit.',
        'booking_slug_taken' => 'Kjo adresë rezervimi përdoret tashmë nga një anëtar tjetër i ekipit.',
    ],

    'auth' => [
        'email_not_verified' => 'Ju lutemi, verifikoni emailin përpara se të hyni. Ju kemi dërguar një lidhje të re verifikimi.',
    ],

];
