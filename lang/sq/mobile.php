<?php

return [

    'login' => [
        'title' => 'Mirë se u kthyet',
        'subtitle' => 'Hyni për të menaxhuar terminet tuaja.',
        'email' => 'Email',
        'password' => 'Fjalëkalimi',
        'submit' => 'Hyr',
        'error_generic' => 'Hyrja dështoi. Kontrolloni lidhjen dhe provoni sërish.',
    ],

    'tabs' => [
        'dashboard' => 'Kryesore',
        'calendar' => 'Kalendari',
        'appointments' => 'Terminet',
        'manage' => 'Menaxho',
        'more' => 'Më shumë',
    ],

    'dashboard' => [
        'today' => 'Sot',
        'appointments' => 'Termine',
        'confirmed' => 'Të konfirmuara',
        'cancelled' => 'Të anuluara',
        'revenue' => 'Të ardhura',
        'empty' => 'Asnjë termin për këtë ditë.',
    ],

    'appointments' => [
        'title' => 'Terminet',
        'search' => 'Kërko klientë…',
        'empty' => 'Asnjë termin me këto filtra.',
        'scope_upcoming' => 'Të ardhshme',
        'scope_all' => 'Të gjitha',
        'create' => 'Termin i ri',
    ],

    'sheet' => [
        'date' => 'Data',
        'time' => 'Ora',
        'employee' => 'Punonjësi',
        'phone' => 'Telefoni',
        'email' => 'Email',
        'notes' => 'Shënime',
        'reschedule' => 'Rishkojo',
        'no_slots' => 'S’ka orare të lira këtë ditë.',
        'confirm' => 'Konfirmo terminin',
        'cancel_appointment' => 'Anulo terminin',
        'delete' => 'Fshi',
        'delete_confirm' => 'Kjo e fshin përfundimisht terminin e anuluar. Të vazhdohet?',
        'back' => 'Kthehu',
        'error' => 'Diçka shkoi keq',
    ],

    'create' => [
        'title' => 'Termin i ri',
        'service' => 'Shërbimi',
        'employee' => 'Punonjësi',
        'date' => 'Data',
        'slot' => 'Ora',
        'first_name' => 'Emri',
        'last_name' => 'Mbiemri',
        'phone' => 'Telefoni',
        'email' => 'Email (opsionale)',
        'notes' => 'Shënime (opsionale)',
        'submit' => 'Krijo terminin',
        'pick_service_first' => 'Zgjidhni një shërbim për të parë oraret e lira.',
        'created' => 'Termini u krijua.',
    ],

    'schedule' => [
        'title' => 'Orari im',
        'base_config' => 'Konfigurimi javor',
        'day_active' => 'Punë',
        'day_off' => 'Pushim',
        'from' => 'Nga',
        'to' => 'Deri',
        'breaks' => 'Pushimet',
        'add_break' => 'Shto pushim',
        'save' => 'Ruaj',
        'saved' => 'U ruajt.',
        'booking_url' => 'Linku personal i rezervimit',
    ],

    'calendar' => [
        'title' => 'Kalendari',
        'view_day' => 'Dita',
        'view_week' => 'Java',
        'all_employees' => 'Të gjithë punonjësit',
        'day_off' => 'Ditë pushimi',
        'move_confirm_title' => 'Zhvendos terminin',
        'move_confirm' => 'Ta zhvendos :client në :time?',
    ],

    'manage' => [
        'title' => 'Menaxho',
        'employees' => 'Punonjësit',
        'services' => 'Shërbimet',
        'roles' => 'Rolet',
        'resources' => 'Resurset e përbashkëta',
        'settings' => 'Cilësimet',
        'analytics' => 'Analitika',
    ],

    'employees' => [
        'title' => 'Punonjësit',
        'add' => 'Shto punonjës',
        'name' => 'Emri',
        'email' => 'Email',
        'password' => 'Fjalëkalimi',
        'password_hint' => 'Lëreni bosh për të mbajtur fjalëkalimin aktual.',
        'phone' => 'Telefoni',
        'job_title' => 'Titulli',
        'role' => 'Roli',
        'services' => 'Shërbimet',
        'delete_confirm' => 'Të fshihet ky punonjës?',
        'delete_appointments_too' => 'Fshi edhe terminet e tij',
    ],

    'services' => [
        'title' => 'Shërbimet',
        'add' => 'Shto shërbim',
        'name' => 'Emri',
        'description' => 'Përshkrimi',
        'duration' => 'Kohëzgjatja (min)',
        'price' => 'Çmimi',
        'active' => 'Aktiv',
        'delete_confirm' => 'Të fshihet ky shërbim?',
    ],

    'roles' => [
        'title' => 'Rolet',
        'add' => 'Shto rol',
        'name' => 'Emri',
        'permissions' => 'Lejet',
        'delete_confirm' => 'Të fshihet ky rol?',
    ],

    'resources' => [
        'title' => 'Resurset e përbashkëta',
        'add' => 'Shto resurs',
        'name' => 'Emri',
        'quantity' => 'Sasia',
        'delete_confirm' => 'Të fshihet ky resurs?',
    ],

    'settings' => [
        'title' => 'Cilësimet',
        'business_name' => 'Emri i biznesit',
        'phone' => 'Telefoni',
        'email' => 'Email',
        'location' => 'Vendndodhja',
        'description' => 'Përshkrimi',
        'save' => 'Ruaj cilësimet',
        'saved' => 'Cilësimet u ruajtën.',
        'web_note' => 'Cilësimet e avancuara (logoja, rregullat e rezervimit, WhatsApp) menaxhohen në web.',
    ],

    'analytics' => [
        'title' => 'Analitika',
        'summary' => 'Përmbledhje',
        'total_appointments' => 'Termine',
        'total_revenue' => 'Të ardhura',
        'by_service' => 'Sipas shërbimit',
        'by_employee' => 'Sipas punonjësit',
    ],

    'notifications' => [
        'title' => 'Njoftimet',
        'empty' => 'Asgjë e re.',
        'mark_all' => 'Shëno të gjitha si të lexuara',
        'unread' => 'Të palexuara',
        'all' => 'Të gjitha',
    ],

    'more' => [
        'title' => 'Më shumë',
        'profile' => 'Profili',
        'language' => 'Gjuha',
        'logout' => 'Dil',
        'logout_confirm' => 'Të dilni nga kjo pajisje?',
        'schedule' => 'Orari im',
        'schedule_config' => 'Konfigurimi javor',
        'analytics' => 'Analitika ime',
        'notifications' => 'Njoftimet',
    ],

    'common' => [
        'error' => 'Diçka shkoi keq',
        'retry' => 'Provo sërish',
        'save' => 'Ruaj',
        'cancel' => 'Anulo',
        'delete' => 'Fshi',
        'confirm' => 'Konfirmo',
        'back' => 'Kthehu',
        'loading' => 'Duke u ngarkuar…',
        'offline' => 'Dukeni pa internet.',
    ],

];
