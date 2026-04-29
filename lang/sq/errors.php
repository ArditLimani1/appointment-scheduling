<?php

return [

    'unauthorized' => 'Nuk keni leje për këtë veprim.',

    'booking' => [
        'time_not_available' => 'Ky orar nuk është i lirë.',
        'time_no_longer_available' => 'Ky orar nuk është më i disponueshëm.',
        'shared_resource_unavailable' => 'Një burim i përbashkët i nevojshëm nuk është i lirë në këtë orar.',
    ],

    'shared_resource' => [
        'delete_blocked' => 'Ky burim nuk mund të fshihet sepse është i lidhur me termine të kaluar ose të ardhshëm.',
    ],

    'schedule' => [
        'booking_slug_taken' => 'Kjo adresë rezervimi përdoret tashmë nga një anëtar tjetër i ekipit.',
    ],

    'appointment' => [
        'service_not_found' => 'Shërbimi nuk u gjet.',
        'slot_conflict_employee' => 'Ky interval përputhet me një termin tjetër të këtij punonjësi. Zgjidhni datë ose orë tjetër kur punonjësi është i lirë.',
        'slot_conflict' => 'Ky interval përputhet me një termin tjetër. Zgjidhni datë ose orë tjetër.',
        'cannot_edit_cancelled' => 'Nuk mund të ndryshohet një termin i anuluar.',
        'cannot_reschedule_cancelled' => 'Nuk mund të riplanifikohet një termin i anuluar.',
        'employee_service_not_offered' => 'Ju nuk ofroni këtë shërbim.',
        'outside_hours' => 'Kjo orë është jashtë orarit të punës ose nuk është e disponueshme.',
        'overlaps_break' => 'Kjo orë është jashtë orarit të punës ose përputhet me një pushim.',
    ],

    'booking_flow' => [
        'employee_invalid' => 'Punonjësi i zgjedhur nuk është i disponueshëm për këtë biznes.',
        'select_service' => 'Zgjidhni të paktën një shërbim.',
        'service_invalid' => 'Shërbimi i zgjedhur nuk është i disponueshëm për këtë biznes.',
        'services_mismatch' => 'Punonjësi i zgjedhur nuk i ofron të gjitha shërbimet e zgjedhura.',
    ],

];
