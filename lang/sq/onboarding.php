<?php

return [

    'shared' => [
        'head_title' => 'Konfigurimi fillestar',
        'eyebrow' => 'Konfigurimi fillestar',
        'step_label' => 'Hapi :current nga :total',
        'back' => 'Kthehu',
        'continue' => 'Vazhdo',
        'finish' => 'Përfundo konfigurimin',
        'saving' => 'Duke ruajtur…',
        'logout' => 'Dil',
        'helper_required' => 'Mund t’i ndryshoni më vonë te Konfigurimi.',
    ],

    'admin' => [
        'hero_title' => 'Mirë se erdhe! Le ta përgatitim biznesin.',
        'hero_subtitle' => 'Pak hapa të shpejtë për të vendosur rregullat e rezervimeve dhe mënyrën e punës. Këto konfigurime nuk janë të përhershme, mund t’i ndryshoni në çdo kohë nga Konfigurimet.',
        'progress_complete' => 'Konfigurimi përfundoi',

        'step_rules_title' => 'Rregullat e rezervimit',
        'step_rules_sub' => 'Përcaktoni intervalin e orarit, paralajmërimin minimal dhe afatin e planifikimit.',
        'slot_duration_title' => 'Kohëzgjatja e intervalit',
        'slot_duration_help' => 'Intervali minimal ndërmjet orareve të lira (në minuta).',
        'min_notice_title' => 'Paralajmërimi minimal',
        'min_notice_help' => 'Sa minuta përpara terminit duhet të bëhet rezervimi.',
        'booking_window_title' => 'Afati maksimal i planifikimit',
        'booking_window_help' => 'Sa ditë përpara mund të rezervojnë klientët.',
        'unit_min' => 'min',
        'unit_days' => 'ditë',

        'step_client_title' => 'Identifikimi dhe njoftimi i klientit',
        'step_client_sub' => 'Zgjidhni nëse klientët rezervojnë me telefon apo email, sepse kjo përcakton edhe ku u dërgohen njoftimet dhe përditësimet.',
        'client_phone' => 'Telefon',
        'client_phone_desc' => 'Klienti vendos numrin e telefonit gjatë rezervimit.',
        'client_email' => 'Email',
        'client_email_desc' => 'Klienti vendos adresën e e-mailit gjatë rezervimit.',

        'step_automation_title' => 'Automatizimet',
        'step_automation_sub' => 'Vendos nëse rezervimet online konfirmohen vetë dhe nëse klientët marrin kujtesë automatike.',

        'auto_confirm_title' => 'Konfirmim automatik i termineve',
        'auto_confirm_help' => 'Kur është aktiv, rezervimet online konfirmohen menjëherë dhe klienti njoftohet në çast. Kur është joaktiv, terminet e reja mbeten në pritje derisa dikush t’i konfirmojë manualisht.',
        'auto_confirm_label' => 'Konfirmo automatikisht rezervimet online',

        'reminders_title_phone' => 'Kujtesa automatike në WhatsApp',
        'reminders_title_email' => 'Kujtesa automatike me email',
        'reminders_help_phone' => 'Kur është aktiv, klientët me termin të konfirmuar sot marrin automatikisht një kujtesë në WhatsApp në orën që zgjedh. Kanali ndjek identifikimin e klientit që ke zgjedhur, prandaj kalon në email nëse e ndryshon në email.',
        'reminders_help_email' => 'Kur është aktiv, klientët me termin të konfirmuar sot marrin automatikisht një kujtesë me email në orën që zgjedh. Kanali ndjek identifikimin e klientit që ke zgjedhur, prandaj kalon në WhatsApp nëse e ndryshon në telefon.',
        'reminders_label_phone' => 'Dërgo kujtesë në WhatsApp ditën e terminit',
        'reminders_label_email' => 'Dërgo kujtesë me email ditën e terminit',
        'reminder_time_label' => 'Ora e kujtesës',

        'step_operations_title' => 'Preferencat e operimit',
        'step_operations_sub' => 'Disa rregullime të fundit për mënyrën se si do të punoni dhe si do të menaxhoni burimet.',

        'step_staff_title' => 'Jam pjesë e stafit',
        'step_staff_sub' => 'Aktivizojeni nëse ju vetë ofroni shërbime dhe doni të jeni të rezervueshëm.',
        'staff_toggle_label' => 'Më shfaq në faqen e rezervimeve',
        'staff_toggle_help' => 'Mund ta ndryshoni më vonë te Konfigurimi.',

        'step_solo_title' => 'Vetëm një punonjës',
        'step_solo_sub' => 'Aktivizojeni nëse jeni administrator dhe i vetmi që merrni termine. Nuk do të ndërroni pamjen Admin / Punonjës.',
        'solo_toggle_label' => 'Jam i vetmi punonjës dhe administrator',
        'staff_locked_title' => 'Nuk mund të çaktivizohet',
        'staff_locked_body' => 'Kur “vetëm një punonjës” është aktiv, ju mbeteni si staf. Çaktivizojeni atë opsion së pari.',

        'step_service_title' => 'Lejo ndryshimin e shërbimit nga stafi',
        'step_service_sub' => 'Vendosni nëse stafi mund të ndryshojë shërbimin pas rezervimit.',
        'service_edit_label' => 'Lejo stafin të ndryshojë shërbimin e termineve',
        'service_edit_help' => 'Nëse është e çaktivizuar, stafi mund të ndryshojë vetëm datën dhe orën.',

        'step_resources_title' => 'Burime të përbashkëta',
        'step_resources_sub' => 'Aktivizojeni nëse terminet varen nga dhoma, karrige, pajisje ose burime të tjera me kapacitet të kufizuar.',
        'resources_label' => 'Aktivizo menaxhimin e burimeve të përbashkëta',
        'resources_help' => 'Kur është aktiv, mund të krijoni dhoma ose pajisje të përbashkëta, t’i lidhni me shërbimet dhe kalendari e bllokon automatikisht tejkalimin e kapacitetit.',
    ],

    'employee' => [
        'hero_title' => 'Mirë se erdhe në ekip!',
        'hero_subtitle' => 'Le të përgatisim adresën tuaj personale të rezervimit dhe orarin javor standard. Këto konfigurime nuk janë të përhershme, mund t’i ndryshoni në çdo kohë nga Konfigurimet.',
        'progress_complete' => 'Konfigurimi përfundoi',

        'step_url_title' => 'Profili juaj',
        'step_url_sub' => 'Konfirmoni të dhënat tuaja bazë dhe zgjidhni adresën personale me të cilën klientët do t’ju gjejnë.',
        'business_name_label' => 'Biznesi',
        'email_label' => 'Emaili juaj',
        'business_url_label' => 'Adresa e rezervimit të biznesit',
        'personal_url_label' => 'Adresa juaj personale e rezervimit',
        'personal_url_placeholder' => 'emri-juaj',
        'copy_url' => 'Kopjo adresën',

        'step_schedule_title' => 'Orari javor standard',
        'step_schedule_sub' => 'Aktivizoni ditët kur punoni dhe shtoni pushimet. Mund t’i ndryshoni më vonë.',
        'day_off' => 'Ditë pushimi',
        'from' => 'Nga',
        'to' => 'Deri',
        'break' => 'Pushim',
        'add_break' => 'Shto pushim',
        'remove_break' => 'Hiq pushimin',
        'edit_break' => 'Ndrysho pushimin',
        'add_break_title' => 'Shto pushim',
        'edit_break_title' => 'Ndrysho pushimin',
        'start_time' => 'Ora e fillimit',
        'end_time' => 'Ora e mbarimit',
        'cancel' => 'Anulo',
        'save_break' => 'Ruaj pushimin',
        'end_after_start' => 'Ora e mbarimit duhet të jetë pas orës së fillimit.',
        'weekday_0' => 'E hënë',
        'weekday_1' => 'E martë',
        'weekday_2' => 'E mërkurë',
        'weekday_3' => 'E enjte',
        'weekday_4' => 'E premte',
        'weekday_5' => 'E shtunë',
        'weekday_6' => 'E diel',
    ],

];
